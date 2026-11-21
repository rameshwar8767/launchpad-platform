# LaunchPad Task Manager - Frontend SPA

The **LaunchPad Frontend** is an enterprise-grade Single Page Application (SPA) built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **TanStack Query**. It delivers a responsive, accessible task tracking and operations workspace.

---

## 1. Architectural Highlights

- **Component & State Architecture:**
  - `src/components/ui/`: Atomic, reusable UI primitives (Button, Input, Select, Textarea, Badge, Card, Modal, Spinner, EmptyState).
  - `src/context/`: `AuthContext` managing authentication state, token persistence, and automatic 401 logout handling.
  - `src/layouts/`: `AuthLayout` for centered sign-in/registration flows, `DashboardLayout` for responsive sidebar navigation and workspace views, and `ProtectedRoute` guarding private routes.
  - `src/pages/`: Modular pages for `LoginPage`, `RegisterPage`, `DashboardPage`, `TasksPage`, `ProfilePage`, `SettingsPage`, and `NotFoundPage`.
  - `src/services/`: Typed API client (`apiClient.ts`), `authService.ts`, and `taskService.ts`.
- **Modern Styling & UX:**
  - Tailwind CSS v4 design system with modern slate color tokens, responsive layouts, and glassmorphic card elements.
  - Full mobile, tablet, and desktop viewport responsiveness.
  - WCAG AA accessibility compliance with keyboard navigation and ARIA attributes.
- **Server State & Caching:**
  - TanStack Query v5 managing query caching, background polling, and instant optimistic cache invalidation upon task mutations.

---

## 2. Directory Taxonomy

```
application/frontend/
├── src/
│   ├── __tests__/           # Vitest + React Testing Library component tests
│   ├── components/
│   │   ├── tasks/           # TaskModal (create / edit work items)
│   │   └── ui/              # Button, Input, Select, Badge, Card, Modal, Spinner, EmptyState
│   ├── context/             # AuthContext (JWT state, session management)
│   ├── layouts/             # AuthLayout, DashboardLayout, ProtectedRoute
│   ├── pages/               # Login, Register, Dashboard, Tasks, Profile, Settings, NotFound
│   ├── services/            # apiClient, authService, taskService
│   ├── test/                # Test setup and matchers
│   ├── types/               # TypeScript interfaces (User, Task, Metrics, PaginatedResponse)
│   ├── utils/               # Utility functions (cn styling helper)
│   ├── App.tsx              # Application route tree & TanStack Query client
│   ├── index.css            # Tailwind directives & base styles
│   └── main.tsx             # React DOM entrypoint
├── nginx.conf               # Hardened Nginx configuration with SPA routing & reverse proxy
├── Dockerfile               # Multi-stage unprivileged Nginx container build
├── .dockerignore
├── .env.example             # Frontend environment variables template
├── package.json             # Pinned frontend dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite + Tailwind + Vitest build configuration
```

---

## 3. Local Development Setup

### 3.1 Prerequisites
- Node.js 20+ (Node.js 22 LTS verified)
- npm 10+

### 3.2 Installation
```bash
cd application/frontend
npm install
```

### 3.3 Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default API target: `http://localhost:8000/api/v1`.

### 3.4 Running Development Server
```bash
npm run dev
```
Local application server starts at: `http://localhost:5173`.

---

## 4. Running Automated Tests & Production Build

```bash
# Run Vitest test suite
npm run test

# Type-check and build production bundle
npm run build
```

---

## 5. Container Execution

Build and run with Docker:
```bash
docker build -t launchpad-frontend:latest -f Dockerfile .
docker run -p 8080:8080 launchpad-frontend:latest
```
Access at: `http://localhost:8080`.
