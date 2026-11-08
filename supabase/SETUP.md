# Cloud login (Gmail) + live sync — setup (about 15 minutes)

Without keys the app runs in **local demo mode** (email/mobile + password, data in this browser only).
With the two keys below it switches to **cloud mode**: Gmail sign-in, roles/permissions/vouchers/branding stored in Supabase and synced live to every signed-in device.

1. **Create project** at https://supabase.com → New project.
2. **Database**: SQL Editor → open `supabase/schema.sql`, replace `YOUR_GMAIL@gmail.com` (and the name) with the first Admin's Gmail, Run.
3. **Google sign-in**: 
   - Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web).
   - Authorized redirect URI = `https://<your-project>.supabase.co/auth/v1/callback`.
   - Supabase → Authentication → Providers → Google → enable, paste Client ID + Secret.
4. **URLs**: Supabase → Authentication → URL Configuration → Site URL = your hosted app URL (add `http://localhost:3000` to Redirect URLs for testing).
5. **Keys**: Supabase → Project Settings → API. Copy `.env.example` to `.env`:
   ```
   VITE_SUPABASE_URL="https://<your-project>.supabase.co"
   VITE_SUPABASE_ANON_KEY="<anon public key>"
   ```
6. `npm install && npm run build`, then host the `dist` folder (Netlify / Vercel / any static host). Redeploy after changing `.env`.
7. Sign in with the Admin Gmail → **Roles & Access** → add each person's Gmail + role. Only added Gmail addresses can enter; everyone else sees "Access not granted". Changes appear on other devices within seconds.

Notes
- Permissions are enforced on the server (Postgres RLS), not just hidden in the UI.
- Attachments are stored inside voucher rows; keep images small.
- Never put the `service_role` key in `.env`.
