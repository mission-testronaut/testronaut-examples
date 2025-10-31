import { runMissions } from 'testronaut';
import { loginMission } from './login.mission.js';

export const removeTaskMission =
  `Add a throwaway task via #new-task input: "Temp Calibration Task".
   Click the nearby "Add" button.
   Confirm "Temp Calibration Task" appears in the task list.
   Take a screenshot.
   In the same row as "Temp Calibration Task", click the "Remove" button (it should be enabled when status is "Queued" or "Done").
   Verify the text "Temp Calibration Task" no longer exists in the list.
   Take a screenshot.
   If the task was removed successfully, report SUCCESS.
   Otherwise, report FAILURE with details.`;

export async function executeMission() {
  return await runMissions({
    preMission: [loginMission],
    mission: removeTaskMission
  }, "remove task mission");
}
