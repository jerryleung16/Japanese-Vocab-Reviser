(function () {
    'use strict';

    const configuredApiBase = typeof window.agentConfig?.apiBaseUrl === 'string'
        ? window.agentConfig.apiBaseUrl.trim().replace(/\/+$/, '')
        : '';
    let csrfToken = null;

    function apiUrl(path) {
        return configuredApiBase ? `${configuredApiBase}${path}` : path;
    }

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
        const headers = { 'Content-Type': 'application/json' };
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
        const response = await fetch(apiUrl('/api/copilot'), {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            credentials: 'include',
            signal
        });
        return parseResponse(response);
    }

    async function getAgent(path, signal) {
        const response = await fetch(apiUrl(path), { credentials: 'include', signal });
        return parseResponse(response);
    }

    async function getAuthState(signal) {
        const payload = await getAgent('/auth/session', signal);
        csrfToken = payload.csrfToken || null;
        return payload;
    }

    function getLoginUrl() {
        return apiUrl('/auth/github');
    }

    async function logoutAgent(signal) {
        const headers = {};
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
        const response = await fetch(apiUrl('/auth/logout'), {
            method: 'POST',
            headers,
            credentials: 'include',
            signal
        });
        const payload = await parseResponse(response);
        csrfToken = null;
        return payload;
    }

    async function listAgentSessions(signal) {
        return getAgent('/api/copilot/sessions', signal);
    }

    async function createAgentSession(name, purpose, signal) {
        return postAgent({ operation: 'create', name, purpose }, signal);
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
        getAuthState,
        getLoginUrl,
        logoutAgent,
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