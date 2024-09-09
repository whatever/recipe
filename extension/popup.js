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
                'Content-Type': 'application/json',
                'max_tokens': '3000',
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages,
                response_format: { type: "json_object" }
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

    toggleButton.addEventListener('click', async function () {
        const content = await getCurrentTabContent();
        const result = await callOpenAI(content);
        document.getElementById("cleanedText").textContent = result;
        replaceTextOnCurrentTab(result);
    });

    document.getElementById('options').addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
    });
});

async function callOpenAI(content) {
    const client = new OpenAI();
    await client.initialize();
    const prompt = [
        "**Instructions:**",
        "Extract the exact Recipe Ingredients from this web page content.",
        "",
        "**Context:**",
        content.text.substring(0, 3000),
        "",
        "**Check for Clarity:**",
        "- Ensure that ingredients contain a quantity",
        "",
        "**Output:**",
        "Return the JSON response with the following structure:",
        `- "ingredients": A list of ingredients needed to prepare the recipe.`,
        `- "instructions": An ordered list of instructions to prepare the recipe step by step. Each instruction should contain the following fields:`,
        `    - "step": The step number`,
        `    - "instruction": The instruction to prepare the recipe step by step`,
        `    - "citation": the literal string from the web page content that contains the instruction`,
    ].join("\n");
    try {
        const messages = [
            { role: "system", content: "You are a helpful assistant that analyzes web page content and extracts the exact Recipe Ingredients from this web page content." },
            { role: "user", content: prompt },
        ];
        return await client.createChatCompletion(messages);
    } catch (error) {
        console.error('Error calling OpenAI:', error);
    }
}

// Get the current tab content
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

// Function to replace text on the current tab
function replaceTextOnCurrentTab(newText) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }

            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { action: "replaceText", text: newText }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });
    });
}