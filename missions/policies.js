export const screenshotPolicy = `
SCREENSHOT POLICY
- Capture the starting state when it helps establish context.
- Capture important state transitions and the final state used to determine SUCCESS or FAILURE.
- Before reporting a failure, capture the unexpected or blocking state when possible.
- Avoid redundant screenshots and do not intentionally capture secrets or sensitive values.
`;

export const missionFeedbackPolicy = `
MISSION FEEDBACK POLICY
After determining SUCCESS or FAILURE, briefly review this run for useful signals beyond the result.

Consider these lenses:
- TEST QUALITY: ambiguity, missing assumptions, weak assertions, or unnecessary steps in the mission.
- UI / UX: confusing labels, unclear feedback, accessibility concerns, or avoidable friction.
- SECURITY: suspicious exposure, unsafe behaviour, unexpected access, or sensitive information. Treat these as observations requiring validation, not confirmed vulnerabilities.
- LATENCY: noticeably slow responses, transitions, or feedback that affected the journey.
- SURPRISES: unexpected states, alternate successful paths, intermittent behaviour, or changes the mission did not anticipate.
- TOKEN EFFICIENCY: retries, repeated inspection, redundant context, or configuration changes that could reduce tool calls or tokens without weakening coverage.

Reporting rules:
- Keep the mission result separate from the review. An observation does not change SUCCESS to FAILURE unless it violates an explicit mission requirement.
- Report only evidence observed during this run. Do not invent findings.
- Include at most three findings, prioritizing the most actionable.
- For each finding, provide: lens, observation, evidence, confidence (low/medium/high), and suggested follow-up.
- If nothing meaningful was observed, report \"No additional findings.\"
- Never weaken an assertion or change a mission automatically. Recommendations require review and measurement.
`;

export const recoveryPolicy = `
RECOVERY POLICY
- A recovery is an action outside the ordinary user journey that is needed to continue after an unexpected state, such as reloading a stale page or dismissing an unexpected dialog.
- Before taking a permitted recovery, call record_recovery with a stable action name and the observed reason. Request a screenshot when it helps prove the unexpected state.
- The project permits only the recovery actions listed in testronaut-config.json. Do not invent another workaround.
- Try a recovery at most once for the same unexpected state. If it does not work, report FAILURE.
- Do not record ordinary navigation, expected dialog dismissal, selector refinement, or normal verification as recovery.
`;

export const globalMissionPolicy = `${screenshotPolicy}\n${recoveryPolicy}\n${missionFeedbackPolicy}`;

export function applyMissionPolicies(mission) {
  return `${mission.trim()}\n\n${globalMissionPolicy.trim()}`;
}
