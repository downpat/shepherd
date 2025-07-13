# Claude Context for Shepherd Project

## Project Overview
Shepherd is a Summer 2025 side project that synthesizes personal psychology research into software that acts as a helpful guide for important life goals. In the UI, "Shepherd" refers to the entity/guide that types the intro text and interacts with users.

## Repository Structure
- `/claude/shepherd/app-repo/` - Main application repository
- `/claude/shepherd/app-repo/ui/` - React UI application
- `/claude/shepherd/app-repo/ui/local.Dockerfile` - Docker configuration for local development
- `/claude/shepherd/app-repo/ui/conf/` - Configuration files (vite, tailwind, postcss)
- `README.md` - Project description
- `LICENSE` - Project license

## Docker Setup
- Build context should be the ui directory
- Dev server runs on port 5173
- Build command: `cd ui && docker build -f local.Dockerfile -t shepherd-ui ./`

## Development Notes
- Project is in early stages
- Focus on personal psychology research integration
- Goal-oriented guidance software

## Common Commands
(To be updated as project develops)

## Architecture & Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Shadcn/ui
- **Build Tool**: Vite with config in `ui/conf/vite.config.js`
- **Styling**: Tailwind CSS with config in `ui/conf/tailwind.config.js`
- **PostCSS**: Config in `ui/conf/postcss.config.js`

## Important Config Notes
- Vite runs from `ui/` directory, so all config paths are relative to `ui/`
- Vite config: `css.postcss: './conf/postcss.config.js'`
- PostCSS config: `tailwindcss: { config: './conf/tailwind.config.js' }`
- Tailwind content paths: `./index.html` and `./src/**/*.{js,jsx}` (relative to `ui/`)

## Current Status
- Initial repository setup complete
- Ready for development planning and implementation
