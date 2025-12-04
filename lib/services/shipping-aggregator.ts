import axios from "axios";

interface AggregatorConfig {
  baseUrl: string;
  email?: string;
  password?: string;
}

export interface AggregatorRate {
  courierName: string;
  serviceType: string;
  weight: number;
  courierCharges: number;
  codCharges: number;
  totalPrice: number;
  courierPartnerId: number;
  expectedDelivery: string;
  image?: string;
}

class ShippingAggregatorClient {
  private baseUrl: string;
  private email: string;
  private password: string;
  
  private publicKey: string | null = null;
  private privateKey: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.baseUrl = process.env.SHIPPING_AGGREGATOR_API_URL || "https://shipping-api.com/app/api/v1";
    this.email = process.env.SHIPPING_AGGREGATOR_EMAIL || "";
    this.password = process.env.SHIPPING_AGGREGATOR_PASSWORD || "";
  }

  private async ensureAuth(): Promise<boolean> {
    if (this.publicKey && this.privateKey && this.tokenExpiry && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return true;
    }

    console.log("ShippingAggregator: Logging in...");
    try {
      const response = await axios.post(`${this.baseUrl}/login`, {
        username: this.email,
        password: this.password,
      });

      const data = response.data;
      if (data && data.result === "1" && Array.isArray(data.data) && data.data.length > 0) {
        const keys = data.data[0];
        this.publicKey = keys.public_key;
        this.privateKey = keys.private_key;
        this.tokenExpiry = Date.now() + 3600 * 1000; 
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("ShippingAggregator Login Error:", error.response?.data || error.message);
      return false;
    }
  }

  private async getRatesRaw(payload: any): Promise<AggregatorRate[] | null> {
    const isAuthenticated = await this.ensureAuth();
    
    if (!isAuthenticated || !this.publicKey || !this.privateKey) {
        console.error("ShippingAggregator: Could not authenticate.");
        return null;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/rate-calculator`, payload, {
        headers: {
          "public-key": this.publicKey,
          "private-key": this.privateKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      
      const data = response.data;
      
      if (data && data.result === "1" && Array.isArray(data.data)) {
        return data.data.map((rate: any) => ({
            courierName: rate.name,
            serviceType: "Standard",
            weight: parseFloat(rate.minimum_chargeable_weight) || 0.5,
            courierCharges: rate.shipping_charges,
            codCharges: rate.overhead_charges,
            totalPrice: rate.total_charges,
            courierPartnerId: rate.id,
            expectedDelivery: rate.estimated_delivery,
            image: rate.image
        }));
      }
      
      console.error("ShippingAggregator: Rate fetch failed or empty.", data);
      return null;
    } catch (error: any) {
      console.error("ShippingAggregator Rate Error:", error.response?.data || error.message);
      return null;
    }
  }

  public async fetchRatesStandard(
    originPincode: number | string,
    destinationPincode: number | string,
    weightKg: number,
    dimensions: { length: number; width: number; height: number },
    paymentType: "COD" | "Prepaid" | "cod" | "ppd",
    declaredValue: number,
    codAmount: number
  ): Promise<AggregatorRate[] | null> {
  
    const apiPaymentType = (paymentType === "Prepaid" || paymentType === "ppd") ? "PREPAID" : "COD";
    
    const weightGrams = Math.ceil(weightKg * 1000);

    const payload = {
        pickup_pincode: Number(originPincode),
        delivery_pincode: Number(destinationPincode),
        weight: weightGrams,
        payment_type: apiPaymentType,
        shipment_type: "FORWARD",
        order_amount: declaredValue,
        cod_amount: apiPaymentType === "COD" ? String(codAmount) : "0",
        type_of_package: "SPS", 
        rov_type: "ROV_OWNER",  
        dimensions: [{
            no_of_box: "1",
            length: String(dimensions.length),
            width: String(dimensions.width),
            height: String(dimensions.height)
        }]
    };
    return this.getRatesRaw(payload);
  }
}

export const shippingAggregatorClient = new ShippingAggregatorClient();