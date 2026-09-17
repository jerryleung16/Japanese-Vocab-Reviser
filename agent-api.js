(function () {
    'use strict';

    async function parseResponse(response) {
        let payload;
        try {
            payload = await response.json();
        } catch {
            throw new Error('後端回覆格式無法讀取');
        }
        if (!response.ok || !payload) {
            const error = new Error(payload?.error || 'Copilot 暫時無法回答');
            error.code = payload?.code;
            error.status = response.status;
            throw error;
        }
        return payload;
    }

    async function postAgent(payload, signal) {
        const response = await fetch('/api/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal
        });
        return parseResponse(response);
    }

    async function getAgent(path, signal) {
        const response = await fetch(path, { signal });
        return parseResponse(response);
    }

    async function listAgentSessions(signal) {
        return getAgent('/api/copilot/sessions', signal);
    }

    async function createAgentSession(name, signal) {
        return postAgent({ operation: 'create', name }, signal);
    }

    async function askCopilot(sessionId, message, context, signal, turnId) {
        const payload = await postAgent({ operation: 'send', sessionId, message, context, turnId }, signal);
        if (typeof payload.content !== 'string') {
            throw new Error('Copilot 沒有回傳可用答案');
        }
        return payload;
    }

    async function retryCopilotTurn(sessionId, turnId, signal) {
        return postAgent({ operation: 'retry', sessionId, turnId }, signal);
    }

    async function editCopilotTurn(sessionId, turnId, message, context, signal) {
        return postAgent({ operation: 'edit', sessionId, turnId, message, context }, signal);
    }

    async function cancelAgentSession(sessionId, signal) {
        return postAgent({ operation: 'cancel', sessionId }, signal);
    }

    async function deleteAgentSession(sessionId, signal) {
        return postAgent({ operation: 'delete', sessionId }, signal);
    }

    async function getSessionUsage(sessionId, signal) {
        return getAgent(`/api/copilot/usage?sessionId=${encodeURIComponent(sessionId)}`, signal);
    }

    async function getAccountQuota(signal) {
        return getAgent('/api/copilot/quota', signal);
    }

    window.askCopilot = askCopilot;
    window.agentApi = {
        listAgentSessions,
        createAgentSession,
        askCopilot,
        retryCopilotTurn,
        editCopilotTurn,
        cancelAgentSession,
        deleteAgentSession,
        getSessionUsage,
        getAccountQuota
    };
})();