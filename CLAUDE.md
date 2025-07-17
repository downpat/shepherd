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

## Styling Guidelines
1. **Tailwind First**: Any styling suggestions should be attempted first in a Tailwind context
2. **DRY with @apply**: When creating multiple elements with the same Tailwind classes, use the @apply directive in the relevant CSS file (e.g., `ui/src/index.css`) so changes only need to be made in one place

## Core Domain Model
- **Dream**: User's aspirational goal with vision and target date
- **Goal**: Structured breakdown of dreams (short/medium/long-term)
- **Accomplishment**: Completed goals that shape user identity
- **Plan**: Strategy for achieving specific goals
- **Task**: Individual action items within plans
- **Habit**: Repeated tasks that become automatic behaviors

## Architecture: Implied Clean Architecture

### Core Principle: Dependencies Point Inward
We follow Clean Architecture principles without strict layer enforcement, allowing the project to mature organically.

### Current Structure (Phase 1)
```
src/
├── components/           # UI layer
├── domain/              # Business logic (pure functions/objects)
└── services/            # External concerns (storage, API)
```

### Dependency Rules
1. **Domain layer**: Pure JavaScript, no external dependencies
2. **Service layer**: Can use domain, cannot use UI
3. **UI layer**: Can use domain and services, owns React state
4. **Test by dependency**: Business logic should be testable without React

### Evolution Triggers
- **Add TypeScript**: When team grows or domain complexity increases
- **Formal Use Cases**: When business logic becomes procedurally complex
- **Repository Pattern**: When multiple data sources are needed

### Migration Path
- Phase 2: Add `hooks/` and organize by feature
- Phase 3: Add formal `adapters/` and `infrastructure/` layers

## Development Guidelines

### Keep It Simple Rules
- Start with functions before classes
- Use plain objects before complex state management
- Add abstraction when you feel pain, not before

### Session Management
**At the start of each Shepherd session:**
1. Read ClaudeSession.md to understand previous work
2. Provide project status report including:
   - Summary of last session's changes
   - Architectural impact assessment
   - Recommendations for next maturity steps
3. Update ClaudeSession.md at session end

## Current Status
- Initial repository setup complete
- Architecture: Implied Clean Architecture established
- Phase: 1 (Small project, basic React setup)
- Next Milestone: Create domain structure with core entities
