// --- УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function autoDetectConfig() {
    if (CONFIG.nickname) {
        CONFIG.NonRPnickname = CONFIG.nickname.trim().replace(/\s+/g, '_');
    } else {
        CONFIG.NonRPnickname = "Player_Name";
    }
    
    const bCrumbs = document.querySelector('.p-breadcrumbs');
    if (bCrumbs) {
        const serverMatch = bCrumbs.innerText.match(/Сервер №\d+\s*\[(.*?)\]/i);
        if (serverMatch) CONFIG.server = serverMatch[1].trim();
    }
    if (!CONFIG.server) CONFIG.server = "Tucson";
    
    CONFIG.rang = "";
    CONFIG.rangGenitive = "";
}

function getUTC3Time() {
    return new Date(Date.now() + (new Date().getTimezoneOffset() * 60000) + 10800000).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
}

function getMonday() {
    let d = new Date(); let day = d.getDay() || 7;
    if (day !== 1) d.setHours(-24 * (day - 1));
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getLawsuitNumber() {
    const titleEl = document.querySelector('.p-title-value');
    if (!titleEl) return "ХХХХХХ";
    const match = titleEl.textContent.match(/№\s*(\d+)/i);
    return match ? match[1] : "ХХХХХХ";
}

function extractTargetNickname() {
    let name = "";
    const bbWrapper = document.querySelector('.message-body .bbWrapper');
    if (bbWrapper) {
        const text = bbWrapper.innerText;
        const m = text.match(/(?:Игровой\s+ник\s+нарушителя|Ник\s+нарушителя|Жалоба\s+на\s+игрока)[-:\s]*(?:[a-zA-Z0-9]+[\s]*[xX-]\s*)?((?:\[\d+\]\s*)?[A-Za-z0-9]+[_\s][A-Za-z0-9]+)/i);
        if (m && m[1]) {
            name = m[1].trim();
        } else {
            const nicks = text.match(/((?:\[\d+\]\s*)?[A-Z][a-zA-Z0-9]*[_\s][A-Z][a-zA-Z0-9]*|(?:\[\d+\]\s*)?[a-zA-Z0-9]+_[a-zA-Z0-9]+)/g);
            if (nicks) {
                const validNicks = nicks.map(n => n.trim());
                if (validNicks.length >= 2) name = validNicks[1];
                else if (validNicks.length === 1) name = validNicks[0];
            }
        }
    }
    if (!name || name.length < 3) {
        const titleEl = document.querySelector('.p-title-value');
        if (titleEl) {
            const clone = titleEl.cloneNode(true);
            clone.querySelectorAll('.label, .label-append').forEach(el => el.remove());
            let t = clone.textContent.trim();
            t = t.replace(/^(?:[a-zA-Z0-9]+[\s]*[xX]\s*|[a-zA-Z]+\s*\|\s*|[a-zA-Z]+\s*-\s*)/i, '');
            let m = t.match(/(?:на игрока[:\s]+|жалоба на[:\s]+|на[:\s]+)((?:\[\d+\]\s*)?[A-Za-z0-9]+[_\s][A-Za-z0-9]+)/i);
            if (m && m[1]) name = m[1].trim();
            else { 
                let m2 = t.split(/[\/|,-]|\s+x\s+|\s+х\s+/i)[0].trim().match(/((?:\[\d+\]\s*)?[A-Za-z0-9]+[_\s][A-Za-z0-9]+)/); 
                if (m2 && m2[1]) name = m2[1].trim(); 
            }
        }
    }
    return name ? name.replace(/\s+/g, '_').replace(/^\[(\d+)\]_/, '[$1]') : "Player_Name";
}

function extractAuthorNickname() {
    let name = "";
    const bbWrapper = document.querySelector('.message-body .bbWrapper');
    if (bbWrapper) {
        const text = bbWrapper.innerText;
        const m = text.match(/(?:Ваш\s+игровой\s+ник|Игровой\s+ник)[-:\s]*((?:\[\d+\]\s*)?[A-Za-z0-9]+[_\s][A-Za-z0-9]+)/i);
        if (m && m[1]) {
            name = m[1].trim();
        } else {
            const nicks = text.match(/((?:\[\d+\]\s*)?[A-Z][a-zA-Z0-9]*[_\s][A-Z][a-zA-Z0-9]*|(?:\[\d+\]\s*)?[a-zA-Z0-9]+_[a-zA-Z0-9]+)/g);
            if (nicks) {
                const validNicks = nicks.map(n => n.trim());
                if (validNicks.length > 0) name = validNicks[0];
            }
        }
    }
    if (!name || name.length < 3) {
        const a = document.querySelector('.message-name');
        if (a) name = a.textContent.trim();
    }
    return name ? name.replace(/\s+/g, '_').replace(/^\[(\d+)\]_/, '[$1]') : "Author_Name";
}

async function sendToDiscordLog(commandStr) {
    if (!CONFIG.discordWebhook || !CONFIG.discordWebhook.startsWith("http")) return;
    try { 
        await fetch(CONFIG.discordWebhook, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ content: "```\n" + commandStr + "\n```" }) 
        }); 
    } catch (e) {}
}