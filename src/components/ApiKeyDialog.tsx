import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { ExternalLink, Info, Key, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner@2.0.3";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveConfig: (config: { geminiKey: string; webhookUrl: string }) => void;
  currentGeminiKey?: string;
  currentWebhookUrl?: string;
}

export function ApiKeyDialog({ 
  open, 
  onOpenChange, 
  onSaveConfig,
  currentGeminiKey = "",
  currentWebhookUrl = ""
}: ApiKeyDialogProps) {
  const [geminiKey, setGeminiKey] = useState(currentGeminiKey);
  const [webhookUrl, setWebhookUrl] = useState(currentWebhookUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    setGeminiKey(currentGeminiKey);
    setWebhookUrl(currentWebhookUrl);
    setTestStatus("idle");
    setWebhookTestStatus("idle");
  }, [currentGeminiKey, currentWebhookUrl, open]);

  const handleTestConnection = async () => {
    if (!geminiKey.trim()) {
      toast.error("Please enter a Google Gemini API key first");
      return;
    }

    setIsTesting(true);
    setTestStatus("idle");

    try {
      console.log("Testing Google Gemini API...");
      console.log("Using key:", geminiKey.slice(0, 10) + "...");
      
      // Test with a simple prompt
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Say 'API key is valid' if you can read this."
            }]
          }]
        })
      });

      console.log("Test response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("API response:", data);
        setTestStatus("success");
        toast.success(`✓ API key is valid! Google Gemini connected successfully.`, { duration: 5000 });
      } else if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Bad request:", errorData);
        setTestStatus("error");
        toast.error("Invalid API key format. Please check your key.", { duration: 6000 });
      } else if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Auth error:", errorData);
        setTestStatus("error");
        toast.error("Invalid API key. Get your key from Google AI Studio.", { duration: 6000 });
      } else {
        const errorText = await response.text();
        console.error("API error:", errorText);
        setTestStatus("error");
        toast.error(`Connection failed: ${response.status}`, { duration: 6000 });
      }
    } catch (error: any) {
      console.error("Test connection error:", error);
      setTestStatus("error");
      toast.error(`Test failed: ${error.message}. Check console for details.`, { duration: 6000 });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.error("Please enter a webhook URL first");
      return;
    }

    if (!geminiKey.trim()) {
      toast.error("Please enter your Google Gemini API key first");
      return;
    }

    setIsTestingWebhook(true);
    setWebhookTestStatus("idle");

    try {
      console.log("Testing n8n webhook:", webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt: "Test connection - create a simple hello world HTML page",
          theme: "tech",
          geminiKey: geminiKey
        })
      });

      console.log("Webhook test response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Webhook response:", data);
        
        if (data.html || data.code || data.output) {
          setWebhookTestStatus("success");
          toast.success("✅ Webhook works! n8n returned HTML successfully.", { duration: 5000 });
        } else if (data.error || data.message) {
          setWebhookTestStatus("error");
          toast.error(`Webhook responded but returned error: ${data.error || data.message}`, { duration: 6000 });
        } else {
          setWebhookTestStatus("success");
          toast.success("Webhook connected! (Check response format in n8n)", { duration: 5000 });
        }
      } else {
        setWebhookTestStatus("error");
        const errorText = await response.text();
        toast.error(`Webhook error (${response.status}): ${errorText.slice(0, 100)}`, { duration: 6000 });
      }
    } catch (error: any) {
      console.error("Webhook test error:", error);
      setWebhookTestStatus("error");
      
      if (error.message.includes("Failed to fetch")) {
        toast.error("Cannot reach webhook. Check: 1) URL is correct 2) n8n workflow is ACTIVE 3) CORS is enabled", { duration: 8000 });
      } else {
        toast.error(`Webhook test failed: ${error.message}`, { duration: 6000 });
      }
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSave = () => {
    // Check for test URL
    if (webhookUrl.trim() && webhookUrl.includes('/webhook-test/')) {
      toast.error("❌ ERROR: You're using TEST URL! Change '/webhook-test/' to '/webhook/' in the webhook URL", { duration: 10000 });
      console.error("=== WRONG WEBHOOK URL ===");
      console.error("You're using the TEST URL which doesn't work in production!");
      console.error("Current URL:", webhookUrl);
      console.error("Should be: ", webhookUrl.replace('/webhook-test/', '/webhook/'));
      console.error("Fix: Change webhook URL before saving");
      return;
    }
    
    if (geminiKey.trim() && webhookUrl.trim()) {
      onSaveConfig({ 
        geminiKey: geminiKey.trim(),
        webhookUrl: webhookUrl.trim()
      });
      onOpenChange(false);
      toast.success("Configuration saved successfully! 🎉");
    } else if (geminiKey.trim()) {
      onSaveConfig({ 
        geminiKey: geminiKey.trim(),
        webhookUrl: ""
      });
      onOpenChange(false);
      toast.success("API key saved! Add webhook URL to enable n8n mode.");
    } else {
      toast.error("Please enter at least your Google Gemini API key");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Google Gemini API Configuration</DialogTitle>
          <DialogDescription>
            Connect your Google Gemini API key to enable FREE AI-powered website generation
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">

          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <Info className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              <strong>✨ 100% Free!</strong> Google Gemini offers free API access with generous rate limits. No credit card required!
            </AlertDescription>
          </Alert>

          {/* Google Gemini API Key */}
          <div className="space-y-3 p-4 border-2 border-primary rounded-lg bg-primary/5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Key className="h-4 w-4 text-primary" />
                  <h4>Google Gemini API Key</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your free API key from Google AI Studio
                </p>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm flex items-center gap-1"
              >
                Get API Key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gemini-key">API Key</Label>
              <Input
                id="gemini-key"
                type="password"
                placeholder="AIza..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                💡 Get your API key at aistudio.google.com/app/apikey
              </p>
            </div>
          </div>

          {/* Test API Key */}
          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={!geminiKey.trim() || isTesting}
              variant="outline"
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing API Key...
                </>
              ) : testStatus === "success" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  API Key Valid ✓
                </>
              ) : testStatus === "error" ? (
                <>
                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  Invalid Key
                </>
              ) : (
                "Test API Key"
              )}
            </Button>
          </div>

          {/* n8n Webhook URL */}
          <div className="space-y-3 p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-950">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                  <h4>n8n Webhook URL (Optional)</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your n8n webhook endpoint for AI generation
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-n8n.cloud/webhook/generate-website"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className={webhookUrl.includes('/webhook-test/') ? 'border-red-500 border-2' : ''}
              />
              {webhookUrl.includes('/webhook-test/') && (
                <p className="text-xs text-red-600 font-bold">
                  ⚠️ WARNING: You're using the TEST URL! Change '/webhook-test/' to '/webhook/' for production use.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                💡 Leave empty to use Direct API mode, or enter your n8n webhook URL (use '/webhook/' not '/webhook-test/')
              </p>
            </div>
          </div>

          {/* Test Webhook */}
          {webhookUrl.trim() && (
            <div className="flex gap-2">
              <Button
                onClick={handleTestWebhook}
                disabled={!webhookUrl.trim() || !geminiKey.trim() || isTestingWebhook}
                variant="outline"
                className="flex-1"
              >
                {isTestingWebhook ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Webhook...
                  </>
                ) : webhookTestStatus === "success" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    Webhook Works ✓
                  </>
                ) : webhookTestStatus === "error" ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Webhook Failed
                  </>
                ) : (
                  "Test Webhook Connection"
                )}
              </Button>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="p-3 border rounded-lg space-y-3 bg-muted/50">
            <h4 className="text-sm font-bold">🚀 How to Get Your Free API Key:</h4>
            
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-background rounded border-l-2 border-primary">
                <p className="font-bold text-primary mb-1">STEP 1: Create Google Account</p>
                <ol className="text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                  <li>You need a Google account (Gmail)</li>
                  <li>If you don't have one, create it at <a href="https://accounts.google.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">accounts.google.com</a></li>
                </ol>
              </div>

              <div className="p-2 bg-background rounded border-l-2 border-primary">
                <p className="font-bold text-primary mb-1">STEP 2: Get Gemini API Key</p>
                <ol className="text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                  <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></li>
                  <li>Sign in with your Google account</li>
                  <li>Click <strong>"Get API key"</strong> or <strong>"Create API key"</strong></li>
                  <li>Select <strong>"Create API key in new project"</strong></li>
                  <li>Copy your API key (starts with <code className="bg-muted px-1">AIza...</code>)</li>
                </ol>
              </div>

              <div className="p-2 bg-background rounded border-l-2 border-green-500">
                <p className="font-bold text-green-600 mb-1">STEP 3: Save & Test</p>
                <ol className="text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                  <li>Paste your API key above</li>
                  <li>Click <strong>"Test API Key"</strong></li>
                  <li>When successful, click <strong>"Save Configuration"</strong></li>
                  <li>Start generating websites! 🎉</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              💡 <strong>Benefits:</strong> Free, no credit card, powerful Gemini Pro model, generous rate limits, works directly from browser!
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!geminiKey.trim()}
              className="flex-1"
            >
              {webhookUrl.trim() ? "Save API Key & Webhook" : "Save API Key"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
