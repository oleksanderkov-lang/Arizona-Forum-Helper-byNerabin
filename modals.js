// --- ОТРИСОВКА МЕНЮ ШАБЛОНОВ И ФОРМ (F6) ---

function renderMainMenu(MENU) {
    let html = Object.keys(MENU).map(function(k) {
        return `<input type="button" class="button custom-forum-btn category_button" value="${MENU[k].title}" data-category="${k}">`;
    }).join('');
    
    html += `<div style="width:100%; margin-top:15px; padding-top:15px; border-top:1px solid var(--ah-border-fallback); text-align:center;">
                <input type="button" class="button custom-forum-btn manage_custom_btn" value="Формы">
             </div>`;
    return html;
}

function renderSubCategories(MENU, cKey) {
    const c = MENU[cKey];
    let html = `<div style="width:100%; text-align:center; margin-bottom:15px; color:#fff; font-size:16px; font-weight:bold; flex-basis:100%; text-transform: uppercase;">${c.title}</div>`;
    html += Object.keys(c.subcategories).map(function(sk) {
        return `<input type="button" class="button custom-forum-btn subcategory_button" value="${c.subcategories[sk].title}" data-category="${cKey}" data-subcategory="${sk}">`;
    }).join('');
    html += `<div style="width:100%; text-align:center; margin-top:15px; flex-basis:100%;"><input type="button" class="button custom-forum-btn back_to_main" value="Назад"></div>`;
    return html;
}

function renderTemplates(MENU, cKey, sKey) {
    const cat = sKey ? MENU[cKey].subcategories[sKey] : MENU[cKey];
    if (!cat || !cat.templates) return '';
    
    const title = sKey ? `${MENU[cKey].title} > ${cat.title}` : cat.title;
    let html = `<div style="width:100%; text-align:center; margin-bottom:15px; color:#fff; font-size:16px; font-weight:bold; flex-basis:100%; text-transform: uppercase;">${title}</div>`;
    html += cat.templates.map(function(tpl, i) {
        return `<input type="button" class="button custom-forum-btn quick_button js-overlayClose" value="${escapeHtml(tpl.title)}" data-tkey="${cKey}" data-skey="${sKey||''}" data-idx="${i}">`;
    }).join('');
    const backClass = sKey ? 'back_to_subcategory' : 'back_to_main';
    const backData = sKey ? `data-category="${cKey}"` : '';
    html += `<div style="width:100%; text-align:center; margin-top:15px; flex-basis:100%;"><input type="button" class="button custom-forum-btn ${backClass}" ${backData} value="Назад"></div>`;
    return html;
}

