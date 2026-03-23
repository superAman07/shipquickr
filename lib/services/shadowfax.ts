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

    // Placeholder for AWB generation (Shadowfax specific flow might be added later)
    public async generateAwb(order: any, selectedServiceType?: string): Promise<{ awbNumber: string; labelUrl?: string; shippingId?: string } | null> {
        console.log(`Shadowfax generate AWB for order: ${order.id}`);
        return {
            awbNumber: `SFX${Date.now()}${order.id}`,
        }
    }
}

export const shadowfaxClient = new ShadowfaxClient();
