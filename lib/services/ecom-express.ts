import axios from 'axios';
import { URLSearchParams } from 'url';

class EcomExpressClient {
  private username: string;
  private password: string;
  private baseUrl: string;

  constructor() {
    this.username = process.env.ECOM_EXPRESS_USERNAME || '';
    this.password = process.env.ECOM_EXPRESS_PASSWORD || '';
    this.baseUrl = 'https://clbeta.ecomexpress.in'; // Staging base URL
  }

  /**
   * Generate AWB/Waybill using Forward Manifest API
   */
  async generateAWB(shipment: any) {
    try {
      console.log("Using credentials:", {
        username: this.username ? "present" : "missing",
        password: this.password ? "present" : "missing", 
        baseUrl: this.baseUrl
      });

      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);

      console.log("FormData created:", formData.toString());

      
      // Format the shipment data according to Ecom Express requirements
      const manifestData = {
        pickup_location: {
          name: shipment.pickupLocation,
          pin: shipment.pickupPincode,
          address: shipment.pickupAddress,
          phone: shipment.pickupPhone,
          city: shipment.pickupCity,
          state: shipment.pickupState,
        },
        shipments: [
          {
            item_name: shipment.productName,
            order_id: shipment.orderId,
            payment_mode: shipment.paymentMode === 'COD' ? 'COD' : 'PPD',
            customer: {
              name: shipment.customerName,
              address: shipment.address,
              pin: shipment.destinationPincode,
              phone: shipment.mobile,
              city: shipment.city,
              state: shipment.state,
            },
            dimensions: {
              length: parseFloat(shipment.length) || 10,
              breadth: parseFloat(shipment.breadth) || 10,
              height: parseFloat(shipment.height) || 10,
              weight: parseFloat(shipment.physicalWeight) || 0.5,
            },
            cod_amount: shipment.paymentMode === 'COD' ? parseFloat(shipment.orderValue) : 0,
          }
        ]
      };
      
      formData.append('json_input', JSON.stringify(manifestData));

      const { data } = await axios.post(
        `${this.baseUrl}/apiv2/manifest_awb/`,
        formData
      );
      console.log("API Response:", data);
      
      return data;
    } catch (error: any) {
      console.error('Ecom Express AWB Generation Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Track shipment status
   */
  async trackShipment(awbNumber: string) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('awb', awbNumber);

      const { data } = await axios.post(
        `${this.baseUrl}/track_me/api/mawbd/`,
        formData
      );
      
      return data;
    } catch (error: any) {
      console.error('Ecom Express Tracking Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get NDR (Non-Delivery Report) data
   */
  async getNDRData(awbNumber: string) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('awb', awbNumber);

      const { data } = await axios.post(
        `${this.baseUrl}/apiv2/ndr_resolutions/`,
        formData
      );
      
      return data;
    } catch (error: any) {
      console.error('Ecom Express NDR Error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Cancel a shipment
   */
  async cancelShipment(awbNumber: string) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('awb', awbNumber);

      const { data } = await axios.post(
        `${this.baseUrl}/apiv2/cancel_awb/`,
        formData
      );
      
      return data;
    } catch (error: any) {
      console.error('Ecom Express Cancel Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const ecomExpressClient = new EcomExpressClient();

