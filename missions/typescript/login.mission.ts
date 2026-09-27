import { runMissions } from 'testronaut';
import { applyMissionPolicies } from '../policies.js';

export const tags: string[] = ['authentication', 'smoke', 'typescript'];

export const loginPrerequisite: string =
  `Visit ${process.env.URL}.
   Fill the username field (#username) with ${process.env.USERNAME}.
   Fill the access code field (#access) with ${process.env.PASSWORD}.
   Click the button most likely to log in (#login-submit or a button labeled "Dock at Mission Control").
   After clicking:
     • Wait for the URL to change away from any /login or the login form to disappear.
     • Wait until a heading with "Mission Tasks" is visible.
   This is setup only: do not take screenshots or inspect unrelated UI.
   If the Mission Tasks section is visible, report SUCCESS in one sentence.
   Otherwise, report FAILURE in one sentence.`;

export const loginMission: string = applyMissionPolicies(
  `${loginPrerequisite}
   Capture one screenshot of the authenticated Mission Tasks dashboard.
   Report SUCCESS only when the authenticated dashboard is visible; otherwise report FAILURE.`
);

export async function executeMission() {
  return runMissions({ mission: loginMission, tags }, 'TypeScript login mission');
}
