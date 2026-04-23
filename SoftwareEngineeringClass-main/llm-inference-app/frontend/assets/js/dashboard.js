// ===========================
// Dashboard Functions
// ===========================

let chatHistory = [];
let comparisonHistory = [];
let currentMode = 'single';

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
    requireAuth();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const navLogoutBtn = document.getElementById('navLogoutBtn');

    // Display user info
    if (userNameEl && user.email) {
        userNameEl.textContent = user.email;
    }

    if (userAvatarEl && user.email) {
        userAvatarEl.textContent = user.email.charAt(0).toUpperCase();
    }

    // Logout buttons
    if (navLogoutBtn) {
        navLogoutBtn.addEventListener('click', logoutUser);
    }

    // Load histories
    await loadInferenceHistory();
    await loadComparisonHistory();

    // Setup mode tabs
    setupModeTabs();

    // Handle form submissions
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }

    const compareForm = document.getElementById('compareForm');
    if (compareForm) {
        compareForm.addEventListener('submit', handleCompareSubmit);
    }
}

/**
 * Setup mode tab switching
 */
function setupModeTabs() {
    const tabs = document.querySelectorAll('.mode-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.getAttribute('data-mode');
            switchMode(mode);
        });
    });
}

/**
 * Switch between single and comparison modes
 */
function switchMode(mode) {
    currentMode = mode;
    
    // Update tab active state
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Update container visibility
    document.getElementById('singleModeContainer').classList.toggle('hidden', mode !== 'single');
    document.getElementById('compareModeContainer').classList.toggle('hidden', mode !== 'compare');
}

/**
 * Load inference history from API
 */
