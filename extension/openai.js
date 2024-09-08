class OpenAI {
    constructor() {
        this.apiKey = null;
    }

    async initialize() {
        return new Promise((resolve) => {
            chrome.storage.sync.get('openaiApiKey', (data) => {
                this.apiKey = data.openaiApiKey;
                resolve();
            });
        });
    }

    async createChatCompletion(messages) {
        if (!this.apiKey) {
            throw new Error('API key not set');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}