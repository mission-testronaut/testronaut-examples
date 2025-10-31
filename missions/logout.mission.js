import { runMissions } from 'testronaut';
import { loginMission } from './login.mission.js';

export const logoutMission =
  `From the dashboard, click the "Logout" button in the header.
   The app should return to the login screen with the heading "Welcome to Mission Control".
   Take a screenshot.
   If the login screen is visible, report SUCCESS.
   Otherwise, report FAILURE.`;

export async function executeMission() {
  return await runMissions({
    preMission: [loginMission],
    mission: logoutMission
  }, "logout mission");
}
