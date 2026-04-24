import axios from "axios";
import ekartManualRates from "@/lib/data/ekart-rates.json";

export interface EkartAuthResponse {
    access_token: string;
    scope: string;
    expires_in: number;
    token_type: string;
}

interface CommonShipmentDataType {
    originPincode: string | number;
    destinationPincode: string | number;
    productType: "cod" | "ppd";
    codAmount: number;
    declaredValue: number;
}

export class EkartClient {
    private clientId: string;
    private username: string;
    private password: string;
    private baseUrl = "https://app.elite.ekartlogistics.in";
    private authApiUrl: string;

    private currentToken: string | null = null;
    private tokenExpiryTime: number | null = null;

    constructor() {
        this.clientId = process.env.EKART_CLIENT_ID || "EKART_69d8a1acedb831bd3d6e6bb6";
        this.username = process.env.EKART_USERNAME || "";
        this.password = process.env.EKART_PASSWORD || "";
        this.authApiUrl = `${this.baseUrl}/integrations/v2/auth/token/${this.clientId}`;
    }

    async getAccessToken(): Promise<string | null> {
        if (this.currentToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime - 300000) {
            return this.currentToken;
        }
        try {
            if (!this.username || !this.password) return null;
            const payload = { username: this.username, password: this.password };
            const response = await axios.post<EkartAuthResponse>(this.authApiUrl, payload, {
                headers: { "Content-Type": "application/json" }
            });
            if (response.data && response.data.access_token) {
                this.currentToken = response.data.access_token;
                this.tokenExpiryTime = Date.now() + (response.data.expires_in * 1000);
                return this.currentToken;
            }
            return null;
        } catch (error: any) {
            console.error("EKart Authentication Error:", error.response?.data || error.message);
            return null;
        }
    }

