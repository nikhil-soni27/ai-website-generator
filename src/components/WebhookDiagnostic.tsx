import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface DiagnosticResult {
  step: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
}

export function WebhookDiagnostic({
  webhookUrl,
  geminiKey,
}: {
  webhookUrl: string;
  geminiKey: string;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    const diagnosticResults: DiagnosticResult[] = [];

    // Step 1: Check webhook URL format
    if (webhookUrl.includes("/webhook-test/")) {
      diagnosticResults.push({
        step: "URL Check",
        status: "error",
        message: "❌ Using TEST URL! Change '/webhook-test/' to '/webhook/'",
        details: {
          current: webhookUrl,
          correct: webhookUrl.replace("/webhook-test/", "/webhook/"),
        },
      });
    } else if (webhookUrl.includes("/webhook/")) {
      diagnosticResults.push({
        step: "URL Check",
        status: "success",
        message: "✅ URL format is correct (using production URL)",
      });
    } else {
      diagnosticResults.push({
        step: "URL Check",
        status: "warning",
        message: "⚠️ Unusual webhook URL format",
        details: webhookUrl,
      });
    }

    setResults([...diagnosticResults]);

    // Step 2: Test webhook connectivity
    try {
      console.log("🔍 Testing webhook connectivity...");
      const testPayload = {
        prompt: "Create a simple test page",
        theme: "portfolio",
        geminiKey: geminiKey,
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers));

      if (!response.ok) {
        diagnosticResults.push({
          step: "Connectivity Test",
          status: "error",
          message: `❌ HTTP Error ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
          },
        });
      } else {
        diagnosticResults.push({
          step: "Connectivity Test",
          status: "success",
          message: "✅ Webhook is reachable (HTTP 200 OK)",
        });
      }

      setResults([...diagnosticResults]);

      // Step 3: Check response format
      const contentType = response.headers.get("content-type");
      const responseText = await response.text();
      console.log("Response content-type:", contentType);
      console.log("Response body:", responseText.slice(0, 500));

      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        diagnosticResults.push({
          step: "Response Format",
          status: "error",
          message: "❌ Response is not valid JSON",
          details: {
            contentType,
            preview: responseText.slice(0, 200),
          },
        });
        setResults([...diagnosticResults]);
        setIsRunning(false);
        return;
      }

      // Step 4: Check for "workflow was started" error
      if (
        responseData.message === "workflow was started" ||
        responseData.message === "Workflow was started"
      ) {
        diagnosticResults.push({
          step: "Response Mode Check",
          status: "error",
          message:
            "❌ CRITICAL: Webhook Response Mode is WRONG! Fix in n8n",
          details: {
            issue: "Webhook is set to 'Immediately' mode",
            fix: "In n8n → Webhook node → Response Mode → 'When Last Node Finishes'",
            documentation: "See N8N_EXACT_FIX.md",
          },
        });
      } else {
        diagnosticResults.push({
          step: "Response Mode Check",
          status: "success",
          message: "✅ Webhook response mode is correct",
        });
      }

      setResults([...diagnosticResults]);

      // Step 5: Check for HTML in response
      const availableKeys = Object.keys(responseData);
      console.log("Available response keys:", availableKeys);

      let htmlFound = false;
      let htmlField = "";

      if (responseData.html) {
        htmlFound = true;
        htmlField = "html";
      } else if (responseData.code) {
        htmlFound = true;
        htmlField = "code";
      } else if (responseData.output) {
        htmlFound = true;
        htmlField = "output";
      } else if (responseData.result) {
        htmlFound = true;
        htmlField = "result";
      }

      if (htmlFound) {
        const htmlContent = responseData[htmlField];
        const htmlLength = htmlContent?.length || 0;

        if (htmlLength < 200) {
          diagnosticResults.push({
            step: "HTML Validation",
            status: "error",
            message: `❌ HTML too short (${htmlLength} chars)`,
            details: {
              field: htmlField,
              length: htmlLength,
              preview: htmlContent?.slice(0, 100),
            },
          });
        } else if (!htmlContent?.includes("<html")) {
          diagnosticResults.push({
            step: "HTML Validation",
            status: "error",
            message: "❌ Content doesn't contain valid HTML",
            details: {
              field: htmlField,
              preview: htmlContent?.slice(0, 200),
            },
          });
        } else {
          diagnosticResults.push({
            step: "HTML Validation",
            status: "success",
            message: `✅ Valid HTML found in '${htmlField}' field (${htmlLength} chars)`,
          });
        }
      } else {
        diagnosticResults.push({
          step: "HTML Validation",
          status: "error",
          message: "❌ No HTML found in response",
          details: {
            availableFields: availableKeys,
            suggestion: "Check your n8n workflow's 'Extract HTML' node",
          },
        });
      }

      setResults([...diagnosticResults]);

      // Step 6: Check for errors
      if (responseData.error) {
        diagnosticResults.push({
          step: "Error Check",
          status: "error",
          message: `❌ Workflow returned error: ${responseData.error}`,
          details: responseData,
        });
      } else {
        diagnosticResults.push({
          step: "Error Check",
          status: "success",
          message: "✅ No errors in response",
        });
      }

      setResults([...diagnosticResults]);

      // Summary
      const errors = diagnosticResults.filter((r) => r.status === "error");
      if (errors.length === 0) {
        toast.success("✅ All diagnostic checks passed! Your webhook should work.");
      } else {
        toast.error(`❌ Found ${errors.length} issue(s). Check the results below.`);
      }
    } catch (error: any) {
      console.error("Diagnostic error:", error);
      diagnosticResults.push({
        step: "Connection Test",
        status: "error",
        message: `❌ Failed to connect: ${error.message}`,
        details: {
          error: error.name,
          message: error.message,
          possibleCauses: [
            "Workflow is INACTIVE in n8n",
            "n8n instance is not accessible",
            "CORS is blocking the request",
            "Network or firewall issue",
          ],
        },
      });
      setResults([...diagnosticResults]);
      toast.error("Connection failed. Check diagnostic results.");
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-600">Pass</Badge>;
      case "error":
        return <Badge variant="destructive">Fail</Badge>;
      case "warning":
        return <Badge className="bg-yellow-600">Warning</Badge>;
    }
  };

  if (!webhookUrl || !geminiKey) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Configure your Gemini API key and webhook URL first</p>
          <p className="text-sm mt-2">Click "API Setup" to configure</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-1">Webhook Diagnostics</h3>
            <p className="text-sm text-muted-foreground">
              Test your n8n webhook configuration
            </p>
          </div>
          <Button
            onClick={runDiagnostic}
            disabled={isRunning}
            size="sm"
            variant="outline"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Diagnostic"
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3 mt-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.step}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm">{result.message}</p>
                    {result.details && (
                      <details className="text-xs text-muted-foreground mt-2">
                        <summary className="cursor-pointer hover:text-foreground">
                          Show details
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Click "Run Diagnostic" to test your webhook</p>
          </div>
        )}
      </div>
    </Card>
  );
}
