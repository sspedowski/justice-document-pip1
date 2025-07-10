# 🔗 API Integration Guide - Justice Dashboard

## 🚀 OpenAI + Wolfram Alpha Integration

### ✅ **Correct API Setup URLs**

#### 🤖 **OpenAI Setup**

1. **API Keys:** https://platform.openai.com/api-keys
2. **Documentation:** https://platform.openai.com/docs/
3. **Pricing:** https://openai.com/pricing

#### 🧮 **Wolfram Alpha Setup**

1. **Developer Portal:** https://developer.wolframalpha.com/portal/
2. **My Apps (Direct):** https://developer.wolframalpha.com/portal/myapps/index.html
3. **API Documentation:** https://products.wolframalpha.com/api/

> **⚠️ Important:** The old URL `https://developer.wolframalpha.com/portal/myapps` returns a 404 error. Use the correct URLs above.

---

## 📋 **Step-by-Step Setup**

### 1. **Get Your OpenAI API Key**

```bash
# 1. Go to: https://platform.openai.com/api-keys
# 2. Sign in with your OpenAI account
# 3. Click "Create new secret key"
# 4. Copy the key (starts with sk-...)
# 5. Add billing information for API usage
```

### 2. **Get Your Wolfram Alpha API Key**

```bash
# 1. Go to: https://developer.wolframalpha.com/portal/
# 2. Sign in with your Wolfram ID (or create account)
# 3. Click "My Apps" in the top navigation
# 4. Click "Create App" button
# 5. Fill out app details (name, description)
# 6. Get your AppID (this is your API key)
```

### 3. **Configure Environment Variables**

```bash
# Edit: justice-dashboard/.env
OPENAI_API_KEY=sk-your_openai_key_here
WOLFRAM_ALPHA_API_KEY=your_wolfram_appid_here
```

---

## 🧪 **Testing Your Integration**

### **Quick Test URLs:**

- **Frontend Test Page:** http://localhost:5174/api-test.html
- **Health Check:** http://localhost:3000/api/health
- **Integration Test:** `POST http://localhost:3000/api/test-integrations`

### **Sample API Calls:**

#### **OpenAI Test:**

```javascript
const response = await fetch('/api/test-integrations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    testQuery: 'analyze constitutional violations in legal document',
  }),
});
```

#### **Wolfram Alpha Test:**

```bash
# Direct API call example:
curl "https://api.wolframalpha.com/v2/query?input=timeline%20analysis%20of%20dates%201/15/2023%202/20/2023&appid=YOUR_APPID&format=plaintext&output=JSON"
```

---

## 📊 **API Response Examples**

### **Enhanced Analysis Response:**

```json
{
  "fileName": "court_order.pdf",
  "basicClassification": {
    "category": "Court Order",
    "child": "Jace",
    "misconduct": "Constitutional Violation"
  },
  "enhancedAnalysis": {
    "analysis": {
      "aiSummary": "Court order regarding due process violations...",
      "keyEntities": [
        { "name": "Due Process", "type": "statute", "relevance": "high" },
        { "name": "01/15/2023", "type": "date", "relevance": "high" }
      ]
    },
    "wolfram": {
      "dateAnalysis": {
        "success": true,
        "result": [
          { "title": "Timeline", "content": "Events span 6 months" },
          { "title": "Duration", "content": "185 days between dates" }
        ]
      },
      "numericalAnalysis": {
        "success": true,
        "result": [
          { "title": "Statistics", "content": "5 violations identified" },
          { "title": "Frequency", "content": "Average 1 violation per month" }
        ]
      }
    },
    "confidence": {
      "overall": 0.82,
      "aiSummary": 0.85,
      "wolframAnalysis": 0.78
    }
  }
}
```

---

## 🔧 **Available Endpoints**

| Endpoint                 | Method | Description                              |
| ------------------------ | ------ | ---------------------------------------- |
| `/api/health`            | GET    | Check server and API status              |
| `/api/test-integrations` | POST   | Test both OpenAI and Wolfram APIs        |
| `/api/analyze-enhanced`  | POST   | Full document analysis with AI + Wolfram |
| `/api/summarize`         | POST   | Basic document processing (legacy)       |
| `/api/report-error`      | POST   | Error reporting system                   |

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **404 Error on Wolfram Portal:**
   - ✅ Use: https://developer.wolframalpha.com/portal/
   - ❌ Avoid: https://developer.wolframalpha.com/portal/myapps

2. **API Key Not Working:**
   - Check .env file location and format
   - Restart backend server after adding keys
   - Verify API key format (OpenAI: sk-..., Wolfram: alphanumeric)

3. **Network Errors:**
   - Check if both servers are running (ports 3000 & 5174)
   - Verify Vite proxy configuration
   - Check firewall/antivirus blocking

### **Debug Commands:**

```bash
# Check server status
curl http://localhost:3000/api/health

# Test API integrations
curl -X POST http://localhost:3000/api/test-integrations \
  -H "Content-Type: application/json" \
  -d '{"testQuery": "test wolfram and openai"}'
```

---

## 💡 **Next Steps**

1. **Get API Keys** using the correct URLs above
2. **Test Integration** at http://localhost:5174/api-test.html
3. **Upload a PDF** to see enhanced analysis in action
4. **Check Results** for AI summary + computational analysis

**Questions?** The test page provides real-time feedback and error messages to help debug any issues.
