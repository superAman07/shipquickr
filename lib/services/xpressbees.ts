import axios from "axios";

interface RateResult {
    courierName: string;
    serviceType?: string;
    weight: number;
    courierCharges: number;
    codCharges: number;
    totalPrice: number;
}

interface ShipmentData {
    originPincode: string | number;
    destinationPincode: string | number;
    productType: "cod" | "ppd";
    codAmount: number;
    declaredValue: number;
}

interface Dimensions {
    l: number;
    w: number;
    h: number;
}

class XpressbeesClient {
    private currentToken: string | null = null;
    private tokenExpiry: number | null = null;
    private readonly TOKEN_BUFFER_SECONDS = 300;  

    constructor() {}

    private async getValidXpressbeesToken(): Promise<string | null> {
        const now = Date.now();
        if (this.currentToken && this.tokenExpiry && (this.tokenExpiry - this.TOKEN_BUFFER_SECONDS * 1000) > now) {
            return this.currentToken;
        }
        return await this.getNewXpressbeesToken();
    }

    private async getNewXpressbeesToken(): Promise<string | null> {
        const loginUrl = process.env.XPRESSBEES_LOGIN_API_URL;
        const email = process.env.XPRESSBEES_EMAIL;
        const password = process.env.XPRESSBEES_PASSWORD;

        if (!loginUrl || !email || !password) {
            console.error("XpressbeesClient: Xpressbees login credentials or URL are not configured.");
            return null;
        }
        try {
            const response = await axios.post(loginUrl, { email, password });
            if (response.data && response.data.status === true && response.data.data) {
                this.tokenExpiry = Date.now() + (60 * 60 * 1000);  
                this.currentToken = response.data.data;
                return this.currentToken;
            } else {
                console.error("XpressbeesClient: Failed to fetch new token. Response:", response.data);
                this.tokenExpiry = null;
                this.currentToken = null;
                return null;
            }
        } catch (error: any) {
            console.error("XpressbeesClient: Error fetching new token:", error.response?.data || error.message);
            this.tokenExpiry = null;
            this.currentToken = null;
            return null;
        }
    }
    public async getCourierList(): Promise<any[] | null> {
    const token = await this.getValidXpressbeesToken();
    if (!token) {
        console.error("XpressbeesClient: Cannot get courier list without a valid token.");
        return null;
    }

    const apiUrl = process.env.XPRESSBEES_COURIER_API_URL;
    if (!apiUrl) {
        console.error("XpressbeesClient: XPRESSBEES_COURIER_API_URL is not defined in .env.");
        return null;
    }

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        console.log("XpressbeesClient: Courier List API Response:", response.data);

        if (response.data && response.data.status === true && Array.isArray(response.data.data)) {
            return response.data.data;
        } else {
            console.error("XpressbeesClient: Failed to fetch courier list:", response.data?.message || "Unknown error");
            return null;
        }
    } catch (error: any) {
        console.error("XpressbeesClient: Error fetching courier list:", error.response?.data || error.message);
        return null;
    }
}

    async getXpressbeesOptions(shipmentData: ShipmentData, cw: number, dimensions: Dimensions): Promise<RateResult[] | null> {
        const apiUrl = process.env.XPRESSBEES_RATE_API_URL; 
        const token = await this.getValidXpressbeesToken();

        if (!apiUrl) {
            console.error("Xpressbees API URL or Bearer Token is not configured.");
            return null;
        }
        if (!token) {
            console.error("XpressbeesClient: Failed to get a valid token for Xpressbees.");
            return null;
        }
        const xpressbeesPayload = {
            order_type_user: "ecom",
            origin: String(shipmentData.originPincode), 
            destination: String(shipmentData.destinationPincode), 
            weight: String(cw), 
            length: String(dimensions.l),
            height: String(dimensions.h),
            breadth: String(dimensions.w), 
            cod_amount: String(Math.max(shipmentData.declaredValue, 1)), 
            cod: shipmentData.productType === "cod" ? "yes" : "no",
            product_value: String(shipmentData.declaredValue)
        };

        try {
            console.log("Xpressbees Request Payload:", xpressbeesPayload);
            const { data } = await axios.post(apiUrl, xpressbeesPayload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log("Xpressbees API Response:", data);
        
            if (data && data.status === true && Array.isArray(data.message)) {
                const validRates = data.message
                    .map((rate: any) => {
                        const courierCharges = parseFloat(rate.courier_charges);
                        const codCharges = parseFloat(rate.cod_charges); 
                        const calculatedTotal = (isNaN(courierCharges) ? 0 : courierCharges) + (isNaN(codCharges) ? 0 : codCharges);
        
                        if (!isNaN(courierCharges)) {
                            return {
                                courierName: "Xpressbees",
                                serviceType: rate.name || "Standard",  
                                weight: cw,
                                courierCharges: courierCharges,  
                                codCharges: isNaN(codCharges) ? 0 : codCharges,  
                                totalPrice: calculatedTotal  
                            };
                        }
                        return null;  
                    })
                    .filter((rate: RateResult | null): rate is RateResult => rate !== null);  

                return validRates.length > 0 ? validRates : null;
            } else {
                console.error("XpressbeesClient: API returned unexpected format or status false:", data?.message || data);
                if (data?.message === "Token has expired" || data?.message?.toLowerCase().includes("token")) {
                    this.currentToken = null; 
                    this.tokenExpiry = null;  
                }
                return null;
            }
        } catch (error: any) {
            console.error("Xpressbees API Call Error:", error.response?.data || error.message);
            if (error.response?.status === 401) {
                this.currentToken = null;
                this.tokenExpiry = null;
            }
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

        let courierId = "01"; // Default fallback
    try {
        const courierList = await this.getCourierList();
        if (courierList && courierList.length > 0) {
            // Find the courier that matches the selected service type
            const matchedCourier = courierList.find(c => 
                c.name?.toLowerCase().includes((selectedServiceType || '').toLowerCase())
            );
            if (matchedCourier) {
                courierId = matchedCourier.id;
                console.log(`XpressbeesClient: Found courier id ${courierId} for service type ${selectedServiceType}`);
            } else {
                console.log(`XpressbeesClient: No courier found for service type ${selectedServiceType}, using default courier`);
            }
        }
    } catch (error) {
        console.error("XpressbeesClient: Error finding courier id:", error);
    }

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
            courier_id: courierId,
            pickup_location: "customer", 
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