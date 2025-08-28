# Overview

GreenPay is a modern fintech mobile application designed for international money transfers, specifically targeting remittances to Africa. The application provides a comprehensive digital wallet solution with virtual card capabilities, KYC (Know Your Customer) verification, and secure transaction processing. Built as a full-stack web application with mobile-first design, it offers seamless money transfer services with features like multi-currency support, virtual debit cards, and real-time transaction tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side routing optimized for single-page applications
- **State Management**: TanStack Query (React Query) for server state management and caching, with local state handled via React hooks
- **UI Framework**: Shadcn/ui components built on Radix UI primitives, providing accessible and customizable components
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes
- **Animations**: Framer Motion for smooth page transitions and interactive animations
- **Form Management**: React Hook Form with Zod validation for robust form handling and validation

## Backend Architecture
- **Runtime**: Node.js with TypeScript for full-stack type consistency
- **Framework**: Express.js for RESTful API development with custom middleware for logging and error handling
- **Data Storage**: In-memory storage implementation (MemStorage) with interface-based architecture for easy database integration
- **Database ORM**: Drizzle ORM configured for PostgreSQL with type-safe database operations
- **Session Management**: Connect-pg-simple for PostgreSQL-based session storage

## Authentication & Security
- **Authentication**: Custom authentication system with email/phone verification
- **Password Management**: Basic password handling (production would require bcrypt hashing)
- **Session Storage**: Server-side session management with PostgreSQL backing
- **Client Storage**: LocalStorage for user session persistence across browser sessions

## Data Layer
- **Schema Design**: Comprehensive database schema including users, KYC documents, virtual cards, transactions, and payment requests
- **Type Safety**: Shared TypeScript types between frontend and backend using Drizzle-Zod integration
- **Validation**: Zod schemas for runtime type validation on both client and server

## Mobile-First Design
- **Responsive UI**: Mobile-optimized interface with bottom navigation and touch-friendly interactions
- **Progressive Web App**: Configured for PWA capabilities with proper viewport settings
- **Touch Interactions**: Framer Motion integration for smooth mobile gestures and animations

# External Dependencies

## Database & Storage
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL for production scalability
- **Drizzle ORM**: Type-safe database operations with automatic migration generation
- **Session Store**: connect-pg-simple for PostgreSQL-based session management

## UI & Design System
- **Radix UI**: Comprehensive primitive components for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Google Fonts**: Roboto font family and Material Icons for consistent typography and iconography
- **Lucide React**: Modern icon library for additional UI elements

## Development & Build Tools
- **Vite**: Fast build tool and development server with React plugin
- **TypeScript**: Full-stack type safety and modern JavaScript features
- **ESBuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

## Third-Party Integrations
- **TanStack Query**: Advanced server state management with caching and synchronization
- **React Hook Form**: Performance-optimized form library with validation
- **Framer Motion**: Animation library for enhanced user experience
- **Zod**: Runtime type validation for API requests and form data

## Development Environment
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Error Handling**: Runtime error overlay and cartographer for debugging
- **Hot Module Replacement**: Vite HMR for rapid development cycles