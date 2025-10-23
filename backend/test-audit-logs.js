require('dotenv').config();
const { sequelize } = require('./src/config/database');
const AuditLog = require('./src/models/AuditLog');

async function checkAuditLogs() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if audit_logs table exists
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'blockchain_voting' 
      AND table_name = 'audit_logs'
    `);
    
    console.log('\n📊 Table exists:', results[0].count > 0 ? 'YES' : 'NO');

    if (results[0].count > 0) {
      // Count total logs
      const totalLogs = await AuditLog.count();
      console.log('📝 Total audit logs:', totalLogs);

      if (totalLogs > 0) {
        // Get recent logs
        const recentLogs = await AuditLog.findAll({
          limit: 10,
          order: [['createdAt', 'DESC']]
        });

        console.log('\n🔍 Recent audit logs:');
        console.log('═══════════════════════════════════════════════════════════════');
        recentLogs.forEach((log, index) => {
          console.log(`\n${index + 1}. ${log.action}`);
          console.log(`   User ID: ${log.userId || 'System'}`);
          console.log(`   Entity: ${log.entityType} (ID: ${log.entityId || 'N/A'})`);
          console.log(`   IP: ${log.ipAddress || 'N/A'}`);
          console.log(`   Time: ${log.createdAt}`);
          if (log.newValues) {
            console.log(`   Data: ${JSON.stringify(log.newValues).substring(0, 100)}...`);
          }
        });
        console.log('═══════════════════════════════════════════════════════════════');

        // Get action statistics
        const [actionStats] = await sequelize.query(`
          SELECT action, COUNT(*) as count 
          FROM audit_logs 
          GROUP BY action 
          ORDER BY count DESC 
          LIMIT 10
        `);

        console.log('\n📈 Top Actions:');
        actionStats.forEach(stat => {
          console.log(`   ${stat.action}: ${stat.count}`);
        });

        // Get entity statistics
        const [entityStats] = await sequelize.query(`
          SELECT entityType, COUNT(*) as count 
          FROM audit_logs 
          GROUP BY entityType 
          ORDER BY count DESC
        `);

        console.log('\n📊 Entity Breakdown:');
        entityStats.forEach(stat => {
          console.log(`   ${stat.entityType}: ${stat.count}`);
        });
      } else {
        console.log('\n⚠️  No audit logs found yet.');
        console.log('💡 Logs will be created when users perform actions (login, register, etc.)');
      }
    }

    await sequelize.close();
    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAuditLogs();
