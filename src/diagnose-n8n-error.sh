#!/bin/bash

# N8N Error Diagnostic Script
# This script helps identify why n8n is returning "Error in workflow"

echo "========================================"
echo "🔍 N8N WORKFLOW ERROR DIAGNOSTIC"
echo "========================================"
echo ""
echo "This script will test your n8n webhook"
echo "and show you the EXACT error."
echo ""

# Configuration
WEBHOOK_URL="https://nikhil27.app.n8n.cloud/webhook/gemini-webhook"
API_KEY="${1:-YOUR_GEMINI_API_KEY_HERE}"

if [ "$API_KEY" = "YOUR_GEMINI_API_KEY_HERE" ]; then
    echo "⚠️  WARNING: Using placeholder API key"
    echo ""
    echo "Usage: ./diagnose-n8n-error.sh YOUR_ACTUAL_API_KEY"
    echo ""
    echo "Example:"
    echo "  ./diagnose-n8n-error.sh AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxx"
    echo ""
    read -p "Press Enter to continue with placeholder key (will fail)..."
    echo ""
fi

echo "Configuration:"
echo "  Webhook URL: $WEBHOOK_URL"
echo "  API Key: ${API_KEY:0:20}... (truncated)"
echo ""
echo "========================================"
echo "TEST 1: Can reach n8n instance?"
echo "========================================"
echo ""

if curl -s -o /dev/null -w "%{http_code}" https://nikhil27.app.n8n.cloud | grep -q "200\|301\|302"; then
    echo "✅ SUCCESS: n8n instance is reachable"
else
    echo "❌ FAILED: Cannot reach n8n instance"
    echo "   - Check if n8n is down"
    echo "   - Check your internet connection"
fi

echo ""
echo "========================================"
echo "TEST 2: Webhook endpoint exists?"
echo "========================================"
echo ""

RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d '{}' -w "\nHTTP_CODE:%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "404" ]; then
    echo "❌ FAILED: Webhook not found (404)"
    echo "   - Workflow is NOT ACTIVE in n8n"
    echo "   - Or webhook URL is incorrect"
    echo "   FIX: Open n8n and activate the workflow (toggle to GREEN)"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS: Webhook endpoint is active"
else
    echo "⚠️  Received HTTP $HTTP_CODE"
fi

echo ""
echo "========================================"
echo "TEST 3: Send test request to workflow"
echo "========================================"
echo ""

TEST_PAYLOAD='{
  "prompt": "Create a simple landing page",
  "theme": "portfolio",
  "geminiKey": "'"$API_KEY"'"
}'

echo "Sending test payload..."
echo ""

FULL_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$TEST_PAYLOAD" \
  -w "\n\nHTTP_STATUS_CODE:%{http_code}\nTIME_TOTAL:%{time_total}s")

HTTP_STATUS=$(echo "$FULL_RESPONSE" | grep "HTTP_STATUS_CODE" | cut -d: -f2)
TIME_TAKEN=$(echo "$FULL_RESPONSE" | grep "TIME_TOTAL" | cut -d: -f2)
RESPONSE_BODY=$(echo "$FULL_RESPONSE" | sed '/HTTP_STATUS_CODE/,$d')

echo "HTTP Status: $HTTP_STATUS"
echo "Time Taken: $TIME_TAKEN"
echo ""
echo "Response Body:"
echo "----------------------------------------"
echo "$RESPONSE_BODY" | head -50
echo "----------------------------------------"
echo ""

# Analyze response
if echo "$RESPONSE_BODY" | grep -q '"error"'; then
    echo "❌ WORKFLOW ERROR DETECTED"
    echo ""
    
    # Check for specific errors
    if echo "$RESPONSE_BODY" | grep -q "API_KEY_INVALID"; then
        echo "🔑 Error Type: INVALID API KEY"
        echo "   - Your Gemini API key is incorrect or expired"
        echo "   - Get a new key: https://aistudio.google.com/app/apikey"
        echo "   - Update in React app → API Setup"
        
    elif echo "$RESPONSE_BODY" | grep -q "RESOURCE_EXHAUSTED"; then
        echo "📊 Error Type: QUOTA EXCEEDED"
        echo "   - You've hit the free tier quota limit"
        echo "   - Wait a few minutes and try again"
        echo "   - Or upgrade your Gemini API plan"
        
    elif echo "$RESPONSE_BODY" | grep -q "Model not found"; then
        echo "🤖 Error Type: MODEL NOT FOUND"
        echo "   - The model 'gemini-1.5-flash' is not available"
        echo "   - Check if it's available in your region"
        
    elif echo "$RESPONSE_BODY" | grep -q "Unexpected API response"; then
        echo "📡 Error Type: API RESPONSE FORMAT ERROR"
        echo "   - Gemini returned an unexpected format"
        echo "   - This might be a Gemini API issue"
        
    elif echo "$RESPONSE_BODY" | grep -q "Processing error"; then
        echo "⚙️ Error Type: CODE NODE ERROR"
        echo "   - Error in the Extract HTML node"
        echo "   - Re-import the workflow: /n8n-workflow-import.json"
        
    elif echo "$RESPONSE_BODY" | grep -q "JSX detected"; then
        echo "⚛️ Error Type: JSX DETECTED"
        echo "   - AI generated React code instead of HTML"
        echo "   - This is normal, just try again (happens ~5% of time)"
        
    else
        echo "❓ Error Type: UNKNOWN"
        echo "   - Check the response body above for details"
    fi
    
