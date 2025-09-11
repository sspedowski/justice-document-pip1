# 🚀 Justice Dashboard — Render Deployment Checklist

This checklist ensures every update is ready for smooth deployment to Render.

---

## 1️⃣ Pre-Push Checks

- [ ] **Frontend build runs locally**  

  ```bash
  cd justice-dashboard
  npm install
  npm run build
  ```http

- [ ] **Backend runs locally**

  ```bash
  cd justice-server
  npm install
  node server.js
  ```

- [ ] **Environment variables set in Render**
  - `NODE_ENV=production`
  - `JWT_SECRET` (auto-generated)
  - `SESSION_SECRET` (auto-generated)
  - `ADMIN_USERNAME` (set to secure value)
  - `ADMIN_PASSWORD` (auto-generated or secure value)
  - `OPENAI_API_KEY` (if used)

---

## 2️⃣ Deployment Steps

- [ ] Commit all changes

  ```bash
  git add .
  git commit -m "Render-ready deployment"
  ```

- [ ] Push to main (triggers Render auto-deploy)

  ```bash
  git push origin main
  ```

- [ ] Confirm Render build logs show:
  - ✅ Root dependencies installed
  - ✅ Backend dependencies installed
  - ✅ Frontend build successful
  - ✅ Files copied to `justice-server/public`

---

## 3️⃣ Post-Deploy Validation

- [ ] Health check:

  ```bash
  https://<your-render-app>.onrender.com/api/health
  ```

  Returns: `{"status": "UP"}`
- [ ] Frontend loads:

  ```bash
  https://<your-render-app>.onrender.com
  ```

- [ ] Login works with `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- [ ] Upload endpoint works:

  ```
  POST /api/summarize
  ```

- [ ] All routes respond correctly (SPA routing confirmed)

---

✅ **If all checks pass → Deployment is complete!**
