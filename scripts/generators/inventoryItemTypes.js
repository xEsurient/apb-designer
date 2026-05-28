import fs from 'fs/promises';
import path from 'path';

export async function generateInventoryItems(dataDir, liveVersion = 'Unknown') {
  console.log(' -> Generating InventoryItemTypes.ger');

  try {
    let items = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await fetch(`https://api.apbdb.com/beacon/items?limit=100&page=${page}`);
      const data = await response.json();
      items = items.concat(data.items || []);
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
      "[InventoryItemTypes]\n\n";

    for (const item of items) {
      if (!item.sAPBDB) continue;

      const id = item.sAPBDB;
      if (item.sDisplayName) {
        fileContent += `InventoryItemTypes_${id}_DisplayName=${item.sDisplayName}\n`;
      }
    }

    await fs.writeFile(path.join(dataDir, 'InventoryItemTypes.ger'), fileContent, 'utf-8');
    console.log(' -> Saved InventoryItemTypes.ger');
  } catch (error) {
    console.error('Failed to generate inventory items:', error);
  }
}
