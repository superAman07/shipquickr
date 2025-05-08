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
  async generateShippingLabel(awbNumbers: string[]): Promise<string | null> {
    if (!PROD_URLS.label || !this.username || !this.password) {
        console.error("EcomExpressClient: Label API URL or credentials missing.");
        return null;
    }
    if (!awbNumbers || awbNumbers.length === 0) {
        console.error("EcomExpressClient: No AWB numbers provided for label generation.");
        return null;
    }

    const apiUrl = new URL(PROD_URLS.label);
    apiUrl.searchParams.append("username", this.username);
    apiUrl.searchParams.append("password", this.password);
    apiUrl.searchParams.append("awb_numbers", awbNumbers.join(','));
    console.log(`EcomExpressClient: Calling Generate Label API URL: ${apiUrl.toString()}`);

    try {
        const response = await axios.get(apiUrl.toString(), {
            responseType: 'arraybuffer',  
        });

        console.log("EcomExpressClient: Generate Label API Response Headers:", response.headers);
        
        if (response.headers['content-type'] === 'application/pdf' && response.data) {
            console.log("EcomExpressClient: Successfully fetched PDF label data.");
            const pdfBase64 = Buffer.from(response.data).toString('base64');
            return `data:application/pdf;base64,${pdfBase64}`; 
        } 

        console.error("EcomExpressClient: Unexpected response content-type or no data from Label API:", response.headers['content-type']);
        return null;

    } catch (error: any) {
        console.error("EcomExpressClient: Error calling Generate Label API:", error.response?.data ? Buffer.from(error.response.data).toString() : error.message);
        return null;
    }
  }
}

export const ecomExpressClient = new EcomExpressClient();