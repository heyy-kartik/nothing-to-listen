# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

**nothing-to-listen** is an interactive WebGL music visualization app. It renders thousands of album art tiles in a force-directed Voronoi diagram using a custom engine called "Voroforce". Users can browse, search, and interact with tiles representing songs/albums fetched from Last.fm data.

## Development Commands

```bash
bun dev                 # Start dev server on port 3000 (host 0.0.0.0)
bun build               # TypeScript compile + Vite production build
bun preview             # Preview the production build on port 3000
bun lint                # Lint with Biome
bun format              # Format with Biome
bun check               # Run Biome checks (lint + format)
bun check:write         # Auto-fix Biome issues (with --unsafe)
bun analyze             # Production build with bundle analysis
bun clean:dist          # Remove dist/ folder
```

## Testing Commands

```bash
bun run test            # Run unit tests with Vitest (⚠️ use `bun run test`, NOT `bun test`)
bun test:unit           # Alias for unit tests
bun test:unit:ui        # Vitest UI mode
bun test:unit:coverage  # Unit tests with V8 coverage report
bun test:e2e            # Playwright end-to-end tests
bun test:e2e:headed     # E2E in headed browser mode
bun test:e2e:ui         # E2E with Playwright UI
bun test:e2e:debug      # E2E in debug mode
```

## Architecture & Code Boundaries

### Directory Structure

```
app/                        # React application
├── main.tsx                # Entry point — initializes Voroforce, renders React
├── app.tsx                 # Root App component
├── config.ts               # App-level config (Last.fm URLs, telemetry, etc.)
├── consts.ts               # Shared constants (e.g. THEME enum)
├── styles.css              # Global styles (Tailwind v4 + custom CSS)
├── voroforce.tsx            # React wrapper that mounts the Voroforce canvas
├── store/                  # Zustand store (slice pattern)
│   ├── index.ts            # Store creation with subscribeWithSelector middleware
│   ├── ui-slice.ts         # UI state (modals, theme, panels)
│   ├── voroforce-slice.ts  # Engine state (mode, preset, device class, cells)
│   ├── song-data-slice.ts  # Song/album data state
│   └── selectors.ts        # Memoized selectors
├── cmps/                   # React components
│   ├── ui/                 # Primitives (Button, Dialog, Drawer, Select, etc.) — Radix UI based
│   ├── common/             # Shared components (ErrorBoundary, Selector, Modal, CustomLinks)
│   ├── layout/             # Navbar, theme provider
│   └── views/              # Feature views (intro, song, favorites, settings, about, hotkeys)
├── hooks/                  # Custom hooks (useDimensions, useKeyPress, useMediaQuery, useTransitionState)
├── utils/                  # Utilities (settings persistence, math, media queries, telemetry, animations)
├── vf/                     # Voroforce ↔ React integration layer
│   ├── config/             # Engine configuration (display shaders, media, simulation, controls, lattice)
│   ├── presets/            # Visual preset definitions
│   ├── integrations/       # Bridges between React state and engine events
│   ├── utils/              # VF-specific utilities
│   ├── consts.ts           # Enums: VOROFORCE_MODE, VOROFORCE_PRESET, DEVICE_CLASS, CELL_LIMIT
│   └── types.ts            # VoroforceInstance, VoroforceCell types
└── test/                   # Test setup, mocks, and README

voroforce/                  # Standalone vanilla JS WebGL engine (NO React dependencies)
├── voroforce.js            # Main engine entry
├── default-config.js       # Default engine configuration
├── common/                 # Shared engine utilities and data structures
├── controls/               # User input handling (pan, zoom, click)
├── display/                # OGL-based rendering, GLSL shaders
├── simulation/             # Force simulation (multi-threaded Web Workers)
└── utils/                  # Engine-level utilities

functions/                  # Cloudflare Pages Functions (edge middleware)
scripts/                    # Build/data scripts (Last.fm fetch, sitemap generation, art download)
playwright-tests/           # E2E test specs
docs/                       # Project docs (tasks.md, seo-indexing.md)
public/                     # Static assets
├── json/                   # Song/album JSON data files
├── media/                  # Album art textures (multiple resolution variants)
├── assets/                 # Additional static assets
├── sitemap.xml             # SEO sitemap
└── favicon.svg             # App favicon
```

### Key Boundaries

- **`voroforce/`** is a **standalone vanilla JS library** — it must NOT import React, Zustand, or anything from `app/`. All integration goes through `app/vf/`.
- **`app/vf/`** is the **bridge** — it maps React/Zustand state to Voroforce engine calls and vice versa. New engine features should be configured here, not in `app/cmps/`.
- **`app/cmps/ui/`** contains **Radix UI primitives** styled with Tailwind CSS + CVA (class-variance-authority). These are generic, reusable building blocks.
- **`app/cmps/common/`** contains **app-specific shared components** (modals, selectors, error boundaries).
- **`app/cmps/views/`** contains **feature screens** — each subfolder is a distinct view/panel.

