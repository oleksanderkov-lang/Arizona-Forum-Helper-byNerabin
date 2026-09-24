let CONFIG = {
    gender: "Male",
    nickname: "Nick Name",
    organization: "LSPD",
    signature: "byNerabin",
    discordWebhook: "",
    themeColor: "#3498db",
    themeTextColor: "#ffffff",
    tagTextColor: "#ffffff",
    blurEnabled: false,
    blurIntensity: 15, 
    particlesEnabled: true,
    customBgEnabled: true,
    pFading: true,
    pShape: "circle",
    pEmojiText: "🌸,✨,🔥",
    pLines: true,
    pCount: 70,
    pSpeed: 0.5,
    pColor: "#3498db",
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

let isStarted = false;
const RULES_DB = [];

// Главная функция запуска расширения
function startHelper() {
    if (isStarted) return;
    isStarted = true;

    syncRulesDatabase(); // Подтягивается из database.js

    if (window.AH_Visuals) window.AH_Visuals.init(CONFIG);
    
    let AH_DATA = window.AH_TEMPLATES ? window.AH_TEMPLATES(CONFIG) : { MENU: {}, HOTKEYS: {} };
    let MENU = AH_DATA.MENU; 
    let HOTKEYS = AH_DATA.HOTKEYS;

    // Глобальная функция обновления меню (вызывается при добавлении своих форм)
    window.reloadMenu = function() { 
        AH_DATA = window.AH_TEMPLATES ? window.AH_TEMPLATES(CONFIG) : { MENU: {}, HOTKEYS: {} }; 
        MENU = AH_DATA.MENU; 
        HOTKEYS = AH_DATA.HOTKEYS; 
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButtons); 
    } else {
        createButtons();
    }
    
    enhanceXenForoMenus(document.body);
    initSmartNav();
    moveFilters();
    
    let obsTo;
    new MutationObserver(function(m) {
        let shouldUpdate = false;
        for (let i = 0; i < m.length; i++) {
            if (m[i].addedNodes.length > 0) {
                shouldUpdate = true;
                break;
            }
        }
        if (shouldUpdate) {
            clearTimeout(obsTo);
            obsTo = setTimeout(function() { 
                enhanceXenForoMenus(document.body); 
                createButtons(); 
                initSmartNav();
                moveFilters();
                if (window.AH_Visuals) window.AH_Visuals.onDOMUpdate();
            }, 250); 
        }
    }).observe(document.body, { childList: true, subtree: true });
    
    // Глобальный слушатель кликов
    document.addEventListener('click', function(e) {
        if (e.target.closest('#quick_reply')) {
            if (typeof XF !== 'undefined' && XF.alert) XF.alert(`<div class="custom-modal-grid quick_reply_container">${renderMainMenu(MENU)}</div>`, ' ');
            return;
        }
        
        if (e.target.closest('.manage_custom_btn')) { 
            const c = e.target.closest('.quick_reply_container'); 
            if (c) c.innerHTML = renderCustomManager(CONFIG); 
            return; 
        }

        if (e.target.closest('#cm_add_btn')) {
            const container = e.target.closest('.quick_reply_container');
            const cat = escapeHtml(container.querySelector('#cm_cat').value.trim() || 'Общие');
            const title = escapeHtml(container.querySelector('#cm_title').value.trim().substring(0, 100));
            const text = escapeHtml(container.querySelector('#cm_text').value.trim());
            
            if (title && text) {
                if (!CONFIG.customTemplates) CONFIG.customTemplates = [];
                CONFIG.customTemplates.push({ category: cat, title: title, text: text });
                window.dispatchEvent(new CustomEvent('AH_SAVE_CONFIG', { detail: { customTemplates: CONFIG.customTemplates } }));
                window.reloadMenu(); 
                container.innerHTML = renderCustomManager(CONFIG);
            }
            return;
        }

        if (e.target.closest('.delete_custom_btn')) {
            const btn = e.target.closest('.delete_custom_btn'); const idx = parseInt(btn.dataset.idx);
            CONFIG.customTemplates.splice(idx, 1);
            window.dispatchEvent(new CustomEvent('AH_SAVE_CONFIG', { detail: { customTemplates: CONFIG.customTemplates } }));
            window.reloadMenu();
            const container = btn.closest('.quick_reply_container'); 
            container.innerHTML = renderCustomManager(CONFIG);
            return;
        }
        
        const catBtn = e.target.closest('.category_button');
        if (catBtn) { 
            const c = catBtn.closest('.quick_reply_container'); 
            if (c) c.innerHTML = MENU[catBtn.dataset.category].subcategories ? renderSubCategories(MENU, catBtn.dataset.category) : renderTemplates(MENU, catBtn.dataset.category, null); 
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
            const category = quickBtn.dataset.skey ? MENU[quickBtn.dataset.tkey].subcategories[quickBtn.dataset.skey] : MENU[quickBtn.dataset.tkey];
            executeTemplate(category.templates[quickBtn.dataset.idx]);
        }
    });

    // Глобальный слушатель горячих клавиш
    document.addEventListener('keydown', function(e) {
        if (e.key === "F6") {
            e.preventDefault();
            if (typeof XF !== 'undefined' && XF.alert) XF.alert(`<div class="custom-modal-grid quick_reply_container">${renderMainMenu(MENU)}</div>`, ' ');
            return;
        }
        if (["F1", "F2", "F3", "F4", "F5"].includes(e.key)) {
            const template = HOTKEYS[e.key];
            if (template) { e.preventDefault(); executeTemplate(template); }
        }
    });

    // Слушатель сохранения настроек
    window.addEventListener('AH_SAVE_CONFIG', function(e) {
        Object.assign(CONFIG, e.detail);
        autoDetectConfig();
    });
}

// Первичная инициализация скрипта (ждет мост из popup)
let waitInterval = setInterval(function() {
    const configTag = document.getElementById('arizona-ext-config');
    if (configTag) {
        clearInterval(waitInterval);
        try { Object.assign(CONFIG, JSON.parse(configTag.textContent)); } catch (e) { }
        autoDetectConfig();
        startHelper();
    }
}, 50);

setTimeout(function() { 
    if (!isStarted) { 
        clearInterval(waitInterval); 
        startHelper(); 
    } 
}, 2000);