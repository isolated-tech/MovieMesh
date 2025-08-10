# Supabase Database Setup

## ⚠️ IMPORTANT: Apply Migration First

The application requires the `profiles` table to function. Follow these steps:

1. **Go to your Supabase project dashboard**
2. **Navigate to the SQL Editor**
3. **Copy and paste the ENTIRE contents of `migrations/20240101000000_create_profiles_table.sql`**
4. **Click "Run" to execute the migration**
5. **Wait for confirmation that the query executed successfully**

## If You Still Get Schema Cache Errors

After running the migration, if you still see "Could not find the table 'public.profiles' in the schema cache":

1. **Option 1: Wait a moment** - The schema cache may take a few seconds to update
2. **Option 2: Manually refresh** - In Supabase dashboard, go to Table Editor → profiles to verify the table exists
3. **Option 3: Restart your Next.js dev server** - This will create a fresh connection

## What This Creates

- **profiles table**: Stores user profile information including username
- **Row Level Security (RLS)**: Ensures users can only modify their own profile
- **Automatic profile creation**: Creates a profile entry when a new user signs up
- **Updated timestamp handling**: Automatically updates the `updated_at` field when a profile is modified

## Table Structure

The `profiles` table includes:
- `id` (UUID): References the auth.users table
- `username` (TEXT): Unique username chosen by the user
- `created_at` (TIMESTAMP): When the profile was created
- `updated_at` (TIMESTAMP): When the profile was last updated