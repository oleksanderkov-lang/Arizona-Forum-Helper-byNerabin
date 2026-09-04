document.addEventListener('DOMContentLoaded', function() {
    const fields = ['server', 'gender', 'nickname', 'nonrp', 'organization', 'rang', 'rangGenitive', 'signature', 'discordWebhook'];
    const hKeys = ['hotkeyF1', 'hotkeyF2', 'hotkeyF3', 'hotkeyF4', 'hotkeyF5'];
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });

    const customInput = document.getElementById('themeColor');
    const hexDisplay = document.querySelector('.color-hex-display');
    const resetColorBtn = document.getElementById('resetColor');

    function setActiveColor(col) {
        if (!col) col = "#3498db";
        if (customInput) customInput.value = col;
        if (hexDisplay) hexDisplay.textContent = col.toUpperCase();
        document.documentElement.style.setProperty('--accent', col);
        document.documentElement.style.setProperty('--btn-grad', `linear-gradient(135deg, ${col}80 0%, ${col}40 100%)`);
        document.documentElement.style.setProperty('--btn-grad-hover', `linear-gradient(135deg, ${col} 0%, ${col}90 100%)`);
    }

    if (resetColorBtn) {
        resetColorBtn.addEventListener('click', () => {
            setActiveColor("#3498db");
        });
    }

    chrome.storage.local.get({
        server: "Tucson", gender: "Male", nickname: "Nick Name", NonRPnickname: "Nick_Name",
        organization: "LSPD", rang: "Судья", rangGenitive: "Судьи", signature: "byNerabin",
        discordWebhook: "", themeColor: "#3498db", blurEnabled: true,
        hotkeyF1: "inReview", hotkeyF2: "transferred", hotkeyF3: "wrongFormat", hotkeyF4: "verdict", hotkeyF5: "refuse",
        customTemplates: []
    }, function(items) {
        
        const categories = [
            {
                label: "Основные (Админ)",
                items: [
                    {val: "inReview", text: "На рассмотрении"},
                    {val: "transferred", text: "Передано ст. адм"},
                    {val: "wrongFormat", text: "Не по форме"},
                    {val: "verdict", text: "Вердикт (Выдача)"},
                    {val: "refuse", text: "Отказ жалобы"},
                    {val: "jbadm", text: "Ответ ЖБАДМ"},
                    {val: "jbadmError", text: "Ответ ЖБАДМ (ошибка)"},
                    {val: "requestProof", text: "Запрос опры"}
                ]
            },
            {
                label: "Суд",
                items: [
                    {val: "takeLawsuit", text: "Принятие иска"},
                    {val: "requestExplanations", text: "Запрос опровержения (24 ч)"},
                    {val: "courtWrongFormat", text: "Иск не по форме"},
                    {val: "courtVerdictDefault", text: "Вердикт (Обычный)"},
                    {val: "courtVerdictCriminal", text: "Вердикт Уголовного Дела"},
                    {val: "courtVerdictFederal", text: "Вердикт Федерального Дела"}
                ]
            },
            {
                label: "ПД и Адвокаты",
                items: [
                    {val: "pdDefault", text: "Опра в иске (от лица ПД)"},
                    {val: "playerDefault", text: "Подать исковое заявление"},
                    {val: "lawyerPetition", text: "Ходатайство от адвоката"},
                    {val: "motionPlaintiff", text: "Ходатайство от истца"},
                    {val: "motionDefendant", text: "Ходатайство от ответчика"},
                    {val: "addmotionDefendant", text: "Добавл. к ход. (Ответчик)"},
                    {val: "addmotionPlaintiff", text: "Добавл. к ход. (Истец)"},
                    {val: "addlawyerPetition", text: "Добавл. к ход. (Адвокат)"},
                    {val: "addlawyerPetitionFromPlaintiff", text: "Добавл. адвоката (Истец)"},
                    {val: "addDefendantPetitionFromPlaintiff", text: "Добавл. адвоката (Ответчик)"}
                ]
            },
            {
                label: "Лидеры и замы (ГОС)",
                items: [
                    {val: "otchetzamaGOV", text: "Отчёт заместителя (ГОС)"},
                    {val: "otchetlideraGOV", text: "Отчёт лидера (ГОС)"},
                    {val: "AntiBlatGOV", text: "Подать анти-блат"},
                    {val: "PrikazMinsraUS", text: "Подать приказ (Мин. Юст.)"},
                    {val: "ViezdnieMP", text: "Подать выездное МП"},
                    {val: "PlanDeistviyMO", text: "Плановая дейтельность (МО)"},
                    {val: "MZRevision", text: "Подать ревизию/проверку"},
                    {val: "MZProverka", text: "Проверка гос. фракции"}
                ]
            },
            {
                label: "Лидеры и замы (Гетто/Мафии)",
                items: [
                    {val: "otchetlideraNelegal", text: "Отчёт лидера (Гетто)"},
                    {val: "NelegalPolBali", text: "Получить баллы (Гетто)"},
                    {val: "NelegalPotBali", text: "Потратить баллы (Гетто)"},
                    {val: "NelegalMoroz", text: "Взять мороз (Гетто)"},
                    {val: "NelegalNeaktiv", text: "Взять Неактив (Гетто)"},
                    {val: "otchetlideraNelegalMaf", text: "Отчёт лидера (Мафия)"},
                    {val: "NelegalPolBaliMaf", text: "Получить баллы (Мафия)"},
                    {val: "NelegalPotBaliMaf", text: "Потратить баллы (Мафия)"},
                    {val: "GetTerra", text: "Выдача территории"},
                    {val: "GetBiz", text: "Выдача бизнеса"},
                    {val: "takethechilloff", text: "Снять мороз"},
                    {val: "SnatVigPoZadaniu", text: "Снять выговор по заданию"},
                    {val: "ZabitDiploma", text: "Забить дипломатию"}
                ]
            },
            {
                label: "Прочее",
                items: [
                    {val: "ghettoDefault", text: "Написать жалобу на игрока"},
                    {val: "GiveOpra", text: "Дать опру (капта/смуга/стрелы/кб)"},
                    {val: "none", text: "--- Пусто ---"}
                ]
            }
        ];

        hKeys.forEach(id => {
            const sel = document.getElementById(id);
            if (sel) {
                sel.innerHTML = '';
                
                categories.forEach(cat => {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = cat.label;
                    cat.items.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.val;
                        opt.textContent = t.text;
                        optgroup.appendChild(opt);
                    });
                    sel.appendChild(optgroup);
                });

                if (items.customTemplates && items.customTemplates.length > 0) {
                    const customGroup = document.createElement('optgroup');
                    customGroup.label = "🛠 Свои формы";
                    items.customTemplates.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = "custom_" + t.title;
                        opt.textContent = "🛠 " + t.title;
                        customGroup.appendChild(opt);
                    });
                    sel.appendChild(customGroup);
                }

                sel.value = items[id] || "none";
            }
        });

        fields.forEach(f => { if(document.getElementById(f)) document.getElementById(f).value = items[f] || ""; });
        if(document.getElementById('blurEnabled')) document.getElementById('blurEnabled').checked = items.blurEnabled;
        setActiveColor(items.themeColor);
    });

    if (customInput) customInput.addEventListener('input', e => setActiveColor(e.target.value));

    document.getElementById('save').addEventListener('click', function(e) {
        const btn = e.target;
        const data = { themeColor: customInput ? customInput.value : "#3498db" };
        fields.forEach(f => data[f] = document.getElementById(f).value);
        hKeys.forEach(k => data[k] = document.getElementById(k).value);
        data.blurEnabled = document.getElementById('blurEnabled') ? document.getElementById('blurEnabled').checked : true;
        
        chrome.storage.local.set(data, function() {
            btn.textContent = 'Успешно сохранено!';
            btn.classList.add('success');
            chrome.tabs.query({url: "*://forum.arizona-rp.com/*"}, tabs => tabs.forEach(t => { try{chrome.tabs.reload(t.id)}catch(e){} }));
            setTimeout(() => { btn.textContent = 'Сохранить настройки'; btn.classList.remove('success'); }, 1500);
        });
    });
});