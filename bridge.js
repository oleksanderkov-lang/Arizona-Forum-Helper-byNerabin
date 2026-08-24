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
    blurEnabled: true,
    particlesEnabled: true,
    pShape: "circle",
    pLines: true,
    pCount: 70,
    pSpeed: 0.5,
    pColor: "#3498db",
    pSize: 3
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