# Iteration 3 Report: LLM Inference App

## 1. User Stories and Features

### Project Goal
The customer need for this iteration is: "I would like to get answers from multiple LLMs simultaneously."  
This iteration therefore focused on adding a side-by-side model comparison workflow on top of the existing authentication and single-model chat foundation.

### User Stories

| ID | User story | SMART framing | Estimate | Status |
| --- | --- | --- | --- | --- |
| US-1 | As a new user, I want to create an account and log in so that my prompts and comparison history are associated with my identity. | Specific: register/login with validated credentials. Measurable: successful register/login responses and redirect to dashboard. Achievable: existing auth endpoints and JWT middleware. Relevant: comparison history is private per user. Timeboxed: completed this iteration. | 3 points | Selected and implemented |
| US-2 | As a logged-in user, I want to submit one prompt to a single model so that I can use the app as a normal inference/chat tool. | Specific: create one inference record and load it from history. Measurable: inference can be submitted, viewed, and listed. Achievable: existing `/inference` routes and dashboard chat view. Relevant: provides baseline value before comparison. Timeboxed: completed this iteration. | 5 points | Selected and implemented |
| US-3 | As a logged-in user, I want to send one prompt to multiple LLMs simultaneously so that I can compare answers side by side and keep the result in history. | Specific: choose at least two models, submit one prompt, store a comparison parent row plus response rows, and render cards per model. Measurable: comparison response cards appear and history reload/delete works. Achievable: implemented in compare-mode UI, controller, service, and database schema. Relevant: this is the main customer request. Timeboxed: completed this iteration. | 8 points | Selected and implemented |

### Feature Selection Rationale
- `US-3` was the primary iteration target because it directly satisfies the customer request.
- `US-1` remained necessary because comparisons are user-specific and require protected routes.
- `US-2` was retained because it shares the same dashboard shell, history behavior, and inference data model, making it a useful baseline and regression check.

## 2. UI Design

### Number of Pages
The project currently has **4 pages**:

1. `index.html` - landing page
2. `login.html` - login page
3. `signup.html` - registration page
4. `dashboard.html` - authenticated workspace for single-model chat and multi-model comparison

### Page Interaction and Transitions
- A visitor starts on the landing page and can navigate to `Login` or `Create Account`.
- From `signup.html`, a successful registration attempts auto-login and redirects to `dashboard.html`; if auto-login fails, the user is redirected to `login.html`.
- From `login.html`, a successful login stores the JWT token in `localStorage` and redirects to `dashboard.html`.
- `dashboard.html` checks authentication on load. If no token exists, the page redirects back to `login.html`.
- Inside the dashboard, the user does not navigate to a separate page for comparison. Instead, the interface switches between:
  - `Single Model` tab
  - `Compare Models` tab
- The logout button clears auth data and returns the user to `index.html`.

### Lo-Fi UI Sketches
The lo-fi sketches used for planning are attached below:

- Landing page sketch: [lofi-landing.svg](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\docs\lofi-landing.svg)
- Auth page sketch: [lofi-auth.svg](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\docs\lofi-auth.svg)
- Dashboard comparison sketch: [lofi-dashboard.svg](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\docs\lofi-dashboard.svg)

### Sketch Notes
- The landing page emphasizes entry points into signup and login.
- The auth page keeps the interaction simple: one form, validation errors, and a redirect path.
- The dashboard sketch shows the most important new workflow for this iteration: model selection, one shared prompt, response cards, and comparison history in the sidebar.

## 3. Unit Tests and Acceptance Tests

### 3a. Deriving Acceptance Tests from Use Cases and Scenarios with Cucumber.js

The acceptance-test workflow used in this project is:

1. Start with a user story.
2. Break it into concrete user-visible scenarios.
3. Express each scenario in `Given / When / Then` form in a `.feature` file.
4. Implement each step definition in JavaScript.
5. Use the scenarios as the behavioral contract for the UI and API design.

For example, `US-3` becomes these comparison scenarios in [backend/features/compare_models.feature](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\features\compare_models.feature):
- successful comparison across multiple models
- validation failure when no model is selected
- validation failure when only one model is selected
- partial failure handling
- delete comparison from history
- reload comparison from history
- duplicate model rejection
- minimum prompt length validation

Those scenarios are implemented in [backend/features/step_definitions/compare_models.steps.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\features\step_definitions\compare_models.steps.js). The step definitions simulate dashboard behavior and validate the same business rules that the UI and backend enforce, especially:
- minimum of two models
- duplicate model rejection
- prompt length validation
- persistence in history
- successful and failed result-card states

