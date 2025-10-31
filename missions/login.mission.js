import { runMissions } from 'testronaut';

export const loginMission =
  `Visit ${process.env.URL}.
   Fill the username field (#username) with ${process.env.USERNAME}.
   Fill the access code field (#access) with ${process.env.PASSWORD}.
   Take a screenshot.
   Click the button most likely to log in (#login-submit or a button labeled "Dock at Mission Control").
   After clicking:
     • Wait for the URL to change away from any /login or the login form to disappear.
     • Wait until a heading with "Mission Tasks" is visible.
   Take a screenshot.
   If the Mission Tasks section is visible, report SUCCESS with the reason.
   Otherwise, report FAILURE with the reason.`;

export async function executeMission() {
  return await runMissions({ mission: loginMission }, "login mission");
}
