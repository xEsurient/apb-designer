import fs from 'fs/promises';
import path from 'path';

export async function generateVehicles(dataDir, liveVersion = 'Unknown') {
  console.log(' -> Generating VehicleItemTypes.ger');

  try {
    let items = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await fetch(`https://api.apbdb.com/beacon/items?cat=Vehicle&limit=100&page=${page}`);
      const data = await response.json();
      items = items.concat(data.items || []);
      totalPages = data.totalPages || 1;
      page++;
    } while (page <= totalPages);

    const dateOfUpdate = new Date().toISOString().split('T')[0];
    let fileContent =
      ";   ____             _          __ \n" +
      ";  / __/__ __ ______(_)__ ___  / /_\n" +
      "; / _/(_-</ // / __/ / -_) _ \\/ __/\n" +
      ";/___/___/\\_,_/_/ /_/\\__/_//_/\\__/    \n" +
      ";##########################################\n" +
      "; Database Version: " + liveVersion + "\n" +
      "; Generated on: " + dateOfUpdate + "\n" +
      ";##########################################\n\n" +
      "[VehicleItemTypes]\n\n";

    console.log(` -> Fetching details for ${items.length} vehicles...`);
    const batchSize = 20;
    const detailedItems = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const promises = batch.map(async (item) => {
        try {
          const res = await fetch(`https://api.apbdb.com/beacon/items/${item.id}`);
          return await res.json();
        } catch (e) {
          return item;
        }
      });
      const results = await Promise.all(promises);
      detailedItems.push(...results);
    }

    for (const item of detailedItems) {
      if (!item.sAPBDB) continue;

      const id = item.sAPBDB;

      if (item.detail && item.detail.eVehicle) {
        const v = item.detail.eVehicle;
        const hp = v.nMaxHealth || 0;
        const speed = v.fMaxSpeed || 0;
        const revSpeed = v.fMaxReverseSpeed || 0;
        const cargo = (v.nMainCargoPipCapacity || 0) + (v.nCabinCargoPipCapacity || 0);

        const exp = v.eExplosionType || {};
        const expDmg = exp.nDamage || 0;
        const expRad = exp.fExplosionRadius || 0;

        let desc = `Max Health: ${hp} ↵`;
        desc += `Max Speed: ${speed} m/s ↵`;
        desc += `Max Reverse Speed: ${revSpeed} m/s ↵`;
        desc += `Cargo Capacity: ${cargo} ↵`;
        desc += `Explosion Max Damage: ${expDmg} ↵`;
        desc += `Explosion Radius: ${expRad} cm`;

        fileContent += `VehicleItemTypes_${id}_Description=${desc}\n\n`;
      } else if (item.sDescription) {
        const fallbackDesc = item.sDescription.replace(/\r?\n/g, ' ↵');
        fileContent += `VehicleItemTypes_${id}_Description=${fallbackDesc}\n\n`;
      }
    }

    await fs.writeFile(path.join(dataDir, 'VehicleItemTypes.ger'), fileContent, 'utf-8');
    console.log(' -> Saved VehicleItemTypes.ger');
  } catch (error) {
    console.error('Failed to generate vehicles:', error);
  }
}
