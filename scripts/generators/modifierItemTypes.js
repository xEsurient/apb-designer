import fs from 'fs/promises';
import path from 'path';

export async function generateModifiers(dataDir, liveVersion = 'Unknown') {
  console.log(' -> Generating ModifierItemTypes.ger');

  try {
    let items = [];
    let page = 1;
    let totalPages = 1;

    // Category Color Mapping
    const colorMap = {
      10: '<Color:R=0.270588 G=1.000000 B=0.086275>', // Vehicle_Chassis (Green)
      11: '<Color:R=1.000000 G=0.000000 B=0.000000>', // Vehicle_Engine (Red)
      12: '<Color:R=0.596078 G=0.082353 B=0.768628>', // Vehicle_Generic (Purple)
      14: '<Color:R=0.035294 G=0.470588 B=1.000000>', // Vehicle_Trunk (Blue)
      15: '<Color:R=1.000000 G=0.000000 B=0.000000>', // Weapon_Barrel (Red)
      16: '<Color:R=0.035294 G=0.470588 B=1.000000>', // Weapon_Magazine (Blue)
      17: '<Color:R=0.596078 G=0.082353 B=0.768628>', // Weapon_Receiver (Purple)
      19: '<Color:R=1.000000 G=0.400000 B=0.000000>', // Weapon_UpperRail (Orange)
      2: '<Color:R=0.270588 G=1.000000 B=0.086275>',  // Character_Health (Green)
      4: '<Color:R=0.035294 G=0.470588 B=1.000000>',  // Character_Utility (Blue)
      6: '<Color:R=1.000000 G=0.400000 B=0.000000>',  // Character_Activated (Orange)
      7: '<Color:R=1.000000 G=0.400000 B=0.000000>',  // Character_Passenger_Activated (Orange)
      9: '<Color:R=1.000000 G=0.400000 B=0.000000>'   // Vehicle_Activated (Orange)
    };

    do {
      const response = await fetch(`https://api.apbdb.com/beacon/items?cat=FnMod&limit=100&page=${page}`);
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
      "[ModifierItemTypes]\n\n";

    for (const item of items) {
      if (!item.sAPBDB) continue;

      const id = item.sAPBDB;

      try {
        const detailRes = await fetch(`https://api.apbdb.com/beacon/items/${id}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();

          const catId = detailData.detail?.eModifierItem?.eModifierCategory?.id;
          const colorTag = colorMap[catId] || '';
          const displayName = detailData.sDisplayName || '';

          if (displayName) {
            fileContent += `ModifierItemTypes_${id}_DisplayName=${colorTag}${displayName}<Color:R=1 G=1 B=1>\n`;
          }

          const desc = detailData.detail?.sDescription;
          if (desc) {
            const formattedDesc = desc.replace(/\r?\n/g, ' ↵');
            fileContent += `ModifierItemTypes_${id}_Description=${formattedDesc}\n\n`;
          }
        }
      } catch (e) {
      }
    }

    await fs.writeFile(path.join(dataDir, 'ModifierItemTypes.ger'), fileContent, 'utf-8');
    console.log(' -> Saved ModifierItemTypes.ger');
  } catch (error) {
    console.error('Failed to generate modifier items:', error);
  }
}