async function loadInferenceHistory() {
    try {
        const response = await apiCall('/inference?limit=10', {
            method: 'GET'
        });

        if (response.success) {
            chatHistory = response.data || [];
            displayHistoryList();
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

/**
 * Load comparison history from API
 */
async function loadComparisonHistory() {
    try {
        const response = await apiCall('/inference/comparisons?limit=10', {
            method: 'GET'
        });

        if (response.success) {
            comparisonHistory = response.data || [];
            displayComparisonHistoryList();
        }
    } catch (error) {
        console.error('Failed to load comparison history:', error);
    }
}

/**
 * Display history list in sidebar
 */
function displayHistoryList() {
    const historyList = document.getElementById('historyList');
    
    if (!historyList) return;

    if (chatHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No chat history yet</p>';
        return;
    }

    historyList.innerHTML = chatHistory.map((inference, index) => `
        <div class="history-item" onclick="loadInference('${inference.inferenceId}')">
            <div>
                <p>${inference.prompt.substring(0, 50)}...</p>
                <span>${formatDate(inference.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

/**
 * Display comparison history list in sidebar
 */
function displayComparisonHistoryList() {
    const historyList = document.getElementById('comparisonHistoryList');
    
    if (!historyList) return;

    if (comparisonHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No comparison history yet</p>';
        return;
    }

    historyList.innerHTML = comparisonHistory.map((comparison, index) => `
        <div class="history-item" onclick="loadComparison('${comparison.comparisonId}')">
            <div>
                <p>${comparison.prompt.substring(0, 50)}...</p>
                <span>${formatDate(comparison.createdAt)}</span>
                <button class="btn-delete" onclick="event.stopPropagation(); deleteComparison('${comparison.comparisonId}')">Delete</button>
            </div>
        </div>
    `).join('');
}

/**
 * Load specific inference from history
 */
async function loadInference(inferenceId) {
    try {
        const response = await apiCall(`/inference/${inferenceId}`, {
            method: 'GET'
        });

        if (response.success) {
            displayInferenceMessages(response.data);
            switchMode('single');
        }
    } catch (error) {
        showError('chatError', 'Failed to load inference');
    }
}

/**
 * Load specific comparison from history
 */
async function loadComparison(comparisonId) {
    try {
        const response = await apiCall(`/inference/comparisons/${comparisonId}`, {
            method: 'GET'
        });

        if (response.success) {
            displayComparisonResults(response.data);
            switchMode('compare');
        }
    } catch (error) {
        showError('compareError', 'Failed to load comparison');
    }
}

/**
 * Delete a comparison
 */
async function deleteComparison(comparisonId) {
    if (!confirm('Delete this comparison?')) {
        return;
    }

    try {
        const response = await apiCall(`/inference/comparisons/${comparisonId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            await loadComparisonHistory();
            showError('compareError', 'Comparison deleted');
        }
    } catch (error) {
        showError('compareError', 'Failed to delete comparison');
    }
}

/**
 * Display inference messages in chat
 */
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
                    <em>Processing your request...</em>
                </div>
            </div>
        `;
    } else if (inference.status === 'error') {
        chatMessages.innerHTML += `
            <div class="message ai">
                <div class="message-content" style="color: #ef4444;">
                    <em>Error: ${escapeHtml(inference.errorMessage || 'Unknown error')}</em>
                </div>
            </div>
        `;
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Display comparison results
 */
function displayComparisonResults(comparison) {
    const comparisonMessages = document.getElementById('comparisonMessages');
    
    if (!comparisonMessages) return;

    // Show prompt
    let html = `
        <div class="comparison-prompt">
            <h4>Prompt</h4>
            <div class="message-content">
                ${escapeHtml(comparison.prompt)}
            </div>
        </div>
    `;

    // Show results in cards
    html += '<div class="comparison-results">';
    
    (comparison.results || []).forEach(result => {
        html += `
            <div class="comparison-card" data-model="${result.model}">
                <div class="card-header">
                    <h4>${result.model}</h4>
                    <span class="status-badge status-${result.status}">${result.status}</span>
                </div>
                <div class="card-body">
        `;
        
        if (result.status === 'completed' && result.response) {
            html += `
                <div class="response-text">
                    ${escapeHtml(result.response)}
                </div>
                <div class="response-meta">
                    <span>Time: ${result.executionTimeMs}ms</span>
                </div>
            `;
        } else if (result.status === 'failed') {
            html += `
                <div class="error-text">
                    <em>Error: ${escapeHtml(result.errorMessage || 'Unknown error')}</em>
                </div>
            `;
        } else {
            html += `
                <div class="processing-text">
                    <em>Processing...</em>
                </div>
            `;
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

/**
 * Handle chat form submission
 */
async function handleChatSubmit(event) {
    event.preventDefault();

    const promptInput = document.getElementById('promptInput');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const prompt = promptInput.value.trim();

    if (!prompt) {
        showError('chatError', 'Please enter a message');
        return;
    }

    try {
        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Display user message
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

        // Submit to inference endpoint
        const response = await apiCall('/inference/submit', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });

        if (response.success) {
            // Display AI processing message
            const aiMessageEl = document.createElement('div');
            aiMessageEl.className = 'message ai';
            aiMessageEl.innerHTML = `
                <div class="message-content">
                    <em>Processing your request...</em>
                </div>
            `;
            chatMessages.appendChild(aiMessageEl);

            // Clear input
            promptInput.value = '';

            // Poll for result
            pollForInferenceResult(response.data.inferenceId, aiMessageEl);

            // Reload history
            setTimeout(loadInferenceHistory, 1000);
        }

        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    } catch (error) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        if (error.data && error.data.message) {
            showError('chatError', error.data.message);
        } else {
            showError('chatError', 'Failed to send message');
        }
    }
}

/**
 * Handle comparison form submission
 */
async function handleCompareSubmit(event) {
    event.preventDefault();

    const promptInput = document.getElementById('comparePromptInput');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const prompt = promptInput.value.trim();

    // Get selected models
    const selectedModels = Array.from(
        document.querySelectorAll('input[name="model"]:checked')
    ).map(input => input.value);

    if (!prompt) {
        showError('compareError', 'Please enter a prompt');
        return;
    }

    if (selectedModels.length < 2) {
        showError('modelError', 'Please select at least 2 models');
        return;
    }

    try {
        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Comparing...';
        submitBtn.disabled = true;
        clearError('modelError');
        clearError('compareError');

        // Display prompt
        const comparisonMessages = document.getElementById('comparisonMessages');
        if (comparisonMessages && comparisonMessages.querySelector('.welcome-message')) {
            comparisonMessages.innerHTML = '';
        }

        comparisonMessages.innerHTML = `
            <div class="comparison-prompt">
                <h4>Prompt</h4>
                <div class="message-content">
                    ${escapeHtml(prompt)}
                </div>
            </div>
            <div class="comparison-results">
                ${selectedModels.map(model => `
                    <div class="comparison-card" data-model="${model}">
                        <div class="card-header">
                            <h4>${model}</h4>
                            <span class="status-badge status-pending">pending</span>
                        </div>
                        <div class="card-body">
                            <div class="processing-text"><em>Processing...</em></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Submit comparison
        const response = await apiCall('/inference/compare', {
            method: 'POST',
            body: JSON.stringify({
                prompt,
                models: selectedModels
            })
        });

        if (response.success) {
            displayComparisonResults(response.data);
            promptInput.value = '';
            
            // Poll for updates
            pollForComparisonResults(response.data.comparisonId);
            
            // Reload history
            setTimeout(loadComparisonHistory, 1000);
        }

        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    } catch (error) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        if (error.data && error.data.message) {
            showError('compareError', error.data.message);
        } else {
            showError('compareError', 'Failed to submit comparison');
        }
    }
}

/**
 * Poll for inference result
 */
async function pollForInferenceResult(inferenceId, messageElement, attempts = 0) {
    const maxAttempts = 30; // 5 minutes with 10 second intervals
    const pollInterval = 10000; // 10 seconds

    if (attempts >= maxAttempts) {
        messageElement.innerHTML = `
            <div class="message-content" style="color: #f59e0b;">
                <em>Request is taking longer than expected. Please check your chat history.</em>
            </div>
        `;
        return;
    }

    try {
        const response = await apiCall(`/inference/${inferenceId}`, {
            method: 'GET'
        });

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
                    <div class="message-content" style="color: #ef4444;">
                        <em>Error: ${escapeHtml(inference.errorMessage || 'Unknown error')}</em>
                    </div>
                `;
            } else {
                // Still processing, poll again
                setTimeout(() => {
                    pollForInferenceResult(inferenceId, messageElement, attempts + 1);
                }, pollInterval);
            }
        }
    } catch (error) {
        console.error('Poll error:', error);
    }
}

/**
 * Poll for comparison results
 */
async function pollForComparisonResults(comparisonId, attempts = 0) {
    const maxAttempts = 30; // 5 minutes with 10 second intervals
    const pollInterval = 10000; // 10 seconds

    if (attempts >= maxAttempts) {
        return;
    }

    try {
        const response = await apiCall(`/inference/comparisons/${comparisonId}`, {
            method: 'GET'
        });

        if (response.success) {
            const comparison = response.data;
            
            // Check if all models are done
            const allDone = comparison.results.every(r => 
                r.status === 'completed' || r.status === 'failed'
            );

            displayComparisonResults(comparison);

            if (!allDone) {
                // Still processing, poll again
                setTimeout(() => {
                    pollForComparisonResults(comparisonId, attempts + 1);
                }, pollInterval);
            }
        }
    } catch (error) {
        console.error('Comparison poll error:', error);
    }
}

/**
 * Show error message
 */
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

/**
 * Clear error message
 */
function clearError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================
// Initialize
// ===========================

document.addEventListener('DOMContentLoaded', initializeDashboard);
        console.error('Polling error:', error);
        setTimeout(() => {
            pollForInferenceResult(inferenceId, messageElement, attempts + 1);
        }, pollInterval);
    }
}

// ===========================
// Utility Functions
// ===========================

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
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

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================
// Initialize
// ===========================

document.addEventListener('DOMContentLoaded', initializeDashboard);
