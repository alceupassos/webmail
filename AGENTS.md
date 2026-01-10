# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the Next.js App Router pages and layouts (for example `app/page.tsx`, `app/layout.tsx`), plus route segments like `app/auth/` and `app/protected/`.
- `components/` holds shared React UI; `components/ui/` is shadcn/ui primitives and `components/tutorial/` contains onboarding helpers.
- `lib/` provides shared utilities and Supabase helpers (`lib/supabase/`).
- Global styling lives in `app/globals.css` with Tailwind configured in `tailwind.config.ts`.
- `proxy.ts` configures request handling for Supabase session updates.

## Build, Test, and Development Commands
Run these from `email-prod/`:
- `npm install` installs dependencies (lockfile: `package-lock.json`).
- `npm run dev` starts the Next.js dev server at `http://localhost:3000`.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint with `next/core-web-vitals`.
- `npm run test` runs Vitest once; `npm run test:watch` runs in watch mode.

## Coding Style & Naming Conventions
- TypeScript + React with strict mode (`tsconfig.json`).
- Use 2-space indentation and semicolons to match existing files.
- File names are kebab-case (e.g., `components/auth-button.tsx`); React components use PascalCase.
- Prefer the `@/` path alias for internal imports.
- Tailwind CSS is the default styling approach.

## Testing Guidelines
- Tests are powered by Vitest (`vitest.config.ts`) with jsdom and Testing Library.
- Setup lives in `test/setup.ts`; use `*.test.ts` or `*.test.tsx` naming.
- Aim for coverage on new components and auth flows; note any gaps in PRs.

## Commit & Pull Request Guidelines
- No established commit convention yet; use short, imperative messages (e.g., `Add password reset flow`).
- PRs should include a brief summary, testing notes (commands run), and screenshots for UI changes; link issues when applicable.

## Configuration & Secrets
- Copy `.env.example` to `.env.local` and set Supabase values.
- Keep secrets out of Git; document new required env vars in `.env.example`.
