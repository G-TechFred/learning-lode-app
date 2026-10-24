# Supabase Setup Guide for GODDY MONTESSORI SCHOOL

## Step 1: Create Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com) and sign up for a free account
2. Click "New Project" to create a new project
3. Fill in the project details:
   - **Name:** GODDY MONTESSORI SCHOOL (or your preferred name)
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose the region closest to you
4. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Your APIs")
   - **Anon (public) Key** (under "Project API keys")

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the project root (or update if it exists):
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace the values with your actual Supabase credentials from Step 2

## Step 4: Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire content from `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the migration

This will create:
- **users** table (stores teacher, student, parent profiles)
- **students** table (student-specific data)
- **teachers** table (teacher-specific data)
- **grades** table (performance records)
- **parent_students** table (parent-child relationships)
- Row Level Security (RLS) policies for data privacy
- Indexes for optimal performance

## Step 5: Configure Authentication

1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Email** (should be enabled by default)
3. To enable Gmail login:
   - Click on **Google**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials (OAuth 2.0 Client ID for Web application)
   - Add Supabase redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret into Supabase Google provider settings

## Step 6: Start Your Application

```bash
npm run dev
```

## Features Now Available

### Authentication
- ✅ Email/Password signup and login
- ✅ Gmail OAuth login
- ✅ Secure password reset
- ✅ Session management

### User Roles
- ✅ Teacher: Can create and manage grades
- ✅ Student: Can view their own grades
- ✅ Parent: Can view their children's grades

### Database Operations
- ✅ Automatic user profile creation on signup
- ✅ Role-based access control (RLS)
- ✅ Performance/grades tracking
- ✅ Parent-child relationships management

### Security
- ✅ Row Level Security (RLS) on all tables
- ✅ Encrypted passwords
- ✅ Secure session management
- ✅ Role-based data access

## API Reference

### Authentication Service (`src/lib/auth.ts`)

```typescript
// Sign up
authService.signUp(email, password, firstName, lastName, role, schoolName)

// Sign in
authService.signIn(email, password)

// Gmail sign in
authService.signInWithGoogle()

// Sign out
authService.signOut()

// Get current user
authService.getCurrentUser()

// Reset password
authService.resetPassword(email)

// Update password
authService.updatePassword(newPassword)
```

## Database Schema

### Users Table
- `id` (UUID) - Auth user ID
- `email` (TEXT) - User email
- `first_name` (TEXT) - First name
- `last_name` (TEXT) - Last name
- `role` (TEXT) - 'teacher', 'student', or 'parent'
- `school_name` (TEXT) - School name
- `created_at` (TIMESTAMP)

### Students Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Reference to users table
- `name` (TEXT) - Full name
- `class` (TEXT) - Class/Grade
- `school_id` (TEXT) - School identifier
- `created_at` (TIMESTAMP)

### Teachers Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Reference to users table
- `name` (TEXT) - Full name
- `subject` (TEXT) - Subject taught
- `school_id` (TEXT) - School identifier
- `created_at` (TIMESTAMP)

### Grades Table
- `id` (UUID) - Primary key
- `student_id` (UUID) - Reference to students
- `teacher_id` (UUID) - Reference to teachers
- `subject` (TEXT) - Subject
- `grade` (INTEGER) - Grade 0-100
- `attendance` (INTEGER) - Attendance 0-100
- `participation` (INTEGER) - Participation 0-10
- `remark` (TEXT) - Teacher remark
- `recorded_at` (TIMESTAMP)

### Parent-Students Table
- `id` (UUID) - Primary key
- `parent_id` (UUID) - Reference to parent user
- `student_id` (UUID) - Reference to student
- `created_at` (TIMESTAMP)

## Troubleshooting

### "No tables found" error
- Make sure you ran the SQL migration in Supabase SQL Editor
- Check that the migration executed successfully (no error messages)

### "Permission denied" when accessing tables
- Verify RLS policies are in place
- Check that your user role is correct
- Ensure you're logged in with the correct user

### Environment variables not loading
- Make sure `.env.local` file is in the project root (not in src/)
- Variable names must start with `VITE_` to be exposed to the frontend
- Restart the dev server after adding environment variables

### Gmail login not working
- Make sure Google provider is enabled in Supabase
- Verify OAuth credentials are correct
- Check that redirect URI matches your application URL

## Next Steps

1. Update your login component to use `authService.signIn()` instead of mock auth
2. Update data fetching to query Supabase tables
3. Connect the dashboard to real database data
4. Implement student/grade management features with Supabase

## Support

For issues with Supabase:
- Documentation: https://supabase.com/docs
- Community: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues
