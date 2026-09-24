// --- БАЗА ПРАВИЛ И СИНХРОНИЗАЦИЯ С ОБЛАКОМ ---

const CLOUD_RULES_URL = 'https://raw.githubusercontent.com/oleksanderkov-lang/ArizonaRules/main/rules.js';
const CACHE_LIFETIME = 24 * 60 * 60 * 1000; // 24 часа
const punRegex = /(бан\s*оружия|ганбан|бан\s*вождени|бан\s*кар|бан\s*авто|лишен[а-яё]*\s*прав|изъяти[а-яё]*\s*прав|запрет[а-яё]*\s*использовани[а-яё]*\s*транспорт[а-яё]*|бан\s*мп|бан|мут|заглушк|тср|jail|варн|предупрежден)/;

async function syncRulesDatabase() {
    if (RULES_DB.length > 0) return; // Уже загружено

    const now = Date.now();
    let rawRules = null;
    let lastUpdate = 0;

    try {
        const cachedRules = localStorage.getItem('ah_cloudRules');
        const cachedTime = localStorage.getItem('ah_rulesLastUpdate');
        if (cachedRules && cachedTime) {
            rawRules = JSON.parse(cachedRules);
            lastUpdate = parseInt(cachedTime, 10);
        }
    } catch (e) {}

    // Если кэша нет или прошло 24 часа — качаем свежее
    if (!rawRules || (now - lastUpdate > CACHE_LIFETIME)) {
        try {
            const response = await fetch(CLOUD_RULES_URL + '?nocache=' + now);
            if (response.ok) {
                let jsText = await response.text();
                
                let jsonStr = jsText.replace(/window\.ARIZONA_RULES\s*=\s*/, '').replace(/;\s*$/, '').trim();
                rawRules = JSON.parse(jsonStr);
                
                localStorage.setItem('ah_cloudRules', JSON.stringify(rawRules));
                localStorage.setItem('ah_rulesLastUpdate', now.toString());
                console.log("Arizona Helper: Правила успешно скачаны с GitHub!");
            } else {
                console.error("Arizona Helper: GitHub вернул ошибку " + response.status);
            }
        } catch (e) {
            console.error("Arizona Helper: Ошибка сети при скачивании правил.", e);
        }
    }

    if (rawRules) {
        rawRules.forEach(function(category) {
            category.content.forEach(function(line) {
                let text = line.replace(/\{[A-Fa-f0-9a-zA-Z]+\}/g, '').trim();
                if (text.length < 10 || text.startsWith("Спойлер:")) return;
                
                let type = "jailoff"; let time = ""; let reason = "Нарушение правил"; 
                let lw = text.toLowerCase();
                let match = lw.match(punRegex);

                if (category.name && category.name.toLowerCase().includes("форум")) type = "banfa";
                else if (match) {
                    let kw = match[1];
                    let suffix = lw.substring(match.index + kw.length);
                    let mTime = suffix.match(/^\s*(?:на\s*)?(\d+)/) || suffix.match(/^[^\d]{0,15}?(\d+)/); 

                    if (kw.includes('оружи') || kw.includes('ганбан')) { type = "gunbanoff"; if (mTime) time = mTime[1]; }
                    else if (kw.includes('вождени') || kw.includes('кар') || kw.includes('авто') || kw.includes('прав') || kw.includes('транспорт')) { type = "driverbanoff"; if (mTime) time = mTime[1]; }
                    else if (kw.includes('мп')) type = "jailoff"; 
                    else if (kw === 'бан') { type = "banoff"; if (mTime) time = mTime[1]; }
                    else if (kw.includes('мут') || kw.includes('заглушк')) { type = "muteoff"; if (mTime) time = mTime[1]; }
                    else if (kw.includes('тср') || kw.includes('jail')) { type = "jailoff"; if (mTime) time = mTime[1]; }
                    else if (kw.includes('варн') || kw.includes('предупрежден')) type = "warnoff";
                }

                let rMatch = text.match(/^(\d+\.\d+(?:\.\d+)?)\.?\s*(.*?)(?:\[|\:|\.|\s-\s|\s—\s)/);
                if (rMatch && rMatch[2]) reason = rMatch[2].trim().substring(0, 45);
                else {
                    let altMatch = text.match(/^(.*?)(?:\[|\:|\.|\s-\s|\s—\s)/);
                    if (altMatch && altMatch[1]) reason = altMatch[1].trim().substring(0, 45);
                }

                if (reason.length < 3) reason = "Нарушение правил";
                RULES_DB.push({ text: text, type: type, time: time, reason: reason });
            });
        });
        console.log("Arizona Helper: База правил загружена! Пунктов: " + RULES_DB.length);
    }
}