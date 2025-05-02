import axios from 'axios';
import { URLSearchParams } from 'url';

const PROD_URLS = {
  manifest: 'https://api.ecomexpress.in/apiv2/manifest_awb/',
  track: 'https://plapi.ecomexpress.in/track_me/api/mawbd/',
  cancel: 'https://api.ecomexpress.in/apiv2/cancel_awb/',
  ndr: 'https://api.ecomexpress.in/apiv2/ndr_resolutions/',
  label: 'https://shipment.ecomexpress.in/services/expp/shipping_label', 
};

class EcomExpressClient {
  private username: string;
  private password: string; 

  constructor() {
    this.username = process.env.ECOM_EXPRESS_USERNAME || '';
    this.password = process.env.ECOM_EXPRESS_PASSWORD || ''; 
    console.log(`Credentials Read: User='${this.username}', Pass='${this.password}'`);
    if (!this.username || !this.password) {
        console.warn("Ecom Express credentials missing in environment variables!");
    }
  }

   
  async generateAWB(shipment: any) {
    try { 
      const requestBody = {
        username: this.username,
        password: this.password,
        json_input: shipment // Send the shipment object directly
      };

      console.log("Sending Raw JSON Body:", JSON.stringify(requestBody, null, 2));
      const { data } = await axios.post(
        PROD_URLS.manifest,  
        requestBody,         
        {
          headers: {
            'Content-Type': 'application/json'  
          }
        }
      );
      console.log("API Response (AWB):", data);
      return data;
    } catch (error: any) {
      console.error('Request Data causing error:', JSON.stringify(shipment, null, 2));
      console.error('Ecom Express AWB Generation Error:', error.response?.data || error.message);
      throw error;
    }
  }
 
  async trackShipment(awbNumber: string) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('awb', awbNumber);

      const { data } = await axios.post(
        PROD_URLS.track,  
        formData
      );
      console.log("API Response (Track):", data);
      
      return data;
    } catch (error: any) {
      console.error('Ecom Express Tracking Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getNDRData(awbNumber: string) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('awb', awbNumber);

      const { data } = await axios.post(
        PROD_URLS.ndr,  
        formData
      );
      console.log("API Response (NDR):", data);
      
      return data;
    } catch (error: any) {
      console.error('Ecom Express NDR Error:', error.response?.data || error.message);
      throw error;
    }
  }
   
  async cancelShipment(awbNumber: string) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('awb', awbNumber);

      const { data } = await axios.post(
        PROD_URLS.cancel,  
        formData
      );
      console.log("API Response (Cancel):", data);
      
      return data;
    } catch (error: any) {
      console.error('Ecom Express Cancel Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const ecomExpressClient = new EcomExpressClient();

