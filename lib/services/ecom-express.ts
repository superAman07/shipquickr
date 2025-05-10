import axios from 'axios';
import { URLSearchParams } from 'url';

const PROD_URLS = {
  fetch_awb: process.env.ECOM_EXPRESS_FETCH_AWB_API_URL || 'https://api.ecomexpress.in/apiv2/fetch_awb/',
  manifest: process.env.ECOM_EXPRESS_MANIFEST_API_URL || 'https://api.ecomexpress.in/apiv2/manifest_awb/',
  track: process.env.ECOM_EXPRESS_TRACKING_API_URL || 'https://plapi.ecomexpress.in/track_me/api/mawbd/',
  cancel: process.env.ECOM_EXPRESS_CANCEL_AWB_API_URL || 'https://api.ecomexpress.in/apiv2/cancel_awb/',
  ndr: process.env.ECOM_EXPRESS_NDR_RESOLUTIONS_API_URL || 'https://api.ecomexpress.in/apiv2/ndr_resolutions/', // Added NDR URL from your env example
  label: process.env.ECOM_EXPRESS_LABEL_API_URL || 'https://shipment.ecomexpress.in/services/expp/shipping_label',
};

interface OrderItem {
    productName: string;
    quantity: number;
    orderValue: number; 
    hsn?: string;       
    category?: string;
}

interface RateResult {
  courierName: string;
  serviceType: string;
  weight: number;
  courierCharges: number;
  codCharges: number;
  totalPrice: number;
}

interface EcomFetchAwbResponseItem {
    success: string;
    awb?: (string | number)[];  
    reason?: string;
    error?: string[];
    reference_id?: number;
}

class EcomExpressClient {
  private username: string;
  private password: string;

  constructor() {
    this.username = process.env.ECOM_EXPRESS_USERNAME || '';
    this.password = process.env.ECOM_EXPRESS_PASSWORD || '';
    if (!this.username || !this.password) {
        console.warn("Ecom Express credentials missing in environment variables for EcomExpressClient!");
    }
  }

  async getEcomExpressOptions(shipmentData: any, cw: number): Promise<RateResult | null> {
    const ecomShipmentPayload = {
      ...shipmentData,
      orginPincode: shipmentData.orginPincode,  
    };
  
    const formData = new URLSearchParams();
    formData.append("username", this.username || "");
    formData.append("password", this.password || "");
    formData.append("json_input", JSON.stringify([ecomShipmentPayload]));
  
    const apiUrl = process.env.ECOM_EXPRESS_RATE_API_URL;
    if (!apiUrl) {
      console.error("Ecom Express Rate API URL is not configured.");
      return null;
    }
  
    try {
      const { data } = await axios.post(apiUrl, formData);
      console.log("Ecom API Response:", JSON.stringify(data, null, 2)); 
  
      if (Array.isArray(data) && data.length > 0 && data[0].success) {
        const breakup = data[0].chargesBreakup || {};
        const rawCourierCharge = (parseFloat(breakup.FRT) || 0) + (parseFloat(breakup.FUEL) || 0);  
        const rawCodCharge = parseFloat(breakup.COD) || 0;
        return {
          courierName: "Ecom Express",
          serviceType: "Standard", 
          weight: cw, 
          courierCharges: rawCourierCharge, 
          codCharges: rawCodCharge,     
          totalPrice: rawCourierCharge + rawCodCharge,  
        };
      } else { 
        console.error("Ecom API returned error or unexpected format:", data[0]?.errors?.reason || data);
        return null;  
      }
    } catch (error: any) { 
      console.error("Ecom API Call Error:", error.response?.data || error.message);
      return null; 
    }
  }

