(function () {
    'use strict';

    let CONFIG = {
        server: "Tucson", gender: "Male", nickname: "Nick Name", NonRPnickname: "Nick_Name", organization: "LSPD",
        rang: "Судья", rangGenitive: "Судьи", signature: "byNerabin", discordWebhook: "", themeColor: "#3498db", blurEnabled: true,
        particlesEnabled: true, pShape: "circle", pLines: true, pCount: 70, pSpeed: 0.5, pColor: "#3498db", pSize: 3
    };

    let isStarted = false;
    let particleAnimationId = null;
    const RULES_DB = [];

    if (window.ARIZONA_RULES) {
        window.ARIZONA_RULES.forEach(function(category) {
            category.content.forEach(function(line) {
                let text = line.replace(/\{[A-Fa-f0-9a-zA-Z]+\}/g, '').trim();
                if (text.length < 10 || text.startsWith("Спойлер:")) return;

                let type = "jailoff";
                let time = "";
                let reason = "Нарушение правил";
                let lw = text.toLowerCase();

                if (lw.includes("мут")) {
                    type = "muteoff";
                    let m = lw.match(/мут\s*(?:на\s*)?(\d+)/);
                    if (m) time = m[1];
                } else if (lw.includes("бан") && !lw.includes("бан мп")) {
                    type = "banoff";
                    let m = lw.match(/бан\s*(?:на\s*)?(\d+)/);
                    if (m) time = m[1];
                } else if (lw.includes("варн")) {
                    type = "warnoff";
                } else if (lw.includes("тср")) {
                    type = "jailoff";
                    let m = lw.match(/тср\s*(\d+)\s*level/);
                    if (m) time = m[1];
                }

                let rMatch = text.match(/^(\d+\.\d+(?:\.\d+)?)\.?\s*(.*?)(?:\.|-)/);
                if (rMatch) reason = rMatch[2].trim().substring(0, 50);

                RULES_DB.push({ text: text, type: type, time: time, reason: reason });
            });
        });
    }

    function runWhenReady(check, init, delay = 50) {
        if (check()) {
            init();
        } else {
            setTimeout(function() { runWhenReady(check, init, delay); }, delay);
        }
    }

    function getUTC3Time() {
        return new Date(Date.now() + (new Date().getTimezoneOffset() * 60000) + 10800000).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    }

    function getMonday() {
        let d = new Date();
        let day = d.getDay() || 7;
        if (day !== 1) d.setHours(-24 * (day - 1));
        return d.toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric'});
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
            const m = text.match(/Игровой ник нарушителя:\s*(?:[a-zA-Z0-9]+[\s]*[xX-]\s*)?([A-Za-z0-9_ ]+)/i);
            if (m && m[1]) name = m[1].trim();
        }
        
        if (!name || name.length < 3) {
            const titleEl = document.querySelector('.p-title-value');
            if (titleEl) {
                const clone = titleEl.cloneNode(true);
                clone.querySelectorAll('.label, .label-append').forEach(function(el) { el.remove(); });
                let t = clone.textContent.trim();
                
                t = t.replace(/\[.*?\]/g, '').trim();
                t = t.replace(/^(?:[a-zA-Z0-9]+[\s]*[xX]\s*|[a-zA-Z]+\s*\|\s*|[a-zA-Z]+\s*-\s*)/i, '');
                
                let m = t.match(/(?:на игрока[:\s]+|жалоба на[:\s]+|на[:\s]+)([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/i);
                if (m && m[1]) {
                    name = m[1].trim();
                } else {
                    let firstPart = t.split(/[\/|,-]/)[0].trim();
                    let m2 = firstPart.match(/([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/);
                    if (m2 && m2[1]) name = m2[1].trim();
                }
            }
        }
        
        if (name && name.length >= 3) {
            return name.replace(/\s+/g, '_');
        }
        return "Player_Name";
    }

    function insertHtmlIntoEditor(html) {
        const editor = document.querySelector('.fr-element');
        if (!editor) return false;
        editor.focus();
        document.execCommand('insertHTML', false, html);
        return true;
    }

    async function sendToDiscordLog(commandStr) {
        if (!CONFIG.discordWebhook || !CONFIG.discordWebhook.startsWith("http")) return;
        try {
            await fetch(CONFIG.discordWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: `\`${commandStr}\`` })
            });
        } catch (e) {}
    }

    function renderMainMenu(MENU) {
        return Object.keys(MENU).map(function(k) {
            return `<input type="button" class="button custom-forum-btn category_button" value="${MENU[k].title}" data-category="${k}">`;
        }).join('');
    }

    function renderSubCategories(MENU, cKey) {
        const c = MENU[cKey];
        let html = `<div style="width:100%; text-align:center; margin-bottom:15px; color:#fff; font-size:16px; font-weight:bold; flex-basis:100%;">${c.title}</div>`;
        html += Object.keys(c.subcategories).map(function(sk) {
            return `<input type="button" class="button custom-forum-btn subcategory_button" value="${c.subcategories[sk].title}" data-category="${cKey}" data-subcategory="${sk}">`;
        }).join('');
        html += `<div style="width:100%; text-align:center; margin-top:15px; flex-basis:100%;"><input type="button" class="button custom-forum-btn back_to_main" value="🔙 Назад"></div>`;
        return html;
    }

    function renderTemplates(MENU, cKey, sKey) {
        const cat = sKey ? MENU[cKey].subcategories[sKey] : MENU[cKey];
        if (!cat || !cat.templates) return '';
        const title = sKey ? `${MENU[cKey].title} ➔ ${cat.title}` : cat.title;
        let html = `<div style="width:100%; text-align:center; margin-bottom:15px; color:#fff; font-size:16px; font-weight:bold; flex-basis:100%;">${title}</div>`;
        html += cat.templates.map(function(tpl, i) {
            const style = tpl.color ? `background:${tpl.color}!important;border-color:${tpl.color}!important;color:#fff!important;` : '';
            return `<input type="button" class="button custom-forum-btn quick_button js-overlayClose" value="${tpl.title}" data-tkey="${cKey}" data-skey="${sKey||''}" data-idx="${i}" style="${style}">`;
        }).join('');
        const backClass = sKey ? 'back_to_subcategory' : 'back_to_main';
        const backData = sKey ? `data-category="${cKey}"` : '';
        html += `<div style="width:100%; text-align:center; margin-top:15px; flex-basis:100%;"><input type="button" class="button custom-forum-btn ${backClass}" ${backData} value="🔙 Назад"></div>`;
        return html;
    }

    function closeModal(overlay) {
        overlay.classList.add('ah-closing');
        setTimeout(function() {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        }, 250);
    }

    function showVisualConfigurator() {
        const overlay = document.createElement('div');
        overlay.className = 'ah-modal-overlay';
        overlay.innerHTML = `
            <div class="ah-modal-box" style="width:360px;">
                <style>
                    .vc-label { display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; font-size:13px; font-weight:bold; }
                    .vc-input-range { width: 100%; accent-color: var(--ah-accent); }
                </style>
                <h3 style="margin:0 0 20px 0;color:var(--ah-accent);text-align:center;text-transform:uppercase;">Настройки фона</h3>
                
                <label class="vc-label">
                    Включить частицы 
                    <input type="checkbox" id="vc-enable" ${CONFIG.particlesEnabled ? 'checked' : ''} style="width:18px;height:18px;">
                </label>
                
                <label class="vc-label">
                    Форма 
                    <select id="vc-shape" style="background:#0a0a0f;color:#fff;border:1px solid #333;border-radius:6px;padding:6px;width:120px;outline:none;">
                        <option value="circle" ${CONFIG.pShape === 'circle' ? 'selected' : ''}>Круги</option>
                        <option value="square" ${CONFIG.pShape === 'square' ? 'selected' : ''}>Квадраты</option>
                    </select>
                </label>
                
                <label class="vc-label">
                    Линии соединений 
                    <input type="checkbox" id="vc-lines" ${CONFIG.pLines ? 'checked' : ''} style="width:18px;height:18px;">
                </label>
                
                <label class="vc-label">
                    Цвет частиц
                    <input type="color" id="vc-color" value="${CONFIG.pColor}" style="background:none;border:none;width:30px;height:30px;cursor:pointer;">
                </label>

                <div style="margin-bottom:15px;font-size:13px;font-weight:bold;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">Размер (Жирность) <span id="vc-size-val" style="color:var(--ah-accent);">${CONFIG.pSize || 3}</span></div>
                    <input type="range" id="vc-size" min="1" max="10" step="0.5" value="${CONFIG.pSize || 3}" class="vc-input-range">
                </div>

                <div style="margin-bottom:15px;font-size:13px;font-weight:bold;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">Количество <span id="vc-count-val" style="color:var(--ah-accent);">${CONFIG.pCount}</span></div>
                    <input type="range" id="vc-count" min="10" max="250" value="${CONFIG.pCount}" class="vc-input-range">
                </div>
                
                <div style="margin-bottom:24px;font-size:13px;font-weight:bold;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">Скорость <span id="vc-speed-val" style="color:var(--ah-accent);">${CONFIG.pSpeed}</span></div>
                    <input type="range" id="vc-speed" min="0.1" max="3" step="0.1" value="${CONFIG.pSpeed}" class="vc-input-range">
                </div>

                <div style="display:flex;gap:10px;">
                    <button id="vc-cancel" style="flex:1;padding:12px;background:#333;border:none;border-radius:8px;color:#fff;cursor:pointer;">Отмена</button>
                    <button id="vc-save" style="flex:1;padding:12px;background:var(--ah-accent);border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:bold;">Применить</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#vc-size').addEventListener('input', function(e) { overlay.querySelector('#vc-size-val').textContent = e.target.value; });
        overlay.querySelector('#vc-count').addEventListener('input', function(e) { overlay.querySelector('#vc-count-val').textContent = e.target.value; });
        overlay.querySelector('#vc-speed').addEventListener('input', function(e) { overlay.querySelector('#vc-speed-val').textContent = e.target.value; });

        overlay.querySelector('#vc-cancel').addEventListener('click', function() { closeModal(overlay); });
        
        overlay.querySelector('#vc-save').addEventListener('click', function() {
            CONFIG.particlesEnabled = overlay.querySelector('#vc-enable').checked;
            CONFIG.pShape = overlay.querySelector('#vc-shape').value;
            CONFIG.pLines = overlay.querySelector('#vc-lines').checked;
            CONFIG.pColor = overlay.querySelector('#vc-color').value;
            CONFIG.pSize = parseFloat(overlay.querySelector('#vc-size').value);
            CONFIG.pCount = parseInt(overlay.querySelector('#vc-count').value);
            CONFIG.pSpeed = parseFloat(overlay.querySelector('#vc-speed').value);

            window.dispatchEvent(new CustomEvent('AH_SAVE_CONFIG', {
                detail: {
                    particlesEnabled: CONFIG.particlesEnabled,
                    pShape: CONFIG.pShape,
                    pLines: CONFIG.pLines,
                    pColor: CONFIG.pColor,
                    pSize: CONFIG.pSize,
                    pCount: CONFIG.pCount,
                    pSpeed: CONFIG.pSpeed
                }
            }));

            initParticlesBackground(true);
            closeModal(overlay);
        });
    }

    function showVerdictPrompt(callback) {
        const threadMatch = window.location.href.match(/threads\/(?:.*?\.)?(\d+)/i);
        const threadId = threadMatch ? threadMatch[1] : "000000";
        
        const adminNameEl = document.querySelector('.p-navgroup-link--user .p-navgroup-linkText') || document.querySelector('.p-navgroup-linkText');
        let adminName = adminNameEl ? adminNameEl.textContent.trim() : CONFIG.nickname;
        let nameParts = adminName.split(adminName.includes('_') ? '_' : ' ');
        const adminTag = nameParts.length > 1 ? `// ${nameParts[0][0]}.${nameParts[1]}` : `// ${adminName}`;

        const extractedName = extractTargetNickname();

        const overlay = document.createElement('div');
        overlay.className = 'ah-modal-overlay';
        overlay.innerHTML = `
            <div class="ah-modal-box" style="width: 420px;">
                <style>
                    .v-group { margin-bottom: 16px !important; text-align: left !important; position: relative !important; display: block !important; }
                    .v-label { display: block !important; font-size: 11px !important; color: #aaa !important; font-weight: bold !important; margin: 0 0 6px 0 !important; text-transform: uppercase !important; }
                    .v-input { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 12px !important; background: #0a0a0f !important; border: 1px solid #333 !important; color: #fff !important; border-radius: 8px !important; outline: none !important; transition: border-color 0.3s, box-shadow 0.3s !important; font-size: 13px !important; font-family: inherit !important; margin: 0 !important; height: auto !important; }
                    .v-input:focus { border-color: var(--ah-accent) !important; box-shadow: 0 0 10px var(--ah-glow) !important; }
                    .v-scroll::-webkit-scrollbar { width: 4px; }
                    .v-scroll::-webkit-scrollbar-thumb { background: var(--ah-accent); border-radius: 2px; }
                    .v-btn { flex: 1 !important; padding: 14px !important; border-radius: 8px !important; border: none !important; cursor: pointer !important; font-weight: bold !important; transition: filter 0.2s, background 0.2s !important; font-size: 14px !important; color: #fff !important; text-transform: none !important; }
                    .v-btn-cancel { background: #333 !important; }
                    .v-btn-cancel:hover { background: #444 !important; }
                    .v-btn-submit { background: var(--ah-accent) !important; }
                    .v-btn-submit:hover { filter: brightness(1.15) !important; }
                </style>
                <h3 style="margin: 0 0 24px 0; color: var(--ah-accent); text-align: center; text-transform: uppercase; font-weight: 800;">Выдача наказания</h3>
                
                <div class="v-group">
                    <label class="v-label">Пункт правил (Поиск)</label>
                    <input type="text" id="v-rule-search" class="v-input" placeholder="Введите дм, офф, дб..." autocomplete="off">
                    <div id="v-rule-dropdown" class="v-scroll" style="display:none; position:absolute; top:100%; left:0; right:0; background: #19191e; border: 1px solid #333; border-radius: 8px; max-height: 180px; overflow-y: auto; z-index: 10; margin-top: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);"></div>
                </div>

                <div class="v-group">
                    <label class="v-label">Игрок (Авто-парсинг)</label>
                    <input type="text" id="v-player" class="v-input" value="${extractedName}">
                </div>

                <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                    <div class="v-group" style="flex: 1; margin-bottom: 0 !important;">
                        <label class="v-label">Наказание</label>
                        <select id="v-type" class="v-input">
                            <option value="jailoff">ТСР</option>
                            <option value="muteoff">Мут</option>
                            <option value="banoff">Бан</option>
                            <option value="warnoff">Варн</option>
                            <option value="driverbanoff">Бан вожд.</option>
                        </select>
                    </div>
                    <div class="v-group" style="flex: 1; margin-bottom: 0 !important;">
                        <label class="v-label">Срок/Уровень</label>
                        <input type="text" id="v-time" class="v-input" placeholder="Пример: 30">
                    </div>
                </div>

                <div class="v-group">
                    <label class="v-label">Причина (Для формы)</label>
                    <input type="text" id="v-reason" class="v-input" placeholder="Например: ДМ">
                </div>

                <div id="v-log-group" class="v-group" style="display: none;">
                    <label class="v-label" style="color: #e74c3c;">Строка из логов (Офф/Смерть)</label>
                    <input type="text" id="v-log" class="v-input" style="border-color: rgba(231, 76, 60, 0.4);" placeholder="Вставьте лог выхода...">
                </div>

                <div style="display: flex; gap: 12px; margin-top: 28px;">
                    <button id="v-cancel" class="v-btn v-btn-cancel">Отмена</button>
                    <button id="v-submit" class="v-btn v-btn-submit">Выдать</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        let selectedRuleText = "";
        const searchInput = overlay.querySelector('#v-rule-search');
        const dropdown = overlay.querySelector('#v-rule-dropdown');

        searchInput.addEventListener('input', function(e) {
            const words = e.target.value.toLowerCase().split(' ').filter(function(w) { return w; });
            dropdown.innerHTML = '';
            
            if (!words.length) {
                dropdown.style.display = 'none';
                selectedRuleText = "";
                overlay.querySelector('#v-log-group').style.display = 'none';
                return;
            }
            
            const matches = RULES_DB.filter(function(r) {
                const textLw = r.text.toLowerCase();
                const reasonLw = r.reason.toLowerCase();
                return words.every(function(w) { return textLw.includes(w) || reasonLw.includes(w); });
            }).slice(0, 15);

            if (matches.length > 0) {
                matches.forEach(function(rule) {
                    const div = document.createElement('div');
                    div.style.padding = '12px 14px';
                    div.style.cursor = 'pointer';
                    div.style.borderBottom = '1px solid #333';
                    div.style.fontSize = '12px';
                    div.style.lineHeight = '1.4';
                    div.textContent = rule.text;
                    
                    div.addEventListener('mouseenter', function() { div.style.background = '#25252b'; });
                    div.addEventListener('mouseleave', function() { div.style.background = 'transparent'; });
                    
                    div.addEventListener('click', function() {
                        searchInput.value = rule.text;
                        selectedRuleText = rule.text;
                        overlay.querySelector('#v-reason').value = rule.reason;
                        if (rule.type) overlay.querySelector('#v-type').value = rule.type;
                        if (rule.time !== undefined) overlay.querySelector('#v-time').value = rule.time;
                        
                        dropdown.style.display = 'none';
                        const isOff = rule.text.toLowerCase().includes('офф от') || rule.text.toLowerCase().includes('выход из игры');
                        overlay.querySelector('#v-log-group').style.display = isOff ? 'block' : 'none';
                    });
                    
                    dropdown.appendChild(div);
                });
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        });

        overlay.addEventListener('click', function(e) {
            if (e.target !== searchInput) dropdown.style.display = 'none';
        });

        overlay.querySelector('#v-submit').addEventListener('click', function() {
            const type = overlay.querySelector('#v-type').value;
            const time = overlay.querySelector('#v-time').value.trim();
            const reason = overlay.querySelector('#v-reason').value.trim() || "нарушение правил";
            const logLine = overlay.querySelector('#v-log').value.trim();
            const playerName = overlay.querySelector('#v-player').value.trim() || "Player_Name";
            
            let fullPunishment = "";
            if (type === 'jailoff') fullPunishment = time ? `ТСР ${time}-го уровня` : "ТСР";
            else if (type === 'muteoff') fullPunishment = time ? `мут на ${time} минут` : "мут";
            else if (type === 'banoff') fullPunishment = time ? `бан на ${time} дней` : "бан";
            else if (type === 'warnoff') fullPunishment = "варн";
            else if (type === 'driverbanoff') fullPunishment = time ? `бан вождения на ${time} дней` : "бан вождения";

            const commandStr = `/${type} ${playerName}${time ? ` ${time}` : ""} жб${threadId} ${adminTag}`;
            
            callback(playerName, fullPunishment, reason, selectedRuleText, logLine);
            sendToDiscordLog(commandStr);
            closeModal(overlay);
        });

        overlay.querySelector('#v-cancel').addEventListener('click', function() {
            closeModal(overlay);
        });
    }

    function showCustomDatePrompt(callback) {
        const overlay = document.createElement('div');
        overlay.className = 'ah-modal-overlay';
        const now = new Date();
        overlay.innerHTML = `
            <div class="ah-modal-box" style="width: 340px; text-align: center;">
                <h4 style="margin: 0 0 20px 0; color: var(--ah-accent); text-transform: uppercase;">Выберите вторую дату</h4>
                <div style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-bottom: 20px;">
                    <input type="text" id="cd-day" value="${String(now.getDate()).padStart(2, '0')}" maxlength="2" style="width: 50px; padding: 10px; background: #0a0a0f; border: 1px solid #333; color: #fff; border-radius: 8px; text-align: center; outline: none;">
                    <span>.</span>
                    <input type="text" id="cd-month" value="${String(now.getMonth() + 1).padStart(2, '0')}" maxlength="2" style="width: 50px; padding: 10px; background: #0a0a0f; border: 1px solid #333; color: #fff; border-radius: 8px; text-align: center; outline: none;">
                    <span>.</span>
                    <input type="text" id="cd-year" value="${now.getFullYear()}" maxlength="4" style="width: 70px; padding: 10px; background: #0a0a0f; border: 1px solid #333; color: #fff; border-radius: 8px; text-align: center; outline: none;">
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="cd-quick-btn" data-add="1" style="padding: 8px 12px; background: #333; border: none; border-radius: 8px; color: #fff; cursor: pointer;">+1 День</button>
                    <button class="cd-quick-btn" data-add="3" style="padding: 8px 12px; background: #333; border: none; border-radius: 8px; color: #fff; cursor: pointer;">+3 Дня</button>
                    <button class="cd-quick-btn" data-add="7" style="padding: 8px 12px; background: #333; border: none; border-radius: 8px; color: #fff; cursor: pointer;">+7 Дней</button>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 24px;">
                    <button id="cd-cancel" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: #333; color: #fff; cursor: pointer;">Отмена</button>
                    <button id="cd-submit" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: var(--ah-accent); color: #fff; cursor: pointer; font-weight: bold;">Вставить</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const dInput = overlay.querySelector('#cd-day');
        const mInput = overlay.querySelector('#cd-month');
        const yInput = overlay.querySelector('#cd-year');

        overlay.querySelectorAll('.cd-quick-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                let d = new Date();
                d.setDate(d.getDate() + parseInt(e.target.dataset.add));
                dInput.value = String(d.getDate()).padStart(2, '0');
                mInput.value = String(d.getMonth() + 1).padStart(2, '0');
                yInput.value = d.getFullYear();
            });
        });

        overlay.querySelector('#cd-submit').addEventListener('click', function() {
            callback(`${dInput.value}.${mInput.value}.${yInput.value}`);
            closeModal(overlay);
        });

        overlay.querySelector('#cd-cancel').addEventListener('click', function() {
            closeModal(overlay);
        });
    }

    function initClickableNode(node) {
        if (node.dataset.clickableInit) return;
        node.dataset.clickableInit = 'true';
        node.style.cursor = 'pointer';

        node.addEventListener('click', function(e) {
            if (e.target.closest('a, button, input, .labelLink, .avatar, .structItem-status')) return;
            const mainLink = this.querySelector('.node-title a, .structItem-title a:not(.labelLink)');
            if (mainLink) {
                if (e.ctrlKey || e.metaKey) {
                    window.open(mainLink.href, '_blank');
                } else {
                    mainLink.click();
                }
            }
        });
    }

    function makeNodesEntirelyClickable() {
        const nodes = document.querySelectorAll('.node-body:not([data-clickable-init]), .structItem:not([data-clickable-init])');
        nodes.forEach(initClickableNode);
    }

    function initSidebarTimeWidget() {
        runWhenReady(function() { return !!document.body; }, function() {
            if (document.getElementById('ah-time-widget')) return;
            
            const style = document.createElement('style');
            style.textContent = `
                #ah-time-widget {
                    position: fixed; top: 80px; left: 0;
                    transform: translateX(calc(-100% + 24px));
                    display: flex; align-items: center;
                    background: rgba(20, 20, 25, 0.9);
                    border: 1px solid var(--ah-border, #333); border-left: none;
                    border-radius: 0 12px 12px 0; padding: 10px 12px;
                    box-shadow: 4px 0 15px rgba(0,0,0,0.5);
                    z-index: 999999; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(10px);
                }
                #ah-time-widget:hover { transform: translateX(0); border-color: var(--ah-accent); box-shadow: 4px 0 20px var(--ah-glow, rgba(52,152,219,0.3)); }
                .ah-time-icon { font-size: 16px; color: var(--ah-accent); margin-right: 12px; }
                .ah-time-text { font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; color: #fff; white-space: nowrap; opacity: 0; transition: opacity 0.3s ease; }
                #ah-time-widget:hover .ah-time-text { opacity: 1; }
                #ah-time-settings { margin-left:12px; font-size:16px; opacity:0.6; cursor:pointer; transition: 0.3s; }
                #ah-time-settings:hover { color: var(--ah-accent); opacity: 1; transform: rotate(90deg); }
            `;
            document.head.appendChild(style);

            const widget = document.createElement('div');
            widget.id = 'ah-time-widget';
            widget.innerHTML = `<div class="ah-time-icon">🕒</div><div class="ah-time-text"></div><div id="ah-time-settings" title="Настройки визуала">⚙️</div>`;
            document.body.appendChild(widget);

            const timeText = widget.querySelector('.ah-time-text');
            const update = function() {
                if (timeText.isConnected) timeText.textContent = getUTC3Time();
            };
            update();
            setInterval(update, 1000);

            widget.querySelector('#ah-time-settings').addEventListener('click', function(e) {
                e.stopPropagation();
                showVisualConfigurator();
            });
        });
    }

    function initHeader() {
        const navTop = document.querySelector('.p-navTop');
        const contentRef = document.querySelector('.p-body-inner');
        
        if (!navTop || !contentRef || navTop.dataset.headerInit) {
            return setTimeout(initHeader, 300);
        }
        navTop.dataset.headerInit = 'true';

        let headerEl = navTop;
        let tempEl = navTop;
        while (tempEl && tempEl !== document.body) {
            if (getComputedStyle(tempEl).backgroundColor !== 'rgba(0, 0, 0, 0)') {
                headerEl = tempEl;
                break;
            }
            tempEl = tempEl.parentElement;
        }

        headerEl.classList.add('js-auto-header');
        document.body.classList.add('js-header-fixed-active');
        headerEl.style.setProperty('background', 'transparent', 'important');

        const updatePos = function() {
            const r = contentRef.getBoundingClientRect();
            headerEl.style.left = `${Math.round(r.left)}px`;
            headerEl.style.width = `${Math.round(r.width)}px`;
            document.documentElement.style.setProperty('--auto-header-height', `${headerEl.offsetHeight + 24}px`);
        };

        updatePos();
        setTimeout(updatePos, 300);
        window.addEventListener('resize', updatePos);

        let lastScrollY = window.scrollY;
        let ticking = false;
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    headerEl.classList.toggle('header-hidden', window.scrollY > lastScrollY && window.scrollY > 80);
                    lastScrollY = window.scrollY;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    function createButtons() {
        const replyBtn = document.querySelector('.button--icon--reply');
        if (replyBtn && !document.getElementById('quick_reply')) {
            const btn = document.createElement('input');
            btn.type = 'button';
            btn.className = 'button custom-forum-btn shabs_main';
            btn.value = 'БЫСТРЫЙ ОТВЕТ';
            btn.id = 'quick_reply';
            replyBtn.insertAdjacentElement('afterend', btn);
        }
    }

    function enhanceXenForoMenus(targetNode) {
        const menus = targetNode.querySelectorAll('.menu-content');
        menus.forEach(function(menu) {
            const header = menu.querySelector('.menu-header');
            if (header && header.textContent.includes('Дополнительно') && !menu.dataset.ahInit) {
                menu.dataset.ahInit = 'true';
                const section = document.createElement('div');
                section.innerHTML = `
                    <h4 class="menu-header" style="color: var(--ah-accent);">Arizona Helper</h4>
                    <a href="javascript:void(0)" class="menu-linkRow ah-quick-prefix" data-prefix="17">✅ Рассмотрено (Закрыть)</a>
                    <a href="javascript:void(0)" class="menu-linkRow ah-quick-prefix" data-prefix="18">❌ Отказано (Закрыть)</a>
                    <a href="javascript:void(0)" class="menu-linkRow ah-quick-prefix" data-prefix="15">⏳ На рассмотрении</a>
                `;
                
                const footer = menu.querySelector('.menu-footer');
                if (footer) {
                    menu.insertBefore(section, footer);
                } else {
                    menu.appendChild(section);
                }

                const prefixButtons = section.querySelectorAll('.ah-quick-prefix');
                prefixButtons.forEach(function(btn) {
                    btn.addEventListener('click', async function(e) {
                        e.preventDefault();
                        const button = e.currentTarget;
                        const prefixId = button.dataset.prefix;
                        const editLink = menu.querySelector('a[href*="/edit"]');
                        if (!editLink) return;
                        
                        const ogText = button.textContent;
                        button.textContent = '⏳ Выполняется...';
                        button.style.pointerEvents = 'none';
                        
                        try {
                            const response = await fetch(editLink.href);
                            const html = await response.text();
                            const doc = new DOMParser().parseFromString(html, 'text/html');
                            
                            const formData = new URLSearchParams();
                            formData.append('_xfToken', doc.querySelector('input[name="_xfToken"]').value);
                            formData.append('title', doc.querySelector('input[name="title"]').value);
                            formData.append('prefix_id', prefixId);
                            
                            if (prefixId !== '17' && prefixId !== '18') {
                                formData.append('discussion_open', '1');
                            }
                            formData.append('_xfSet[discussion_open]', '1');
                            
                            const postResp = await fetch(editLink.href, {
                                method: 'POST',
                                body: formData,
                                headers: { 
                                    'Accept': 'application/json, text/javascript, */*; q=0.01', 
                                    'X-Requested-With': 'XMLHttpRequest' 
                                }
                            });
                            
                            if (postResp.ok) {
                                button.textContent = '✅ Успешно!';
                                setTimeout(function() { location.reload(); }, 500);
                            } else {
                                throw new Error();
                            }
                        } catch (err) {
                            button.textContent = '❌ Ошибка';
                            setTimeout(function() {
                                button.textContent = ogText;
                                button.style.pointerEvents = 'auto';
                            }, 2000);
                        }
                    });
                });
            }
        });
    }

    function initParticlesBackground(forceRestart = false) {
        if (!CONFIG.particlesEnabled) {
            const oldCanvas = document.getElementById('ah-particles-bg');
            if (oldCanvas) oldCanvas.remove();
            if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
            return;
        }
        
        let canvas = document.getElementById('ah-particles-bg');
        if (forceRestart && canvas) {
            canvas.remove();
            if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
            canvas = null;
        }

        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'ah-particles-bg';
            Object.assign(canvas.style, {
                position: 'fixed', top: '0', left: '0',
                width: '100vw', height: '100vh', zIndex: '0', 
                pointerEvents: 'none', opacity: '0.85'
            });
            document.body.appendChild(canvas);
            
            const wrapper = document.querySelector('.p-pageWrapper') || document.querySelector('.p-body');
            if (wrapper) {
                wrapper.style.position = 'relative';
                wrapper.style.zIndex = '1';
            }
        }

        const ctx = canvas.getContext('2d');
        let particlesArray = [];
        
        const particleSettings = {
            count: CONFIG.pCount || 70, 
            color: CONFIG.pColor || CONFIG.themeColor || '#3498db', 
            lineDistance: 130, 
            speed: CONFIG.pSpeed || 0.5,
            shape: CONFIG.pShape || 'circle',
            size: CONFIG.pSize || 3,
            lines: CONFIG.pLines !== undefined ? CONFIG.pLines : true
        };

        const resize = function() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        let mouse = { x: null, y: null, radius: 150 };
        window.addEventListener('mousemove', function(e) {
            mouse.x = e.x;
            mouse.y = e.y;
        });
        window.addEventListener('mouseout', function() {
            mouse.x = null;
            mouse.y = null;
        });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = (Math.random() * (particleSettings.size * 0.5)) + (particleSettings.size * 0.8);
                this.directionX = (Math.random() * 2 - 1) * particleSettings.speed;
                this.directionY = (Math.random() * 2 - 1) * particleSettings.speed;
            }
            update() {
                if (mouse.x != null && mouse.y != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius) {
                        this.x -= (dx / distance) * ((mouse.radius - distance) / mouse.radius) * 3;
                        this.y -= (dy / distance) * ((mouse.radius - distance) / mouse.radius) * 3;
                    }
                }
                this.x += this.directionX;
                this.y += this.directionY;
                
                if (this.x < 0 || this.x > canvas.width) this.directionX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.directionY *= -1;
            }
            draw() {
                ctx.beginPath();
                if (particleSettings.shape === 'square') {
                    ctx.rect(this.x, this.y, this.size * 2, this.size * 2);
                } else {
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                }
                ctx.fillStyle = particleSettings.color;
                ctx.fill();
            }
        }

        const initParticles = function() {
            particlesArray = [];
            for (let i = 0; i < particleSettings.count; i++) {
                particlesArray.push(new Particle());
            }
        };

        const hexToRgb = function(hex) {
            let r = parseInt(hex.slice(1, 3), 16),
                g = parseInt(hex.slice(3, 5), 16),
                b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        };

        const connect = function() {
            if (!particleSettings.lines) return;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let dx = particlesArray[a].x - particlesArray[b].x;
                    let dy = particlesArray[a].y - particlesArray[b].y;
                    let distance = (dx * dx) + (dy * dy);
                    
                    if (distance < (particleSettings.lineDistance * particleSettings.lineDistance)) {
                        ctx.strokeStyle = `rgba(${hexToRgb(particleSettings.color)}, ${(1 - (distance / 20000)) * 0.8})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
            }
            connect();
            particleAnimationId = requestAnimationFrame(animate);
        };

        initParticles();
        animate();
    }

    function startHelper() {
        if (isStarted) return;
        isStarted = true;

        if (CONFIG.themeColor && CONFIG.themeColor.toLowerCase() !== "#3498db") {
            const hexToRgb = function(hex) {
                let r = parseInt(hex.slice(1, 3), 16), 
                    g = parseInt(hex.slice(3, 5), 16), 
                    b = parseInt(hex.slice(5, 7), 16);
                return `${r}, ${g}, ${b}`;
            };
            const rgb = hexToRgb(CONFIG.themeColor);
            const style = document.createElement('style');
            style.textContent = `:root, html[data-color-scheme="light"], html[data-color-scheme="dark"] { --ah-accent: ${CONFIG.themeColor} !important; --ah-border-h: rgba(${rgb}, 0.5) !important; --ah-glow: rgba(${rgb}, 0.25) !important; --ah-btn: linear-gradient(135deg, rgba(${rgb}, 0.8) 0%, rgba(${rgb}, 0.4) 100%) !important; --ah-btn-h: linear-gradient(135deg, rgba(${rgb}, 1) 0%, rgba(${rgb}, 0.6) 100%) !important; }`;
            document.head.appendChild(style);
        }

        const modalStyleTag = document.createElement('style');
        modalStyleTag.textContent = `
            @keyframes ahFadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(8px); } }
            @keyframes ahFadeOut { from { opacity: 1; backdrop-filter: blur(8px); } to { opacity: 0; backdrop-filter: blur(0px); } }
            @keyframes ahScaleUp { from { transform: scale(0.9) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
            @keyframes ahScaleDown { from { transform: scale(1) translateY(0); opacity: 1; } to { transform: scale(0.9) translateY(10px); opacity: 0; } }
            .ah-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 999999; backdrop-filter: blur(10px); animation: ahFadeIn 0.3s ease-out forwards; }
            .ah-modal-box { background: #141419; padding: 24px; border-radius: 12px; color: #fff; box-shadow: 0 15px 50px rgba(0,0,0,0.8), 0 0 20px var(--ah-glow, rgba(52,152,219,0.2)); border: 1px solid var(--ah-border, #333); animation: ahScaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            .ah-modal-overlay.ah-closing { animation: ahFadeOut 0.25s ease-in forwards; }
            .ah-modal-overlay.ah-closing .ah-modal-box { animation: ahScaleDown 0.25s ease-in forwards; }
        `;
        document.head.appendChild(modalStyleTag);

        const AH_DATA = window.AH_TEMPLATES ? window.AH_TEMPLATES(CONFIG) : { MENU: {}, HOTKEYS: {} };
        const MENU = AH_DATA.MENU;
        const HOTKEYS = AH_DATA.HOTKEYS;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createButtons);
        } else {
            createButtons();
        }

        runWhenReady(function() { return !!document.body; }, initHeader);
        initSidebarTimeWidget();
        enhanceXenForoMenus(document.body);
        runWhenReady(function() { return !!document.body; }, initParticlesBackground);
        runWhenReady(function() { return !!document.body; }, makeNodesEntirelyClickable);

        let observerTimeout;
        const observer = new MutationObserver(function(mutations) {
            if (mutations.some(function(m) { return m.addedNodes.length > 0; })) {
                clearTimeout(observerTimeout);
                observerTimeout = setTimeout(function() {
                    enhanceXenForoMenus(document.body);
                    makeNodesEntirelyClickable();
                }, 200);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        document.addEventListener('click', function(e) {
            if (e.target.closest('#quick_reply')) {
                if (typeof XF !== 'undefined' && XF.alert) {
                    XF.alert(`<div class="custom-modal-grid quick_reply_container">${renderMainMenu(MENU)}</div>`, ' ');
                }
                return;
            }
            
            const catBtn = e.target.closest('.category_button');
            if (catBtn) {
                const c = catBtn.closest('.quick_reply_container');
                if (c) {
                    c.innerHTML = MENU[catBtn.dataset.category].subcategories 
                        ? renderSubCategories(MENU, catBtn.dataset.category) 
                        : renderTemplates(MENU, catBtn.dataset.category, null);
                }
                return;
            }
            
            const subBtn = e.target.closest('.subcategory_button');
            if (subBtn) {
                const c = subBtn.closest('.quick_reply_container');
                if (c) c.innerHTML = renderTemplates(MENU, subBtn.dataset.category, subBtn.dataset.subcategory);
                return;
            }
            
            if (e.target.closest('.back_to_main')) {
                const c = e.target.closest('.quick_reply_container');
                if (c) c.innerHTML = renderMainMenu(MENU);
                return;
            }
            
            if (e.target.closest('.back_to_subcategory')) {
                const btn = e.target.closest('.back_to_subcategory');
                const c = btn.closest('.quick_reply_container');
                if (c) c.innerHTML = renderSubCategories(MENU, btn.dataset.category);
                return;
            }
            
            const quickBtn = e.target.closest('.quick_button');
            if (quickBtn) {
                const tkey = quickBtn.dataset.tkey;
                const skey = quickBtn.dataset.skey;
                const idx = quickBtn.dataset.idx;
                
                const category = skey ? MENU[tkey].subcategories[skey] : MENU[tkey];
                const template = category.templates[idx];
                
                const processTemplate = function(...args) {
                    const finalHtml = typeof template.text === 'function' 
                        ? template.text(...args, getUTC3Time(), getLawsuitNumber(), getMonday()) 
                        : template.text;
                    insertHtmlIntoEditor(finalHtml);
                    
                    const closeOverlay = document.querySelector('.overlay-close');
                    if (closeOverlay) closeOverlay.click();
                };

                if (template.needsVerdictForm) {
                    showVerdictPrompt(function(pn, pu, r, rt, ll) {
                        processTemplate(pn, pu, r, rt, ll);
                    });
                } else if (template.needsSecondDate) {
                    showCustomDatePrompt(function(sd) {
                        processTemplate(sd);
                    });
                } else {
                    processTemplate();
                }
            }
        });

        document.addEventListener('keydown', function(e) {
            const template = HOTKEYS[e.key];
            if (["F1", "F2", "F3", "F4"].includes(e.key) && template) {
                e.preventDefault();
                
                const processTemplate = function(...args) {
                    const finalHtml = typeof template.text === 'function' 
                        ? template.text(...args, getUTC3Time(), getLawsuitNumber(), getMonday()) 
                        : template.text;
                    insertHtmlIntoEditor(finalHtml);
                };
                
                if (template.needsVerdictForm) {
                    showVerdictPrompt(function(pn, pu, r, rt, ll) {
                        processTemplate(pn, pu, r, rt, ll);
                    });
                } else if (template.needsSecondDate) {
                    showCustomDatePrompt(function(sd) {
                        processTemplate(sd);
                    });
                } else {
                    processTemplate();
                }
            }
        });

        (function() {
            document.body.insertAdjacentHTML('beforeend', `<svg xmlns="http://www.w3.org/2000/svg" style="width:0;height:0;position:absolute;pointer-events:none;"><filter id="motion-blur-vertical" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="0 0" id="blur-intensity" /></filter></svg>`);
            
            const bodyInner = document.querySelector('.p-body-inner');
            const blurFilter = document.getElementById('blur-intensity');
            if (!bodyInner || !blurFilter) return;

            let lastScrollY = window.scrollY;
            let scrollTimeout;
            let ticking = false;

            window.addEventListener('scroll', function() {
                if (!CONFIG.blurEnabled || document.body.scrollHeight > 6000) {
                    blurFilter.setAttribute('stdDeviation', '0 0');
                    bodyInner.style.filter = 'none';
                    bodyInner.style.pointerEvents = 'auto';
                    return;
                }
                
                if (!ticking) {
                    window.requestAnimationFrame(function() {
                        let blurAmount = Math.min(Math.abs(window.scrollY - lastScrollY) * 0.15, 25);
                        lastScrollY = window.scrollY;
                        
                        if (blurAmount > 1) {
                            blurFilter.setAttribute('stdDeviation', `0 ${blurAmount}`);
                            bodyInner.style.filter = 'url(#motion-blur-vertical)';
                            bodyInner.style.pointerEvents = 'none';
                        }
                        
                        clearTimeout(scrollTimeout);
                        scrollTimeout = setTimeout(function() {
                            blurFilter.setAttribute('stdDeviation', '0 0');
                            bodyInner.style.filter = 'none';
                            bodyInner.style.pointerEvents = 'auto';
                        }, 80); 
                        
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
        })();
    }

    let waitInterval = setInterval(function() {
        const configTag = document.getElementById('arizona-ext-config');
        if (configTag) {
            clearInterval(waitInterval);
            try { 
                Object.assign(CONFIG, JSON.parse(configTag.textContent)); 
            } catch (e) {}
            startHelper();
        }
    }, 50);

    setTimeout(function() {
        if (!isStarted) {
            clearInterval(waitInterval);
            startHelper();
        }
    }, 2000);

})();