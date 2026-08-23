// ====================================================
// Pragya Connect — Admin ↔ Platform Sync Layer
// admin-sync.js
// Reads all admin-managed localStorage keys and exposes
// unified helpers for the platform pages to consume.
// ====================================================

const AdminSync = {

    // ─── HELPERS ────────────────────────────────────────────────
    _get(key, fallback = []) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    },
    _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

    // ─── EVENTS ─────────────────────────────────────────────────
    getActiveEvents() {
        const today = new Date().toISOString().split('T')[0];
        return this._get('admin_events', []).filter(ev => {
            const published = ev.publish <= today;
            const notExpired = ev.expiry >= today;
            return published && notExpired;
        });
    },

    getActivePopupEvent() {
        const events = this.getActiveEvents();
        return events.find(ev => ev.popup) || null;
    },

    // Returns all active events sorted by date asc
    getUpcomingEvents() {
        return this.getActiveEvents().sort((a, b) => a.date.localeCompare(b.date));
    },

    // ─── POPUP LOGIC ────────────────────────────────────────────
    /**
     * Render the login popup on the platform if:
     *   - An active admin event with popup=true exists
     *   - User hasn't dismissed it this session
     */
    maybeShowPopup() {
        const ev = this.getActivePopupEvent();
        if (!ev) return;

        // Per-session dismiss key
        const dismissKey = `popup_dismissed_${ev.id}`;
        if (sessionStorage.getItem(dismissKey)) return;

        this._injectPopupStyles();
        this._createPopupDOM(ev, dismissKey);
    },

    _injectPopupStyles() {
        if (document.getElementById('adminsync-popup-style')) return;
        const style = document.createElement('style');
        style.id = 'adminsync-popup-style';
        style.textContent = `
            #adminsync-popup-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.55);
                z-index: 99999; display: flex; align-items: center;
                justify-content: center; padding: 16px;
                animation: fadeInOverlay 0.35s ease;
            }
            @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
            #adminsync-popup {
                background: #fff; border-radius: 22px; max-width: 420px; width: 100%;
                box-shadow: 0 24px 64px rgba(0,0,0,0.18);
                overflow: hidden;
                animation: slideUpPopup 0.4s cubic-bezier(.34,1.56,.64,1);
            }
            @keyframes slideUpPopup {
                from { opacity: 0; transform: translateY(40px) scale(0.95); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            .adminsync-popup-header {
                background: linear-gradient(135deg, #00381F 60%, #00522E);
                padding: 22px 22px 18px; position: relative;
            }
            .adminsync-popup-close {
                position: absolute; top: 14px; right: 16px;
                background: rgba(255,255,255,0.15); border: none; border-radius: 50%;
                width: 30px; height: 30px; color: #fff; font-size: 18px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                line-height: 1; transition: background 0.2s;
            }
            .adminsync-popup-close:hover { background: rgba(255,255,255,0.28); }
            .adminsync-popup-badge {
                display: inline-block; background: #D9AE29; color: #fff;
                font-size: 10px; font-weight: 700; letter-spacing: 1px;
                padding: 3px 10px; border-radius: 99px; text-transform: uppercase;
                margin-bottom: 8px;
            }
            .adminsync-popup-title {
                font-size: 20px; font-weight: 800; color: #fff; margin: 0;
                line-height: 1.25;
            }
            .adminsync-popup-body { padding: 20px 22px 22px; }
            .adminsync-popup-date {
                display: flex; align-items: center; gap: 7px;
                font-size: 13px; color: #6F6F6F; margin-bottom: 12px;
            }
            .adminsync-popup-desc {
                font-size: 14px; color: #272727; line-height: 1.6; margin-bottom: 20px;
            }
            .adminsync-popup-btn {
                display: block; width: 100%; padding: 13px;
                background: #00381F; color: #fff; border: none; border-radius: 12px;
                font-size: 15px; font-weight: 700; cursor: pointer; text-align: center;
                text-decoration: none; transition: background 0.2s, transform 0.15s;
            }
            .adminsync-popup-btn:hover { background: #00522E; transform: translateY(-1px); }
            .adminsync-popup-btn.no-link { background: #D9AE29; }
            .adminsync-popup-skip {
                display: block; text-align: center; margin-top: 12px;
                font-size: 12px; color: #6F6F6F; cursor: pointer;
                transition: color 0.2s;
            }
            .adminsync-popup-skip:hover { color: #00381F; }
            @media (max-width: 480px) {
                #adminsync-popup { max-width: 94vw; border-radius: 18px; }
                .adminsync-popup-header { padding: 18px 16px 14px; }
                .adminsync-popup-body { padding: 16px; }
                .adminsync-popup-title { font-size: 17px; }
            }
        `;
        document.head.appendChild(style);
    },

    _createPopupDOM(ev, dismissKey) {
        const overlay = document.createElement('div');
        overlay.id = 'adminsync-popup-overlay';

        const dateStr = ev.date
            ? new Date(ev.date + 'T00:00:00').toLocaleDateString('en-HK', { day: 'numeric', month: 'long', year: 'numeric' })
            : '';

        const regBtn = ev.regLink
            ? `<a href="${ev.regLink}" target="_blank" rel="noopener" class="adminsync-popup-btn">Register Now</a>`
            : `<button class="adminsync-popup-btn no-link" onclick="AdminSync.closePopup()">Learn More</button>`;

        overlay.innerHTML = `
            <div id="adminsync-popup">
                <div class="adminsync-popup-header">
                    <button class="adminsync-popup-close" onclick="AdminSync.closePopup()">&#215;</button>
                    <div class="adminsync-popup-badge">Featured Event</div>
                    <h2 class="adminsync-popup-title">${ev.title}</h2>
                </div>
                <div class="adminsync-popup-body">
                    ${dateStr ? `<div class="adminsync-popup-date">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${dateStr}
                    </div>` : ''}
                    <p class="adminsync-popup-desc">${ev.desc || 'Join us for this exciting event!'}</p>
                    ${regBtn}
                    <span class="adminsync-popup-skip" onclick="AdminSync.closePopup()">Skip for now</span>
                </div>
            </div>
        `;

        // Close on overlay click
        overlay.addEventListener('click', e => {
            if (e.target === overlay) AdminSync.closePopup();
        });

        document.body.appendChild(overlay);
        this._currentDismissKey = dismissKey;
    },

    closePopup() {
        const overlay = document.getElementById('adminsync-popup-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.25s ease';
            setTimeout(() => overlay.remove(), 260);
        }
        if (this._currentDismissKey) {
            sessionStorage.setItem(this._currentDismissKey, '1');
        }
    },

    // ─── NOTIFICATIONS ──────────────────────────────────────────
    /**
     * Admin broadcasts push to 'local_notifications' in admin/notifications.html.
     * This helper exposes unread count for platform badges.
     */
    getUnreadNotifCount() {
        const notifs = this._get('local_notifications', []);
        return notifs.filter(n => !n.is_read).length;
    },

    getNotifications() {
        return this._get('local_notifications', []);
    },

    markAllRead() {
        const notifs = this._get('local_notifications', []).map(n => ({ ...n, is_read: true }));
        this._set('local_notifications', notifs);
    },

    // ─── MENTORS ────────────────────────────────────────────────
    /**
     * Returns all admin-managed mentors.
     * Platform's mentors.html should call this to render real data.
     */
    getMentors() {
        const stored = this._get('admin_mentors', null);
        if (stored && stored.length) return stored;
        if (typeof window.teachers !== 'undefined' && Array.isArray(window.teachers)) {
            return window.teachers;
        }
        return [
          { id: '1', name: 'Aarya Kuldeep', expertise: 'Founder & MSc. Yogic Science', skills: ['Yoga', 'Meditation', 'Leadership'], bio: 'Founder of Pragya Yog School and experienced Yoga Teacher.', featured: true },
          { id: '2', name: 'Dr. Yatendra Dutt Amoli', expertise: 'Kashmir Shaivism & Tantra', skills: ['Yoga Philosophy', 'Meditation', 'Tantra'], bio: 'PhD in Yog and specialist in Kashmir Shaivism and Tantra.', featured: true },
          { id: '3', name: 'Dr. Usha Jaiswal', expertise: 'Pranic Healing & Energy Work', skills: ['Pranic Healing', 'Energy Healing'], bio: 'Pranic Healing expert and Master Teacher.', featured: true },
          { id: '4', name: 'Dr. Rakesh Jaiswal', expertise: 'Spiritual Psychology & Training', skills: ['Psychology', 'Counselling'], bio: 'Expert in Spiritual Psychology and Transformational Training.', featured: true },
          { id: '5', name: 'Angela', expertise: 'Yoga & Beginner Asana', skills: ['Yoga', 'Stretching', 'Breathing'], bio: 'Yoga instructor teaching mindfulness since 2021.', featured: false },
          { id: '6', name: 'Ashish Prajapati', expertise: 'Yogic Science & Hatha Yoga', skills: ['M.Sc. Yogic Science', 'Teaching'], bio: 'Dedicated Yoga Instructor with academic expertise in Yogic Science.', featured: false },
          { id: '7', name: 'Charlotte', expertise: 'Hatha Yoga & Mindfulness', skills: ['Hatha Yoga', 'Mindfulness'], bio: 'Practicing and teaching yoga since 2017.', featured: false },
          { id: '8', name: 'Louise', expertise: 'Inclusive Yoga & Wellness', skills: ['Inclusive Yoga', 'Breathing'], bio: 'Believes yoga is accessible for every body.', featured: false },
          { id: '9', name: 'Marcus', expertise: 'Mindfulness & Stress Relief', skills: ['Mindfulness', 'Meditation'], bio: 'Experienced instructor focused on meditation & mindfulness.', featured: false },
          { id: '10', name: 'Tavia', expertise: 'Vinyasa Yoga & Strength', skills: ['Vinyasa Yoga', 'Fitness'], bio: 'Certified Vinyasa Yoga Instructor.', featured: false }
        ];
    },

    getFeaturedMentors() {
        return this.getMentors().filter(m => m.featured);
    },

    // ─── RESOURCES ──────────────────────────────────────────────
    /**
     * Returns all admin-managed resources, optionally filtered by category.
     */
    getResources(category = null) {
        let stored = this._get('admin_resources', null);
        if (!stored || !stored.length) {
            stored = [
                { id: '1', title: 'Complete Pranayama Guide 2026', desc: 'Beginner to Advanced Pranayama Notes & Techniques', cat: 'Yoga', type: 'PDF', size: '2.4 MB', author: 'Dr. Akhilesh', date: '2026-06-12', url: '#' },
                { id: '2', title: 'Mindfulness Meditation Slides', desc: 'Presentation slides for mindfulness session', cat: 'Meditation', type: 'PPT', size: '4.8 MB', author: 'Gyan Prakash', date: '2026-06-20', url: '#' },
                { id: '3', title: 'Breathing Exercises & Techniques', desc: 'Guided video tutorial on deep breathing exercises', cat: 'Meditation', type: 'Video', size: '18 mins', author: 'Priya Sharma', date: '2026-07-15', url: '#' },
                { id: '4', title: 'Yoga Research Paper 2025', desc: 'Scientific review of yoga benefits on mental clarity', cat: 'Research', type: 'DOC', size: '1.2 MB', author: 'Research Team', date: '2026-07-02', url: '#' },
                { id: '5', title: 'Workshop Presentation on Adjustment', desc: 'PPT slides for postural adjustment and alignment', cat: 'Adjustment', type: 'PPT', size: '5.1 MB', author: 'Aarya Kuldeep', date: '2026-07-20', url: '#' },
                { id: '6', title: 'Yoga Philosophy & Sutras Book', desc: 'Complete translation and commentary on Yoga Sutras', cat: 'Books', type: 'PDF', size: '6.5 MB', author: 'Dr. Yatendra', date: '2026-07-25', url: '#' }
            ];
            this._set('admin_resources', stored);
        }
        // Normalize fields (cat/category, desc/description, size, timeText)
        const normalized = stored.map(r => ({
            ...r,
            category: r.cat || r.category || 'Yoga',
            cat: r.cat || r.category || 'Yoga',
            description: r.desc || r.description || '',
            desc: r.desc || r.description || '',
            size: r.size || (r.type === 'Video' ? '15 mins' : '2.5 MB'),
            timeText: r.date ? `Uploaded ${r.date}` : (r.timeText || 'Recently updated')
        }));
        if (!category || category === 'all') return normalized;
        return normalized.filter(r => (r.category || '').toLowerCase() === category.toLowerCase());
    },

    // ─── COMMUNITY POSTS ────────────────────────────────────────
    /**
     * Merges admin posts + user posts.
     * Admin can pin & feature posts; those appear at the top.
     */
    getCommunityPosts() {
        const adminPosts = this._get('posts', []);    // admin_community uses 'posts'
        const localPosts = this._get('local_posts', []);
        // Deduplicate by id
        const all = [...adminPosts, ...localPosts];
        const seen = new Set();
        const unique = all.filter(p => {
            const id = p._id || p.id;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
        // Sort: pinned first, then by date desc
        return unique.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    },

    // ─── USERS ──────────────────────────────────────────────────
    getUsers() {
        const stored = this._get('admin_users', null);
        if (stored && stored.length) return stored;
        return [
          { id: '1', name: 'Gyan Prakash', email: 'gyan@pyshk.com', role: 'Admin', status: 'Active', joined: '2026-01-10' },
          { id: '2', name: 'Aarya Kuldeep', email: 'aarya@pyshk.com', role: 'Mentor', status: 'Active', joined: '2026-01-01' },
          { id: '3', name: 'Dr. Yatendra Dutt Amoli', email: 'yatendra@pyshk.com', role: 'Mentor', status: 'Active', joined: '2026-01-02' },
          { id: '4', name: 'Dr. Usha Jaiswal', email: 'usha@pyshk.com', role: 'Mentor', status: 'Active', joined: '2026-01-03' },
          { id: '5', name: 'Dr. Rakesh Jaiswal', email: 'rakesh@pyshk.com', role: 'Mentor', status: 'Active', joined: '2026-01-04' },
          { id: '6', name: 'Angela', email: 'angela@pyshk.com', role: 'Mentor', status: 'Active', joined: '2026-01-15' },
          { id: '7', name: 'Ashish Prajapati', email: 'ashish@pyshk.com', role: 'Mentor', status: 'Active', joined: '2026-01-20' },
          { id: '8', name: 'Charlotte', email: 'charlotte@pyshk.com', role: 'Mentor', status: 'Active', joined: '2026-02-01' },
          { id: '9', name: 'Louise', email: 'louise@pyshk.com', role: 'Mentor', status: 'Active', joined: '2026-02-05' },
          { id: '10', name: 'Marcus', email: 'marcus@pyshk.com', role: 'Mentor', status: 'Active', joined: '2026-02-10' },
          { id: '11', name: 'Tavia', email: 'tavia@pyshk.com', role: 'Mentor', status: 'Active', joined: '2026-02-12' },
          { id: '12', name: 'Priya Sharma', email: 'priya@example.com', role: 'Student', status: 'Active', joined: '2026-02-14' },
          { id: '13', name: 'Rahul Verma', email: 'rahul@example.com', role: 'Student', status: 'Active', joined: '2026-03-01' },
          { id: '14', name: 'Ananya Gupta', email: 'ananya@example.com', role: 'Student', status: 'Suspended', joined: '2026-03-12' },
          { id: '15', name: 'Sunita Roy', email: 'sunita@example.com', role: 'Student', status: 'Active', joined: '2026-04-02' }
        ];
    },


    getUserById(id) {
        return this.getUsers().find(u => u.id === id || u._id === id) || null;
    },

    // ─── PROMOTIONS ─────────────────────────────────────────────
    /**
     * Returns currently active promotions (for banner/dashboard display).
     */
    getActivePromotions() {
        const today = new Date().toISOString().split('T')[0];
        return this._get('admin_promotions', []).filter(p => {
            const started = !p.startDate || p.startDate <= today;
            const notEnded = !p.endDate || p.endDate >= today;
            return started && notEnded && p.active !== false;
        }).sort((a, b) => (a.priority || 5) - (b.priority || 5));
    },

    // ─── PLATFORM DASHBOARD SYNC ────────────────────────────────
    /**
     * Updates the platform dashboard "upcoming events" widget with admin events.
     * Call this in dashboard.html after DOM is loaded.
     */
    syncDashboardEvents(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const events = this.getUpcomingEvents().slice(0, 3);
        if (!events.length) return;

        const today = new Date().toISOString().split('T')[0];

        container.innerHTML = events.map(ev => {
            const daysLeft = Math.max(0, Math.ceil((new Date(ev.date) - new Date()) / 86400000));
            const dateStr = new Date(ev.date + 'T00:00:00').toLocaleDateString('en-HK', { day: 'numeric', month: 'short' });
            return `
                <div class="admin-sync-event-item" style="
                    display:flex; align-items:flex-start; gap:14px;
                    padding:14px 0; border-bottom:1px solid var(--border,#E5DDD2);
                ">
                    <div style="
                        min-width:46px; height:46px; background:var(--primary-light,#E8F2ED);
                        border-radius:12px; display:flex; flex-direction:column;
                        align-items:center; justify-content:center;
                        color:var(--primary,#00381F); font-weight:700;
                    ">
                        <span style="font-size:11px; line-height:1;">${dateStr.split(' ')[1] || ''}</span>
                        <span style="font-size:18px; line-height:1;">${dateStr.split(' ')[0]}</span>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:14px; font-weight:600; color:var(--text-heading,#00381F); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${ev.featured ? '<span style="color:var(--accent,#D9AE29); font-size:11px;">★ Featured &bull; </span>' : ''}${ev.title}
                        </div>
                        <div style="font-size:12px; color:var(--text-muted,#6F6F6F); margin-top:2px;">
                            ${daysLeft === 0 ? '<strong style="color:var(--danger,#620513);">Today!</strong>' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} away`}
                        </div>
                    </div>
                    ${ev.regLink ? `<a href="${ev.regLink}" target="_blank" style="
                        font-size:11px; font-weight:700; color:var(--primary,#00381F);
                        text-decoration:none; white-space:nowrap; padding:5px 10px;
                        background:var(--primary-light,#E8F2ED); border-radius:8px;
                    ">Register</a>` : ''}
                </div>
            `;
        }).join('');
    },

    // ─── PLATFORM NOTIFICATIONS SYNC ────────────────────────────
    /**
     * Injects unread admin notification count into platform notification badge elements.
     */
    syncNotifBadge() {
        const count = this.getUnreadNotifCount();
        document.querySelectorAll('.notif-badge, .notification-badge, [data-notif-badge]').forEach(el => {
            el.textContent = count > 99 ? '99+' : String(count);
            el.style.display = count > 0 ? 'inline-flex' : 'none';
        });
    },

    // ─── PLATFORM MENTORS SYNC ──────────────────────────────────
    /**
     * Injects admin-managed mentor cards into a target grid container.
     * Prepends featured mentors from admin, followed by default platform mentors.
     */
    syncMentorsGrid(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const mentors = options.featuredOnly ? this.getFeaturedMentors() : this.getMentors();
        if (!mentors.length) return;

        const cards = mentors.map(m => {
            const initials = (m.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const skills = Array.isArray(m.skills) ? m.skills : (m.skills || '').split(',').map(s => s.trim()).filter(Boolean);
            const socialLinks = [
                m.linkedin ? `<a href="${m.linkedin}" target="_blank" style="color:var(--primary,#00381F);" title="LinkedIn"><i class="fab fa-linkedin"></i></a>` : '',
                m.instagram ? `<a href="${m.instagram}" target="_blank" style="color:var(--primary,#00381F);" title="Instagram"><i class="fab fa-instagram"></i></a>` : ''
            ].filter(Boolean).join('');

            return `
                <div class="mentor-card admin-synced-mentor" style="
                    background:var(--bg-card,#fff); border-radius:var(--radius-md,16px);
                    border:1px solid var(--border,#E5DDD2); padding:22px; text-align:center;
                    box-shadow:var(--shadow-sm, 0 2px 8px rgba(0,0,0,.05));
                    transition:transform .25s, box-shadow .25s; position:relative;
                " onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,.1)'"
                   onmouseout="this.style.transform='';this.style.boxShadow='var(--shadow-sm, 0 2px 8px rgba(0,0,0,.05))'">
                    ${m.featured ? '<span style="position:absolute;top:14px;right:14px;background:var(--accent-light,#FFF8E6);color:var(--accent,#D9AE29);font-size:10px;font-weight:700;padding:3px 8px;border-radius:99px;">★ Featured</span>' : ''}
                    <div style="
                        width:72px; height:72px; border-radius:50%;
                        background:var(--primary-light,#E8F2ED); color:var(--primary,#00381F);
                        font-size:22px; font-weight:800; display:flex;
                        align-items:center; justify-content:center; margin:0 auto 12px;
                    ">${initials}</div>
                    <div style="font-size:16px; font-weight:700; color:var(--text-heading,#00381F); margin-bottom:3px;">${m.name}</div>
                    <div style="font-size:12px; color:var(--accent,#D9AE29); font-weight:700; margin-bottom:10px;">${m.expertise || ''}</div>
                    ${skills.length ? `<div style="display:flex; flex-wrap:wrap; gap:5px; justify-content:center; margin-bottom:12px;">
                        ${skills.map(s => `<span style="background:var(--bg-body,#F5EFE5);color:var(--text-main,#272727);font-size:11px;padding:3px 9px;border-radius:99px;font-weight:600;">${s}</span>`).join('')}
                    </div>` : ''}
                    ${m.bio ? `<p style="font-size:12px;color:var(--text-muted,#6F6F6F);margin-bottom:12px;line-height:1.5;">${m.bio}</p>` : ''}
                    ${socialLinks ? `<div style="display:flex;gap:10px;justify-content:center;font-size:15px;">${socialLinks}</div>` : ''}
                </div>
            `;
        }).join('');

        // Prepend at the beginning of the container
        container.insertAdjacentHTML('afterbegin', cards);
    },

    // ─── PLATFORM RESOURCES SYNC ────────────────────────────────
    /**
     * Returns admin resources formatted for platform resources.html consumption.
     * Platform can call this and prepend rows to existing resource lists.
     */
    syncResourcesSection(containerId, category = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const resources = this.getResources(category);
        if (!resources.length) return;

        const typeIcon = { PDF: 'fa-file-pdf', Video: 'fa-video', PPT: 'fa-file-powerpoint', DOC: 'fa-file-word', Link: 'fa-link' };

        const items = resources.map(r => `
            <div class="admin-synced-resource" style="
                display:flex; align-items:center; gap:14px; padding:14px 0;
                border-bottom:1px solid var(--border,#E5DDD2);
            ">
                <div style="
                    width:42px; height:42px; border-radius:10px;
                    background:var(--primary-light,#E8F2ED); display:flex;
                    align-items:center; justify-content:center; flex-shrink:0;
                    color:var(--primary,#00381F); font-size:16px;
                ">
                    <i class="fas ${typeIcon[r.type] || 'fa-file'}"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:14px; font-weight:600; color:var(--text-heading,#00381F); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.title}</div>
                    <div style="font-size:11px; color:var(--text-muted,#6F6F6F); margin-top:2px;">${r.category || ''} &bull; ${r.type || ''}</div>
                </div>
                ${r.url ? `<a href="${r.url}" target="_blank" rel="noopener" style="
                    font-size:11px; font-weight:700; color:#fff;
                    background:var(--primary,#00381F); padding:6px 12px; border-radius:8px;
                    text-decoration:none; white-space:nowrap; flex-shrink:0;
                ">Open</a>` : ''}
            </div>
        `).join('');

        container.insertAdjacentHTML('afterbegin', `
            <div class="admin-synced-resources-block" style="margin-bottom:16px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--primary,#00381F);margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--primary-light,#E8F2ED);">
                    Admin Published Resources
                </div>
                ${items}
            </div>
        `);
    },

    // ─── PROMOTIONS BANNER ──────────────────────────────────────
    /**
     * Injects the highest-priority active promotion as a banner below the topbar.
     */
    maybeShowPromoBanner() {
        const promos = this.getActivePromotions();
        if (!promos.length) return;
        const promo = promos[0];

        // Show-once logic
        const seenKey = `promo_seen_${promo.id}`;
        if (promo.showOnce && localStorage.getItem(seenKey)) return;
        if (localStorage.getItem(seenKey + '_session') && !promo.showOnce) return; // per-session

        // Don't inject twice
        if (document.getElementById('adminsync-promo-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'adminsync-promo-banner';
        banner.style.cssText = `
            background: linear-gradient(90deg, #00381F, #00522E);
            color: #fff; padding: 10px 20px;
            display: flex; align-items: center; justify-content: space-between; gap: 16px;
            font-size: 14px; font-weight: 500; position: relative; z-index: 9000;
            animation: slideBannerIn 0.4s ease;
        `;

        // Inject keyframe & mobile responsive CSS
        if (!document.getElementById('adminsync-banner-style')) {
            const st = document.createElement('style');
            st.id = 'adminsync-banner-style';
            st.textContent = `
                @keyframes slideBannerIn { from { transform:translateY(-100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
                @media (max-width: 600px) {
                    #adminsync-promo-banner { flex-direction: column; align-items: flex-start; padding: 10px 14px; gap: 8px; font-size: 13px; }
                    #adminsync-promo-banner > div { width: 100%; justify-content: space-between; margin-top: 4px; }
                }
            `;
            document.head.appendChild(st);
        }

        banner.innerHTML = `
            <span style="display:flex;align-items:center;gap:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <strong style="color:#D9AE29;">${promo.title || 'Announcement'}</strong>
                ${promo.message ? `<span>${promo.message}</span>` : ''}
            </span>
            <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
                ${promo.ctaLink ? `<a href="${promo.ctaLink}" target="_blank" style="color:#D9AE29;font-weight:700;text-decoration:none;font-size:13px;">${promo.ctaLabel || 'Learn More'} →</a>` : ''}
                <button onclick="AdminSync.closeBanner('${promo.id}', ${!!promo.showOnce})" style="
                    background:rgba(255,255,255,.15); border:none; color:#fff; width:26px; height:26px;
                    border-radius:50%; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center;
                ">&times;</button>
            </div>
        `;

        // Insert after the topbar/header
        const header = document.querySelector('.topbar, header, .dashboard-topbar, nav');
        if (header && header.parentNode) {
            header.parentNode.insertBefore(banner, header.nextSibling);
        } else {
            document.body.prepend(banner);
        }
    },

    closeBanner(promoId, storeForever = false) {
        const banner = document.getElementById('adminsync-promo-banner');
        if (banner) {
            banner.style.transition = 'all 0.3s ease';
            banner.style.opacity = '0';
            banner.style.maxHeight = '0';
            banner.style.padding = '0';
            setTimeout(() => banner.remove(), 300);
        }
        const key = `promo_seen_${promoId}`;
        if (storeForever) { localStorage.setItem(key, '1'); }
        else { sessionStorage.setItem(key + '_session', '1'); }
    },

    // ─── MAIN INIT (called by each platform page) ───────────────
    /**
     * Call AdminSync.init() at page load on any platform page.
     * Options:
     *   popup         {boolean} - show event popup (default: true)
     *   promoBanner   {boolean} - show promo banner (default: true)
     *   notifBadge    {boolean} - update notification badge (default: true)
     *   dashboardEvents {string} - container ID to sync upcoming events into
     *   mentorsGrid   {string|null} - container ID to sync admin mentors into
     *   resourcesGrid {string|null} - container ID to sync admin resources into
     */
    init(options = {}) {
        const opts = {
            popup:          options.popup          !== false,
            promoBanner:    options.promoBanner     !== false,
            notifBadge:     options.notifBadge      !== false,
            dashboardEvents: options.dashboardEvents || null,
            mentorsGrid:    options.mentorsGrid     || null,
            resourcesGrid:  options.resourcesGrid   || null,
            resourceCategory: options.resourceCategory || null,
        };

        // 1. Event popup
        if (opts.popup) this.maybeShowPopup();

        // 2. Promo banner
        if (opts.promoBanner) this.maybeShowPromoBanner();

        // 3. Notification badge
        if (opts.notifBadge) this.syncNotifBadge();

        // 4. Dashboard upcoming events widget
        if (opts.dashboardEvents) this.syncDashboardEvents(opts.dashboardEvents);

        // 5. Mentors grid injection
        if (opts.mentorsGrid) this.syncMentorsGrid(opts.mentorsGrid);

        // 6. Resources section injection
        if (opts.resourcesGrid) this.syncResourcesSection(opts.resourcesGrid, opts.resourceCategory);

        // 7. Listen for storage changes (cross-tab live sync)
        window.addEventListener('storage', (e) => {
            const syncKeys = ['admin_events', 'admin_mentors', 'admin_resources', 'admin_promotions', 'local_notifications', 'posts'];
            if (syncKeys.includes(e.key)) {
                if (opts.notifBadge) this.syncNotifBadge();
            }
        });
    }
};

// Expose globally
window.AdminSync = AdminSync;


 
