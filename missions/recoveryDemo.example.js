import { runMissions } from 'testronaut';
import { applyMissionPolicies } from './policies.js';
import { loginPrerequisite } from './login.mission.js';

export const recoveryDemoMission = applyMissionPolicies(`
This is an instrumentation demonstration for the recovered mission status.

1. Confirm the authenticated dashboard is visible.
2. Simulate a stale client view by treating the current dashboard state as untrusted.
3. Call record_recovery with action "reload", reason "Recovery-status demonstration intentionally invalidated the current client view", and screenshot true.
4. Use the reload tool exactly once.
5. Verify the authenticated dashboard is visible and usable after reload.

Report SUCCESS only after the post-reload dashboard is verified. This deliberate recovery should make the mission status "recovered". Report FAILURE if reload loses authentication or the dashboard does not return.
`);

export async function executeMission() {
  return runMissions({
    preMission: [loginPrerequisite],
    mission: recoveryDemoMission,
    recovery: { permitted: ['reload'] },
    tags: ['recovery-demo'],
  }, 'recovery status demonstration');
}
