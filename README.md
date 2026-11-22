# HabitMate — Build Better Habits, One Day at a Time

A full-stack 30-day habit tracker built with React, Tailwind CSS, FastAPI, SQLAlchemy, MySQL, JWT, and Recharts.

## Requirements
- Python 3.10+
- Node.js 18+
- MySQL 8+

## 1. Database
Create a MySQL database (or let SQLAlchemy create its tables after the database exists):

```sql
CREATE DATABASE habitmate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
# Edit .env and set DATABASE_URL and SECRET_KEY
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

Example `DATABASE_URL`:
`mysql+pymysql://root:yourpassword@localhost:3306/habitmate?charset=utf8mb4`

The API creates tables on startup. Register a user from the UI to begin.

## 3. Frontend
Open a second terminal:
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```
Open the Vite URL shown in the terminal (normally http://localhost:5173).

Set `VITE_API_URL` in `frontend/.env` if your API is hosted elsewhere.

## Included features
- Registration and login with hashed passwords and JWT authentication.
- Create, edit, delete, and inspect habits.
- 30-day checklist with date validation and persistent daily logs.
- Overview metrics, per-habit completion, streaks, activity calendar, weekly chart.
- Achievement milestones and daily motivational quote.
- Responsive sidebar/navigation and mobile layout.
- API validation, ownership checks, loading and error states.

## Notes
- A challenge is created automatically for each user on first registration. Its start date is the registration date.
- Logs can only be changed for dates from the challenge start date through today, and only while the challenge is active.
- A completed log is unique per habit and date. Progress is computed from database records.
- For production, use HTTPS, a strong secret key, database migrations (Alembic), rate limiting, and a managed secrets store.
