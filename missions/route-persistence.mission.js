import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';
import { loginPrerequisite } from './login.mission.js';

export const tags = ["navigation","regression","persistence","iframe"];

export const routePersistenceMission = applyMissionPolicies("Objective: Verify that a locked Warp Core Warranty Desk route for navigator Nova remains locked after refreshing the dashboard.\n\nSteps:\n1. On the authenticated Mission Tasks dashboard, locate the embedded \"SS Definitely Fine\" ship navigation console in iframe#ship-map-frame.\n2. Inside iframe#ship-map-frame, fill the Navigator call sign field with \"Nova\".\n3. Inside the iframe, select the room labeled \"Warp Core Warranty Desk\" and verify the status says it is selected and awaiting route lock.\n4. Click \"Lock route\" inside the iframe and verify the confirmation says \"Route locked: Warp Core Warranty Desk for Nova\".\n5. Refresh the dashboard page once and wait for it to finish loading.\n6. Locate iframe#ship-map-frame again and verify the locked route is still shown for Warp Core Warranty Desk and Nova.\n7. Capture a screenshot showing the persisted locked route and its complete confirmation.\n\nSuccess criteria: After one page refresh, the iframe visibly confirms that the route remains locked to Warp Core Warranty Desk for Nova.\nReport SUCCESS only when the success criteria are visibly satisfied. Otherwise report FAILURE with the unmet criterion.");

export async function executeMission() {
  return await runMissions({ preMission: [loginPrerequisite], mission: routePersistenceMission, tags }, "route persistence mission");
}