Other acceptance-level feature files cover:
- authentication
- landing page behavior
- local model behavior
- public/cloud model behavior
- input validation
- login and registration flows

### 3b. Designing Test Suites and Individual Unit Tests with Jasmine

The Jasmine test design follows a layered approach:

- **Validation tests** verify pure business rules first.
  - [backend/tests/validators.spec.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\tests\validators.spec.js)
- **Service tests** verify normalized data and service behavior.
  - [backend/tests/comparisonService.spec.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\tests\comparisonService.spec.js)
  - [backend/tests/userService.spec.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\tests\userService.spec.js)
- **Controller tests** verify route-level status codes and payload contracts.
  - [backend/tests/comparisonController.spec.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\tests\comparisonController.spec.js)
  - [backend/tests/authSpec.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\tests\authSpec.js)

Each suite uses one clear responsibility:
- validators: valid vs invalid inputs
- services: normalized outputs and domain behavior
- controllers: HTTP response codes, success objects, and error handling

### 3c. How Use Cases/Scenarios Are Implemented Through Unit Tests

The project follows a "small rules first" progression:

1. Validate the smallest business rule with a Jasmine test.
2. Build or adjust the service logic to satisfy those tests.
3. Add controller tests for the API contract.
4. Add or update Cucumber scenarios for the full user-visible flow.
5. Confirm the frontend behavior with Puppeteer.

Concrete mapping:

| Use case | Key unit tests | Acceptance tests | Browser test |
| --- | --- | --- | --- |
| Register/login user | `authSpec.js`, `userService.spec.js`, `validators.spec.js` | `register.feature`, `login.feature`, `authentication.feature` | `testSignupSuccessRedirectsToDashboardAndShowsUser`, `testLoginSuccessRedirectsToDashboard` in [frontend/e2e/tests.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\frontend\e2e\tests.js) |
| Submit single-model inference | service/controller coverage in inference stack and shared validation coverage | `select_llm.feature`, `math_questions.feature`, `weather_questions.feature`, `public_model.feature`, `local_model.feature` | single-model dashboard behavior is partially covered by auth redirect and mocked inference loading in Puppeteer |
| Compare multiple models | `comparisonService.spec.js`, `comparisonController.spec.js`, `validators.spec.js` | `compare_models.feature` | `testDashboardCompareSubmitsTwoModels` in `frontend/e2e/tests.js` |

### 3d. Test Code References

Relevant code locations:

- Jasmine:
  - [backend/tests/authSpec.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\tests\authSpec.js)
  - [backend/tests/comparisonController.spec.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\tests\comparisonController.spec.js)
  - [backend/tests/comparisonService.spec.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\tests\comparisonService.spec.js)
  - [backend/tests/userService.spec.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\tests\userService.spec.js)
  - [backend/tests/validators.spec.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\tests\validators.spec.js)
- Cucumber:
  - [backend/features/compare_models.feature](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\features\compare_models.feature)
  - [backend/features/register.feature](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\features\register.feature)
  - [backend/features/login.feature](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\features\login.feature)
- Puppeteer:
  - [frontend/e2e/tests.js](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\frontend\e2e\tests.js)

## 4. Software Architecture and Implementation

### Architecture Overview

The application uses a simple three-layer architecture:

- **Presentation layer**: static HTML/CSS/JavaScript frontend in `frontend/`
- **Application/API layer**: Express REST API in `backend/src/`
- **Data layer**: Supabase/PostgreSQL tables defined in `backend/src/database/schema.sql`

The comparison feature extends the architecture by creating:
- one parent `comparisons` record per compare request
- one child `comparison_responses` record per selected model
- a service method that runs all selected models in parallel using `Promise.all`

### 4a. REST API Design

The backend follows REST-style JSON endpoints under `/api/v1`.

Design choices:
- `POST` is used to create auth sessions, single inferences, and comparison jobs.
- `GET` is used to retrieve profile data, inference history, and comparison history/details.
- `PUT` is used for profile and password updates.
- `DELETE` is used for deleting saved inferences and comparisons.
- Protected resources are grouped under JWT-authenticated routes.

### 4b. Routing Table