    // ---- 1. SERVICEABILITY ----
    async checkServiceability(pincode: string | number) {
        const token = await this.getAccessToken();
        if (!token) return null;

        try {
            const response = await axios.get(`${this.baseUrl}/api/v2/serviceability/${pincode}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("EKart Serviceability Error:", error);
            return null;
        }
    }

    // ---- 2. RATE FINDER (API + MANUAL FALLBACK) ----
    async getEkartOptions(shipmentData: CommonShipmentDataType, cw: number, dimensions: { l: number; w: number; h: number }): Promise<any | null> {
        const token = await this.getAccessToken();
        if (token) {
            // Use Live API Estimation
            try {
                const payload = {
                    pickupPincode: parseInt(String(shipmentData.originPincode)),
                    dropPincode: parseInt(String(shipmentData.destinationPincode)),
                    invoiceAmount: shipmentData.declaredValue,
                    weight: Math.ceil(cw * 1000), // Ekart needs grams here
                    length: dimensions.l || 10,
                    height: dimensions.h || 10,
                    width: dimensions.w || 10,
                    serviceType: "SURFACE",
                    codAmount: shipmentData.productType === "cod" ? shipmentData.codAmount : 0,
                    packages: [{
                        length: dimensions.l || 10,
                        height: dimensions.h || 10,
                        width: dimensions.w || 10,
                        count: "1"
                    }]
                };

                const response = await axios.post(`${this.baseUrl}/data/pricing/estimate`, payload, {
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
                });

                if (response.data && response.data.total) {
                    return {
                        courierName: "EKart",
                        serviceType: response.data.type || "Standard",
                        weight: cw,
                        courierCharges: parseFloat(response.data.shippingCharge || 0),
                        codCharges: parseFloat(response.data.codCharge || 0),
                        totalPrice: parseFloat(response.data.total),
                        expectedDelivery: "3-5 Days",
                        courierPartnerId: 996
                    };
                }
            } catch (err: any) {
                console.error("EKart Direct Pricing Error, falling back to manual map:", err.response?.data || err.message);
            }
        }

        // Manual Fallback if API fails or auth fails
        const zone = String(shipmentData.originPincode).substring(0, 2) === String(shipmentData.destinationPincode).substring(0, 2) ? "local" : "roi";
        let rawFreight = cw <= 0.5 ? 42.0 : 115.0; // Minimal Simplified fallback
        const codCharge = shipmentData.productType === "cod" ? Math.max(35, (shipmentData.codAmount * 0.015)) : 0;

        return {
            courierName: "EKart",
            serviceType: "Standard",
            weight: cw,
            courierCharges: parseFloat(rawFreight.toFixed(2)),
            codCharges: parseFloat(codCharge.toFixed(2)),
            totalPrice: parseFloat((rawFreight + codCharge).toFixed(2)),
            expectedDelivery: "3-5 Days",
            courierPartnerId: 996
        };
    }

    // ---- 3. CREATE SHIPMENT (AWB GENERATION) ----
    async createShipment(order: any, gstNumber?: string | null): Promise<{ awbNumber: string; vendor: string } | { error: string }> {
        const token = await this.getAccessToken();
        if (!token) return { error: "Failed to authenticate with EKart Logistics" };

        const weightGrams = Math.ceil((order.physicalWeight || 1) * 1000);
        const orderValue = order.items.reduce((acc: number, item: any) => acc + (item.orderValue * item.quantity), 0) || 50;
        const paymentMode = order.paymentMode === "COD" ? "COD" : "Prepaid";
        const userPhone = order.mobile || "9999999999";
        const warehousePhone = order.warehouse?.mobile || "9999999999";

        const payload = {
            seller_name: order.warehouse?.warehouseName?.substring(0, 50) || "Seller",
            seller_address: order.warehouse?.address1?.substring(0, 100) || "Warehouse Address",
            seller_gst_tin: gstNumber || "00000000000000",
            seller_gst_amount: 0,
            consignee_gst_amount: 0,
            integrated_gst_amount: 0,
            ewbn: "",
            order_number: order.orderId,
            invoice_number: `INV-${order.orderId}`,
            invoice_date: new Date().toISOString().split('T')[0],
            document_number: "",
            document_date: "",
            consignee_gst_tin: "",
            consignee_name: order.fullName?.substring(0, 50) || "Customer",
            consignee_alternate_phone: userPhone,
            products_desc: order.items[0]?.productName?.substring(0, 30) || "General Goods",
            payment_mode: paymentMode,
            category_of_goods: "Default",
            hsn_code: "",
            total_amount: orderValue,
            tax_value: 0,
            taxable_amount: orderValue,
            commodity_value: String(orderValue),
            cod_amount: paymentMode === "COD" ? orderValue : 0,
            quantity: order.items.reduce((acc: number, item: any) => acc + item.quantity, 0) || 1,
            weight: weightGrams,
            length: 10,
            height: 10,
            width: 10,
            return_reason: "",
            drop_location: {
                location_type: "Home",
                address: order.address?.substring(0, 100),
                city: order.city,
                state: order.state,
                country: "India",
                name: order.fullName?.substring(0, 50) || "Customer",
                phone: parseInt(userPhone.replace(/\D/g, '').substring(0, 10)) || 9999999999,
                pin: parseInt(order.pincode) || 0
            },
            pickup_location: order.warehouse?.warehouseName || "Office",
            return_location: order.warehouse?.warehouseName || "Office",
            delayed_dispatch: false,
            obd_shipment: false,
            mps: false
        };

        try {
            const response = await axios.put(`${this.baseUrl}/api/v1/package/create`, payload, {
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
            });
            if (response.data && response.data.status === true) {
                return {
                    awbNumber: response.data.tracking_id,
                    vendor: response.data.vendor
                };
            }
            return { error: response.data?.remark || "Failed to create Ekart shipment" };
        } catch (error: any) {
            console.error("EKart Shipment Error Detailed:", error.response?.data || error.message);
            return { error: error.response?.data?.remark || "API request to Ekart rejected" };
        }
    }

    // ---- 4. CANCEL SHIPMENT ----
    async cancelShipment(awbNumber: string): Promise<{ success: boolean; message: string }> {
        const token = await this.getAccessToken();
        if (!token) return { success: false, message: "Authentication failed" };

        try {
            const payload = { data: [{ tracking_id: awbNumber }] };
            const response = await axios.delete(`${this.baseUrl}/api/v1/package/cancel`, {
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                data: payload
            });

            const resData = response.data?.data?.[0];
            if (resData && resData.status === true) {
                return { success: true, message: resData.remark || "Order Cancelled" };
            }
            return { success: false, message: resData?.remark || "Cancellation Failed" };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.remark || "API error while cancelling" };
        }
    }

    // ---- 5. GENERATE LABEL ----
    async generateLabel(awbNumber: string): Promise<string | null> {
        const token = await this.getAccessToken();
        if (!token) return null;

        try {
            // Important to set json_only=true as per docs if we want to parse it as JSON
            const response = await axios.post(`${this.baseUrl}/api/v1/package/label?json_only=false`, {
                ids: [awbNumber]
            }, {
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                responseType: 'arraybuffer' // Assuming false returns raw PDF Buffer as typically done via EKart
            });

            // We can convert PDF buffer to base64 for storing, or return null if complex S3 uploads are managed globally
            if (response.data) {
                const base64Pdf = Buffer.from(response.data, 'binary').toString('base64');
                return `data:application/pdf;base64,${base64Pdf}`;
            }
            return null;
        } catch (err) {
            console.error("EKart Label Generation Failed:", err);
            return null;
        }
    }

    // ---- 6. TRACK SHIPMENT ----
    async trackShipment(awbNumber: string): Promise<any> {
        const token = await this.getAccessToken();
        if (!token) return null;

        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/track/${awbNumber}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            return response.data;
        } catch (err) {
            console.error("EKart Tracking Failed:", err);
            return null;
        }
    }

    // ---- 7. MANIFEST ----
    async createManifest(awbNumbers: string[]): Promise<boolean> {
        const token = await this.getAccessToken();
        if (!token) return false;

        try {
            const response = await axios.post(`${this.baseUrl}/data/v2/generate/manifest`, {
                ids: awbNumbers
            }, {
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
            });

            return !!(response.data && response.data.manifestDownloadUrl);
        } catch (error) {
            console.error("EKart Manifest Generation Failed:", error);
            return false;
        }
    }

    // ---- 8. ADDRESS REGISTRATION (WAREHOUSE) ----
    /**
     * Registers a warehouse/pickup location with EKart.
     * Based on the provided Address API: POST /api/v2/address
     */
    async registerWarehouse(warehouse: any): Promise<{ success: boolean; message: string; alias?: string }> {
        const token = await this.getAccessToken();
        if (!token) return { success: false, message: "EKart Authentication failed" };

        try {
            const payload = {
                alias: warehouse.warehouseName, // The "alias" is the key identifier in shipment creation
                phone: parseInt(warehouse.mobile.replace(/\D/g, '').substring(0, 10)) || 9999999999,
                address_line1: warehouse.address1.substring(0, 100),
                address_line2: warehouse.address2 ? warehouse.address2.substring(0, 100) : "",
                pincode: parseInt(warehouse.pincode),
                city: warehouse.city,
                state: warehouse.state,
                country: "India",
                geo: {
                    lat: 0,
                    lon: 0
                }
            };

            const response = await axios.post(`${this.baseUrl}/api/v2/address`, payload, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.data && response.data.status === true) {
                return {
                    success: true,
                    message: response.data.remark || "Warehouse registered successfully",
                    alias: response.data.alias
                };
            }
            return {
                success: false,
                message: response.data.remark || "Registration rejected by EKart"
            };
        } catch (error: any) {
            console.error("EKart Address Registration Error:", error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.remark || "API request to EKart address failed"
            };
        }
    }
}

export const ekartClient = new EkartClient();