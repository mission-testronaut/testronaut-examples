import { runMissions } from 'testronaut';
import { loginMission } from './login.mission.js';

export const reportSaboteurMission =
  `Open the report flow by clicking a button labeled "Report".
   A modal should appear titled "File a Report".
   In the modal, select any crew member by clicking a radio input next to their name.
   Take a screenshot.
   Click the "Submit Report" button.
   After submission:
     • If a banner/notice with role="status" appears saying "Report filed" (or similar), that indicates success.
     • OR if the page transitions to a victory screen with text "Crew Victory!", that also counts as success.
   Take a screenshot.
   If either success condition is met, report SUCCESS with what you observed.
   Otherwise, report FAILURE explaining what happened.`;

export async function executeMission() {
  return await runMissions({
    preMission: [loginMission],
    mission: reportSaboteurMission
  }, "report saboteur mission");
}
