# Medical Staff Follow-up System

## Overview

This is a React-based web application for managing medical staff follow-ups in an outpatient care facility ("Öppenvård"). The system provides a comprehensive dashboard for tracking staff information, follow-up appointments, and administrative data with a focus on healthcare workflow management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Single-page application with component-based navigation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via Drizzle)
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple
- **API Design**: RESTful API with JSON responses

### Data Storage
- **Primary Database**: PostgreSQL via Neon Database serverless connection
- **Development Storage**: In-memory storage implementation for development/testing
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL-based sessions for user state persistence

## Key Components

### Data Models
1. **Staff** - Core staff member information including personal details, employment data, and contact information
2. **Follow-ups** - Medical follow-up records linked to staff members with status tracking, comments, and priority levels

### UI Components
- **Dashboard** - Overview with statistics and recent activity
- **Staff Sidebar** - Navigation and staff member filtering
- **Staff Section** - Individual staff member management
- **Follow-up Forms** - Data entry and management for follow-up records
- **Personal Info Forms** - Staff member information management

### API Endpoints
- Staff CRUD operations (`/api/staff`)
- Follow-up CRUD operations (`/api/followups`)
- Data export functionality (`/api/export`)

## Data Flow

1. **Client Requests**: React components use TanStack Query to fetch data from Express API endpoints
2. **API Processing**: Express routes validate requests using Zod schemas and interact with storage layer
3. **Data Storage**: Drizzle ORM handles database operations with PostgreSQL
4. **Response Handling**: API responses are cached by React Query and updates trigger UI re-renders
5. **Form Submissions**: React Hook Form handles client-side validation before API submission

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless** - Serverless PostgreSQL connection for production
- **drizzle-orm** - Type-safe database ORM
- **@tanstack/react-query** - Server state management
- **react-hook-form** - Form handling and validation
- **zod** - Runtime type validation
- **@radix-ui/** - Accessible UI component primitives

### Development Dependencies
- **Vite** - Build tool and development server
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Replit plugins** - Development environment integration

## Deployment Strategy

### Development
- Vite development server with hot module replacement
- In-memory storage for rapid development iteration
- TypeScript compilation and type checking
- Automatic browser refresh on code changes

### Production
- **Build Process**: Vite builds optimized React bundle, esbuild bundles Express server
- **Server Bundle**: Single JavaScript file with external dependencies
- **Database**: PostgreSQL connection via environment variables
- **Static Assets**: Served from Express with Vite-built frontend
- **Environment Configuration**: Environment variables for database connection and API keys
- **Node.js Runtime**: Configured for Node.js 20+ with proper deployment scripts

### Deployment Configuration
The following files have been configured to ensure proper Node.js deployment:

1. **replit.toml** - Replit-specific deployment configuration with Node.js 20 runtime
2. **.replit** - Environment configuration with Node.js 20 module and deployment settings
3. **Dockerfile** - Container deployment support
4. **deploy.json** - General deployment metadata
5. **build.sh** - Automated build script for deployment
6. **deploy.sh** - Production deployment script with validation

### Recent Deployment Fixes (August 2025)
- ✓ Updated replit.toml deployment command to use `node dist/index.js` directly
- ✓ Verified Node.js 20 runtime is properly configured in .replit
- ✓ Confirmed build process creates dist/index.js correctly via esbuild
- ✓ Added deploy.sh script with Node.js version validation and build verification
- ✓ Tested production build runs successfully with Node.js command

### Deployment Commands
- **Build**: `npm run build` or `./build.sh` or `./deploy.sh`
- **Start Production**: `NODE_ENV=production node dist/index.js`
- **Start Development**: `npm run dev`
- **Prerequisites**: Node.js 18+ and npm 8+ (configured for Node.js 20)

### Key Architectural Decisions

1. **Monorepo Structure**: Single repository with shared types between client and server in `/shared` directory
2. **Type Safety**: End-to-end TypeScript with shared schemas using Drizzle and Zod
3. **Database Choice**: PostgreSQL for production reliability with Drizzle ORM for type safety
4. **Component Library**: Radix UI for accessibility and Tailwind for rapid styling
5. **State Management**: React Query eliminates need for complex client state management
6. **Form Validation**: Zod schemas shared between client and server for consistent validation
7. **Development Experience**: Vite for fast builds and hot reloading, TypeScript for developer productivity

The system is designed for healthcare environments with emphasis on data integrity, user experience, and maintainable code structure.