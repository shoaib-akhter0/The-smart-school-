# Smart School Finance — Django Backend

Django 5 + Django REST Framework API serving the React frontend in `../frontend`.
The API contract (URLs, JSON field names, error shape, pagination) matches what
`frontend/src/services/api.ts` and `frontend/src/context/*.tsx` expect.

## Quickstart

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_users          # school settings + the 3 role accounts
python manage.py test api    # 47 tests
python manage.py runserver 127.0.0.1:8000
```

Then in another terminal:

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000 — Vite proxies /api to Django on :8000
```


### Seeded accounts

| Role | Email | Password |
| --- | --- | --- |
| GM / Super Admin | faisalabbas@gmail.com | faisal@123 |
| Accountant | accountant@thesmartschool.edu.pk | accountant@123 |
| HOD | hod@thesmartschool.edu.pk | hod@123 |

Change these before deploying. `seed_users --reset-passwords` restores the defaults.

## How it works

- **Auth**: `POST /api/auth/login` returns a token; send it as `Authorization: Bearer <token>`.
  The `x-user-role` header the frontend also sends is ignored for authorization.
  Logout, deactivation and admin password resets revoke the token.
- **Errors**: always `{"error": "message"}` with a meaningful status code.
- **Lists**: `{results, totalCount, page, pageSize, totalPages}`; `page_size` max 100.
- **IDs**: student fee records are `fee-<n>`, vendor invoices `vinv-<n>` (the UI matches payments to records by id).
- **Trailing slashes** are optional on every endpoint.

## Endpoints (`/api/...`)

| Method & path | Who |
| --- | --- |
| `POST auth/login`, `GET settings`, `GET health` | anyone |
| `POST auth/logout`, `GET auth/current-user`, `GET/POST auth/profile`, `POST auth/change-password` | signed in |
| `GET auth/users`, `POST users/manage` (create / toggle_active / delete / reset_password), `POST settings` | GM |
| `GET dashboard/summary?month=&year=` | all |
| `GET students/fees`, `GET students/fees/:id`, `GET students/list` | GM, Accountant, HOD |
| `POST students/fees`, `PUT/DELETE students/fees/:id` | Accountant only — **GM is explicitly blocked** |
| `POST students/fees/:id/flag` (`{reason, unflag}`) | GM, HOD |
| `POST students/fees/:id/revision` (`{field, newValue, reason}`) | HOD, Accountant |
| `GET/POST students/fees/:id/payments` | read: all staff · record: Accountant, HOD |
| `vendors/invoices[...]` | same as student fees |
| `GET vendors/list` | all |
| `GET payments` | all |
| `GET audit-logs` | Accountant: own entries · HOD: Accountant entries · GM: GM + Accountant entries |
| `GET notifications`, `POST notifications/:id/read` | signed in (read state is per user) |
| `POST import/commit` (`{category: student_fees \| vendor_invoices, rows}`) | Accountant |
| `GET/POST excel-folders`, `GET/DELETE excel-folders/:id`, `GET excel-folders/:id/download` | Accountant |

## Roles

There are three roles: **GM**, **Accountant** and **HOD**. The supplier-facing Vendor portal was removed;
migration `0003_disable_vendor_accounts` switches off any old Vendor logins. Vendor *payables*
(the school's supplier bills) are still managed by staff.

## Business rules

- `balance = total − paid`. Status: **Paid** (balance 0) → **Overdue** (past due date) → **Partially Paid** → **Unpaid**.
  Overdue statuses are refreshed whenever lists or the dashboard load.
- Payments can't be zero, negative, or more than the remaining balance. Opening "paid" amounts create a payment entry.
- Invoice numbers are unique, compared without regard to case.
- Revisions can only change `totalAmount, category, dueDate, month, year, notes` (and `description` on vendor invoices),
  must give a reason, can't push the total below the amount already paid, and clear any review flag.
- Records that already have payments can't be deleted (use a revision).
- Audit log entries are append-only. Financial records are read-only in Django admin, so every change is audited.

## Configuration (`backend/.env`, optional)

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=change-me
DJANGO_ALLOWED_HOSTS=school.example.com
CORS_ALLOWED_ORIGINS=https://school.example.com
DATABASE_URL=postgres://user:password@localhost:5432/smart_school   # default: SQLite db.sqlite3
```

Production: `gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3`
