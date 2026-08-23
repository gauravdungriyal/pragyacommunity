// Universal User Credentials, Dropdown Drawer, Dark Mode & Ambient Audio
(function () {
    // ── 0. Instant Dark Mode Initialization ──
    const savedTheme = localStorage.getItem('pragya_theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (document.body) document.body.classList.add('dark-theme');
    }

    // ── 1. Inject Premium Typography & Global Styles + Comprehensive Dark Mode Theme CSS ──
    if (!document.getElementById("pragya-global-fonts")) {
        const fontLink = document.createElement("link");
        fontLink.id = "pragya-global-fonts";
        fontLink.rel = "stylesheet";
        fontLink.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
        document.head.appendChild(fontLink);

        const style = document.createElement("style");
        style.id = "pragya-global-styles";
        style.textContent = `
            body, button, input, select, textarea {
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
                -webkit-font-smoothing: antialiased;
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            }
            h1, h2, h3, h4, .page-title, .section-title, .banner-title {
                font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif !important;
                letter-spacing: -0.015em;
            }
            
            /* Universal Topbar User Credential Pill */
            .user-menu-trigger {
                display: inline-flex !important;
                align-items: center !important;
                gap: 10px !important;
                background-color: #FFFFFF !important;
                border: 1px solid #00381F !important;
                padding: 4px 14px 4px 6px !important;
                border-radius: 999px !important;
                cursor: pointer !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
                transition: all 0.25s ease !important;
                height: auto !important;
                min-height: 42px !important;
                text-decoration: none !important;
                flex-shrink: 0 !important;
                width: auto !important;
                max-width: none !important;
                position: relative !important;
                z-index: 100 !important;
            }
            .user-menu-trigger:hover {
                border-color: #D9AE29 !important;
                box-shadow: 0 4px 14px rgba(0, 56, 31, 0.12) !important;
                transform: translateY(-1px) !important;
            }
            .user-avatar-circle {
                width: 38px !important;
                height: 38px !important;
                min-width: 38px !important;
                border-radius: 50% !important;
                background-color: #00381F !important;
                color: #FFFFFF !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-family: 'Plus Jakarta Sans', sans-serif !important;
                font-weight: 700 !important;
                font-size: 15px !important;
                letter-spacing: 0.5px !important;
                flex-shrink: 0 !important;
            }
            .user-details {
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-start !important;
                text-align: left !important;
                line-height: 1.25 !important;
                min-width: 0 !important;
            }
            .user-name {
                font-family: 'Plus Jakarta Sans', sans-serif !important;
                font-size: 13.5px !important;
                font-weight: 700 !important;
                color: #111111 !important;
                line-height: 1.2 !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                white-space: nowrap !important;
                max-width: none !important;
                overflow: visible !important;
                text-overflow: clip !important;
            }
            .user-tier-badge {
                font-family: 'Plus Jakarta Sans', sans-serif !important;
                font-size: 10px !important;
                background-color: #00381F !important;
                color: #D9AE29 !important;
                border: 1px solid #D9AE29 !important;
                padding: 2px 7px !important;
                border-radius: 99px !important;
                font-weight: 700 !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 3px !important;
                white-space: nowrap !important;
                box-shadow: 0 1px 4px rgba(0, 56, 31, 0.2) !important;
                line-height: 1.3 !important;
            }
            .user-role {
                font-family: 'Plus Jakarta Sans', sans-serif !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                color: #D9AE29 !important;
                line-height: 1.2 !important;
                margin-top: 1px !important;
                display: block !important;
                white-space: nowrap !important;
            }
            .user-menu-trigger i, .user-menu-trigger svg {
                width: 14px !important;
                height: 14px !important;
                color: #6F6F6F !important;
                margin-left: 2px !important;
                flex-shrink: 0 !important;
                display: inline-block !important;
            }

            /* ── Dropdown Drawer Pixel-Faithful to Screenshot ── */
            .user-dropdown {
                position: absolute !important;
                top: calc(100% + 12px) !important;
                right: 0 !important;
                min-width: 290px !important;
                width: 290px !important;
                background: #FFFFFF !important;
                border-radius: 20px !important;
                border: 1px solid #E5DDD2 !important;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
                z-index: 999999 !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
                transform: translateY(-8px) !important;
                transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s !important;
                overflow: hidden !important;
                display: block !important;
            }
            .user-dropdown.active {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
                transform: translateY(0) !important;
            }
            .dropdown-header {
                display: flex !important;
                align-items: flex-start !important;
                gap: 14px !important;
                padding: 20px 20px 16px !important;
            }
            .dropdown-avatar {
                width: 52px !important;
                height: 52px !important;
                background-color: #00381F !important;
                color: #FFFFFF !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-weight: 800 !important;
                font-size: 20px !important;
                flex-shrink: 0 !important;
                box-shadow: 0 3px 10px rgba(0, 56, 31, 0.25) !important;
            }
            .dropdown-user-info {
                display: flex !important;
                flex-direction: column !important;
                text-align: left !important;
                line-height: 1.3 !important;
            }
            .dropdown-name {
                font-size: 16px !important;
                font-weight: 800 !important;
                color: #00381F !important;
                font-family: 'Outfit', sans-serif !important;
            }
            .dropdown-streak-badge {
                font-size: 11.5px !important;
                font-weight: 700 !important;
                color: #D9AE29 !important;
                margin-top: 2px !important;
                display: flex !important;
                align-items: center !important;
                gap: 3px !important;
            }
            .dropdown-package {
                font-size: 11px !important;
                font-weight: 600 !important;
                color: #4A5568 !important;
                margin-top: 2px !important;
            }
            .dropdown-role {
                font-size: 11px !important;
                font-weight: 600 !important;
                color: #718096 !important;
                margin-top: 1px !important;
            }
            .dropdown-divider {
                height: 1px !important;
                background-color: #E5DDD2 !important;
                margin: 0 !important;
            }
            .dropdown-menu {
                list-style: none !important;
                padding: 8px 0 !important;
                margin: 0 !important;
            }
            .dropdown-item {
                display: flex !important;
                align-items: center !important;
                gap: 14px !important;
                padding: 12px 22px !important;
                color: #272727 !important;
                text-decoration: none !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                transition: all 0.2s ease !important;
            }
            .dropdown-item i, .dropdown-item svg {
                width: 18px !important;
                height: 18px !important;
                color: #4A5568 !important;
                flex-shrink: 0 !important;
            }
            .dropdown-item:hover {
                background-color: #E8F2ED !important;
                color: #00381F !important;
                padding-left: 26px !important;
            }
            .dropdown-item:hover i, .dropdown-item:hover svg {
                color: #00381F !important;
            }
            .dropdown-item.logout-item {
                color: #272727 !important;
            }
            .dropdown-item.logout-item:hover {
                background-color: #FFF5F5 !important;
                color: #9B1C1C !important;
            }
            .dropdown-item.logout-item:hover i {
                color: #9B1C1C !important;
            }

            /* Universal Sticky Sidebar */
            @media (min-width: 901px) {
                .sidebar {
                    position: fixed !important;
                    top: 0 !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    width: 272px !important;
                    height: 100vh !important;
                    overflow-y: auto !important;
                    z-index: 1000 !important;
                    display: flex !important;
                    transform: none !important;
                }
                .main-wrapper {
                    margin-left: 272px !important;
                    width: calc(100% - 272px) !important;
                    min-width: 0 !important;
                }
            }

            /* ── GLOBAL DARK MODE THEME SYSTEM (MYSTIC YOGIC OBSIDIAN) ── */
            [data-theme="dark"], body.dark-theme {
                --bg-body: #071710 !important;
                --bg-card: #0D261B !important;
                --bg-sidebar: #06150E !important;
                --bg-soft: #123325 !important;
                --text-main: #F5EFE5 !important;
                --text-heading: #FFFFFF !important;
                --text-muted: #9EBAAA !important;
                --border: rgba(217, 174, 41, 0.24) !important;
                --primary-light: #163E2D !important;
                background-color: #071710 !important;
                color: #F5EFE5 !important;
            }
            [data-theme="dark"] .dashboard-container,
            [data-theme="dark"] .main-wrapper,
            [data-theme="dark"] .content-grid,
            [data-theme="dark"] .content-area,
            [data-theme="dark"] #root,
            [data-theme="dark"] .chat-window,
            [data-theme="dark"] .chat-messages-stream,
            [data-theme="dark"] .bg-gray-50,
            [data-theme="dark"] .bg-slate-50,
            [data-theme="dark"] .min-h-screen {
                background-color: #071710 !important;
                color: #F5EFE5 !important;
            }
            [data-theme="dark"] .dashboard-card,
            [data-theme="dark"] .sidebar,
            [data-theme="dark"] .topbar,
            [data-theme="dark"] .user-dropdown,
            [data-theme="dark"] .res-card,
            [data-theme="dark"] .mentor-card,
            [data-theme="dark"] .notification-card,
            [data-theme="dark"] .conversation-panel,
            [data-theme="dark"] .chat-header,
            [data-theme="dark"] .chat-input-area,
            [data-theme="dark"] .audio-studio-card,
            [data-theme="dark"] .anatomy-explorer-card,
            [data-theme="dark"] .glossary-card,
            [data-theme="dark"] .modal-content,
            [data-theme="dark"] .reader-modal-frame,
            [data-theme="dark"] .card,
            [data-theme="dark"] .settings-card,
            [data-theme="dark"] .bg-white,
            [data-theme="dark"] .bg-card {
                background-color: #0D261B !important;
                border-color: rgba(217, 174, 41, 0.22) !important;
                color: #F5EFE5 !important;
            }
            [data-theme="dark"] .text-gray-900,
            [data-theme="dark"] .text-gray-800,
            [data-theme="dark"] .text-slate-900 {
                color: #FFFFFF !important;
            }
            [data-theme="dark"] .text-gray-600,
            [data-theme="dark"] .text-gray-500,
            [data-theme="dark"] .text-slate-600 {
                color: #9EBAAA !important;
            }
            [data-theme="dark"] .border-gray-200,
            [data-theme="dark"] .border-gray-100,
            [data-theme="dark"] .border-slate-200 {
                border-color: rgba(217, 174, 41, 0.2) !important;
            }
            [data-theme="dark"] .user-menu-trigger {
                background-color: #0D261B !important;
                border-color: #D9AE29 !important;
                color: #F5EFE5 !important;
            }
            [data-theme="dark"] .user-name {
                color: #FFFFFF !important;
            }
            [data-theme="dark"] .dropdown-name {
                color: #FFFFFF !important;
            }
            [data-theme="dark"] .dropdown-package,
            [data-theme="dark"] .dropdown-role {
                color: #9EBAAA !important;
            }
            [data-theme="dark"] .dropdown-divider {
                background-color: rgba(217, 174, 41, 0.2) !important;
            }
            [data-theme="dark"] .dropdown-item {
                color: #F5EFE5 !important;
            }
            [data-theme="dark"] .dropdown-item i, [data-theme="dark"] .dropdown-item svg {
                color: #9EBAAA !important;
            }
            [data-theme="dark"] .dropdown-item:hover {
                background-color: #163E2D !important;
                color: #D9AE29 !important;
            }
            [data-theme="dark"] .dropdown-item:hover i {
                color: #D9AE29 !important;
            }
            [data-theme="dark"] .search-input,
            [data-theme="dark"] input,
            [data-theme="dark"] select,
            [data-theme="dark"] textarea {
                background-color: #123325 !important;
                color: #FFFFFF !important;
                border-color: rgba(217, 174, 41, 0.3) !important;
            }
            [data-theme="dark"] .search-input::placeholder,
            [data-theme="dark"] input::placeholder,
            [data-theme="dark"] textarea::placeholder {
                color: rgba(245, 239, 229, 0.6) !important;
            }
            [data-theme="dark"] .nav-item a {
                color: #9EBAAA !important;
            }
            [data-theme="dark"] .nav-item a:hover {
                background-color: #123325 !important;
                color: #D9AE29 !important;
            }
            [data-theme="dark"] .nav-item.active a {
                background-color: #00381F !important;
                color: #FFFFFF !important;
                border: 1px solid #D9AE29 !important;
                box-shadow: 0 4px 14px rgba(217, 174, 41, 0.25) !important;
            }
            [data-theme="dark"] .icon-btn-badge,
            [data-theme="dark"] .sidebar-toggle-btn {
                background-color: #0D261B !important;
                border-color: rgba(217, 174, 41, 0.3) !important;
                color: #F5EFE5 !important;
            }
            [data-theme="dark"] .icon-btn-badge:hover,
            [data-theme="dark"] .sidebar-toggle-btn:hover {
                background-color: #163E2D !important;
                color: #D9AE29 !important;
            }
            [data-theme="dark"] .welcome-banner {
                background: linear-gradient(135deg, #05160E 0%, #0A291A 50%, #4D4C1E 100%) !important;
                border: 1px solid rgba(217, 174, 41, 0.35) !important;
            }
            [data-theme="dark"] .footer {
                background-color: #06150E !important;
                border-color: rgba(217, 174, 41, 0.2) !important;
            }
            [data-theme="dark"] .footer-links a,
            [data-theme="dark"] .footer-contact p {
                color: #9EBAAA !important;
            }
            [data-theme="dark"] .footer-links a:hover {
                color: #D9AE29 !important;
            }
            [data-theme="dark"] .activity-item,
            [data-theme="dark"] .conv-card,
            [data-theme="dark"] .glossary-item,
            [data-theme="dark"] .audio-track-item,
            [data-theme="dark"] .anatomy-cue-card,
            [data-theme="dark"] .asana-chip,
            [data-theme="dark"] .cat-filter-btn {
                background-color: #123325 !important;
                border-color: rgba(217, 174, 41, 0.2) !important;
                color: #F5EFE5 !important;
            }
            [data-theme="dark"] .msg-bubble-wrap.received .msg-bubble {
                background-color: #123325 !important;
                border-color: rgba(217, 174, 41, 0.2) !important;
                color: #F5EFE5 !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ── Global Theme Switcher Helper API ──
    window.setPragyaTheme = function (theme) {
        localStorage.setItem('pragya_theme', theme);
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-theme');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.body.classList.remove('dark-theme');
        }
        window.dispatchEvent(new CustomEvent('pragyaThemeChanged', { detail: { theme } }));
    };

    window.togglePragyaTheme = function () {
        const current = localStorage.getItem('pragya_theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        window.setPragyaTheme(next);
        return next;
    };

    if (window.lucide) {
        lucide.createIcons();
    }

    const sidebar = document.querySelector(".sidebar");
    const toggle = document.getElementById("sidebarToggle");

    if (sidebar && toggle) {
        toggle.addEventListener("click", function (e) {
            e.stopPropagation();
            if (window.innerWidth <= 900) {
                document.body.classList.toggle("sidebar-open");
            } else {
                document.body.classList.toggle("sidebar-collapsed");
            }
        });
    }

    // ── Universal Click & Direct Attachment Handler for User Dropdown ──
    function setupDropdownHandlers() {
        const triggers = document.querySelectorAll(".user-menu-trigger, #userMenuTrigger");
        triggers.forEach(trigger => {
            trigger.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = document.getElementById("userDropdown") || document.querySelector(".user-dropdown");
                if (dropdown) {
                    dropdown.classList.toggle("active");
                    if (window.lucide) lucide.createIcons();
                }
            };
        });
    }

    document.addEventListener("click", function (e) {
        const trigger = e.target.closest("#userMenuTrigger, .user-menu-trigger");
        const dropdown = document.getElementById("userDropdown") || document.querySelector(".user-dropdown");
        if (trigger) {
            e.preventDefault();
            e.stopPropagation();
            if (dropdown) {
                dropdown.classList.toggle("active");
                if (window.lucide) lucide.createIcons();
            }
            return;
        }
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });

    // ── Universal Sync Function for Pragya User Credentials & Dropdown Content ──
    window.syncGlobalUserCredentials = function () {
        let savedUserName = localStorage.getItem("userName");
        if (!savedUserName || savedUserName === "Jane Doe" || savedUserName === "User" || savedUserName === "null" || savedUserName === "undefined") {
            savedUserName = "Pragya";
            try {
                localStorage.setItem("userName", "Pragya");
                localStorage.setItem("userRole", "Student");
                localStorage.setItem("userBadge", "Super Diamond 💎✨");
                localStorage.setItem("userStreak", "36");
            } catch (e) { }
        }
        const isPragya = savedUserName.toLowerCase().includes("pragya");
        const userBadge = localStorage.getItem("userBadge") || "Super Diamond 💎✨";
        const userStreak = localStorage.getItem("userStreak") || "36";
        const userPackage = localStorage.getItem("userPackage") || "Master 300–Hr YTT & Spine Therapy";
        const savedUserRole = localStorage.getItem("userRole") || "Student";
        const savedInitials = isPragya ? "P" : (savedUserName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'P');
        const savedImage = localStorage.getItem("profileImage");

        // Determine correct relative path for navigation links
        const isInEvents = window.location.pathname.includes('/events/');
        const base = isInEvents ? '../' : '';

        // Topbar Pill Names with SuperDiamond Badge
        document.querySelectorAll('.user-name').forEach(el => {
            el.innerHTML = `${savedUserName} <span class="user-tier-badge">💎 ✨ SuperDiamond</span>`;
        });

        // Dropdown Header Details (matching Screenshot 2)
        document.querySelectorAll('.dropdown-user-info').forEach(el => {
            el.innerHTML = `
                <span class="dropdown-name">${savedUserName}</span>
                <div class="dropdown-streak-badge">${userBadge} · 🔥 ${userStreak}–Day Streak</div>
                <div class="dropdown-package">${userPackage}</div>
                <span class="dropdown-role">${savedUserRole}</span>
            `;
        });

        // Ensure links are active and functional
        const profileLink = document.getElementById('dropdownProfileLink');
        if (profileLink) profileLink.href = `${base}Profile.html`;

        const settingsLink = document.getElementById('dropdownSettingsLink');
        if (settingsLink) settingsLink.href = `${base}setting.html`;

        const helpLink = document.getElementById('dropdownHelpLink');
        if (helpLink) helpLink.href = `${base}help-support.html`;

        const logoutLink = document.getElementById('dropdownLogoutLink');
        if (logoutLink) {
            logoutLink.href = `${base}index.html`;
            logoutLink.onclick = function (e) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            };
        }

        // User Roles
        document.querySelectorAll('.user-role').forEach(el => {
            el.textContent = savedUserRole;
        });

        // Avatars & Initials
        document.querySelectorAll('.user-avatar-circle, .dropdown-avatar, #dashboardPostAvatar').forEach(el => {
            if (savedImage) {
                el.style.backgroundImage = `url(${savedImage})`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.style.backgroundRepeat = 'no-repeat';
                el.textContent = '';
            } else {
                el.style.backgroundImage = 'none';
                el.textContent = savedInitials;
            }
        });

        // Hero Banner if present
        const heroBannerName = document.getElementById('heroBannerName');
        if (heroBannerName) {
            heroBannerName.innerText = savedUserName.split(' ')[0] + '!';
        }

        // Apply dark mode if set
        const theme = localStorage.getItem('pragya_theme') || 'light';
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-theme');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.body.classList.remove('dark-theme');
        }

        setupDropdownHandlers();
    };

    // ── 2. Floating Ambient Meditation Audio Bar (432Hz Om Frequency) ──
    function initAmbientMeditationPlayer() {
        if (document.getElementById("pragya-ambient-player")) return;

        const container = document.createElement("div");
        container.id = "pragya-ambient-player";
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 99999;
            background: rgba(0, 56, 31, 0.94);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(217, 174, 41, 0.45);
            border-radius: 30px;
            padding: 8px 18px 8px 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.28);
            color: #fff;
            font-size: 12.5px;
            font-weight: 600;
            transition: transform 0.3s ease, background 0.3s ease;
            cursor: pointer;
        `;

        container.innerHTML = `
            <button id="btnAmbientToggle" style="width: 36px; height: 36px; border-radius: 50%; border: none; background: #D9AE29; color: #00381F; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; box-shadow: 0 3px 10px rgba(217, 174, 41, 0.4); transition: transform 0.2s, background 0.2s; flex-shrink: 0;">
                ▶
            </button>
            <div style="display: flex; flex-direction: column;">
                <span style="font-size: 12px; color: #D9AE29; font-weight: 800; display: flex; align-items: center; gap: 5px; font-family: 'Outfit', sans-serif;">
                    <span>🕉️</span> 432Hz Om Frequency
                </span>
                <span style="font-size: 10px; color: rgba(255,255,255,0.85);">Sadhana Background Mode</span>
            </div>
        `;

        document.body.appendChild(container);

        let audioCtx = null;
        let osc1 = null, osc2 = null, gainNode = null;
        let isPlaying = false;

        const toggleBtn = document.getElementById("btnAmbientToggle");
        container.addEventListener("click", () => {
            if (!isPlaying) {
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    audioCtx = new AudioContext();

                    // 432Hz Fundamental + 108Hz Sub-harmonic (OM frequency)
                    osc1 = audioCtx.createOscillator();
                    osc2 = audioCtx.createOscillator();
                    gainNode = audioCtx.createGain();

                    osc1.type = "sine";
                    osc1.frequency.setValueAtTime(432, audioCtx.currentTime);
                    
                    osc2.type = "triangle";
                    osc2.frequency.setValueAtTime(108, audioCtx.currentTime);

                    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 3);

                    osc1.connect(gainNode);
                    osc2.connect(gainNode);
                    gainNode.connect(audioCtx.destination);

                    osc1.start();
                    osc2.start();

                    isPlaying = true;
                    toggleBtn.innerHTML = "⏸";
                    toggleBtn.style.background = "#FFFFFF";
                    container.style.borderColor = "#D9AE29";
                    container.style.boxShadow = "0 12px 36px rgba(217, 174, 41, 0.35)";
                } catch (e) {
                    console.warn("Audio Context init error:", e);
                }
            } else {
                if (gainNode && audioCtx) {
                    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1);
                    setTimeout(() => {
                        try {
                            if (osc1) osc1.stop();
                            if (osc2) osc2.stop();
                            if (audioCtx && audioCtx.state !== 'closed') {
                                audioCtx.close();
                            }
                        } catch (e) { }
                        isPlaying = false;
                        toggleBtn.innerHTML = "▶";
                        toggleBtn.style.background = "#D9AE29";
                        container.style.borderColor = "rgba(217, 174, 41, 0.45)";
                        container.style.boxShadow = "0 12px 36px rgba(0, 0, 0, 0.28)";
                    }, 1000);
                }
            }
        });
    }

    // Run on load and storage change
    document.addEventListener("DOMContentLoaded", () => {
        window.syncGlobalUserCredentials();
        initAmbientMeditationPlayer();
        setupDropdownHandlers();
    });
    window.addEventListener("storage", window.syncGlobalUserCredentials);
    window.addEventListener("pragyaThemeChanged", () => {
        const theme = localStorage.getItem('pragya_theme') || 'light';
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-theme');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.body.classList.remove('dark-theme');
        }
    });
    window.syncGlobalUserCredentials();
    initAmbientMeditationPlayer();
})();
