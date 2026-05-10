# AntiDrive — Secure Multi-Tenant File Management

A production-ready file management web application where each user has an isolated workspace with folders and files. Built with Next.js 14+, Supabase, TypeScript, and shadcn/ui.

![Dark Mode](https://img.shields.io/badge/Theme-Dark%20Mode-1a1a2e?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20DB%20%7C%20Storage-3ecf8e?style=flat-square)

## Features

- **Multi-tenant workspaces** — Each user gets an isolated workspace
- **Folder hierarchy** — Create nested folders, breadcrumb navigation
- **File operations** — Upload, download, rename, move, delete
- **Drag-and-drop uploads** — Drop files anywhere in the workspace
- **Row Level Security** — Database-enforced access control
- **Storage policies** — Users can only access their own files in Supabase Storage
- **Admin panel** — Manage users, view all workspaces, activity logs
- **Dark-mode-first UI** — Polished, minimal, responsive design
- **Activity logging** — Audit trail for all file operations
- **Search & sort** — Find files quickly within your workspace
- **Student Grades** — Users can optionally link a student code during signup to securely view their imported grades across multiple subjects (Networks, JavaScript). Admins can bulk import grades via CSV and select the target subject.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Authentication | Supabase Auth |
| Database | Supabase Postgres + RLS |
| Storage | Supabase Storage |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Icons | Lucide React |
| Drag & Drop | react-dropzone |

## Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project (free tier works)

## Setup

### 1. Clone and install

```bash
cd file-vault
npm install
```

### 2. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these in your Supabase dashboard under **Settings > API**.

### 3. Run database migrations

Go to your Supabase dashboard **SQL Editor** and run each file in `supabase/migrations/` **in order**:

1. `00001_create_profiles.sql`
2. `00002_create_workspaces.sql`
3. `00003_create_folders.sql`
4. `00004_create_files.sql`
5. `00005_create_activity_logs.sql`
6. `00006_rls_policies.sql`
7. `00007_storage_policies.sql`
8. `00008_functions_triggers.sql`
9. `00009_seed.sql`
10. `003_grade_records.sql` (Legacy)
11. `010_multiple_subjects_grades.sql`

> **Tip:** You can also concatenate all files and run them as a single script.

### 4. Create the storage bucket

The migration `00007_storage_policies.sql` creates a `files` bucket automatically.
If it doesn't appear, create it manually:

1. Go to **Storage** in your Supabase dashboard
2. Click **New Bucket**
3. Name: `files`
4. Public: **No** (private)

### 5. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 6. Create users

1. Sign up at `/signup` with two different emails
2. To make a user an admin, run in the SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = 'your-user-uuid';
```

You can find user UUIDs in **Authentication > Users** in your Supabase dashboard.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, signup, reset-password
│   ├── (protected)/        # Dashboard, workspace, admin, settings
│   └── auth/callback/      # OAuth/magic-link callback
├── actions/                # Server actions (mutations)
├── components/             # UI components
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Sidebar, topbar
│   ├── workspace/          # File grid, folder card, dialogs
│   └── admin/              # Admin-specific components
├── lib/                    # Utilities, types, validators
│   ├── supabase/           # Client, server, admin Supabase clients
│   └── validators/         # Zod schemas
└── services/               # Business logic layer

supabase/
└── migrations/             # SQL schema, RLS, triggers, seed
```

## Security

### Row Level Security (RLS)
All tables have RLS enabled. Policies ensure:
- Users can only read/write their own workspace data
- Admins can read all data
- Activity logs are immutable (no update/delete)
- Role and active status changes require admin privileges

### Storage Policies
Files are stored with paths prefixed by `user_id/`. Storage policies enforce that users can only access paths matching their own `auth.uid()`.

### Integrity Triggers
- **Folder parent validation** — Parent folder must belong to same workspace
- **File folder validation** — File's folder must belong to same workspace
- **Role escalation prevention** — Only admins can change roles/active status

### Input Validation
- All server actions validate inputs with Zod
- Filenames are sanitized (path traversal chars, null bytes, special chars stripped)
- File size limits enforced (50MB default, configurable)
- Blocked executable extensions (.exe, .bat, .cmd, etc.)

### Rate Limiting
> **Note:** For production, add rate limiting at the edge (Vercel Edge Config, Cloudflare WAF) or via Supabase's built-in rate limits. This MVP does not include custom rate limiting middleware.

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

## License

MIT