  async fetchAwbNumber(paymentMode: "COD" | "Prepaid"): Promise<string | null> {
    if (!PROD_URLS.fetch_awb || !this.username || !this.password) {
        console.error("EcomExpressClient: Fetch AWB API URL or credentials missing.");
        return null;
    }
    try {
        const formData = new URLSearchParams();
        formData.append("username", this.username);
        formData.append("password", this.password);
        formData.append("count", "1");
        let apiType: string;
        if (paymentMode === "COD") {
            apiType = "COD";  
        } else if (paymentMode === "Prepaid") {
            apiType = "PPD"; 
        } else {
            console.error(`EcomExpressClient: Unsupported payment mode for AWB fetch: ${paymentMode}`);
            return null; 
        }
        formData.append("type", apiType); 

        console.log(`EcomExpressClient: Calling Fetch AWB API URL: ${PROD_URLS.fetch_awb}`);
        console.log("EcomExpressClient: Calling Fetch AWB API with form data:", formData.toString());

        const response = await axios.post<EcomFetchAwbResponseItem>(PROD_URLS.fetch_awb, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log("EcomExpressClient: Fetch AWB API Response:", response.data);

        if (response.data && response.data.success === "yes" && Array.isArray(response.data.awb) && response.data.awb.length > 0) {
            const awbValue = response.data.awb[0];
            return String(awbValue);  
        } else if (response.data && response.data.success === "no") {
            const errorMessage = response.data.reason || (Array.isArray(response.data.error) ? response.data.error.join(', ') : "Unknown API error");
            console.error("EcomExpressClient: Failed to fetch AWB (API error):", errorMessage);
            return null;
        } else {
            console.error("EcomExpressClient: Unexpected response structure from Fetch AWB API:", response.data);
            return null;
        }
    } catch (error: any) {
        console.error("EcomExpressClient: Error calling Fetch AWB API (axios catch):", error.response?.data || error.message);
        return null;
    }
  }


  async createManifest(awbNumber: string, order: any): Promise<boolean> {
    if (!PROD_URLS.manifest || !this.username || !this.password) {
        console.error("EcomExpressClient: Manifest API URL or credentials missing.");
        return false;
    }
    const warehouse = order.warehouse;
    if (!warehouse) {
        console.error("EcomExpressClient: Warehouse details missing for manifest creation.");
        return false;
    }

    const physicalWeight = parseFloat(order.physicalWeight) || 0.5;
    const length = parseFloat(order.length) || 10;
    const breadth = parseFloat(order.breadth) || 10;
    const height = parseFloat(order.height) || 5;
    const volumetricWeight = (length * breadth * height) / 5000;

    
    const declaredValue = order.items.reduce((sum: number, item: any) => sum + (item.orderValue * item.quantity), 0);
    let highValueDetails = {};
    if (declaredValue >= 50000) {
        highValueDetails = {
            "EWAYBILL_NUMBER": "",
            "GST_ERN": "123456789012",
            "ESUGAM_NUMBER": "",
    
            "GST_TAX_CGSTN": "9.0",
            "GST_TAX_SGSTN": "9.0", 
            "GST_TAX_IGSTN": "18.0",
            
            "GST_HSN": "85176290",  
            "GST_TAX_RATE_CGSTN": "9.0",
            "GST_TAX_RATE_SGSTN": "9.0",
            "GST_TAX_RATE_IGSTN": "18.0",
            "GST_TAX_BASE": `${declaredValue}`,
            "GST_TAX_NAME": "GST",
            "GST_TAX_TOTAL": `${declaredValue * 0.18}`, 
        };
    }

    const productDetails: string = order.items.map((item: OrderItem) => 
        `${item.productName} (${item.quantity}x)`).join(', ').substring(0, 200);

    const manifestPayload = [{
            "AWB_NUMBER": awbNumber,
            "ORDER_NUMBER": order.orderId,
            "PRODUCT": order.paymentMode === "COD" ? "COD" : "PPD",
            "CONSIGNEE": order.customerName,
            "CONSIGNEE_ADDRESS1": order.address.substring(0, 50),
            "CONSIGNEE_ADDRESS2": order.landmark || "",
            "CONSIGNEE_ADDRESS3": "",
            "DESTINATION_CITY": order.city,
            "PINCODE": order.pincode,
            "STATE": order.state,
            "MOBILE": order.mobile,
            "TELEPHONE": "",
            "ITEM_DESCRIPTION": productDetails,
            "PIECES": order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0),
            "COLLECTABLE_VALUE": order.paymentMode === "COD" ? (order.codAmount || 0) : 0,
            "DECLARED_VALUE": order.items.reduce((sum: number, item: OrderItem) => sum + (item.orderValue * item.quantity), 0),        "ACTUAL_WEIGHT": physicalWeight,
            "VOLUMETRIC_WEIGHT": volumetricWeight,
            "LENGTH": length,
            "BREADTH": breadth,
            "HEIGHT": height,
            "PICKUP_NAME": warehouse.warehouseName,
            "PICKUP_ADDRESS_LINE1": warehouse.address1,
            "PICKUP_ADDRESS_LINE2": warehouse.address2 || "",
            "PICKUP_PINCODE": warehouse.pincode,
            "PICKUP_PHONE": warehouse.phone || warehouse.mobile,
            "PICKUP_MOBILE": warehouse.mobile,
            "RETURN_NAME": warehouse.warehouseName,
            "RETURN_ADDRESS_LINE1": warehouse.address1,
            "RETURN_ADDRESS_LINE2": warehouse.address2 || "",
            "RETURN_PINCODE": warehouse.pincode,
            "RETURN_PHONE": warehouse.phone || warehouse.mobile,
            "RETURN_MOBILE": warehouse.mobile,
            "DG_SHIPMENT": "false",
            "ADDITIONAL_INFORMATION": {
                "SELLER_GSTIN": warehouse.gstNumber || order.kycDetail?.gstNumber || "29ABCDE1234F1Z5",  // Add a default GST
                "INVOICE_DATE": new Date().toLocaleDateString("en-IN"),
                "INVOICE_NUMBER": `INV-${order.id}`,
                "GST_HSN": declaredValue >= 50000 ? "85176290" : (order.items[0]?.hsn || ""),
                "ITEM_CATEGORY": order.items[0]?.category || "Goods",
                "ESSENTIALPRODUCT": "N",
                "PICKUP_TYPE": "WH",
                "RETURN_TYPE": "WH",
                "CONSIGNEE_ADDRESS_TYPE": "HOME",
                ...highValueDetails
            }
    }];

    try {
        const formData = new URLSearchParams();
        formData.append("username", this.username);
        formData.append("password", this.password);
        formData.append("json_input", JSON.stringify(manifestPayload));

        console.log(`EcomExpressClient: Creating manifest for AWB ${awbNumber}`);
        console.log(`EcomExpressClient: Manifest API URL: ${PROD_URLS.manifest}`);
        console.log(`EcomExpressClient: Manifest Payload: ${JSON.stringify(manifestPayload)}`);

        const response = await axios.post(PROD_URLS.manifest, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log(`EcomExpressClient: Manifest API Response: ${JSON.stringify(response.data)}`);
        
        if (response.data && response.data.success === "yes") {
            console.log(`EcomExpressClient: Manifest creation SUCCESSFUL for AWB ${awbNumber}`);
            return true;
        } else if (response.data && response.data.shipments && response.data.shipments.length > 0) {
            const shipmentError = response.data.shipments[0];
            console.error(`EcomExpressClient: Manifest creation FAILED for AWB ${awbNumber}. Reason: ${shipmentError.reason || "Unknown error"}`);
            return false;
        } else {
            console.error(`EcomExpressClient: Manifest creation FAILED for AWB ${awbNumber}. Reason:`, 
            response.data?.reason || response.data?.message || "Unknown error");
            return false;
        }
    } catch (error: any) {
        console.error("EcomExpressClient: Error calling Manifest API:", error.response?.data || error.message);
        return false;
    }
  }



  async generateShippingLabel(awbNumbers: string[]): Promise<string | null> {
    //    abhi k liye bypass karna pad rha..
    if (process.env.MOCK_ECOM_EXPRESS === 'true') {
        console.log("MOCK MODE: Simulating successful label generation for AWB:", awbNumbers.join(','));
        // Return a sample PDF base64 string or path to a local test PDF 
        return 'data:application/pdf;base64,JVBERi0xL...'; // Sample PDF data
    }

    if (!PROD_URLS.label || !this.username || !this.password) {
        console.error("EcomExpressClient: Label API URL or credentials missing.");
        return null;
    }
    if (!awbNumbers || awbNumbers.length === 0) {
        console.error("EcomExpressClient: No AWB numbers provided for label generation.");
        return null;
    }

    const apiUrl = PROD_URLS.label;
    const formData = new URLSearchParams();
    formData.append("username", this.username);
    formData.append("password", this.password); 
    formData.append("awb", awbNumbers.join(',')); 
    console.log(`EcomExpressClient: Calling Generate Label API URL (POST): ${apiUrl}`);
    console.log(`EcomExpressClient: Calling Generate Label API with form data: ${formData.toString()}`);

    try {
        console.log(`EcomExpressClient: Detailed label request for AWB ${awbNumbers.join(',')}`);
        const fullRequestConfig = {
            url: apiUrl,
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: formData.toString()
        };
        console.log("EcomExpressClient: Full request config:", JSON.stringify(fullRequestConfig));
        
        const response = await axios.post(apiUrl, formData, {
            responseType: 'arraybuffer',  
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
        });

        console.log("EcomExpressClient: Generate Label API Response Headers:", response.headers);
        
        if (response.headers['content-type'] === 'application/pdf' && response.data) {
            console.log("EcomExpressClient: Successfully fetched PDF label data.");
            const pdfBase64 = Buffer.from(response.data).toString('base64');
            return `data:application/pdf;base64,${pdfBase64}`; 
        } 

        let responseDataString = "";
        try {
            responseDataString = Buffer.from(response.data).toString();
            const jsonData = JSON.parse(responseDataString);
            console.error("EcomExpressClient: Received JSON response instead of PDF:", jsonData);
        } catch (e) {
            console.error("EcomExpressClient: Unexpected response content-type or data format from Label API:", response.headers['content-type']);
            console.error("EcomExpressClient: Response Data (raw string):", responseDataString);
        }
        return null;

    } catch (error: any) {
        console.error("EcomExpressClient: Error calling Generate Label API (axios catch block):");
        if (error.response) {
            console.error("  Status:", error.response.status);
            console.error("  Headers:", error.response.headers);
            let errorDataString = error.response.data;
            try {
                if (error.response.data instanceof ArrayBuffer) {
                    errorDataString = Buffer.from(error.response.data).toString();
                } else if (typeof error.response.data === 'object') {
                    errorDataString = JSON.stringify(error.response.data);
                }
            } catch (e) { 
            }
            console.error("  Data:", errorDataString);
        } else if (error.request) {
            console.error("  No response received:", error.request);
        } else {
            console.error("  Error message:", error.message);
        }
        return null;
    }
  }
}

export const ecomExpressClient = new EcomExpressClient();