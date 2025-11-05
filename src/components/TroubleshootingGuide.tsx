import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

export function TroubleshootingGuide() {
  return (
    <Card className="p-6">
      <h3 className="mb-4">🔧 Quick Troubleshooting</h3>
      
      <div className="space-y-4">
        {/* Issue 1 */}
        <div className="border-l-4 border-red-500 pl-4 py-2">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">Getting Template Fallback?</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground ml-7">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Step 1</Badge>
              <p>Check webhook URL: Must be <code className="bg-muted px-1 rounded">/webhook/</code> not <code className="bg-muted px-1 rounded">/webhook-test/</code></p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Step 2</Badge>
              <p>In n8n: Webhook node → Response Mode → "When Last Node Finishes"</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Step 3</Badge>
              <p>Click "Test Webhook Setup" to diagnose</p>
            </div>
          </div>
        </div>

        {/* Issue 2 */}
        <div className="border-l-4 border-yellow-500 pl-4 py-2">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">"Failed to fetch" Error?</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground ml-7">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <p>Workflow must be <span className="text-green-600 font-medium">ACTIVE</span> (green toggle in n8n)</p>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <p>Verify n8n is accessible at your domain</p>
            </div>
          </div>
        </div>

        {/* Issue 3 */}
        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">"workflow was started" Message?</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground ml-7">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <p><strong>Critical:</strong> Wrong response mode in Webhook node</p>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <p>Fix: Set to "When Last Node Finishes"</p>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <p>See <code className="bg-muted px-1 rounded">N8N_EXACT_FIX.md</code> for details</p>
            </div>
          </div>
        </div>

        {/* Success Indicators */}
        <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm text-green-800 dark:text-green-400">
                Everything Working? You'll See:
              </p>
            </div>
          </div>
          <div className="space-y-1 text-sm text-green-700 dark:text-green-500 ml-7">
            <p>✓ Toast: "Website generated with AI!"</p>
            <p>✓ Unique website (not template)</p>
            <p>✓ Preview loads in 10-30 seconds</p>
            <p>✓ All diagnostic checks pass</p>
          </div>
        </div>

        {/* Quick Action */}
        <div className="bg-muted p-3 rounded-lg text-sm">
          <p className="font-medium mb-2">🎯 Quick Fix (90% of issues):</p>
          <ol className="space-y-1 ml-4 list-decimal text-muted-foreground">
            <li>Change URL from <code>/webhook-test/</code> to <code>/webhook/</code></li>
            <li>Set Webhook Response Mode to "When Last Node Finishes"</li>
            <li>Make sure workflow is ACTIVE (green)</li>
            <li>Test with the diagnostic tool</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}
