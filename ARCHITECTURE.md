# Faz Scholars Challenge 2.0 - Platform Architecture

This document describes the decoupled folder structure for the scalable platform.

## Folder Structure

```text
/faz-scholars-platform
âââ /client               # FRONTEND (React / Next.js / Tailwind CSS)
â   âââ /public           # Static assets (images, icons)
â   âââ /src
â       âââ /assets       # Local assets
â       âââ /components   # Reusable UI components (Buttons, Layouts, Tables)
â       âââ /context      # Global state management
â       âââ /hooks        # Custom React hooks (e.g., useAuth)
â       âââ /pages        # Route components (Landing, Registration, Dashboard, ExamPortal)
â       âââ /services     # API calls to backend (axios/fetch wrappers)
â       âââ /utils        # Helper functions, formatters
â       âââ App.tsx
â       âââ main.tsx
â   âââ package.json      # Frontend dependencies
â   âââ tailwind.config.js
â 
âââ /server               # BACKEND (Node.js / Express)
â   âââ /src
â       âââ /config       # Database configuration, environment variables
â       âââ /controllers  # Request handlers (User, Exam, Grading)
â       âââ /middlewares  # Auth checks, input validation
â       âââ /models       # Mongoose/PostgreSQL Schemas
â       âââ /routes       # Express API routes
â       âââ /services     # Business logic (Emailing via Nodemailer, Auto-Grading)
â       âââ /utils        # Helpers (PDF generation, Password hashing, Tokens)
â       âââ server.ts     # Main entry point
â   âââ package.json      # Backend dependencies
â   âââ .env              # Secrets, DB URI (Not checked into source control)
```
