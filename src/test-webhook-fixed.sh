#!/bin/bash

# Test the FIXED webhook
# Replace YOUR_API_KEY with your real Gemini API key

WEBHOOK_URL="https://nikhil27.app.n8n.cloud/webhook/gemini-webhook"
API_KEY="YOUR_GEMINI_API_KEY_HERE"

echo "=================================="
echo "Testing FIXED n8n Webhook"
echo "=================================="
echo ""
echo "Webhook URL: $WEBHOOK_URL"
echo ""
echo "Sending test request..."
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"prompt\": \"Create a simple landing page for a coffee shop\",
    \"theme\": \"portfolio\",
    \"geminiKey\": \"$API_KEY\"
  }" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "=================================="
echo "Expected Success Response:"
echo "=================================="
echo '{'
echo '  "html": "<!DOCTYPE html>...",'
echo '  "success": true,'
echo '  "length": 3500,'
echo '  "model": "gemini-1.5-flash"'
echo '}'
echo ""
echo "=================================="
echo "Common Error Responses:"
echo "=================================="
echo ""
echo "❌ 404 Not Found:"
echo '   → Workflow not active or URL wrong'
echo ""
echo '❌ {"message":"workflow was started"}:'
echo '   → Change Response Mode to "When Last Webhook Node Executes"'
echo ""
echo '❌ {"message":"Error in workflow"}:'
echo '   → Check n8n Executions tab for specific error'
echo ""
echo "=================================="
echo "If you see HTML output above = SUCCESS! ✅"
echo "=================================="
