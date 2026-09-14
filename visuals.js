window.AH_Visuals = (function () {
    'use strict';
    
    let CONFIG = {};
    let particleAnimationId = null;

    let cachedThemeStyle = null;
    let cachedBgContainer = null;
    let cachedBodyInner = null;
    let cachedBlurFilter = null;
    let cachedNavTop = null;
    
    function runWhenReady(check, init, delay = 50) {
        if (check()) init();
        else setTimeout(function() { runWhenReady(check, init, delay); }, delay);
    }

    function hexToRgbFast(hex) {
        let h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const num = parseInt(h, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    function applyThemeColors() {
        if (!cachedThemeStyle) {
            cachedThemeStyle = document.getElementById('ah-theme-style') || document.createElement('style');
            if (!cachedThemeStyle.id) {
                cachedThemeStyle.id = 'ah-theme-style';
                document.head.appendChild(cachedThemeStyle);
            }
        }

        const tc = CONFIG.themeColor || "#3498db";
        const rgb = hexToRgbFast(tc);
        const op = 1 - ((CONFIG.transparency !== undefined ? CONFIG.transparency : 15) / 100);
        const tCols = CONFIG.threadCols || 2;

        let css = `
            :root, html[data-color-scheme="light"], html[data-color-scheme="dark"] {
                --ah-accent: ${tc} !important; 
                --ah-border-h: rgba(${rgb.r},${rgb.g},${rgb.b}, 0.5) !important; 
                --ah-glow: rgba(${rgb.r},${rgb.g},${rgb.b}, 0.25) !important;
                --ah-btn: rgba(255, 255, 255, 0.05) !important;
                --ah-btn-h: rgba(${rgb.r},${rgb.g},${rgb.b}, 0.15) !important;
                --ah-surface: rgba(25, 25, 33, ${op}) !important; 
                --ah-menu-bg: rgba(20, 20, 25, ${op}) !important;
                --ah-thread-cols: ${tCols} !important;
            }
            .menu-content, .ah-modal-box, .tooltip-content, .custom-modal-grid {
                background: var(--ah-menu-bg) !important;
                backdrop-filter: blur(12px) !important;
            }
            .js-auto-header { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important; position: fixed !important; top: 0; z-index: 1000 !important; }
            .header-hidden { transform: translateY(-100%) !important; }
        `;
        
        if (CONFIG.themeTextColor && CONFIG.themeTextColor.toLowerCase() !== "#ffffff") {
            css += `
                body, .message-body, .message-body .bbWrapper, 
                .structItem-title a, .node-title a, .p-title-value, 
                .message-name:not([class*="username--style"]), 
                .p-navgroup-linkText:not([class*="username--style"]), 
                .block-header, .block-minorHeader, .p-description, 
                .bbCodeBlock-content, .message-userTitle, .menu-row label, 
                .formRow-label, .p-breadcrumbs > li > a { color: ${CONFIG.themeTextColor} !important; }
                :root, html[data-color-scheme="light"], html[data-color-scheme="dark"] { --ah-text: ${CONFIG.themeTextColor} !important; }
            `;
        }
        
        if (cachedThemeStyle.textContent !== css) {
            cachedThemeStyle.textContent = css;
        }
    }

    function initCustomBackground() {
        if (!cachedBgContainer) {
            cachedBgContainer = document.getElementById('ah-animated-bg');
            if (!cachedBgContainer) {
                cachedBgContainer = document.createElement('div');
                cachedBgContainer.id = 'ah-animated-bg';
                
                const style = document.createElement('style');
                style.id = 'ah-bg-style';
                style.textContent = `
                    html, body, .p-pageWrapper { background: transparent !important; background-color: transparent !important; background-image: none !important; }
                    .p-pageWrapper { position: relative; z-index: 1; }
                    #ah-animated-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; background: #0b0b10; overflow: hidden; pointer-events: none; will-change: transform; transform: translateZ(0); }
                    .ah-light { position: absolute; border-radius: 50%; filter: blur(140px); transition: opacity 0.5s ease; will-change: transform, opacity; transform: translateZ(0); }
                    .ah-light-1 { width: 45vw; height: 45vw; background: var(--ah-accent); top: -20%; left: -10%; animation: ah-float-1 12s infinite ease-in-out alternate; }
                    .ah-light-2 { width: 40vw; height: 40vw; background: #8e44ad; bottom: -20%; right: -10%; animation: ah-float-2 18s infinite ease-in-out alternate -5s; }
                    .ah-light-3 { width: 35vw; height: 35vw; background: #2980b9; top: 30%; left: 40%; animation: ah-float-3 15s infinite ease-in-out alternate -2s; }
                    
                    @keyframes ah-float-1 { 0% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0.15; } 50% { transform: translate3d(10vw, 5vh, 0) scale(1.1); opacity: 0.5; } 100% { transform: translate3d(-5vw, 15vh, 0) scale(0.9); opacity: 0.15; } }
                    @keyframes ah-float-2 { 0% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0.15; } 50% { transform: translate3d(-10vw, -5vh, 0) scale(1.1); opacity: 0.5; } 100% { transform: translate3d(5vw, -15vh, 0) scale(0.9); opacity: 0.15; } }
                    @keyframes ah-float-3 { 0% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0.15; } 50% { transform: translate3d(5vw, 10vh, 0) scale(1.1); opacity: 0.5; } 100% { transform: translate3d(-10vw, -5vh, 0) scale(0.9); opacity: 0.15; } }
                `;
                document.head.appendChild(style);
                cachedBgContainer.innerHTML = `<div class="ah-light ah-light-1"></div><div class="ah-light ah-light-2"></div><div class="ah-light ah-light-3"></div>`;
                document.body.prepend(cachedBgContainer);
            }
        }
        
        cachedBgContainer.style.display = CONFIG.customBgEnabled ? 'block' : 'none';
    }

    function initClickableNodesFast() {
        if (window.ahNodesInitialized) return;
        window.ahNodesInitialized = true;
        
        document.body.addEventListener('click', handleNodeClick, true);
        document.body.addEventListener('auxclick', handleNodeAuxClick, true);
        document.body.addEventListener('mousedown', handleNodeMouseDown, true);
    }
    
    function isValidTarget(target) {
        return !target.closest('a, button, input, .labelLink, .avatar, .structItem-status');
    }
    
    function handleNodeClick(e) {
        if (e.button !== 0 || !isValidTarget(e.target)) return;
        const node = e.target.closest('.node-body, .structItem');
        if (!node) return;
        
        const mainLink = node.querySelector('.node-title a, .structItem-title a:not(.labelLink)');
        if (mainLink) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault(); e.stopPropagation(); window.open(mainLink.href, '_blank');
            } else {
                mainLink.click();
            }
        }
    }
    
    function handleNodeAuxClick(e) {
        if (e.button !== 1 || !isValidTarget(e.target)) return;
        const node = e.target.closest('.node-body, .structItem');
        if (!node) return;
        
        e.preventDefault(); e.stopPropagation();
        const mainLink = node.querySelector('.node-title a, .structItem-title a:not(.labelLink)');
        if (mainLink) window.open(mainLink.href, '_blank');
    }
    
    function handleNodeMouseDown(e) {
        if (e.button === 1 && isValidTarget(e.target) && e.target.closest('.node-body, .structItem')) e.preventDefault();
    }

    function initHeader() {
        if (!cachedNavTop) cachedNavTop = document.querySelector('.p-navTop');
        const contentRef = document.querySelector('.p-body-inner');
        if (!cachedNavTop || !contentRef || cachedNavTop.dataset.headerInit) return setTimeout(initHeader, 300);
        
        cachedNavTop.dataset.headerInit = 'true';
        let headerEl = cachedNavTop;
        
        headerEl.classList.add('js-auto-header'); 
        document.body.classList.add('js-header-fixed-active');
        headerEl.style.setProperty('background', 'transparent', 'important');
        
        const updatePos = function() {
            const r = contentRef.getBoundingClientRect();
            headerEl.style.left = Math.round(r.left) + 'px'; 
            headerEl.style.width = Math.round(r.width) + 'px';
            document.documentElement.style.setProperty('--auto-header-height', (headerEl.offsetHeight + 24) + 'px');
        };
        
        updatePos(); setTimeout(updatePos, 300); window.addEventListener('resize', updatePos, {passive:true});
        
        let lastScrollY = window.scrollY; 
        let ticking = false;
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    const currentY = window.scrollY;
                    headerEl.classList.toggle('header-hidden', currentY > lastScrollY && currentY > 80);
                    lastScrollY = currentY; 
                    ticking = false;
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
        if (forceRestart && canvas) { 
            canvas.remove(); 
            if (particleAnimationId) cancelAnimationFrame(particleAnimationId); 
            canvas = null; 
        }
        
        if (!canvas) {
            canvas = document.createElement('canvas'); 
            canvas.id = 'ah-particles-bg';
            // Стандартное поведение - канвас поверх заднего фона, но за карточками (z-index: 0)
            Object.assign(canvas.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', zIndex: '0', pointerEvents: 'none', opacity: '0.85', transition: 'opacity 0.5s ease', willChange: 'transform' });
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        const DOWNSCALE = 0.5; 
        const actualCount = Math.min(parseInt(CONFIG.pCount) || 70, 100); 
        
        const settings = {
            color: CONFIG.pColor || '#3498db', 
            lineDistSq: (130 * DOWNSCALE) * (130 * DOWNSCALE),
            speed: (CONFIG.pSpeed || 0.5) * DOWNSCALE,
            shape: CONFIG.pShape || 'circle', 
            size: (CONFIG.pSize || 3) * DOWNSCALE, 
            lines: CONFIG.pLines, 
            fading: CONFIG.pFading,
            emojis: (CONFIG.pEmojiText || '🌸').split(',').map(e => e.trim())
        };

        const rgbColor = hexToRgbFast(settings.color);
        const rgbStr = `${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}`;
        
        let width, height;
        const resize = function() { 
            width = canvas.width = window.innerWidth * DOWNSCALE; 
            height = canvas.height = window.innerHeight * DOWNSCALE; 
        };
        window.addEventListener('resize', resize, {passive:true}); resize();
        
        let mouseX = null, mouseY = null;
        const mouseRadiusSq = (150 * DOWNSCALE) * (150 * DOWNSCALE);
        const mouseRadius = 150 * DOWNSCALE;
        
        window.addEventListener('mousemove', function(e) { 
            mouseX = e.clientX * DOWNSCALE; 
            mouseY = e.clientY * DOWNSCALE; 
        }, {passive:true});
        window.addEventListener('mouseout', function() { mouseX = null; mouseY = null; }, {passive:true});
        
        const P_FIELDS = 9;
        const pData = new Float32Array(actualCount * P_FIELDS);
        
        for (let i = 0; i < actualCount; i++) {
            const idx = i * P_FIELDS;
            pData[idx] = Math.random() * width;     // x
            pData[idx+1] = Math.random() * height;  // y
            pData[idx+2] = (Math.random() * 2 - 1) * settings.speed; // dirX
            pData[idx+3] = (Math.random() * 2 - 1) * settings.speed; // dirY
            pData[idx+4] = (Math.random() * (settings.size * 0.5)) + (settings.size * 0.8); // size
            pData[idx+5] = Math.random(); // alpha
            pData[idx+6] = Math.random() > 0.5 ? 1 : -1; // fadeDir
            pData[idx+7] = Math.random() * 0.015 + 0.005; // fadeSpeed
            pData[idx+8] = Math.floor(Math.random() * settings.emojis.length); // emojiIdx
        }
        
        const animate = function() {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < actualCount; i++) {
                const idx = i * P_FIELDS;
                
                // Update
                if (mouseX !== null) {
                    const dx = mouseX - pData[idx];
                    const dy = mouseY - pData[idx+1]; 
                    const distSq = dx * dx + dy * dy;
                    if (distSq < mouseRadiusSq) { 
                        const dist = Math.sqrt(distSq);
                        pData[idx] -= (dx / dist) * ((mouseRadius - dist) / mouseRadius) * 3; 
                        pData[idx+1] -= (dy / dist) * ((mouseRadius - dist) / mouseRadius) * 3; 
                    }
                }
                
                pData[idx] += pData[idx+2];
                pData[idx+1] += pData[idx+3];
                
                if (pData[idx] < 0 || pData[idx] > width) pData[idx+2] *= -1;
                if (pData[idx+1] < 0 || pData[idx+1] > height) pData[idx+3] *= -1;

                if (settings.fading) {
                    pData[idx+5] += pData[idx+6] * pData[idx+7];
                    if (pData[idx+5] >= 1) { pData[idx+5] = 1; pData[idx+6] = -1; } 
                    else if (pData[idx+5] <= 0) {
                        pData[idx+5] = 0; pData[idx+6] = 1;
                        pData[idx] = Math.random() * width; 
                        pData[idx+1] = Math.random() * height;
                    }
                } else { pData[idx+5] = 1; }
                
                // Draw
                if (pData[idx+5] >= 0.05) {
                    ctx.globalAlpha = pData[idx+5];
                    const px = pData[idx] | 0;
                    const py = pData[idx+1] | 0;

                    if (settings.shape === 'emoji') {
                        ctx.font = `${pData[idx+4] * 4}px Arial`; 
                        ctx.fillStyle = settings.color; 
                        ctx.fillText(settings.emojis[pData[idx+8]], px, py);
                    } else {
                        ctx.beginPath();
                        if (settings.shape === 'square') ctx.rect(px, py, pData[idx+4] * 2, pData[idx+4] * 2); 
                        else ctx.arc(px, py, pData[idx+4], 0, 6.283);
                        ctx.fillStyle = settings.color; 
                        ctx.fill();
                    }
                }
            }
            
            // Connect
            if (settings.lines && settings.shape !== 'emoji') {
                ctx.lineWidth = 1; 
                ctx.globalAlpha = 1.0;
                
                for (let a = 0; a < actualCount; a++) {
                    const idxA = a * P_FIELDS;
                    const limit = Math.min(actualCount, a + 15);
                    for (let b = a + 1; b < limit; b++) {
                        const idxB = b * P_FIELDS;
                        const dx = pData[idxA] - pData[idxB]; 
                        const dy = pData[idxA+1] - pData[idxB+1]; 
                        const distSq = (dx * dx) + (dy * dy);
                        
                        if (distSq < settings.lineDistSq) {
                            const avgAlpha = settings.fading ? (pData[idxA+5] + pData[idxB+5]) / 2 : 1;
                            const opacity = (1 - (distSq / settings.lineDistSq)) * 0.8 * avgAlpha;
                            
                            if (opacity > 0.05) {
                                ctx.strokeStyle = `rgba(${rgbStr}, ${opacity.toFixed(2)})`;
                                ctx.beginPath(); 
                                ctx.moveTo(pData[idxA] | 0, pData[idxA+1] | 0); 
                                ctx.lineTo(pData[idxB] | 0, pData[idxB+1] | 0); 
                                ctx.stroke();
                            }
                        }
                    }
                }
            }
            
            ctx.globalAlpha = 1.0;
            particleAnimationId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    function initBlur() {
        if (!cachedBlurFilter) {
            document.body.insertAdjacentHTML('beforeend', `<svg xmlns="http://www.w3.org/2000/svg" style="width:0;height:0;position:absolute;pointer-events:none;"><filter id="motion-blur-vertical" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="0 0" id="blur-intensity" /></filter></svg>`);
            cachedBlurFilter = document.getElementById('blur-intensity');
        }
        
        if (!cachedBodyInner) cachedBodyInner = document.querySelector('.p-body-inner'); 
        if (!cachedBodyInner || !cachedBlurFilter) return;

        cachedBodyInner.style.willChange = 'filter';
        cachedBodyInner.style.transform = 'translateZ(0)';
        
        let lastScrollY = window.scrollY; 
        let scrollTimeout; 
        let ticking = false;
        const maxScrollHeight = 8000;

        window.addEventListener('scroll', function() {
            if (!CONFIG.blurEnabled || document.body.scrollHeight > maxScrollHeight) { 
                if (cachedBlurFilter.getAttribute('stdDeviation') !== '0 0') {
                    cachedBlurFilter.setAttribute('stdDeviation', '0 0'); 
                    cachedBodyInner.style.filter = 'none'; 
                }
                return; 
            }
            
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    const currentY = window.scrollY;
                    const intensity = CONFIG.blurIntensity || 15;
                    const multiplier = intensity / 100;
                    
                    const blurAmount = Math.min(Math.abs(currentY - lastScrollY) * multiplier, intensity).toFixed(1); 
                    lastScrollY = currentY;
                    
                    if (blurAmount > 1) { 
                        cachedBlurFilter.setAttribute('stdDeviation', `0 ${blurAmount}`); 
                        cachedBodyInner.style.filter = 'url(#motion-blur-vertical)'; 
                    }
                    
                    clearTimeout(scrollTimeout); 
                    scrollTimeout = setTimeout(function() { 
                        cachedBlurFilter.setAttribute('stdDeviation', '0 0'); 
                        cachedBodyInner.style.filter = 'none'; 
                    }, 50); 
                    
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    window.addEventListener('AH_SAVE_CONFIG', function(e) {
        Object.assign(CONFIG, e.detail);
        applyThemeColors();
        initCustomBackground();
        initParticlesBackground(true);
    });

    return {
        init: function(config) {
            CONFIG = config;
            applyThemeColors();
            
            runWhenReady(() => !!document.body, () => {
                initHeader();
                initCustomBackground();
                initParticlesBackground();
                initClickableNodesFast();
            });
            
            runWhenReady(() => !!document.querySelector('.p-body-inner'), initBlur);
        },
        onDOMUpdate: function() {
        }
    };
})();