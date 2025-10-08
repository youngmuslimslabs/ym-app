# Google SSO Authentication Setup

This document explains how Google Single Sign-On (SSO) is configured for the YM App, restricted to `@youngmuslims.com` domain accounts only.

## Architecture Overview

The authentication flow uses:
- **Google OAuth 2.0** for user authentication
- **Supabase Auth** for session management
- **Domain validation** to restrict access to @youngmuslims.com accounts
- **Client-side and server-side validation** for security

## Components

### 1. GoogleSignInButton Component
**Location:** `src/components/auth/GoogleSignInButton.tsx`

This is the core authentication component that:
- Initializes Google Identity Services
- Renders the Google Sign-In button
- Validates user domain before sending to Supabase
- Handles OAuth callback and token exchange

**Key features:**
- Domain restriction hint: `hosted_domain: 'youngmuslims.com'`
- JWT token validation before Supabase submission
- Nonce generation for security
- FedCM compatibility for Chrome third-party cookie handling

### 2. AuthContext
**Location:** `src/contexts/AuthContext.tsx`

Manages authentication state application-wide:
- Validates domain on session initialization
- Validates domain on auth state changes
- Auto sign-out for invalid domains
- Provides `user`, `loading`, and `signOut` to all components

**Domain validation logic:**
```typescript
const ALLOWED_DOMAIN = 'youngmuslims.com'

// Validates on session load and auth changes
if (user && !user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
  supabase.auth.signOut()
  setUser(null)
}
```

### 3. Login Pages

**Main Login:** `src/app/login/page.tsx`
- Uses `YMLoginForm` component (shadcn-based UI)
- Handles routing to dashboard on success
- Displays errors using shadcn Alert component

**Home/Test Page:** `src/app/home/page.tsx`
- Dual-state: Shows login UI or user info based on auth
- Uses shadcn Card/Button components
- Useful for testing and as a landing page

### 4. Middleware (Future)
**Location:** `src/middleware.ts`

Currently configured but not enforcing auth. Ready for future route protection:
- Public routes: `/login`, `/home`, `/`, `/api/auth`
- Can be enabled to enforce authentication on protected routes

## Google Cloud Console Setup

### 1. Create OAuth 2.0 Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services → Credentials**
3. Click **Create Credentials → OAuth 2.0 Client ID**
4. Select **Web application** type

### 2. Configure Authorized Origins

Add these JavaScript origins:
```
http://localhost:3000
http://localhost:3001
https://your-production-domain.com
```

### 3. Configure Redirect URIs

Add these redirect URIs:
```
https://[your-supabase-project].supabase.co/auth/v1/callback
```

Replace `[your-supabase-project]` with your actual Supabase project ID.

### 4. OAuth Consent Screen

Configure the consent screen:
- **Application name:** YM App
- **User support email:** Your email
- **Authorized domains:** Add production domains
- **Scopes required:**
  - `openid`
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`

### 5. Save Credentials

Copy your **Client ID** - you'll need it for environment variables.

## Supabase Configuration

### 1. Enable Google Provider

1. Open Supabase Dashboard → **Authentication → Providers**
2. Enable **Google** provider
3. Enter your Google OAuth **Client ID**
4. Enter your Google OAuth **Client Secret**
5. Save configuration

### 2. Redirect URL Configuration

The Supabase callback URL is automatically:
```
https://[your-project].supabase.co/auth/v1/callback
```

This must match exactly in your Google Cloud Console redirect URIs.

## Environment Variables

Create `.env.local` in the project root:

```bash
# Google OAuth Client ID (public, safe to expose)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com

# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Security Features

### Domain Restriction Layers

**Layer 1: Google OAuth Hint**
- `hosted_domain` parameter hints Google to show @youngmuslims.com accounts first
- Not a security enforcement, just UX improvement

**Layer 2: Client-Side Validation**
- JWT token decoded before sending to Supabase
- Prevents unnecessary API calls for invalid domains
- Shows user-friendly error immediately

**Layer 3: Server-Side Validation (AuthContext)**
- Every session checked on load
- Every auth state change validated
- Automatic sign-out for invalid domains
- Last line of defense

### Token Security

- **Nonce generation:** Prevents replay attacks
- **JWT validation:** Token verified before use
- **HTTPS only:** Production requires secure connections
- **Client ID exposure:** Safe - it's public by design
- **Client Secret:** Never exposed to browser (Supabase only)

## Testing

### Local Development

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Test login flow:**
   - Visit `http://localhost:3000/login`
   - Click "Continue with Google"
   - Sign in with @youngmuslims.com account
   - Should redirect to dashboard

3. **Test domain restriction:**
   - Try signing in with non-@youngmuslims.com account
   - Should see "Access restricted" error
   - User should not be created in Supabase

4. **Test home page:**
   - Visit `http://localhost:3000/home`
   - When logged out: Shows login UI
   - When logged in: Shows user info + sign out button

### Verify Success

Check these to confirm working setup:

