import axios from "axios";

interface DelhiveryConfig {
    mode: "Production" | "Staging";
    tokens: {
        express500g: string;
        surface500g: string;
        surface2kg: string;
        surface5kg: string;
    };
}

const config: DelhiveryConfig = {
    mode: (process.env.DELHIVERY_MODE as "Production" | "Staging") || "Production",
    tokens: {
        express500g: process.env.DELHIVERY_TOKEN_EXPRESS_500G || "",
        surface500g: process.env.DELHIVERY_TOKEN_SURFACE_500G || "",
        surface2kg: process.env.DELHIVERY_TOKEN_SURFACE_2KG || "",
        surface5kg: process.env.DELHIVERY_TOKEN_SURFACE_5KG || "",
    },
};

const BASE_URL = config.mode === "Production"
    ? "https://track.delhivery.com"
    : "https://staging-express.delhivery.com";

export class DelhiveryClient {

    /**
     * Selects the correct token based on service type and weight.
     */
    private getToken(serviceType: "Express" | "Surface", weightKg: number): string {
        if (serviceType === "Express") {
            return config.tokens.express500g; // Assuming this token covers all separate express shipments or is the default
        }

        // Surface Logic
        if (weightKg <= 0.5) return config.tokens.surface500g;
        if (weightKg <= 2.0) return config.tokens.surface2kg;
        return config.tokens.surface5kg;
    }

    public async fetchRate(
        pickupPin: string,
        destPin: string,
        weightKg: number,
        mode: "Express" | "Surface",
        paymentMode: "Prepaid" | "COD",
        orderValue: number
    ) {
        const token = this.getToken(mode, weightKg);
        if (!token) return null;
        try {
            const response = await axios.get(`${BASE_URL}/c/api/pin-codes/json/`, {
                headers: { Authorization: `Token ${token}` },
                params: { filter_codes: destPin }
            });
            const deliveryCodes = response.data.delivery_codes;
            if (!deliveryCodes || !Array.isArray(deliveryCodes) || deliveryCodes.length === 0) {
                return null;
            }
            const firstEntry = deliveryCodes[0];
            const serviceData = firstEntry ? Object.values(firstEntry)[0] as any : null;
            if (!serviceData) return null;
            if (serviceData.remark && serviceData.remark.toLowerCase().includes("embargo")) {
                return null;
            }
            const isCod = paymentMode === "COD";
            const canCod = serviceData.cod === "Y" || serviceData.cod === "y";
            const canPrepaid = serviceData.pre_paid === "Y" || serviceData.pre_paid === "y";
            if (isCod && !canCod) return null;
            if (!isCod && !canPrepaid) return null;
            let baseRate = mode === "Express" ? 80 : 40;
            if (weightKg > 0.5) {
                const extraWeight = weightKg - 0.5;
                const slabs = Math.ceil(extraWeight * 2);
                baseRate += slabs * (mode === "Express" ? 50 : 30);
            }
            const codCharge = isCod ? 50 : 0;
            let expectedDelivery = "3-5 Days";
            try {
                const tatResponse = await axios.get(`${BASE_URL}/api/dc/expected_tat`, {
                    headers: { Authorization: `Token ${token}` },
                    params: {
                        origin_pin: pickupPin,
                        destination_pin: destPin,
                        mot: mode === "Express" ? "E" : "S",
                        pdt: "B2C"
                    }
                });
                const responseBody = tatResponse.data;
                let days = null;
                if (responseBody?.data?.tat) {
                    days = responseBody.data.tat;
                }
                else if (responseBody?.tat) {
                    days = responseBody.tat;
                }

                if (days) {
                    expectedDelivery = `${days} Days`;
                }
            } catch (tatError) {
                if (pickupPin.substring(0, 3) === destPin.substring(0, 3)) expectedDelivery = "1-2 Days";
                else if (pickupPin.substring(0, 2) === destPin.substring(0, 2)) expectedDelivery = "2-3 Days";
                else expectedDelivery = mode === "Express" ? "3-4 Days" : "4-6 Days";
            }
            return {
                courierName: `Delhivery ${mode}`,
                serviceType: mode,
                weight: weightKg,
                courierCharges: baseRate,
                codCharges: codCharge,
                totalPrice: baseRate + codCharge,
                courierPartnerId: 999, // Internal ID
                expectedDelivery: expectedDelivery,
                tokenUsed: token,
                image: "https://upload.wikimedia.org/wikipedia/commons/2/23/Delhivery_Logo_(2019).png"
            };
        } catch (error: any) {
            console.error("Delhivery Rate Error Details:", error.response?.data || error.message);
            return null;
        }
    }

