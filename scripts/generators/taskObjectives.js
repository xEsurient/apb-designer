import fs from 'fs/promises';
import path from 'path';

function formatTime(seconds) {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export async function generateTasks(dataDir, liveVersion = 'Unknown') {
  console.log(' -> Generating TaskObjectives.ger');

  try {
    let missions = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await fetch(`https://api.apbdb.com/beacon/missions?limit=100&page=${page}`);
      const data = await response.json();
      missions = missions.concat(data.missions || []);
      totalPages = data.totalPages || 1;
      page++;
    } while (page <= totalPages);

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
      "[TaskObjectives]\n\n";

    for (const mission of missions) {
      if (!mission.sAPBDB) continue;

      const id = mission.sAPBDB;
      fileContent += `; Mission: ${mission.sMissionTitle || id}\n`;

      try {
        const detailRes = await fetch(`https://api.apbdb.com/beacon/missions/${id}`);
        if (!detailRes.ok) continue;

        const detailData = await detailRes.json();
        const aStages = detailData.aStages || [];

        if (aStages.length === 0) {
          fileContent += `TaskObjectives_${id}_Stage01_OwnerBrief=<Fonts:EngineFonts.SmallFont><col:Valentine_Pink>Mission [05:00]</col>\n`;
          continue;
        }

        let visibleStages = [];
        let stageToVisibleIndex = [];
        let currentVisibleIndex = -1;

        for (const stage of aStages) {
          if (!stage.bIsConcurrent) {
            currentVisibleIndex++;
            const opCategory = stage.eOperation?.eTaskOperationCategory?.sAPBDB || 'Task';
            let taskName = opCategory;
            let modifierStr = '';

            // Map categories
            const categoryMap = {
              'AntiGraffiti': 'Graffiti',
              'ArmedGuard': 'Capture',
              'Arson': 'Arson',
              'BombDisposal': 'Defuse',
              'Bombing': 'Bomb',
              'Burglary': 'Raid',
              'CrimeSceneInvestigation': 'Invest',
              'Deathmatch': 'DM',
              'TakeOverDeathmatch': 'TDM',
              'Delivery': 'Drop Off',
              'ForcedEntry': 'Raid',
              'Graffiti': 'Graffiti',
              'Hacking': 'Hack',
              'MovingTarget': 'VIP',
              'Pickup': 'Pickup',
              'Rendezvous': 'Capture',
              'Sabotage': 'Defuse',
              'TerritoryControl': 'Point Hold',
              'Vandalism': 'Destroy',
              'VehicleCargo': 'Car Loot',
              'VehicleLooting': 'Car Loot',
              'VehicleTheft': 'Car Theft'
            };
            if (categoryMap[taskName]) taskName = categoryMap[taskName];

            const rawOp = stage.eOperation?.sAPBDB || '';
            if (rawOp.includes('ThenDelivery')) modifierStr = ' + Drop off';
            if (rawOp.includes('Scavenger')) {
              taskName = 'Scav';
              modifierStr = '';
            }

            const count = stage.nTargetsRequired || 1;
            const countStr = count > 1 ? `: ${count}` : '';

            const isHeavy = stage.eTaskItemVariety?.fVehicleTorqueReductionFactor >= 0.5;
            const heavyStr = isHeavy ? ' [Heavy]' : '';

            const timePrefix = stage.bBonusTime ? '+' : '';
            const timeStr = formatTime(stage.nTimeLimit);

            visibleStages.push(`${taskName}${countStr}${modifierStr}${heavyStr} [${timePrefix}${timeStr}]`);
          }
          stageToVisibleIndex.push(Math.max(0, currentVisibleIndex));
        }

        for (let i = 0; i < aStages.length; i++) {
          const vIndex = stageToVisibleIndex[i];
          const activeStages = visibleStages.slice(vIndex);

          const highlightedStages = activeStages.map((str, index) => {
            if (index === 0) {
              return `<col:Valentine_Pink>${str}<col:/>`;
            }
            return str;
          });

          const stageLine = `<Fonts:EngineFonts.SmallFont>` + highlightedStages.join(' | ');
          const stageNum = (i + 1).toString().padStart(2, '0');

          fileContent += `TaskObjectives_${id}_Stage${stageNum}_OwnerBrief=${stageLine}\n`;
          fileContent += `TaskObjectives_${id}_Stage${stageNum}_Opp_OwnerBrief=${stageLine}\n`;
          fileContent += `TaskObjectives_${id}_Stage${stageNum}_DispatchBrief=${stageLine}\n`;
          fileContent += `TaskObjectives_${id}_Stage${stageNum}_Opp_DispatchBrief=${stageLine}\n`;
        }
        fileContent += '\n';
      } catch (e) {
        console.error(`Failed to parse stages for ${id}:`, e);
      }
    }

    await fs.writeFile(path.join(dataDir, 'TaskObjectives.ger'), fileContent, 'utf-8');
    console.log(' -> Saved TaskObjectives.ger');
  } catch (error) {
    console.error('Failed to generate tasks:', error);
  }
}
