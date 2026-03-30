# ALS Enrollment System

## Supabase Setup Instructions

### Required Tables

The system uses the following tables:

1. **enrollments** - For storing student enrollment records
   - The table is automatically created during first deployment
   - Uses Row Level Security (RLS) policies to ensure data security
   - Students can only access their own enrollments
   - Admins can access and manage all enrollments

### Setup Steps

1. Log into your Supabase account
2. Set up Firebase authentication bridge (see Authentication section)
3. Configure environment variables (see Configuration section)

### Troubleshooting

If you encounter a 404 error for `firebase_users` table, it means the table hasn't been created in your Supabase project. Follow the setup steps above to create the required table.

```
POST https://[your-project].supabase.co/rest/v1/firebase_users 404 (Not Found)
```

This error occurs because the application is trying to access a table that doesn't exist yet.
