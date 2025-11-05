#!/bin/bash

# Test n8n Webhook for AI Website Generator
# Usage: ./test-webhook.sh

echo "==================================="
echo "n8n Webhook Test Script"
echo "==================================="
echo ""

# Configuration
read -p "Enter your n8n webhook URL: " WEBHOOK_URL
read -p "Enter your Gemini API key: " API_KEY

echo ""
echo "Testing webhook..."
echo "URL: $WEBHOOK_URL"
echo ""

# Test the webhook
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"Create a simple landing page with a blue header\",
    \"theme\": \"Portfolio\",
    \"geminiKey\": \"$API_KEY\"
  }")

echo "==================================="
echo "Response:"
echo "==================================="
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if response contains HTML
if echo "$RESPONSE" | grep -q "<!DOCTYPE"; then
  echo "✅ SUCCESS! Response contains HTML"
  echo ""
  echo "HTML Length: $(echo "$RESPONSE" | jq -r '.length' 2>/dev/null || echo "unknown")"
  echo "Success: $(echo "$RESPONSE" | jq -r '.success' 2>/dev/null || echo "unknown")"
elif echo "$RESPONSE" | grep -q '"html"'; then
  echo "✅ SUCCESS! Response has 'html' field"
  HTML_LENGTH=$(echo "$RESPONSE" | jq -r '.html | length' 2>/dev/null)
  echo "HTML Length: $HTML_LENGTH characters"
else
  echo "❌ FAILED! Response doesn't contain HTML"
  echo ""
  if echo "$RESPONSE" | grep -q '"candidates"'; then
    echo "⚠️  Response has 'candidates' - workflow isn't extracting HTML!"
    echo "⚠️  Check the 'Extract HTML' node in your n8n workflow"
  fi
  if echo "$RESPONSE" | grep -q "Hi!"; then
    echo "⚠️  Gemini returned conversational response instead of HTML!"
    echo "⚠️  Prompt isn't reaching Gemini API correctly"
    echo "⚠️  Check n8n execution logs to see what prompt was sent"
  fi
fi

echo ""
echo "==================================="
echo "Debugging Info:"
echo "==================================="

# Check for common issues
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "❌ Error in response:"
  echo "$RESPONSE" | jq -r '.error' 2>/dev/null
fi

if echo "$RESPONSE" | grep -q '"status": "failed"'; then
  echo "❌ Workflow status: FAILED"
fi

# Check token count
TOKENS=$(echo "$RESPONSE" | jq -r '.usageMetadata.promptTokenCount' 2>/dev/null)
if [ "$TOKENS" != "null" ] && [ -n "$TOKENS" ]; then
  echo "Prompt Tokens: $TOKENS"
  if [ "$TOKENS" -lt 50 ]; then
    echo "⚠️  Token count is too low! Prompt likely not being sent correctly"
    echo "⚠️  Expected: 200+ tokens for HTML generation prompt"
  fi
fi

echo ""
echo "==================================="
echo "Next Steps:"
echo "==================================="
if echo "$RESPONSE" | grep -q '"html"'; then
  echo "✅ Webhook is working! You can now use it in the React app"
else
  echo "1. Check n8n workflow execution logs"
  echo "2. Verify 'Response Mode' is 'When Last Node Finishes'"
  echo "3. Check Gemini API node's JSON body template"
  echo "4. See WEBHOOK_FIX_COMPLETE.md for detailed debugging"
fi
echo ""
