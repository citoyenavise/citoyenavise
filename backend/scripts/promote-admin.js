/**
 * Script to promote a user to admin role
 * Usage: npm run promote:admin -- --email user@example.com
 * Or: node scripts/promote-admin.js user@example.com
 */

import sequelize from '../src/db/sequelize.js';
import User from '../src/models/User.js';

const email = process.argv[2] || process.env.ADMIN_EMAIL;

if (!email) {
  console.error('❌ Error: Email not provided');
  console.log('Usage: npm run promote:admin -- --email user@example.com');
  console.log('Or: node scripts/promote-admin.js user@example.com');
  process.exit(1);
}

async function promoteToAdmin() {
  try {
    console.log(`🔍 Looking for user: ${email}`);

    // Sync database first
    await sequelize.sync();

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    // Check if already admin
    if (user.role === 'admin') {
      console.log(`ℹ️  User ${email} is already an admin`);
      process.exit(0);
    }

    // Promote to admin
    await user.update({ role: 'admin' });

    console.log(`✅ User ${email} promoted to admin`);
    console.log(`📊 User details:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
  } catch (err) {
    console.error('❌ Error promoting user:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run
promoteToAdmin();
