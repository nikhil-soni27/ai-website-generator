import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Code2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState, useEffect } from "react";

interface PreviewFrameProps {
  code: string;
  isLoading: boolean;
}

export function PreviewFrame({ code, isLoading }: PreviewFrameProps) {
  const [showCode, setShowCode] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Force iframe reload when code changes
  useEffect(() => {
    if (code) {
      setIframeKey(prev => prev + 1);
    }
  }, [code]);

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3>Preview</h3>
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </Card>
    );
  }

  if (!code) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
          <ExternalLink className="h-16 w-16 mb-4 opacity-20" />
          <p>Your generated website will appear here</p>
        </div>
      </Card>
    );
  }

  // Check if code has proper HTML structure and prepare it for display
  const hasHtmlTag = code.includes('<html');
  const hasTailwind = code.includes('tailwindcss');
  const hasDoctype = code.includes('<!DOCTYPE');

  // If it's a complete HTML document, use it as is, otherwise wrap it
  const processedCode = hasDoctype ? code : code;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3>Preview</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {code.length.toLocaleString()} chars
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            <Code2 className="h-4 w-4 mr-2" />
            {showCode ? "Show Preview" : "Show Code"}
          </Button>
        </div>
      </div>

      {/* Validation Warnings */}
      {!hasHtmlTag && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-yellow-700">Warning: No HTML structure detected</span>
        </div>
      )}

      {showCode ? (
        <div className="relative">
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
            <code className="text-sm">{code}</code>
          </pre>
        </div>
      ) : (
        <div className="relative">
          <iframe
            key={iframeKey}
            srcDoc={hasDoctype ? code : `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <script src="https://cdn.tailwindcss.com?v=3.4.0"></script>
                  <script>
                    /* Ensure the preview loads with proper height */
                    html, body { min-height: 100vh; margin: 0; }
                  </style>
                  <script>
                    // Ensure Tailwind is loaded
                    window.addEventListener('load', function() {
                      // Force a re-render after Tailwind loads
                      setTimeout(() => {
                        document.body.style.opacity = '0.99';
                        setTimeout(() => document.body.style.opacity = '1', 10);
                      }, 100);
                    });
                  </script>
                </head>
                <body>
                  ${code}
                </body>
              </html>
            `}
            title="Website Preview"
            className="w-full h-[800px] border rounded-lg"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            style={{ border: '1px solid #e5e7eb', minHeight: '800px' }}
          />
          <div className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-4">
            <span>Preview loaded</span>
            <span className={hasDoctype ? 'text-green-600' : 'text-red-600'}>
              {hasDoctype ? '✓' : '✗'} Valid HTML
            </span>
            <span className={hasTailwind ? 'text-green-600' : 'text-red-600'}>
              {hasTailwind ? '✓' : '✗'} Tailwind CSS
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIframeKey(prev => prev + 1)}
              className="h-6 text-xs"
            >
              🔄 Reload
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}