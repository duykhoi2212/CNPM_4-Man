# Backend - Football Booking

Django REST backend for football field booking.

## Prerequisites

- Python 3.10+
- MySQL 8+
- Windows PowerShell (or equivalent shell)

## 1) Setup virtual environment

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## 2) Setup environment variables

Create `.env` from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Update real values in `.env` (especially `DJANGO_SECRET_KEY`, `DB_PASSWORD`).

## 3) Database and migrations

Make sure MySQL database exists (`DB_NAME` in `.env`), then run:

```powershell
.\venv\Scripts\python.exe manage.py migrate
```

(Optional) Create admin account:

```powershell
.\venv\Scripts\python.exe manage.py createsuperuser
```

## 4) Run server

```powershell
.\venv\Scripts\python.exe manage.py runserver
```

API base URL: `http://127.0.0.1:8000`

## 5) API documentation

- Main contract: `API_CONTRACT.md`
- Auth: `TokenAuthentication`
- Header for protected routes:

```http
Authorization: Token <token>
Content-Type: application/json
```

## 6) Quick health checks

```powershell
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test
```

## Notes

- Statistics APIs are read-only aggregation over existing tables (`bookings`, `payments`, `reviews`).
- No extra statistics table is required.
