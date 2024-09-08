document.addEventListener('DOMContentLoaded', function () {
    // Load saved API key
    chrome.storage.sync.get('openaiApiKey', function (data) {
        if (data.openaiApiKey) {
            document.getElementById('apiKey').value = data.openaiApiKey;
        }
    });

    // Save API key
    document.getElementById('save').addEventListener('click', function () {
        var apiKey = document.getElementById('apiKey').value;
        chrome.storage.sync.set({ openaiApiKey: apiKey }, function () {
            var status = document.getElementById('status');
            status.textContent = 'API key saved.';
            setTimeout(function () {
                status.textContent = '';
            }, 2000);
        });
    });
});
