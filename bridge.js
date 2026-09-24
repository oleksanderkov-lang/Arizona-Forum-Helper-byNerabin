const defaultSettings = {
    gender: "Male",
    nickname: "Nick Name",
    organization: "LSPD",
    signature: "byNerabin",
    discordWebhook: "",
    themeColor: "#3498db",
    themeTextColor: "#ffffff",
    tagTextColor: "#ffffff",
    pColor: "#3498db",
    blurEnabled: false,
    oldStyleEnabled: false,
    blurIntensity: 15,
    particlesEnabled: true,
    customBgEnabled: true,
    pFading: true,
    pShape: "circle",
    pEmojiText: "🌸,✨,🔥",
    pLines: true,
    pCount: 70,
    pSpeed: 0.5,
    pSize: 3,
    transparency: 15,
    threadCols: 2,
    hotkeyF1: "inReview",
    hotkeyF2: "transferred",
    hotkeyF3: "wrongFormat",
    hotkeyF4: "verdict",
    hotkeyF5: "refuse",
    customTemplates: [],
    punishmentHistory: []
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