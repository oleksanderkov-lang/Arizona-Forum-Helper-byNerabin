const defaultSettings = {
    server: "Tucson",
    gender: "Male",
    nickname: "Nick Name",
    NonRPnickname: "Nick_Name",
    organization: "LSPD",
    rang: "Судья",
    rangGenitive: "Судьи",
    signature: "byNerabin",
    discordWebhook: "",
    themeColor: "#3498db",
    themeTextColor: "#ffffff",
    blurEnabled: true,
    particlesEnabled: true,
    bgGlowEnabled: true,
    pShape: "circle",
    pEmojiText: "🌸,✨,🔥",
    pLines: true,
    pCount: 70,
    pSpeed: 0.5,
    pColor: "#3498db",
    pSize: 3,
    hotkeyF1: "inReview",
    hotkeyF2: "transferred",
    hotkeyF3: "wrongFormat",
    hotkeyF4: "verdict",
    hotkeyF5: "refuse",
    customTemplates: []
};

chrome.storage.local.get(defaultSettings, function(items) {
    const script = document.createElement('script');
    script.id = 'arizona-ext-config';
    script.type = 'application/json';
    script.textContent = JSON.stringify(items);
    (document.head || document.documentElement).appendChild(script);
});

window.addEventListener('AH_SAVE_CONFIG', function(e) {
    chrome.storage.local.set(e.detail);
});