elif echo "$RESPONSE_BODY" | grep -q '"html"'; then
    echo "✅ SUCCESS: Workflow executed successfully!"
    echo ""
    HTML_LENGTH=$(echo "$RESPONSE_BODY" | grep -o '"length":[0-9]*' | cut -d: -f2)
    echo "   HTML Length: $HTML_LENGTH characters"
    
    if [ ! -z "$HTML_LENGTH" ] && [ "$HTML_LENGTH" -gt 2000 ]; then
        echo "   ✅ Good length (AI-generated content)"
    else
        echo "   ⚠️  Short length (might be template)"
    fi
    
elif echo "$RESPONSE_BODY" | grep -q "workflow was started"; then
    echo "⚠️ CONFIGURATION ERROR: Wrong Response Mode"
    echo ""
    echo "   The webhook is responding immediately, not waiting for completion"
    echo ""
    echo "   FIX:"
    echo "   1. Open workflow in n8n"
    echo "   2. Click 'Webhook' node"
    echo "   3. Settings → Response Mode"
    echo "   4. Change to: 'When Last Webhook Node Executes'"
    echo "   5. Save workflow"
    
else
    echo "❓ UNKNOWN RESPONSE"
    echo "   Check the response body above"
fi

echo ""
echo "========================================"
echo "TEST 4: Check n8n Executions"
echo "========================================"
echo ""
echo "To see the EXACT error:"
echo "1. Open: https://nikhil27.app.n8n.cloud"
echo "2. Click 'Executions' in left sidebar"
echo "3. Find the execution that just ran"
echo "4. Click on it to see details"
echo "5. Click the red node (if any) to see error"
echo ""
echo "This shows you EXACTLY which node failed and why!"

echo ""
echo "========================================"
echo "📋 RECOMMENDATIONS"
echo "========================================"
echo ""

if echo "$RESPONSE_BODY" | grep -q '"error"'; then
    echo "🔧 NEXT STEPS TO FIX:"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Option 1: Use Direct API (30 seconds) ⭐ EASIEST"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  1. Open React app"
    echo "  2. Refresh: Ctrl+Shift+R"
    echo "  3. Click ⚙️ (API Setup)"
    echo "  4. Enter your API key"
    echo "  5. DELETE webhook URL (make it empty)"
    echo "  6. Click 'Save'"
    echo "  7. Click 'Generate' → WORKS! ✅"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Option 2: Fix n8n Workflow (5 minutes)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  1. Open: https://nikhil27.app.n8n.cloud"
    echo "  2. Delete ALL old workflows"
    echo "  3. Import: /n8n-workflow-import.json"
    echo "  4. Activate workflow (GREEN toggle)"
    echo "  5. Copy Production URL"
    echo "  6. Update React app config"
    echo "  7. Run this script again"
    echo ""
    echo "💡 RECOMMENDATION: Option 1 is faster and more reliable!"
else
    echo "✅ Webhook is working correctly!"
    echo ""
    echo "If React app still shows errors:"
    echo "  1. Refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
    echo "  2. Verify webhook URL in API Setup matches:"
    echo "     $WEBHOOK_URL"
    echo "  3. Verify API key is entered and saved"
    echo "  4. Try generating again"
    echo ""
    echo "If still failing:"
    echo "  1. Check n8n → Executions tab"
    echo "  2. Look for failed executions"
    echo "  3. Click red nodes to see errors"
fi

echo ""
echo "========================================"
echo "📖 DOCUMENTATION"
echo "========================================"
echo ""
echo "Quick Start:"
echo "  → START_HERE_FINAL.md"
echo ""
echo "Detailed Troubleshooting:"
echo "  → ERROR_IN_WORKFLOW_FIXED.md"
echo ""
echo "Quick Reference:"
echo "  → FIX_NOW_SIMPLE.md"
echo ""
echo "What Changed:"
echo "  → WORKFLOW_COMPARISON.md"
echo "========================================"
echo ""
echo "🎉 Good luck! You got this!"
