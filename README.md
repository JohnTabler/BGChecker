# BGTrack — Setup Guide

## What's Included

| File | Purpose |
|---|---|
| `index.html` | Login page |
| `dashboard.html` | Stats overview |
| `records.html` | Search, filter, export all records |
| `record-detail.html` | View / create / edit a single record |
| `reminders.html` | Expiring + expired checks (Manager/Admin) |
| `bulk-upload.html` | CSV import with inline error fixing |
| `admin.html` | User management + reminder settings |
| `assets/config.js` | **Your Supabase credentials go here** |
| `assets/auth.js` | Auth, session, role guards |
| `assets/db.js` | All database calls |
| `assets/ui.js` | Nav, toasts, modals, formatting |
| `assets/export.js` | CSV export logic |
| `supabase-setup.sql` | Run once in Supabase SQL editor |

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name, database password, and region
3. Wait for the project to provision (~1 min)

---

## Step 2 — Run the Database Schema

1. In your Supabase dashboard → **SQL Editor** → **New Query**
2. Paste the entire contents of `supabase-setup.sql`
3. Click **Run**

This creates:
- `users` table with role-based access
- `records` table with all background check fields
- `settings` table for the reminder window
- Row Level Security policies for all three tables
- Trigger to auto-create a `users` row on signup

---

## Step 3 — Configure Your Credentials

Open `assets/config.js` and replace the placeholder values:

```js
const SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

Find these in: **Supabase Dashboard → Project Settings → API**

- **Project URL** → `SUPABASE_URL`
- **anon / public key** → `SUPABASE_ANON_KEY`

> The anon key is safe to expose in client-side code — Row Level Security
> ensures users can only access data they're permitted to.

---

## Step 4 — Create Your First Admin User

1. Supabase Dashboard → **Authentication → Users → Invite**
2. Enter your email address and send the invite
3. Accept the invite email and set a password
4. In **SQL Editor**, run:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

All subsequent users you invite through the app will default to Viewer
until you change their role in the Admin panel.

---

## Step 5 — Deploy to GitHub Pages

1. Push all files to a GitHub repository
2. Go to **Repository → Settings → Pages**
3. Set source to **Deploy from a branch → main → / (root)**
4. Your app will be live at `https://yourusername.github.io/your-repo-name/`

> **Note:** GitHub Pages serves `index.html` at the root, which is your
> login page. All navigation between pages uses direct `.html` links,
> so no build step or routing configuration is needed.

---

## Roles & Permissions

| Feature | Admin | Manager | Viewer |
|---|---|---|---|
| View dashboard | ✅ | ✅ | ✅ |
| Search / filter records | ✅ | ✅ | ✅ |
| Export CSV | ✅ | ✅ | ✅ |
| Add / edit records | ✅ | ✅ | ❌ |
| Bulk upload | ✅ | ✅ | ❌ |
| View reminders tab | ✅ | ✅ | ❌ |
| Delete records | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Change reminder window | ✅ | ❌ | ❌ |

---

## Reminder Logic

- **Expiration** = `date_processed + 6 months` (auto-calculated on save)
- **Reminder window** = configurable by Admin (default: 20 days)
- Reminders tab shows two lists: **Upcoming Expirations** and **Already Expired**
- Both lists are filterable and exportable

---

## Bulk Upload CSV Format

Download the template from the Bulk Upload page, or use this format:

```
employee_name,project,date_ordered,date_processed,vendor,status
Jane Smith,Project Alpha,2026-01-10,2026-01-15,HireRight,Cleared
John Doe,Project Beta,2026-02-01,,Sterling,Pending
```

- **Required fields:** `employee_name`, `project`, `date_ordered`, `status`
- **Optional fields:** `date_processed`, `vendor`
- **Valid statuses:** `Pending`, `Cleared`, `Failed`, `Cancelled`
- **Date format:** `YYYY-MM-DD`
- Rows with errors are highlighted inline for fixing before import

---

## Supabase Free Tier Notes

- 500 MB database storage (more than enough for this use case)
- Projects **pause after 1 week of inactivity** — resumable from dashboard
- For a production client, consider the $25/month Pro plan to avoid pausing

---

## Future Considerations

- **Multi-tenant:** Add a `company_id` column to `records` and `settings`,
  update RLS policies to filter by it, and set it on login
- **Desktop app:** The codebase is Electron-ready — wrap in Electron with
  a bundled Supabase connection for an offline-capable desktop version
- **Email reminders:** Add a Supabase Edge Function + cron job to send
  emails when records enter the reminder window
