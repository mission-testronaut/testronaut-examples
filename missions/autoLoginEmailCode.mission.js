// This example requires an account with automatic email-code access and an active inbox.

import { runMissions } from 'testronaut';

const inboxAddress = process.env.EMAIL_INBOX_ADDRESS
  || 'celestial-nebula-s6vt@inbox.staging.testronaut.app';
const inboxNickname = process.env.EMAIL_INBOX_NICKNAME || 'asimov';

export const tags = ['authentication', 'email-code', 'premium', 'staging'];

export const loginMission =
  `Visit ${process.env.URL || 'https://demo.testronaut.app'}.
   Fill the username field (#username) with ${process.env.USERNAME || 'Nova'}.
   Fill the access code field (#access) with ${process.env.PASSWORD || '1234'}.
   Check the "Challenge with email code" checkbox (#email-code-challenge).
   Fill the "Email used for this session" field (#session-email) with ${inboxAddress}.
   Set "Verification code digits" (#mfa-code-digits) to 6.
   Take a screenshot.
   Click "Begin Simulation" (#login-submit).

   Wait for the email-code challenge addressed to ${inboxAddress}.
   Use the get_email_code tool to retrieve the newest code from the Testronaut inbox nicknamed "${inboxNickname}".
   Use demo.testronaut.app as the site host hint and allow up to 60 seconds for delivery.
   This is an unattended automatic email-code test. Do not call request_human_input or get_mfa_code.
   If get_email_code cannot return a usable code, report FAILURE immediately with its error code and stop.
   Read the returned email text and code candidates, then identify the 6-digit authentication code.
   Fill the Email Code field (#email-code) with that code.
   Click "Verify Code" (#email-code-submit).

   Wait until the "Mission Tasks" heading is visible and the login form has disappeared.
   Take a screenshot.

   If the Mission Tasks section is visible, report SUCCESS with the reason.
   Otherwise, report FAILURE with the reason.`;

export async function executeMission() {
  return await runMissions({ mission: loginMission, tags }, 'automatic email-code login mission');
}
