# 🚗 Car Calculator Monorepo

*Read this in [Ukrainian (Українською)](README.uk.md)*

A modern web application for calculating the average price of used cars. The project is built on a **Monorepo (Turborepo)** architecture and uses cutting-edge tools for both backend and frontend.

## 🏗 Project Architecture

This repository is a monorepo consisting of several interconnected workspaces:

- **`apps/backend`**: REST API server powered by **NestJS 11**, PostgreSQL, and **Prisma ORM**.
- **`apps/frontend`**: Client application powered by **React 19**, **Vite**, and **Redux Toolkit (RTK Query)**.
- **`packages/types`**: A shared package containing TypeScript types and Zod schemas used by both backend and frontend (Single Source of Truth).
- **`packages/eslint-config`** & **`packages/typescript-config`**: Shared linter and TypeScript configurations to maintain a consistent code style across the monorepo.

## 🚀 Core Features (What's Done)

### Backend (100% MVP Readiness)
- ✅ **Security:** JWT authentication (access/refresh tokens in HTTP-Only cookies), password hashing (`bcrypt`).
- ✅ **Business Logic:** Mathematical calculation algorithm (Interquartile Range - IQR) to filter out anomalous (fake) car prices.
- ✅ **User Profile:** Get, update, delete user profile, and change password.
- ✅ **Infrastructure:** Global data validation (`zod` + `nestjs-zod`), Swagger API documentation, brute-force protection (`throttler`), Pino logging.

### Frontend (In Development)
- ⏳ Light, "airy" premium design (Vanilla CSS + CSS variables).
- ⏳ Form validation via `react-hook-form` + `zod`.
- ⏳ Redux Toolkit and API integration via RTK Query.

## 🛠 Tech Stack

- **Language:** TypeScript
- **Package Manager:** npm (Workspaces)
- **Builder:** Turborepo

**Backend:**
- NestJS (v11)
- Prisma ORM + PostgreSQL
- Passport.js (JWT)
- Zod (Validation)
- Swagger (OpenAPI docs)

**Frontend:**
- React (v19) + Vite
- Redux Toolkit (RTK Query)
- React Router (v7)
- React Hook Form + Zod

## ⚙️ Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL (locally or via Docker)

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
Create a `.env` file in the `apps/backend/` folder (based on `.env.example`) and specify your `DATABASE_URL`. Then apply the migrations:
```bash
npm run --workspace=apps/backend db:push
```
*(or navigate to `apps/backend` and run `npx prisma migrate dev`)*

### 3. Start Development (Dev Mode)
To run both the backend and frontend simultaneously using Turborepo:
```bash
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000](http://localhost:3000)
- **Swagger Documentation:** [http://localhost:3000/api](http://localhost:3000/api)

## 👤 Authors
Developed with love ❤️
