import { launchProtocol, runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';

export const tags = ['authentication', 'smoke'];

const loginInstructions =
  `Visit ${process.env.URL}.
   First check whether the authenticated "Mission Tasks" heading is already visible.
   If it is visible, the existing browser authentication is valid: report SUCCESS immediately without opening the login form or entering credentials.
   Otherwise, continue with the login steps below.
   Fill the username field (#username) with ${process.env.USERNAME}.
   Fill the access code field (#access) with ${process.env.PASSWORD}.
   Click the button most likely to log in (#login-submit or a button labeled "Dock at Mission Control").
   After clicking:
     • Wait for the URL to change away from any /login or the login form to disappear.
     • Wait until a heading with "Mission Tasks" is visible.
   This is setup only: do not take screenshots, inspect unrelated UI, or continue after verifying "Mission Tasks".
   If the Mission Tasks section is visible, report SUCCESS in one sentence.
   Otherwise, report FAILURE in one sentence.`;

export const loginPrerequisite = launchProtocol(loginInstructions, {
  id: 'authenticated:demo-user',
  probe: {
    url: process.env.URL,
    selector: '#new-task',
    text: '',
  },
});

export const loginMission = applyMissionPolicies(
  `${loginPrerequisite}
   Capture one screenshot of the authenticated Mission Tasks dashboard.
   Report SUCCESS only when the authenticated dashboard is visible; otherwise report FAILURE.`
);

export async function executeMission() {
  return await runMissions({ mission: loginMission, tags }, "login mission");
}
