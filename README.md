# The Smart School — Finance & Accounts Portal

A school finance system for tracking student fees, vendor bills, payments, and a full audit trail,
with separate access for the GM, Accountant, HOD and Vendors.

## Project layout

```
Smart School/
├── backend/                Django REST API (Python)
│   ├── config/             Django project settings & root URLs
│   ├── api/                The API: models, views, business rules, tests
│   │   ├── models.py         Database tables
│   │   ├── views.py          API endpoints
│   │   ├── services.py       Business rules (fees, payments, revisions, imports)
│   │   ├── serializers.py    Database → JSON for the frontend
│   │   ├── permissions.py    Who can do what
│   │   ├── urls.py           URL routes
│   │   ├── tests.py          Automated tests
│   │   └── management/commands/seed_users.py   Creates the default accounts
│   ├── manage.py
│   └── requirements.txt
├── frontend/               React + Vite user interface (TypeScript)
│   └── src/
│       ├── components/       Screens (dashboards, fees, vendors, payments, ...)
│       ├── context/          Login state & data loading from the API
│       ├── services/api.ts   API client
│       └── types/            Shared data types
└── docs/                   Product requirements (PRD)
```

## Run it locally

You need **Python 3.10+** and **Node.js 20+**. Use two terminals.

**Terminal 1 — backend** (http://127.0.0.1:8000)

```bash
cd backend
python3 -m venv venv              # first time only
source venv/bin/activate
pip install -r requirements.txt   # first time only
python manage.py migrate          # first time only
python manage.py seed_users       # first time only
python manage.py runserver 127.0.0.1:8000
```

> Always run Django with the venv active (or `venv/bin/python manage.py ...`).
> Plain system `python3` doesn't have the packages and fails with `No module named 'rest_framework'`.

**Terminal 2 — frontend** (http://localhost:3000)

```bash
cd frontend
npm install      # first time only
npm run dev
```

Open **http://localhost:3000**. The frontend forwards every `/api` request to the backend.

## Login accounts

| Role | Email | Password |
| --- | --- | --- |
| GM / Super Admin | faisalabbas@gmail.com | faisal@123 |
| Accountant | accountant@thesmartschool.edu.pk | accountant@123 |
| HOD | hod@thesmartschool.edu.pk | hod@123 |
| Vendor | vendor@thesmartschool.edu.pk | vendor@123 |

The database starts empty, so dashboards show PKR 0.00 until the Accountant adds fee records or vendor bills.

## Tests

```bash
cd backend && venv/bin/python manage.py test api
cd frontend && npm run lint
```

See [backend/README.md](backend/README.md) for the API endpoints, business rules and production setup.
