import { runMissions } from 'testronaut';
import { loginMission } from './login.mission.js';
import { addTaskMission } from './addTask.mission.js';
import { startTaskMission } from './startTask.mission.js';
import { reportSaboteurMission } from './reportSaboteur.mission.js';
import { logoutMission } from './logout.mission.js';

export const smokeSuiteMission =
  `Run a lightweight journey: add a task, start a task, optionally file a report, then logout.
   Take screenshots at notable transitions. 
   Treat any blocking error as FAILURE and stop.`;

export async function executeMission() {
  return await runMissions({
    preMission: [loginMission, addTaskMission, startTaskMission],
    mission: reportSaboteurMission,
    postMission: logoutMission
  }, "smoke suite mission");
}
