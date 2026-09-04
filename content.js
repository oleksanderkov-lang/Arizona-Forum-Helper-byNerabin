(function () {
    'use strict';

    let CONFIG = {
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
        pFading: true,
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
        customTemplates: [],
        punishmentHistory: []
    };

    let isStarted = false;
    const RULES_DB = [];

    if (window.ARIZONA_RULES) {
        window.ARIZONA_RULES.forEach(function(category) {
            category.content.forEach(function(line) {
                let text = line.replace(/\{[A-Fa-f0-9a-zA-Z]+\}/g, '').trim();
                if (text.length < 10 || text.startsWith("Спойлер:")) return;
                let type = "jailoff"; let time = ""; let reason = "Нарушение правил"; let lw = text.toLowerCase();

                if (lw.includes("мут")) { type = "muteoff"; let m = lw.match(/мут\s*(?:на\s*)?(\d+)/); if (m) time = m[1]; } 
                else if (lw.includes("бан") && !lw.includes("бан мп")) { type = "banoff"; let m = lw.match(/бан\s*(?:на\s*)?(\d+)/); if (m) time = m[1]; } 
                else if (lw.includes("варн")) { type = "warnoff"; } 
                else if (lw.includes("тср")) { type = "jailoff"; let m = lw.match(/тср\s*(\d+)\s*level/); if (m) time = m[1]; }

                let rMatch = text.match(/^(\d+\.\d+(?:\.\d+)?)\.?\s*(.*?)(?:\.|-)/);
                if (rMatch) reason = rMatch[2].trim().substring(0, 50);

                RULES_DB.push({ text: text, type: type, time: time, reason: reason });
            });
        });
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
            const m = text.match(/(?:Игровой\s+ник\s+нарушителя|Ник\s+нарушителя|Жалоба\s+на\s+игрока)[-:\s]*(?:\[\d+\])?\s*(?:[a-zA-Z0-9]+[\s]*[xX-]\s*)?([A-Za-z0-9]+[_\s][A-Za-z0-9]+)/i);
            if (m && m[1]) {
                name = m[1].trim();
            } else {
                const nicks = text.match(/(?:\[\d+\])?\s*([A-Z][a-zA-Z0-9]*[_\s][A-Z][a-zA-Z0-9]*|[a-zA-Z0-9]+_[a-zA-Z0-9]+)/g);
                if (nicks) {
                    const validNicks = nicks.map(n => n.replace(/(?:\[\d+\])?\s*/, '').trim());
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
                let t = clone.textContent.trim().replace(/\[.*?\]/g, '').trim();
                t = t.replace(/^(?:[a-zA-Z0-9]+[\s]*[xX]\s*|[a-zA-Z]+\s*\|\s*|[a-zA-Z]+\s*-\s*)/i, '');
                let m = t.match(/(?:на игрока[:\s]+|жалоба на[:\s]+|на[:\s]+)(?:\[\d+\])?\s*([A-Za-z0-9]+[_\s][A-Za-z0-9]+)/i);
                if (m && m[1]) name = m[1].trim();
                else { 
                    let m2 = t.split(/[\/|,-]|\s+x\s+|\s+х\s+/i)[0].trim().match(/(?:\[\d+\])?\s*([A-Za-z0-9]+[_\s][A-Za-z0-9]+)/); 
                    if (m2 && m2[1]) name = m2[1].trim(); 
                }
            }
        }
        return name ? name.replace(/\s+/g, '_') : "Player_Name";
    }

    function extractAuthorNickname() {
        let name = "";
        const bbWrapper = document.querySelector('.message-body .bbWrapper');
        if (bbWrapper) {
            const text = bbWrapper.innerText;
            const m = text.match(/(?:Ваш\s+игровой\s+ник|Игровой\s+ник)[-:\s]*(?:\[\d+\])?\s*([A-Za-z0-9]+[_\s][A-Za-z0-9]+)/i);
            if (m && m[1]) {
                name = m[1].trim();
            } else {
                const nicks = text.match(/(?:\[\d+\])?\s*([A-Z][a-zA-Z0-9]*[_\s][A-Z][a-zA-Z0-9]*|[a-zA-Z0-9]+_[a-zA-Z0-9]+)/g);
                if (nicks) {
                    const validNicks = nicks.map(n => n.replace(/(?:\[\d+\])?\s*/, '').trim());
                    if (validNicks.length > 0) name = validNicks[0];
                }
            }
        }
        if (!name || name.length < 3) {
            const a = document.querySelector('.message-name');
            if (a) name = a.textContent.trim();
        }
        return name ? name.replace(/\s+/g, '_') : "Author_Name";
    }

    function insertHtmlIntoEditor(html) {
        const editor = document.querySelector('.fr-element');
        if (!editor) return false;
        
        try {
            if (typeof XF !== 'undefined' && XF.getEditorInContainer) {
                const xfEditor = XF.getEditorInContainer(document.body);
                if (xfEditor && xfEditor.ed) {
                    xfEditor.ed.events.focus(true);
                    xfEditor.ed.selection.restore();
                    xfEditor.ed.html.insert(html);
                    return true;
                }
            }
        } catch (e) {}

        editor.focus(); 
        const beforeContent = editor.innerHTML;
        try { document.execCommand('insertHTML', false, html); } catch(e) {}
        
        if (editor.innerHTML === beforeContent) {
            if (editor.innerHTML.trim() === '<p><br></p>' || editor.innerHTML.trim() === '<br>') {
                editor.innerHTML = html;
            } else {
                editor.insertAdjacentHTML('beforeend', html);
            }
        }
        
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }

    async function sendToDiscordLog(commandStr) {
        if (!CONFIG.discordWebhook || !CONFIG.discordWebhook.startsWith("http")) return;
        try { await fetch(CONFIG.discordWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `\`${commandStr}\`` }) }); } catch (e) {}
    }

    function renderMainMenu(MENU) {
        let html = Object.keys(MENU).map(function(k) {
            return `<input type="button" class="button custom-forum-btn category_button" value="${MENU[k].title}" data-category="${k}">`;
        }).join('');
        
        html += `<div style="width:100%; margin-top:15px; padding-top:15px; border-top:1px solid var(--ah-border); text-align:center;">
                    <input type="button" class="button custom-forum-btn manage_custom_btn" value="⚙️ Управление формами" style="background: rgba(40,40,50,0.8)!important;">
                 </div>`;
        return html;
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

    function renderCustomManager(config) {
        let html = `
        <div style="width:100%; display:block; text-align:left;">
            <style>
                .cm-input { width: 100%; box-sizing: border-box; padding: 12px; background: #0a0a0f; border: 1px solid #333; color: #fff; border-radius: 8px; outline: none; margin-bottom: 12px; font-family: inherit; font-size: 13px; transition: 0.3s; }
                .cm-input:focus { border-color: var(--ah-accent); box-shadow: 0 0 10px var(--ah-glow); }
                .cm-item { display:flex; justify-content:space-between; align-items:center; background:rgba(30, 30, 38, 0.5); padding:10px 14px; margin-bottom:6px; border-radius:8px; border:1px solid #333; font-size:13px; transition: 0.2s; }
                .cm-item:hover { background: var(--ah-glow); border-color: var(--ah-border-h); }
                .cm-btn { padding: 12px; background: var(--ah-btn); color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; width: 100%; text-transform: uppercase; margin-bottom: 15px; }
                .cm-btn:hover { background: var(--ah-btn-h); transform: translateY(-2px); box-shadow: 0 4px 15px var(--ah-glow); }
                .cm-btn:active { transform: scale(0.97); }
            </style>
            <h3 style="margin: 0 0 20px 0; color: var(--ah-accent); text-align: center; text-transform: uppercase; font-weight: 800;">⚙️ Управление формами</h3>`;
        
        if (config.customTemplates && config.customTemplates.length > 0) {
            html += `<div style="max-height: 180px; overflow-y: auto; margin-bottom: 20px; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px;" class="v-scroll">`;
            config.customTemplates.forEach((tpl, i) => {
                let cat = tpl.category || 'Общие';
                html += `<div class="cm-item">
                    <span><b style="color:var(--ah-accent);">[${cat}]</b> ${tpl.title}</span>
                    <span class="delete_custom_btn" data-idx="${i}" style="color:#e74c3c; cursor:pointer; font-weight:bold; font-size:15px; padding:4px; transition: 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">✖</span>
                </div>`;
            });
            html += `</div>`;
        } else {
            html += `<div style="text-align:center; color:#888; font-size:13px; margin-bottom:20px;">У вас пока нет своих форм.</div>`;
        }

        html += `
            <input type="text" id="cm_cat" class="cm-input" placeholder="Название папки (Например: Для МЮ)" autocomplete="off">
            <input type="text" id="cm_title" class="cm-input" placeholder="Название кнопки (Например: Выпуск по УДО)" autocomplete="off">
            <textarea id="cm_text" class="cm-input" rows="3" placeholder="HTML или BB-код вашей формы..." style="resize:vertical;"></textarea>
            <button id="cm_add_btn" class="cm-btn">➕ Добавить форму</button>
            <div style="text-align:center; border-top: 1px solid #333; padding-top: 15px;"><input type="button" class="button custom-forum-btn back_to_main" value="🔙 Вернуться в меню" style="margin:0;"></div>
        </div>`;
        return html;
    }

    function closeModal(overlay) {
        overlay.classList.add('ah-closing');
        setTimeout(function() {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        }, 250);
    }

    function showRefusePrompt(callback) {
        const overlay = document.createElement('div');
        overlay.className = 'ah-modal-overlay';
        overlay.innerHTML = `
            <div class="ah-modal-box" style="width: 480px;">
                <style>
                    .v-group { margin-bottom: 16px; text-align: left; display: block; position: relative; }
                    .v-label { font-size: 11px; color: #aaa; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; display: block; }
                    .v-input { width: 100%; box-sizing: border-box; padding: 12px; background: #0a0a0f; border: 1px solid #333; color: #fff; border-radius: 8px; outline: none; transition: 0.3s; font-family: inherit; font-size: 13px; }
                    .v-input:focus { border-color: var(--ah-accent); box-shadow: 0 0 10px var(--ah-glow); }
                </style>
                <h3 style="margin: 0 0 24px 0; color: var(--ah-accent); text-align: center; text-transform: uppercase; font-weight: 800;">Отказ жалобы</h3>
                
                <div class="v-group">
                    <label class="v-label">Причина отказа (Умный поиск)</label>
                    <input type="text" id="r-search" class="v-input" placeholder="Введите: время, качество, мат, скрин..." autocomplete="off">
                    <div id="r-dropdown" class="v-scroll ah-dropdown-animated" style="display:none; position:absolute; top:100%; left:0; right:0; background: #19191e; border: 1px solid #333; border-radius: 8px; max-height: 180px; overflow-y: auto; z-index: 10; margin-top: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);"></div>
                </div>
                
                <div class="v-group">
                    <label class="v-label">Текст причины в форму</label>
                    <textarea id="r-reason" class="v-input" rows="2" placeholder="Здесь появится выбранная причина..." style="resize: vertical;"></textarea>
                </div>
                
                <div class="v-group">
                    <label class="v-label">Пункт правил (Необязательно)</label>
                    <input type="text" id="r-rule" class="v-input" placeholder="Например: Раздел 2, Пункт 3...">
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 28px;">
                    <button id="r-cancel" style="flex:1; padding:14px; border-radius:8px; background:#333; color:#fff; border:none; cursor:pointer; font-weight:bold; transition: 0.2s;" onmouseover="this.style.background='#444'" onmouseout="this.style.background='#333'">Отмена</button>
                    <button id="r-submit" style="flex:1; padding:14px; border-radius:8px; background:var(--ah-btn); color:#fff; border:none; cursor:pointer; font-weight:bold; transition: 0.2s;" onmouseover="this.style.background='var(--ah-btn-h)'; this.style.boxShadow='0 4px 15px var(--ah-glow)';" onmouseout="this.style.background='var(--ah-btn)'; this.style.boxShadow='none';">Выдать отказ</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const searchInput = overlay.querySelector('#r-search');
        const dropdown = overlay.querySelector('#r-dropdown');
        const reasonInput = overlay.querySelector('#r-reason');
        const rules = window.ARIZONA_REFUSE_RULES || [];

        searchInput.addEventListener('input', function(e) {
            const words = e.target.value.toLowerCase().split(' ').filter(function(w) { return w; });
            dropdown.innerHTML = '';
            if (!words.length) { dropdown.style.display = 'none'; return; }

            const matches = rules.filter(function(ruleText) {
                const lowerRule = ruleText.toLowerCase();
                return words.every(function(w) { return lowerRule.includes(w); });
            }).slice(0, 10);

            if (matches.length > 0) {
                matches.forEach(function(ruleText) {
                    const div = document.createElement('div');
                    div.style.padding = '12px 14px'; div.style.cursor = 'pointer'; div.style.borderBottom = '1px solid #333'; div.style.fontSize = '12px'; div.style.lineHeight = '1.4'; div.textContent = ruleText;
                    div.addEventListener('mouseenter', function() { div.style.background = '#25252b'; });
                    div.addEventListener('mouseleave', function() { div.style.background = 'transparent'; });
                    div.addEventListener('click', function() { reasonInput.value = ruleText; searchInput.value = ''; dropdown.style.display = 'none'; });
                    dropdown.appendChild(div);
                });
                dropdown.style.display = 'block';
            } else { dropdown.style.display = 'none'; }
        });

        overlay.addEventListener('mousedown', function(e) { 
            if (e.target !== searchInput && !dropdown.contains(e.target)) dropdown.style.display = 'none'; 
            if (e.target === overlay) closeModal(overlay);
        });
        
        overlay.querySelector('#r-submit').addEventListener('click', function() { callback(reasonInput.value.trim() || "Отказано.", overlay.querySelector('#r-rule').value.trim()); closeModal(overlay); });
        overlay.querySelector('#r-cancel').addEventListener('click', function() { closeModal(overlay); });
    }

    function showOpraPrompt(extractedName, callback) {
        const overlay = document.createElement('div');
        overlay.className = 'ah-modal-overlay';
        const author = extractAuthorNickname();
        
        overlay.innerHTML = `
            <div class="ah-modal-box" style="width: 360px; text-align: center;">
                <h3 style="margin: 0 0 20px 0; color: var(--ah-accent); text-transform: uppercase;">У кого запросить опру?</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="o-btn" data-val="игрока ${extractedName}" style="padding: 12px; background: #0a0a0f; border: 1px solid #333; color: #fff; border-radius: 8px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.borderColor='var(--ah-accent)'" onmouseout="this.style.borderColor='#333'">У игрока: ${extractedName}</button>
                    <button class="o-btn" data-val="автора ${author}" style="padding: 12px; background: #0a0a0f; border: 1px solid #333; color: #fff; border-radius: 8px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.borderColor='var(--ah-accent)'" onmouseout="this.style.borderColor='#333'">У автора: ${author}</button>
                    <button class="o-btn" data-val="игрока ${extractedName} и автора ${author}" style="padding: 12px; background: var(--ah-btn); border: none; color: #fff; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s;" onmouseover="this.style.background='var(--ah-btn-h)'; this.style.boxShadow='0 4px 15px var(--ah-glow)';" onmouseout="this.style.background='var(--ah-btn)'; this.style.boxShadow='none';">У обоих сразу</button>
                </div>
                <button id="o-cancel" style="margin-top: 20px; width: 100%; padding: 12px; border-radius: 8px; background: #333; color: #fff; border: none; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#444'" onmouseout="this.style.background='#333'">Отмена</button>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelectorAll('.o-btn').forEach(function(b) {
            b.addEventListener('click', function(e) { callback(e.target.dataset.val); closeModal(overlay); });
        });

        overlay.querySelector('#o-cancel').addEventListener('click', function() { closeModal(overlay); });
        overlay.addEventListener('mousedown', function(e) { if (e.target === overlay) closeModal(overlay); });
    }

    function showVerdictPrompt(callback) {
        const threadMatch = window.location.href.match(/threads\/(?:.*?\.)?(\d+)/i);
        const threadId = threadMatch ? threadMatch[1] : "000000";
        
        const adminNameEl = document.querySelector('.p-navgroup-link--user .p-navgroup-linkText') || document.querySelector('.p-navgroup-linkText');
        let adminName = adminNameEl ? adminNameEl.textContent.trim() : CONFIG.nickname;
        let nameParts = adminName.split(adminName.includes('_') ? '_' : ' ');
        const adminTag = nameParts.length > 1 ? `// ${nameParts[0][0]}.${nameParts[1]}` : `// ${adminName}`;

        const extractedName = extractTargetNickname();
        const extractedAuthor = extractAuthorNickname();
        
        let punishments = [];
        let selectedRuleText = "";

        const overlay = document.createElement('div');
        overlay.className = 'ah-modal-overlay';
        overlay.innerHTML = `
            <div class="ah-modal-box" style="width: 480px;">
                <style>
                    .v-group { margin-bottom: 16px !important; text-align: left !important; position: relative !important; display: block !important; }
                    .v-label { display: block !important; font-size: 11px !important; color: #aaa !important; font-weight: bold !important; margin: 0 0 6px 0 !important; text-transform: uppercase !important; }
                    .v-input { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 10px 12px !important; background: #0a0a0f !important; border: 1px solid #333 !important; color: #fff !important; border-radius: 8px !important; outline: none !important; transition: border-color 0.3s, box-shadow 0.3s !important; font-size: 13px !important; font-family: inherit !important; margin: 0 !important; height: auto !important; }
                    .v-input:focus { border-color: var(--ah-accent) !important; box-shadow: 0 0 10px var(--ah-glow) !important; }
                    .v-scroll::-webkit-scrollbar { width: 4px; }
                    .v-scroll::-webkit-scrollbar-thumb { background: var(--ah-accent); border-radius: 2px; }
                    .v-btn { padding: 12px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; color: #fff; transition: 0.2s; font-size: 13px; }
                    .v-btn-quick { background: #2a2a30; border: 1px solid #444; }
                    .v-btn-quick:hover { background: #3a3a42; border-color: var(--ah-accent); }
                </style>
                <h3 style="margin: 0 0 20px 0; color: var(--ah-accent); text-align: center; text-transform: uppercase; font-weight: 800;">Выдача наказания</h3>
                
                <div class="v-group">
                    <label class="v-label">Пункт правил (Умный поиск с синонимами)</label>
                    <input type="text" id="v-rule-search" class="v-input" placeholder="Введите дм, офф, лив..." autocomplete="off">
                    <div id="v-rule-dropdown" class="v-scroll ah-dropdown-animated" style="display:none; position:absolute; top:100%; left:0; right:0; background: #19191e; border: 1px solid #333; border-radius: 8px; max-height: 180px; overflow-y: auto; z-index: 10; margin-top: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);"></div>
                </div>
                
                <div id="v-punish-list" style="display: none; margin-bottom: 16px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid #333;"></div>

                <div style="background: rgba(30,30,38,0.4); padding: 12px; border-radius: 8px; border: 1px dashed #444; margin-bottom: 16px;">
                    <div class="v-group">
                        <label class="v-label">Кому выдаем?</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="v-player" class="v-input" value="${extractedName}">
                            <button id="btn-author" class="v-btn v-btn-quick" style="flex: 0 0 auto;">Автор</button>
                            <button id="btn-target" class="v-btn v-btn-quick" style="flex: 0 0 auto;">Игрок</button>
                        </div>
                    </div>

                    <div id="v-history-warning" style="display:none; margin-bottom:12px; padding:10px; background:rgba(231,76,60,0.15); border:1px solid #e74c3c; border-radius:8px; color:#ff6b6b; font-size:12px; line-height: 1.4;"></div>

                    <div style="display: flex; gap: 12px;">
                        <div class="v-group" style="flex: 1;">
                            <label class="v-label">Наказание</label>
                            <select id="v-type" class="v-input">
                                <option value="jailoff">ТСР</option>
                                <option value="muteoff">Мут</option>
                                <option value="banoff">Бан</option>
                                <option value="warnoff">Варн</option>
                                <option value="driverbanoff">Бан вожд.</option>
                                <option value="gunbanoff">Ганбан</option>
                            </select>
                        </div>
                        <div class="v-group" style="flex: 1;">
                            <label class="v-label">Срок/Уровень</label>
                            <input type="text" id="v-time" class="v-input" placeholder="Например: 30">
                        </div>
                    </div>

                    <div class="v-group" style="margin-bottom: 8px !important;">
                        <label class="v-label">Причина (Для формы)</label>
                        <input type="text" id="v-reason" class="v-input" placeholder="Например: ДМ">
                    </div>
                    
                    <button id="v-add-btn" class="v-btn" style="width: 100%; margin-top: 10px; background: linear-gradient(135deg, rgba(46, 204, 113, 0.8) 0%, rgba(39, 174, 96, 0.6) 100%);" onmouseover="this.style.background='linear-gradient(135deg, rgba(46, 204, 113, 1) 0%, rgba(39, 174, 96, 0.8) 100%)'; this.style.boxShadow='0 4px 15px rgba(46, 204, 113, 0.3)';" onmouseout="this.style.background='linear-gradient(135deg, rgba(46, 204, 113, 0.8) 0%, rgba(39, 174, 96, 0.6) 100%)'; this.style.boxShadow='none';">➕ Добавить в список</button>
                </div>

                <div id="v-log-group" class="v-group" style="display: none;">
                    <label class="v-label" style="color: #e74c3c;">Лог (Офф/Смерть)</label>
                    <input type="text" id="v-log" class="v-input" style="border-color: rgba(231,76,60,0.5);">
                </div>

                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button id="v-cancel" class="v-btn" style="flex: 1; background: #333;" onmouseover="this.style.background='#444'" onmouseout="this.style.background='#333'">Отмена</button>
                    <button id="v-submit" class="v-btn" style="flex: 1; background: var(--ah-btn);" onmouseover="this.style.background='var(--ah-btn-h)'; this.style.boxShadow='0 4px 15px var(--ah-glow)';" onmouseout="this.style.background='var(--ah-btn)'; this.style.boxShadow='none';">Выдать всё</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#btn-author').addEventListener('click', function() { 
            overlay.querySelector('#v-player').value = extractedAuthor; 
            checkPlayerHistory();
        });
        overlay.querySelector('#btn-target').addEventListener('click', function() { 
            overlay.querySelector('#v-player').value = extractedName; 
            checkPlayerHistory();
        });

        const searchInput = overlay.querySelector('#v-rule-search');
        const dropdown = overlay.querySelector('#v-rule-dropdown');
        const listDiv = overlay.querySelector('#v-punish-list');
        const warningDiv = overlay.querySelector('#v-history-warning');
        
        const typeSelect = overlay.querySelector('#v-type');
        const timeInput = overlay.querySelector('#v-time');
        const reasonInput = overlay.querySelector('#v-reason');
        const playerInput = overlay.querySelector('#v-player');

        const synonyms = {
            'офф': ['выход', 'уход', 'офф', 'лив'],
            'дм': ['уби', 'дм', 'deathmatch', 'нанесение'],
            'дб': ['дб', 'машин', 'наезд'],
            'тк': ['тк', 'своих', 'фракци', 'тимкил'],
            'ск': ['ск', 'спавн'],
            'рк': ['рк', 'возврат', 'смерт'],
            'зз': ['зз', 'зелен', 'зоне'],
            'сбив': ['сбив'],
            'аним': ['аним'],
            'бронь': ['брони', 'бронь', 'армор'],
            'хилл': ['хилл', 'лечен', 'аптечк', 'нарко'],
            'арест': ['арест', 'коп', 'полиц']
        };

        function checkPlayerHistory() {
            const pName = playerInput.value.trim();
            const pReason = reasonInput.value.trim().toLowerCase();
            if (!pName || !pReason || !CONFIG.punishmentHistory) {
                warningDiv.style.display = 'none';
                return;
            }

            const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
            const recent = CONFIG.punishmentHistory.filter(h =>
                h.player === pName &&
                h.reason.toLowerCase().includes(pReason) &&
                h.date > Date.now() - SEVEN_DAYS
            );

            if (recent.length > 0) {
                const daysAgo = Math.round((Date.now() - recent[0].date) / 86400000);
                let timeStr = daysAgo === 0 ? 'сегодня' : `${daysAgo} дн. назад`;
                warningDiv.innerHTML = `⚠️ <b>Внимание:</b> Ты уже выдавал наказание <b>${pName}</b> за это ${timeStr}! Возможно, стоит увеличить меру наказания.`;
                warningDiv.style.display = 'block';
            } else {
                warningDiv.style.display = 'none';
            }
        }

        playerInput.addEventListener('input', checkPlayerHistory);
        reasonInput.addEventListener('input', checkPlayerHistory);

        searchInput.addEventListener('input', function(e) {
            const words = e.target.value.toLowerCase().split(/\s+/).filter(function(w) { return w; });
            dropdown.innerHTML = '';
            
            if (!words.length) {
                dropdown.style.display = 'none'; selectedRuleText = "";
                overlay.querySelector('#v-log-group').style.display = 'none'; return;
            }
            
            const matches = RULES_DB.filter(function(r) {
                const combined = r.text.toLowerCase() + " " + r.reason.toLowerCase();
                return words.every(function(w) {
                    if (combined.includes(w)) return true;
                    for (let key in synonyms) {
                        if (key.includes(w) || w.includes(key)) {
                            if (synonyms[key].some(function(syn) { return combined.includes(syn); })) return true;
                        }
                    }
                    return false;
                });
            }).slice(0, 15);

            if (matches.length > 0) {
                matches.forEach(function(rule) {
                    const div = document.createElement('div');
                    div.style.padding = '12px 14px'; div.style.cursor = 'pointer'; div.style.borderBottom = '1px solid #333'; div.style.fontSize = '12px'; div.style.lineHeight = '1.4'; div.textContent = rule.text;
                    div.addEventListener('mouseenter', function() { div.style.background = '#25252b'; });
                    div.addEventListener('mouseleave', function() { div.style.background = 'transparent'; });
                    
                    div.addEventListener('click', function() {
                        searchInput.value = rule.text; selectedRuleText = rule.text; reasonInput.value = rule.reason;
                        if (rule.type) typeSelect.value = rule.type;
                        if (rule.time !== undefined) timeInput.value = rule.time;
                        dropdown.style.display = 'none';
                        overlay.querySelector('#v-log-group').style.display = (rule.text.toLowerCase().includes('офф') || rule.text.toLowerCase().includes('выход')) ? 'block' : 'none';
                        checkPlayerHistory();
                    });
                    dropdown.appendChild(div);
                });
                dropdown.style.display = 'block';
            } else { dropdown.style.display = 'none'; }
        });

        overlay.addEventListener('mousedown', function(e) { 
            if (e.target !== searchInput && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none'; 
            }
            if (e.target === overlay) closeModal(overlay);
        });

        function renderList() {
            if(punishments.length === 0) { listDiv.style.display = 'none'; return; }
            listDiv.style.display = 'block';
            listDiv.innerHTML = punishments.map(function(p, i) {
                let tName = p.type;
                if (p.type==='jailoff') tName = 'ТСР'; else if (p.type==='muteoff') tName = 'Мут'; else if (p.type==='banoff') tName = 'Бан'; else if (p.type==='warnoff') tName = 'Варн'; else if (p.type==='driverbanoff') tName = 'Бан вожд.'; else if (p.type==='gunbanoff') tName = 'Ганбан';
                return `<div style="display:flex; justify-content:space-between; align-items:center; background:#1a1a20; padding:6px 10px; border-radius:6px; margin-bottom:4px; font-size:12px; border: 1px solid #444;">
                    <span><b style="color:var(--ah-accent);">${p.player}</b>: ${tName} (${p.time||'-'}) - ${p.reason}</span>
                    <span class="v-del-p" data-idx="${i}" style="color:#e74c3c; cursor:pointer; font-size:14px; transition: 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">✖</span>
                </div>`;
            }).join('');
            
            listDiv.querySelectorAll('.v-del-p').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    punishments.splice(e.target.dataset.idx, 1);
                    renderList();
                });
            });
        }

        overlay.querySelector('#v-add-btn').addEventListener('click', function() {
            punishments.push({
                player: playerInput.value.trim() || "Player_Name",
                type: typeSelect.value,
                time: timeInput.value.trim(),
                reason: reasonInput.value.trim() || "нарушение правил",
                ruleText: selectedRuleText
            });
            renderList();
            
            timeInput.value = '';
            reasonInput.value = '';
            searchInput.value = '';
            selectedRuleText = '';
            overlay.querySelector('#v-log-group').style.display = 'none';
            warningDiv.style.display = 'none';
        });

        overlay.querySelector('#v-submit').addEventListener('click', function() {
            const player = playerInput.value.trim();
            const time = timeInput.value.trim();
            const reason = reasonInput.value.trim();
            
            if (punishments.length === 0 || time !== '' || reason !== '') {
                punishments.push({
                    player: player || "Player_Name",
                    type: typeSelect.value,
                    time: time,
                    reason: reason || "нарушение правил",
                    ruleText: selectedRuleText
                });
            }

            const logLine = overlay.querySelector('#v-log').value.trim();
            let punishmentsHtml = "";
            let commandsStr = "";
            let rulesSet = new Set(); 

            if (!CONFIG.punishmentHistory) CONFIG.punishmentHistory = [];

            punishments.forEach(function(p) {
                let fullPun = "";
                if (p.type === 'jailoff') fullPun = p.time ? `ТСР ${p.time}-го уровня` : "ТСР";
                else if (p.type === 'muteoff') fullPun = p.time ? `мут на ${p.time} минут` : "мут";
                else if (p.type === 'banoff') fullPun = p.time ? `бан на ${p.time} дней` : "бан";
                else if (p.type === 'warnoff') fullPun = "варн";
                else if (p.type === 'driverbanoff') fullPun = p.time ? `бан вождения на ${p.time} дней` : "бан вождения";
                else if (p.type === 'gunbanoff') fullPun = p.time ? `бан оружия на ${p.time} дней` : "бан оружия";
                
                punishmentsHtml += `<p>Игрок ${p.player} получит ${fullPun} за ${p.reason}.</p>`;
                commandsStr += `/${p.type} ${p.player}${p.time ? " " + p.time : ""} жб${threadId} ${adminTag}\n`;
                
                if (p.ruleText) rulesSet.add(p.ruleText);

                CONFIG.punishmentHistory.unshift({
                    player: p.player,
                    type: p.type,
                    reason: p.reason,
                    date: Date.now()
                });
            });

            let finalRuleText = Array.from(rulesSet).join('<br>Пункт правил: ');

            const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
            CONFIG.punishmentHistory = CONFIG.punishmentHistory.filter(h => h.date > Date.now() - TWO_WEEKS);
            
            window.dispatchEvent(new CustomEvent('AH_SAVE_CONFIG', {
                detail: { punishmentHistory: CONFIG.punishmentHistory }
            }));

            callback(punishments, punishmentsHtml, finalRuleText, logLine);
            sendToDiscordLog(commandsStr.trim());
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
                <h4 style="margin: 0 0 20px 0; color: var(--ah-accent); text-transform: uppercase;">Выберите дату</h4>
                <div style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-bottom: 20px;">
                    <input type="text" id="cd-day" value="${String(now.getDate()).padStart(2, '0')}" style="width: 50px; padding: 10px; background: #0a0a0f; border: 1px solid #333; color: #fff; border-radius: 8px; text-align: center;">
                    <input type="text" id="cd-month" value="${String(now.getMonth() + 1).padStart(2, '0')}" style="width: 50px; padding: 10px; background: #0a0a0f; border: 1px solid #333; color: #fff; border-radius: 8px; text-align: center;">
                    <input type="text" id="cd-year" value="${now.getFullYear()}" style="width: 70px; padding: 10px; background: #0a0a0f; border: 1px solid #333; color: #fff; border-radius: 8px; text-align: center;">
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="cd-q" data-add="1" style="padding: 8px 12px; background: #333; border: none; border-radius: 8px; color: #fff; cursor: pointer;">+1</button>
                    <button class="cd-q" data-add="3" style="padding: 8px 12px; background: #333; border: none; border-radius: 8px; color: #fff; cursor: pointer;">+3</button>
                    <button class="cd-q" data-add="7" style="padding: 8px 12px; background: #333; border: none; border-radius: 8px; color: #fff; cursor: pointer;">+7</button>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 24px;">
                    <button id="cd-cancel" style="flex:1; padding:12px; background:#333; border:none; color:#fff; border-radius:8px; cursor: pointer;">Отмена</button>
                    <button id="cd-submit" style="flex:1; padding:12px; background:var(--ah-btn); border:none; color:#fff; border-radius:8px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='var(--ah-btn-h)'; this.style.boxShadow='0 4px 15px var(--ah-glow)';" onmouseout="this.style.background='var(--ah-btn)'; this.style.boxShadow='none';">Вставить</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelectorAll('.cd-q').forEach(function(b) {
            b.addEventListener('click', function(e) {
                let d = new Date(); d.setDate(d.getDate() + parseInt(e.target.dataset.add));
                overlay.querySelector('#cd-day').value = String(d.getDate()).padStart(2, '0');
                overlay.querySelector('#cd-month').value = String(d.getMonth() + 1).padStart(2, '0');
                overlay.querySelector('#cd-year').value = d.getFullYear();
            });
        });

        overlay.querySelector('#cd-submit').addEventListener('click', function() { callback(`${overlay.querySelector('#cd-day').value}.${overlay.querySelector('#cd-month').value}.${overlay.querySelector('#cd-year').value}`); closeModal(overlay); });
        overlay.querySelector('#cd-cancel').addEventListener('click', function() { closeModal(overlay); });
        overlay.addEventListener('mousedown', function(e) { if (e.target === overlay) closeModal(overlay); });
    }

    function createButtons() {
        const targetBtn = document.querySelector('.button--icon--reply, .button--icon--write, .button--icon--save');
        if (targetBtn && !document.getElementById('quick_reply')) {
            const btn = document.createElement('input');
            btn.type = 'button';
            btn.className = 'button custom-forum-btn shabs_main';
            btn.value = 'ШАБЛОНЫ';
            btn.id = 'quick_reply';
            targetBtn.insertAdjacentElement('afterend', btn);
        }
    }

    function enhanceXenForoMenus(targetNode) {
        targetNode.querySelectorAll('.menu-content').forEach(function(menu) {
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
                if (footer) menu.insertBefore(section, footer); else menu.appendChild(section);
                
                section.querySelectorAll('.ah-quick-prefix').forEach(function(btn) {
                    btn.addEventListener('click', async function(e) {
                        e.preventDefault();
                        const button = e.currentTarget; const prefixId = button.dataset.prefix; const editLink = menu.querySelector('a[href*="/edit"]');
                        if (!editLink) return;
                        const ogText = button.textContent; button.textContent = '⏳...'; button.style.pointerEvents = 'none';
                        try {
                            const response = await fetch(editLink.href); const html = await response.text(); const doc = new DOMParser().parseFromString(html, 'text/html');
                            const formData = new URLSearchParams();
                            formData.append('_xfToken', doc.querySelector('input[name="_xfToken"]').value);
                            formData.append('title', doc.querySelector('input[name="title"]').value);
                            formData.append('prefix_id', prefixId);
                            if (prefixId !== '17' && prefixId !== '18') formData.append('discussion_open', '1');
                            formData.append('_xfSet[discussion_open]', '1');
                            const postResp = await fetch(editLink.href, { method: 'POST', body: formData, headers: { 'Accept': 'application/json, text/javascript, */*; q=0.01', 'X-Requested-With': 'XMLHttpRequest' } });
                            if (postResp.ok) { button.textContent = '✅'; setTimeout(function() { location.reload(); }, 500); } else throw new Error();
                        } catch (err) { button.textContent = '❌'; setTimeout(function() { button.textContent = ogText; button.style.pointerEvents = 'auto'; }, 2000); }
                    });
                });
            }
        });
    }

    function executeTemplate(template) {
        const processTemplate = function(...args) {
            const finalHtml = typeof template.text === 'function' ? template.text(...args, getUTC3Time(), getLawsuitNumber(), getMonday()) : template.text;
            insertHtmlIntoEditor(finalHtml);
            const closeOverlay = document.querySelector('.overlay-close');
            if (closeOverlay) closeOverlay.click();
        };
        
        if (template.needsVerdictForm) { 
            showVerdictPrompt(function(punishmentsArray, punishmentsHtml, finalRuleText, logLine) {
                if (template.text.length === 5) {
                    const p = punishmentsArray[0];
                    let fullPun = "";
                    if (p.type === 'jailoff') fullPun = p.time ? `ТСР ${p.time}-го уровня` : "ТСР";
                    else if (p.type === 'muteoff') fullPun = p.time ? `мут на ${p.time} минут` : "мут";
                    else if (p.type === 'banoff') fullPun = p.time ? `бан на ${p.time} дней` : "бан";
                    else if (p.type === 'warnoff') fullPun = "варн";
                    else if (p.type === 'driverbanoff') fullPun = p.time ? `бан вождения на ${p.time} дней` : "бан вождения";
                    else if (p.type === 'gunbanoff') fullPun = p.time ? `бан оружия на ${p.time} дней` : "бан оружия";
                    processTemplate(p.player, fullPun, p.reason, finalRuleText, logLine);
                } 
                else {
                    processTemplate(punishmentsHtml, finalRuleText, logLine);
                }
            }); 
        } 
        else if (template.needsRefuseForm) { showRefusePrompt(function(r, rt) { processTemplate(r, rt); }); } 
        else if (template.needsOpraForm) { showOpraPrompt(extractTargetNickname(), function(tn) { processTemplate(tn); }); } 
        else if (template.needsSecondDate) { showCustomDatePrompt(function(sd) { processTemplate(sd); }); } 
        else { processTemplate(); }
    }

    function startHelper() {
        if (isStarted) return;
        isStarted = true;

        if (window.AH_Visuals) window.AH_Visuals.init(CONFIG);
        
        let AH_DATA = window.AH_TEMPLATES ? window.AH_TEMPLATES(CONFIG) : { MENU: {}, HOTKEYS: {} };
        let MENU = AH_DATA.MENU; let HOTKEYS = AH_DATA.HOTKEYS;

        function reloadMenu() { AH_DATA = window.AH_TEMPLATES ? window.AH_TEMPLATES(CONFIG) : { MENU: {}, HOTKEYS: {} }; MENU = AH_DATA.MENU; HOTKEYS = AH_DATA.HOTKEYS; }
        
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createButtons); else createButtons();
        enhanceXenForoMenus(document.body);
        
        let obsTo;
        new MutationObserver(function(m) {
            if (m.some(function(x) { return x.addedNodes.length > 0; })) {
                clearTimeout(obsTo);
                obsTo = setTimeout(function() { 
                    enhanceXenForoMenus(document.body); 
                    createButtons(); 
                    if (window.AH_Visuals) window.AH_Visuals.onDOMUpdate();
                }, 200);
            }
        }).observe(document.body, { childList: true, subtree: true });
        
        document.addEventListener('click', function(e) {
            if (e.target.closest('#quick_reply')) {
                if (typeof XF !== 'undefined' && XF.alert) XF.alert(`<div class="custom-modal-grid quick_reply_container">${renderMainMenu(MENU)}</div>`, ' ');
                return;
            }
            
            if (e.target.closest('.manage_custom_btn')) { const c = e.target.closest('.quick_reply_container'); if (c) c.innerHTML = renderCustomManager(CONFIG); return; }

            if (e.target.closest('#cm_add_btn')) {
                const container = e.target.closest('.quick_reply_container');
                const cat = container.querySelector('#cm_cat').value.trim() || 'Общие';
                const title = container.querySelector('#cm_title').value.trim();
                const text = container.querySelector('#cm_text').value.trim();
                if (title && text) {
                    if (!CONFIG.customTemplates) CONFIG.customTemplates = [];
                    CONFIG.customTemplates.push({ category: cat, title: title, text: text });
                    window.dispatchEvent(new CustomEvent('AH_SAVE_CONFIG', { detail: { customTemplates: CONFIG.customTemplates } }));
                    reloadMenu(); container.innerHTML = renderCustomManager(CONFIG);
                }
                return;
            }

            if (e.target.closest('.delete_custom_btn')) {
                const btn = e.target.closest('.delete_custom_btn'); const idx = parseInt(btn.dataset.idx);
                CONFIG.customTemplates.splice(idx, 1);
                window.dispatchEvent(new CustomEvent('AH_SAVE_CONFIG', { detail: { customTemplates: CONFIG.customTemplates } }));
                reloadMenu();
                const container = btn.closest('.quick_reply_container'); container.innerHTML = renderCustomManager(CONFIG);
                return;
            }
            
            const catBtn = e.target.closest('.category_button');
            if (catBtn) { const c = catBtn.closest('.quick_reply_container'); if (c) c.innerHTML = MENU[catBtn.dataset.category].subcategories ? renderSubCategories(MENU, catBtn.dataset.category) : renderTemplates(MENU, catBtn.dataset.category, null); return; }
            
            const subBtn = e.target.closest('.subcategory_button');
            if (subBtn) { const c = subBtn.closest('.quick_reply_container'); if (c) c.innerHTML = renderTemplates(MENU, subBtn.dataset.category, subBtn.dataset.subcategory); return; }
            
            if (e.target.closest('.back_to_main')) { const c = e.target.closest('.quick_reply_container'); if (c) c.innerHTML = renderMainMenu(MENU); return; }
            
            if (e.target.closest('.back_to_subcategory')) { const btn = e.target.closest('.back_to_subcategory'); const c = btn.closest('.quick_reply_container'); if (c) c.innerHTML = renderSubCategories(MENU, btn.dataset.category); return; }
            
            const quickBtn = e.target.closest('.quick_button');
            if (quickBtn) {
                const category = quickBtn.dataset.skey ? MENU[quickBtn.dataset.tkey].subcategories[quickBtn.dataset.skey] : MENU[quickBtn.dataset.tkey];
                executeTemplate(category.templates[quickBtn.dataset.idx]);
            }
        });

        document.addEventListener('keydown', function(e) {
            if (["F1", "F2", "F3", "F4", "F5"].includes(e.key)) {
                const template = HOTKEYS[e.key];
                if (template) { e.preventDefault(); executeTemplate(template); }
            }
        });

        window.addEventListener('AH_SAVE_CONFIG', function(e) {
            Object.assign(CONFIG, e.detail);
        });
    }

    let waitInterval = setInterval(function() {
        const configTag = document.getElementById('arizona-ext-config');
        if (configTag) {
            clearInterval(waitInterval);
            try { Object.assign(CONFIG, JSON.parse(configTag.textContent)); } catch (e) { }
            
            try {
                let localCfg = JSON.parse(localStorage.getItem('AH_VISUAL_CONFIG'));
                if (localCfg) Object.assign(CONFIG, localCfg);
            } catch(e) {}
            
            startHelper();
        }
    }, 50);
    
    setTimeout(function() { if (!isStarted) { clearInterval(waitInterval); startHelper(); } }, 2000);
})();