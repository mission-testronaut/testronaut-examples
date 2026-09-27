import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';
import { loginPrerequisite } from './login.mission.js';

export const addTaskMission = applyMissionPolicies(
  `We are on the dashboard.
   Add a new task using the input with id #new-task.
   Use the title: "Check reactor coils".
   Take a screenshot.
   Click the "Add" button near the input to submit.
   Then verify the task list (the <ul> of tasks) contains text "Check reactor coils".
   Take a screenshot.
   If the task appears in the list, report SUCCESS explaining how it was verified.
   Otherwise, report FAILURE with the reason.`
);

export async function executeMission() {
  return await runMissions({
    preMission: [loginPrerequisite],
    mission: addTaskMission
  }, "add task mission");
}
