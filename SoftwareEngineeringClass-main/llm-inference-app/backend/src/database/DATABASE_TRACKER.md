# Database Tracker

This file is the single place to track everything stored in the database for the class report.

## Recommended Basic Design

For the report, use the simplified schema in:

- [schema_basic.sql](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\src\database\schema_basic.sql)

## Tables

### 1. `users`

Purpose:
- stores login information for each account

Fields:
- `user_id`: unique id for the user
- `email`: login email
- `password_hash`: encrypted password
- `created_at`: when the account was created

### 2. `inference_records`

Purpose:
- stores every prompt request in one place
- supports both single-model inference and multi-model comparison

Fields:
- `record_id`: unique id for the request
- `user_id`: owner of the request
- `mode`: `single` or `compare`
- `prompt`: the question or prompt submitted by the user
- `selected_models`: JSON array of chosen models
- `results`: JSON array of responses
- `status`: `pending`, `completed`, or `failed`
- `created_at`: when the request was submitted

## Why This Design Is Basic

- only 2 tables
- no separate sessions table
- no separate comparison parent/child tables
- one inference table handles both regular chat and multi-model comparison
- easy to explain in a routing table and software architecture section

## Example Multi-Model Record

```json
{
  "record_id": "rec_001",
  "user_id": "user_001",
  "mode": "compare",
  "prompt": "Explain photosynthesis simply",
  "selected_models": ["gpt-4", "claude-v1", "local-small"],
  "results": [
    { "model": "gpt-4", "response": "Plants use sunlight...", "status": "completed" },
    { "model": "claude-v1", "response": "Photosynthesis is...", "status": "completed" },
    { "model": "local-small", "response": "Plants make food...", "status": "completed" }
  ],
  "status": "completed"
}
```

## Note About Current App Code

The running backend still contains a more normalized implementation for comparisons.
For the report and presentation, this tracker and `schema_basic.sql` give you a much simpler database story to present.
