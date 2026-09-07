import { runMissions } from 'testronaut';
import { loginMission } from './login.mission.ts';
import { addTaskMission } from './addTask.mission.ts';

export const tags: string[] = ['smoke', 'navigation', 'typescript'];

const verifyDashboardMission: string =
  `Confirm the Mission Tasks heading and task list remain visible after adding the task.
   Take a screenshot of the resulting dashboard.
   Report SUCCESS if the dashboard is usable and the new task is present.
   Otherwise, report FAILURE with the missing or incorrect state.`;

export async function executeMission() {
  return runMissions({
    preMission: [loginMission, addTaskMission],
    mission: verifyDashboardMission,
    tags,
  }, 'TypeScript smoke suite');
}
