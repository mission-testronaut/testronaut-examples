import { runMissions } from 'testronaut';
import { loginMission } from './login.mission.js';

export const startTaskMission =
  `On the dashboard, locate the first task whose status pill reads "Queued" and whose row has a "Start" button.
   Click "Start".
   Take a screenshot.
   Then wait for the task’s status to transition:
     • First to "En route" or "In progress".
     • Eventually to "Done".
   Keep watching this same row. Wait up to 35 seconds overall.
   Take a screenshot after it becomes "Done".
   If the status shows "Done", report SUCCESS describing the transition.
   Otherwise, report FAILURE describing what you saw instead.`;

export async function executeMission() {
  return await runMissions({
    preMission: [loginMission],
    mission: startTaskMission
  }, "start task mission");
}
