# TrackFlow 🚀

> A full-stack **Reimbursement & Expense Management System** built with Node.js, Express, MongoDB, React, and Tailwind CSS.

## 📁 Repository Structure

```
Track-Flow/
├── backend/    — Node.js + Express REST API
└── frontend/   — React + Tailwind CSS UI
```

---

## ✨ Features

- **Multi-tenant** — Each company is fully isolated
- **Role-based access** — Admin, Manager, Employee
- **Approval workflow engine** — Sequential or parallel, configurable per category
- **Receipt uploads** — JPEG, PNG, PDF (5MB limit)
- **Analytics & Reports** — KPI dashboard, category breakdown, monthly trends
- **Secure** — JWT auth, bcrypt hashing, Helmet headers, rate limiting

---

## 🧪 Demo Accounts

> Run `npm run seed` inside `backend/` first to create these accounts.

| Role | Email | Password | Dashboard |
|---|---|---|---|
| 👑 Admin | `admin@trackflow.com` | `admin1234` | `/admin` |
| 👔 Manager | `sarah@trackflow.com` | `manager1234` | `/manager` |
| 👤 Employee | `bob@trackflow.com` | `employee1234` | `/employee` |
| 👤 Employee | `alice@trackflow.com` | `employee1234` | `/employee` |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/sachin-chavan-10/Track-Flow.git
cd Track-Flow
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env — add your MONGO_URI and JWT_SECRET
npm install
npm run seed      # creates demo accounts
npm run dev       # starts on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev       # starts on http://localhost:5173
```

### 4. Open the app
Visit **http://localhost:5173** and sign in with any demo account above.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS v4, React Router v6, Axios |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Security | Helmet, express-rate-limit |
| Dev Tools | Vite, Nodemon |

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create company + admin |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Current user |
| GET | `/users` | List users |
| POST | `/users` | Create user |
| GET | `/expenses` | List expenses (role-filtered) |
| POST | `/expenses` | Create expense |
| POST | `/expenses/:id/submit` | Submit draft for approval |
| GET | `/approvals/pending` | Manager's approval queue |
| POST | `/approvals/:id/approve` | Approve expense |
| POST | `/approvals/:id/reject` | Reject expense |
| GET | `/reports/summary` | Admin KPI dashboard |
| GET | `/reports/my-expenses` | Employee personal report |

Full collection: see `backend/api-tests.http`
