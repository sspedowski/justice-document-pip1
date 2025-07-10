# Firebase Setup Guide for Justice Dashboard

## Phase 1: Firebase Project Creation & Basic Setup

### Step 1: Create Firebase Project
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Project name: `justice-dashboard`
4. Enable Google Analytics (recommended)
5. Choose default account for analytics
6. Click "Create project"

### Step 2: Enable Required Services
```bash
# In Firebase Console:
# 1. Firestore Database
#    - Go to "Firestore Database" 
#    - Click "Create database"
#    - Start in "test mode" (we'll secure later)
#    - Choose location (us-central1 recommended)

# 2. Authentication (optional but recommended)
#    - Go to "Authentication"
#    - Click "Get started"
#    - Enable "Email/Password" provider

# 3. Storage (for file uploads)
#    - Go to "Storage"
#    - Click "Get started"
#    - Start in test mode
```

### Step 3: Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Add app" → Web (</>) 
4. App nickname: "Justice Dashboard Web"
5. Enable Firebase Hosting (optional)
6. **Copy the firebaseConfig object**

### Step 4: Update Environment Variables
Replace the dummy values in your `.env` file with real config:

```env
# Replace these with your actual Firebase config values:
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=justice-dashboard-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=justice-dashboard-xxxx
VITE_FIREBASE_STORAGE_BUCKET=justice-dashboard-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcd1234567890
```

## Phase 2: Cloud Functions Setup

### Step 1: Initialize Firebase Functions
```bash
cd c:\Users\ssped\justice-dashboard\justice-dashboard
firebase init functions
# Choose:
# - Use existing project: justice-dashboard-xxxx
# - Language: JavaScript
# - ESLint: Yes
# - Install dependencies: Yes
```

### Step 2: Install Required Dependencies
```bash
cd functions
npm install openai pdf-parse tesseract.js axios
```

## Phase 3: Firestore Security Rules

### Step 1: Configure Firestore Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write case documents
    match /cases/{caseId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write document analysis
    match /document_analysis/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Phase 4: Integration Points

### Backend Server Integration
- Add Firebase Admin SDK to your Express server
- Store document analysis results in Firestore
- Enable real-time updates for document processing

### Frontend Integration  
- Connect document upload to Firestore
- Add real-time document status updates
- Implement user authentication (optional)

## Phase 5: Cloud Functions for Document Processing

### Proposed Functions:
1. **analyzeDocument** - Process uploaded PDFs with OpenAI
2. **extractLegalStatutes** - Identify relevant legal codes
3. **generateSummary** - Create document summaries
4. **notifyCompletion** - Send processing completion notifications

## Security Considerations

### Environment Variables
- Store API keys in Firebase Functions config
- Never expose sensitive keys in client-side code
- Use Firebase Security Rules for data access

### Data Privacy
- Encrypt sensitive document content
- Implement proper user access controls
- Log all document access for audit trails

## Monitoring & Analytics

### Firebase Console Monitoring
- Function execution logs
- Firestore usage metrics
- Error tracking and alerts

### Performance Optimization
- Implement document caching
- Optimize Firestore queries
- Use Firebase Performance Monitoring

## Cost Management

### Firestore Usage
- Optimize read/write operations
- Use subcollections for large datasets
- Implement pagination for document lists

### Cloud Functions
- Set memory/timeout limits appropriately
- Monitor execution costs
- Implement caching to reduce function calls
