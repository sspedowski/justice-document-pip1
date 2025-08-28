# Justice Dashboard - Quick Start Guide

✅ Prerequisites Verified

Node.js installed ✅

Environment variables configured ✅

Dependencies installed ✅

🏃‍♂️ Quick Start (5 seconds)

Option A: Full Stack Development

cd justice-dashboard
npm run dev

This starts both frontend (port 5174) and backend (port 3000)

Option B: Backend Only

npm run dev:backend
OR
node server.js

Option C: Frontend Only (if backend is already running)

npm run dev:frontend

🔑 Login Credentials

Username: admin

Password: adminpass

🗋️ URLs

Frontend: [http://localhost:5174](http://localhost:5174)

Backend API: [http://localhost:3000](http://localhost:3000)

Health Check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

🧪 Validation & Testing

Validate environment setup
npm run validate

Test login endpoint
Invoke-RestMethod -Uri "[http://localhost:3000/api/login](http://localhost:3000/api/login)" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"adminpass"}'

🛠️ Troubleshooting

If login fails (401):

Check environment variables: npm run validate

Restart server: node server.js

Verify credentials in justice-server/.env

If uploads fail:

Ensure you're logged in first

Check browser console for errors

Verify CORS settings in server.js

If ports are in use:

Kill all Node processes
taskkill /F /IM node.exe

Restart
npm run dev

📁 Project Structure

justice-dashboard/
├── server.js                 # Entry point (redirects to justice-server)
├── justice-server/           # Backend API
│   ├── server.js            # Main server file
│   └── .env                 # Environment variables
├── justice-dashboard/        # Frontend
│   └── package.json         # Frontend dependencies
└── scripts/                 # Utility scripts
    ├── setup.sh/.bat        # Setup scripts
    └── validate-env.js       # Environment validation

🎉 Success Indicators

When everything is working, you should see:

✅ Server logs: "Justice server running at [http://localhost:3000](http://localhost:3000)"

✅ Frontend loads without errors

✅ Login with admin/adminpass succeeds

✅ Upload buttons appear after login

✅ PDF uploads process and show summaries

Happy Coding! 🚀
