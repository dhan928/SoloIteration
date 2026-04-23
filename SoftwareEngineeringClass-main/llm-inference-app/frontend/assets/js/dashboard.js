// Dashboard: single-model chat and multi-model comparison

let chatHistory = [];
let comparisonHistory = [];
let currentMode = 'single';

async function initializeDashboard() {
    requireAuth();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const navLogoutBtn = document.getElementById('navLogoutBtn');

    if (userNameEl && user.email) {
        userNameEl.textContent = user.email;
    }
    if (userAvatarEl && user.email) {
        userAvatarEl.textContent = user.email.charAt(0).toUpperCase();
    }
    if (navLogoutBtn) {
        navLogoutBtn.addEventListener('click', logoutUser);
    }

    await loadInferenceHistory();
    await loadComparisonHistory();

    setupModeTabs();

    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }

    const compareForm = document.getElementById('compareForm');
    if (compareForm) {
        compareForm.addEventListener('submit', handleCompareSubmit);
    }
}

function setupModeTabs() {
    document.querySelectorAll('.mode-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const mode = tab.getAttribute('data-mode');
            switchMode(mode);
        });
    });
}

function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.mode-tab').forEach((tab) => {
        tab.classList.toggle('active', tab.getAttribute('data-mode') === mode);
    });

    const singleEl = document.getElementById('singleModeContainer');
    const compareEl = document.getElementById('compareModeContainer');
    if (singleEl) singleEl.classList.toggle('hidden', mode !== 'single');
    if (compareEl) compareEl.classList.toggle('hidden', mode !== 'compare');
}

