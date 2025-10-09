# Authentication Migration Plan

## Current State

- Auth handled via static `users.json` file
- Basic username/password check in middleware/API routes
- No session management, password hashing, or token refresh

## Migration Path: Firebase Authentication

### Why Firebase?

- Already using Firebase services (`firebase` + `firebase-admin` in dependencies)
- Built-in security with proper password hashing and token management
- Simple integration with Next.js via `getAuth()` and server-side `verifyIdToken()`
- No additional infrastructure needed

### Implementation Steps

#### Phase 1: Setup (Dev)

1. **Environment Variables** (add to `.env.local` and `.env.example`)
   ```bash
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=service-account-email
   FIREBASE_PRIVATE_KEY=service-account-key
   FIREBASE_API_KEY=web-api-key
   FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
   ```

2. **Server-side Auth Helper** (`lib/auth/firebase-admin.ts`)
   ```typescript
   import { initializeApp, getApps, cert } from 'firebase-admin/app';
   import { getAuth } from 'firebase-admin/auth';

   if (!getApps().length) {
     initializeApp({
       credential: cert({
         projectId: process.env.FIREBASE_PROJECT_ID,
         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
         privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
       }),
     });
   }

   export async function verifyToken(token: string) {
     return getAuth().verifyIdToken(token);
   }
   ```

3. **Client-side Auth Context** (`lib/auth/firebase-client.ts`)
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

   const app = initializeApp({
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
   });

   export const auth = getAuth(app);
   export { signInWithEmailAndPassword };
   ```

#### Phase 2: Middleware Update

Update `middleware.ts` to check Firebase session cookies instead of `users.json`:

```typescript
import { verifyToken } from '@/lib/auth/firebase-admin';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}
```

#### Phase 3: Login Page

Create `/app/login/page.tsx` with Firebase sign-in:

```typescript
'use client';
import { signInWithEmailAndPassword } from '@/lib/auth/firebase-client';

export default function LoginPage() {
  const handleLogin = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    // Send token to API to set session cookie
    await fetch('/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    window.location.href = '/dashboard';
  };
  // ... form UI
}
```

#### Phase 4: Session API Route

Create `/app/api/auth/session/route.ts`:

```typescript
import { verifyToken } from '@/lib/auth/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { token } = await req.json();

  try {
    const decodedToken = await verifyToken(token);
    const cookieStore = await cookies();

    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      path: '/',
    });

    return Response.json({ success: true, uid: decodedToken.uid });
  } catch (error) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

#### Phase 5: User Migration

Migrate existing `users.json` users to Firebase:

```bash
# Use Firebase Admin SDK to create users
npm run migrate:users
```

Script: `tools/migrate-users.mjs`:
```javascript
import { getAuth } from 'firebase-admin/auth';
import users from '../users.json' assert { type: 'json' };

for (const user of users) {
  await getAuth().createUser({
    email: user.email,
    password: user.password, // Use secure temp passwords, force reset
    displayName: user.name,
  });
}
```

### Rollout Strategy

1. **Dev**: Test Firebase auth locally with test users
2. **Preview**: Deploy to Vercel preview with `FIREBASE_*` secrets set in environment
3. **Production**:
   - Add Firebase secrets to Vercel production environment
   - Run user migration script
   - Deploy with new auth flow
   - Monitor error rates and fallback if needed

### Rollback Plan

- Keep `users.json` in repo but unused
- If Firebase fails, revert middleware change to re-enable JSON auth
- Session cookies will gracefully fail and redirect to login

### Security Improvements

✅ Proper password hashing (Firebase handles)
✅ Token expiration and refresh
✅ HttpOnly cookies (XSS protection)
✅ Secure flag in production
✅ Rate limiting via Firebase (built-in)
✅ Email verification support
✅ Password reset flows

---

## Alternative: NextAuth.js

If Firebase is not desired, NextAuth provides:
- Credentials provider (for existing user system)
- OAuth providers (Google, GitHub, etc.)
- Database session storage (Prisma adapter)

Trade-offs:
- More setup complexity
- Need database for session persistence
- More flexible provider options

---

## Next Steps

1. ✅ Document migration plan (this file)
2. ⏳ Set up Firebase project and get credentials
3. ⏳ Implement Phase 1 (helpers)
4. ⏳ Implement Phase 2-4 (middleware, login, session)
5. ⏳ Test in dev environment
6. ⏳ Deploy to preview and verify
7. ⏳ Migrate users and deploy to production
