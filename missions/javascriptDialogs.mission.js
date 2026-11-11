import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';
import { loginPrerequisite } from './login.mission.js';

export const tags = ['browser-native', 'dialogs', 'interaction'];

export const javascriptDialogsMission = applyMissionPolicies(
  `We are on the Crew Simulator dashboard. Find the Browser-native Dialog Lab.
   First use check_text once for "Browser-native Dialog Lab". If it returns NOT FOUND, report FAILURE immediately with "dialog fixture is not deployed at the configured URL". Do not explore other pages, press Tab, or spend additional turns searching for the fixture.
   This mission must exercise all four browser-native JavaScript dialog types using prepare_dialog_response immediately before each triggering click.

   Arm an exact alert response for "Emergency meeting called! Report to the cafeteria." with action "accept", then click "Call meeting". Verify the page reports "Alert acknowledged. The crew has assembled." and take a screenshot.

   Arm an exact confirm response for "Emergency meeting! Attend?" with action "accept", then click "Request attendance". Verify the page reports "Attendance confirmed. Not sus."

   Arm an exact prompt response for "Emergency meeting! Name the suspicious crewmate:" with action "accept" and input "Blue", then click "Name a suspect". Verify the page reports "Suspect named: Blue."

   Click "Arm departure warning". Arm a beforeunload response with action "dismiss", then click "Attempt departure". Verify that the browser remains on the dashboard and the Browser-native Dialog Lab is still visible.

   Report SUCCESS only if every dialog appeared with the expected type/message, the prepared decision was reported, every page outcome matched, and the dismissed departure kept the dashboard open. Otherwise report FAILURE and identify the mismatched or missing dialog.`
);

export async function executeMission() {
  return await runMissions({
    preMission: [loginPrerequisite],
    mission: javascriptDialogsMission,
    tags,
  }, 'JavaScript dialogs mission');
}
