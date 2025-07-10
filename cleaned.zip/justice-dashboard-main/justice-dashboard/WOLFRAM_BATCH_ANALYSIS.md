# 📊 Wolfram Batch Analysis for Justice Dashboard

## 🔍 **Analysis of Your Current Batch File**

### **Your Original Format (`wolfram_batch.json`):**

```jsonl
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Integrate x^2"}]}
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Calories in a Big Mac"}]}
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Plot sin(x) from 0 to 2π"}]}
```

### **Adapted for Legal Document Analysis:**

```jsonl
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Calculate duration between January 15, 2023 and March 20, 2023"}]}
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Statistical analysis of 5 constitutional violations over 6 months"}]}
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Timeline analysis of court hearing dates: 1/15/2023, 2/20/2023, 3/15/2023"}]}
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Pattern analysis of legal terms: due process, constitutional, violation, hearing"}]}
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Frequency analysis of CPS complaints filed in 2020"}]}
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Calculate average time between court orders and compliance dates"}]}
```

---

## 🎯 **Integration with Justice Dashboard**

### **How Your Batch Format is Processed:**

1. **Input Parsing:** Each line is parsed as separate JSON object
2. **Query Extraction:** Content extracted from `messages[0].content`
3. **Wolfram Analysis:** Each query sent to Wolfram Alpha API
4. **AI Context:** Optional OpenAI interpretation of results
5. **Batch Results:** Combined analysis with timing and success rates

### **Processing Flow:**

```
Your JSONL Format → Query Extraction → Wolfram Alpha → AI Context → Results
```

---

## 📋 **Available Processing Options**

### **Option 1: Manual Batch Queries**

- Enter queries directly in text area
- One query per line
- Immediate processing

### **Option 2: Upload Batch File**

- Upload `.json`, `.jsonl`, or `.txt` files
- Automatic format detection
- Support for your existing format

### **Option 3: Your Wolfram Format**

- **NEW!** Direct support for your exact format
- Copy/paste from your `wolfram_batch.json`
- Maintains compatibility with your existing workflow

---

## 🧪 **Test Your Batch Processing**

### **Test URLs:**

- **Interface:** http://localhost:5174/api-test.html
- **Direct API:** `POST http://localhost:3000/api/batch-analyze`

### **Example API Call:**

```bash
curl -X POST http://localhost:3000/api/batch-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "queries": [
      "Calculate duration between January 15, 2023 and March 20, 2023",
      "Statistical analysis of 5 constitutional violations"
    ],
    "analysisType": "wolfram-batch-format"
  }'
```

### **Expected Response:**

```json
{
  "timestamp": "2025-07-02T05:07:14.959Z",
  "analysisType": "wolfram-batch-format",
  "totalQueries": 2,
  "results": [
    {
      "queryIndex": 1,
      "query": "Calculate duration between January 15, 2023 and March 20, 2023",
      "wolfram": {
        "success": true,
        "result": [
          { "title": "Result", "content": "64 days" },
          { "title": "Duration", "content": "2 months 5 days" }
        ]
      },
      "aiInterpretation": "The time period spans approximately 2 months",
      "status": "success"
    }
  ],
  "summary": {
    "successful": 2,
    "failed": 0,
    "executionTime": 1250
  }
}
```

---

## 🔧 **Query Categories for Legal Analysis**

### **Timeline Analysis:**

```jsonl
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Calculate duration between court filing date 1/15/2023 and hearing date 3/20/2023"}]}
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Timeline analysis of CPS complaint dates: 2/20/2018, 3/13/2020, 5/23/2020"}]}
```

### **Statistical Analysis:**

```jsonl
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Statistical analysis of 12 constitutional violations over 24-month period"}]}
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Frequency analysis of due process violations in child custody cases"}]}
```

### **Pattern Recognition:**

```jsonl
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Pattern analysis of legal terms: constitutional, violation, due process, hearing, evidence"}]}
{"model": "gpt-4-0613", "messages": [{"role": "user", "content": "Trend analysis of court order compliance rates over time"}]}
```

---

## 🚀 **Converting Your Existing Queries**

### **Your Mathematical Queries → Legal Equivalents:**

| Your Original                | Legal Equivalent                                                         |
| ---------------------------- | ------------------------------------------------------------------------ |
| `"Integrate x^2"`            | `"Calculate total violation incidents over time period"`                 |
| `"Calories in a Big Mac"`    | `"Average duration of child custody cases in Michigan"`                  |
| `"Plot sin(x) from 0 to 2π"` | `"Timeline visualization of case progression from filing to resolution"` |

### **Batch Conversion Tool:**

The Justice Dashboard can automatically convert your mathematical queries to legal analysis equivalents while maintaining the same JSONL format structure.

---

## ✅ **Ready to Use**

1. **Copy your existing `wolfram_batch.json` content**
2. **Paste into Option 3 on the test page**
3. **Click "Process Wolfram Format"**
4. **View batch analysis results**

Your existing workflow is now compatible with legal document analysis! 🎉
