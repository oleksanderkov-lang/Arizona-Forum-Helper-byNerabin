document.addEventListener('DOMContentLoaded', function() {
    const fields = ['server', 'gender', 'nickname', 'nonrp', 'organization', 'rang', 'rangGenitive', 'signature', 'discordWebhook'];
    const DEFAULT_COLOR = "#3498db";
    const customInput = document.getElementById('themeColor');
    const hexDisplay = document.querySelector('.color-hex-display');

    function setActiveColor(col) {
        if (!col) {
            col = DEFAULT_COLOR;
        }
        
        if (customInput) {
            customInput.value = col;
        }
        if (hexDisplay) {
            hexDisplay.textContent = col.toUpperCase();
        }
        
        document.documentElement.style.setProperty('--accent', col);
        document.documentElement.style.setProperty('--btn-grad', `linear-gradient(135deg, ${col}80 0%, ${col}40 100%)`);
        document.documentElement.style.setProperty('--btn-grad-hover', `linear-gradient(135deg, ${col} 0%, ${col}90 100%)`);
    }

    chrome.storage.local.get({
        server: "Tucson",
        gender: "Male",
        nickname: "Nick Name",
        NonRPnickname: "Nick_Name",
        organization: "LSPD",
        rang: "Судья",
        rangGenitive: "Судьи",
        signature: "byNerabin",
        discordWebhook: "",
        themeColor: DEFAULT_COLOR,
        blurEnabled: true
    }, function(items) {
        fields.forEach(function(field) {
            const el = document.getElementById(field);
            if (el) {
                if (field === 'nonrp' && !items[field]) {
                    el.value = items['NonRPnickname'] || "";
                } else {
                    el.value = items[field] || "";
                }
            }
        });
        
        const blurEl = document.getElementById('blurEnabled');
        if (blurEl) {
            blurEl.checked = items.blurEnabled;
        }
        
        setActiveColor(items.themeColor);
    });

    if (customInput) {
        customInput.addEventListener('input', function(e) {
            setActiveColor(e.target.value);
        });
    }

    const resetBtn = document.getElementById('resetColor');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            setActiveColor(DEFAULT_COLOR);
        });
    }

    const saveBtn = document.getElementById('save');
    if (saveBtn) {
        saveBtn.addEventListener('click', function(e) {
            const btn = e.target;
            
            chrome.storage.local.set({
                server: document.getElementById('server').value,
                gender: document.getElementById('gender').value,
                nickname: document.getElementById('nickname').value,
                NonRPnickname: document.getElementById('nonrp').value,
                organization: document.getElementById('organization').value,
                rang: document.getElementById('rang').value,
                rangGenitive: document.getElementById('rangGenitive').value,
                signature: document.getElementById('signature').value,
                discordWebhook: document.getElementById('discordWebhook').value,
                themeColor: customInput ? customInput.value : DEFAULT_COLOR,
                blurEnabled: document.getElementById('blurEnabled') ? document.getElementById('blurEnabled').checked : true
            }, function() {
                btn.textContent = 'Успешно сохранено!';
                btn.classList.add('success');
                
                chrome.tabs.query({url: "*://forum.arizona-rp.com/*"}, function(tabs) {
                    tabs.forEach(function(tab) {
                        try {
                            chrome.tabs.reload(tab.id);
                        } catch(err) {}
                    });
                });

                setTimeout(function() {
                    btn.textContent = 'Сохранить настройки';
                    btn.classList.remove('success');
                }, 1500);
            });
        });
    }
});