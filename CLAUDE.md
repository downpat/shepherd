# Claude Context for Shepherd Project

## Project Overview
Shepherd is a Summer 2025 side project that synthesizes personal psychology research into software that acts as a helpful guide for important life goals. In the UI, "Shepherd" refers to the entity/guide that types the intro text and interacts with users.

## Repository Structure
- `/claude/shepherd/app-repo/` - Main application repository
- `/claude/shepherd/app-repo/ui/` - React UI application
- `/claude/shepherd/app-repo/ui/local.Dockerfile` - Docker configuration for UI
- `/claude/shepherd/app-repo/ui/conf/` - Configuration files (vite, tailwind, postcss)
- `/claude/shepherd/app-repo/svc/` - Backend API service (Node.js/Express)
- `/claude/shepherd/app-repo/svc/local.svc.Dockerfile` - Docker configuration for API service
- `/claude/shepherd/app-repo/svc/local.db.Dockerfile` - Docker configuration for MongoDB
- `/claude/shepherd/app-repo/svc/db-entrypoint.sh` - MongoDB initialization script
- `README.md` - Project description
- `LICENSE` - Project license

## Docker Setup

### Frontend (UI)
- Build context: `ui/` directory
- Dev server: port 5173
- Build command: `cd ui && docker build -f local.Dockerfile -t shepherd-ui ./`

### Backend Services
- **API Service**: `cd svc && docker build -f local.svc.Dockerfile -t shepherd-svc ./`
- **Database**: `cd svc && docker build -f local.db.Dockerfile -t shepherd-db ./`
- **MongoDB**: Port 27017 with auth (dreamshepherd/shepherd_dev_pass)
- **Express API**: Port 3001 with CORS enabled for frontend

## Development Notes
- Project is in early stages
- Focus on personal psychology research integration
- Goal-oriented guidance software

## Common Commands
(To be updated as project develops)

## Architecture & Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Shadcn/ui (Port 5173)
- **Backend API**: Node.js + Express + Mongoose (Port 3001)  
- **Database**: MongoDB Community Server (Port 27017)
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

### Entity Hierarchy (by Importance & Intention)
- **Dream**: Dreamer's highest aspirational vision with profound personal meaning
- **Goal**: SMART framework implementation supporting Dreams with measurable outcomes
- **Accomplishment**: Completed goals that shape Dreamer identity
- **Plan**: Strategy for achieving specific goals
- **Task**: Individual action items within plans
- **Habit**: Repeated tasks that become automatic behaviors

### Hierarchy of Disposability & UX Weight
1. **Dreams** (Least Disposable - Highest Weight)
   - Sacred, weighty, require deep intention
   - Dreamers should have "less than a handful" of dreams
   - Death of a dream causes real disappointment
   - Require contemplative state of mind to create
   - Full-page experiences, never small UI elements
   - Descriptive and comprehensive by design

2. **Goals** (Moderately Disposable)
   - SMART framework implementation (Specific, Measurable, Attainable, Relevant, Time-bound)
   - Support and serve Dreams with structured, measurable outcomes
   - Can be adjusted, refined, or replaced as learning occurs
   - Loosely coupled to Dreams to support future many-to-many relationships

3. **Plans** (More Disposable)
   - Tactical approaches to Goals
   - Should be adapted as learning occurs
   - Failure of plans is expected and healthy

4. **Tasks** (Most Disposable - Lowest Weight)
   - Highly disposable, can be created/deleted flippantly
   - Task death should be "shrugged off as soon as possible"
   - Lightweight UI interactions appropriate
   - Quantity over quality mindset acceptable

## Goals Entity Specification

### SMART Framework Implementation
Goals follow the SMART framework to ensure structured, measurable outcomes:

- **S - Specific**: Clear title and detailed description
- **M - Measurable**: Target (what to achieve) and magnitude (how much/many)
- **A - Attainable**: Confidence score (1-10 scale) indicating achievability within timeframe
- **R - Relevant**: Relevance field explaining connection to Dream(s)
- **T - Time-bound**: Time horizon and specific deadline

### Time Horizons and Deadlines
Goals are categorized by time horizon with corresponding deadline specificity:

1. **Short-term** (`timeHorizon: 'short-term'`)
   - Deadline: Specific day (YYYY-MM-DD format)
   - Timeframe: Within 1 year
   - Examples: "Browse 10 colleges by August 4th, 2025", "Read 5 fitness books by July 31st, 2025"

2. **Mid-term** (`timeHorizon: 'mid-term'`)
   - Deadline: Specific month (YYYY-MM format)
   - Timeframe: Within 3 years
   - Examples: "Complete certification by October 2027", "Launch side business by March 2026"

