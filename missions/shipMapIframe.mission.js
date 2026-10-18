import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';
import { loginPrerequisite } from './login.mission.js';

export const shipMapIframeMission = applyMissionPolicies(
  `We are on the dashboard. Find the embedded "SS Definitely Fine" ship navigation console.
   Confirm that the iframe content is available by locating "Embedded navigation deck" and the themed room labels "Unlicensed Holodeck", "Ring Portal Storage", and "Warp Core Warranty Desk" inside the ship map.
   Inside iframe#ship-map-frame, fill the Navigator call sign field with "Nova".
   Still inside that iframe, click the room button labeled "Warp Core Warranty Desk".
   Verify the iframe reports "Warp Core Warranty Desk selected. Awaiting route lock.", which indicates that a hallway route was plotted.
   Click "Lock route", then verify that text visible inside the iframe says "Route locked: Warp Core Warranty Desk for Nova".
   Take a screenshot showing the gold locked route and the complete, readable destination label.
   Report SUCCESS only if the final route confirmation is visible inside the iframe. Otherwise report FAILURE and explain which iframe discovery or interaction failed.`
);

export async function executeMission() {
  return await runMissions({
    preMission: [loginPrerequisite],
    mission: shipMapIframeMission,
  }, 'ship map iframe mission');
}
