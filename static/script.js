const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const suggestionsArea = document.getElementById('suggestions-area');

let conversationHistory = [];

// ==========================================
// 1. Pro Suggested Topics Definition
// ==========================================
// Professional, interactive prompts. Clicking auto-populates input.
const suggestedTopics = [
    { title: "Voter Registration", prompt: "Walk me through the basic steps to register to vote." },
    { title: "Understand Timelines", prompt: "What is an election timeline? Explain the phases." },
    { title: "Electoral College", prompt: "Explain the electoral college and why it exists." },
    { title: "Local Deadlines", prompt: "How do I find specific election deadlines for my local state?" },
    { title: "Mail-in Ballots", prompt: "I need to understand how mail-in or absentee ballots work." }
];

// ==========================================
// 2. Chat UI & Functionality Logic
// ==========================================
function appendMessage(sender, text, isHtml = false, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message', 'message-card-enter');
    if(isError) msgDiv.classList.add('backend-error');
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    if (isHtml) {
        // Pro MD parsing for bold text
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        contentDiv.innerHTML = formattedText;
    } else {
        contentDiv.textContent = text;
    }
    
    msgDiv.appendChild(contentDiv);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const loader = document.createElement('div');
    loader.id = 'typing-loader';
    loader.classList.add('message', 'ai-message', 'message-card-enter');
    loader.innerHTML = `
        <div class="message-content typing-indicator elevated-1">
            <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>`;
    chatBox.appendChild(loader);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
    const loader = document.getElementById('typing-loader');
    if (loader) loader.remove();
}

async function sendMessage(providedMessage = null) {
    // If a suggestion was clicked, use that. Otherwise, get input value.
    const message = providedMessage ? providedMessage : userInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    if (!providedMessage) userInput.value = ''; // Clean input bar only if manually typed
    
    // Smooth intro transition for typing indicator
    showTyping();

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, history: conversationHistory })
        });

        const data = await response.json();
        removeTyping();

        if (data.error) {
            appendMessage('ai', data.error, false, true); // Pro, backend formatted error
            console.error(data.error);
            return;
        }

        // Add proper human delay (approximate reading speed) to make AI feel more human
        setTimeout(() => {
            appendMessage('ai', data.response, true);
        
            // Update history array for dynamic, context-aware AI
            conversationHistory.push({ role: "user", parts: message });
            conversationHistory.push({ role: "model", parts: data.response });
        }, 300); // 300ms delay to make entry animation feel purposeful

    } catch (error) {
        removeTyping();
        appendMessage('ai', 'My apologies, a temporary connection error occurred with Google Services.', false, true);
    }
}

// ==========================================
// 3. Pro Material Chips Logic (NEW)
// ==========================================
function populateSuggestedTopics() {
    suggestedTopics.forEach(topic => {
        const chip = document.createElement('div');
        chip.classList.add('suggestion-chip', 'elevated-1');
        chip.textContent = topic.title;
        
        // INTERACTIVE LOGIC: Clicking chip auto-populates input AND sends question.
        chip.addEventListener('click', () => {
            userInput.value = topic.prompt; // Show the detailed prompt in input bar
            setTimeout(() => sendMessage(topic.prompt), 200); // Auto-send after a clean delay
        });
        
        suggestionsArea.appendChild(chip);
    });
}

// ==========================================
// 4. Initializer Logic
// ==========================================
// Populate suggested chips immediately on load
populateSuggestedTopics();

sendBtn.addEventListener('click', () => sendMessage());
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});