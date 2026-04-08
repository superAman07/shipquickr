import axios from "axios";
import shadowfaxManualRatesFromFile from "@/lib/data/shadowfax-rates.json";

interface RateResult {
    courierName: string;
    serviceType: string;
    weight: number;
    courierCharges: number;
    codCharges: number;
    totalPrice: number;
    expectedDelivery: string;
    image?: string;
    courierPartnerId: number;
}

interface ShadowfaxApiPincodeInfo {
    code: number;
    services: string[];
}

interface ShadowfaxManualRateEntry {
    serviceName: string;
    serviceTypeKey: string;
    minWeight: number;
    baseRate: number;
    ratePerKgAboveMin: number;
    codFixedCharge: number;
    codPercentage?: number;
}

class ShadowfaxClient {
    private manualRates: ShadowfaxManualRateEntry[] = shadowfaxManualRatesFromFile;

    public async getShadowfaxOptions(
        originPincode: number | string,
        destinationPincode: number | string,
        weightKg: number,
        paymentMode: "Prepaid" | "COD" | "cod" | "ppd",
        codAmount: number,
        // dimensions: { l: number; w: number; h: number }
    ): Promise<RateResult[] | null> {
        const paymentTypeStr = (paymentMode === "cod" || paymentMode === "COD") ? "COD" : "Prepaid";
        const originPin = Number(originPincode);
        const destPin = Number(destinationPincode);

        const serviceabilityUrl = `${process.env.SHADOWFAX_SERVICEABILITY_API_URL}?service=customer_delivery&pincodes=${originPin},${destPin}`;
        const apiToken = process.env.SHADOWFAX_API_TOKEN;

        if (!process.env.SHADOWFAX_SERVICEABILITY_API_URL || !apiToken) {
            console.error("Shadowfax API URL or Token is not configured.");
            return null;
        }

        const headers: Record<string, string> = {
            Authorization: `Token ${apiToken}`,
        };

        try {
            const serviceabilityResponse = await axios.get<ShadowfaxApiPincodeInfo[]>(serviceabilityUrl, { headers });
            const responseData = serviceabilityResponse.data;

            if (!Array.isArray(responseData) || responseData.length === 0) {
                return null;
            }
            const destinationServiceInfo = responseData.find((p) => p.code === destPin);
            if (!destinationServiceInfo || !destinationServiceInfo.services || destinationServiceInfo.services.length === 0) {
                return null;
            }

            const availableRates: RateResult[] = [];
            const apiServiceTypes = destinationServiceInfo.services;

            if (apiServiceTypes && apiServiceTypes.length > 0) {
                for (const serviceNameFromApi of apiServiceTypes) {
                    let serviceTypeKey = "";
                    if (serviceNameFromApi.toLowerCase().includes("regular")) serviceTypeKey = "standard";
                    else if (serviceNameFromApi.toLowerCase().includes("surface")) serviceTypeKey = "surface";
                    else if (serviceNameFromApi.toLowerCase().includes("express")) serviceTypeKey = "express";

                    if (serviceTypeKey) {
                        const rateRule = this.manualRates.find((r) => r.serviceTypeKey.toLowerCase() === serviceTypeKey.toLowerCase());
                        if (rateRule) {
                            let rawFreight = rateRule.baseRate;
                            if (weightKg > rateRule.minWeight) {
                                rawFreight += Math.ceil(weightKg - rateRule.minWeight) * rateRule.ratePerKgAboveMin;
                            }

                            let rawCodApiCharge = 0;
                            if (paymentTypeStr === "COD") {
                                rawCodApiCharge = rateRule.codFixedCharge;
                                if (rateRule.codPercentage && rateRule.codPercentage > 0) {
                                    rawCodApiCharge += (codAmount * rateRule.codPercentage) / 100;
                                }
                            }

                            availableRates.push({
                                courierName: "Shadowfax",
                                serviceType: rateRule.serviceName,
                                weight: weightKg,
                                courierCharges: parseFloat(rawFreight.toFixed(2)),
                                codCharges: parseFloat(rawCodApiCharge.toFixed(2)),
                                totalPrice: parseFloat((rawFreight + rawCodApiCharge).toFixed(2)),
                                expectedDelivery: serviceTypeKey === "express" ? "2-3 Days" : "4-6 Days",
                                image: "/shadowfax.png",
                                courierPartnerId: 999
                            });
                        }
                    }
                }
            }

            // Fallback
            if (availableRates.length === 0) {
                for (const rateRule of this.manualRates) {
                    const originServiceInfo = responseData.find((p) => p.code === originPin);
                    if (originServiceInfo && originServiceInfo.services && originServiceInfo.services.some((s) => s.toLowerCase().includes(rateRule.serviceTypeKey.toLowerCase()))) {
                        let rawFreight = rateRule.baseRate;
                        if (weightKg > rateRule.minWeight) {
                            rawFreight += Math.ceil(weightKg - rateRule.minWeight) * rateRule.ratePerKgAboveMin;
                        }
                        let rawCodApiCharge = 0;
                        if (paymentTypeStr === "COD") {
                            rawCodApiCharge = rateRule.codFixedCharge;
                            if (rateRule.codPercentage && rateRule.codPercentage > 0) {
                                rawCodApiCharge += (codAmount * rateRule.codPercentage) / 100;
                            }
                        }
                        availableRates.push({
                            courierName: "Shadowfax",
                            serviceType: rateRule.serviceName,
                            weight: weightKg,
                            courierCharges: parseFloat(rawFreight.toFixed(2)),
                            codCharges: parseFloat(rawCodApiCharge.toFixed(2)),
                            totalPrice: parseFloat((rawFreight + rawCodApiCharge).toFixed(2)),
                            expectedDelivery: "4-6 Days",
                            image: "/shadowfax.png",
                            courierPartnerId: 999
                        });
                    }
                }
            }

            return availableRates.length > 0 ? availableRates : null;
        } catch (error: any) {
            console.error("Error fetching Shadowfax options:", error.response?.data || error.message);
            return null;
        }
    }

