# Thredori — v2 (with accounts)

Added since v1: real sign up / log in, powered by Supabase.

## New in this version
- `app/signup/page.js` — create account
- `app/login/page.js` — log in
- `lib/supabaseClient.js` — connects to your Supabase project
- Header now shows "Log in" or "Log out" depending on whether someone's
  signed in

## Before you upload: two things to do differently this time

### 1. Add your Supabase keys to Vercel (not to GitHub)
Do NOT upload a `.env.local` file to GitHub — keep your keys out of the
public repo as good practice, even though this particular key is safe to
expose.

Instead:
1. Go to your project on vercel.com > Settings > Environment Variables
2. Add two variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://qxvsxmzgxdjdwbpcpkka.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_YyYh4e1rUn8wZHDc4J_2Sw_upufO2Pi`
3. Save, then go to the "Deployments" tab and click "Redeploy" on the
   latest deployment so it picks up the new variables.

### 2. Upload these new/changed files to GitHub
Same process as before — go to your `thredori` repo, and either:
- Upload the new `signup` and `login` folders (inside `app`), and the new
  `lib` folder, as new files, OR
- Easiest: delete the old `app` and `components` folders in the repo and
  re-upload the full updated versions from this package, so everything
  stays in sync.

Once both are done, visit `your-site.vercel.app/signup` to test creating
an account.

## Note on email confirmation
By default, Supabase requires confirming a new account via email before
login works. If you want to turn this off while testing (not recommended
for the real launch), go to Supabase > Authentication > Providers > Email
and toggle off "Confirm email."
