import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';
import { loginPrerequisite } from './login.mission.js';

export const startTaskMission = applyMissionPolicies(
  `On the dashboard, locate the first task whose status pill reads "Queued" and whose row has a "Start" button.
   Click that row's Start button once with delayMs set to 35000 so the transition can complete without repeated DOM polling.
   Then inspect this same row once and verify its status transitioned:
     • First to "En route" or "In progress".
     • Eventually to "Done".
   Take a screenshot after it becomes "Done".
   If the status shows "Done", report SUCCESS describing the transition.
   Otherwise, report FAILURE describing what you saw instead.`
);

export async function executeMission() {
  return await runMissions({
    preMission: [loginPrerequisite],
    mission: startTaskMission
  }, "start task mission");
}