    public async generateAwb(order: any, selectedServiceType?: string): Promise<{ awbNumber: string; labelUrl?: string; shippingId?: string } | null> {
        console.log(`Shadowfax generate AWB for order: ${order.id}`);
        const apiToken = process.env.SHADOWFAX_API_TOKEN;
        const apiUrl = "https://dale.shadowfax.in/api/v3/clients/orders/";

        if (!apiToken) {
            console.error("Shadowfax API Token is not configured.");
            return null;
        }

        const headers = {
            "Authorization": `Token ${apiToken}`,
            "Content-Type": "application/json"
        };

        const physicalWeight = parseFloat(order.physicalWeight) || 0;
        const volumetricWeight = ((parseFloat(order.length) || 10) * (parseFloat(order.breadth) || 10) * (parseFloat(order.height) || 10)) / 5000;
        const weightGms = Math.ceil(Math.max(physicalWeight, volumetricWeight) * 1000); // Send in grams

        const productValue = order.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.orderValue) || 0) * (item.quantity || 1), 0) || 50;

        const payload = {
            "order_type": "marketplace",
            "order_details": {
                "client_order_id": order.orderId ? String(order.orderId) : `SQ${Date.now()}`,
                "actual_weight": weightGms || 500,
                "volumetric_weight": weightGms || 500,
                "product_value": productValue,
                "payment_mode": order.paymentMode === "COD" || order.paymentMode === "cod" ? "COD" : "Prepaid",
                "cod_amount": order.paymentMode === "COD" || order.paymentMode === "cod" ? String(order.codAmount || productValue) : "0",
                "total_amount": productValue,
                "order_service": selectedServiceType?.toLowerCase().includes("express") ? "express" : "regular",
                "eway_bill": order.ewaybill || ""
            },
            "customer_details": {
                "name": order.customerName || "Customer",
                "contact": order.mobile ? String(order.mobile) : "9999999999",
                "address_line_1": order.address?.substring(0, 100) || "Customer Address",
                "city": order.city || "City",
                "state": order.state || "State",
                "pincode": Number(order.pincode) || 110001
            },
            "pickup_details": {
                "name": order.warehouse?.name || "Sender",
                "contact": order.warehouse?.mobile ? String(order.warehouse.mobile) : "9999999999",
                "address_line_1": order.warehouse?.address1?.substring(0, 100) || "Warehouse Address",
                "city": order.warehouse?.city || "City",
                "state": order.warehouse?.state || "State",
                "pincode": Number(order.warehouse?.pincode) || 110001
            },
            "rts_details": {
                "name": order.warehouse?.name || "Sender RTS",
                "contact": order.warehouse?.mobile ? String(order.warehouse.mobile) : "9999999999",
                "address_line_1": order.warehouse?.address1?.substring(0, 100) || "RTS Address",
                "city": order.warehouse?.city || "City",
                "state": order.warehouse?.state || "State",
                "pincode": Number(order.warehouse?.pincode) || 110001
            },
            "product_details": order.items?.map((item: any) => ({
                "sku_name": item.productName || "Product",
                "price": parseFloat(item.orderValue) || 50,
                "additional_details": { "quantity": item.quantity || 1 }
            })) || [{
                "sku_name": "General Goods",
                "price": 50,
                "additional_details": { "quantity": 1 }
            }]
        };

        try {
            console.log("Shadowfax AWB Payload:", JSON.stringify(payload, null, 2));
            const response = await axios.post(apiUrl, payload, { headers });
            const responseData = response.data;
            console.log("Shadowfax API Response:", JSON.stringify(responseData, null, 2));

            if (responseData && responseData.message === "Success" && responseData.data?.awb_number) {
                return {
                    awbNumber: responseData.data.awb_number,
                    shippingId: String(responseData.data.id || "")
                };
            } else if (responseData && responseData.errors) {
                console.error("Shadowfax AWB Generation returned errors:", responseData.errors);
                return null;
            }
            return null;
        } catch (error: any) {
            console.error("Shadowfax AWB Generation error:", error.response?.data || error.message);
            return null;
        }
    }

    // We will attempt to track/cancel if the APIs become available, returning placeholders for now.
    public async trackShipment(awbNumber: string): Promise<any | null> {
        console.warn("Shadowfax Track: Not explicitly defined in unified api without webhook, returning mock / pending.");
        return null; // A proper impl would use their track API if found or rely on Webhooks
    }

    public async cancelShipment(awbNumber: string): Promise<{ success: boolean; message: string }> {
        console.warn(`Shadowfax Cancel: ${awbNumber} (API endpoint unknown, returning mock).`);
        return { success: true, message: "Mock cancellation successful. Requires webhook or explicit endpoint." };
    }
}

export const shadowfaxClient = new ShadowfaxClient();
