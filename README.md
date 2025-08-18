# LegalAssist AI — Frontend

A modern React + Vite frontend for LegalAssist AI. It lets users upload legal documents, chat with an AI to ask questions about those documents, generate summaries, compare files, and manage their account.

## Features

- **Document upload**: PDF, DOC, DOCX, TXT, RTF
- **Chat-based Q&A** over uploaded files
- **Summarize, Compare, Simplify, Highlight Evidence** actions
- **Auth**: Email/password login & registration
- **Responsive UI** with Tailwind CSS, shadcn/ui, Radix Primitives
- **Sidebar quick actions** and rich chat experience

## Tech Stack

- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui, Radix UI, lucide-react
- React Router, TanStack Query
- Form validation with React Hook Form + Zod

## Getting Started

Prerequisites: Node.js 18+

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Configuration

API base and endpoints are defined in `src/config/api.ts`.

- Default production API: `https://legaldoc-ai-production.up.railway.app/api`
- For local backend, change `API_CONFIG.BASE_URL` (e.g., `http://127.0.0.1:8000/api`).

No environment variables are required; update the config file directly as needed.

## Key Scripts

- `npm run dev` — start local dev server
- `npm run build` — create production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## Project Structure (high level)

- `src/pages/Login.tsx` — login page (with password visibility toggle)
- `src/pages/Register.tsx` — registration page (with password visibility toggle)
- `src/pages/Chat.tsx` — main chat and document operations UI
- `src/components/layout/AppSidebar.tsx` — sidebar with quick actions (Upload triggers chat upload dialog)
- `src/contexts/AuthContext.tsx` — auth state and helpers
- `src/config/api.ts` — API client and endpoints

## Deployment

This project uses Vite and includes a `netlify.toml` for simple Netlify deployment.

Basic flow:

1. `npm run build`
2. Deploy the `dist/` folder (Netlify, Vercel static, or any static host). Ensure the backend URL in `src/config/api.ts` is reachable from production.

## Notes

- Google sign-in is scaffolded but not implemented in the current UI.
- Upload limits (size/types) are enforced by the backend; ensure they match your backend configuration.
