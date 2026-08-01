const pool = require('../config/db');

async function patchParking() {
  console.log('Running parking table patch...');
  try {
    // Drop the global unique constraint on slot_number
    // In migration.sql, we wrote "slot_number VARCHAR(50) UNIQUE NOT NULL"
    // This creates an index named "slot_number" or similar. Let's drop it if it exists.
    try {
      await pool.query('ALTER TABLE parking_management DROP INDEX slot_number');
      console.log('Dropped global unique index on slot_number.');
    } catch (err) {
      console.log('Index slot_number did not exist or already dropped:', err.message);
    }

    try {
      // Add a unique key on (slot_number, guest_date) to allow same slot on different days
      // Note: guest_date is NULL for permanent slots, so we'll handle permanent uniqueness in code
      await pool.query('ALTER TABLE parking_management ADD UNIQUE KEY uq_slot_guest_date (slot_number, guest_date)');
      console.log('Added unique index uq_slot_guest_date (slot_number, guest_date).');
    } catch (err) {
      console.log('Unique index uq_slot_guest_date already exists or failed:', err.message);
    }

    console.log('Parking table patched successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Patch failed:', error);
    process.exit(1);
  }
}

patchParking();