3. **Long-term** (`timeHorizon: 'long-term'`)
   - Deadline: Specific year (YYYY format)
   - Timeframe: 5+ years in future (recommended)
   - Examples: "Become department head by 2030", "Achieve financial independence by 2035"

### Goal Categories
Goals are organized by category for filtering and organization:

- **Health**: Medical, wellness, mental health goals
- **Fitness**: Physical activity, strength, endurance goals
- **Education**: Learning, degrees, certifications, skill development
- **Professional**: Career advancement, job changes, skill building
- **Social**: Relationships, networking, community involvement
- **Family**: Family relationships, parenting, family events
- **Money**: Financial goals, savings, investments, income
- **Spiritual**: Religious practice, meditation, personal growth

*Note: Categories may be expanded based on Dreamer suggestions over time*

### Goal-Dream Relationships
- **Current**: One Dream to Many Goals (loosely coupled)
- **Future**: Designed to support many-to-many relationships
- **Implementation**: Goals store array of `dreamIds` for flexibility
- **Rationale**: Dreams may change or merge; Goals may serve multiple Dreams

### Goal Status Lifecycle
- **active**: Goal is being pursued (default)
- **completed**: Goal has been achieved
- **paused**: Temporarily suspended with reason
- **abandoned**: Permanently discontinued with reason

### Validation Rules
- Title: Required, max 200 characters
- Description: Required, provides specificity
- Target: Required, defines what to achieve
- Magnitude: Required, quantifies the target
- Confidence: Integer 1-10, indicates attainability
- Relevance: Required, explains connection to Dreams
- Category: Must be from predefined categories
- Time Horizon: Must be short-term, mid-term, or long-term
- Time Limit: Required, validated against time horizon constraints
- Dream IDs: Must be array (can be empty for standalone goals)

### Short-term Goals vs Tasks Distinction
Short-term goals are still **Goals** (not Tasks) when they:
- Require strategic thinking and planning
- Have significant impact on Dream progress
- Involve exploration or learning phases
- Need structured measurement and tracking
- Examples: "Browse 10 colleges by August 4th" or "Read intros of 5 fitness books by July 31st"

Tasks are more operational and immediate action items within Plans.

## Plans, Tasks, Sessions, and Habits Specification

### Plans: The Daily Workspace
Plans represent the Dreamer's daily workspace - where they spend most of their time interacting with DreamShepherd. Plans have a one-to-one relationship with Goals and serve as the operational center for achieving them.

**Key Features:**
- **Mission Statement with Versioning**: Tracks evolving approach to achieving the Goal
- **Mission History**: Volumes/chapters showing how ideas have changed over time
- **Daily Workspace**: Primary interface where Dreamers work with Tasks, Sessions, and Habits
- **Statistics Tracking**: Progress metrics across all work items

**Mission Statement Evolution:**
- Plans track multiple versions of their mission statement
- Each version includes creation date and reason for change
- Allows Dreamers to understand how their approach has evolved
- Mission statements serve as justification/manifesto for the plan

### Tasks: Simple, Disposable Activities
Tasks are specific, well-defined activities that can be completed like checklist items. They are highly disposable and easy to create.

**Key Features:**
- **Minimal Fields**: Just title, scheduledDate, scheduledTime, status
- **Three Statuses**: scheduled, completed, skipped
- **Integer IDs**: Simple numbering for easy reference and autocomplete
- **Collision-Safe Slugs**: Include ID to prevent naming conflicts
- **Easy Cloning**: Support for repeating tasks with autocomplete

**Design Philosophy:**
- Highly disposable - "shrugged off as soon as possible" when skipped
- No completion timestamps - tasks are done at scheduled time
- No descriptions or mission connections - keep simple
- No rescheduling - let tasks disappear if not done

### Sessions: Discovery and Practice Time
Sessions are time and energy set aside for discovery, practice, and learning. Unlike tasks, they focus on process over concrete outcomes.

**Key Features:**
- **Prerequisites**: Conditions like "quiet workspace", "not too tired", "guitar available"
- **Duration**: Specific time length in minutes
- **Mission Connection**: How the session relates to the plan's mission statement
- **Post-Session Reflection**: sessionNotes and sessionMood for capturing outcomes
- **Real-Time UI**: Sessions will have their own UI for use during the session

**Session Reflection:**
- **sessionNotes**: What they learned/accomplished/experienced
- **sessionMood**: How they felt about the session
- Only populated after session completion

### Habits: Earned Identity Badges
Habits represent Tasks or Sessions that have become automatic behaviors through repetition. They affect the Dreamer's identity and are earned through perseverance.

**Architecture: Two-Entity System**
Habits are presented as one thing to users but implemented as two entities:

