import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';
import { loginPrerequisite } from './login.mission.js';

export const logoutMission = applyMissionPolicies(
  `From the dashboard, click the "Logout" button in the header.
   The app should return to the login screen with the observed heading "Welcome to the Crew Simulation".
   Take a screenshot.
   If the login screen is visible, report SUCCESS.
   Otherwise, report FAILURE.`
);

export async function executeMission() {
  return await runMissions({
    preMission: [loginPrerequisite],
    mission: logoutMission
  }, "logout mission");
}
