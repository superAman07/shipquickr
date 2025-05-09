import axios from "axios";


class XpressbeesClient {
    private currentToken: string | null = null;
    private tokenExpiry: number | null = null;
    private readonly TOKEN_BUFFER_SECONDS = 300;  

    constructor() {}

    private async getValidXpressbeesToken(): Promise<string | null> {
        const now = Date.now();
        if (this.currentToken && this.tokenExpiry && (this.tokenExpiry - this.TOKEN_BUFFER_SECONDS * 1000) > now) {
            console.log("XpressbeesClient: Using existing valid Xpressbees token.");
            return this.currentToken;
        }

        console.log("XpressbeesClient: Fetching new Xpressbees token...");
        const loginUrl = process.env.XPRESSBEES_LOGIN_API_URL;
        const email = process.env.XPRESSBEES_EMAIL;
        const password = process.env.XPRESSBEES_PASSWORD;

        if (!loginUrl || !email || !password) {
            console.error("XpressbeesClient: Xpressbees login credentials or URL are not configured in .env.");
            return null;
        }

        try {
            const response = await axios.post(loginUrl, {
                email: email,
                password: password,
            });

            if (response.data && response.data.status === true && response.data.data) {
                this.currentToken = response.data.data;
                this.tokenExpiry = Date.now() + 60 * 60 * 1000; 
                console.log("XpressbeesClient: Successfully fetched new Xpressbees token:", this.currentToken);
                return this.currentToken;
            } else {
                console.error("XpressbeesClient: Failed to fetch Xpressbees token:", response.data?.message || "Unknown error during token fetch");
                this.currentToken = null;
                this.tokenExpiry = null;
                return null;
            }
        } catch (error: any) {
            console.error("XpressbeesClient: Error fetching new Xpressbees token:", error.response?.data || error.message);
            this.currentToken = null;
            this.tokenExpiry = null;
            return null;
        }
    }

    public async generateAwb(order: any, selectedServiceType: string | undefined, consigneeGstNumber?: string | null): Promise<string | null> {
        const token = await this.getValidXpressbeesToken();
        if (!token) {
            console.error("XpressbeesClient: Cannot generate AWB without a valid token.");
            return null;
        }

        if (!order.warehouse) {
            console.error("XpressbeesClient: Warehouse details are missing in the order object for AWB generation.");
            return null;
        }
        const consignerWarehouse = order.warehouse;

        const getXpressbeesCourierId = (serviceType?: string): string => {
            const normalized = (serviceType || '').trim().toLowerCase();
            if (normalized === 'b2c air') return '01';
            if (normalized === 'b2c surface') return '02';
            console.warn(`XpressbeesClient: Unknown or missing Xpressbees service type: '${serviceType}'. Defaulting to '01'. Confirm with Xpressbees.`);
            return '01';  
        };
        const xpressbeesCourierId = getXpressbeesCourierId(selectedServiceType);
        console.log("XpressbeesClient: Mapped courier_id:", xpressbeesCourierId, "for serviceType:", selectedServiceType);

        const payload = {
            id: `ORD-${order.id}`,  
            unique_order_number: "yes", 
            payment_method: order.paymentMode === "COD" ? "COD" : "prepaid",
            consigner_name: consignerWarehouse.warehouseName || "ShipQuickr Default",
            consigner_phone: consignerWarehouse.mobile || "0000000000",
            consigner_pincode: consignerWarehouse.pincode,
            consigner_city: consignerWarehouse.city,
            consigner_state: consignerWarehouse.state,
            consigner_address: `${consignerWarehouse.address1}${consignerWarehouse.address2 ? ' ' + consignerWarehouse.address2 : ''}`,
            consigner_gst_number: consignerWarehouse.gstNumber || "",

            consignee_name: order.customerName,
            consignee_phone: order.mobile,
            consignee_pincode: order.pincode,
            consignee_city: order.city,
            consignee_state: order.state,
            consignee_address: order.address,
            consignee_gst_number: consigneeGstNumber || "",
            products: order.items.map((item: any) => ({
                product_name: item.productName,
                product_qty: item.quantity.toString(),
                product_price: item.orderValue.toString(),
                product_tax_per: "",  
                product_sku: item.sku || `SKU-${item.id}`,  
                product_hsn: item.hsn || "",  
            })),
            invoice: [
                {
                    invoice_number: `INV-${order.id}`,
                    invoice_date: new Date().toISOString().split("T")[0],
                    ebill_number: `EBILL-${order.id}`,  
                    ebill_expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                },
            ],
            weight: order.physicalWeight.toString(),  
            breadth: order.breadth.toString(),
            length: order.length.toString(),
            height: order.height.toString(),
            courier_id: xpressbeesCourierId,
            pickup_location: "franchise", 
            shipping_charges: "40",  
            cod_charges: order.paymentMode === "COD" ? "25" : "0",  
            discount: "0",  
            order_amount: order.items.reduce((sum: number, item: any) => sum + item.quantity * item.orderValue, 0).toString(),
            collectable_amount: order.paymentMode === "COD" ? order.codAmount.toString() : "0",
        };

        console.log("XpressbeesClient: Xpressbees AWB Payload:", JSON.stringify(payload, null, 2));

        try {
            const apiUrl = process.env.XPRESSBEES_CREATE_SHIPMENT_API_URL;
            if (!apiUrl) {
                console.error("XpressbeesClient: XPRESSBEES_CREATE_SHIPMENT_API_URL is not defined in .env.");
                return null;
            }
            const response = await axios.post(apiUrl, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            console.log("XpressbeesClient: Xpressbees AWB API Response:", response.data);

            if (response.data && response.data.response === true && response.data.awb_number) {
                return response.data.awb_number;
            } else {
                console.error("XpressbeesClient: Failed to fetch AWB from Xpressbees:", response.data?.message || "Unknown error from Xpressbees API");
                return null;
            }
        } catch (error: any) {
            console.error("XpressbeesClient: Error in Xpressbees AWB generation API call:", error.response?.data || error.message);
            return null;
        }
    }
}

export const xpressbeesClient = new XpressbeesClient();