    public async createOrder(order: any, mode: "Express" | "Surface" = "Surface") {
        const weightKg = parseFloat(order.physicalWeight) || 0.5;
        const token = this.getToken(mode, weightKg);

        if (!token) {
            console.error("Delhivery CreateOrder: No token found for mode:", mode, "weight:", weightKg);
            return null;
        }
        // 1. Map Payment Mode
        const paymentMode = order.paymentMode === "COD" ? "COD" : "Prepaid";
        const codAmount = paymentMode === "COD" ? order.codAmount : 0;
        // 2. Prepare Payload
        // Note: 'pickup_location.name' must match your Registered Warehouse Name in Delhivery.
        const warehouseName = order.warehouse?.name || "Main Warehouse";

        const dataObject = {
            pickup_location: {
                name: warehouseName,
                add: order.warehouse?.address,
                city: order.warehouse?.city,
                pin_code: order.warehouse?.pincode,
                country: "India",
                phone: order.warehouse?.phone
            },
            shipments: [
                {
                    name: order.customerName,
                    add: order.address,
                    pin: order.pincode,
                    city: order.city,
                    state: order.state,
                    country: "India",
                    phone: order.mobile,
                    order: order.orderId,
                    payment_mode: paymentMode,
                    return_pin: order.warehouse?.pincode,
                    return_city: order.warehouse?.city,
                    return_phone: order.warehouse?.phone,
                    return_add: order.warehouse?.address,
                    return_state: order.warehouse?.state,
                    return_country: "India",
                    products_desc: order.items?.map((i: any) => i.productName).join(", ") || "General",
                    hsn_code: "",
                    cod_amount: codAmount,
                    order_date: new Date().toISOString(),
                    total_amount: order.totalAmount,
                    seller_add: order.warehouse?.address,
                    seller_name: order.warehouse?.name,
                    seller_inv: "",
                    quantity: order.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || "1",
                    waybill: "",
                    shipment_width: order.breadth || "10",
                    shipment_height: order.height || "10",
                    shipment_length: order.length || "10",
                    weight: (weightKg * 1000).toString(),
                    shipping_mode: mode
                }
            ]
        };

        const payload = `format=json&data=${JSON.stringify(dataObject)}`;

        try {
            console.log("Delhivery CreateOrder Payload (String):", payload);

            const response = await axios.post(`${BASE_URL}/api/cmu/create.json`, payload, {
                headers: {
                    Authorization: `Token ${token}`,
                    // "Content-Type": "application/json" // Not needed for raw string/urlencoded
                }
            });
            console.log("Delhivery CreateOrder Response:", JSON.stringify(response.data, null, 2));
            // Response typically contains: { "packages": [ { "waybill": "...", "refnum": "..." } ], "success": true }
            const data = response.data;
            if (data && data.packages && data.packages.length > 0) {
                const pkg = data.packages[0];
                if (pkg.status === "Fail") {
                    console.error("Delhivery Order Creation Failed:", pkg.remarks);
                    return null;
                }
                return {
                    waybill: pkg.waybill,
                    refnum: pkg.refnum,
                    upload_wbn: pkg.upload_wbn // Sometimes present
                };
            }
            return null;
        } catch (error: any) {
            console.error("Delhivery CreateOrder Error:", error.response?.data || error.message);
            return null;
        }
    }
}

export const delhiveryClient = new DelhiveryClient();