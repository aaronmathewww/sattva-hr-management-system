# Sattva – HR Management System

Sattva is a web application project focused on managing parts of the internship lifecycle. It brings intern information, manager assignments and related internship records into one place.

## Technologies

- React and Vite
- FastAPI
- SQLAlchemy
- SQLite for local development
- JWT authentication and Argon2 password hashing

## Current features

- User login and role-based access
- HR, manager and intern workspaces
- Intern profiles and manager assignments
- Dashboard summaries
- Workspace records for internship-related activities
- Selected access-control and lifecycle tests

Some areas are still under development. The workspace record structure is shared by several modules, so goals, leave, feedback, learning, certifications and evaluations should not all be treated as complete standalone workflows.

## Project structure

```text
backend/   FastAPI application, database models, API routes and tests
frontend/  React application and Vite configuration
docs/      API and database notes
```

## Run locally

### Requirements

- Python 3.13 or newer
- Node.js and npm

### Backend

From the project root, open PowerShell and run:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item .env.example .env
```

Set a private random `SECRET_KEY` in `.env`, then start the API:

```powershell
$env:PYTHONPATH = "$PWD\backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

The health endpoint is `http://127.0.0.1:8000/health`. The interactive API documentation is available at `http://127.0.0.1:8000/docs` while the local server is running.

### Frontend

Open a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open the local address shown by Vite. The frontend API URL can be changed in `frontend/.env` using `VITE_API_BASE_URL`.

## Create the first HR account

After configuring the backend, run the local account-creation helper:

```powershell
$env:PYTHONPATH = "$PWD\backend"
.\.venv\Scripts\python.exe backend\create_hr_user.py
```

This is a local setup helper, not a public registration endpoint.

## Tests

Run the backend tests from the project root:

```powershell
$env:PYTHONPATH = "$PWD\backend"
.\.venv\Scripts\python.exe -m pytest backend\tests -q
```

To create a frontend production build:

```powershell
cd frontend
npm install
npm run build
```

## Notes

- Use test data only. Do not enter real employee or intern information into a public demo.
- Keep `.env`, database files and private uploads out of Git.
- Authentication and selected role permissions are implemented, but this project has not had a full production security review.
- Email-based password reset, email delivery, complete audit logging, hardened production deployment and full browser-based end-to-end testing are not complete or verified.
- No licence is included. Confirm contributor permissions and third-party asset licences before publishing or adding a licence.

## Project information

Sattva is an independent educational and portfolio project. It is not an official product, application or service of Tata Group or any of its subsidiaries, and is not sponsored, endorsed, commissioned or owned by Tata Group. Third-party names and trademarks belong to their respective owners.

Before making the repository public, make sure all contributors are credited appropriately and that you have permission to publish the code and assets included in it.