### Path Aliases

| Alias | Resolves To | Usage |
|-------|-------------|-------|
| `@`   | `./app`     | React application code |
| `√`   | `./voroforce` | WebGL engine code |

### Data Flow

1. Song/album data loaded from JSON files in `public/json/`
2. Album art textures served from `public/media/` (multiple resolution layers)
3. Voroforce engine processes data into a force-directed Voronoi simulation
4. React components read/write state through Zustand store (`app/store/`)
5. `app/vf/integrations/` syncs store state ↔ engine events
6. User interactions trigger mode changes: `intro` → `select` → `preview`

### State Management

The Zustand store uses the **slice pattern** with `subscribeWithSelector` middleware:

- **`ui-slice`** — theme, panel open/close states (settings, about, favorites)
- **`voroforce-slice`** — engine mode, preset, device class, cell data, focused/selected cell
- **`song-data-slice`** — loaded song metadata

Use `useShallowState()` for component subscriptions to avoid unnecessary re-renders.

### Voroforce Modes & Presets

**Modes** (`VOROFORCE_MODE`): `intro` (landing animation), `select` (browsing), `preview` (focused on a single cell)

**Presets** (`VOROFORCE_PRESET`): `mobile`, `minimal`, `depth`, `chaos` (WIP), `contours` (WIP/disabled)

**Device Classes** (`DEVICE_CLASS`): `mobile`, `low`, `mid`, `high` — used for adaptive quality settings

## Code Style & Conventions

### Biome Configuration

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for JS/TS and JSX
- **Semicolons**: Only as needed (ASI-safe)
- **Import sorting**: Enabled (auto-organized)
- **Tailwind class sorting**: Enabled via `useSortedClasses` (applies to `clsx`, `cva`, `tw`, `cn` helpers)
- No `forEach` restriction (`noForEach: off`)
- Unused imports auto-removed (warn + safe fix)

### TypeScript

- Strict mode enabled
- Path aliases: `@` → `./app`, `√` → `./voroforce`
- GLSL imports typed via `app/glsl.d.ts`

### Component Patterns

- UI primitives in `app/cmps/ui/` use `React.forwardRef` + CVA for variant styling
- Feature views are lazy-loaded via `lazy-primary-views.tsx`
- Use `cn()` (from `app/utils/tw.ts`) for conditional class merging (clsx + tailwind-merge)
- Forms use React Hook Form + Valibot for validation

## Environment Variables

See `.env.local.example` for all available vars:

```env
VITE_TEXTURES_BASE_URL=/media           # Base URL for album art textures
VITE_FILM_INFO_BASE_URL=/json           # Base URL for song/album JSON data
VITE_MEDIA_VERSION_0_LAYERS=1           # Texture resolution layer count (version 0)
VITE_MEDIA_VERSION_1_LAYERS=1           # Texture resolution layer count (version 1)
VITE_MEDIA_VERSION_2_LAYERS=1           # Texture resolution layer count (version 2)
VITE_EXPERIMENTAL_MEDIA_VERSION_3_ENABLED=1  # Enable experimental v3 textures
VITE_COMPRESS_GLSL=                     # Enable GLSL minification in build
VITE_ANALYZE_BUNDLE=                    # Enable bundle analysis
VITE_TELEMETRY_ENABLED=                 # Enable telemetry (set to "1" or "true")
VITE_TELEMETRY_ENDPOINT=                # Telemetry endpoint URL
VITE_APP_VERSION=                       # App version string
```

## Testing Guidelines

- **Unit tests**: Colocated with source (e.g. `button.test.tsx` next to `button.tsx`), or in `app/store/`
- **E2E tests**: In `playwright-tests/` (separate from Vitest)
- **Test setup**: `app/test/setup.ts` provides mocks for WebGL, ResizeObserver, matchMedia, localStorage, Performance API
- **Coverage**: Excludes `voroforce/` (WebGL engine), Playwright tests, type definitions
- **Patterns**: Deterministic data, isolated tests, behavior-focused, snapshot tests for stable UI components

See `app/test/README.md` for detailed testing patterns and examples.

## SEO & Deployment

- **Hosting**: Cloudflare Pages (see `functions/_middleware.js` for edge middleware)
- **Sitemap**: `public/sitemap.xml` — regenerate with `bun seo:sitemap`
- **Validate SEO**: `bun seo:validate`
- **Headers**: `public/_headers` for custom HTTP headers
- Docs: `docs/seo-indexing.md` for SEO strategy, `docs/tasks.md` for project planning

## Important Notes

- The CORS headers in `vite.config.ts` use `Cross-Origin-Embedder-Policy: credentialless` (not `require-corp`) to allow image hotlinking while still enabling SharedArrayBuffer for multi-threaded simulation.
- The `voroforce/` engine uses Web Workers for off-main-thread force simulation.
- GLSL shader files (`.frag`, `.vert`) are imported via `vite-plugin-glsl` and typed in `app/glsl.d.ts`.