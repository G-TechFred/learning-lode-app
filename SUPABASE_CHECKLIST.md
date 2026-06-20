# Supabase Setup Checklist ✅

Complete these steps in order to fully set up Supabase for your app.

## Phase 1: Supabase Account & Project (5 minutes)

- [ ] Go to https://supabase.com
- [ ] Create a Supabase account
- [ ] Create a new project
  - [ ] Save the database password somewhere safe
  - [ ] Select the region closest to you
- [ ] Wait for project to be created (2-3 minutes)

## Phase 2: Get Credentials (2 minutes)

- [ ] Go to **Settings** → **API** in your Supabase dashboard
- [ ] Copy your **Project URL** (looks like: https://xxxxx.supabase.co)
- [ ] Copy your **Anon (public) Key** (long string starting with eyJ)
- [ ] Save these safely - you'll need them next

## Phase 3: Configure Environment Variables (2 minutes)

- [ ] Create a new file called `.env.local` in your project root
- [ ] Add these lines:
  ```
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```
- [ ] Replace the values with your actual credentials from Phase 2
- [ ] Save the file

## Phase 4: Set Up Database Schema (5 minutes)

- [ ] Go to your Supabase dashboard
- [ ] Click on **SQL Editor** in the left sidebar
- [ ] Click **New Query**
- [ ] Open file `supabase/migrations/001_initial_schema.sql` in your editor
- [ ] Copy the entire SQL content
- [ ] Paste it into the Supabase SQL Editor
- [ ] Click **Run**
- [ ] Wait for the query to complete (should show "Success")

You should now see these tables in **Tables** section:
- [ ] users
- [ ] students
- [ ] teachers
- [ ] grades
- [ ] parent_students

## Phase 5: Enable Authentication (5 minutes)

### Email/Password Auth (Default - Already Enabled)
- [ ] Go to **Authentication** → **Providers** in Supabase
- [ ] Verify **Email** provider is enabled (it should be by default)

### Optional: Enable Gmail Login
If you want to support Gmail login:

- [ ] Click on **Google** provider in Authentication → Providers
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create a new project
- [ ] Enable "Google+ API"
- [ ] Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
- [ ] Select "Web application"
- [ ] Add authorized redirect URI:
  ```
  https://your-project-id.supabase.co/auth/v1/callback
  ```
- [ ] Copy Client ID and Client Secret
- [ ] Go back to Supabase Google provider settings
- [ ] Paste Client ID and Client Secret
- [ ] Click Save

## Phase 6: Test & Deploy (5 minutes)

- [ ] Open your terminal
- [ ] Run: `npm run dev`
- [ ] Wait for dev server to start
- [ ] Open http://localhost:8087 (or the port shown in terminal)
- [ ] Try signing up with email
- [ ] Verify user appears in Supabase **Auth** section
- [ ] Check that user profile was created in **users** table

## Phase 7: Verify Everything Works (5 minutes)

- [ ] In Supabase **SQL Editor**, run this query to verify tables have data:
  ```sql
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM students;
  SELECT COUNT(*) FROM teachers;
  ```

- [ ] All counts should match the users you created in testing

## 🎉 Done! You're All Set!

Your app now has:
✅ Secure authentication (email + optionally Gmail)
✅ Real database with user profiles
✅ Role-based access control
✅ All data encrypted and secure
✅ Ready for production

## 📝 Next Steps (Optional)

1. **Integrate with UI**: Update your login/signup components to use `authService` instead of mock auth
2. **Add Grade Recording**: Connect the "Enter Performance" dialog to `gradesService.addGrade()`
3. **Show Real Data**: Replace mock student data with real data from Supabase
4. **Parent Features**: Implement parent-student linking
5. **Deploy**: Deploy your app to production

## 🆘 Having Issues?

**Q: "Cannot connect to Supabase"**
- A: Check that environment variables are correct in `.env.local`
- Make sure you restarted dev server after adding env variables

**Q: "Migrations failed / No tables"**
- A: Try running the SQL migration again
- Check SQL Editor for error messages
- Make sure you copied the entire SQL file

**Q: "Permission denied when accessing tables"**
- A: Verify RLS policies were created (check in Supabase dashboard)
- Try creating a new user and signing in again
- Check your user role matches the policy requirements

**Q: "Gmail login not working"**
- A: Verify Google credentials are entered in Supabase
- Check OAuth redirect URI is correct
- Make sure you're using a public URL, not localhost (for production)

## 📞 Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues

---

**Last Updated**: 2026-06-20
**Estimated Setup Time**: 30 minutes
