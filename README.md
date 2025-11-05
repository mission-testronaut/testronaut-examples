# 🧑‍🚀 Testronaut Mission Suite — Crew Simulation

This repository contains a collection of **example missions** for [Testronaut](https://testronaut.app), designed to run against the demo sandbox at [https://demo.testronaut.app](https://demo.testronaut.app).

Each mission demonstrates how autonomous testing agents powered by GPT‑5 can reason, interact, and validate UI workflows in a real browser.

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
| `logout.mission.js` | Logs the user out and returns to the login screen |
| `smokeSuite.mission.js` | Runs a full workflow suite (login → task → report → logout) |

---

## 🚀 How to Run Missions

1. **Install Testronaut CLI**

```bash
npm install -g testronaut
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
```

4. **Run a mission**

```bash
testronaut run missions/login.mission.js
```

5. **Run the full suite**

```bash
testronaut run missions/smokeSuite.mission.js
```

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
