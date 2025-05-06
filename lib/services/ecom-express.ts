 import axios from 'axios';
import { URLSearchParams } from 'url';

const PROD_URLS = {
  fetch_awb: process.env.ECOM_EXPRESS_FETCH_AWB_API_URL || 'https://api.ecomexpress.in/apiv2/fetch_awb/', // Added Fetch AWB URL
  manifest: process.env.ECOM_EXPRESS_MANIFEST_API_URL || 'https://api.ecomexpress.in/apiv2/manifest_awb/',
  track: process.env.ECOM_EXPRESS_TRACKING_API_URL || 'https://plapi.ecomexpress.in/track_me/api/mawbd/',
  cancel: process.env.ECOM_EXPRESS_CANCEL_AWB_API_URL || 'https://api.ecomexpress.in/apiv2/cancel_awb/',
  ndr: 'https://api.ecomexpress.in/apiv2/ndr_resolutions/',  
  label: process.env.ECOM_EXPRESS_LABEL_API_URL || 'https://shipment.ecomexpress.in/services/expp/shipping_label',
};

interface EcomFetchAwbResponseItem {
    AWB?: string; 
    success: string; 
    reason?: string;
    
}

interface EcomManifestShipmentDetails {
    AWB_NUMBER: string;
    ORDER_NUMBER: string;
    PRODUCT: string;
    CONSIGNEE: string;
    CONSIGNEE_ADDRESS1: string;
    CONSIGNEE_ADDRESS2: string;
    CONSIGNEE_ADDRESS3: string;
    DESTINATION_CITY: string;
    PINCODE: string;
    STATE: string;
    MOBILE: string;
    TELEPHONE: string;
    ITEM_DESCRIPTION: string;
    PIECES: number;
    COLLECTABLE_VALUE: number;
    DECLARED_VALUE: number;
    ACTUAL_WEIGHT: number;
    VOLUMETRIC_WEIGHT: number;
    LENGTH: number;
    BREADTH: number;
    HEIGHT: number;
    PICKUP_NAME: string;
    PICKUP_ADDRESS_LINE1: string;
    PICKUP_ADDRESS_LINE2: string;
    PICKUP_PINCODE: string;
    PICKUP_PHONE: string;
    PICKUP_MOBILE: string;
    RETURN_NAME: string;
    RETURN_ADDRESS_LINE1: string;
    RETURN_ADDRESS_LINE2: string;
    RETURN_PINCODE: string;
    RETURN_PHONE: string;
    RETURN_MOBILE: string;
    DG_SHIPMENT: string;
    ADDITIONAL_INFORMATION: {
        GST_TAX_CGSTN:string;
        GST_TAX_IGSTN:string;
        GST_TAX_SGSTN:string;
        SELLER_GSTIN: string;
        INVOICE_DATE: string;
        INVOICE_NUMBER: string;
        GST_TAX_RATE_SGSTN:string;
        GST_TAX_RATE_IGSTN:string;
        GST_TAX_RATE_CGSTN:string;
        GST_HSN: string;
        GST_TAX_BASE:string;
        GST_ERN:string;
        ESUGAM_NUMBER:string;
        ITEM_CATEGORY: string;
        GST_TAX_NAME:string;
        ESSENTIALPRODUCT: string;
        PICKUP_TYPE: string;
        OTP_REQUIRED_FOR_DELIVERY: string;
        RETURN_TYPE: string;
        GST_TAX_TOTAL:string;
        SELLER_TIN:string;
        CONSIGNEE_ADDRESS_TYPE: string;
        CONSIGNEE_LONG: string;
        CONSIGNEE_LAT: string;
        what3words: string;
    };
}

interface EcomManifestResponseShipment {
    reason: string;
    order_number: string;
    awb: string;  
    success: boolean;
}

interface EcomManifestApiResponse {
    shipments: EcomManifestResponseShipment[];
}

class EcomExpressClient {
  private username: string;
  private password: string;

  constructor() {
    this.username = process.env.ECOM_EXPRESS_USERNAME || '';
    this.password = process.env.ECOM_EXPRESS_PASSWORD || '';
    if (!this.username || !this.password) {
        console.warn("Ecom Express credentials missing in environment variables!");
    }
  }

  async fetchAwbNumber(): Promise<string | null> {
    if (!PROD_URLS.fetch_awb || !this.username || !this.password) {
        console.error("Ecom Express Fetch AWB API URL or credentials missing.");
        return null;
    }
    try {
        const formData = new URLSearchParams();
        formData.append("username", this.username);
        formData.append("password", this.password);
        formData.append("count", "1");  
        formData.append("type", "PPD");
 
        console.log("Calling Ecom Express Fetch AWB API...");
        const response = await axios.post<EcomFetchAwbResponseItem[]>(PROD_URLS.fetch_awb, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log("Ecom Express Fetch AWB API Response:", response.data);
 
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const firstAwbData = response.data[0];
            if (firstAwbData.success === "true" && firstAwbData.AWB) { 
                return firstAwbData.AWB;
            } else {
                console.error("Failed to fetch AWB from Ecom Express:", firstAwbData.reason || response.data);
                return null;
            }
        }
        console.error("Unexpected response structure from Ecom Express Fetch AWB API:", response.data);
        return null;
    } catch (error: any) {
        console.error("Error calling Ecom Express Fetch AWB API:", error.response?.data || error.message);
        return null;
    }
  }

  
  async manifestShipment(shipmentDetails: EcomManifestShipmentDetails): Promise<EcomManifestApiResponse | null> {
    if (!PROD_URLS.manifest || !this.username || !this.password) {
        console.error("Ecom Express Manifest API URL or credentials missing.");
        return null;
    }
    try {
        const formData = new URLSearchParams();
        formData.append("username", this.username);
        formData.append("password", this.password);
        formData.append("json_input", JSON.stringify([shipmentDetails])); // API array expect karti hai

        console.log(`Calling Ecom Express Manifest API with AWB: ${shipmentDetails.AWB_NUMBER}`);
        const response = await axios.post<EcomManifestApiResponse>(PROD_URLS.manifest, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log("Ecom Express Manifest API Response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("Error calling Ecom Express Manifest API:", error.response?.data || error.message);
        return null;  
    }
  }

  async trackShipment(awbNumber: string) {
    if (!PROD_URLS.track || !this.username || !this.password) return null;
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('awb', awbNumber);
      const { data } = await axios.post(PROD_URLS.track, formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
      console.log("API Response (Track):", data);
      return data;
    } catch (error: any) {
      console.error('Ecom Express Tracking Error:', error.response?.data || error.message);
      return null; 
    }
  }

  async getNDRData(awbNumber: string) { 
    if (!PROD_URLS.ndr || !this.username || !this.password) return null;
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('awb', awbNumber);
      const { data } = await axios.post(PROD_URLS.ndr, formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
      console.log("API Response (NDR):", data);
      return data;
    } catch (error: any) {
      console.error('Ecom Express NDR Error:', error.response?.data || error.message);
      return null;  
    }
  }

  async cancelShipment(awbNumber: string) {
    if (!PROD_URLS.cancel || !this.username || !this.password) return null;
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('awb', awbNumber);
      const { data } = await axios.post(PROD_URLS.cancel, formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
      console.log("API Response (Cancel):", data);
      return data;
    } catch (error: any) {
      console.error('Ecom Express Cancel Error:', error.response?.data || error.message);
      return null;  
    }
  }
}

export const ecomExpressClient = new EcomExpressClient();