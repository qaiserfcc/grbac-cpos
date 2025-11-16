# 03 - Common Middleware

Status: completed
Assigned: Copilot

Purpose

Add common middleware (error handling, validation, logging, rate limiting).

Subtasks

- Error handler middleware
- Request validation (Joi or express-validator)
- Logging (Winston)
- Rate limiting middleware

Acceptance Criteria

- Middleware integrated and tested

Notes

- Added reusable `validate` middleware powered by `express-validator` and wired it into auth routes for request hygiene.
- Introduced Winston logger with Morgan streaming plus centralized error handling (with Zod awareness) to improve observability.
- Added Express rate limiting to `/api` entrypoint and expanded Jest coverage (invalid login, auth flows) to exercise middleware stack.
