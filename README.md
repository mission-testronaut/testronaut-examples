# 🧑‍🚀 Testronaut Examples — Agentic E2E Testing Missions

This is the official example mission collection for [Testronaut](https://testronaut.app), an **agentic end-to-end testing** framework powered by AI agents and Playwright. The examples run against the [Testronaut demo sandbox](https://demo.testronaut.app).

Each mission demonstrates how an agentic testing workflow can reason about an interface, interact with a real browser, adapt during a user journey, and validate the result.

**Official Testronaut ecosystem:** [Product](https://testronaut.app) · [Documentation](https://docs.testronaut.app) · [CLI](https://github.com/mission-testronaut/testronaut-cli) · [npm](https://www.npmjs.com/package/testronaut) · [Mission Control](https://mission.testronaut.app)

---

## 🧩 Overview

| File | Description |
|------|--------------|
| `login.mission.js` | Logs into Mission Control with sample credentials |
| `autoLoginEmailCode.mission.js` | Sends a login code to a Testronaut inbox, retrieves it automatically, and completes authentication |
| `addTask.mission.js` | Adds a new task to the mission dashboard |
| `startTask.mission.js` | Begins a task and waits for it to complete automatically |
| `removeTask.mission.js` | Removes a completed or queued task |
| `reportSaboteur.mission.js` | Files a report to identify the Saboteur |
| `completeAllTasks.mission.js` | Completes every task sequentially |
| `fileTransfer.mission.js` | Downloads the sus briefing file and uploads a crewmate alibi log |
| `logout.mission.js` | Logs the user out and returns to the login screen |
| `smokeSuite.mission.js` | Runs a full workflow suite (login → task → report → logout) |
| `policies.js` | Applies shared screenshot and post-run feedback policies to every mission |
| `typescript/login.mission.ts` | TypeScript equivalent of the login mission |
| `typescript/addTask.mission.ts` | TypeScript mission with a relative `.ts` import |
| `typescript/smokeSuite.mission.ts` | Composes multiple typed mission goals |

---

## 🚀 How to Run Missions

1. **Install Testronaut CLI**

```bash
npm install -g testronaut
testronaut --init
```

2. **Clone this repo**

```bash
git clone https://github.com/mission-testronaut/testronaut-examples.git
cd testronaut-examples
```

3. **Set your environment variables** (used by missions)

```bash
export URL="https://demo.testronaut.app"
export USERNAME="Nova"
export PASSWORD="1234"

# Optional overrides for the automatic email-code example
export EMAIL_INBOX_ADDRESS="celestial-nebula-s6vt@inbox.staging.testronaut.app"
export EMAIL_INBOX_NICKNAME="asimov"

# For OpenAI
export OPENAI_API_KEY=sk-...

# Or for Gemini
export GEMINI_API_KEY=AIza...

# Or for Anthropic Claude
export ANTHROPIC_API_KEY=sk-ant-...
```

4. **Run a mission**

```bash
testronaut login.mission.js
```

Authenticate from this project directory first so the session token is written
to this project's `testronaut-config.json`:

```bash
testronaut --dev login
```

Then run the automatic staging email-code example. The `--dev` flag routes both
authentication and inbox lookup to the staging API:

```bash
TESTRONAUT_HUMAN_INPUT=false testronaut --dev missions/autoLoginEmailCode.mission.js
```

This example is intended to be unattended. It reports failure immediately when
automatic inbox retrieval is unavailable rather than requesting the code from a
human or trying the TOTP MFA tool.

5. **Run the full suite**

```bash
testronaut
```

### TypeScript missions

TypeScript missions use the same `import`/`export` structure as JavaScript missions.
They do not require a build step, a `tsconfig.json`, or `"type": "module"` in this
project's `package.json`:

```bash
testronaut missions/typescript/login.mission.ts
testronaut missions/typescript/addTask.mission.ts
testronaut missions/typescript/smokeSuite.mission.ts
```

The TypeScript examples live in a subdirectory so the default non-recursive run
does not execute both the JavaScript originals and their TypeScript equivalents.

---

## 🔭 Beyond Pass or Fail

A mission run can provide more than a binary result. The shared
[`missions/policies.js`](missions/policies.js) file asks the agent to preserve
the explicit `SUCCESS` or `FAILURE` outcome while also reporting a small number
of evidence-backed observations from the journey.

The feedback policy considers six lenses:

| Lens | Example signals |
|------|-----------------|
| Test quality | Ambiguity, weak assertions, missing assumptions, or redundant steps |
| UI / UX | Confusing labels, unclear feedback, accessibility concerns, or friction |
| Security | Unexpected access or sensitive exposure that should be validated |
| Latency | Slow responses or transitions that affected the journey |
| Surprises | Unanticipated states, alternate paths, or intermittent behaviour |
| Token efficiency | Retries, repeated inspection, or avoidable context and tool calls |

Apply the policies when defining a mission:

```js
import { applyMissionPolicies } from './policies.js';

export const exampleMission = applyMissionPolicies(`
  Visit the dashboard and complete the expected journey.
  Report SUCCESS or FAILURE with evidence.
`);
```

The review is capped at three findings and may report `No additional findings.`
This keeps reflection bounded instead of paying for an open-ended critique after
every run. The observations are leads for human review, not automatically
confirmed UX, security, or performance defects. Recommended mission changes
should be versioned and measured before they are retained.

Because composed suites reuse the exported mission strings, the policies also
apply to pre-mission and post-mission phases without duplicating the policy text
across individual files.

---

## 📊 Benchmark Agent UI Modes

You can compare regular, agent-friendly, and agent-hostile UI modes with repeated runs of the same mission. The benchmark runner randomizes mode order by default, executes each condition the requested number of times, parses Testronaut's JSON reports, and writes a CSV, JSON, and Markdown summary.

Run a small pilot:

```bash
npm run benchmark:agent-modes -- --trials 5 --mission missions/login.mission.js
```

Run a larger comparison:

```bash
npm run benchmark:agent-modes -- --trials 30 --mission missions/login.mission.js
```

Preview the planned run order without calling Testronaut:

```bash
npm run benchmark:agent-modes -- --trials 3 --dry-run
```

By default the runner derives the base app URL from `URL` in `.env` or the current environment, then tests:

```text
regular:  <base URL>
friendly: <base URL>?agentMode=true
hostile:  <base URL>?agentHostile=true
```

Outputs are written under `benchmarks/agent-mode-runs/<timestamp>/`:

- `plan.json` records the randomized run order and configuration.
- `results.csv` contains one row per run.
- `results.json` contains the parsed metrics.
- `report.md` summarizes success rate, duration, tokens, turns, and retries by mode.

Useful options:

```bash
npm run benchmark:agent-modes -- --trials 10 --base-url http://localhost:5173/
npm run benchmark:agent-modes -- --modes regular,friendly --trials 20
npm run benchmark:agent-modes -- --sequential --trials 5
```

For the cleanest comparison, keep the mission file, model, credentials, browser environment, app version, and `maxTurns` fixed across all modes.

---

## 🧠 Example Mission

```js
import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';

export const loginMission = applyMissionPolicies(`
Visit ${process.env.URL}.
Fill in the username field with ${process.env.USERNAME} and password field with ${process.env.PASSWORD}.
Take a screenshot.
Then click the button most likely to login the user.
After clicking "Dock at Mission Control":
  • Wait for either URL to change away from /login or for the login form to disappear.
  • Wait for the mission dashboard to appear.
  • Confirm success if the "Mission Tasks" heading or progress bar appears.
  • Consider failure if a visible alert says "incorrect" or "invalid".
Take a screenshot.
Report SUCCESS or FAILURE with reasoning.
`);

export async function executeMission() {
  return await runMissions({ mission: loginMission }, "login mission");
}
```

---

## 🧰 Project Structure

```
missions/
  policies.js
  addTask.mission.js
  completeAllTasks.mission.js
  login.mission.js
  logout.mission.js
  removeTask.mission.js
  reportSaboteur.mission.js
  smokeSuite.mission.js
  startTask.mission.js
  typescript/
    addTask.mission.ts
    login.mission.ts
    smokeSuite.mission.ts
README.md
```

---

## 🌌 Credits

Built by **Sandevistan Tech Inc.** as part of the [Testronaut](https://testronaut.app) ecosystem, the agentic end-to-end testing framework for plain-English user journeys in real browsers.

---

## 🧭 License

MIT © 2025 Sandevistan Tech Inc.
