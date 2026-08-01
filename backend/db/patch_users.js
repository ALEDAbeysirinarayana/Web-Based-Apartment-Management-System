const pool = require('../config/db');

async function patchUsers() {
  console.log('Running users table patch...');
  try {
    const cols = [
      { name: 'full_name', def: 'VARCHAR(255) NULL' },
      { name: 'nic_or_passport', def: 'VARCHAR(100) NULL' },
      { name: 'phone_number', def: 'VARCHAR(100) NULL' },
      { name: 'building_name', def: 'VARCHAR(100) NULL' },
      { name: 'unit_number', def: 'VARCHAR(100) NULL' },
      { name: 'vehicle_number', def: 'VARCHAR(100) NULL' },
      { name: 'relationship_to_owner', def: 'VARCHAR(100) NULL' }
    ];

    for (const col of cols) {
      const [existing] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
        [col.name]
      );

      if (existing.length === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`Added column ${col.name}`);
      } else {
        console.log(`Column ${col.name} already exists`);
      }
    }

    console.log('Users table patched successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Patch failed:', error);
    process.exit(1);
  }
}

patchUsers();
