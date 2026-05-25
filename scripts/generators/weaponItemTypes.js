import fs from 'fs/promises';
import path from 'path';

/**
 * Generates WeaponItemTypes from APBDb
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
      if (!item.name) continue;
      
      const id = item.id;
      // Many items in APBDb contain HTML or raw tags; we assume standard text here for simplicity,
      // but in reality we would parse rarity to inject `<col:>` tags.
      const name = item.name.english || item.name;
      
      fileContent += `${id}=${name}\n`;
    }
    
    await fs.writeFile(path.join(dataDir, 'WeaponItemTypes.ger'), fileContent, 'utf-8');
    console.log(' -> Saved WeaponItemTypes.ger');
  } catch (err) {
    console.error('Failed to generate weapons:', err);
  }
}
