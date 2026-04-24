# API Routes

Base URL: `http://localhost:3000/api/v1`

## Public Routes

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Authenticate a user and return a JWT |
| `POST` | `/auth/logout` | Logout endpoint exposed by auth controller |

## Protected User Routes

These routes require `Authorization: Bearer <token>`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/users/profile` | Get current user profile |
| `PUT` | `/users/profile` | Update profile fields |
| `PUT` | `/users/change-password` | Change current password |

## Protected Inference Routes

These routes require `Authorization: Bearer <token>`.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/inference/submit` | Submit a single-model inference |
| `GET` | `/inference/:inferenceId` | Get a single inference |
| `GET` | `/inference` | Get inference history |
| `DELETE` | `/inference/:inferenceId` | Delete an inference |
| `POST` | `/inference/compare` | Submit one prompt to multiple models |
| `GET` | `/inference/comparisons` | Get comparison history |
| `GET` | `/inference/comparisons/:comparisonId` | Get one comparison with all model results |
| `DELETE` | `/inference/comparisons/:comparisonId` | Delete one comparison |

## Health Route

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Confirm backend is running |
