import axios from 'axios';
import { toast } from 'react-toastify';

export const handleDownloadLabel = async (
    orderId: string, 
    awbNumber: string,
    courierName: string,
    existingLabelUrl?: string | null
) => {
    if (!awbNumber) {
        toast.warn("AWB number is not available for this order.");
        return;
    }

    if (existingLabelUrl && existingLabelUrl.startsWith('https://')) {
        toast.info("Opening existing label...");
        window.open(existingLabelUrl, '_blank');
        return;
    }

    const toastId = toast.loading("Generating shipping label...");
    try {
        const response = await axios.post('/api/user/shipment/generate-label', {
            orderId: parseInt(orderId), 
            awbNumber: awbNumber,
            courierName: courierName
        });

        if (response.data.success && response.data.labelUrl) {
            toast.update(toastId, { render: "Label generated! Opening...", type: "success", isLoading: false, autoClose: 3000 });
            window.open(response.data.labelUrl, '_blank');
        } else {
            throw new Error(response.data.error || "Failed to get label URL from API");
        }
    } catch (error: any) {
        console.error("Error generating label:", error);
        const errorMessage = error.response?.data?.error || error.message || "Could not generate label.";
        toast.update(toastId, { render: `Error: ${errorMessage}`, type: "error", isLoading: false, autoClose: 5000 });
    }
};