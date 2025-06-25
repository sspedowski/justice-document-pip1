# 🟢 Hosting the Justice Dashboard on Render

## Option 1: Deploy Full Stack (Express + Frontend)

1. Push your project to GitHub.

2. Go to https://dashboard.render.com

3. Click **"New Web Service"**

4. Choose:
   - **Repository:** your GitHub repo
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node`

5. In Render, under "Environment Variables", add:

```
KEY: OPENAI_API_KEY
VALUE: your-openai-api-key
```

6. Deploy. Your frontend and backend will be hosted under one domain.

---

## Option 2: Frontend on Vercel, Backend on Render

- Use Vercel (https://vercel.com) for just the `/client` folder
- Use Render for the Express server `/api` routes

This allows faster frontend updates and better scaling for the backend.