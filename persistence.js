import pg from 'pg';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || '';
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl, max: 5 }) : null;

function databaseTimestamp(value) {
    return value instanceof Date ? value.getTime() : Date.parse(value);
}

function mapTurn(row) {
    return {
        id: row.id,
        prompt: row.prompt,
        context: row.context,
        response: row.response,
        suggestion: row.suggestion || null,
        status: row.status,
        error: row.error,
        createdAt: databaseTimestamp(row.created_at),
        updatedAt: databaseTimestamp(row.updated_at),
    };
}

function mapConversation(row) {
    return {
        id: row.id,
        ownerId: row.owner_id,
        name: row.name,
        purpose: row.purpose,
        createdAt: databaseTimestamp(row.created_at),
        lastUsedAt: databaseTimestamp(row.last_used_at),
        requestCount: row.request_count,
        usage: row.usage || null,
        turns: Array.isArray(row.turns) ? row.turns.map(mapTurn) : [],
    };
}

export const persistenceEnabled = Boolean(pool);

export async function initializePersistence() {
    if (!pool) return;
    await pool.query(`
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
    `);
}

export async function loadConversations(ownerId) {
    if (!pool) return [];
    const result = await pool.query(`
        SELECT
            c.id,
            c.owner_id,
            c.name,
            c.purpose,
            c.created_at,
            c.last_used_at,
            c.request_count,
            c.usage,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'id', t.id,
                        'prompt', t.prompt,
                        'context', t.context,
                        'response', t.response,
                        'suggestion', t.suggestion,
                        'status', t.status,
                        'error', t.error,
                        'created_at', t.created_at,
                        'updated_at', t.updated_at
                    ) ORDER BY t.position
                ) FILTER (WHERE t.id IS NOT NULL),
                '[]'::jsonb
            ) AS turns
        FROM agent_conversations c
        LEFT JOIN agent_turns t ON t.conversation_id = c.id
        WHERE c.owner_id = $1
        GROUP BY c.id
        ORDER BY c.last_used_at DESC
    `, [ownerId]);
    return result.rows.map(mapConversation);
}

export async function conversationNameExists(ownerId, name) {
    if (!pool) return false;
    const result = await pool.query(`
        SELECT 1
        FROM agent_conversations
        WHERE owner_id = $1 AND lower(name) = lower($2)
        LIMIT 1
    `, [ownerId, name]);
    return result.rowCount > 0;
}

export async function saveConversation(id, entry) {
    if (!pool) return;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
            INSERT INTO agent_conversations
                (id, owner_id, name, purpose, created_at, last_used_at, request_count, usage)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                purpose = EXCLUDED.purpose,
                last_used_at = EXCLUDED.last_used_at,
                request_count = EXCLUDED.request_count,
                usage = EXCLUDED.usage
        `, [
            id,
            entry.ownerId,
            entry.name,
            entry.purpose,
            new Date(entry.createdAt),
            new Date(entry.lastUsedAt),
            entry.requestCount,
            entry.usage,
        ]);
        await client.query('DELETE FROM agent_turns WHERE conversation_id = $1', [id]);
        for (const [position, turn] of entry.turns.entries()) {
            await client.query(`
                INSERT INTO agent_turns
                    (id, conversation_id, position, prompt, context, response, suggestion, status, error, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                turn.id,
                id,
                position,
                turn.prompt,
                turn.context,
                turn.response,
                turn.suggestion || null,
                turn.status,
                turn.error,
                new Date(turn.createdAt),
                new Date(turn.updatedAt),
            ]);
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
    } finally {
        client.release();
    }
}

export async function deleteConversation(id) {
    if (!pool) return;
    await pool.query('DELETE FROM agent_conversations WHERE id = $1', [id]);
}

export async function closePersistence() {
    await pool?.end();
}