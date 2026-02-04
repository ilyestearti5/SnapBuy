# SnapBuy AI Coding Guidelines

## Introduction

This document provides comprehensive guidelines for AI-assisted development in the SnapBuy project. SnapBuy is a multi-platform SaaS application built on the @biqpod/app framework, designed to help businesses manage stores, deliveries, products, and clients with AI assistance. It supports web (Vite), mobile (Capacitor), and desktop (Electron) platforms.

## AI Assistant Guidelines

- **Command Execution**: Do not execute build, dev, or lint commands directly. When providing terminal commands to users, always prefix them with `cmd /c "{command}"`.
- **Code Generation**: Follow project conventions strictly. Use TypeScript, React 18, Tailwind CSS, and @biqpod/app abstractions.
- **File Structure**: Maintain the established folder structure. Place components in `src/components/`, export from `index.ts`, and document with `.examples.md` files.
- **State Management**: Use @biqpod/app hooks (`useCopyState`, `useUser`, `useAction`) instead of local state. Communicate via `setFieldValue` and `execAction`.
- **Validation**: After substantive changes, run relevant tests/lints automatically and validate code works.

## Architecture Overview

- **Frontend**: React 18 with TypeScript, Tailwind CSS, Framer Motion animations, React Router for navigation.
- **Backend**: Serverless via Firebase + Supabase integration through @biqpod/app cloud APIs.
- **AI Integration**: Local AI servers (e.g., localhost:1234 for models, localhost:7855 for tools) with OpenAI-compatible API.
- **Key Modules**:
  - `src/Agent/`: AI chat interface and functionality.
  - `src/Deliveries/`: Delivery management system.
  - `src/routes/`: Page routing configuration.
  - `src/components/`: Reusable UI components.

Data flows through `cloud.nosql` (Firestore-like), `cloud.functions` (serverless), and `cloud.ai` for AI calls.

## Development Workflow

- **Start dev server**: `cmd /c "npm run dev"` (runs on port 4593 from `project.json`).
- **Build**: `cmd /c "npm run build"` (TypeScript compile + Vite build).
- **Desktop build**: `cmd /c "npm run electron.windows.build"` (for Windows Electron app).
- **Lint**: `cmd /c "npm run lint"` (ESLint).
- **Debugging**: Use React DevTools; AI services connect to local servers—ensure they're running for `src/Agent/` features.

## Project Conventions

- **Component Structure**: Place in `src/components/`, export from `src/components/index.ts`. Use `.examples.md` for component docs (e.g., `TabsView.examples.md`).
- **Routing**: Define routes in `src/App.tsx` with React Router. Use `AnimatedPage` from `src/animations/components.tsx` for transitions.
- **State & Hooks**: Use @biqpod/app hooks over local state. Communicate via `setFieldValue("field.path", value)` and `execAction("actionName", payload)`.
- **APIs**: Centralize in `src/apis/`. AI calls via `aiService.ts` (local server at http://localhost:1234/v1). Cloud ops via `src/server.ts` exports (`db`, `functions`, `auth`).
- **Styling**: Tailwind CSS with `tw()` utility from @biqpod/app. Colors set in `src/main.tsx` via `setLightColor`.
- **Translations**: Use `Translate` component with keys from `src/translations.ts`.
- **Icons**: Import from `allIcons` in @biqpod/app/ui/apis.
- **File Attachments**: Support in AI chat via `FileAttachment` interface in `src/Agent/index.tsx`.
- **Tools Integration**: AI tools fetched from localhost:7855, transformed to OpenAI format in `aiService.ts`.

## Key Components

The `src/components/` directory contains reusable UI components. Key components include:

- **TabsView**: A flexible tabbed interface component supporting icons, labels, badges, and content switching. Supports variants (default, pills, underline) and sizes (sm, md, lg). Exported with `TabItem` type.
- **ProductCard**: Displays product information with add-to-cart functionality, pricing, availability, and stock status. Supports compact mode and customizable display options.
- **OrderCard**: Shows order details including status, date, products, and actions like view details, track, or reorder. Includes status indicators with colors and icons.
- **StoreDeliveryPricing**: Manages delivery pricing configurations for stores.
- **Vars**: Component for handling variable inputs and displays.
- **OrderEditPopup**: Popup for editing order details.

Components are documented with `.examples.md` files providing usage examples and variants.

## Key Files & Patterns

- `src/App.tsx`: Main router; add new routes here (e.g., `<Route path="/new-feature" component={NewFeature} />`).
- `src/server.ts`: Cloud config; endpoints for functions (dev: localhost:3000, prod: koyeb.app).
- `src/Agent/index.tsx`: AI chat UI; models list in `AVAILABLE_MODELS`.
- `src/Deliveries/index.tsx`: Delivery sub-router; sub-components in `src/Deliveries/`.
- `src/utils.ts`: App-wide constants like `tabServices`, `appTabs`.
- `src/hooks/`: Custom hooks (e.g., `useUrlSettings.ts` for URL params).
- Avoid direct DOM manipulation; use @biqpod/app abstractions.

## AI-Specific Notes

- Models: Default to gpt-3.5-turbo; switch via UI in Agent component.
- Streaming: Enabled for real-time responses in `aiService.ts`.
- Tools: Dynamic loading from local server; ensure compatibility with OpenAI tool format.
- Attachments: Handle files in messages; display via `AnimatedMarkdownRenderer`.
