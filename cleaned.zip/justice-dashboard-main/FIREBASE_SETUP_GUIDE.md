# Firebase Setup Guide for Justice Dashboard

## Steps to Create and Configure Firebase

### 1. Create a new Firebase project
Open your browser and go to: https://console.firebase.google.com
- Click "Create a project"
- Enter project name: "justice-dashboard" 
- Choose your settings (Analytics optional)
- Click "Create project"

### 2. Enable Firestore Database
- In the Firebase console, go to "Firestore Database"
- Click "Create database"
- Choose "Start in test mode" (for development)
- Select a location close to you
- Click "Done"

### 3. Get your Firebase configuration
- Go to Project Settings (gear icon)
- Scroll down to "Your apps"
- Click "Add app" and choose "Web" (</>) 
- Register your app with name "Justice Dashboard"
- Copy the firebaseConfig object

### 4. Update your .env file
Replace the placeholder values in your .env file with the actual values from step 3:

```
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

### 5. Initialize Firebase in your project
After creating the project online, run:
```bash
firebase init
```

Choose:
- Firestore: Configure security rules and indexes files for Firestore
- Hosting: Configure files for Firebase Hosting (optional)

### 6. PowerShell Commands to Test
```powershell
# Test the backend server
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET

# Test the frontend (after starting dev server)
Invoke-WebRequest -Uri "http://localhost:5173" -Method GET
```
