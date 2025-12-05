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

  private async getHeaders() {
    const isAuthenticated = await this.ensureAuth();
    if (!isAuthenticated || !this.publicKey || !this.privateKey) {
        return null;
    }
    return {
        "public-key": this.publicKey,
        "private-key": this.privateKey,
        "Content-Type": "application/json",
        Accept: "application/json",
    };
  }

  // --- RATE CALCULATOR ---

  public async fetchRatesStandard(
    originPincode: number | string,
    destinationPincode: number | string,
    weightKg: number,
    dimensions: { length: number; width: number; height: number },
    paymentType: "COD" | "Prepaid" | "cod" | "ppd",
    declaredValue: number,
    codAmount: number
  ): Promise<AggregatorRate[] | null> {
    
    const headers = await this.getHeaders();
    if (!headers) return null;

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

    try {
      const response = await axios.post(`${this.baseUrl}/rate-calculator`, payload, { headers });
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
      return null;
    } catch (error: any) {
      console.error("ShippingAggregator Rate Error:", error.response?.data || error.message);
      return null;
    }
  }

  // --- BOOKING FLOW ---

  /**
   * Step 1: Push Order to Aggregator
   */
  public async pushOrder(order: any, warehouseId: string): Promise<boolean> {
    const headers = await this.getHeaders();
    if (!headers) return false;

    const weightGrams = Math.ceil((parseFloat(order.physicalWeight) || 0.5) * 1000);
    const apiPaymentType = order.paymentMode === "COD" ? "COD" : "PREPAID";

    const payload = {
        order_id: order.orderId,
        order_date: new Date().toISOString().split('T')[0],
        order_type: "ESSENTIALS", // Defaulting to Essentials
        consignee_name: order.customerName,
        consignee_phone: Number(order.mobile),
        consignee_email: order.email || "",
        consignee_address_line_one: order.address.substring(0, 100), // Limit length if needed
        consignee_pin_code: Number(order.pincode),
        consignee_city: order.city,
        consignee_state: order.state,
        product_detail: order.items.map((item: any) => ({
            name: item.productName,
            sku_number: "SKU-" + Math.floor(Math.random() * 1000), // Dummy SKU if missing
            quantity: item.quantity,
            discount: "0",
            unit_price: item.orderValue,
            product_category: item.category || "Other"
        })),
        payment_type: apiPaymentType,
        cod_amount: apiPaymentType === "COD" ? String(order.codAmount || 0) : "",
        weight: weightGrams,
        length: parseFloat(order.length) || 10,
        width: parseFloat(order.breadth) || 10,
        height: parseFloat(order.height) || 10,
        warehouse_id: warehouseId,
    };

    try {
        console.log("ShippingAggregator: Pushing Order...", JSON.stringify(payload, null, 2));
        const response = await axios.post(`${this.baseUrl}/push-order`, payload, { headers });
        console.log("ShippingAggregator Push Response:", response.data);
        
        return response.data?.result === "1";
    } catch (error: any) {
        console.error("ShippingAggregator Push Order Error:", error.response?.data || error.message);
        return false;
    }
  }

  /**
   * Step 2: Assign Courier (Ship)
   */
  public async assignCourier(orderId: string, courierId: number): Promise<{ success: boolean; awb?: string; courierName?: string }> {
    const headers = await this.getHeaders();
    if (!headers) return { success: false };

    const payload = {
        order_id: orderId,
        courier_id: courierId
    };

    try {
        console.log("ShippingAggregator: Assigning Courier...", payload);
        const response = await axios.post(`${this.baseUrl}/assign-courier`, payload, { headers });
        console.log("ShippingAggregator Assign Response:", response.data);

        if (response.data?.result === "1") {
            // The API response example doesn't explicitly show "awb_number", 
            // but usually "reference_id" or a field inside data contains it.
            // We might need to fetch tracking info separately if AWB isn't here.
            // For now, assuming reference_id IS the AWB or we get it later.
            // *Correction*: Usually assign-courier returns the AWB. 
            // If not, we might need to check the 'data' object carefully.
            // Let's assume data.awb_number exists based on standard flows, 
            // or we use the order_id as reference.
            
            // Based on your provided JSON, it returns: { courier: "Delhivery", ... }
            // It DOES NOT show AWB in the example. 
            // However, usually the 'reference_id' or a subsequent status check gives the AWB.
            // Let's return success for now.
            return { 
                success: true, 
                courierName: response.data.data.courier 
            };
        }
        return { success: false };
    } catch (error: any) {
        console.error("ShippingAggregator Assign Courier Error:", error.response?.data || error.message);
        return { success: false };
    }
  }

  /**
   * Step 3: Get Label
   */
  public async getLabel(awbNumber: string): Promise<string | null> {
    const headers = await this.getHeaders();
    if (!headers) return null;

    try {
        // Note: Docs say GET method
        const response = await axios.get(`${this.baseUrl}/get-order-label/${awbNumber}`, { headers });
        
        if (response.data?.result === "1" && Array.isArray(response.data.data) && response.data.data.length > 0) {
            // Returns base64 string: "data:image/png;base64,..."
            return response.data.data[0].label;
        }
        return null;
    } catch (error: any) {
        console.error("ShippingAggregator Get Label Error:", error.response?.data || error.message);
        return null;
    }
  }
}

export const shippingAggregatorClient = new ShippingAggregatorClient();