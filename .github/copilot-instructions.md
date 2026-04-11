# Project Guidelines

## Core Tech Stack

- Frontend: React 19 with TypeScript and Vite
- Styling: Tailwind CSS with Radix UI components
- State: Zustand
- WebGL Engine: Custom Voroforce library (`voroforce/`), OGL, GLSL shaders

## Commands

We use `bun` for development and testing:

- **Dev/Build**: `bun dev`, `bun build`, `bun preview`
- **Formatting/Linting**: `bun format`, `bun lint` (Biome rules)
- **Unit Tests**: `bun run test` (Vitest - do NOT use `bun test`)
- **E2E Tests**: `bun test:e2e` (Playwright)

## Architecture & Code Boundaries

- `app/` - React application, including Zustand store (`app/store/`), React components (`app/cmps/`), and Voroforce React integration (`app/vf/`).
- `voroforce/` - Standalone Vanilla JS WebGL simulation engine for the Voronoi force simulation.
- **Data flow**: JSON files run from `public/json/` -> ingested by Voroforce -> React connects through Zustand.

## Conventions

- Code Style: Follow Biome configuration (2-space indent, single quotes, Tailwind sorting).
- Testing: See `app/test/README.md` for specific testing patterns and guidelines.
- Documentation: Check `docs/tasks.md` and `docs/seo-indexing.md` for project planning and SEO requirements respectively.
