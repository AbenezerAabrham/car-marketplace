# Deployment Guide

## GitHub Setup

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub Repository**:
   - Go to [GitHub](https://github.com/new)
   - Create a new repository (name it `car-marketplace`)
   - Do NOT initialize with README, .gitignore, or license

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/car-marketplace.git
   git branch -M main
   git push -u origin main
   ```

## Vercel Deployment

### Method 1: Import from GitHub (Recommended)

1. **Sign up/Login to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Sign in with GitHub

2. **Import Project**:
   - Click "Add New" → "Project"
   - Select your `car-marketplace` repository
   - Vercel will auto-detect it's a Next.js project

3. **Configure Environment Variables**:
   - In the "Environment Variables" section, add:
     - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase public key
     - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase secret key
   
   - You can find these in your Supabase project settings under "Project API keys"

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your project
   - Your app will be live at `https://car-marketplace-yourname.vercel.app`

### Method 2: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

## Automatic Deployments

Once connected to GitHub via Vercel:
- Every push to `main` branch triggers a production deployment
- Pull requests automatically generate preview deployments
- Failed builds prevent deployment

## Environment Variables Reference

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase service role key (server-only) |
| `GOOGLE_VISION_API_KEY` | Secret | Plate OCR via Google Cloud Vision (~1k free/mo) |
| `NEXT_PUBLIC_PHONE_VERIFICATION_ENABLED` | Public | Set `true` when Twilio + Supabase Phone are ready |

## Supabase Setup

1. Run `supabase-schema.sql` in the Supabase SQL Editor (fresh project).
2. If upgrading an existing DB, also run `supabase-migration-trust.sql`.

### Google OAuth (recommended sign-in)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs → Credentials → OAuth 2.0 Client ID (Web).
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Google → paste Client ID + Secret.
4. Supabase → Authentication → URL Configuration → add your site URL and `http://localhost:3000/auth/callback`.

### Plate verification (Google Vision)

1. Enable Cloud Vision API in Google Cloud.
2. Create an API key → set `GOOGLE_VISION_API_KEY` in Vercel.
3. Without this key, listings work in `development` only; production requires it.

### Phone verification (when ready to pay for SMS)

1. Supabase → Authentication → Phone → enable Twilio, add credentials.
2. Set `NEXT_PUBLIC_PHONE_VERIFICATION_ENABLED=true` in Vercel.
3. Users verify at `/account`; listing requires verified phone when enabled.


### Build Fails
- Check that all environment variables are set in Vercel
- Verify `package.json` dependencies are correct
- Check build logs in Vercel dashboard

### Environment Variables Not Found
- Ensure variable names match exactly (case-sensitive)
- Public vars should have `NEXT_PUBLIC_` prefix
- Redeploy after adding/updating variables

### Still Issues?
- Check [Vercel Docs](https://vercel.com/docs)
- Review build logs in Vercel dashboard
- Check your application logs with: `vercel logs`

## Local Testing Before Deploy

To test locally with the same environment as production:
```bash
npm run build
npm run start
```

Then visit `http://localhost:3000`
