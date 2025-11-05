import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Code2, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState } from "react";

interface PreviewFrameProps {
  code: string;
  isLoading: boolean;
}

export function PreviewFrame({ code, isLoading }: PreviewFrameProps) {
  const [showCode, setShowCode] = useState(false);

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
      {showCode ? (
        <div className="relative">
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
            <code className="text-sm">{code}</code>
          </pre>
        </div>
      ) : (
        <div className="relative">
        <iframe
  srcDoc={
    code.includes("<html")
      ? code
      : `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"></script>
<title>Generated Website</title>
</head>
<body class="bg-gray-900 text-gray-100 p-10">
${code}
</body>
</html>`
  }
  title="Website Preview"
  className="w-full h-[500px] border rounded-lg bg-white"
  sandbox="allow-scripts allow-same-origin"
/>

          <div className="text-xs text-muted-foreground mt-2 text-center">
            Preview loaded • {code.includes('<!DOCTYPE') ? '✓' : '✗'} Valid HTML • {code.includes('tailwindcss') ? '✓' : '✗'} Tailwind CSS
          </div>
        </div>
      )}
    </Card>
  );
}
