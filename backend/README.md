# RentFlow Django API

Backend production service for RentFlow. It uses Django 5, Django REST Framework, JWT authentication, PostgreSQL on Neon, and Render as the container host.

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py makemigrations core
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

The unauthenticated health endpoint is `GET /api/health`. Authenticated clients use `POST /api/auth/login`, `POST /api/auth/refresh`, and `GET /api/auth/me`. The domain endpoints are under `/api/`.

## Production invariants

Every operational model is scoped to `organization`. Querysets are filtered server-side from the authenticated user, never from a client-provided organization id. Voucher creation is idempotent, locks the cashbox row, updates the balance inside one transaction, and creates an audit event. Posted vouchers cannot be edited or deleted.

Set `DATABASE_URL` to the Neon pooled connection string, keep `DJANGO_SECRET_KEY` private, and set `CORS_ALLOWED_ORIGINS`/`CSRF_TRUSTED_ORIGINS` to the deployed Vercel origin. The Render Blueprint is at the repository root in `render.yaml`.
