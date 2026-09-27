import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';
import { loginPrerequisite } from './login.mission.js';

export const completeAllTasksMission = applyMissionPolicies(
  `Goal: sequentially complete all tasks until the victory screen appears.
   Rules:
     • Only one task can run at a time. If a task is "En route" or "In progress", wait for it to finish ("Done") before starting another.
   Procedure:
     1) On the dashboard, click "Start" once on the first "Queued" task using delayMs: 35000.
     2) Inspect that same row once and confirm it reached "Done". Do not repeatedly poll the DOM while waiting.
     3) Repeat until no "Start" buttons remain.
   When all tasks are done, the app should show the end screen with title "Crew Victory!".
   Take a screenshot at least once during the process and once on the final screen.
   If you reach "Crew Victory!", report SUCCESS.
   Otherwise, report FAILURE and explain which step failed.`
);

export async function executeMission() {
  return await runMissions({
    preMission: [loginPrerequisite],
    mission: completeAllTasksMission
  }, "complete all tasks mission");
}