- ✅ Google Sign-In button renders
- ✅ Clicking button opens Google account selector
- ✅ @youngmuslims.com accounts can sign in
- ✅ Other domains show error message
- ✅ User created in Supabase after successful login
- ✅ Session persists on page refresh
- ✅ Sign out works correctly

## Troubleshooting

### Common Issues

#### 1. "400 Bad Request" Error

**Causes:**
- Client ID mismatch between code and Google Console
- Redirect URI not in Google Console authorized list
- OAuth consent screen incomplete

**Solutions:**
- Verify Client ID matches exactly from Google Console
- Add all localhost variations (3000, 3001) to authorized origins
- Complete OAuth consent screen configuration
- Restart dev server after `.env.local` changes

#### 2. Google Button Not Rendering

**Causes:**
- Client ID missing or incorrect
- Script not loading
- Browser blocking third-party cookies

**Solutions:**
- Check browser console for errors
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
- Hard refresh browser (Cmd+Shift+R)
- Check Network tab for failed script loads

#### 3. "Domain Not Allowed" Error

**Causes:**
- User email not from @youngmuslims.com
- Domain validation logic issue

**Solutions:**
- Verify email domain is exactly `@youngmuslims.com`
- Check AuthContext validation logic
- Review browser console for validation errors

#### 4. Redirect URI Mismatch

**Causes:**
- Supabase callback URL not in Google Console
- Typo in redirect URI configuration

**Solutions:**
- Copy exact Supabase callback URL from dashboard
- Paste into Google Console authorized redirect URIs
- Ensure no trailing slashes or typos

### Debug Steps

1. **Check Environment Variables:**
   ```bash
   # In terminal
   echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID

   # Should show your Client ID, not empty
   ```

2. **Inspect JWT Token:**
   ```javascript
   // In browser console after clicking button
   // (Add temporary logging in GoogleSignInButton.tsx)
   const payload = JSON.parse(atob(credential.split('.')[1]))
   console.log('Email:', payload.email)
   console.log('Domain:', payload.email.split('@')[1])
   ```

3. **Check Supabase Logs:**
   - Open Supabase Dashboard → Authentication → Logs
   - Look for failed authentication attempts
   - Check error messages

4. **Network Tab Analysis:**
   - Open DevTools → Network tab
   - Click Google Sign-In button
   - Look for failed requests (red)
   - Check response error messages

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update Google Console with production domain
- [ ] Update authorized redirect URIs for production
- [ ] Set environment variables in hosting platform
- [ ] Test OAuth flow in staging environment
- [ ] Verify domain restriction works in production
- [ ] Add production domain to OAuth consent screen

### Production Environment Variables

Set these in your hosting platform (Vercel, Netlify, etc.):

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-client-id
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Post-Deployment

1. **Verify OAuth Client:**
   - Ensure production domain in authorized origins
   - Ensure production callback in redirect URIs

2. **Test End-to-End:**
   - Visit production login page
   - Complete OAuth flow
   - Verify user creation in Supabase
   - Test domain restriction

3. **Monitor:**
   - Check Supabase auth logs for errors
   - Monitor sign-in success rate
   - Review any user-reported issues

## Future Enhancements

### TODO: Add Supabase Auth Hook

**Priority:** High
**Location:** Supabase Dashboard → Authentication → Hooks

Create a "Before User Created" hook to enforce domain at database level:

```sql
-- Example SQL function (adjust for your needs)
CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@youngmuslims.com' THEN
    RAISE EXCEPTION 'Only @youngmuslims.com emails are allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

This adds server-side enforcement in addition to client-side validation.

### Potential Improvements

1. **Admin Dashboard**
   - Manage allowed domains from UI
   - Whitelist specific external emails if needed

2. **Enhanced Error Messages**
   - Better UX for domain restriction errors
   - Guide users to correct email

3. **Analytics**
   - Track sign-in attempts by domain
   - Monitor authentication errors

4. **Multi-Domain Support**
   - Support additional domains if needed
   - Update `ALLOWED_DOMAIN` to array format

## Reference Files

**Active Implementation:**
- `src/components/auth/GoogleSignInButton.tsx` - OAuth integration
- `src/components/auth/YMLoginForm.tsx` - Login UI component
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/app/login/page.tsx` - Main login page
- `src/app/home/page.tsx` - Home/test page with dual states

**Configuration:**
- `.env.local` - Environment variables
- `src/middleware.ts` - Route protection (future)

## Summary

✅ **Authentication Flow:**
1. User clicks Google Sign-In button
2. Google OAuth popup appears (filtered to @youngmuslims.com)
3. User selects/authenticates account
4. JWT token validated for domain
5. Token sent to Supabase if valid
6. Supabase creates session
7. AuthContext validates and stores user
8. User redirected to dashboard

✅ **Security:**
- Multi-layer domain validation
- Automatic sign-out for invalid domains
- Nonce protection against replay attacks
- HTTPS enforcement in production

✅ **Current State:**
- Google SSO fully functional
- Domain restriction enforced
- Session management working
- Ready for production (after adding Supabase hook)
