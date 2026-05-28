import fs from 'fs/promises';
import path from 'path';

export async function generateRoles(dataDir, liveVersion = 'Unknown') {
  console.log(' -> Generating PlayerRoles.ger');

  try {
    const response = await fetch(`https://api.apbdb.com/beacon/roles`);
    const roles = await response.json();

    const dateOfUpdate = new Date().toISOString().replace('T', ' ').split('.')[0];
    let fileContent =
      ";   ____             _          __ \n" +
      ";  / __/__ __ ______(_)__ ___  / /_\n" +
      "; / _/(_-</ // / __/ / -_) _ \\/ __/\n" +
      ";/___/___/\\_,_/_/ /_/\\__/_//_/\\__/    \n" +
      ";##########################################\n" +
      "; Database Version: " + liveVersion + "\n" +
      "; Generated on: " + dateOfUpdate + "\n" +
      ";##########################################\n\n" +
      "[PlayerRoles]\n\n";

    for (const role of roles) {
      if (!role.sAPBDB) continue;

      const roleId = role.sAPBDB;
      fileContent += `PlayerRoles_${roleId}_DisplayName=<Color:R=1 G=1 B=1>${role.sDisplayName || ''}<Color:R=1 G=1 B=1>\n`;

      try {
        const detailRes = await fetch(`https://api.apbdb.com/beacon/roles/${roleId}`);
        if (!detailRes.ok) continue;
        const detailData = await detailRes.json();

        const milestones = detailData.aMilestones || [];
        if (milestones.length === 0) continue;

        let totalActions = 0;
        const hierarchyData = milestones.map((m, index) => {
          const passMark = m.fPassMark_0 || 0;
          totalActions += passMark;

          let unlocks = [];
          if (m.eReward && m.eReward.eItems) {
            for (const item of m.eReward.eItems) {
              if (item.sDisplayName) {
                unlocks.push(item.sDisplayName);
              }
            }
          }

          return {
            rank: index + 1,
            passMark: passMark,
            totalActions: totalActions,
            unlocks: unlocks,
            sAPBDB: m.sAPBDB,
            id: m.id
          };
        });

        for (const activeMilestone of hierarchyData) {
          if (!activeMilestone.sAPBDB) continue;

          let descString = '';
          for (const rankData of hierarchyData) {
            const isActive = (rankData.rank === activeMilestone.rank);
            const actionTerm = role.sDisplayName?.includes('Cop') || role.sDisplayName?.includes('Enforcer') || role.sDisplayName?.includes('Officer') ? 'arrests' : 'kills';
            const actionText = `${rankData.passMark} ${actionTerm} // ${rankData.totalActions} total ${actionTerm}`;

            if (isActive) {
              descString += `<Color:R=0.270 G=1.000 B=0.086>Rank ${rankData.rank}: ${actionText}<Color:R=1 G=1 B=1>↵`;
            } else {
              descString += `Rank ${rankData.rank}: ${actionText}↵`;
            }

            for (const unlock of rankData.unlocks) {
              const cleanUnlock = unlock.replace(/<[^>]+>/g, '');
              descString += `   Unlock: ${cleanUnlock}↵`;
            }
          }

          fileContent += `PlayerRoles_${activeMilestone.sAPBDB}_Description=${descString}\n`;
        }

      } catch (err) {
        console.error(`Failed to fetch details for role ${roleId}:`, err);
      }

      fileContent += '\n';
    }

    await fs.writeFile(path.join(dataDir, 'PlayerRoles.ger'), fileContent, 'utf-8');
    console.log(' -> Saved PlayerRoles.ger');
  } catch (error) {
    console.error('Failed to generate roles:', error);
  }
}
