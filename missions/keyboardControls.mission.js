import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';

export const tags = ['authentication', 'keyboard', 'interaction'];

export const keyboardControlsMission = applyMissionPolicies(
  `Visit ${process.env.URL}.
   This mission must exercise keyboard input; do not substitute clicks for the two explicitly named key presses.

   Start from the login screen. If the authenticated Mission Tasks dashboard is already visible, click Logout first.
   Fill #username with ${process.env.USERNAME}.
   Fill #access with ${process.env.PASSWORD}.
   With #access focused, use press_key with key "Enter" and selector "#access" to submit the login form.
   Verify that the login form disappears and the "Mission Tasks" heading becomes visible.

   Open the report dialog using the Report button.
   Verify that the "File a Report" dialog is visible and includes the instruction "Press Escape to cancel."
   Use press_key with key "Escape" to close the dialog.
   Verify that "File a Report" is no longer visible and that the Mission Tasks dashboard remains visible.

   Report SUCCESS only if Enter submitted the form and Escape dismissed the dialog. Otherwise report FAILURE and identify which key behavior failed.`
);

export async function executeMission() {
  return await runMissions(
    { mission: keyboardControlsMission, tags },
    'keyboard controls mission',
  );
}
