document.addEventListener('DOMContentLoaded', () => {
    const textFields = ['nickname', 'organization', 'signature', 'discordWebhook', 'pEmojiText'];
    const checkFields = ['blurEnabled', 'customBgEnabled', 'particlesEnabled', 'pFading', 'pLines'];
    const rangeFields = ['pSize', 'pCount', 'pSpeed', 'transparency', 'threadCols', 'blurIntensity'];
    const colorFields = ['themeColor', 'themeTextColor', 'pColor'];
    const hotkeysIds = ['hotkeyF1', 'hotkeyF2', 'hotkeyF3', 'hotkeyF4', 'hotkeyF5'];
    
    let currentHotkeys = { hotkeyF1: "none", hotkeyF2: "none", hotkeyF3: "none", hotkeyF4: "none", hotkeyF5: "none" };

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });

    function hexToRgb(hex) {
        let h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        return { r: parseInt(h.substring(0, 2), 16) || 52, g: parseInt(h.substring(2, 4), 16) || 152, b: parseInt(h.substring(4, 6), 16) || 219 };
    }

    function applyAccentColor(col) {
        document.documentElement.style.setProperty('--accent', col);
        const rgb = hexToRgb(col);
        document.documentElement.style.setProperty('--btn-grad', 'rgba(255, 255, 255, 0.05)');
        document.documentElement.style.setProperty('--btn-grad-hover', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
    }

    function sanitizeHTML(str) {
        if (!str) return "";
        return str.replace(/[<>"'&]/g, function(match) {
            return {'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;'}[match];
        }).trim().substring(0, 100); 
    }

   const defaultSettings = {
        nickname: "Nick Name", organization: "LSPD", signature: "byNerabin", discordWebhook: "",
        themeColor: "#3498db", themeTextColor: "#ffffff", pColor: "#3498db",
        blurEnabled: false, blurIntensity: 15, particlesEnabled: true, customBgEnabled: true, pFading: true,
        pShape: "circle", pEmojiText: "🌸,✨,🔥", pLines: true, pCount: 70, pSpeed: 0.5, pSize: 3,
        transparency: 15, threadCols: 2, customTemplates: [],
        hotkeyF1: "inReview", hotkeyF2: "transferred", hotkeyF3: "wrongFormat", hotkeyF4: "verdict", hotkeyF5: "refuse"
    };

    const resetColorBtn = document.getElementById('resetColor');
    if (resetColorBtn) {
        resetColorBtn.addEventListener('click', () => {
            const el = document.getElementById('themeColor');
            const disp = document.getElementById('themeColorDisplay');
            if (el) el.value = defaultSettings.themeColor;
            if (disp) disp.textContent = defaultSettings.themeColor.toUpperCase();
            applyAccentColor(defaultSettings.themeColor);
        });
    }

    chrome.storage.local.get(defaultSettings, function(items) {
        const categories = [
            {
                label: "👑 Администратор",
                items: [
                    {val: "verdict", text: "Форма Вердикта"}, {val: "refuse", text: "Отказ жалобы"},
                    {val: "jbadm", text: "Ответ ЖБАДМ"}, {val: "jbadmError", text: "Ответ ЖБАДМ (ошибка)"},
                    {val: "inReview", text: "ЖБ на рассмотрении"}, {val: "requestProof", text: "Запрос опровержения"},
                    {val: "wrongFormat", text: "Не по форме"}, {val: "transferred", text: "Передано ст. адм"}
                ]
            },
            {
                label: "⚖️ Суд",
                items: [
                    {val: "takeLawsuit", text: "Принятие иска"}, {val: "requestExplanations", text: "Запрос опры (Суд)"},
                    {val: "courtWrongFormat", text: "Иск не по форме"}, {val: "courtVerdictDefault", text: "Вердикт (Обычный)"},
                    {val: "courtVerdictCriminal", text: "Вердикт Уголовного"}, {val: "courtVerdictFederal", text: "Вердикт Федерального"}
                ]
            },
            {
                label: "🚓 ПД / 👤 Адвокат",
                items: [
                    {val: "pdDefault", text: "Опра в иске (ПД)"}, {val: "playerDefault", text: "Подать исковое заявление"},
                    {val: "lawyerPetition", text: "Ходатайство от адвоката"}, {val: "motionPlaintiff", text: "Ходатайство от истца"},
                    {val: "motionDefendant", text: "Ходатайство от ответчика"}, {val: "addmotionDefendant", text: "Добавление к ход. от ответчика"},
                    {val: "addmotionPlaintiff", text: "Добавление к ход. от истца"}, {val: "addlawyerPetition", text: "Добавление к ход. от адвоката"},
                    {val: "addlawyerPetitionFromPlaintiff", text: "Добавл. адвоката (Истец)"}, {val: "addDefendantPetitionFromPlaintiff", text: "Добавл. адвоката (Ответчик)"}
                ]
            },
            {
                label: "🏛 Лидер/Зам (Гос)",
                items: [
                    {val: "otchetzamaGOV", text: "Отчёт заместителя (Гос)"}, {val: "otchetlideraGOV", text: "Отчёт лидера (Гос)"},
                    {val: "AntiBlatGOV", text: "Подать анти-блат"}, {val: "PrikazMinsraUS", text: "Подать приказ (Министр)"},
                    {val: "ViezdnieMP", text: "Выездное МП"}, {val: "PlanDeistviyMO", text: "Плановая деятельность"},
                    {val: "MZProverka", text: "Подать проверку"}, {val: "MZRevision", text: "Подать ревизию/проверку"}
                ]
            },
            {
                label: "🔫 Лидер/Зам (Нелегалы)",
                items: [
                    {val: "otchetlideraNelegal", text: "Отчёт лидера (Гетто)"}, {val: "otchetlideraNelegalMaf", text: "Отчёт лидера (Мафии)"},
                    {val: "NelegalPolBali", text: "Получить баллы (Гетто)"}, {val: "NelegalPolBaliMaf", text: "Получить баллы (Мафии)"},
                    {val: "NelegalPotBali", text: "Потратить баллы (Гетто)"}, {val: "NelegalPotBaliMaf", text: "Потратить баллы (Мафии)"},
                    {val: "NelegalMoroz", text: "Взять мороз"}, {val: "takethechilloff", text: "Снять мороз"},
                    {val: "NelegalNeaktiv", text: "Взять Неактив"}, {val: "SnatVigPoZadaniu", text: "Снять выговор по заданию"},
                    {val: "ZabitDiploma", text: "Забить дипломатию"}, {val: "GetTerra", text: "Запрос территорий"},
                    {val: "GetBiz", text: "Запрос бизнесов"}
                ]
            },
            {
                label: "📂 Остальное",
                items: [
                    {val: "ghettoDefault", text: "Написать ЖБ на игрока"}, {val: "GiveOpra", text: "Дать опру (МП)"}
                ]
            }
        ];

        // Генерируем выпадающие списки биндов
        hotkeysIds.forEach(id => {
            currentHotkeys[id] = items[id] || "none";
            const container = document.getElementById('custom-' + id);
            if (!container) return;
            
            const selectedSpan = container.querySelector('.select-selected span:first-child');
            const itemsDiv = container.querySelector('.select-items');
            
            itemsDiv.innerHTML = '<div class="opt" data-val="none">-- Отключить --</div>';
            let selectedText = "-- Отключить --";

            categories.forEach(cat => {
                const group = document.createElement('div');
                group.className = 'opt-group';
                group.textContent = cat.label;
                itemsDiv.appendChild(group);
                
                cat.items.forEach(t => {
                    const opt = document.createElement('div');
                    opt.className = 'opt';
                    opt.dataset.val = t.val;
                    opt.textContent = t.text;
                    if (t.val === currentHotkeys[id]) selectedText = t.text;
                    itemsDiv.appendChild(opt);
                });
            });

            if (items.customTemplates && items.customTemplates.length > 0) {
                const customGroup = document.createElement('div');
                customGroup.className = 'opt-group';
                customGroup.textContent = "🛠 Свои формы";
                itemsDiv.appendChild(customGroup);
                
                items.customTemplates.forEach(t => {
                    const val = "custom_" + t.title;
                    const opt = document.createElement('div');
                    opt.className = 'opt';
                    opt.dataset.val = val;
                    opt.textContent = "🛠 " + t.title;
                    if (val === currentHotkeys[id]) selectedText = opt.textContent;
                    itemsDiv.appendChild(opt);
                });
            }

            selectedSpan.textContent = selectedText;

            container.querySelector('.select-selected').addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.custom-select').forEach(el => {
                    if (el !== container) el.classList.remove('active');
                });
                container.classList.toggle('active');
            });

            itemsDiv.querySelectorAll('.opt').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentHotkeys[id] = opt.dataset.val;
                    selectedSpan.textContent = opt.textContent;
                    container.classList.remove('active');
                });
            });
        });

        // Закрытие списков при клике вне
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select').forEach(el => el.classList.remove('active'));
        });

        textFields.forEach(id => { if (document.getElementById(id) && items[id] !== undefined) document.getElementById(id).value = items[id]; });
        checkFields.forEach(id => { if (document.getElementById(id) && items[id] !== undefined) document.getElementById(id).checked = !!items[id]; });
        
        rangeFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = items[id] !== undefined ? items[id] : el.min;
                const valDisp = document.getElementById(id + 'Val');
                if (valDisp) valDisp.textContent = el.value;
            }
        });

        colorFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = items[id] || '#ffffff';
                const disp = document.getElementById(id + 'Display');
                if (disp) disp.textContent = el.value.toUpperCase();
                if (id === 'themeColor') applyAccentColor(el.value);
            }
        });
    });

    rangeFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', e => document.getElementById(id + 'Val').textContent = e.target.value);
    });

    colorFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', e => {
                const disp = document.getElementById(id + 'Display');
                if (disp) disp.textContent = e.target.value.toUpperCase();
                if (id === 'themeColor') applyAccentColor(e.target.value);
            });
        }
    });

    document.getElementById('save').addEventListener('click', e => {
        const btn = e.target;
        const data = {};
        
        hotkeysIds.forEach(id => { data[id] = currentHotkeys[id]; });

        textFields.forEach(id => { 
            const el = document.getElementById(id);
            if (el) {
                if (id === 'discordWebhook') data[id] = el.value.trim(); 
                else data[id] = sanitizeHTML(el.value);
            }
        });
        checkFields.forEach(id => { if (document.getElementById(id)) data[id] = document.getElementById(id).checked; });
        rangeFields.forEach(id => { 
            const el = document.getElementById(id);
            if (el) {
                let val = parseFloat(el.value);
                let min = parseFloat(el.min) || 0;
                let max = parseFloat(el.max) || 300;
                if (isNaN(val) || val < min) val = min;
                if (val > max) val = max;
                data[id] = val;
            }
        });
        colorFields.forEach(id => { 
            const el = document.getElementById(id);
            if (el) {
                let col = el.value.trim();
                if (!/^#[0-9A-Fa-f]{6}$/.test(col)) col = "#ffffff";
                data[id] = col;
            }
        });

        chrome.storage.local.set(data, () => {
            btn.textContent = 'Сохранено!';
            btn.classList.add('success');
            chrome.tabs.query({url: "*://forum.arizona-rp.com/*"}, tabs => tabs.forEach(t => { try{chrome.tabs.reload(t.id)}catch(err){} }));
            setTimeout(() => { btn.textContent = 'Сохранить'; btn.classList.remove('success'); }, 1500);
        });
    });
});