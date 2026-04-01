/* AI Guide Intelligence Engine - UPDATED */
(function () {

    const knowledgeBase = {
        greeting: [
            "Hello 👋 Welcome to Kirinyaga Research Hub.",
            "Hi there 👋 I’m your Research Guide.",
            "Karibu 👋 Welcome to the Hub."
        ],
        fallback: "I’m still learning 😊 Try asking about problems, locations, latest updates, or how to join.",
        funding: "Funding opportunities will appear in the Funding section as they are added.",
        students: "Student opportunities are available in the Student Corner and will grow over time.",
        join: "You can join by registering using the account icon on the top right.",
        contact: "You can contact support through the Contact page in the footer.",
        website: "This website connects researchers, students, and the community to log real-world problems and find solutions.",
        county: "The platform currently serves Kirinyaga County."
    };

    function getGreeting() {
        return knowledgeBase.greeting[
            Math.floor(Math.random() * knowledgeBase.greeting.length)
        ];
    }

    function initAIGuide() {

        // ===== CREATE UI =====
        const container = document.createElement('div');
        container.id = 'ai-guide-container';
        container.innerHTML = `
        <div id="ai-chat-window">
            <div id="ai-chat-header">
                <div style="display:flex;align-items:center;gap:0.75rem;">
                    <span class="material-symbols-outlined">smart_toy</span>
                    <span style="font-weight:800;">HUB GUIDE AI</span>
                </div>
                <button id="ai-close">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div id="ai-messages">
                <div class="ai-msg bot">${getGreeting()}</div>
                <div class="ai-msg bot">How can I help you today?</div>
            </div>

            <div id="ai-suggestions"></div>

            <div id="ai-input-area">
                <input type="text" id="ai-input" placeholder="Ask something...">
                <button id="ai-send">
                    <span class="material-symbols-outlined">send</span>
                </button>
            </div>
        </div>

        <div id="ai-guide-trigger">
            <div class="ai-pulse"></div>
            <span class="material-symbols-outlined">auto_awesome</span>
        </div>
        `;
        document.body.appendChild(container);

        // ===== ELEMENTS =====
        const trigger = document.getElementById('ai-guide-trigger');
        const chatWindow = document.getElementById('ai-chat-window');
        const closeBtn = document.getElementById('ai-close');
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');
        const messages = document.getElementById('ai-messages');
        const suggestionsBox = document.getElementById('ai-suggestions');

        trigger.onclick = () => {
            chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
        };

        closeBtn.onclick = (e) => {
            e.stopPropagation();
            chatWindow.style.display = 'none';
        };

        function addMessage(text, isUser = false) {
            const msg = document.createElement('div');
            msg.className = `ai-msg ${isUser ? 'user' : 'bot'}`;
            msg.innerText = text;
            messages.appendChild(msg);
            messages.scrollTop = messages.scrollHeight;
        }

        // ===== SUGGESTIONS =====
        const suggestions = [
            "How many problems are there?",
            "Latest problems",
            "Which areas are affected?",
            "How do I join?",
            "What does the website do?",
            "Which county is this?"
        ];

        function renderSuggestions() {
            suggestionsBox.innerHTML = '';
            suggestions.forEach(s => {
                const btn = document.createElement('button');
                btn.className = 'ai-suggestion';
                btn.innerText = s;
                btn.onclick = () => {
                    addMessage(s, true);
                    handleBotResponse(s);
                };
                suggestionsBox.appendChild(btn);
            });
        }
        renderSuggestions();

        // ===== BOT LOGIC =====
        async function handleBotResponse(query) {
            const q = query.toLowerCase();
            const thinking = document.createElement('div');
            thinking.className = 'ai-msg bot';
            thinking.innerHTML = "<i>Thinking...</i>";
            messages.appendChild(thinking);
            messages.scrollTop = messages.scrollHeight;

            let problems = [];
            try {
                const res = await fetch('http://localhost:3000/api/problems'); // Use your backend
                problems = await res.json();
            } catch (err) {
                console.warn("API failed, using fallback");
            }

            thinking.remove();
            if (!Array.isArray(problems)) problems = [];

            const total = problems.length;
            let response = knowledgeBase.fallback;

            if (q.includes('hi') || q.includes('hello')) response = "Hello 👋 How can I assist you today?";
            else if (q.includes('problem') || q.includes('issue')) {
                response = total === 0 ?
                    "No problems have been recorded yet, or the system is still initializing." :
                    `There are currently ${total} problems available on the platform.`;
            }
            else if (q.includes('latest')) {
                response = total === 0 ? "No problems available yet." : "Latest problems:\n" +
                    problems.slice(-3).reverse().map(p => `- ${p.title || "Untitled"}`).join("\n");
            }
            else if (q.includes('how') && q.includes('work')) {
                response = "This platform allows users to submit real-world problems and researchers to explore and solve them. Data updates dynamically as new entries are added.";
            }
            else if (q.includes('fund')) response = knowledgeBase.funding;
            else if (q.includes('student')) response = knowledgeBase.students;
            else if (q.includes('join') || q.includes('register')) response = knowledgeBase.join;
            else if (q.includes('contact')) response = knowledgeBase.contact;
            else if (q.includes('website') || q.includes('do')) response = knowledgeBase.website;
            else if (q.includes('county')) response = knowledgeBase.county;

            addMessage(response);
        }

        // ===== SEND BUTTON =====
        sendBtn.onclick = () => {
            const val = input.value.trim();
            if (!val) return;
            addMessage(val, true);
            input.value = '';
            handleBotResponse(val);
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendBtn.click();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAIGuide);
    } else {
        initAIGuide();
    }

})();