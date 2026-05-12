This project lost SQL migrations. Use backend/migrations/0001_recreate_core.sql to (re)create missing tables.

Run (adjust connection vars):
psql -U <user> -d <db> -f backend/migrations/0001_recreate_core.sql

Then restart the backend server.

