import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateWeapons } from './generators/weaponItemTypes.js';
import { generateVehicles } from './generators/vehicleItemTypes.js';
import { generateInventoryItems } from './generators/inventoryItemTypes.js';
import { generateModifiers } from './generators/modifierItemTypes.js';
import { generateRoles } from './generators/playerRoles.js';
import { generateTasks } from './generators/taskObjectives.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
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
      await runSync(liveVersion);

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

async function runSync(liveVersion) {
  console.log('Starting data generation...');
  await generateWeapons(DATA_DIR, liveVersion);
  await generateVehicles(DATA_DIR, liveVersion);
  await generateInventoryItems(DATA_DIR, liveVersion);
  await generateModifiers(DATA_DIR, liveVersion);
  await generateRoles(DATA_DIR, liveVersion);
  await generateTasks(DATA_DIR, liveVersion);
  console.log('Data generation finished.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkVersion();
}
