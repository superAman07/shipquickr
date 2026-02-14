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

    /**
     * Checks serviceability. 
     * NOTE: Delhivery API generally returns availability, NOT price. 
     * You likely need a "Rate Card" logic here to calculate cost if the API doesn't return `total_amount`.
     */
    /**
     * Checks serviceability.
     * API: /c/api/pin-codes/json/
     * Returns: Serviceability + Calculated Rate (Placeholder Logic)
     */
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

            console.log("Delhivery Rate Raw Response:", JSON.stringify(response.data, null, 2));

            const deliveryCodes = response.data.delivery_codes;

            // Logic: Empty list = NSZ (Non-Serviceable Zone)
            if (!deliveryCodes || !Array.isArray(deliveryCodes) || deliveryCodes.length === 0) {
                return null;
            }
            const firstEntry = deliveryCodes[0];

            const serviceData = firstEntry ? Object.values(firstEntry)[0] as any : null;

            if (!serviceData) return null;

            // Check for Embargo (Temporary NSZ)
            // "In the response, remark as 'Embargo' indicates temporary NSZ"
            if (serviceData.remark && serviceData.remark.toLowerCase().includes("embargo")) {
                return null;
            }

            // Check Payment Mode Availability
            // Usually fields are "cod": "Y" / "N" and "pre_paid": "Y" / "N"
            const isCod = paymentMode === "COD";
            const canCod = serviceData.cod === "Y" || serviceData.cod === "y";
            const canPrepaid = serviceData.pre_paid === "Y" || serviceData.pre_paid === "y";

            if (isCod && !canCod) return null;
            if (!isCod && !canPrepaid) return null;

            // --- PRICE CALCULATION (PLACEHOLDER) ---
            // TODO: Replace this with actual Rate Card logic via Excel/DB lookup
            let baseRate = mode === "Express" ? 80 : 40;
            if (weightKg > 0.5) {
                const extraWeight = weightKg - 0.5;
                const slabs = Math.ceil(extraWeight * 2); // 500g slabs
                baseRate += slabs * (mode === "Express" ? 50 : 30);
            }

            const codCharge = isCod ? 50 : 0; // Standard industry COD charge

            return {
                courierName: `Delhivery ${mode}`,
                serviceType: mode,
                weight: weightKg,
                courierCharges: baseRate,
                codCharges: codCharge,
                totalPrice: baseRate + codCharge,
                courierPartnerId: 999, // Internal ID
                expectedDelivery: "3-5 Days",
                tokenUsed: token,
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Delhivery_Logo.svg/2560px-Delhivery_Logo.svg.png" // Add logo for UI
            };

        } catch (error: any) {
            console.error("Delhivery Rate Error Details:", error.response?.data || error.message);
            return null;
        }
    }

    public async createOrder(order: any) {
        // ... booking implementation similar to shipmozo but mapping to Delhivery fields ...
        // Endpoint: /c/api/cmu/create.json
        // I can provide this once Rate logic is confirmed.
        return null;
    }
}

export const delhiveryClient = new DelhiveryClient();