# Supabase Integration - Quick Start Guide

## 🚀 What's Been Set Up

Your app now has complete Supabase integration with:

### 1. **Database Schema** (`supabase/migrations/001_initial_schema.sql`)
   - Users table (teachers, students, parents)
   - Students table
   - Teachers table
   - Grades table (performance records)
   - Parent-Students table (relationships)
   - Row Level Security (RLS) policies
   - Database indexes for performance

### 2. **Authentication Service** (`src/lib/auth.ts`)
   - Email/Password signup & login
   - Gmail OAuth support
   - Password reset
   - Session management
   - Secure token handling

### 3. **Data Services** (`src/lib/services.ts`)
   - Grades operations (add, update, delete, retrieve)
   - Student operations (retrieve, link to parents)
   - Teacher operations (profile, statistics)
   - User operations (profile management)

### 4. **Supabase Configuration** (`src/lib/supabase.ts`)
   - Supabase client setup
   - Type definitions
   - Database schema types

## 📋 Getting Started (3 Simple Steps)

### Step 1: Create Supabase Project
1. Go to https://supabase.com and sign up
2. Create a new project
3. Save your database password

### Step 2: Get Credentials
1. Go to **Settings** → **API**
2. Copy **Project URL** and **Anon Key**

### Step 3: Set Environment Variables
Create `.env.local` in project root:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run Database Setup
1. Open Supabase **SQL Editor**
2. Create new query
3. Copy-paste contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run"

### Step 5: Restart Dev Server
```bash
npm run dev
```

## 🔐 User Authentication Flow

### Email/Password Login
```typescript
import { authService } from '@/lib/auth';

// Sign up
const { user, error } = await authService.signUp(
  'user@example.com',
  'password123',
  'John',
  'Doe',
  'teacher',
  'Greenfield High'
);

// Sign in
const { user, session, error } = await authService.signIn(
  'user@example.com',
  'password123'
);

// Sign out
await authService.signOut();
```

### Gmail Login
```typescript
// Initiates Google OAuth flow
const { data, error } = await authService.signInWithGoogle();
```

### Password Reset
```typescript
// Send reset email
const { error } = await authService.resetPassword('user@example.com');

// Update password
const { error } = await authService.updatePassword('newPassword123');
```

## 📊 Database Operations

### Add Grade
```typescript
import { gradesService } from '@/lib/services';

await gradesService.addGrade(
  studentId,
  teacherId,
  'Math',
  85,
  92,
  8,
  'Excellent work!'
);
```

### Get Student Grades
```typescript
const { data: grades, error } = await gradesService.getStudentGrades(studentId);
```

### Get Teacher's Students
```typescript
const { data: students, error } = await gradesService.getTeacherStudents(teacherId);
```

### Link Parent to Student
```typescript
import { studentsService } from '@/lib/services';

await studentsService.linkParentToStudent(parentId, studentId);
```

### Get Parent's Children
```typescript
const { data: children, error } = await studentsService.getParentChildren(parentId);
```

## 🔒 Security Features

✅ **Row Level Security (RLS)**
   - Teachers can only see their school's students
   - Students can only see their own data
   - Parents can only see their children's data

✅ **Encrypted Passwords**
   - All passwords are encrypted by Supabase
   - Never transmitted in plain text

✅ **Session Tokens**
   - Secure JWT-based sessions
   - Auto-refresh tokens

✅ **Database Policies**
   - Fine-grained access control
   - Automatic enforcement at database level

## 📁 File Structure

```
src/lib/
├── supabase.ts      # Supabase client & types
├── auth.ts          # Authentication service
└── services.ts      # Database operations

supabase/
└── migrations/
    └── 001_initial_schema.sql  # Database schema

SUPABASE_SETUP.md    # Detailed setup guide
```

## 🎯 Next Steps

1. **Update Login Component**: Replace mock auth with `authService.signIn()`
2. **Fetch Real Data**: Use `gradesService` to fetch actual grades
3. **Add Grade Records**: Implement grade creation with Supabase
4. **Parent-Student Links**: Set up parent-child relationships
5. **Deploy**: Use Supabase's hosting or your own infrastructure

## 🆘 Troubleshooting

**Error: "Cannot find module '@supabase/supabase-js'"**
- Run: `npm install @supabase/supabase-js`

**Error: "VITE_SUPABASE_URL is undefined"**
- Check `.env.local` file exists in project root
- Restart dev server: `npm run dev`

**Error: "Permission denied"**
- Verify RLS policies ran (check SQL Editor history)
- Ensure user is logged in with correct role
- Check that migrations executed without errors

**Gmail Login Not Working**
- Enable Google provider in Supabase
- Add Google OAuth credentials
- Set redirect URI correctly

## 📚 Documentation Links

- Supabase Docs: https://supabase.com/docs
- Auth Docs: https://supabase.com/docs/guides/auth
- Database Docs: https://supabase.com/docs/guides/database
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security

## ✨ Features Now Available

✅ Secure user authentication (email + Gmail)
✅ Real-time database with Supabase
✅ Role-based access control
✅ Student performance tracking
✅ Grade management
✅ Parent-child relationships
✅ Teacher statistics
✅ Automatic session management
✅ Password reset & recovery
