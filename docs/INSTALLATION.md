# Installation Guide — School Management System

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm 10+
- Docker (optional)

---

## Quick Start (Local Development)

### 1. Clone / open the project

```bash
cd "School Management"
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT secrets, SMTP credentials

npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js   # loads sample data
npm run dev           # starts on port 5000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev           # starts on port 3000
```

Open: http://localhost:3000

---

## Docker Deployment

```bash
# From project root
cp backend/.env.example backend/.env
# Edit backend/.env

docker compose up -d --build
```

- Frontend: http://localhost
- API: http://localhost/api/v1
- Swagger: http://localhost/api-docs
- DB Studio: `cd backend && npx prisma studio`

---

## Default Login Credentials

| Role         | Email                    | Password    |
|--------------|--------------------------|-------------|
| Super Admin  | super@school.com         | Admin@1234  |
| School Admin | admin@school.com         | Admin@1234  |
| Teacher      | teacher1@school.com      | Admin@1234  |
| Student      | student1@school.com      | Admin@1234  |
| Parent       | parent1@school.com       | Admin@1234  |

**Change all passwords after first login.**

---

## Environment Variables Reference

| Variable             | Description                          |
|----------------------|--------------------------------------|
| DATABASE_URL         | PostgreSQL connection string         |
| JWT_SECRET           | Access token signing key             |
| JWT_REFRESH_SECRET   | Refresh token signing key            |
| SMTP_*               | Email (Nodemailer) config            |
| MAX_FAILED_LOGINS    | Attempts before account lock (def 5) |

---

## Running Tests

```bash
cd backend
npm test
```

---

## API Documentation

Swagger UI: http://localhost:5000/api-docs

---

## Production Checklist

- [ ] Change all JWT secrets
- [ ] Set `NODE_ENV=production`
- [ ] Configure SMTP credentials
- [ ] Set up SSL/TLS (via Nginx or cloud load balancer)
- [ ] Configure DB connection pooling
- [ ] Set up automated backups for PostgreSQL
- [ ] Configure log rotation (handled by Winston daily-rotate-file)