function renderCustomManager(config) {
    let html = `
    <div style="width:100%; display:block; text-align:left;">
        <style>
            .cm-input { width: 100%; box-sizing: border-box; padding: 12px; background: #1a1a20; border: 1px solid #333; color: #fff; border-radius: 8px; outline: none; margin-bottom: 12px; font-family: inherit; font-size: 13px; transition: 0.3s; }
            .cm-input:focus { border-color: var(--ah-accent); box-shadow: 0 0 10px var(--ah-glow); }
            .cm-item { display:flex; justify-content:space-between; align-items:center; background:#19191e; padding:10px 14px; margin-bottom:6px; border-radius:8px; border:1px solid #333; font-size:13px; transition: 0.2s; }
            .cm-item:hover { background: #252530; border-color: var(--ah-accent); }
            .cm-btn { padding: 12px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid #333; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; width: 100%; text-transform: uppercase; margin-bottom: 15px; }
            .cm-btn:hover { background: var(--ah-btn-h); border-color: var(--ah-accent); color: var(--ah-accent); box-shadow: 0 4px 15px var(--ah-glow); }
            .cm-btn:active { transform: scale(0.97); }
        </style>
        <h3 style="margin: 0 0 20px 0; color: var(--ah-accent); text-align: center; text-transform: uppercase; font-weight: 800;">Управление формами</h3>`;
    
    if (config.customTemplates && config.customTemplates.length > 0) {
        html += `<div style="max-height: 180px; overflow-y: auto; margin-bottom: 20px; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px;" class="v-scroll">`;
        config.customTemplates.forEach((tpl, i) => {
            let cat = escapeHtml(tpl.category || 'Общие');
            let tTitle = escapeHtml(tpl.title.substring(0,30));
            html += `<div class="cm-item">
                <span><b style="color:var(--ah-accent);">[${cat}]</b> ${tTitle}</span>
                <span class="delete_custom_btn" data-idx="${i}" style="color:#e74c3c; cursor:pointer; font-weight:bold; font-size:15px; padding:4px; transition: 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">✖</span>
            </div>`;
        });
        html += `</div>`;
    } else {
        html += `<div style="text-align:center; color:#888; font-size:13px; margin-bottom:20px;">Нет своих форм.</div>`;
    }

    html += `
        <input type="text" id="cm_cat" class="cm-input" placeholder="Папка" autocomplete="off">
        <input type="text" id="cm_title" class="cm-input" placeholder="Кнопка" autocomplete="off">
        <textarea id="cm_text" class="cm-input" rows="3" placeholder="HTML или BB-код формы..." style="resize:vertical;"></textarea>
        <button id="cm_add_btn" class="cm-btn">Добавить</button>
        <div style="text-align:center; border-top: 1px solid #333; padding-top: 15px;"><input type="button" class="button custom-forum-btn back_to_main" value="В меню" style="margin:0;"></div>
    </div>`;
    return html;
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ОКОН ---

function closeModal(overlay) {
    overlay.classList.add('ah-closing');
    setTimeout(function() {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
    }, 250);
}

// --- ОКНО ОТКАЗА ЖАЛОБЫ (F5) ---

function showRefusePrompt(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'ah-modal-overlay';
    overlay.innerHTML = `
        <div class="ah-modal-box" style="width: 480px;">
            <style>
                .v-group { margin-bottom: 16px; text-align: left; display: block; position: relative; }
                .v-label { font-size: 11px; color: #aaa; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; display: block; }
                .v-input { width: 100%; box-sizing: border-box; padding: 12px; background: #1a1a20; border: 1px solid #333; color: #fff; border-radius: 8px; outline: none; transition: 0.3s; font-family: inherit; font-size: 13px; }
                .v-input:focus { border-color: var(--ah-accent); box-shadow: 0 0 10px var(--ah-glow); }
            </style>
            <h3 style="margin: 0 0 24px 0; color: var(--ah-accent); text-align: center; text-transform: uppercase; font-weight: 800;">Отказ жалобы</h3>
            
            <div class="v-group">
                <label class="v-label">Причина отказа (Умный поиск)</label>
                <input type="text" id="r-search" class="v-input" placeholder="Поиск: время, качество, мат..." autocomplete="off">
                <div id="r-dropdown" class="v-scroll ah-dropdown-animated" style="display:none; position:absolute; top:100%; left:0; right:0; background: #19191e; border: 1px solid #333; border-radius: 8px; max-height: 180px; overflow-y: auto; z-index: 10; margin-top: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);"></div>
            </div>
            
            <div class="v-group">
                <label class="v-label">Текст в форму</label>
                <textarea id="r-reason" class="v-input" rows="2" placeholder="Здесь появится причина..." style="resize: vertical;"></textarea>
            </div>
            
            <div class="v-group">
                <label class="v-label">Пункт правил (Необязательно)</label>
                <input type="text" id="r-rule" class="v-input" placeholder="Раздел, Пункт...">
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 28px;">
                <button id="r-cancel" class="ah-btn-cancel" style="flex:1;">Отмена</button>
                <button id="r-submit" class="ah-btn-error" style="flex:1;">Отказать</button>
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
            const frag = document.createDocumentFragment();
            matches.forEach(function(ruleText) {
                const div = document.createElement('div');
                div.className = 'ah-dropdown-item';
                div.textContent = ruleText;
                div.addEventListener('click', function() { 
                    reasonInput.value = ruleText; 
                    searchInput.value = ''; 
                    dropdown.style.display = 'none'; 
                });
                frag.appendChild(div);
            });
            dropdown.appendChild(frag);
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

// --- ОКНО ЗАПРОСА ОПРЫ ---

function showOpraPrompt(extractedName, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'ah-modal-overlay';
    const author = extractAuthorNickname();
    
    overlay.innerHTML = `
        <div class="ah-modal-box" style="width: 360px; text-align: center;">
            <h3 style="margin: 0 0 20px 0; color: var(--ah-accent); text-transform: uppercase;">Запрос опры</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="o-btn ah-btn-cancel" data-val="игрока ${escapeHtml(extractedName)}">У игрока</button>
                <button class="o-btn ah-btn-cancel" data-val="автора ${escapeHtml(author)}">У автора</button>
                <button class="o-btn ah-btn-submit" data-val="игрока ${escapeHtml(extractedName)} и автора ${escapeHtml(author)}">У обоих</button>
            </div>
            <button id="o-cancel" class="ah-btn-error" style="margin-top:20px; width:100%;">Отмена</button>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.o-btn').forEach(function(b) {
        b.addEventListener('click', function(e) { callback(e.target.dataset.val); closeModal(overlay); });
    });

    overlay.querySelector('#o-cancel').addEventListener('click', function() { closeModal(overlay); });
    overlay.addEventListener('mousedown', function(e) { if (e.target === overlay) closeModal(overlay); });
}

