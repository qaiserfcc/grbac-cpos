# 02 - Frontend Setup (cpos-web)

Status: completed
Assigned: Copilot

Purpose

Initialize the frontend project skeleton for CPOS web app and verify the development environment.

Subtasks

- Create Next.js app with TypeScript and Tailwind
- Install dependencies: shadcn/ui, Zustand, SWR, react-hook-form, zod, axios
- Initialize `components/`, `app/`, and layout
- Add `.env.example` with `NEXT_PUBLIC_API_URL`
- Add scripts: dev, build, test, lint

Acceptance Criteria

- `cpos-web` folder with working `pnpm dev` or `npm run dev`

Notes

- Added required dependencies (shadcn/ui CLI, Zustand, SWR, React Hook Form, Zod, Axios) and normalized the dev script so `npm run dev` runs Next.js directly.
- Created `frontend/.env.example` with `NEXT_PUBLIC_API_URL` for easy onboarding.
- Verified existing `app/` layout and components bootstrap with providers.
