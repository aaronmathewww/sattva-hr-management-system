# Database Design — Current Baseline

The application uses SQLAlchemy models and defaults to SQLite for local development. The connection is configurable through `DATABASE_URL`.

## Models currently registered by the application

- **users** — email, full name, password hash, role, active flag, creation timestamp.
- **interns** — user account association, unique intern code, department, optional college, mentor assignment, internship dates, status, optional bio, creation timestamp.
- **workspace_records** — generic lifecycle record with kind, title, description, status, optional owner, creator, due/start/end dates, optional value, and timestamps.
- **workspace_acknowledgements** — intern acknowledgement associated with a workspace record and intern user, with a uniqueness constraint on record/intern pair.

A `WorkspaceAttachment` model source file is present, but the current application session does not register it as part of the baseline model imports and no complete secure attachment workflow was verified. Do not assume attachments are operational.

## Important design limitations

- Goals, leave, feedback, submissions, learning, certifications, onboarding, and evaluations are represented through a generic workspace record table rather than separate domain tables.
- The current schema is created additively at application startup for baseline development. A complete migration history and production migration process were not established in this audit.
- Database files are local runtime data and must not be committed to the repository.

## Local development

The default connection is `sqlite:///./hr_management.db`. The database file is created relative to the backend process working directory. Set `DATABASE_URL` in the private root `.env` file to override it.

Back up the database before testing schema changes. Use synthetic data only. For production, define a tested migration, backup, restore, access-control, and retention strategy.
