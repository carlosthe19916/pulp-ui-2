# Pulp UI

A React-based web application demo.

## Quick Start

```bash
# Install dependencies
npm ci

# Start development server
npm run start:dev
```

The application will be available at http://localhost:3000

## Project Structure

This is a monorepo with the following workspaces:

- `common/` - Shared ESM module for environment config and branding
- `client/` - React frontend application
- `server/` - Express.js production server

## Tech Stack

- React 19
- TypeScript
- PatternFly 6 (design system)
- Rsbuild (build tool)
- TanStack Query (data fetching)
- React Router 7

## Available Scripts

- `npm run start:dev` - Start development server
- `npm run build` - Build all workspaces
- `npm run check` - Lint and format check
- `npm run test` - Run tests
