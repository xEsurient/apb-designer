import fs from 'fs/promises';
import path from 'path';

export async function generateWeapons(dataDir, liveVersion = 'Unknown') {
  console.log(' -> Generating WeaponItemTypes.ger');

  try {
    let items = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await fetch(`https://api.apbdb.com/beacon/items?cat=Weapon&limit=100&page=${page}`);
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
      "[WeaponItemTypes]\n\n";

    console.log(` -> Fetching details for ${items.length} items...`);
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

      if (item.sDisplayName) {
        fileContent += `${id}=${item.sDisplayName}\n`;
      }

      if (item.detail) {
        let wt = null;
        const link = item.detail.eWeaponTypeLink || item.detail;

        for (const key in link) {
          if (key.startsWith('eWeaponType_') && link[key].eClass) {
            wt = link[key];
            break;
          }
        }

        if (wt) {
          const isLTL = wt.bLessLethal === 1;
          const isExplosive = wt.eClass.id === 0;
          let desc = '';

          if (isExplosive) {
            const proj = wt.eWeaponProjectile || {};
            const expl = proj.eExplosion || {};
            const dmg = expl.nDamage || 0;
            const stnDmg = expl.nStunDamage || 0;
            const hardMod = expl.fHardDamageModifier || 0;
            const radius = expl.fExplosionRadius || 0;
            const innerRadius = expl.fGroundZeroRadius || 0;
            const fuse = proj.fFuseDelay || 0;

            desc += `Max Health Damage: ${dmg} ↵`;
            desc += `Max Stamina Damage: ${stnDmg} ↵`;
            desc += `Max Hard Damage: ${(dmg * hardMod).toFixed(1)}↵`;
            desc += `Explosion Radius: ${radius} cm↵`;
            desc += `Max Damage Radius: ${innerRadius} cm ↵`;
            desc += `Fuse Delay: ${fuse > 0 ? fuse + ' sec' : 'None'}↵`;

            fileContent += `WeaponItemTypes_${id}_Description=${desc}\n`;
          } else {
            const fHealthDamage = wt.fHealthDamage || 0;
            const fStaminaDamage = wt.fStaminaDamage || 0;
            const fHardDamageModifier = wt.fHardDamageModifier || 0;
            const fFireInterval = wt.fFireInterval || 0;
            const fReloadTime = wt.fReloadTime || 0;
            const fEquipTime = wt.fEquipTime || 0;
            const fBurstInterval = wt.fBurstInterval || 0;
            const nBurstShots = wt.nBurstShots || 1;

            const rwt = wt.eRangedWeaponType || {};
            const fRampDistance = rwt.fRampDistance || 0;
            const nRaysPerShot = rwt.nRaysPerShot || 1;

            const isShotgun = nRaysPerShot > 1;
            const isBurst = nBurstShots > 1;

            let projMultiplier = isShotgun ? nRaysPerShot : (isBurst ? nBurstShots : 1);
            let projSuffix = projMultiplier > 1 ? ` x ${projMultiplier}` : '';

            let hdStr = `${fHealthDamage}${projSuffix}`;
            let sdStr = `${fStaminaDamage}${projSuffix}`;
            let hardStr = `${(fHealthDamage * fHardDamageModifier).toFixed(1)}${projSuffix}`;

            const damagePerShot = isLTL ? (fStaminaDamage * (isShotgun ? nRaysPerShot : 1)) : (fHealthDamage * (isShotgun ? nRaysPerShot : 1));
            let stk = 0;
            if (damagePerShot > 0) stk = Math.ceil(1000 / damagePerShot);

            let topTtk = 0;
            let burstTtk = 0;
            if (stk > 0) {
              if (nBurstShots > 1 && fBurstInterval > 0) {
                let bursts = Math.floor((stk - 1) / nBurstShots);
                let extraShots = (stk - 1) % nBurstShots;
                burstTtk = (bursts * fBurstInterval) + (extraShots * fFireInterval);
                topTtk = (stk - 1) * fFireInterval;
              } else {
                topTtk = (stk - 1) * fFireInterval;
              }
            }
            topTtk = Number(topTtk.toFixed(3));
            if (burstTtk > 0) burstTtk = Number(burstTtk.toFixed(3));

            if (isLTL) {
              desc += `<Color:R=1 G=0.502 B=0.0>Time To Stun<Color:R=1 G=1 B=1>: ${topTtk} sec ↵`;
              desc += `<Color:R=1 G=0.502 B=0.0>Shots To Stun<Color:R=1 G=1 B=1>: ${stk} ↵`;
            } else {
              desc += `Time To Kill: ${topTtk} sec ↵`;
              desc += `Shots To Kill: ${stk} ↵`;
            }

            desc += `Health Damage: ${hdStr} ↵`;
            desc += `Stamina Damage: ${sdStr} ↵`;
            desc += `Hard Damage: ${hardStr} ↵`;
            desc += `Effective Range: ${Math.floor(fRampDistance / 100)} m↵`;

            if (fBurstInterval > 0) {
              desc += `Burst Interval: ${fBurstInterval} sec ↵`;
              if (burstTtk > 0) {
                desc += `Burst Time To Kill: ${burstTtk} sec ↵`;
              }
            } else {
              desc += `Fire Interval: ${fFireInterval} sec ↵`;
            }

            desc += `Reload Time: ${fReloadTime} sec ↵`;
            desc += `Equip Time: ${fEquipTime} sec`;

            fileContent += `WeaponItemTypes_${id}_Description=${desc}\n`;
          }
        }
      } else if (item.sDescription) {
        const fallbackDesc = item.sDescription.replace(/\r?\n/g, ' ↵');
        fileContent += `WeaponItemTypes_${id}_Description=${fallbackDesc}\n`;
      }
    }

    await fs.writeFile(path.join(dataDir, 'WeaponItemTypes.ger'), fileContent, 'utf-8');
    console.log(' -> Saved WeaponItemTypes.ger');
  } catch (err) {
    console.error('Failed to generate weapons:', err);
  }
}
