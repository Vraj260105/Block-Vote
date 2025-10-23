# User Roles Implementation Guide for BlockVote

## Important Security Notes

**CRITICAL**: Roles MUST be stored in a separate `user_roles` table. **Never** store roles directly on the profile or users table as this can lead to privilege escalation attacks.

**NEVER** check admin status using client-side storage (localStorage, sessionStorage) or hardcoded credentials. These can be easily manipulated by attackers. Always use server-side validation with proper authentication.

## Supabase Setup Instructions

When you're ready to connect your backend API, follow these steps to implement secure role-based access control:

### 1. Create Role Enum

```sql
create type public.app_role as enum ('admin', 'moderator', 'user');
```

### 2. Create user_roles Table

```sql
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);
```

### 3. Enable Row-Level Security

```sql
alter table public.user_roles enable row level security;
```

### 4. Create Security Definer Function

This function checks if a user has a specific role. Using `SECURITY DEFINER` allows it to execute with owner privileges, bypassing RLS policies and preventing recursive issues:

```sql
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;
```

### 5. Implement RLS Policies

Use the `has_role` function in your RLS policies:

```sql
-- Example: Allow 'admin' users to select all rows in a table
create policy "Admins can select all rows"
on public.some_table
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Example: Users can only view their own data
create policy "Users can view own data"
on public.some_table
for select
to authenticated
using (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
```

## Frontend Integration

The application is already set up to display user roles. When connecting your backend:

1. **Login Response**: Ensure your API returns the user's role(s) from the `user_roles` table
2. **Profile Updates**: The role display in `ProfilePage.tsx` will automatically show the user's role
3. **Protected Routes**: You can add role-based route protection as needed

### Example API Response Structure

```typescript
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user", // Fetched from user_roles table
    "isEmailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

## Current Mock Implementation

The application currently uses mock authentication with a default 'user' role. Replace the mock API calls in:

- `src/pages/LoginPage.tsx` (lines 75-95)
- `src/pages/RegisterPage.tsx` 

with actual backend API calls that implement the secure role system described above.

## Role Display

Users can see their role in:
- **Profile Page**: Shows role badge with icon (admin = red, moderator = blue, user = gray)
- **Future Features**: You can extend this to show different UI elements based on roles

## Security Best Practices

1. ✅ Always validate roles server-side
2. ✅ Use RLS policies for database access control
3. ✅ Never trust client-side role checks for security
4. ✅ Store roles in separate `user_roles` table
5. ✅ Use `SECURITY DEFINER` functions to prevent RLS recursion
6. ❌ Never store roles in localStorage or client state for access control
7. ❌ Never hardcode admin credentials
