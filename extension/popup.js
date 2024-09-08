class OpenAI {
    constructor() {
        this.apiKey = null;
    }

    // Initialize the OpenAI client
    async initialize() {
        return new Promise((resolve) => {
            chrome.storage.sync.get('openaiApiKey', (data) => {
                this.apiKey = data.openaiApiKey;
                resolve();
            });
        });
    }

    // Create a chat completion
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



function getApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('openaiApiKey', function (data) {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(data.openaiApiKey);
        });
    });
}

document.addEventListener('DOMContentLoaded', async function () {
    const toggleButton = document.getElementById('toggleCleaner');
    let cleaningMode = false;

    const client = new OpenAI();

    client.initialize().then(() => {
        console.log('OpenAI client initialized');
    }).catch(error => {
        console.error('Error initializing OpenAI client:', error);
    });

    toggleButton.addEventListener('click', function () {
        cleaningMode = !cleaningMode;
        toggleButton.textContent = cleaningMode ? 'Stop Cleaning' : 'Start Cleaning';

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleCleaner', mode: cleaningMode });
        });

        // Example usage
        getApiKey().then(apiKey => {
            if (apiKey) {
                console.log('API key retrieved:', apiKey);
                // Use the API key to make requests to OpenAI
            } else {
                console.log('API key not set');
                // Prompt the user to set their API key
            }

            /*
            client.createChatCompletion([{ role: 'user', content: 'Hello, world!' }]).then(response => {
                console.log('Chat completion response:', response);
            }).catch(error => {
                console.error('Error creating chat completion:', error);
            });
            */

        }).catch(error => {
            console.error('Error retrieving API key:', error);
        });
    });

    document.getElementById('options').addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
    });
});


function getCurrentTabContent() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }

            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { action: "getContent" }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });
    });
}