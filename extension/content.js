let cleaningMode = false;

function toggleCleaningMode(mode) {
    cleaningMode = mode;
    document.body.style.cursor = mode ? 'crosshair' : 'default';
}

function removeElement(e) {
    if (cleaningMode) {
        e.preventDefault();
        e.stopPropagation();
        e.target.remove();
    }
}

document.addEventListener('click', removeElement, true);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleCleaner') {
        toggleCleaningMode(request.mode);
    }
});

function getApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('openaiApiKey', function(data) {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(data.openaiApiKey);
        });
    });
}

// This function will be injected into the page
function getPageContent() {
    return {
        title: document.title,
        url: window.location.href,
        text: document.body.innerText
    };
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === "getContent") {
        // Use a Promise to handle async operations
        Promise.resolve().then(() => {
            return {
                title: document.title,
                url: window.location.href,
                text: document.body.innerText
            };
        }).then(response => {
            sendResponse(response);
        }).catch(error => {
            console.error('Error in content script:', error);
            sendResponse({error: error.message});
        });
        return true; // Keep the message channel open for asynchronous response
    }
});

console.log('Content script loaded'); // For debugging
