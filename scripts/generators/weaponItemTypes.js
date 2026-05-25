import fs from 'fs/promises';
import path from 'path';
/**
 * Generates WeaponItemTypes.ger from APBDb
 */
export async function generateWeapons(dataDir) {
  console.log(' -> Generating WeaponItemTypes.ger');
  
  try {
    const response = await fetch('https://api.apbdb.com/beacon/items?cat=Weapon');
    const data = await response.json();
    const items = data.items || [];
    
    let fileContent = '[WeaponItemTypes]\\n\\n';
    
    // Process items (basic mapping example)
    for (const item of items) {
      if (!item.sAPBDB || !item.sDisplayName) continue;
      
      const id = item.sAPBDB;
      const name = item.sDisplayName;
      
      fileContent += `${id}=${name}\n`;
    }
    
    await fs.writeFile(path.join(dataDir, 'WeaponItemTypes.ger'), fileContent, 'utf-8');
    console.log(' -> Saved WeaponItemTypes.ger');
  } catch (err) {
    console.error('Failed to generate weapons:', err);
  }
}
