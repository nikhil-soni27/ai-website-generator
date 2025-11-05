import { useState, useEffect } from "react";
import { Sparkles, Download, Loader2, Settings } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Progress } from "./components/ui/progress";
import { Badge } from "./components/ui/badge";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";
import { PromptInput } from "./components/PromptInput";
import { ThemeSelector } from "./components/ThemeSelector";
import { PreviewFrame } from "./components/PreviewFrame";
import { Header } from "./components/Header";
import { ThemeProvider } from "./components/ThemeProvider";
import { ApiKeyDialog } from "./components/ApiKeyDialog";
import { generateWebsiteFromTemplate } from "./lib/templateGenerator";
import JSZip from "jszip";

function AppContent() {
  const [prompt, setPrompt] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("portfolio");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [progress, setProgress] = useState(0);
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [debugMode, setDebugMode] = useState(false);
  const [useDirectAPI, setUseDirectAPI] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    const savedGeminiKey = localStorage.getItem("geminiKey");
    const savedWebhookUrl = localStorage.getItem("webhookUrl");
    if (savedGeminiKey) setGeminiKey(savedGeminiKey);
    if (savedWebhookUrl) setWebhookUrl(savedWebhookUrl);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a website description");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedCode("");

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      let generatedHTML = "";
      
      // Use AI API via n8n webhook if configured, otherwise use template generator
      if (geminiKey && !useDirectAPI && webhookUrl) {
        try {
          console.log("Calling n8n webhook:", webhookUrl);
          console.log("Payload:", { 
            prompt: prompt.slice(0, 100) + "...", 
            theme: selectedTheme,
            hasApiKey: !!geminiKey 
          });
          
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ 
              prompt: prompt,
              theme: selectedTheme,
              geminiKey: geminiKey
            })
          });

          console.log("Response status:", response.status);
          console.log("Response headers:", {
            'content-type': response.headers.get('content-type')
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("n8n webhook error:", errorText);
            
            if (response.status === 404) {
              throw new Error("Webhook not found. Check: 1) Workflow is ACTIVE 2) Correct webhook URL");
            } else if (response.status === 401 || response.status === 403) {
              throw new Error("Authentication error. Check your Google Gemini API key.");
            } else if (response.status === 503) {
              throw new Error("Model is loading or webhook unavailable. Please try again in a moment.");
            } else if (response.status === 500) {
              throw new Error("n8n workflow error. Check your workflow configuration.");
            } else {
              throw new Error(`Webhook error (${response.status}): ${errorText.slice(0, 150)}`);
            }
          }

          const contentType = response.headers.get('content-type');
          let data: any;
          
          if (contentType?.includes('application/json')) {
            data = await response.json();
          } else {
            const text = await response.text();
            console.log("Non-JSON response:", text.slice(0, 200));
            // Try to parse as JSON anyway
            try {
              data = JSON.parse(text);
            } catch (e) {
              // If it's plain HTML, use it directly
              if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                data = { html: text };
              } else {
                throw new Error("Invalid response format from webhook");
              }
            }
          }
          
          console.log("=== n8n Webhook Response ===");
          console.log("Response data:", data);
          console.log("Available keys:", Object.keys(data));
          console.log("===========================");
          
          if (debugMode) {
            toast.info(`Response keys: ${Object.keys(data).join(", ")}`, { duration: 5000 });
          }
          
          // Check if n8n returned "workflow was started" - this means webhook is in wrong mode
          if (data.message === "workflow was started" || data.message === "Workflow was started") {
            console.error("❌ WEBHOOK CONFIGURATION ERROR");
            console.error("The webhook is set to respond immediately, not wait for completion");
            console.error("Fix: In n8n, edit the Webhook node → Response Mode → 'When Last Webhook Node Executes'");
            throw new Error("Webhook Configuration Error: Set Response Mode to 'When Last Webhook Node Executes' in n8n");
          }
          
          // Check if n8n returned an error
          if (data.error) {
            console.error("n8n workflow error:", data.error);
            console.error("Full response:", data);
            throw new Error(`n8n workflow error: ${data.error}`);
          }
          
          // Extract HTML from response - try multiple possible fields
          let htmlContent = "";
          
          if (data.html) {
            console.log("Found HTML in data.html");
            htmlContent = data.html;
          } else if (data.code) {
            console.log("Found HTML in data.code");
            htmlContent = data.code;
          } else if (data.output) {
            console.log("Found HTML in data.output");
            htmlContent = data.output;
          } else if (data.result) {
            console.log("Found HTML in data.result");
            htmlContent = data.result;
          } else if (data.generated_text) {
            console.log("Found HTML in data.generated_text");
            htmlContent = data.generated_text;
          } else if (Array.isArray(data) && data[0]?.generated_text) {
            console.log("Found HTML in array format");
            htmlContent = data[0].generated_text;
          } else if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            // Handle raw Gemini API response format (if n8n is just passing through)
            console.log("Found HTML in Gemini API format (data.candidates[0].content.parts[0].text)");
            htmlContent = data.candidates[0].content.parts[0].text;
          } else if (typeof data === "string") {
            console.log("Response is a string");
            htmlContent = data;
          } else {
            console.error("Could not find HTML in response");
            console.error("Available fields:", Object.keys(data));
            console.error("Full response data:", JSON.stringify(data, null, 2));
            throw new Error(`No HTML found. n8n returned: ${JSON.stringify(Object.keys(data))}. Check n8n workflow logs.`);
          }
          
          console.log("Extracted HTML length:", htmlContent.length);
          console.log("HTML preview:", htmlContent.slice(0, 300));
          
          // Clean the response - remove markdown code blocks (html, jsx, javascript)
          htmlContent = htmlContent
            .replace(/```html\n?/gi, '')
            .replace(/```jsx\n?/gi, '')
            .replace(/```javascript\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();
          
          // AGGRESSIVE JSX DETECTION (same as Direct API)
          const isJSX = 
            htmlContent.includes('export default') ||
            htmlContent.includes('export ') ||
            htmlContent.includes('import React') ||
            htmlContent.includes('import ') ||
            (htmlContent.includes('const ') && htmlContent.includes('= () =>')) ||
            (htmlContent.includes('function ') && htmlContent.includes('return (')) ||
            (htmlContent.includes('className=') && !htmlContent.includes('<!DOCTYPE'));
          
          if (isJSX) {
            console.warn("🚫 WEBHOOK returned JSX! Attempting to convert...");
            
            // Remove imports and exports
            htmlContent = htmlContent
              .replace(/^import.*$/gm, '')
              .replace(/^export.*$/gm, '');
            
            // Convert className to class
            htmlContent = htmlContent.replace(/className=/g, 'class=');
            
            // Extract JSX from component if possible
            const jsxMatch = htmlContent.match(/return\s*\(([\s\S]*)\);?\s*};\s*$/);
            if (jsxMatch) {
              console.warn("Extracted JSX from return statement");
              let extractedJSX = jsxMatch[1].trim();
              
              // Wrap in HTML structure
              htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedTheme} Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${extractedJSX}
</body>
</html>`;
              
              toast.warning("Webhook returned JSX. Converted to HTML.", { duration: 4000 });
            } else {
              toast.error("Webhook returned JSX. Please regenerate.", { duration: 5000 });
              throw new Error("Webhook returned JSX/React component instead of HTML.");
            }
          }
          
          // Add <!DOCTYPE html> at the start if not present
          if (!htmlContent.startsWith('<!DOCTYPE html>') && !htmlContent.startsWith('<!DOCTYPE HTML>')) {
            if (htmlContent.startsWith('<html')) {
              htmlContent = '<!DOCTYPE html>\n' + htmlContent;
            }
          }
          
          // Extract HTML if there's extra text before/after it
          const htmlMatch = htmlContent.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i);
          if (htmlMatch) {
            htmlContent = htmlMatch[1];
          } else if (htmlContent.includes('<html')) {
            // Try to find just the html tag
            const htmlTagMatch = htmlContent.match(/(<html[\s\S]*<\/html>)/i);
            if (htmlTagMatch) {
              htmlContent = '<!DOCTYPE html>\n' + htmlTagMatch[1];
              console.log("✅ Added DOCTYPE to extracted HTML");
            }
          }
          
          // Validate HTML
          if (!htmlContent.includes('<html') && !htmlContent.includes('<HTML')) {
            console.log("Response doesn't contain valid HTML tags");
            throw new Error("Webhook didn't return valid HTML. Using template fallback.");
          }
          
          if (htmlContent.length < 200) {
            console.log("Generated HTML too short:", htmlContent.length);
            throw new Error("Generated HTML is too short. Using template instead.");
          }
          
          console.log("✓ Valid HTML detected from webhook");
          console.log("- Starts with DOCTYPE:", htmlContent.startsWith('<!DOCTYPE'));
          console.log("- Contains <html>:", htmlContent.includes('<html'));
          console.log("- Contains </html>:", htmlContent.includes('</html>'));
          console.log("- Final length:", htmlContent.length);

          generatedHTML = htmlContent;
          clearInterval(progressInterval);
          setProgress(100);
          toast.success("Website generated with AI!");
        } catch (error: any) {
          console.error("AI generation error:", error);
          clearInterval(progressInterval);
          
          // Show specific error message
          if (error.message.includes("Webhook not found")) {
            toast.error(error.message, { duration: 6000 });
          } else if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
            // Check if using test URL instead of production URL
            if (webhookUrl.includes('/webhook-test/')) {
              toast.error("❌ ERROR: You're using TEST URL! Change '/webhook-test/' to '/webhook/' in API Setup", { duration: 10000 });
              console.error("=== WRONG WEBHOOK URL ===");
              console.error("You're using the TEST URL which doesn't work in production!");
              console.error("Current URL:", webhookUrl);
              console.error("Should be: ", webhookUrl.replace('/webhook-test/', '/webhook/'));
              console.error("Fix: In React app → API Setup → Change webhook URL");
            } else {
              toast.error("⚠️ Cannot reach n8n webhook. Check: 1) Workflow is ACTIVE 2) n8n is accessible 3) URL is correct", { duration: 10000 });
              console.error("=== CONNECTION ERROR ===");
              console.error("Possible causes:");
              console.error("1. n8n workflow is INACTIVE (toggle must be GREEN)");
              console.error("2. n8n instance is down or not accessible");
              console.error("3. Webhook URL is incorrect");
              console.error("4. CORS is blocking the request");
              console.error("Webhook URL:", webhookUrl);
              console.error("Test: curl -X POST", webhookUrl);
            }
          } else if (error.message.includes("Webhook Configuration Error")) {
            // Show clear instructions for the "workflow was started" issue
            toast.error("🔧 Fix Required: Change Webhook Response Mode to 'When Last Node Finishes' in n8n. See N8N_EXACT_FIX.md", { duration: 15000 });
            console.error("=== N8N WEBHOOK CONFIGURATION ERROR ===");
            console.error("SOLUTION: In n8n, edit Webhook node → Response Mode → 'When Last Node Finishes'");
            console.error("The webhook is responding immediately instead of waiting for the workflow to complete");
            console.error("📖 Read N8N_EXACT_FIX.md for detailed step-by-step instructions");
          } else if (error.message.includes("n8n workflow error")) {
            // Show the actual error from n8n
            toast.error(error.message, { duration: 10000 });
            console.error("=== N8N WORKFLOW ERROR ===");
            console.error("Your n8n workflow returned an error. Check the workflow execution logs in n8n.");
          } else if (error.message.includes("Authentication error")) {
            toast.error(error.message + " Check your Google Gemini API key.", { duration: 8000 });
          } else if (error.message.includes("Model is loading")) {
            toast.error(error.message + " Please wait and try again.", { duration: 8000 });
          } else if (error.message.includes("No HTML found")) {
            toast.error("n8n workflow issue: " + error.message, { duration: 10000 });
            console.error("=== N8N RESPONSE ERROR ===");
            console.error("Check your n8n workflow's 'Code' and 'Respond to Webhook' nodes");
          } else {
            toast.error(`AI generation failed: ${error.message}`, { duration: 6000 });
          }
          
          // Fallback to template generator
          toast.info("Using template fallback...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          generatedHTML = generateWebsiteFromTemplate(prompt, selectedTheme);
          setProgress(100);
        }
      } else if (geminiKey && useDirectAPI) {
        // Direct Google Gemini API call (bypassing n8n) for testing
        try {
          console.log("=== DIRECT API MODE ===");
          console.log("Calling Google Gemini API directly (bypassing n8n)");
          
          const aiPrompt = `ROLE: You are a raw HTML file generator. You output ONLY valid HTML documents.

❌ FORBIDDEN - YOU MUST NOT DO THESE:
1. DO NOT write "import React" or any imports
2. DO NOT write "export default" or any exports  
3. DO NOT use "className=" - this is JSX, not HTML
4. DO NOT use {curlyBraces} for variables - this is JSX
5. DO NOT wrap output in \`\`\`jsx or \`\`\`html markers
6. DO NOT write ANY text before <!DOCTYPE html>
7. DO NOT write ANY explanations after </html>
8. DO NOT create React components or functions
9. DO NOT use const/let/function at the top level
10. DO NOT use JSX syntax whatsoever

✅ REQUIRED - YOU MUST DO THESE:
1. First 15 characters MUST be: "<!DOCTYPE html>"
2. Use "class=" not "className="
3. Put JavaScript inside <script> tags, not inline JSX
4. Create a complete standalone HTML file
5. Include: <script src="https://cdn.tailwindcss.com"></script>
6. Make it responsive with Tailwind classes
7. Last tag MUST be: </html>

EXAMPLE OF CORRECT OUTPUT:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Example</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
  </div>
  <script>
    // Any JavaScript here
  </script>
</body>
</html>

TASK: Create an HTML page for: ${prompt}
THEME: ${selectedTheme}

YOUR OUTPUT (start typing <!DOCTYPE html> immediately):`;

          // Call Google Gemini API
          console.log("Calling Gemini API...");
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{
                  text: "You are an HTML file generator. You ONLY output valid HTML documents. NEVER output JSX, React components, or code with 'import' or 'export' statements. NEVER use 'className' - always use 'class'. Your response must start with <!DOCTYPE html> and end with </html>. Do not include any markdown code fences or explanations."
                }]
              },
              contents: [{
                parts: [{
                  text: aiPrompt
                }]
              }],
              generationConfig: {
                temperature: 0.3,
                topK: 20,
                topP: 0.8,
                maxOutputTokens: 8192,
              }
            })
          });

          console.log("Direct API Response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Direct API error:", errorText);
            
            if (response.status === 400) {
              throw new Error("Invalid request. Check your API key and try again.");
            } else if (response.status === 401 || response.status === 403) {
              throw new Error("Invalid Google Gemini API key. Get one from Google AI Studio.");
            } else if (response.status === 429) {
              throw new Error("Rate limit exceeded. Please wait a moment and try again.");
            } else {
              throw new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 200)}`);
            }
          }

          const data = await response.json();
          console.log("Direct API response:", data);
          console.log("Response structure:", {
            hasCandidates: !!data.candidates,
            candidatesLength: data.candidates?.length,
            hasContent: !!data.candidates?.[0]?.content,
            hasParts: !!data.candidates?.[0]?.content?.parts,
            partsLength: data.candidates?.[0]?.content?.parts?.length
          });

          let htmlContent = "";
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            htmlContent = data.candidates[0].content.parts[0].text;
            console.log("✅ Extracted text from Gemini response");
            console.log("Text length:", htmlContent.length);
            console.log("First 200 chars:", htmlContent.substring(0, 200));
          } else if (data.error) {
            throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
          } else {
            throw new Error("Unexpected API response format");
          }

          // Clean HTML
          console.log("🧹 Cleaning HTML...");
          const originalLength = htmlContent.length;
          
          // Remove markdown code blocks (html, jsx, javascript)
          htmlContent = htmlContent
            .replace(/```html\n?/gi, '')
            .replace(/```jsx\n?/gi, '')
            .replace(/```javascript\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

          console.log("After markdown cleanup:", htmlContent.length, "chars");

          // AGGRESSIVE JSX DETECTION
          const isJSX = 
            htmlContent.includes('export default') ||
            htmlContent.includes('export ') ||
            htmlContent.includes('import React') ||
            htmlContent.includes('import ') ||
            htmlContent.includes('const ') && htmlContent.includes('= () =>') ||
            htmlContent.includes('function ') && htmlContent.includes('return (') ||
            (htmlContent.includes('className=') && !htmlContent.includes('<!DOCTYPE'));
          
          if (isJSX) {
            console.error("🚫 JSX DETECTED! AI returned React code instead of HTML");
            console.error("JSX indicators found:");
            if (htmlContent.includes('export ')) console.error("  - Has 'export' statement");
            if (htmlContent.includes('import ')) console.error("  - Has 'import' statement");
            if (htmlContent.includes('className=')) console.error("  - Uses 'className' instead of 'class'");
            if (htmlContent.includes('= () =>')) console.error("  - Has arrow function syntax");
            
            // Try to convert JSX to HTML as last resort
            console.warn("Attempting to convert JSX to HTML...");
            
            // Remove imports and exports
            htmlContent = htmlContent
              .replace(/^import.*$/gm, '')
              .replace(/^export.*$/gm, '');
            
            // Convert className to class
            htmlContent = htmlContent.replace(/className=/g, 'class=');
            
            // Extract JSX from component if possible
            const jsxMatch = htmlContent.match(/return\s*\(([\s\S]*)\);?\s*};\s*$/);
            if (jsxMatch) {
              console.warn("Extracted JSX from return statement");
              let extractedJSX = jsxMatch[1].trim();
              
              // Wrap in HTML structure
              htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedTheme} Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${extractedJSX}
</body>
</html>`;
              
              toast.warning("Converted JSX to HTML. May need manual fixes.", { duration: 4000 });
            } else {
              toast.error("AI returned JSX. Please try generating again.", { duration: 5000 });
              throw new Error("AI returned JSX/React component instead of HTML. The prompt explicitly forbids this. Try again.");
            }
          }

          if (!htmlContent.startsWith('<!DOCTYPE')) {
            console.log("⚠️ Missing DOCTYPE, adding it...");
            if (htmlContent.startsWith('<html')) {
              htmlContent = '<!DOCTYPE html>\n' + htmlContent;
            }
          }

          const htmlMatch = htmlContent.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i);
          if (htmlMatch) {
            console.log("✅ Extracted clean HTML from response");
            htmlContent = htmlMatch[1];
          } else {
            console.log("⚠️ No DOCTYPE...html match found, checking for alternative formats");
            // If no DOCTYPE but has <html>, wrap it
            if (htmlContent.includes('<html')) {
              const htmlTagMatch = htmlContent.match(/(<html[\s\S]*<\/html>)/i);
              if (htmlTagMatch) {
                htmlContent = '<!DOCTYPE html>\n' + htmlTagMatch[1];
                console.log("✅ Added DOCTYPE to extracted HTML");
              }
            }
          }

          console.log("Final HTML check:");
          console.log("- Starts with DOCTYPE:", htmlContent.startsWith('<!DOCTYPE'));
          console.log("- Contains <html>:", htmlContent.includes('<html'));
          console.log("- Contains </html>:", htmlContent.includes('</html>'));
          console.log("- Final length:", htmlContent.length);

          if (!htmlContent.includes('<html')) {
            console.error("❌ Generated content doesn't contain <html> tag!");
            console.error("Content preview:", htmlContent.substring(0, 500));
            throw new Error("AI didn't generate valid HTML. Using template.");
          }

          generatedHTML = htmlContent;
          clearInterval(progressInterval);
          setProgress(100);
          console.log("🎉 SUCCESS! Generated HTML is ready for preview");
          toast.success("✅ Direct API Success! Your Google Gemini key works!", { duration: 5000 });
        } catch (error: any) {
          console.error("Direct API error:", error);
          clearInterval(progressInterval);
          toast.error(`Direct API failed: ${error.message}`, { duration: 8000 });
          
          // Fallback to template
          toast.info("Using template fallback...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          generatedHTML = generateWebsiteFromTemplate(prompt, selectedTheme);
          setProgress(100);
        }
      } else {
        // Use advanced template generator (no API needed)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        generatedHTML = generateWebsiteFromTemplate(prompt, selectedTheme);
        
        clearInterval(progressInterval);
        setProgress(100);
        toast.success("Website generated with templates!");
      }

      console.log("📝 Setting generated code for preview...");
      console.log("Generated HTML length:", generatedHTML.length);
      console.log("Preview will show:", generatedHTML.substring(0, 150) + "...");
      setGeneratedCode(generatedHTML);
      console.log("✅ Code set! Preview should now display the website");
    } catch (error) {
      toast.error("Failed to generate website. Please try again.");
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleDownload = async () => {
    if (!generatedCode) {
      toast.error("No website to download");
      return;
    }

    try {
      const zip = new JSZip();

      // Create project structure
      zip.file("index.html", generatedCode);
      zip.file(
        "README.md",
        `# Generated Website\n\nTheme: ${selectedTheme}\n\nGenerated with AI React Website Generator\n\n## Usage\n\nOpen index.html in your browser to view the website.`
      );

      // Generate and download zip
      const content = await zip.generateAsync({ type: "blob" });
      
      // Create download link
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `website-${selectedTheme}-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Website downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download website");
      console.error("Download error:", error);
    }
  };

  const handleSaveConfig = (config: { geminiKey: string; webhookUrl: string }) => {
    setGeminiKey(config.geminiKey);
    setWebhookUrl(config.webhookUrl);
    localStorage.setItem("geminiKey", config.geminiKey);
    localStorage.setItem("webhookUrl", config.webhookUrl);
    
    if (config.webhookUrl) {
      toast.success("API key & webhook URL saved! n8n mode enabled. 🎉");
    } else {
      toast.success("API key saved! Using Direct API mode. 🎉");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="mb-2">Configure Your Website</h2>
                  <p className="text-sm text-muted-foreground">
                    Describe your ideal website and select a theme to get started
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApiDialogOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  API Setup
                </Button>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                {!geminiKey ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg flex-1">
                    <Badge variant="secondary">Template Mode</Badge>
                    <p className="text-sm text-muted-foreground">
                      Smart template generation (no AI)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg flex-1 border border-green-500/20">
                    <Badge className="bg-green-600">AI Mode Active</Badge>
                    <p className="text-sm text-muted-foreground">
                      {useDirectAPI || !webhookUrl ? "Direct Google Gemini API" : "Using n8n Webhook"}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {geminiKey && webhookUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUseDirectAPI(!useDirectAPI);
                        toast.info(useDirectAPI ? "Switched to n8n Webhook mode" : "Switched to Direct API mode (bypass n8n)", { duration: 3000 });
                      }}
                    >
                      {useDirectAPI ? "📡 Direct API" : "🔄 n8n Webhook"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDebugMode(!debugMode)}
                  >
                    {debugMode ? "🐛 Debug ON" : "Debug"}
                  </Button>
                </div>
              </div>

              <PromptInput
                value={prompt}
                onChange={setPrompt}
                disabled={isGenerating}
              />

              <ThemeSelector
                value={selectedTheme}
                onChange={setSelectedTheme}
                disabled={isGenerating}
              />

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate React Website
                  </>
                )}
              </Button>

              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    Creating your website...
                  </p>
                </div>
              )}

              {generatedCode && !isGenerating && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download as ZIP
                </Button>
              )}
            </Card>

            {/* Features Card */}
            <Card className="p-6">
              <h3 className="mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>100% Free - No credit card needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Powered by Google Gemini AI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Smart template fallback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>5 professional themes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Live preview & code view</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Download as ZIP</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Fully responsive websites</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <PreviewFrame code={generatedCode} isLoading={isGenerating} />
          </div>
        </div>
      </main>

      <Toaster />
      <ApiKeyDialog
        open={apiDialogOpen}
        onOpenChange={setApiDialogOpen}
        onSaveConfig={handleSaveConfig}
        currentGeminiKey={geminiKey}
        currentWebhookUrl={webhookUrl}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AppContent />
    </ThemeProvider>
  );
}