// --- ОКНО ВЫДАЧИ НАКАЗАНИЙ (F4) ---

function showVerdictPrompt(callback) {
    const threadMatch = window.location.href.match(/threads\/(?:.*?\.)?(\d+)/i);
    const threadId = threadMatch ? threadMatch[1] : "000000";
    
    const adminNameEl = document.querySelector('.p-navgroup-link--user .p-navgroup-linkText') || document.querySelector('.p-navgroup-linkText');
    let adminName = adminNameEl ? adminNameEl.textContent.trim() : (CONFIG.nickname || "Admin");
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
                .v-input { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 10px 12px !important; background: #1a1a20 !important; border: 1px solid #333 !important; color: #fff !important; border-radius: 8px !important; outline: none !important; transition: border-color 0.3s, box-shadow 0.3s !important; font-size: 13px !important; font-family: inherit !important; margin: 0 !important; height: auto !important; }
                .v-input:focus { border-color: var(--ah-accent) !important; box-shadow: 0 0 10px var(--ah-glow) !important; }
            </style>
            <h3 style="margin: 0 0 20px 0; color: var(--ah-accent); text-align: center; text-transform: uppercase; font-weight: 800;">Выдача наказания</h3>
            
            <label class="ah-f4-toggle-wrap" style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px; cursor: pointer; background: rgba(0, 0, 0, 0.2); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
                <div class="ah-f4-toggle" style="position: relative; width: 36px; height: 20px; flex-shrink: 0;">
                    <input type="checkbox" id="ah-short-reply" style="opacity: 0; width: 0; height: 0; position: absolute;">
                    <span class="ah-f4-slider" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.1); border-radius: 20px; transition: 0.3s;"></span>
                </div>
                <span style="font-size: 12px; color: #fff; font-weight: 600;">Скрытый ответ (на форум только "Закрыто")</span>
            </label>

            <div class="v-group">
                <label class="v-label">Пункт правил (Поиск)</label>
                <input type="text" id="v-rule-search" class="v-input" placeholder="Поиск: дм, офф, лив, фа, оффтоп..." autocomplete="off">
                <div id="v-rule-dropdown" class="v-scroll ah-dropdown-animated" style="display:none; position:absolute; top:100%; left:0; right:0; background: #19191e; border: 1px solid #333; border-radius: 8px; max-height: 180px; overflow-y: auto; z-index: 10; margin-top: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);"></div>
            </div>

            <div id="v-log-group" class="v-group" style="display: none;">
                <label class="v-label" style="color: #e74c3c;">Лог</label>
                <input type="text" id="v-log" class="v-input" style="border-color: rgba(231,76,60,0.5);">
            </div>
            
            <div id="v-punish-list" style="display: none; margin-bottom: 16px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);"></div>

            <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.2); margin-bottom: 16px;">
                <div class="v-group">
                    <label class="v-label">Кому?</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="v-player" class="v-input" value="${escapeHtml(extractedName)}">
                        <button id="btn-author" class="ah-btn-cancel" style="flex: 0 0 auto; padding: 10px !important;">Автор</button>
                        <button id="btn-target" class="ah-btn-cancel" style="flex: 0 0 auto; padding: 10px !important;">Игрок</button>
                    </div>
                </div>

                <div id="v-history-warning" style="display:none; margin-bottom:12px; padding:10px; background:rgba(231,76,60,0.15); border:1px solid #e74c3c; border-radius:8px; color:#ff6b6b; font-size:12px; line-height: 1.4;"></div>

                <div style="display: flex; gap: 12px;">
                 <div class="v-group" style="flex: 1; position: relative;">
                        <label class="v-label">Мера</label>
                        <div id="v-type-display" class="v-input" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                            <span id="v-type-text">ТСР / Деморган</span>
                            <span style="font-size: 10px; color: var(--ah-accent);">▼</span>
                        </div>
                        <input type="hidden" id="v-type" value="jailoff">
                        <div id="v-type-options" class="v-scroll ah-dropdown-animated" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #19191e; border: 1px solid #333; border-radius: 8px; z-index: 20; margin-top: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); overflow: hidden;">
                            <div class="v-opt ah-dropdown-item" data-val="jailoff">ТСР / Деморган</div>
                            <div class="v-opt ah-dropdown-item" data-val="muteoff">Мут</div>
                            <div class="v-opt ah-dropdown-item" data-val="banoff">Бан</div>
                            <div class="v-opt ah-dropdown-item" data-val="warnoff">Варн</div>
                            <div class="v-opt ah-dropdown-item" data-val="driverbanoff">Бан вожд.</div>
                            <div class="v-opt ah-dropdown-item" data-val="gunbanoff">Ганбан</div>
                            <div class="v-opt ah-dropdown-item" data-val="banfa">Бан ФА</div>
                        </div>
                    </div>
                    <div class="v-group" style="flex: 1;">
                        <label class="v-label">Срок/Уровень</label>
                        <input type="text" id="v-time" class="v-input" placeholder="Например: 30">
                    </div>
                </div>

                <div class="v-group" style="margin-bottom: 8px !important;">
                    <label class="v-label">Причина</label>
                    <input type="text" id="v-reason" class="v-input" placeholder="Например: ДМ">
                </div>
                
               <button id="v-add-btn" class="ah-btn-success" style="width: 100%; margin-top: 10px;">Добавить в список</button>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <button id="v-cancel" class="ah-btn-cancel" style="flex: 1;">Отмена</button>
                <button id="v-submit" class="ah-btn-submit" style="flex: 1;">Выдать всё</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const shortToggle = overlay.querySelector('#ah-short-reply');
    if (shortToggle) {
        shortToggle.addEventListener('change', (e) => {
            e.target.nextElementSibling.style.background = e.target.checked ? 'rgba(52, 152, 219, 0.5)' : 'rgba(255,255,255,0.1)';
        });
    }

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
    const typeDisplay = overlay.querySelector('#v-type-display');
    const typeOptions = overlay.querySelector('#v-type-options');
    const typeText = overlay.querySelector('#v-type-text');

    typeDisplay.addEventListener('click', function() {
        typeOptions.style.display = typeOptions.style.display === 'none' ? 'block' : 'none';
    });

    overlay.querySelectorAll('.v-opt').forEach(function(opt) {
        opt.addEventListener('click', function() {
            typeSelect.value = this.dataset.val; 
            typeText.textContent = this.textContent; 
            typeOptions.style.display = 'none';
        });
    });

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
        'арест': ['арест', 'коп', 'полиц'],
        'кар': ['вождени', 'прав', 'кар', 'транспорт'],
        'оружи': ['оружи', 'ганбан', 'ган'],
        'мут': ['заглушк', 'мут'],
        'варн': ['предупрежден', 'варн'],
        'тср': ['jail', 'тср'],
        'фа': ['фа', 'форумн', 'оффтоп', 'профил', 'набив']
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
            warningDiv.innerHTML = `⚠️ Игрок <b>${escapeHtml(pName)}</b> наказывался за это ${timeStr}.`;
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
            const frag = document.createDocumentFragment();
            matches.forEach(function(rule) {
                const div = document.createElement('div');
                div.className = 'ah-dropdown-item';
                div.textContent = rule.text;
                div.addEventListener('click', function() {
                    searchInput.value = rule.text; selectedRuleText = rule.text; reasonInput.value = rule.reason;
                    if (rule.type) {
                        typeSelect.value = rule.type;
                        const selectedOpt = overlay.querySelector(`.v-opt[data-val="${rule.type}"]`);
                        if (selectedOpt) typeText.textContent = selectedOpt.textContent;
                    }
                    if (rule.time !== undefined) timeInput.value = rule.time;
                    dropdown.style.display = 'none';
                    overlay.querySelector('#v-log-group').style.display = (rule.text.toLowerCase().includes('офф') || rule.text.toLowerCase().includes('выход')) ? 'block' : 'none';
                    checkPlayerHistory();
                });
                frag.appendChild(div);
            });
            dropdown.appendChild(frag);
            dropdown.style.display = 'block';
        } else { dropdown.style.display = 'none'; }
    });

    overlay.addEventListener('mousedown', function(e) { 
        if (e.target !== searchInput && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none'; 
        }
        if (e.target !== typeDisplay && !typeDisplay.contains(e.target) && !typeOptions.contains(e.target)) {
            typeOptions.style.display = 'none';
        }
        if (e.target === overlay) closeModal(overlay);
    });

    function renderList() {
        if(punishments.length === 0) { listDiv.style.display = 'none'; return; }
        listDiv.style.display = 'block';
        listDiv.innerHTML = punishments.map(function(p, i) {
            let tName = p.type;
            if (p.type==='jailoff') tName = 'ТСР/Деморган'; else if (p.type==='muteoff') tName = 'Мут'; else if (p.type==='banoff') tName = 'Бан'; else if (p.type==='warnoff') tName = 'Варн'; else if (p.type==='driverbanoff') tName = 'Бан вожд.'; else if (p.type==='gunbanoff') tName = 'Ганбан'; else if (p.type==='banfa') tName = 'Бан ФА';
            return `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:6px; margin-bottom:4px; font-size:12px; border: 1px solid rgba(255,255,255,0.1);">
                <span><b style="color:var(--ah-accent);">${escapeHtml(p.player)}</b>: ${tName} (${escapeHtml(p.time)||'-'}) - ${escapeHtml(p.reason)}</span>
                <span class="v-del-p" data-idx="${i}" style="cursor:pointer; color:#e74c3c;">✖</span>
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

    overlay.querySelector('#v-submit').addEventListener('click', async function() {
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

        const logLine = overlay.querySelector('#v-log') ? overlay.querySelector('#v-log').value.trim() : "";
        let punishmentsHtml = "";
        let commandsStr = "";
        let rulesSet = new Set(); 

        if (!CONFIG.punishmentHistory) CONFIG.punishmentHistory = [];

        let extractedPostUrl = "";
        let fetchedFaProfile = "ВСТАВЬТЕ_ССЫЛКУ_НА_ФОРУМНИК";
        
        if (punishments.some(p => p.type === 'banfa')) {
            const firstPost = document.querySelector('.message-inner .message-body .bbWrapper');
            if (firstPost) {
                const links = Array.from(firstPost.querySelectorAll('a'));
                const targetLink = links.find(a => a.href.includes('forum.arizona-rp.com') && (a.href.includes('post-') || a.href.includes('/posts/')));
                
                if (targetLink) {
                    extractedPostUrl = targetLink.href;
                } else {
                    const rawMatch = firstPost.innerText.match(/https?:\/\/forum\.arizona-rp\.com\/(?:threads\/\S*post-\d+|posts\/\d+\/?)/i);
                    if (rawMatch) extractedPostUrl = rawMatch[0];
                }
            }

            if (extractedPostUrl) {
                try {
                    const btnSubmit = overlay.querySelector('#v-submit');
                    const origText = btnSubmit.textContent;
                    btnSubmit.textContent = "Ищем профиль...";
                    btnSubmit.style.pointerEvents = "none";
                    btnSubmit.style.opacity = "0.7";

                    const response = await fetch(extractedPostUrl);
                    const htmlText = await response.text();
                    const doc = new DOMParser().parseFromString(htmlText, 'text/html');

                    let postIdMatch = extractedPostUrl.match(/post-(\d+)/) || extractedPostUrl.match(/\/posts\/(\d+)/);
                    if (postIdMatch) {
                        let postId = postIdMatch[1];
                        let postElement = doc.querySelector(`[data-content="post-${postId}"], #js-post-${postId}, article[id*="post-${postId}"]`);
                        if (postElement) {
                            let userLink = postElement.querySelector('.message-name a, .message-userDetails a.username, .message-avatar-wrapper a');
                            if (userLink && userLink.href) {
                                fetchedFaProfile = "https://forum.arizona-rp.com" + new URL(userLink.href, window.location.origin).pathname;
                            }
                        }
                    }
                    btnSubmit.textContent = origText;
                    btnSubmit.style.pointerEvents = "auto";
                    btnSubmit.style.opacity = "1";
                } catch (e) {
                    console.error("Ошибка парсинга профиля:", e);
                }
            }
        }

        punishments.forEach(function(p) {
            let fullPun = "";
            if (p.type === 'jailoff') fullPun = p.time ? `ТСР ${p.time}-го уровня` : "ТСР";
            else if (p.type === 'muteoff') fullPun = p.time ? `мут на ${p.time} минут` : "мут";
            else if (p.type === 'banoff') fullPun = p.time ? `бан на ${p.time} дней` : "бан";
            else if (p.type === 'warnoff') fullPun = "варн";
            else if (p.type === 'driverbanoff') fullPun = p.time ? `бан вождения на ${p.time} дней` : "бан вождения";
            else if (p.type === 'gunbanoff') fullPun = p.time ? `бан оружия на ${p.time} дней` : "бан оружия";
            else if (p.type === 'banfa') fullPun = "бан ФА";
            
            let whoStr = `Игрок ${escapeHtml(p.player)}`;
            if (p.player === "Player_Name" || p.player === "Author_Name" || p.type === 'banfa') {
                whoStr = p.type === 'banfa' ? "Пользователь" : "Игрок";
            }
            
            punishmentsHtml += `<p>${whoStr} получит ${fullPun} за ${escapeHtml(p.type === 'banfa' ? getShortFaReason(p.ruleText || p.reason) : p.reason)}.</p>`;
            
            if (p.type === 'banfa') {
                let faPostLink = extractedPostUrl || window.location.href.split('#')[0].split('page-')[0];
                let faReasonStr = `жб${threadId}(${getShortFaReason(p.ruleText || p.reason)})`;
                
                commandsStr += `Форма: Ссылка на форумный аккаунт: ${fetchedFaProfile}\nПричина(с Вашим префиксом, с указанием сообщения): ${faPostLink} ${faReasonStr} ${adminTag}\nПинг: @Куратор сервера\n\n`;
            } else {
                commandsStr += `/${p.type} ${p.player}${p.time ? " " + p.time : ""} жб${threadId} ${adminTag}\n`;
            }
            
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
        if (commandsStr.trim().length > 0) {
            sendToDiscordLog(commandsStr.trim());
        }
        closeModal(overlay);
    });

    overlay.querySelector('#v-cancel').addEventListener('click', function() {
        closeModal(overlay);
    });
}

// --- ОКНО ВЫБОРА ДАТЫ ---

function showCustomDatePrompt(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'ah-modal-overlay';
    const now = new Date();
    
    overlay.innerHTML = `
        <div class="ah-modal-box" style="width: 340px; text-align: center;">
            <h4 style="margin: 0 0 20px 0; color: var(--ah-accent); text-transform: uppercase;">Дата</h4>
            <div style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-bottom: 20px;">
                <input type="text" id="cd-day" value="${String(now.getDate()).padStart(2, '0')}" style="width: 50px; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; text-align: center;">
                <input type="text" id="cd-month" value="${String(now.getMonth() + 1).padStart(2, '0')}" style="width: 50px; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; text-align: center;">
                <input type="text" id="cd-year" value="${now.getFullYear()}" style="width: 70px; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; text-align: center;">
            </div>
           <div style="display: flex; gap: 10px; justify-content: center;">
                <button class="cd-q" data-add="1">+1</button>
                <button class="cd-q" data-add="3">+3</button>
                <button class="cd-q" data-add="7">+7</button>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 24px;">
                <button id="cd-cancel" class="ah-btn-cancel" style="flex:1;">Отмена</button>
                <button id="cd-submit" class="ah-btn-submit" style="flex:1;">Вставить</button>
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