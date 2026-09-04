window.AH_Visuals = (function () {
    'use strict';
    
    let CONFIG = {};
    let particleAnimationId = null;

    function runWhenReady(check, init, delay = 50) {
        if (check()) init();
        else setTimeout(function() { runWhenReady(check, init, delay); }, delay);
    }

    function getUTC3Time() {
        return new Date(Date.now() + (new Date().getTimezoneOffset() * 60000) + 10800000).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    }

    function closeModal(overlay) {
        overlay.classList.add('ah-closing');
        setTimeout(function() {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        }, 250);
    }

    function applyThemeColors(themeColor, themeTextColor) {
        let style = document.getElementById('ah-theme-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'ah-theme-style';
            document.head.appendChild(style);
        }

        let css = '';
        if (themeColor && themeColor.toLowerCase() !== "#3498db") {
            const r = parseInt(themeColor.slice(1, 3), 16); const g = parseInt(themeColor.slice(3, 5), 16); const b = parseInt(themeColor.slice(5, 7), 16);
            css += `
                :root, html[data-color-scheme="light"], html[data-color-scheme="dark"] {
                    --ah-accent: ${themeColor} !important; --ah-border-h: rgba(${r},${g},${b}, 0.5) !important; --ah-glow: rgba(${r},${g},${b}, 0.25) !important;
                    --ah-btn: linear-gradient(135deg, rgba(${r},${g},${b}, 0.8) 0%, rgba(${r},${g},${b}, 0.4) 100%) !important;
                    --ah-btn-h: linear-gradient(135deg, rgba(${r},${g},${b}, 1) 0%, rgba(${r},${g},${b}, 0.6) 100%) !important;
                }
            `;
        }
        if (themeTextColor && themeTextColor.toLowerCase() !== "#ffffff") {
            css += `
                body, .message-body, .message-body .bbWrapper, 
                .structItem-title a, .node-title a, .p-title-value, 
                .message-name, .p-navgroup-linkText, .block-header, 
                .block-minorHeader, .p-description, .bbCodeBlock-content,
                .message-userTitle, .menu-row label, .formRow-label,
                .p-breadcrumbs > li > a { color: ${themeTextColor} !important; }
                :root, html[data-color-scheme="light"], html[data-color-scheme="dark"] { --ah-text: ${themeTextColor} !important; }
            `;
        }
        style.textContent = css;
    }

    function initClickableNode(node) {
        if (node.dataset.clickableInit) return;
        node.dataset.clickableInit = 'true';
        node.style.cursor = 'pointer';
        
        node.addEventListener('mousedown', function(e) {
            if (e.button === 1 && !e.target.closest('a, button, input, .labelLink, .avatar, .structItem-status')) {
                e.preventDefault();
            }
        });

        node.addEventListener('auxclick', function(e) {
            if (e.button === 1 && !e.target.closest('a, button, input, .labelLink, .avatar, .structItem-status')) {
                e.preventDefault();
                e.stopPropagation();
                const mainLink = node.querySelector('.node-title a, .structItem-title a:not(.labelLink)');
                if (mainLink) window.open(mainLink.href, '_blank');
            }
        });

        node.addEventListener('click', function(e) {
            if (e.button === 0 && !e.target.closest('a, button, input, .labelLink, .avatar, .structItem-status')) {
                const mainLink = node.querySelector('.node-title a, .structItem-title a:not(.labelLink)');
                if (mainLink) {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(mainLink.href, '_blank');
                    } else {
                        mainLink.click();
                    }
                }
            }
        });
    }

    function makeNodesEntirelyClickable() { 
        document.querySelectorAll('.node-body:not([data-clickable-init]), .structItem:not([data-clickable-init])').forEach(initClickableNode); 
    }

    function initHeader() {
        const navTop = document.querySelector('.p-navTop'); const contentRef = document.querySelector('.p-body-inner');
        if (!navTop || !contentRef || navTop.dataset.headerInit) return setTimeout(initHeader, 300);
        navTop.dataset.headerInit = 'true';
        let headerEl = navTop; let tempEl = navTop;
        while (tempEl && tempEl !== document.body) {
            if (getComputedStyle(tempEl).backgroundColor !== 'rgba(0, 0, 0, 0)') { headerEl = tempEl; break; }
            tempEl = tempEl.parentElement;
        }
        headerEl.classList.add('js-auto-header'); document.body.classList.add('js-header-fixed-active');
        headerEl.style.setProperty('background', 'transparent', 'important');
        const updatePos = function() {
            const r = contentRef.getBoundingClientRect();
            headerEl.style.left = `${Math.round(r.left)}px`; headerEl.style.width = `${Math.round(r.width)}px`;
            document.documentElement.style.setProperty('--auto-header-height', `${headerEl.offsetHeight + 24}px`);
        };
        updatePos(); setTimeout(updatePos, 300); window.addEventListener('resize', updatePos);
        let lastScrollY = window.scrollY; let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    headerEl.classList.toggle('header-hidden', window.scrollY > lastScrollY && window.scrollY > 80);
                    lastScrollY = window.scrollY; ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    function initParticlesBackground(forceRestart = false) {
        if (!CONFIG.particlesEnabled) {
            const oldCanvas = document.getElementById('ah-particles-bg');
            if (oldCanvas) oldCanvas.remove();
            if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
            return;
        }
        let canvas = document.getElementById('ah-particles-bg');
        if (forceRestart && canvas) { canvas.remove(); if (particleAnimationId) cancelAnimationFrame(particleAnimationId); canvas = null; }
        if (!canvas) {
            canvas = document.createElement('canvas'); canvas.id = 'ah-particles-bg';
            Object.assign(canvas.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', zIndex: '0', pointerEvents: 'none', opacity: '0.85' });
            document.body.appendChild(canvas);
        }
        const ctx = canvas.getContext('2d'); let particlesArray = [];
        const particleSettings = {
            count: CONFIG.pCount || 70, color: CONFIG.pColor || '#3498db', lineDistance: 130, speed: CONFIG.pSpeed || 0.5,
            shape: CONFIG.pShape || 'circle', size: CONFIG.pSize || 3, lines: CONFIG.pLines, fading: CONFIG.pFading,
            emojis: (CONFIG.pEmojiText || '🌸').split(',').map(function(e) { return e.trim(); })
        };
        const resize = function() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize); resize();
        let mouse = { x: null, y: null, radius: 150 };
        window.addEventListener('mousemove', function(e) { mouse.x = e.x; mouse.y = e.y; });
        window.addEventListener('mouseout', function() { mouse.x = null; mouse.y = null; });
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
                this.size = (Math.random() * (particleSettings.size * 0.5)) + (particleSettings.size * 0.8);
                this.directionX = (Math.random() * 2 - 1) * particleSettings.speed; this.directionY = (Math.random() * 2 - 1) * particleSettings.speed;
                this.alpha = Math.random();
                this.fadeDirection = Math.random() > 0.5 ? 1 : -1;
                this.fadeSpeed = Math.random() * 0.015 + 0.005;
                if (particleSettings.shape === 'emoji') this.emoji = particleSettings.emojis[Math.floor(Math.random() * particleSettings.emojis.length)];
            }
            update() {
                if (mouse.x != null && mouse.y != null) {
                    let dx = mouse.x - this.x; let dy = mouse.y - this.y; let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius) { this.x -= (dx / distance) * ((mouse.radius - distance) / mouse.radius) * 3; this.y -= (dy / distance) * ((mouse.radius - distance) / mouse.radius) * 3; }
                }
                this.x += this.directionX; this.y += this.directionY;
                if (this.x < 0 || this.x > canvas.width) this.directionX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.directionY *= -1;

                if (particleSettings.fading) {
                    this.alpha += this.fadeDirection * this.fadeSpeed;
                    if (this.alpha >= 1) {
                        this.alpha = 1;
                        this.fadeDirection = -1;
                    } else if (this.alpha <= 0) {
                        this.alpha = 0;
                        this.fadeDirection = 1;
                        this.x = Math.random() * canvas.width;
                        this.y = Math.random() * canvas.height;
                    }
                } else {
                    this.alpha = 1;
                }
            }
            draw() {
                ctx.globalAlpha = this.alpha;
                if (particleSettings.shape === 'emoji') {
                    ctx.font = `${this.size * 4}px Arial`; ctx.fillStyle = particleSettings.color; ctx.fillText(this.emoji, this.x, this.y);
                } else {
                    ctx.beginPath();
                    if (particleSettings.shape === 'square') ctx.rect(this.x, this.y, this.size * 2, this.size * 2); else ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = particleSettings.color; ctx.fill();
                }
                ctx.globalAlpha = 1.0;
            }
        }
        const initParticles = function() { particlesArray = []; for (let i = 0; i < particleSettings.count; i++) particlesArray.push(new Particle()); };
        const connect = function() {
            if (!particleSettings.lines || particleSettings.shape === 'emoji') return;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let dx = particlesArray[a].x - particlesArray[b].x; let dy = particlesArray[a].y - particlesArray[b].y; let distance = (dx * dx) + (dy * dy);
                    if (distance < (particleSettings.lineDistance * particleSettings.lineDistance)) {
                        let avgAlpha = particleSettings.fading ? (particlesArray[a].alpha + particlesArray[b].alpha) / 2 : 1;
                        ctx.strokeStyle = `rgba(${parseInt(particleSettings.color.slice(1, 3), 16)}, ${parseInt(particleSettings.color.slice(3, 5), 16)}, ${parseInt(particleSettings.color.slice(5, 7), 16)}, ${(1 - (distance / 20000)) * 0.8 * avgAlpha})`;
                        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(particlesArray[a].x, particlesArray[a].y); ctx.lineTo(particlesArray[b].x, particlesArray[b].y); ctx.stroke();
                    }
                }
            }
        };
        const animate = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); particlesArray[i].draw(); }
            connect(); particleAnimationId = requestAnimationFrame(animate);
        };
        initParticles(); animate();
    }

    function initBlur() {
        document.body.insertAdjacentHTML('beforeend', `<svg xmlns="http://www.w3.org/2000/svg" style="width:0;height:0;position:absolute;pointer-events:none;"><filter id="motion-blur-vertical" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="0 0" id="blur-intensity" /></filter></svg>`);
        const bodyInner = document.querySelector('.p-body-inner'); const blurFilter = document.getElementById('blur-intensity');
        if (!bodyInner || !blurFilter) return;
        
        let lastScrollY = window.scrollY; let scrollTimeout; let ticking = false;
        window.addEventListener('scroll', function() {
            if (!CONFIG.blurEnabled || document.body.scrollHeight > 6000) { blurFilter.setAttribute('stdDeviation', '0 0'); bodyInner.style.filter = 'none'; return; }
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    let blurAmount = Math.min(Math.abs(window.scrollY - lastScrollY) * 0.15, 25); lastScrollY = window.scrollY;
                    if (blurAmount > 1) { blurFilter.setAttribute('stdDeviation', `0 ${blurAmount}`); bodyInner.style.filter = 'url(#motion-blur-vertical)'; }
                    clearTimeout(scrollTimeout); scrollTimeout = setTimeout(function() { blurFilter.setAttribute('stdDeviation', '0 0'); bodyInner.style.filter = 'none'; }, 80); ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    function showVisualConfigurator() {
        const overlay = document.createElement('div');
        overlay.className = 'ah-modal-overlay';
        overlay.innerHTML = `
            <div class="ah-modal-box" style="width:380px;">
                <style>
                    .vc-label { display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; font-size:13px; font-weight:bold; }
                    .vc-input-range { width: 100%; accent-color: var(--ah-accent); }
                </style>
                <h3 style="margin:0 0 20px 0;color:var(--ah-accent);text-align:center;text-transform:uppercase;">Настройки фона</h3>
                
                <label class="vc-label">Убрать огромные огни <input type="checkbox" id="vc-glow" ${!CONFIG.bgGlowEnabled ? 'checked' : ''} style="width:18px;height:18px;"></label>
                <label class="vc-label">Включить частицы <input type="checkbox" id="vc-enable" ${CONFIG.particlesEnabled ? 'checked' : ''} style="width:18px;height:18px;"></label>
                <label class="vc-label">Мерцание частиц <input type="checkbox" id="vc-fading" ${CONFIG.pFading ? 'checked' : ''} style="width:18px;height:18px;"></label>
                
                <label class="vc-label">Форма 
                    <select id="vc-shape" style="background:#0a0a0f;color:#fff;border:1px solid #333;border-radius:6px;padding:6px;width:120px;outline:none;">
                        <option value="circle" ${CONFIG.pShape === 'circle' ? 'selected' : ''}>Круги</option>
                        <option value="square" ${CONFIG.pShape === 'square' ? 'selected' : ''}>Квадраты</option>
                        <option value="emoji" ${CONFIG.pShape === 'emoji' ? 'selected' : ''}>Текст / Emoji</option>
                    </select>
                </label>
                <div id="vc-emoji-wrap" style="${CONFIG.pShape === 'emoji' ? 'display:block' : 'display:none'}; margin-bottom:15px;">
                    <input type="text" id="vc-emoji-text" value="${CONFIG.pEmojiText}" placeholder="🌸,🔥,💀" style="width:100%;background:#0a0a0f;color:#fff;border:1px solid #333;border-radius:6px;padding:6px;box-sizing:border-box;">
                </div>
                <label class="vc-label">Линии соединений <input type="checkbox" id="vc-lines" ${CONFIG.pLines ? 'checked' : ''} style="width:18px;height:18px;"></label>
                <label class="vc-label">Цвет частиц / текста фона<input type="color" id="vc-color" value="${CONFIG.pColor}" style="background:none;border:none;width:30px;height:30px;cursor:pointer;"></label>
                <label class="vc-label">Цвет текста самого форума<input type="color" id="vc-text-color" value="${CONFIG.themeTextColor || '#ffffff'}" style="background:none;border:none;width:30px;height:30px;cursor:pointer;"></label>

                <div style="margin-bottom:15px;font-size:13px;font-weight:bold;"><div style="display:flex;justify-content:space-between;margin-bottom:5px;">Размер <span id="vc-size-val" style="color:var(--ah-accent);">${CONFIG.pSize || 3}</span></div><input type="range" id="vc-size" min="1" max="30" step="0.5" value="${CONFIG.pSize || 3}" class="vc-input-range"></div>
                <div style="margin-bottom:15px;font-size:13px;font-weight:bold;"><div style="display:flex;justify-content:space-between;margin-bottom:5px;">Количество <span id="vc-count-val" style="color:var(--ah-accent);">${CONFIG.pCount}</span></div><input type="range" id="vc-count" min="5" max="250" value="${CONFIG.pCount}" class="vc-input-range"></div>
                <div style="margin-bottom:24px;font-size:13px;font-weight:bold;"><div style="display:flex;justify-content:space-between;margin-bottom:5px;">Скорость <span id="vc-speed-val" style="color:var(--ah-accent);">${CONFIG.pSpeed}</span></div><input type="range" id="vc-speed" min="0.1" max="3" step="0.1" value="${CONFIG.pSpeed}" class="vc-input-range"></div>

                <div style="display:flex;gap:10px;">
                    <button id="vc-cancel" style="flex:1;padding:12px;background:#333;border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:bold;">Отмена</button>
                    <button id="vc-save" style="flex:1;padding:12px;background:var(--ah-btn);border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:bold;transition:0.2s;" onmouseover="this.style.background='var(--ah-btn-h)'; this.style.boxShadow='0 4px 15px var(--ah-glow)';" onmouseout="this.style.background='var(--ah-btn)'; this.style.boxShadow='none';">Применить</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#vc-shape').addEventListener('change', function(e) { overlay.querySelector('#vc-emoji-wrap').style.display = e.target.value === 'emoji' ? 'block' : 'none'; });
        overlay.querySelector('#vc-size').addEventListener('input', function(e) { overlay.querySelector('#vc-size-val').textContent = e.target.value; });
        overlay.querySelector('#vc-count').addEventListener('input', function(e) { overlay.querySelector('#vc-count-val').textContent = e.target.value; });
        overlay.querySelector('#vc-speed').addEventListener('input', function(e) { overlay.querySelector('#vc-speed-val').textContent = e.target.value; });

        overlay.querySelector('#vc-cancel').addEventListener('click', function() { closeModal(overlay); });
        overlay.addEventListener('mousedown', function(e) { if (e.target === overlay) closeModal(overlay); });
        
        overlay.querySelector('#vc-save').addEventListener('click', function() {
            CONFIG.bgGlowEnabled = !overlay.querySelector('#vc-glow').checked;
            CONFIG.particlesEnabled = overlay.querySelector('#vc-enable').checked;
            CONFIG.pFading = overlay.querySelector('#vc-fading').checked;
            CONFIG.pShape = overlay.querySelector('#vc-shape').value;
            CONFIG.pEmojiText = overlay.querySelector('#vc-emoji-text').value;
            CONFIG.pLines = overlay.querySelector('#vc-lines').checked;
            CONFIG.pColor = overlay.querySelector('#vc-color').value;
            CONFIG.themeTextColor = overlay.querySelector('#vc-text-color').value;
            CONFIG.pSize = parseFloat(overlay.querySelector('#vc-size').value) || 3;
            CONFIG.pCount = parseInt(overlay.querySelector('#vc-count').value) || 70;
            CONFIG.pSpeed = parseFloat(overlay.querySelector('#vc-speed').value) || 0.5;

            window.dispatchEvent(new CustomEvent('AH_SAVE_CONFIG', {
                detail: {
                    bgGlowEnabled: CONFIG.bgGlowEnabled, particlesEnabled: CONFIG.particlesEnabled,
                    pFading: CONFIG.pFading,
                    pShape: CONFIG.pShape, pEmojiText: CONFIG.pEmojiText, pLines: CONFIG.pLines,
                    pColor: CONFIG.pColor, themeTextColor: CONFIG.themeTextColor,
                    pSize: CONFIG.pSize, pCount: CONFIG.pCount, pSpeed: CONFIG.pSpeed
                }
            }));
            closeModal(overlay);
        });
    }

    function initSidebarTimeWidget() {
        runWhenReady(function() { return !!document.body; }, function() {
            if (document.getElementById('ah-time-widget')) return;
            
            const widgetStyle = document.createElement('style');
            widgetStyle.textContent = `
                #ah-time-widget { top: 80px !important; transform: translateX(calc(-100% + 24px)) !important; border-radius: 0 16px 16px 0 !important; }
                #ah-time-widget:hover { transform: translateX(0) !important; }
            `;
            document.head.appendChild(widgetStyle);

            const widget = document.createElement('div');
            widget.id = 'ah-time-widget';
            widget.innerHTML = `<div class="ah-time-icon">🕒</div><div class="ah-time-text"></div><div id="ah-time-settings" title="Настройки визуала">⚙️</div>`;
            document.body.appendChild(widget);
            const timeText = widget.querySelector('.ah-time-text');
            const update = function() { if (timeText.isConnected) timeText.textContent = getUTC3Time(); };
            update(); setInterval(update, 1000);
            widget.querySelector('#ah-time-settings').addEventListener('click', function(e) { e.stopPropagation(); showVisualConfigurator(); });
        });
    }

    window.addEventListener('AH_SAVE_CONFIG', function(e) {
        Object.assign(CONFIG, e.detail);
        
        try {
            let localCfg = JSON.parse(localStorage.getItem('AH_VISUAL_CONFIG')) || {};
            Object.assign(localCfg, e.detail);
            localStorage.setItem('AH_VISUAL_CONFIG', JSON.stringify(localCfg));
        } catch(err) {}

        document.body.classList.toggle('no-bg-glow', !CONFIG.bgGlowEnabled);
        applyThemeColors(CONFIG.themeColor, CONFIG.themeTextColor);
        initParticlesBackground(true);
    });

    return {
        init: function(config) {
            CONFIG = config;
            if (!CONFIG.bgGlowEnabled) document.body.classList.add('no-bg-glow');
            applyThemeColors(CONFIG.themeColor, CONFIG.themeTextColor);
            
            runWhenReady(function() { return !!document.body; }, initHeader);
            initSidebarTimeWidget();
            runWhenReady(function() { return !!document.body; }, initParticlesBackground);
            runWhenReady(function() { return !!document.body; }, makeNodesEntirelyClickable);
            runWhenReady(function() { return !!document.querySelector('.p-body-inner'); }, initBlur);
        },
        onDOMUpdate: function() {
            makeNodesEntirelyClickable();
        }
    };
})();