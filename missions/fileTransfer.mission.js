import { runMissions } from 'testronaut';
import { loginMission } from './login.mission.js';
import { logoutMission } from './logout.mission.js';

export const fileTransferMission =
  `We are on the dashboard in the "Data Drop Bay" section.
   First, download the sus briefing:
     • Click the button with id #download-briefing.
     • Wait for the status text #download-status to mention the file was downloaded (it references crew-briefing-among-us.txt).
     • Take a screenshot of the Data Drop Bay showing the updated download status.
   Next, upload a themed file:
     • Use the file input #upload-crew-file to upload missions/files/crewmate-alibi.txt (path is relative to the repo root).
     • Wait for #upload-status to mention crewmate-alibi.txt and show the sus verdict.
     • Take a screenshot after the upload status updates.
   If both the download and upload statuses reflect success, report SUCCESS with what was seen.
   Otherwise, report FAILURE with any missing status or error.`;

export async function executeMission() {
  return await runMissions({
    preMission: [loginMission],
    mission: fileTransferMission,
    postMission: logoutMission
  }, "file transfer mission");
}
