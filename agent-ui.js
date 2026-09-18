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
        const cancelEditButton = document.getElementById('agentCancelEditBtn');
        const sessionSelect = document.getElementById('agentSessionSelect');
        const profileSelect = document.getElementById('agentProfileSelect');
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
        const authBar = document.getElementById('agentAuthBar');
        const authStatus = document.getElementById('agentAuthStatus');
        const loginButton = document.getElementById('agentLoginBtn');
        const logoutButton = document.getElementById('agentLogoutBtn');
        const sessions = new Map();
        let selectedSessionId = null;
        let sessionsReady = false;
        let sessionLoadError = null;
        let editingTurnId = null;
        let nameRequestResolver = null;
        let authState = null;
        let profiles = new Map();
        let selectedPurpose = 'Tutor';
        let pendingRequestContext = null;
        let pendingFormTarget = null;

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
                    suggestion: turn.suggestion || null,
                    formTarget: turn.formTarget || null,
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
                ? summary.turns.map((turn) => ({
                    ...turn,
                    context: turn.context || currentTurns.get(turn.id)?.context || null,
                    formTarget: currentTurns.get(turn.id)?.formTarget || null,
                }))
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
                if (turn.suggestion) group.appendChild(renderSuggestion(turn));
            } else if (turn.error || turn.status === 'pending') {
                const error = document.createElement('div');
                error.className = 'agent-message agent-message-error';
                error.textContent = turn.error || '這個問題尚未完成，請重新回答。';
                group.appendChild(error);
            }
            return group;
        }

        function getSuggestionTargetValues(turn) {
            const values = { hiragana: '', kanji: '', definition: '', example: '', translation: '' };
            const ids = turn.formTarget === 'edit'
                ? { hiragana: 'editHiragana', kanji: 'editKanji', definition: 'editDefinition', example: 'editExample', translation: 'editTranslation' }
                : turn.formTarget
                    ? { hiragana: 'hiraganaInput', kanji: 'kanjiInput', definition: 'definitionInput', example: 'exampleInput', translation: 'translationInput' }
                    : null;
            if (ids) {
                Object.entries(ids).forEach(([field, id]) => {
                    const element = document.getElementById(id);
                    if (element) values[field] = element.value.trim();
                });
                return values;
            }
            const current = window.getCurrentVocabItem ? window.getCurrentVocabItem() : null;
            if (!current) return values;
            return {
                hiragana: current.hiragana || '',
                kanji: current.kanji || '',
                definition: current.definition || '',
                example: current.example || '',
                translation: current.translation || ''
            };
        }

        function getSuggestionFields(turn, exampleIndex = 0) {
            const suggestion = turn.suggestion || {};
            const current = getSuggestionTargetValues(turn);
            const suggested = {};
            if (suggestion.type === 'card') {
                Object.assign(suggested, {
                    hiragana: suggestion.hiragana,
                    kanji: suggestion.kanji,
                    definition: suggestion.definition,
                    example: suggestion.example,
                    translation: suggestion.translation
                });
            } else if (suggestion.type === 'explanation') {
                Object.assign(suggested, {
                    definition: suggestion.definition,
                    usageNotes: suggestion.usageNotes,
                    register: suggestion.register,
                    nuance: suggestion.nuance,
                    commonMistakes: suggestion.commonMistakes
                });
            } else if (suggestion.type === 'examples') {
                const example = suggestion.examples?.[exampleIndex];
                suggested.example = example?.japanese;
                suggested.translation = example?.translation;
            }
            const labels = {
                hiragana: '讀音',
                kanji: '漢字',
                definition: '解釋',
                example: '例句',
                translation: '翻譯',
                usageNotes: '使用說明',
                register: '語域',
                nuance: '語感',
                commonMistakes: '常見誤用'
            };
            return Object.keys(suggested).map((field) => ({
                field,
                label: labels[field],
                current: current[field] || (suggestion.type === 'explanation' && field !== 'definition' ? '不會直接寫入卡片' : ''),
                suggested: suggested[field] || ''
            }));
        }

        function renderSuggestionDiff(turn, exampleIndex = 0) {
            const diff = document.createElement('div');
            diff.className = 'agent-suggestion-diff';
            getSuggestionFields(turn, exampleIndex).forEach((field) => {
                const row = document.createElement('div');
                row.className = 'agent-diff-row';
                if (field.current !== field.suggested) row.classList.add('agent-diff-changed');

                const label = document.createElement('strong');
                label.className = 'agent-diff-label';
                label.textContent = field.label;
                row.appendChild(label);

                const current = document.createElement('span');
                current.className = 'agent-diff-current';
                current.textContent = `目前：${field.current || '未提供'}`;
                row.appendChild(current);

                const suggested = document.createElement('span');
                suggested.className = 'agent-diff-suggested';
                suggested.textContent = `AI 建議：${field.suggested || '未提供'}`;
                row.appendChild(suggested);
                diff.appendChild(row);
            });
            return diff;
        }

        function renderSuggestion(turn) {
            const suggestion = document.createElement('div');
            suggestion.className = 'agent-suggestion';
            const heading = document.createElement('strong');
            heading.textContent = 'AI 建議預覽（目前 / AI 建議）';
            suggestion.appendChild(heading);
            let diff = renderSuggestionDiff(turn);
            suggestion.appendChild(diff);
            if (turn.suggestion.type === 'examples') {
                const list = document.createElement('ol');
                (turn.suggestion.examples || []).forEach((example) => {
                    const item = document.createElement('li');
                    item.textContent = `${example.japanese}｜${example.translation}`;
                    list.appendChild(item);
                });
                suggestion.appendChild(list);
                const choice = document.createElement('select');
                choice.className = 'agent-example-choice';
                choice.setAttribute('aria-label', '選擇要套用的例句');
                (turn.suggestion.examples || []).forEach((example, index) => {
                    const option = document.createElement('option');
                    option.value = String(index);
                    option.textContent = `套用例句 ${index + 1}：${example.japanese}`;
                    choice.appendChild(option);
                });
                choice.addEventListener('change', () => {
                    diff.replaceWith(renderSuggestionDiff(turn, Number(choice.value || 0)));
                    diff = suggestion.querySelector('.agent-suggestion-diff');
                });
                suggestion.appendChild(choice);
            }
            const applyButton = document.createElement('button');
            applyButton.type = 'button';
            applyButton.className = 'btn-secondary agent-apply-suggestion';
            applyButton.dataset.agentApplyTurnId = turn.id;
            applyButton.textContent = turn.formTarget ? '套用到表單' : '套用到目前自訂詞彙';
            suggestion.appendChild(applyButton);
            return suggestion;
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
                option.textContent = `${session.name || session.purpose || '未命名對話'} · ${session.profile?.label || session.purpose || '日語助教'} (${session.requestCount || 0})`;
                sessionSelect.appendChild(option);
            });
            sessionSelect.value = selectedSessionId || '';
        }

        function renderProfileOptions() {
            profileSelect.replaceChildren();
            profiles.forEach((profile) => {
                const option = document.createElement('option');
                option.value = profile.id;
                option.textContent = profile.label;
                option.title = profile.description;
                profileSelect.appendChild(option);
            });
            profileSelect.value = selectedPurpose;
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
            profileSelect.disabled = !sessionsReady || Boolean(sessionLoadError) || Boolean(session?.busy);
            input.disabled = !canSend;
            sendButton.disabled = !canSend;
            newSessionButton.disabled = !sessionsReady || Boolean(sessionLoadError) || busy;
            cancelButton.disabled = !busy;
            deleteSessionButton.disabled = !session || busy || Boolean(sessionLoadError);
            retrySessionButton.hidden = !sessionLoadError;
            retrySessionButton.disabled = !sessionLoadError || busy;
            cancelEditButton.hidden = !editingTurnId;
            cancelEditButton.disabled = !editingTurnId || busy;
            sendButton.innerHTML = busy
                ? '<i class="fas fa-spinner fa-spin"></i> 回答中'
                : editingTurnId
                    ? '<i class="fas fa-save"></i> 送出修改'
                    : '<i class="fas fa-paper-plane"></i> 詢問';
            if (sessionLoadError) status.textContent = sessionLoadError;
        }

        function clearEditingPrompt(message = '已取消修改，對話內容沒有變更。', focusInput = true) {
            editingTurnId = null;
            input.value = '';
            status.textContent = message;
            renderSessionState();
            if (focusInput) input.focus();
        }

        function renderAuthState() {
            if (!authBar) return;
            const hosted = Boolean(authState?.authRequired);
            authBar.hidden = !hosted;
            loginButton.hidden = !hosted || Boolean(authState?.authenticated);
            logoutButton.hidden = !hosted || !authState?.authenticated;
            authStatus.textContent = !hosted
                ? ''
                : authState?.authenticated
                    ? `已登入 GitHub：${authState.user?.login || ''}`
                    : '需要使用 GitHub 登入';
            loginButton.href = window.agentApi.getLoginUrl();
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
                authState = await window.agentApi.getAuthState();
                renderAuthState();
                if (authState.authRequired && !authState.authenticated) {
                    const error = new Error('請先使用 GitHub 登入。');
                    error.code = 'authentication_required';
                    throw error;
                }
                const payload = await window.agentApi.listAgentSessions();
                profiles = new Map((payload.profiles || []).map((profile) => [profile.id, profile]));
                if (!profiles.has(selectedPurpose)) selectedPurpose = profiles.keys().next().value || 'Tutor';
                renderProfileOptions();
                payload.sessions.forEach((summary) => sessions.set(summary.id, hydrateSession(summary)));
                if (sessions.size === 0) {
                    const name = await askForSessionName();
                    if (!name) throw new Error('name_cancelled');
                    const created = await window.agentApi.createAgentSession(name, selectedPurpose);
                    sessions.set(created.session.id, hydrateSession(created.session));
                }
                selectedSessionId = sessions.keys().next().value;
                selectedPurpose = selectedSession()?.purpose || selectedPurpose;
                renderProfileOptions();
                sessionsReady = true;
                status.textContent = '回答會使用目前單字的有限資料。';
                renderSessionState();
                await refreshUsage(selectedSession());
            } catch (error) {
                sessionsReady = false;
                sessionLoadError = error.code === 'authentication_required'
                    ? '請先使用 GitHub 登入後，再使用 Copilot。'
                    : error.message === 'name_cancelled'
                    ? '請命名對話後再開始使用 Copilot。'
                    : 'Copilot 對話尚未準備好，請重試。';
                renderSessionState();
                throw new Error(sessionLoadError);
            }
        }

        async function ensureProfileSession(purpose) {
            const existing = [...sessions.values()].find((session) => session.purpose === purpose);
            if (existing) {
                selectedSessionId = existing.id;
                renderSessionState();
                await refreshUsage(existing);
                return existing;
            }
            const profile = profiles.get(purpose);
            const name = `${profile?.label || purpose} ${new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}`;
            const created = await window.agentApi.createAgentSession(name, purpose);
            const session = hydrateSession(created.session);
            sessions.set(session.id, session);
            selectedSessionId = session.id;
            renderSessionState();
            await refreshUsage(session);
            return session;
        }

        async function launchAgentTask(button) {
            const purpose = button.dataset.agentTask || 'Tutor';
            const formTarget = button.dataset.agentForm || null;
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            const context = window.getAgentDraftContext ? window.getAgentDraftContext(formTarget) : null;
            if (!context) {
                status.textContent = '請先在表單輸入至少一個單字或讀音。';
                return;
            }
            selectedPurpose = purpose;
            pendingRequestContext = context;
            pendingFormTarget = formTarget;
            try {
                await ensureSessions();
                await ensureProfileSession(purpose);
                profileSelect.value = purpose;
                input.value = purpose === 'Card Generator'
                    ? '請根據這份草稿補齊單字卡資料。'
                    : purpose === 'Explanation Editor'
                        ? '請把這份單字卡的解釋改寫得更詳細。'
                        : '請為這個單字產生三個自然例句。';
                status.textContent = 'AI 建議完成後，請檢查內容再套用。';
                input.focus();
            } catch (error) {
                status.textContent = error.message || '無法載入指定的 Copilot 助手。';
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

        document.querySelectorAll('[data-agent-task]').forEach((button) => {
            button.addEventListener('click', () => launchAgentTask(button));
        });

        function closePanel() {
            if (nameRequestResolver) resolveSessionName(null);
            if (editingTurnId) clearEditingPrompt('回答會使用目前單字的有限資料。', false);
            pendingRequestContext = null;
            pendingFormTarget = null;
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
        logoutButton.addEventListener('click', async function () {
            logoutButton.disabled = true;
            try {
                await window.agentApi.logoutAgent();
                window.location.reload();
            } catch (error) {
                status.textContent = error.message || '無法登出。';
                logoutButton.disabled = false;
            }
        });
        sessionSelect.addEventListener('change', function () {
            selectedSessionId = sessionSelect.value;
            editingTurnId = null;
            input.value = '';
            updateCurrentCard();
            renderSessionState();
            refreshUsage(selectedSession());
        });
        newSessionButton.addEventListener('click', async function () {
            const name = await askForSessionName();
            if (!name) return;
            newSessionButton.disabled = true;
            try {
                const created = await window.agentApi.createAgentSession(name, selectedPurpose);
                sessions.set(created.session.id, hydrateSession(created.session));
                selectedSessionId = created.session.id;
                editingTurnId = null;
                input.value = '';
                renderSessionState();
                await refreshUsage(selectedSession());
            } catch (error) {
                status.textContent = error.message || '無法建立新的對話。';
            } finally {
                newSessionButton.disabled = false;
            }
        });
        profileSelect.addEventListener('change', function () {
            selectedPurpose = profileSelect.value || 'Tutor';
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
                    const created = await window.agentApi.createAgentSession(name, selectedPurpose);
                    sessions.set(created.session.id, hydrateSession(created.session));
                }
                selectedSessionId = sessions.keys().next().value;
                editingTurnId = null;
                input.value = '';
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
        cancelEditButton.addEventListener('click', function () {
            if (!editingTurnId || selectedSession()?.busy) return;
            clearEditingPrompt();
        });
        messages.addEventListener('click', function (event) {
            const applyButton = event.target.closest('[data-agent-apply-turn-id]');
            if (applyButton) {
                applySuggestion(applyButton.dataset.agentApplyTurnId, applyButton);
                return;
            }
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

        function applySuggestion(turnId, applyButton) {
            const session = selectedSession();
            const turn = session?.turns.find((candidate) => candidate.id === turnId);
            const suggestion = turn?.suggestion;
            const exampleChoice = applyButton?.parentElement?.querySelector('.agent-example-choice');
            const exampleIndex = Number(exampleChoice?.value || 0);
            if (turn?.formTarget) {
                applySuggestionToForm(suggestion, turn.formTarget, exampleIndex);
                return;
            }
            const current = window.getCurrentVocabItem ? window.getCurrentVocabItem() : null;
            if (!suggestion || !current || current.id < 1000 || typeof window.updateCustomVocab !== 'function') {
                status.textContent = '目前只可以套用到自訂詞彙，請先建立或選擇自訂詞彙。';
                return;
            }
            const next = { ...current };
            if (suggestion.type === 'card') Object.assign(next, suggestion);
            if (suggestion.type === 'explanation') next.definition = suggestion.definition;
            if (suggestion.type === 'examples' && suggestion.examples[exampleIndex]) {
                next.example = suggestion.examples[exampleIndex].japanese;
                next.translation = suggestion.examples[exampleIndex].translation;
            }
            const result = window.updateCustomVocab(current.id, next);
            if (!result?.success) {
                status.textContent = result?.message || '無法套用 AI 建議。';
                return;
            }
            window.updateVocabList?.();
            document.dispatchEvent(new CustomEvent('vocab-card-updated'));
            status.textContent = 'AI 建議已套用到目前詞彙。';
        }

        function applySuggestionToForm(suggestion, formTarget, exampleIndex = 0) {
            if (!suggestion) return;
            const ids = formTarget === 'edit'
                ? { hiragana: 'editHiragana', kanji: 'editKanji', definition: 'editDefinition', example: 'editExample', translation: 'editTranslation' }
                : { hiragana: 'hiraganaInput', kanji: 'kanjiInput', definition: 'definitionInput', example: 'exampleInput', translation: 'translationInput' };
            const setValue = (field, value) => {
                if (value && document.getElementById(ids[field])) document.getElementById(ids[field]).value = value;
            };
            if (suggestion.type === 'card') {
                setValue('hiragana', suggestion.hiragana);
                setValue('kanji', suggestion.kanji);
                setValue('definition', suggestion.definition);
                setValue('example', suggestion.example);
                setValue('translation', suggestion.translation);
            } else if (suggestion.type === 'explanation') {
                setValue('definition', suggestion.definition);
            } else if (suggestion.type === 'examples' && suggestion.examples[exampleIndex]) {
                setValue('example', suggestion.examples[exampleIndex].japanese);
                setValue('translation', suggestion.examples[exampleIndex].translation);
            }
            status.textContent = 'AI 建議已套用到表單，請檢查後保存。';
        }
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) closePanel();
        });
        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape' || !overlay.classList.contains('active')) return;
            event.preventDefault();
            event.stopPropagation();
            if (editingTurnId && !selectedSession()?.busy) {
                clearEditingPrompt();
                return;
            }
            closePanel();
        }, true);

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            const session = selectedSession();
            const message = input.value.trim();
            const context = pendingRequestContext || (window.getAgentVocabContext ? window.getAgentVocabContext() : null);
            const formTarget = pendingFormTarget;
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

            const turn = { id: createTurnId(), prompt: message, context, response: null, suggestion: null, formTarget, status: 'pending', error: null };
            session.turns.push(turn);
            pendingRequestContext = null;
            pendingFormTarget = null;
            input.value = '';
            await executeTurn(session, turn, 'send', originalTurns);
        });
    });
})();