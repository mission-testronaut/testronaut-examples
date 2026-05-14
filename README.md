# 🧑‍🚀 Testronaut Mission Suite — Crew Simulation

This repository contains a collection of **example missions** for [Testronaut](https://testronaut.app), designed to run against the demo sandbox at [https://demo.testronaut.app](https://demo.testronaut.app).

Each mission demonstrates how autonomous testing agents can reason, interact, and validate UI workflows in a real browser.

---

## 🧩 Overview

| File | Description |
|------|--------------|
| `login.mission.js` | Logs into Mission Control with sample credentials |
| `addTask.mission.js` | Adds a new task to the mission dashboard |
| `startTask.mission.js` | Begins a task and waits for it to complete automatically |
| `removeTask.mission.js` | Removes a completed or queued task |
| `reportSaboteur.mission.js` | Files a report to identify the Saboteur |
| `completeAllTasks.mission.js` | Completes every task sequentially |
| `fileTransfer.mission.js` | Downloads the sus briefing file and uploads a crewmate alibi log |
| `logout.mission.js` | Logs the user out and returns to the login screen |
| `smokeSuite.mission.js` | Runs a full workflow suite (login → task → report → logout) |

---

## 🚀 How to Run Missions

1. **Install Testronaut CLI**

```bash
npm install -g testronaut
npx testronaut --init
```

2. **Clone this repo**

```bash
git clone https://github.com/your-org/testronaut-crew-simulation-missions.git
cd testronaut-crew-simulation-missions
```

3. **Set your environment variables** (used by missions)

```bash
export URL="https://demo.testronaut.app"
export USERNAME="Nova"
export PASSWORD="1234"

# For OpenAI
export OPENAI_API_KEY=sk-...

# Or for Gemini
export GEMINI_API_KEY=AIza...
```

4. **Run a mission**

```bash
npx testronaut login.mission.js
```

5. **Run the full suite**

```bash
npx testronaut
```

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

export const loginMission = `
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
`;

export async function executeMission() {
  return await runMissions({ mission: loginMission }, "login mission");
}
```

---

## 🧰 Project Structure

```
missions/
  addTask.mission.js
  completeAllTasks.mission.js
  login.mission.js
  logout.mission.js
  removeTask.mission.js
  reportSaboteur.mission.js
  smokeSuite.mission.js
  startTask.mission.js
README.md
```

---

## 🌌 Credits

Built by **Sandevistan Tech Inc.** as part of the [Testronaut](https://testronaut.app) ecosystem, a framework for autonomous QA agents and end‑to‑end testing.

---

## 🧭 License

MIT © 2025 Sandevistan Tech Inc.
