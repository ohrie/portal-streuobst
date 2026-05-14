# Agent Guidelines

See [README.md](README.md) for project overview, structure, and deployment.

## Running Code

- **Python**: always use the project's venv — `source env/bin/activate` (or `source tree-detection/venv/bin/activate` for the tree-detection module) before running any Python script or installing packages
- **Next.js dev server**: `cd web && next dev --webpack` — never use Turbopack

## Code Conventions

### Frontend (web/)
- Tailwind CSS only — no inline styles, no CSS modules
- Icons from `lucide-react`: `import { Map } from 'lucide-react'`
- Never embed SVGs in JSX — always import them: `import Icon from './icon.svg'`
- Next.js `<Link>` for navigation, `<Image>` with `unoptimized: true`
- Theme colors: `bg-primary`, `text-foreground`, `bg-accent`
- Fonts: `font-body` (Roboto), `font-heading` (Epunda Slab)
- Mobile-first responsive: `md:`, `lg:` breakpoints
- Map page (`/karte`): uses `MinimalLayout.tsx`; all other pages: `StandardLayout.tsx`

### Naming
- Components: `PascalCase` (Header.tsx)
- Routes: `kebab-case` (/bewirtschaftung/page.tsx)
- Variables: `camelCase`

## Common Pitfalls

- Static export — no Next.js API routes, no server components with dynamic data
- No `'use client'` missing on interactive components
- No Turbopack (`next dev --webpack` only)
- No embedded SVGs in JSX
