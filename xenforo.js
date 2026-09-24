// --- ИНТЕГРАЦИЯ С ДВИЖКОМ XENFORO ---

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

function createButtons() {
    const btn = document.getElementById('quick_reply');
    if (btn) btn.remove();
}

function moveFilters() {
    const filterBar = document.querySelector('.filterBar');
    const btnGroup = document.querySelector('.p-body-pageContent .block-outer-opposite .buttonGroup');
    if (filterBar && btnGroup && !btnGroup.contains(filterBar)) {
        btnGroup.appendChild(filterBar);
    }
    const blockFilterBar = document.querySelector('.block-filterBar');
    if (blockFilterBar && blockFilterBar.children.length === 0) {
        blockFilterBar.style.display = 'none';
    }
}

function enhanceXenForoMenus(targetNode) {
    targetNode.querySelectorAll('.menu-content').forEach(function(menu) {
        const header = menu.querySelector('.menu-header');
        if (header && header.textContent.includes('Дополнительно') && !menu.dataset.ahInit) {
            menu.dataset.ahInit = 'true';
            
            const editLink = menu.querySelector('a[href*="/edit"]');
            if (!editLink) return; 

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
                    const button = e.currentTarget; const prefixId = button.dataset.prefix; 
                    const ogText = button.textContent; button.textContent = '⏳...'; button.style.pointerEvents = 'none';
                    try {
                        const response = await fetch(editLink.href); const html = await response.text(); const doc = new DOMParser().parseFromString(html, 'text/html');
                        const token = doc.querySelector('input[name="_xfToken"]').value;
                        
                        const formData = new URLSearchParams();
                        formData.append('_xfToken', token);
                        formData.append('title', doc.querySelector('input[name="title"]').value);
                        formData.append('prefix_id', prefixId);
                        
                        // Обязательные маркеры для XenForo
                        formData.append('_xfSet[discussion_open]', '1');
                        formData.append('_xfSet[sticky]', '1');

                        if (prefixId === '15') { 
                            // На рассмотрении: открыть и закрепить
                            formData.append('discussion_open', '1');
                            formData.append('sticky', '1');
                        } else if (prefixId === '17' || prefixId === '18') { 
                            // Рассмотрено / Отказано: закрыть и открепить
                        } else {
                            formData.append('discussion_open', '1');
                        }
                        
                        const postResp = await fetch(editLink.href, { method: 'POST', body: formData, headers: { 'Accept': 'application/json, text/javascript, */*; q=0.01', 'X-Requested-With': 'XMLHttpRequest' } });
                        
                        if (postResp.ok) { 
                            button.textContent = '✅'; 
                            setTimeout(function() { location.reload(); }, 500); 
                        } else {
                            throw new Error();
                        }
                    } catch (err) { 
                        button.textContent = '❌'; 
                        setTimeout(function() { button.textContent = ogText; button.style.pointerEvents = 'auto'; }, 2000); 
                    }
                });
            });
        }
    });
}

function initSmartNav() {
    const isThreadList = document.querySelector('.structItemContainer-group');

    if (isThreadList && !document.getElementById('ah-live-filter')) {
        const filterStyle = document.createElement('style');
        filterStyle.textContent = `
            .ah-filter-panel { display: flex; gap: 10px; margin-bottom: 24px; padding: 12px; background: var(--ah-surface); border: 1px solid var(--ah-border-fallback); border-radius: 12px; backdrop-filter: blur(10px); flex-wrap: wrap; align-items: center; }
            .ah-filter-input { flex: 1; min-width: 200px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 10px 15px; border-radius: 8px; outline: none; font-size: 14px; font-family: inherit; transition: 0.3s; }
            .ah-filter-input:focus { border-color: var(--ah-accent); box-shadow: 0 0 10px var(--ah-glow); background: rgba(0, 0, 0, 0.2); }
            .ah-f-btn { background: rgba(255, 255, 255, 0.05); color: #aaa; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.3s; border: 1px solid rgba(255, 255, 255, 0.1); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .ah-f-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: var(--ah-accent); transform: translateY(-2px); color: #fff; }
            .ah-f-btn.active { background: var(--ah-btn-h); border-color: var(--ah-accent); box-shadow: 0 4px 12px var(--ah-glow); color: var(--ah-accent); }
        `;
        document.head.appendChild(filterStyle);

        const filterHtml = `
            <div id="ah-live-filter" class="ah-filter-panel">
                <input type="text" id="ah-f-search" class="ah-filter-input" placeholder="Поиск...">
                <button class="ah-f-btn active" data-filter="all">Все</button>
                <button class="ah-f-btn" data-filter="На рассмотрении">На рассмотрении</button>
                <button class="ah-f-btn" data-filter="none">Новые</button>
            </div>
        `;
        isThreadList.insertAdjacentHTML('beforebegin', filterHtml);

        const searchInp = document.getElementById('ah-f-search');
        const btns = document.querySelectorAll('.ah-f-btn');
        let cFilter = 'all';

        const threads = document.querySelectorAll('.structItem--thread');
        threads.forEach(item => {
            item._ahText = item.innerText.toLowerCase();
            item._ahLabels = Array.from(item.querySelectorAll('.label')).map(l => l.innerText.toLowerCase());
        });

        function apply() {
            const q = searchInp.value.toLowerCase();
            threads.forEach(item => {
                const mt = item._ahText.includes(q);
                let ml = true;
                if (cFilter === 'none') ml = item._ahLabels.length === 0;
                else if (cFilter === 'На рассмотрении') ml = item._ahLabels.some(l => l.includes('на рассмотрении') || l.includes('на рассмотрение га'));
                else if (cFilter !== 'all') ml = item._ahLabels.some(l => l.includes(cFilter.toLowerCase()));

                item.style.setProperty('display', (mt && ml) ? 'flex' : 'none', 'important');
            });
        }

        searchInp.addEventListener('input', apply);
        btns.forEach(b => {
            b.addEventListener('click', e => {
                cFilter = e.target.dataset.filter;
                btns.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                apply();
            });
        });
    }
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
            const shortToggle = document.getElementById('ah-short-reply');
            const isShort = shortToggle ? shortToggle.checked : false;

            if (template.text.length === 5) {
                const p = punishmentsArray[0];
                let fullPun = "";
                if (p.type === 'jailoff') fullPun = p.time ? `ТСР ${p.time}-го уровня` : "ТСР";
                else if (p.type === 'muteoff') fullPun = p.time ? `мут на ${p.time} минут` : "мут";
                else if (p.type === 'banoff') fullPun = p.time ? `бан на ${p.time} дней` : "бан";
                else if (p.type === 'warnoff') fullPun = "варн";
                else if (p.type === 'driverbanoff') fullPun = p.time ? `бан вождения на ${p.time} дней` : "бан вождения";
                else if (p.type === 'gunbanoff') fullPun = p.time ? `бан оружия на ${p.time} дней` : "бан оружия";
                else if (p.type === 'banfa') fullPun = "бан ФА";
                
                processTemplate(p.player, fullPun, p.reason, finalRuleText, logLine, isShort);
            } 
            else {
                processTemplate(punishmentsHtml, finalRuleText, logLine, isShort);
            }
        }); 
    } 
    else if (template.needsRefuseForm) { showRefusePrompt(function(r, rt) { processTemplate(r, rt); }); } 
    else if (template.needsOpraForm) { showOpraPrompt(extractTargetNickname(), function(tn) { processTemplate(tn); }); } 
    else if (template.needsSecondDate) { showCustomDatePrompt(function(sd) { processTemplate(sd); }); } 
    else { processTemplate(); }
}