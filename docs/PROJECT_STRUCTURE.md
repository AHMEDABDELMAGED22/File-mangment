# AntiDrive Project Structure

The repository is organized into clearly defined directories to enforce separation of concerns and maintainability.

```text
src/
├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── (auth)/           # Authentication routes (login, signup)
│   └── (protected)/      # Authenticated routes (dashboard, workspace, admin)
├── components/           # React Components
│   ├── admin/            # Admin-specific components (tables, analytics charts)
│   ├── layout/           # Global layout elements (sidebar, topbar)
│   ├── ui/               # Reusable UI primitives (shadcn/ui based)
│   └── workspace/        # Core business components (file grid, dropzone, dialogs)
├── lib/                  # Utilities, Types, and Configurations
│   ├── supabase/         # Supabase client singletons (browser, server, admin)
│   └── validators/       # Zod schemas for strict type safety and input validation
└── services/             # Business Logic Layer
    ├── admin.service.ts  # Administrative operations
    ├── auth.service.ts   # Authentication handling
    ├── file.service.ts   # File uploads, deletions, and moving
    ├── grade.service.ts  # Grade imports and fetching
    └── geminiService.ts  # AI Quiz generation logic
```

### 1. `app/`
Contains the Next.js routing structure. Everything inside `(protected)` shares a middleware check and layout that enforces authentication. `route.ts` files inside `app/` act as API endpoints or OAuth callbacks.

### 2. `components/`
All React components are strictly separated. The `ui/` folder contains pure, stateless styling primitives. The `workspace/` and `admin/` folders contain stateful, feature-specific components that interact directly with contexts or Server Actions.

### 3. `lib/`
Houses core utility functions, type definitions, and specifically our Zod schemas (`validators/`). The Supabase clients are instantiated here to be reused globally without duplicating connection overhead.

### 4. `services/`
To prevent the Next.js route handlers and React components from becoming bloated, all direct database interactions (`supabase.from(...)`) are abstracted into these service files. This layer is responsible for executing business logic and returning typed data.
