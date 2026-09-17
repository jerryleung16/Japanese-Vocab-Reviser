(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const overlay = document.getElementById('agentOverlay');
        const openButton = document.getElementById('sideAgentBtn');
        const closeButton = document.getElementById('closeAgentBtn');
        const form = document.getElementById('agentForm');
        const input = document.getElementById('agentInput');
        const sendButton = document.getElementById('agentSendBtn');
        const messages = document.getElementById('agentMessages');
        const currentCard = document.getElementById('agentCurrentCard');
        const status = document.getElementById('agentStatus');
        const sessionSelect = document.getElementById('agentSessionSelect');
        const newSessionButton = document.getElementById('agentNewSessionBtn');
        const deleteSessionButton = document.getElementById('agentDeleteSessionBtn');
        const retrySessionButton = document.getElementById('agentRetrySessionBtn');
        const cancelButton = document.getElementById('agentCancelBtn');
        const creditsUsed = document.getElementById('agentCreditsUsed');
        const premiumRequests = document.getElementById('agentPremiumRequests');
        const contextTokens = document.getElementById('agentContextTokens');
        const quota = document.getElementById('agentQuota');
        const nameDialog = document.getElementById('agentNameDialog');
        const nameForm = document.getElementById('agentNameForm');
        const nameInput = document.getElementById('agentNameInput');
        const nameError = document.getElementById('agentNameError');
        const nameCancelButton = document.getElementById('agentNameCancelBtn');
        const sessions = new Map();
        let selectedSessionId = null;
        let sessionsReady = false;
        let sessionLoadError = null;
        let editingTurnId = null;
        let nameRequestResolver = null;

        if (!overlay || !openButton || !form) return;

        function createTurnId() {
            return window.crypto?.randomUUID?.() || `turn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        }

        function updateCurrentCard() {
            const item = window.getCurrentVocabItem ? window.getCurrentVocabItem() : null;
            currentCard.textContent = item
                ? `目前單字：${item.kanji || item.hiragana}（${item.hiragana || '沒有讀音'}）`
                : '目前沒有可詢問的單字';
        }

        function selectedSession() {
            return selectedSessionId ? sessions.get(selectedSessionId) : null;
        }

        function saveHistory(session) {
            try {
                const histories = JSON.parse(localStorage.getItem('japanese-vocab-agent-histories') || '{}');
                histories[session.id] = session.turns.slice(-40);
                localStorage.setItem('japanese-vocab-agent-histories', JSON.stringify(histories));
            } catch {
                return;
            }
        }

        function loadHistory(id) {
            try {
                const histories = JSON.parse(localStorage.getItem('japanese-vocab-agent-histories') || '{}');
                return Array.isArray(histories[id]) ? histories[id] : [];
            } catch {
                return [];
            }
        }

        function migrateHistory(history) {
            const turns = [];
            history.forEach((entry) => {
                if (entry?.prompt) {
                    turns.push({ ...entry, id: entry.id || createTurnId(), status: entry.status || 'success' });
                } else if (entry?.type === 'user') {
                    turns.push({ id: createTurnId(), prompt: entry.content, context: null, response: null, status: 'success', error: null });
                } else {
                    const turn = turns.at(-1);
                    if (turn && entry?.type === 'assistant') turn.response = entry.content;
                }
            });
            return turns;
        }

        function normalizeTurns(summary) {
            if (Array.isArray(summary.turns)) {
                return summary.turns.map((turn) => ({
                    id: turn.id || createTurnId(),
                    prompt: turn.prompt || '',
                    context: turn.context || null,
                    response: turn.response || null,
                    status: turn.status || (turn.response ? 'success' : 'error'),
                    error: turn.error || null,
                    createdAt: turn.createdAt,
                    updatedAt: turn.updatedAt,
                }));
            }
            return migrateHistory(loadHistory(summary.id));
        }

        function hydrateSession(summary) {
            return { ...summary, turns: normalizeTurns(summary), busy: false };
        }

        function mergeSessionSummary(session, summary) {
            const currentTurns = new Map((session.turns || []).map((turn) => [turn.id, turn]));
            Object.assign(session, summary);
            session.turns = Array.isArray(summary.turns)
                ? summary.turns.map((turn) => ({ ...turn, context: turn.context || currentTurns.get(turn.id)?.context || null }))
                : session.turns || [];
            session.busy = false;
            saveHistory(session);
        }

        function turnIsPending(session, turnId) {
            return session.turns.some((turn) => turn.id === turnId && turn.status === 'pending');
        }

        function renderTurn(turn) {
            const group = document.createElement('div');
            group.className = 'agent-turn';
            group.dataset.turnId = turn.id;

            const userRow = document.createElement('div');
            userRow.className = 'agent-message agent-message-user';
            const prompt = document.createElement('span');
            prompt.className = 'agent-message-content';
            prompt.textContent = turn.prompt;
            userRow.appendChild(prompt);

            const actions = document.createElement('span');
            actions.className = 'agent-message-actions';
            for (const [actionName, icon, label] of [['edit', 'pen', '編輯問題'], ['retry', 'rotate-right', '重新回答']]) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'agent-message-action';
                button.dataset.agentAction = actionName;
                button.dataset.turnId = turn.id;
                button.title = label;
                button.setAttribute('aria-label', label);
                button.innerHTML = `<i class="fas fa-${icon}"></i>`;
                actions.appendChild(button);
            }
            userRow.appendChild(actions);
            group.appendChild(userRow);

            if (turn.response) {
                const response = document.createElement('div');
                response.className = 'agent-message agent-message-assistant';
                response.textContent = turn.response;
                group.appendChild(response);
            } else if (turn.error || turn.status === 'pending') {
                const error = document.createElement('div');
                error.className = 'agent-message agent-message-error';
                error.textContent = turn.error || '這個問題尚未完成，請重新回答。';
                group.appendChild(error);
            }
            return group;
        }

        function renderMessages() {
            const session = selectedSession();
            messages.replaceChildren();
            if (!session || session.turns.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'agent-empty-state';
                empty.textContent = '可以問我目前這張卡的意思、語感、例句或文法。';
                messages.appendChild(empty);
                return;
            }
            session.turns.forEach((turn) => messages.appendChild(renderTurn(turn)));
            messages.querySelectorAll('.agent-message-action').forEach((button) => {
                button.disabled = Boolean(session.busy) || turnIsPending(session, button.dataset.turnId);
            });
            messages.scrollTop = messages.scrollHeight;
        }

        function renderSessionOptions() {
            sessionSelect.replaceChildren();
            sessions.forEach((session) => {
                const option = document.createElement('option');
                option.value = session.id;
                option.textContent = `${session.name || session.purpose || '未命名對話'} (${session.requestCount || 0})`;
                sessionSelect.appendChild(option);
            });
            sessionSelect.value = selectedSessionId || '';
        }

        function formatNumber(value) {
            return Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: 3 }) : '未提供';
        }

        function renderUsage() {
            const session = selectedSession();
            const usage = session?.usage;
            creditsUsed.textContent = usage?.status === 'available' ? formatNumber(usage.aiCreditsUsed) : '未提供';
            premiumRequests.textContent = usage?.status === 'available'
                ? `${formatNumber(usage.premiumRequestCost)} / ${formatNumber(usage.requestCount)} 次`
                : '未提供';
            contextTokens.textContent = usage?.status === 'available' ? formatNumber(usage.contextTokens) : '未提供';
            const accountQuota = session?.quota;
            quota.textContent = accountQuota?.status !== 'available'
                ? '未提供'
                : accountQuota.unlimited
                    ? `${formatNumber(accountQuota.usedRequests)} 次 / 無上限`
                    : `${formatNumber(accountQuota.usedRequests)} / ${formatNumber(accountQuota.entitledRequests)} 次`;
        }

        function renderSessionState() {
            const session = selectedSession();
            renderSessionOptions();
            renderMessages();
            renderUsage();
            const busy = Boolean(session?.busy);
            const canSend = sessionsReady && !sessionLoadError && Boolean(session) && !busy;
            sessionSelect.disabled = !sessionsReady || Boolean(sessionLoadError);
            input.disabled = !canSend;
            sendButton.disabled = !canSend;
            newSessionButton.disabled = !sessionsReady || Boolean(sessionLoadError) || busy;
            cancelButton.disabled = !busy;
            deleteSessionButton.disabled = !session || busy || Boolean(sessionLoadError);
            retrySessionButton.hidden = !sessionLoadError;
            retrySessionButton.disabled = !sessionLoadError || busy;
            sendButton.innerHTML = busy
                ? '<i class="fas fa-spinner fa-spin"></i> 回答中'
                : editingTurnId
                    ? '<i class="fas fa-save"></i> 送出修改'
                    : '<i class="fas fa-paper-plane"></i> 詢問';
            if (sessionLoadError) status.textContent = sessionLoadError;
        }

        async function refreshUsage(session) {
            if (!session) return;
            try {
                const [usagePayload, quotaPayload] = await Promise.all([
                    window.agentApi.getSessionUsage(session.id),
                    window.agentApi.getAccountQuota()
                ]);
                session.usage = usagePayload.usage;
                session.quota = quotaPayload.quota;
                renderUsage();
            } catch {
                session.usage = { status: 'unavailable' };
                session.quota = { status: 'unavailable' };
                renderUsage();
            }
        }

        function askForSessionName() {
            return new Promise((resolve) => {
                nameRequestResolver = resolve;
                nameInput.value = '日語助教';
                nameError.textContent = '';
                nameDialog.hidden = false;
                nameInput.focus();
            });
        }

        function resolveSessionName(value) {
            const resolver = nameRequestResolver;
            nameRequestResolver = null;
            nameDialog.hidden = true;
            if (resolver) resolver(value);
        }

        async function ensureSessions() {
            if (sessionsReady) return;
            sessionLoadError = null;
            status.textContent = '正在載入 Copilot 對話...';
            renderSessionState();
            try {
                const payload = await window.agentApi.listAgentSessions();
                payload.sessions.forEach((summary) => sessions.set(summary.id, hydrateSession(summary)));
                if (sessions.size === 0) {
                    const name = await askForSessionName();
                    if (!name) throw new Error('name_cancelled');
                    const created = await window.agentApi.createAgentSession(name);
                    sessions.set(created.session.id, hydrateSession(created.session));
                }
                selectedSessionId = sessions.keys().next().value;
                sessionsReady = true;
                status.textContent = '回答會使用目前單字的有限資料。';
                renderSessionState();
                await refreshUsage(selectedSession());
            } catch (error) {
                sessionsReady = false;
                sessionLoadError = error.message === 'name_cancelled'
                    ? '請命名對話後再開始使用 Copilot。'
                    : 'Copilot 對話尚未準備好，請重試。';
                renderSessionState();
                throw new Error(sessionLoadError);
            }
        }

        async function openPanel() {
            updateCurrentCard();
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            try {
                await ensureSessions();
                updateCurrentCard();
                input.focus();
            } catch (error) {
                status.textContent = error.message || '無法載入 Copilot 對話。';
            }
        }

        function closePanel() {
            if (nameRequestResolver) resolveSessionName(null);
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
        }

        async function executeTurn(session, turn, operation, originalTurns) {
            session.busy = true;
            session.abortController = new AbortController();
            renderSessionState();
            status.textContent = operation === 'edit' ? '正在重新整理修改後的回答...' : 'Copilot 正在整理回答...';
            try {
                const result = operation === 'retry'
                    ? await window.agentApi.retryCopilotTurn(session.id, turn.id, session.abortController.signal)
                    : operation === 'edit'
                        ? await window.agentApi.editCopilotTurn(session.id, turn.id, turn.prompt, turn.context, session.abortController.signal)
                        : await window.agentApi.askCopilot(session.id, turn.prompt, turn.context, session.abortController.signal, turn.id);
                mergeSessionSummary(session, result.session);
                editingTurnId = null;
                status.textContent = '回答會使用目前單字的有限資料。';
            } catch (error) {
                if (operation !== 'send') {
                    session.turns = originalTurns;
                } else {
                    turn.status = 'error';
                    turn.error = error.name === 'AbortError' ? '要求已停止，請再試一次。' : error.message;
                    saveHistory(session);
                }
                status.textContent = error.name === 'AbortError'
                    ? '回答已停止，這個問題仍可重試。'
                    : '無法完成回答，請使用重新回答。';
            } finally {
                session.abortController = null;
                session.busy = false;
                renderSessionState();
                input.focus();
            }
        }

        openButton.addEventListener('click', openPanel);
        closeButton.addEventListener('click', closePanel);
        document.addEventListener('vocab-card-updated', updateCurrentCard);
        nameForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const name = nameInput.value.trim();
            if (!name || name.length > 80) {
                nameError.textContent = '名稱不可為空，且不能超過 80 個字元。';
                nameInput.focus();
                return;
            }
            resolveSessionName(name);
        });
        nameCancelButton.addEventListener('click', function () {
            resolveSessionName(null);
        });
        sessionSelect.addEventListener('change', function () {
            selectedSessionId = sessionSelect.value;
            editingTurnId = null;
            updateCurrentCard();
            renderSessionState();
            refreshUsage(selectedSession());
        });
        newSessionButton.addEventListener('click', async function () {
            const name = await askForSessionName();
            if (!name) return;
            newSessionButton.disabled = true;
            try {
                const created = await window.agentApi.createAgentSession(name);
                sessions.set(created.session.id, hydrateSession(created.session));
                selectedSessionId = created.session.id;
                editingTurnId = null;
                renderSessionState();
                await refreshUsage(selectedSession());
            } catch (error) {
                status.textContent = error.message || '無法建立新的對話。';
            } finally {
                newSessionButton.disabled = false;
            }
        });
        deleteSessionButton.addEventListener('click', async function () {
            const session = selectedSession();
            if (!session) return;
            deleteSessionButton.disabled = true;
            try {
                await window.agentApi.deleteAgentSession(session.id);
                sessions.delete(session.id);
                if (sessions.size === 0) {
                    const name = await askForSessionName();
                    if (!name) throw new Error('請命名新的對話。');
                    const created = await window.agentApi.createAgentSession(name);
                    sessions.set(created.session.id, hydrateSession(created.session));
                }
                selectedSessionId = sessions.keys().next().value;
                editingTurnId = null;
                renderSessionState();
            } catch (error) {
                status.textContent = error.message || '無法刪除這個對話。';
            }
        });
        retrySessionButton.addEventListener('click', async function () {
            sessions.clear();
            selectedSessionId = null;
            sessionsReady = false;
            sessionLoadError = null;
            renderSessionState();
            await ensureSessions().catch(() => {});
        });
        cancelButton.addEventListener('click', async function () {
            const session = selectedSession();
            if (!session?.busy) return;
            cancelButton.disabled = true;
            await window.agentApi.cancelAgentSession(session.id).catch(() => {});
            session.abortController?.abort();
        });
        messages.addEventListener('click', function (event) {
            const action = event.target.closest('[data-agent-action]');
            if (!action) return;
            const session = selectedSession();
            const turn = session?.turns.find((candidate) => candidate.id === action.dataset.turnId);
            if (!session || !turn || session.busy) return;
            if (action.dataset.agentAction === 'edit') {
                editingTurnId = turn.id;
                input.value = turn.prompt;
                status.textContent = '正在編輯問題，送出後會重新整理這個回合。';
                renderSessionState();
                input.focus();
                return;
            }
            const originalTurns = session.turns.slice();
            session.turns = session.turns.slice(0, session.turns.indexOf(turn) + 1);
            turn.status = 'pending';
            turn.response = null;
            turn.error = null;
            executeTurn(session, turn, 'retry', originalTurns);
        });
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) closePanel();
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && overlay.classList.contains('active')) closePanel();
        });

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            const session = selectedSession();
            const message = input.value.trim();
            const context = window.getAgentVocabContext ? window.getAgentVocabContext() : null;
            if (!session) {
                status.textContent = 'Copilot 對話尚未準備好，請重試。';
                return;
            }
            if (!context) {
                status.textContent = '目前沒有可詢問的詞彙卡。';
                return;
            }
            if (!message) {
                status.textContent = '請輸入問題。';
                input.focus();
                return;
            }

            const originalTurns = session.turns.slice();
            if (editingTurnId) {
                const turn = session.turns.find((candidate) => candidate.id === editingTurnId);
                if (!turn) {
                    editingTurnId = null;
                    renderSessionState();
                    return;
                }
                session.turns = session.turns.slice(0, session.turns.indexOf(turn) + 1);
                turn.prompt = message;
                turn.status = 'pending';
                turn.response = null;
                turn.error = null;
                turn.context = turn.context || context;
                input.value = '';
                await executeTurn(session, turn, 'edit', originalTurns);
                return;
            }

            const turn = { id: createTurnId(), prompt: message, context, response: null, status: 'pending', error: null };
            session.turns.push(turn);
            input.value = '';
            await executeTurn(session, turn, 'send', originalTurns);
        });
    });
})();