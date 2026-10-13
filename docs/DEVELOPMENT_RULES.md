# AI Agent Development Rules

## Rule 1 — Do Not Guess

If a requirement is unclear, STOP and ask.

Do not invent:

* features
* APIs
* database fields
* credentials
* libraries
* business rules
* UI behavior
* authentication behavior

---

## Rule 2 — Source of Truth

Before making changes, read:

* PROJECT_SPEC.md
* ARCHITECTURE.md
* DATABASE_SCHEMA.md
* API_SPEC.md
* UI_SPEC.md
* TASKS.md

If the existing code conflicts with these files, report the conflict before changing the architecture.

---

## Rule 3 — Minimal Changes

Only modify files required for the current task.

Do not rewrite unrelated code.

Do not refactor the entire project unless explicitly requested.

---

## Rule 4 — No Silent Dependencies

Before installing a new package:

Explain:

1. Package name
2. Why it is required
3. What problem it solves
4. Whether an existing dependency can solve the same problem

Do not install unnecessary packages.

---

## Rule 5 — No Fake Implementations

Never create fake:

* API responses
* database results
* authentication
* AI responses
* environment variables
* external services

If something is unavailable, clearly state that it is unavailable.

---

## Rule 6 — No Secret Generation

Never invent:

* API keys
* database passwords
* JWT secrets
* OAuth credentials

Use placeholders in `.env.example`.

---

## Rule 7 — Verify Before Claiming

Never say:

"Working"

"Fixed"

"Tested"

"Production ready"

unless the relevant implementation has actually been verified.

---

## Rule 8 — Testing

After implementing a feature:

1. Check TypeScript errors.
2. Check lint errors if configured.
3. Run relevant tests.
4. Verify API behavior.
5. Report failures honestly.

---

## Rule 9 — Architecture Changes

Major changes require approval.

Examples:

* changing database
* changing frontend framework
* changing backend framework
* introducing microservices
* introducing a new authentication system
* introducing a new AI provider
* changing API architecture

---

## Rule 10 — Existing Code

Before modifying an existing file:

1. Read the file.
2. Understand its dependencies.
3. Identify what the requested change affects.
4. Make the smallest safe change.

Never overwrite an existing file blindly.

---

## Rule 11 — AI Features

AI must never be used where deterministic code is sufficient.

For example:

Coupon expiry:

Use date comparison.

Do NOT use AI.

Coupon ownership:

Use authenticated user ID.

Do NOT use AI.

Coupon CRUD:

Use normal database operations.

Do NOT use AI.

AI should only be used for genuinely AI-related features.

---

## Rule 12 — Completion Report

After every task, report:

### Changed

Files that were modified.

### Added

Files that were created.

### Dependencies

Packages added or removed.

### Tests

Tests/checks performed.

### Issues

Known problems or limitations.

### Next Step

The recommended next development task.

---

## Rule 13 — Stop Conditions

STOP and ask for clarification when:

* requirements conflict
* schema conflicts with API
* architecture conflicts with implementation
* credentials are missing
* an external service is unavailable
* a major dependency is required
* a security-sensitive decision is ambiguous
* multiple valid architectural solutions exist

Never choose silently in these situations.