1. **HabitIdentity** (Complex UUID):
   - The earned badge/identity marker
   - Name chosen by Dreamer (badge of honor)
   - Source information (what Task/Session it evolved from)
   - Status tracking (active, paused, retired)

2. **HabitInstance** (Simple pairing):
   - Links HabitIdentity to specific Tasks
   - Just habitIdentityId + taskId
   - Eliminates duplication with Task entity

**Habit Promotion System:**
- Tasks/Sessions become eligible for habit status after 30+ completions in 60 days
- Algorithm filters last 60 days, groups by title, counts completions
- Applied to both Tasks and Sessions independently
- Promotes items that demonstrate consistent routine behavior

### Entity Relationships
- **IntroDreamer** → **Dreamer** (upgrade path, preserves context)
- **Dreamer** → **Dream** (one-to-many, ownership)
- **Dream** → **Goal** (one-to-many, loosely coupled)  
- **Goal** → **Plan** (one-to-one)
- **Plan** → **Tasks/Sessions** (one-to-many)
- **HabitIdentity** → **HabitInstance** → **Task** (habit system)

### Time Horizons
- **Dreams**: Timeless visions
- **Goals**: SMART timeframes (short/mid/long-term)
- **Plans**: Active operational period
- **Tasks/Sessions**: Specific day/time scheduling
- **Habits**: Ongoing routine behaviors

## Architecture: Implied Clean Architecture

### Core Principle: Dependencies Point Inward
We follow Clean Architecture principles without strict layer enforcement, allowing the project to mature organically.

### Current Structure (Phase 1+)
```
app-repo/
├── ui/src/
│   ├── components/      # UI layer (React components)
│   ├── domain/          # Business logic (pure functions/objects)
│   └── services/        # Frontend services (local storage, coordination)
└── svc/
    ├── models/          # Mongoose ODM schemas (IntroDreamer, Dreamer, Dream)
    ├── services/        # Backend business logic (UpgradeService)
    ├── routes/          # Express API endpoints
    ├── server.js        # Express API server
    └── Dockerfiles      # Backend containerization
```

### Three-Layer Architecture Details

#### 1. Domain Layer (`src/domain/`)
**Purpose**: Pure business logic and entities
**Rules**: 
- No external dependencies (React, APIs, storage)
- Pure JavaScript functions and objects
- Contains entity creation, validation, and business rules
- Testable without any framework

**Current Files**:
- `Dream.js`: Core Dream entity with factory functions, validation, and business operations
- `RoleModel.js`: Supporting entity for inspiration and guidance resources

#### 2. Service Layer (`src/services/`)
**Purpose**: Coordinates business operations and manages external concerns
**Rules**:
- Can import and use domain layer
- Cannot import UI components or React-specific code
- Handles data persistence, API calls, and complex business workflows
- Provides event system for UI reactivity

**Current Files**:
- `DreamService.js`: Singleton service managing Dream CRUD operations, validation, search, and event notifications

#### 3. UI Layer (`src/components/`)
**Purpose**: React components and user interface
**Rules**:
- Can use both domain and service layers
- Owns React state and UI logic
- Handles user interactions and presentation
- Connects business logic to user interface

**Current Files**:
- `DreamEditor.jsx`: Form component for creating and editing Dreams with validation and state management

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

### Docker Environment Rules
- **Claude is in a Docker container** and cannot directly modify other containers
- **API Service Dependencies**: User must run `npm install` commands in the API container
- **Database Commands**: User must handle database container operations
- **File System**: Claude can only modify files in the shared `/claude/shepherd/app-repo/` directory

### Keep It Simple Rules
- Start with functions before classes
- Use plain objects before complex state management
- Add abstraction when you feel pain, not before

### UX Weight & Intention Rules
1. **Dreams Must Feel Sacred**: Never trivialize Dream creation/editing
2. **Full-Page Respect**: Dreams deserve full-page experiences, never modals or small lists
3. **Contemplative Design**: Dream interfaces should encourage thoughtful, intentional interaction
4. **Hierarchy Reflection**: UI weight should match entity importance (Dreams > Goals > Plans > Tasks)
5. **Anti-Productivity Mindset**: We are NOT building a task manager - we're building a life transformation tool
6. **Shepherd-Only Guidance**: All helper text, instructions, and guidance must come from Shepherd UI elements - never inline text or labels

### Two-Model Authentication UX
7. **Low-Friction Sacred Entry**: IntroDreamer model allows immediate Dream creation with just email + title/vision
8. **Contemplative Scheduling**: Honor Dreamer's request for contemplative timing with reminder system
9. **Seamless Upgrade Path**: IntroDreamer → Dreamer transition preserves all sacred Dream content and context
10. **Registration Gate for Goals**: Full registration required before creating first Goal (natural progression point)
11. **Preserve Journey Context**: Original creation dates and upgrade history maintain continuity of Dreamer's journey

