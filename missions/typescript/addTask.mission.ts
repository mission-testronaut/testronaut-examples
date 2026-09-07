import { runMissions } from 'testronaut';
import { loginMission } from './login.mission.ts';

export const tags: string[] = ['tasks', 'typescript'];

export const addTaskMission: string =
  `We are on the dashboard.
   Add a new task using the input with id #new-task.
   Use the title: "Check reactor coils".
   Take a screenshot.
   Click the "Add" button near the input to submit.
   Then verify the task list (the <ul> of tasks) contains text "Check reactor coils".
   Take a screenshot.
   If the task appears in the list, report SUCCESS explaining how it was verified.
   Otherwise, report FAILURE with the reason.`;

export async function executeMission() {
  return runMissions({
    preMission: loginMission,
    mission: addTaskMission,
    tags,
  }, 'TypeScript add task mission');
}
