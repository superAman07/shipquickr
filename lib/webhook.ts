export async function forwardWebhookToMerchant(url: string | null | undefined, payload: any) {
    if (!url || url === "null" || url.trim() === "") return;
    try {
        new URL(url); // Validate URL format
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        console.log(`Forwarded status webhook to merchant ${url}`);
    } catch (err) {
        console.error(`Failed to forward status webhook to merchant ${url}:`, err);
    }
}