### Dreamer Terminology
- Always refer to people using DreamShepherd as "Dreamers", never "users"
- "IntroDreamers" for those in the lightweight pre-registration phase
- This terminology reflects the aspirational, intentional nature of the application at every stage

### Code Organization Rules
1. **Group by Relationship, Then Alphabetize**:
   - Organize imports, variables, and code blocks by their conceptual relationship
   - Within each relationship group, use alphabetical order
   - Example: State variables grouped by UI phase (Intro vs Input), then alphabetized within each group

2. **Clear Section Boundaries**:
   - Use comment blocks to separate logical sections
   - Group related functionality together (all state, all event handlers, etc.)
   - Maintain consistent grouping patterns across similar files

### Error Handling & Defensive Programming Philosophy
DreamShepherd follows a defensive programming approach with extensive error handling throughout the application stack.

**Core Principles**:
1. **Layered Error Messages**: Errors propagate through the architecture layers (Domain → Service → UI) with context added at each level for easy stack tracing
2. **Defensive by Design**: Extensive input validation, null checks, and boundary protection throughout the codebase
3. **Fail Gracefully**: When errors occur, provide meaningful feedback and graceful degradation rather than crashes
4. **Wait to Barricade**: We defer heavy assertions and rigid boundary enforcement until demo users provide feedback on actual failure patterns

**Implementation Strategy**:
- **Domain Layer**: Comprehensive validation with detailed error messages
- **Service Layer**: Business logic protection with contextual error enrichment
- **UI Layer**: User-friendly error presentation with fallback states
- **Future Evolution**: After user testing, we'll identify where to "Barricade the Boundaries" (McConnell) with stricter validation

**Not Currently Implemented**:
- Heavy assertion libraries or Design by Contract methodologies
- Test-Driven Development as primary development approach
- Production assertion removal or performance-optimized error checking

This approach prioritizes reliability and debuggability while maintaining development velocity and allowing organic evolution based on real user feedback.

### Session Management
**At the start of each Shepherd development session:**
1. **Developer prayer reminder**: Remind Patrick to pray before beginning work
2. Read ClaudeSession.md to understand previous work
3. Provide project status report including:
   - Summary of last session's changes
   - Architectural impact assessment
   - Recommendations for next maturity steps
4. Update ClaudeSession.md at session end

## Current Status
- **Architecture**: Complete MERN stack with two-model authentication system
- **Authentication**: IntroDreamer (lightweight) + Dreamer (full JWT) with seamless upgrade path
- **Security**: Production-ready Argon2id hashing, JWT access/refresh tokens, rate limiting, account lockout
- **Backend API**: Complete authentication + Dream CRUD with smart conflict resolution and ownership
- **Database**: MongoDB with proper indexing, TTL for IntroDreamer cleanup, and dreamer-scoped data
- **Frontend Services**: Complete services for all 7 domain entities (ready for API integration)
- **UI**: Contemplative DreamEditor with Tiptap rich text editor, chiseled stone well design, and floating toolbar
- **Testing**: Comprehensive integration test suite covering all endpoints and edge cases
- **Network**: Docker host networking for multi-device access across UI (5173), API (3001), DB (27017)
- **Phase**: 2 (Complete backend vertical slice, ready for frontend integration)
- **Files**: 30+ total (major expansion with complete authentication system)

## Next Session Priorities
1. **Integration Test Completion** (Critical):
   - Fix JSON syntax error in auth route and curl escaping issues
   - Complete full test suite validation with all endpoints
   - Ensure authentication flow works end-to-end

2. **Frontend API Integration** (High Priority):
   - Update DreamService to use HTTP API instead of localStorage
   - Implement JWT token management in React (access/refresh flow)
   - Add authentication state management and protected routes
   - Connect Dream CRUD operations to backend API

3. **Mobile-First UI Design** (High Priority):
   - Complete responsive design implementation
   - Test authentication flow on mobile devices
   - Touch-friendly interactions, mobile toolbar layout
   - Responsive chiseled stone well and floating toolbar

4. **Shepherd UI Design** (High Priority):
   - Create Shepherd UI element as the sole source of guidance
   - Replace all helper text with Shepherd interactions  
   - Design contextual guidance system with Shepherd personality
   - Rule: No inline text or labels - all guidance through Shepherd UI

5. **Complete Application Flow**:
   - DreamsDashboard implementation
   - Goals entity integration
   - Full Dreamer journey from Intro → Dreams → Goals → Plans
