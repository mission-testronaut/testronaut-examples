import { runMissions } from 'testronaut';
import { loginMission } from './login.mission.js';

export const completeAllTasksMission =
  `Goal: sequentially complete all tasks until the victory screen appears.
   Rules:
     • Only one task can run at a time. If a task is "En route" or "In progress", wait for it to finish ("Done") before starting another.
   Procedure:
     1) On the dashboard, click "Start" on a "Queued" task.
     2) Wait for it to reach "Done" (up to ~35 seconds).
     3) Repeat until no "Start" buttons remain.
   When all tasks are done, the app should show the end screen with title "Crew Victory!".
   Take a screenshot at least once during the process and once on the final screen.
   If you reach "Crew Victory!", report SUCCESS.
   Otherwise, report FAILURE and explain which step failed.`;

export async function executeMission() {
  return await runMissions({
    preMission: [loginMission],
    mission: completeAllTasksMission
  }, "complete all tasks mission");
}
