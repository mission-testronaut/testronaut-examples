import { runMissions } from 'testronaut';

export const loginMission =
  `Visit ${process.env.URL}.
   Fill the username field (#username) with ${process.env.USERNAME}.
   Fill the access code field (#access) with ${process.env.PASSWORD}.
   Take a screenshot.
   Check the "Challenge with MFA code" checkbox.
   Set MFA code digits to ${process.env.MFA_DIGITS}.
   Take a screenshot.
   Click the "Begin Simulation" button to login.
   Take screenshot.
   There should be an MFA challenge. Prompt the user for an MFA code, then fill the MFA Code field (#mfa-code) with that code.
   Click the "Verify Code" button (#mfa-submit).
   After clicking "Verify Code":
     • Wait for the URL to change away from any /login or the login form to disappear.
     • Wait until a heading with "Mission Tasks" is visible.
   Take a screenshot.

   If the Mission Tasks section is visible, report SUCCESS with the reason.
   Otherwise, report FAILURE with the reason.`;

export async function executeMission() {
  return await runMissions({ mission: loginMission }, "login mission");
}
