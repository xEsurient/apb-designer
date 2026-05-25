import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateWeapons } from './generators/weaponItemTypes.js';
// other generators would be imported here

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const VERSION_FILE = path.join(DATA_DIR, 'version.json');

async function checkVersion() {
  console.log('Checking APBDb version...');
  try {
    const response = await fetch('https://api.apbdb.com/beacon/version');
    const data = await response.json();
    const liveVersion = data.live?.version || data.version;
    
    let localVersion = { version: '0.0.0.0' };
    try {
      const localData = await fs.readFile(VERSION_FILE, 'utf-8');
      localVersion = JSON.parse(localData);
    } catch (e) {
      console.log('No local version found, forcing sync.');
    }

    if (liveVersion && liveVersion !== localVersion.version) {
      console.log(`Update detected: ${localVersion.version} -> ${liveVersion}`);
      await runSync();
      
      // Save new version
      await fs.writeFile(VERSION_FILE, JSON.stringify({
        version: liveVersion,
        lastSynced: new Date().toISOString(),
        source: 'api.apbdb.com'
      }, null, 2));
      console.log('Sync complete!');
    } else {
      console.log(`Local version (${localVersion.version}) is up to date.`);
    }
  } catch (error) {
    console.error('Failed to sync version:', error);
    process.exit(1);
  }
}

async function runSync() {
  console.log('Starting data generation...');
  // In a full implementation, all generators would be called here.
  // For the MVP, we demonstrate with Weapons.
  await generateWeapons(DATA_DIR);
  // await generateInventoryItems(DATA_DIR);
  // await generateVehicles(DATA_DIR);
  console.log('Data generation finished.');
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkVersion();
}
