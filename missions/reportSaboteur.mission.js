import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';
import { loginPrerequisite } from './login.mission.js';

export const reportSaboteurMission = applyMissionPolicies(
  `Open the report flow by clicking a button labeled "Report".
   A modal should appear titled "File a Report".
   In the modal, select the first enabled crew member by clicking its parent label once, then verify that label's radio input is checked and Submit Report is enabled.
   If selection does not persist after one targeted retry on the same label, report FAILURE immediately rather than trying other crew members or selectors.
   Take a screenshot.
   Click the "Submit Report" button.
   After submission:
     • If a banner/notice with role="status" appears saying "Report filed" (or similar), that indicates success.
     • OR if the page transitions to a victory screen with text "Crew Victory!", that also counts as success.
   Take a screenshot.
   If either success condition is met, report SUCCESS with what you observed.
   Otherwise, report FAILURE explaining what happened.`
);

export async function executeMission() {
  return await runMissions({
    preMission: [loginPrerequisite],
    mission: reportSaboteurMission
  }, "report saboteur mission");
}
