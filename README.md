# ⚡ On-Demand Service Marketplace (Full Stack Assignment)

A robust full-stack application simulating a real-world booking lifecycle for home services. This system handles the complex state transitions between Customers, Providers, and the System (Auto-Assignment), complete with retry logic and observability.

## 🚀 Features

* **Core Booking Lifecycle:** Full FSM (Finite State Machine) implementation handling states: `PENDING` → `ASSIGNED` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`.
* **Smart Auto-Assignment:** Simulates a background worker that finds providers for pending bookings.
* **Retry Mechanism:** If a provider rejects a job, the system gracefully handles the failure, resets the state, and retries the assignment process automatically.
* **Observability:** Built-in **Audit Logging** tracks every state change, timestamp, and actor (User/System) for debugging and transparency.
* **Role-Based UI:** Single-page interface that toggles between **Customer**, **Provider**, and **Admin** views to demonstrate different workflows.

## 🛠️ Tech Stack

* **Frontend:** React (Vite), TypeScript, Tailwind CSS
* **Backend:** Node.js, Express, TypeScript
* **Database:** SQLite (Dev) / PostgreSQL (Production ready via Prisma)
* **ORM:** Prisma (Schema-first design)

---

## 🏁 Getting Started

This project is structured as a monorepo (`client` and `server`). Follow these steps to run it locally.

### Prerequisites
* Node.js (v16+)
* NPM

### 1. Backend Setup (Server)
The server handles the business logic, database connections, and state machine.

```bash
cd server
npm install

# Initialize the Database
npx prisma migrate dev --name init
npx prisma generate

# Start the Server (Runs on Port 4000)
npx ts-node src/index.ts
