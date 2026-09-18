import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is required. Set it only in the current shell or environment manager.');
    process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 1 });

try {
    const tables = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('agent_conversations', 'agent_turns')
        ORDER BY table_name
    `);
    const tableNames = tables.rows.map((row) => row.table_name);
    const hasConversations = tableNames.includes('agent_conversations');
    const hasTurns = tableNames.includes('agent_turns');
    const counts = {
        conversations: hasConversations ? Number((await pool.query('SELECT count(*)::integer AS count FROM agent_conversations')).rows[0].count) : 0,
        turns: hasTurns ? Number((await pool.query('SELECT count(*)::integer AS count FROM agent_turns')).rows[0].count) : 0,
        owners: hasConversations ? Number((await pool.query('SELECT count(DISTINCT owner_id)::integer AS count FROM agent_conversations')).rows[0].count) : 0,
    };
    const statuses = hasTurns
        ? (await pool.query('SELECT status, count(*)::integer AS count FROM agent_turns GROUP BY status ORDER BY status')).rows
        : [];
    const orphanTurns = hasTurns && hasConversations
        ? Number((await pool.query(`
            SELECT count(*)::integer AS count
            FROM agent_turns t
            LEFT JOIN agent_conversations c ON c.id = t.conversation_id
            WHERE c.id IS NULL
        `)).rows[0].count)
        : 0;
    console.log(JSON.stringify({ tables: tableNames, counts, statuses, orphanTurns }, null, 2));
} catch (error) {
    console.error(`Database inspection failed: ${error.message}`);
    process.exitCode = 1;
} finally {
    await pool.end();
}