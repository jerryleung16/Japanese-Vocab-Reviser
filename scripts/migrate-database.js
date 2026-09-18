import pg from 'pg';

const { Pool } = pg;
const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;
const allowReplace = process.env.ALLOW_TARGET_REPLACE === 'YES';

if (!sourceUrl || !targetUrl) {
    console.error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL are required. Keep both values out of the repository.');
    process.exit(1);
}

const schemaSql = `
    CREATE TABLE IF NOT EXISTS agent_conversations (
        id text PRIMARY KEY,
        owner_id text NOT NULL,
        name text NOT NULL,
        purpose text NOT NULL,
        created_at timestamptz NOT NULL,
        last_used_at timestamptz NOT NULL,
        request_count integer NOT NULL DEFAULT 0,
        usage jsonb
    );
    CREATE INDEX IF NOT EXISTS agent_conversations_owner_idx
        ON agent_conversations (owner_id, last_used_at DESC);
    CREATE TABLE IF NOT EXISTS agent_turns (
        id text PRIMARY KEY,
        conversation_id text NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
        position integer NOT NULL,
        prompt text NOT NULL,
        context text NOT NULL,
        response text,
        suggestion jsonb,
        status text NOT NULL,
        error text,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        UNIQUE (conversation_id, position)
    );
    CREATE INDEX IF NOT EXISTS agent_turns_conversation_idx
        ON agent_turns (conversation_id, position);
`;

async function readSource() {
    const pool = new Pool({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false }, max: 1 });
    try {
        const conversations = await pool.query(`
            SELECT id, owner_id, name, purpose, created_at, last_used_at, request_count, usage
            FROM agent_conversations
            ORDER BY id
        `);
        const turns = await pool.query(`
            SELECT id, conversation_id, position, prompt, context, response, suggestion, status, error, created_at, updated_at
            FROM agent_turns
            ORDER BY conversation_id, position
        `);
        return { conversations: conversations.rows, turns: turns.rows };
    } finally {
        await pool.end();
    }
}

async function writeTarget(data) {
    const pool = new Pool({ connectionString: targetUrl, ssl: { rejectUnauthorized: false }, max: 1 });
    const client = await pool.connect();
    try {
        await client.query(schemaSql);
        const existing = await client.query(`
            SELECT
                (SELECT count(*)::integer FROM agent_conversations) AS conversations,
                (SELECT count(*)::integer FROM agent_turns) AS turns
        `);
        const existingCounts = {
            conversations: Number(existing.rows[0].conversations),
            turns: Number(existing.rows[0].turns),
        };
        if ((existingCounts.conversations || existingCounts.turns) && !allowReplace) {
            throw new Error('target_not_empty: set ALLOW_TARGET_REPLACE=YES only after confirming the target data can be replaced');
        }

        await client.query('BEGIN');
        await client.query('DELETE FROM agent_turns');
        await client.query('DELETE FROM agent_conversations');
        for (const row of data.conversations) {
            await client.query(`
                INSERT INTO agent_conversations
                    (id, owner_id, name, purpose, created_at, last_used_at, request_count, usage)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [row.id, row.owner_id, row.name, row.purpose, row.created_at, row.last_used_at, row.request_count, row.usage]);
        }
        for (const row of data.turns) {
            await client.query(`
                INSERT INTO agent_turns
                    (id, conversation_id, position, prompt, context, response, suggestion, status, error, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [row.id, row.conversation_id, row.position, row.prompt, row.context, row.response, row.suggestion, row.status, row.error, row.created_at, row.updated_at]);
        }
        await client.query('COMMIT');
        return existingCounts;
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

try {
    const data = await readSource();
    const previousTarget = await writeTarget(data);
    console.log(JSON.stringify({
        migrated: {
            conversations: data.conversations.length,
            turns: data.turns.length,
        },
        replacedTarget: previousTarget,
    }, null, 2));
} catch (error) {
    console.error(`Database migration failed: ${error.message}`);
    process.exitCode = 1;
}