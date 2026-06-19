# MCP Setup Notes

MCP means Model Context Protocol. It lets Cursor/AI tools connect to external systems.

LotSync can be built without MCP at first, but these are useful later.

## Recommended MCPs

### Filesystem MCP

Use for local repo file access.

Purpose:
- read docs
- update files
- inspect project structure

### GitHub MCP

Use for:
- issues
- pull requests
- commits
- repo context

### Supabase MCP

Use for:
- schema inspection
- database docs
- SQL assistance
- migration support

### Postgres MCP

Use for:
- direct database querying
- schema validation
- debugging local/dev data

### Browser / Playwright MCP

Use for:
- testing dashboard
- testing dealer mobile app
- testing scan flows
- checking UI regressions

## MCP Rule

Do not give AI tools production secrets.

Use dev credentials only.

## Suggested MCP Config Responsibility

Human sets up MCP credentials.
Agent may read schemas and test flows but should not change production data without confirmation.

## When MCP Is Actually Needed

Not needed for:
- initial docs
- initial scaffold
- basic code

Useful for:
- database debugging
- UI browser testing
- Supabase policy validation
- GitHub issue workflow