async function loadInferenceHistory() {
    try {
        const response = await apiCall('/inference?limit=10', { method: 'GET' });
        if (response.success) {
            chatHistory = response.data || [];
            displayHistoryList();
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

async function loadComparisonHistory() {
    try {
        const response = await apiCall('/inference/comparisons?limit=10', { method: 'GET' });
        if (response.success) {
            comparisonHistory = response.data || [];
            displayComparisonHistoryList();
        }
    } catch (error) {
        console.error('Failed to load comparison history:', error);
    }
}

function displayHistoryList() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    if (chatHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No chat history yet</p>';
        return;
    }

    historyList.innerHTML = chatHistory
        .map(
            (inference) => `
        <div class="history-item" role="button" tabindex="0" onclick="loadInference('${inference.inferenceId}')">
            <div>
                <p>${escapeHtml(inference.prompt.substring(0, 50))}…</p>
                <span>${formatDate(inference.createdAt)}</span>
            </div>
        </div>
    `
        )
        .join('');
}

function displayComparisonHistoryList() {
    const historyList = document.getElementById('comparisonHistoryList');
    if (!historyList) return;

    if (comparisonHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No comparison history yet</p>';
        return;
    }

    historyList.innerHTML = comparisonHistory
        .map(
            (comparison) => `
        <div class="history-item" role="button" tabindex="0" onclick="loadComparison('${comparison.comparisonId}')">
            <div class="history-item-body">
                <div>
                    <p>${escapeHtml(comparison.prompt.substring(0, 50))}…</p>
                    <span>${formatDate(comparison.createdAt)}</span>
                </div>
                <button type="button" class="btn-delete" onclick="event.stopPropagation(); deleteComparison('${comparison.comparisonId}')">Delete</button>
            </div>
        </div>
    `
        )
        .join('');
}

async function loadInference(inferenceId) {
    try {
        const response = await apiCall(`/inference/${inferenceId}`, { method: 'GET' });
        if (response.success) {
            displayInferenceMessages(response.data);
            switchMode('single');
        }
    } catch (error) {
        showError('chatError', 'Failed to load inference');
    }
}

async function loadComparison(comparisonId) {
    try {
        const response = await apiCall(`/inference/comparisons/${comparisonId}`, { method: 'GET' });
        if (response.success) {
            displayComparisonResults(response.data);
            switchMode('compare');
        }
    } catch (error) {
        showError('compareError', 'Failed to load comparison');
    }
}

async function deleteComparison(comparisonId) {
    if (!confirm('Delete this comparison?')) {
        return;
    }

    try {
        const response = await apiCall(`/inference/comparisons/${comparisonId}`, { method: 'DELETE' });
        if (response.success) {
            await loadComparisonHistory();
            showCompareNotice('Comparison deleted.', 'success');
        }
    } catch (error) {
        showError('compareError', 'Failed to delete comparison');
    }
}

function displayInferenceMessages(inference) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    chatMessages.innerHTML = `
        <div class="message user">
            <div class="message-content">
                ${escapeHtml(inference.prompt)}
                <div class="message-timestamp">${formatDate(inference.createdAt)}</div>
            </div>
        </div>
    `;

    if (inference.response) {
        chatMessages.innerHTML += `
            <div class="message ai">
                <div class="message-content">
                    ${escapeHtml(inference.response)}
                    <div class="message-timestamp">${formatDate(inference.completedAt)}</div>
                </div>
            </div>
        `;
    } else if (inference.status === 'pending' || inference.status === 'processing') {
        chatMessages.innerHTML += `
            <div class="message ai">
                <div class="message-content">
                    <em>Processing your request…</em>
                </div>
            </div>
        `;
    } else if (inference.status === 'error') {
        chatMessages.innerHTML += `
            <div class="message ai">
                <div class="message-content message-error">
                    <em>Error: ${escapeHtml(inference.errorMessage || 'Unknown error')}</em>
                </div>
            </div>
        `;
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayComparisonResults(comparison) {
    const comparisonMessages = document.getElementById('comparisonMessages');
    if (!comparisonMessages) return;

    let html = `
        <div class="comparison-prompt">
            <h4>Prompt</h4>
            <div class="message-content comparison-prompt-text">
                ${escapeHtml(comparison.prompt)}
            </div>
        </div>
        <div class="comparison-results">
    `;

    (comparison.results || []).forEach((result) => {
        const timeLabel =
            typeof result.executionTimeMs === 'number' ? `${result.executionTimeMs} ms` : '—';
        const statusClass = String(result.status || 'pending').replace(/[^a-z-]/gi, '');

        html += `
            <div class="comparison-card" data-model="${escapeHtml(result.model)}">
                <div class="card-header">
                    <h4>${escapeHtml(result.model)}</h4>
                    <span class="status-badge status-${statusClass}">${escapeHtml(result.status)}</span>
                </div>
                <div class="card-body">
        `;

        if (result.status === 'completed' && result.response) {
            html += `
                <div class="response-text">${escapeHtml(result.response)}</div>
                <div class="response-meta"><span>Latency: ${timeLabel === '—' ? '—' : escapeHtml(timeLabel)}</span></div>
            `;
        } else if (result.status === 'failed') {
            html += `
                <div class="error-text">
                    <em>Error: ${escapeHtml(result.errorMessage || 'Unknown error')}</em>
                </div>
                <div class="response-meta"><span>Latency: ${timeLabel === '—' ? '—' : escapeHtml(timeLabel)}</span></div>
            `;
        } else {
            html += `<div class="processing-text"><em>Processing…</em></div>`;
        }

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';
    comparisonMessages.innerHTML = html;
    comparisonMessages.scrollTop = comparisonMessages.scrollHeight;
}

async function handleChatSubmit(event) {
    event.preventDefault();

    const promptInput = document.getElementById('promptInput');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const prompt = promptInput.value.trim();
    const originalText = submitBtn ? submitBtn.textContent : '';

    if (!prompt) {
        showError('chatError', 'Please enter a message');
        return;
    }

    try {
        if (submitBtn) {
            submitBtn.textContent = 'Sending…';
            submitBtn.disabled = true;
        }

        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages && chatMessages.querySelector('.welcome-message')) {
            chatMessages.innerHTML = '';
        }

        const userMessageEl = document.createElement('div');
        userMessageEl.className = 'message user';
        userMessageEl.innerHTML = `
            <div class="message-content">
                ${escapeHtml(prompt)}
                <div class="message-timestamp">${formatDate(new Date())}</div>
            </div>
        `;
        chatMessages.appendChild(userMessageEl);

        const response = await apiCall('/inference/submit', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });

        if (response.success) {
            const aiMessageEl = document.createElement('div');
            aiMessageEl.className = 'message ai';
            aiMessageEl.innerHTML = `
                <div class="message-content">
                    <em>Processing your request…</em>
                </div>
            `;
            chatMessages.appendChild(aiMessageEl);

            promptInput.value = '';
            pollForInferenceResult(response.data.inferenceId, aiMessageEl);
            setTimeout(loadInferenceHistory, 1000);
        }
    } catch (error) {
        if (error.data && error.data.message) {
            showError('chatError', error.data.message);
        } else {
            showError('chatError', 'Failed to send message');
        }
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

function getSelectedCompareModels() {
    return Array.from(
        document.querySelectorAll('#compareModeContainer input[name="compareModel"]:checked')
    ).map((input) => input.value);
}

async function handleCompareSubmit(event) {
    event.preventDefault();

    const promptInput = document.getElementById('comparePromptInput');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const prompt = promptInput.value.trim();
    const selectedModels = getSelectedCompareModels();
    const originalText = submitBtn ? submitBtn.textContent : '';

    hideError('modelError');
    hideError('compareError');
    hideCompareNotice();

    if (!prompt) {
        showError('compareError', 'Please enter a prompt');
        return;
    }

    if (selectedModels.length < 2) {
        showError('modelError', 'Please select at least 2 models');
        return;
    }

    const comparisonMessages = document.getElementById('comparisonMessages');
    if (!comparisonMessages) {
        return;
    }

    try {
        if (submitBtn) {
            submitBtn.textContent = 'Comparing…';
            submitBtn.disabled = true;
        }

        if (comparisonMessages.querySelector('.welcome-message')) {
            comparisonMessages.innerHTML = '';
        }

        comparisonMessages.innerHTML = `
            <div class="comparison-prompt">
                <h4>Prompt</h4>
                <div class="message-content comparison-prompt-text">${escapeHtml(prompt)}</div>
            </div>
            <div class="comparison-results">
                ${selectedModels
                    .map(
                        (model) => `
                    <div class="comparison-card" data-model="${escapeHtml(model)}">
                        <div class="card-header">
                            <h4>${escapeHtml(model)}</h4>
                            <span class="status-badge status-pending">pending</span>
                        </div>
                        <div class="card-body">
                            <div class="processing-text"><em>Processing…</em></div>
                        </div>
                    </div>
                `
                    )
                    .join('')}
            </div>
        `;

        const response = await apiCall('/inference/compare', {
            method: 'POST',
            body: JSON.stringify({ prompt, models: selectedModels })
        });

        if (response.success) {
            displayComparisonResults(response.data);
            promptInput.value = '';
            setTimeout(loadComparisonHistory, 500);
            showCompareNotice('Comparison saved to history.', 'success');
        }
    } catch (error) {
        const msg =
            error.data && (error.data.message || (error.data.errors && error.data.errors[0] && error.data.errors[0].msg))
                ? error.data.message || error.data.errors[0].msg
                : 'Failed to submit comparison';
        showError('compareError', msg);
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

async function pollForInferenceResult(inferenceId, messageElement, attempts = 0) {
    const maxAttempts = 30;
    const pollInterval = 10000;

    if (attempts >= maxAttempts) {
        messageElement.innerHTML = `
            <div class="message-content message-warn">
                <em>Request is taking longer than expected. Check chat history.</em>
            </div>
        `;
        return;
    }

    try {
        const response = await apiCall(`/inference/${inferenceId}`, { method: 'GET' });

        if (response.success) {
            const inference = response.data;

            if (inference.status === 'completed' && inference.response) {
                messageElement.innerHTML = `
                    <div class="message-content">
                        ${escapeHtml(inference.response)}
                        <div class="message-timestamp">${formatDate(inference.completedAt)}</div>
                    </div>
                `;
            } else if (inference.status === 'error') {
                messageElement.innerHTML = `
                    <div class="message-content message-error">
                        <em>Error: ${escapeHtml(inference.errorMessage || 'Unknown error')}</em>
                    </div>
                `;
            } else {
                setTimeout(() => pollForInferenceResult(inferenceId, messageElement, attempts + 1), pollInterval);
            }
        }
    } catch (error) {
        console.error('Poll error:', error);
    }
}

function showCompareNotice(message, variant) {
    const el = document.getElementById('compareNotice');
    if (!el) return;
    el.textContent = message;
    el.className = `notice-banner notice-${variant}`;
    el.classList.remove('hidden');
}

function hideCompareNotice() {
    const el = document.getElementById('compareNotice');
    if (!el) return;
    el.textContent = '';
    el.className = 'notice-banner hidden';
}

function formatDate(dateInput) {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

window.loadInference = loadInference;
window.loadComparison = loadComparison;
window.deleteComparison = deleteComparison;

document.addEventListener('DOMContentLoaded', initializeDashboard);