| Method | Route | Auth required | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Health check for backend availability |
| `POST` | `/api/v1/auth/register` | No | Create a new user account |
| `POST` | `/api/v1/auth/login` | No | Authenticate user and return JWT |
| `POST` | `/api/v1/auth/logout` | No route-level middleware in file; intended authenticated use | End user session |
| `GET` | `/api/v1/users/profile` | Yes | Return current user profile |
| `PUT` | `/api/v1/users/profile` | Yes | Update profile fields |
| `PUT` | `/api/v1/users/change-password` | Yes | Change password |
| `POST` | `/api/v1/inference/submit` | Yes | Submit a single-model inference |
| `GET` | `/api/v1/inference/:inferenceId` | Yes | Retrieve one inference |
| `GET` | `/api/v1/inference` | Yes | Retrieve inference history |
| `DELETE` | `/api/v1/inference/:inferenceId` | Yes | Delete one inference |
| `POST` | `/api/v1/inference/compare` | Yes | Submit one prompt to multiple models |
| `GET` | `/api/v1/inference/comparisons` | Yes | Retrieve comparison history |
| `GET` | `/api/v1/inference/comparisons/:comparisonId` | Yes | Retrieve one saved comparison |
| `DELETE` | `/api/v1/inference/comparisons/:comparisonId` | Yes | Delete one saved comparison |

### 4c. Database Design

For the class report, the recommended basic database design is defined in:

- [schema_basic.sql](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\src\database\schema_basic.sql)
- [DATABASE_TRACKER.md](C:\Users\danie\Documents\GitHub\SoloIteration\SoftwareEngineeringClass-main\llm-inference-app\backend\src\database\DATABASE_TRACKER.md)

#### Tables

`users`
- primary key: `user_id`
- stores `email`, `password_hash`, and `created_at`

`inference_records`
- primary key: `record_id`
- foreign key: `user_id -> users.user_id`
- stores both single-model and multi-model requests
- uses `mode` to distinguish `single` vs `compare`
- uses `selected_models` JSON to store chosen models
- uses `results` JSON to store all responses in one record

#### Relationship Summary

- One user can have many inference records.
- One inference record can represent either:
  - one single-model chat request
  - one multi-model comparison request

This design is intentionally basic so it is easy to explain during grading and easy to include in the routing/database sections of the report.

## 5. Instructions for Reproduction

### 5a. Reproducibility Goal
The TA should be able to:
- install dependencies
- configure environment variables
- run the backend and frontend
- run unit tests with Jasmine
- run acceptance tests with Cucumber.js
- run browser automation tests with Puppeteer

### 5b. Installation Instructions

From `SoftwareEngineeringClass-main`:

```powershell
cd llm-inference-app\backend
npm install

cd ..\frontend
npm install
```

If Puppeteer download fails during install, set:

```powershell
$env:PUPPETEER_SKIP_DOWNLOAD = "1"
```

### 5c. Execution Instructions

Create backend configuration:

```powershell
cd llm-inference-app\backend
copy .env.example .env
```

Fill in at least:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `PORT=3000`
- `CORS_ORIGIN=http://localhost:5500`

Optional for real model comparison:
- `OPENROUTER_API_KEY` for cloud models
- `OLLAMA_BASE_URL` and `OLLAMA_MODEL` for local model comparison

Run backend:

```powershell
cd llm-inference-app\backend
npm run dev
```

Run frontend in another terminal:

```powershell
cd llm-inference-app\frontend
npm run dev
```

Open:
- `http://localhost:5500`

### 5d. Unit Test Instructions

Run Jasmine unit tests:

```powershell
cd llm-inference-app\backend
npm test
```

Run Cucumber acceptance tests:

```powershell
cd llm-inference-app\backend
npx cucumber-js
```

Run only comparison acceptance tests:

```powershell
npx cucumber-js --tags "@comparison"
```

### 5e. Puppeteer Instructions

Start the frontend server first:

```powershell
cd llm-inference-app\frontend
npm run dev
```

Then run browser automation:

```powershell
cd llm-inference-app\frontend
npm run test:e2e
```

Optional headed mode:

```powershell
npm run test:e2e:headed
```

Notes:
- The Puppeteer tests in `frontend/e2e/tests.js` mock backend API responses with request interception.
- Because of that, the frontend server is required, and the backend is recommended but not strictly necessary for the mocked browser suite.

## Conclusion

This iteration satisfies the customer request by implementing a compare workflow where one prompt is sent to multiple LLMs and the results are shown side by side. The completed deliverables include:

- 3 selected user stories with point estimates
- 4-page UI design with attached lo-fi sketches
- unit, acceptance, and browser test documentation
- REST API design and routing table
- normalized comparison-oriented database design
- step-by-step reproduction instructions for TAs
