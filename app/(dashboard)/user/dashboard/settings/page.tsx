"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Key, Link as LinkIcon, Save } from "lucide-react";
import { toast } from "react-toastify";

export default function DeveloperSettingsPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch the existing API key & webhook on load
  useEffect(() => {
    axios.get("/api/user/profile").then((res) => {
      if (res.data.profile?.merchantApiKey) setApiKey(res.data.profile.merchantApiKey);
      if (res.data.profile?.webhookUrl) setWebhookUrl(res.data.profile.webhookUrl);
    }).catch(() => toast.error("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const generateApiKey = async () => {
    if (apiKey && !window.confirm("WARNING: Generating a new API key will invalidate your existing key. Are you sure?")) return;
    setIsGenerating(true);
    try {
      const res = await axios.post("/api/user/settings/generate-api-key");
      if (res.data.apiKey) {
        setApiKey(res.data.apiKey);
        toast.success("New API Key generated successfully!");
      }
    } catch (err) { toast.error("Failed to generate API Key."); } 
    finally { setIsGenerating(false); }
  };

  const saveWebhook = async () => {
    setIsSavingWebhook(true);
    try {
      await axios.post("/api/user/settings/save-webhook", { webhookUrl });
      toast.success("Webhook URL saved successfully!");
    } catch (err) { toast.error("Failed to save Webhook URL."); } 
    finally { setIsSavingWebhook(false); }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success("API Key copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Developer Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage API keys and Webhook integrations.</p>
      </div>

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Merchant API Key</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            {apiKey ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md p-3 break-all text-gray-800 dark:text-gray-200">
                  {apiKey}
                </div>
                <button onClick={copyToClipboard} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium">
                  {copied ? "Copied!" : "Copy Key"}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 text-sm rounded-md mb-2">You do not have an active API key.</div>
            )}
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
               <button onClick={generateApiKey} disabled={isGenerating} className="px-4 py-2 rounded-md text-sm font-medium transition text-white bg-blue-600 hover:bg-blue-700">
                {isGenerating ? "Generating..." : apiKey ? "Regenerate Key (Destructive)" : "Generate New Key"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* WEBHOOK SECTION */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <LinkIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Webhook URL for Status Updates</h3>
            <p className="text-sm text-gray-500 mt-1">We will send a POST request with the tracking AWB to this URL the moment the order is shipped.</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="url" 
              placeholder="https://your-store.com/api/webhooks/shipquickr"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md p-3 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={saveWebhook} 
              disabled={isSavingWebhook}
              className="px-4 py-3 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              {isSavingWebhook ? "Saving..." : "Save URL"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}