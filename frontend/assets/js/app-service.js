// Pragya Connect Global Service Layer
const AppService = {
    // Config
    API_BASE: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000/api" : "/api",
    isOnline: true,

    // Session Management & Profile Sync
    initSession() {
        if (!localStorage.getItem("loggedIn")) {
            const path = window.location.pathname;
            if (!path.endsWith("login.html") && !path.endsWith("index.html") && path !== "/") {
                window.location.href = path.includes("/events/") ? "../login.html" : "login.html";
            }
        }
        
        const currentName = localStorage.getItem("userName") || "Pragya";
        const isPragya = currentName.toLowerCase().includes("pragya");
        const defaultBadge = isPragya ? "Super Diamond 💎✨" : "Diamond Member 💎";
        const defaultPackage = isPragya ? "Master 300-Hr YTT & Spine Therapy" : "200-Hour Yoga Teacher Training";
        const defaultStreak = isPragya ? 36 : 18;

        if (!localStorage.getItem("userBadge")) localStorage.setItem("userBadge", defaultBadge);
        if (!localStorage.getItem("userPackage")) localStorage.setItem("userPackage", defaultPackage);
        if (!localStorage.getItem("userStreak")) localStorage.setItem("userStreak", defaultStreak.toString());

        // Keep profile object synced with active logged-in user
        let profile = null;
        try {
            profile = JSON.parse(localStorage.getItem("profile") || "null");
        } catch (e) { }

        if (!profile || profile.name !== currentName) {
            localStorage.setItem("profile", JSON.stringify({
                name: currentName,
                role: localStorage.getItem("userRole") || (isPragya ? "VIP Member • Pragya Yog School" : "Student • Pragya Yog School"),
                email: localStorage.getItem("userEmail") || (isPragya ? "pragya@pyshk.com" : "student@pyshk.com"),
                phone: "+852 6708 2503",
                location: "Hong Kong / Haridwar",
                package: localStorage.getItem("userPackage") || defaultPackage,
                streak: parseInt(localStorage.getItem("userStreak") || defaultStreak.toString(), 10),
                badge: localStorage.getItem("userBadge") || defaultBadge,
                bio: isPragya ? "Devoted Practitioner & Community Leader at Pragya Yog School." : "Passionate about Yoga, Mindfulness, and Spiritual Wellness.",
                skills: ["Hatha Yoga", "Asana Alignment", "Pranayama", "Meditation"],
                interests: ["Yoga Anatomy", "Sound Healing", "Ayurveda"],
                achievements: [(isPragya ? "Super Diamond Member" : "Diamond Member"), "Maintained Streak", "Pragya Certified"],
                activities: ["Attended Master Workshop", "Active Community Contributor", "Downloaded Guides"]
            }));
        }
    },

    getCurrentUser() {
        const name = localStorage.getItem("userName") || "Pragya";
        const isPragya = name.toLowerCase().includes("pragya");
        return {
            name: name,
            role: localStorage.getItem("userRole") || (isPragya ? "VIP Member" : "Student"),
            badge: localStorage.getItem("userBadge") || (isPragya ? "Super Diamond 💎✨" : "Diamond Member 💎"),
            streak: localStorage.getItem("userStreak") || (isPragya ? "36" : "18"),
            package: localStorage.getItem("userPackage") || (isPragya ? "Master 300-Hr YTT" : "200-Hour YTT"),
            avatar: localStorage.getItem("profileImage") || null
        };
    },

    // Check API connectivity
    async checkConnectivity() {
        try {
            const res = await fetch(`${this.API_BASE}/auth/login`, { method: "OPTIONS" }).catch(() => false);
            this.isOnline = res !== false;
        } catch {
            this.isOnline = false;
        }
        return this.isOnline;
    },

    // Unified fetch with offline fallback
    async apiCall(endpoint, options = {}) {
        if (this.isOnline) {
            try {
                const response = await fetch(`${this.API_BASE}${endpoint}`, {
                    headers: { "Content-Type": "application/json", ...options.headers },
                    ...options
                });
                if (response.ok) return await response.json();
            } catch (err) {
                console.warn("API Call failed, falling back to offline mode:", err);
                this.isOnline = false;
            }
        }
        return null;
    },

    // --- POSTS SERVICE ---
    async getPosts() {
        const apiPosts = await this.apiCall("/posts");
        if (apiPosts && apiPosts.length > 0) {
            localStorage.setItem("cached_posts", JSON.stringify(apiPosts));
            return apiPosts;
        }
        
        let localPosts = null;
        try {
            localPosts = JSON.parse(localStorage.getItem("local_posts") || "null");
        } catch(e) {}

        if (!localPosts || localPosts.length === 0) {
            localPosts = [
                {
                    _id: "post_pragya_seed",
                    userName: "Pragya",
                    userRole: "Master Practitioner",
                    userBadge: "Super Diamond 💎✨",
                    userStreak: "36",
                    userPackage: "Master 300-Hr YTT & Spine Therapy",
                    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pragya",
                    content: "Namaste community family! 🙏 Delighted to complete our 36th consecutive morning Pranayama & Meditation practice today. Consistency is the true essence of Yoga. Keep maintaining your streaks everyone! 🧘‍♀️✨ #YogaLife #SuperDiamond #PragyaConnect",
                    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop",
                    likes: 58,
                    comments: [
                        {
                            _id: "c_akh_1",
                            userName: "Dr. Akhilesh Sharma",
                            userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                            comment_text: "Wonderful dedication Pragya! Your energy inspires the entire batch.",
                            createdAt: new Date(Date.now() - 3600000).toISOString()
                        },
                        {
                            _id: "c_priya_1",
                            userName: "Priya Sharma",
                            userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
                            comment_text: "Such a grounding session today! Loved the breathwork sequence.",
                            createdAt: new Date(Date.now() - 1800000).toISOString()
                        }
                    ],
                    createdAt: new Date(Date.now() - 7200000).toISOString()
                },
                {
                    _id: "post_akhilesh_seed",
                    userName: "Dr. Akhilesh Sharma",
                    userRole: "Faculty Mentor • Ayurveda & Hatha Anatomy",
                    userBadge: "Master Faculty 🌿",
                    userStreak: "120",
                    userPackage: "Spine Therapy Faculty",
                    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                    content: "Upcoming spine anatomy case studies have been updated in the Resources Library. Remember: Asana is not about forcing the pose, it is about aligning the spine with breath awareness.",
                    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=600&fit=crop",
                    likes: 84,
                    comments: [
                        {
                            _id: "c_rahul_1",
                            userName: "Rahul Verma",
                            userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
                            comment_text: "Reviewing the spine diagrams now Dr. Akhilesh, extremely helpful!",
                            createdAt: new Date(Date.now() - 1200000).toISOString()
                        }
                    ],
                    createdAt: new Date(Date.now() - 14400000).toISOString()
                },
                {
                    _id: "post_priya_seed",
                    userName: "Priya Sharma",
                    userRole: "200-Hr YTT Cohort",
                    userBadge: "Diamond Member 💎",
                    userStreak: "18",
                    userPackage: "200-Hour Yoga Teacher Training",
                    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
                    content: "Completed day 18 of the alignment series! Practicing with props and straps has completely deepened my forward folds. Grateful for our mentor team. 🌿✨",
                    likes: 46,
                    comments: [],
                    createdAt: new Date(Date.now() - 21600000).toISOString()
                }
            ];
            localStorage.setItem("local_posts", JSON.stringify(localPosts));
        }
        return localPosts;
    },

    async createPost(content, image = null) {
        const user = this.getCurrentUser();
        const savedImage = localStorage.getItem("profileImage");
        const postData = {
            user_id: "60d0fe4f5311236168a109ca",
            userName: user.name,
            userRole: user.role,
            userBadge: user.badge,
            userStreak: user.streak,
            userPackage: user.package,
            userAvatar: savedImage || null,
            content,
            image
        };

        if (this.isOnline) {
            const res = await this.apiCall("/posts/create", {
                method: "POST",
                body: JSON.stringify(postData)
            });
            if (res) {
                window.dispatchEvent(new Event("postsUpdated"));
                return res;
            }
        }

        let localPosts = JSON.parse(localStorage.getItem("local_posts")) || [];
        const newPost = {
            _id: "post_" + Date.now(),
            user_id: { name: user.name, role: user.role },
            userName: user.name,
            userRole: user.role,
            userBadge: user.badge,
            userStreak: user.streak,
            userPackage: user.package,
            userAvatar: savedImage || null,
            content,
            image,
            likes: 0,
            comments: [],
            createdAt: new Date().toISOString()
        };
        localPosts.unshift(newPost);
        localStorage.setItem("local_posts", JSON.stringify(localPosts));
        window.dispatchEvent(new Event("postsUpdated"));
        return newPost;
    },

    async likePost(postId) {
        let likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
        const isCurrentlyLiked = likedPosts.includes(postId);
        const action = isCurrentlyLiked ? "unlike" : "like";

        if (isCurrentlyLiked) {
            likedPosts = likedPosts.filter(id => id !== postId);
        } else {
            likedPosts.push(postId);
        }
        localStorage.setItem("liked_posts", JSON.stringify(likedPosts));

        if (this.isOnline && !postId.startsWith("post_")) {
            const res = await this.apiCall(`/posts/like/${postId}`, {
                method: "PUT",
                body: JSON.stringify({ action })
            });
            if (res) {
                window.dispatchEvent(new Event("postsUpdated"));
                return { ...res, isLiked: !isCurrentlyLiked };
            }
        }

        let localPosts = JSON.parse(localStorage.getItem("local_posts")) || [];
        localPosts = localPosts.map(p => {
            if (p._id === postId || p.id === postId) {
                const currentLikes = p.likes || 0;
                return { ...p, likes: action === "like" ? currentLikes + 1 : Math.max(0, currentLikes - 1) };
            }
            return p;
        });
        localStorage.setItem("local_posts", JSON.stringify(localPosts));

        let cachedPosts = JSON.parse(localStorage.getItem("cached_posts") || "[]");
        if (cachedPosts.length > 0) {
            cachedPosts = cachedPosts.map(p => {
                if (p._id === postId || p.id === postId) {
                    const currentLikes = p.likes || 0;
                    return { ...p, likes: action === "like" ? currentLikes + 1 : Math.max(0, currentLikes - 1) };
                }
                return p;
            });
            localStorage.setItem("cached_posts", JSON.stringify(cachedPosts));
        }

        window.dispatchEvent(new Event("postsUpdated"));
        const finalLikes = (localPosts.find(p => p._id === postId || p.id === postId)?.likes) ??
                           (cachedPosts.find(p => p._id === postId || p.id === postId)?.likes || 0);
        return { likes: finalLikes, isLiked: !isCurrentlyLiked };
    },

    async addComment(postId, commentText) {
        const user = JSON.parse(localStorage.getItem("profile"));
        const savedImage = localStorage.getItem("profileImage");
        const commentData = {
            post_id: postId,
            user_id: "60d0fe4f5311236168a109ca",
            userName: user.name,
            userAvatar: savedImage || null,
            comment_text: commentText
        };

        if (this.isOnline && !postId.startsWith("post_")) {
            const res = await this.apiCall("/posts/comment", {
                method: "POST",
                body: JSON.stringify(commentData)
            });
            if (res) return res;
        }

        let localPosts = JSON.parse(localStorage.getItem("local_posts")) || [];
        const newComment = {
            _id: "cmt_" + Date.now(),
            user_id: { name: user.name, role: user.role },
            userName: user.name,
            userAvatar: savedImage || null,
            comment_text: commentText,
            createdAt: new Date().toISOString()
        };
        localPosts = localPosts.map(p => {
            if (p._id === postId || p.id === postId) {
                return { ...p, comments: [...(p.comments || []), newComment] };
            }
            return p;
        });
        localStorage.setItem("local_posts", JSON.stringify(localPosts));
        window.dispatchEvent(new Event("postsUpdated"));
        return newComment;
    },

    // --- MESSAGES SERVICE ---
    async getMessages(partner) {
        const currentUser = localStorage.getItem("userName") || "Gyan Prakash";
        if (this.isOnline) {
            const res = await this.apiCall(`/messages/history?user1=${encodeURIComponent(currentUser)}&user2=${encodeURIComponent(partner)}`);
            if (res) return res;
        }

        const localMsgs = JSON.parse(localStorage.getItem("local_messages") || "[]");
        return localMsgs.filter(m => 
            (m.sender === currentUser && m.recipient === partner) ||
            (m.sender === partner && m.recipient === currentUser)
        );
    },

    async sendMessage(partner, text, attachments = []) {
        const currentUser = localStorage.getItem("userName") || "Gyan Prakash";
        const messageData = {
            sender: currentUser,
            recipient: partner,
            text,
            attachments
        };

        if (this.isOnline) {
            const res = await this.apiCall("/messages/send", {
                method: "POST",
                body: JSON.stringify(messageData)
            });
            if (res) return res;
        }

        const localMsgs = JSON.parse(localStorage.getItem("local_messages") || "[]");
        const newMsg = {
            _id: "msg_" + Date.now(),
            ...messageData,
            createdAt: new Date().toISOString(),
            is_read: false
        };
        localMsgs.push(newMsg);
        localStorage.setItem("local_messages", JSON.stringify(localMsgs));
        return newMsg;
    },

    async getConversations() {
        const currentUser = localStorage.getItem("userName") || "Gyan Prakash";
        if (this.isOnline) {
            const res = await this.apiCall(`/messages/conversations?user=${encodeURIComponent(currentUser)}`);
            if (res) return res;
        }

        const localMsgs = JSON.parse(localStorage.getItem("local_messages") || "[]");
        const conversationsMap = {};
        localMsgs.forEach(msg => {
            const partner = msg.sender === currentUser ? msg.recipient : msg.sender;
            if (!conversationsMap[partner]) {
                conversationsMap[partner] = {
                    partner,
                    lastMessage: msg.text || (msg.attachments.length > 0 ? "?? Attachment" : ""),
                    timestamp: msg.createdAt,
                    unreadCount: 0
                };
            }
            if (msg.recipient === currentUser && !msg.is_read) {
                conversationsMap[partner].unreadCount += 1;
            }
        });
        return Object.values(conversationsMap);
    },

    // --- NOTIFICATIONS SERVICE ---
    async getNotifications() {
        const currentUser = localStorage.getItem("userName") || "Gyan Prakash";
        if (this.isOnline) {
            const res = await this.apiCall(`/notifications?user=${encodeURIComponent(currentUser)}`);
            if (res) return res;
        }

        const storedNotifs = localStorage.getItem("local_notifications");
        if (storedNotifs !== null) {
            return JSON.parse(storedNotifs);
        }

        {
            const seedNotifs = [
                { _id: "notif_1", user: currentUser, title: "New Message from Angela", type: "message", content: "Let's meet tomorrow to discuss the next steps.", is_read: false, createdAt: new Date().toISOString() },
                { _id: "notif_2", user: currentUser, title: "Upcoming Event", type: "event", content: "Sunset Beach Yog 2026 is scheduled for July 30th.", is_read: false, createdAt: new Date().toISOString() }
            ];
            localStorage.setItem("local_notifications", JSON.stringify(seedNotifs));
            return seedNotifs;
        }
    },

    async markNotificationsRead() {
        const currentUser = localStorage.getItem("userName") || "Gyan Prakash";
        if (this.isOnline) {
            await this.apiCall("/notifications/read-all", {
                method: "PUT",
                body: JSON.stringify({ user: currentUser })
            });
        }

        let localNotifs = JSON.parse(localStorage.getItem("local_notifications") || "[]");
        localNotifs = localNotifs.map(n => ({ ...n, is_read: true }));
        localStorage.setItem("local_notifications", JSON.stringify(localNotifs));
        this.updateGlobalBadges();
    },

    async clearNotifications() {
        const currentUser = localStorage.getItem("userName") || "Gyan Prakash";
        if (this.isOnline) {
            await this.apiCall(`/notifications/clear-all?user=${encodeURIComponent(currentUser)}`, {
                method: "DELETE"
            });
        }

        localStorage.setItem("local_notifications", JSON.stringify([]));
        this.updateGlobalBadges();
    },

    // Global Badge Updater
    setBadgeCount(badge, count) {
        if (!badge) return;
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.style.display = count > 0 ? "inline-flex" : "none";
        badge.setAttribute("aria-label", count > 0 ? `${count} unread` : "No unread items");
    },

    ensureBadge(parent, className) {
        let badge = parent.querySelector(`.${className}`);
        if (!badge) {
            badge = document.createElement("span");
            badge.className = className;
            parent.appendChild(badge);
        }
        return badge;
    },

    updateNavBadge(label, count) {
        document.querySelectorAll(".nav-menu a, .nav-item a").forEach(link => {
            const text = link.querySelector("span")?.textContent.trim();
            const aria = link.getAttribute("aria-label");
            const iconMatch = label === "Notifications"
                ? link.querySelector('[data-lucide="bell"]')
                : link.querySelector('[data-lucide="message-square"]');

            if (text === label || aria === label || iconMatch) {
                const badge = count > 0 ? this.ensureBadge(link, "badge") : link.querySelector(".badge");
                if (badge) this.setBadgeCount(badge, count);
            }
        });
    },

    updateTopbarBadge(label, count) {
        const iconSelector = label === "Notifications" ? '[data-lucide="bell"]' : '[data-lucide="message-square"]';
        document.querySelectorAll(".topbar-actions .icon-btn-badge, .topbar-actions a, .topbar-actions button").forEach(el => {
            const aria = el.getAttribute("aria-label");
            const iconMatch = el.querySelector(iconSelector);

            if (aria === label || iconMatch) {
                const badge = count > 0 ? this.ensureBadge(el, "badge-dot") : el.querySelector(".badge-dot");
                if (badge) this.setBadgeCount(badge, count);
            }
        });
    },

    async updateGlobalBadges() {
        const notifs = await this.getNotifications();
        const unreadNotifs = notifs.filter(n => !n.is_read).length;
        
        const conversations = await this.getConversations();
        const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

        this.updateNavBadge("Notifications", unreadNotifs);
        this.updateNavBadge("Messages", unreadMessages);
        this.updateTopbarBadge("Notifications", unreadNotifs);
        this.updateTopbarBadge("Messages", unreadMessages);
    },

    startBadgeAutoRefresh() {
        if (this.badgeAutoRefreshStarted) return;
        this.badgeAutoRefreshStarted = true;

        const refresh = () => this.updateGlobalBadges();
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) refresh();
        });
        window.addEventListener("storage", (event) => {
            if (["local_notifications", "local_messages"].includes(event.key)) {
                refresh();
            }
        });
        setInterval(refresh, 30000);
    },

    // Inject Unified Footer
    injectFooter() {
        const footerPlaceholder = document.querySelector("footer");
        if (footerPlaceholder && footerPlaceholder.innerHTML.trim() === "") {
            const footerHTML = `
                <div class="footer-container">
                    <div class="footer-brand">
                        <img src="${window.location.pathname.includes("/events/") ? "../" : ""}assets/logo.png" alt="Pragya Connect Logo" class="footer-logo">
                        <p class="footer-tagline">Connecting the Pragya Yog School community worldwide. Learn, practice, and share together.</p>
                    </div>
                    <div class="footer-links-grid">
                        <div class="footer-links-col">
                            <h4>Platform</h4>
                            <a href="${window.location.pathname.includes("/events/") ? "../" : ""}dashboard.html">Dashboard</a>
                            <a href="${window.location.pathname.includes("/events/") ? "../" : ""}CommunityFeed.html">Community Feed</a>
                            <a href="${window.location.pathname.includes("/events/") ? "../" : ""}mentors.html">Mentors</a>
                            <a href="${window.location.pathname.includes("/events/") ? "../" : ""}events/Events.html">Events</a>
                        </div>
                        <div class="footer-links-col">
                            <h4>Resources</h4>
                            <a href="${window.location.pathname.includes("/events/") ? "../" : ""}resources.html">Learning Resources</a>
                            <a href="${window.location.pathname.includes("/events/") ? "../" : ""}help-support.html">Help & Support</a>
                        </div>
                        <div class="footer-links-col">
                            <h4>Legal</h4>
                            <a href="${window.location.pathname.includes("/events/") ? "../" : ""}privacy-policy.html">Privacy Policy</a>
                            <a href="${window.location.pathname.includes("/events/") ? "../" : ""}terms-and-conditions.html">Terms & Conditions</a>
                        </div>
                    </div>
                    <div class="social-icons">
                        <a href="https://www.facebook.com/pragyahk" target="_blank" rel="noopener noreferrer" title="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://www.instagram.com/pragyahk" target="_blank" rel="noopener noreferrer" title="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="https://www.linkedin.com/company/pyshk/" target="_blank" rel="noopener noreferrer" title="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                        <a href="https://www.youtube.com/@pys_hk" target="_blank" rel="noopener noreferrer" title="YouTube"><i class="fab fa-youtube"></i></a>
                        <a href="https://x.com/pragyahk" target="_blank" rel="noopener noreferrer" title="X (Twitter)"><i class="fab fa-x-twitter"></i></a>
                    </div>
                </div>
            `;
            footerPlaceholder.className = "dashboard-footer";
            footerPlaceholder.innerHTML = footerHTML;
        }

        const footerBottom = document.querySelector(".footer-bottom");
        if (footerBottom) {
            footerBottom.innerHTML = `
                <span>&copy; 2026 Pragya Connect. All Rights Reserved.</span>
                <div class="footer-bottom-links">
                    <a href="${window.location.pathname.includes("/events/") ? "../" : ""}privacy-policy.html">Privacy Policy</a>
                    <span>|</span>
                    <a href="${window.location.pathname.includes("/events/") ? "../" : ""}terms-and-conditions.html">Terms &amp; Conditions</a>
                </div>
            `;
        }
    },

    // Dark Mode Synchronization
    initDarkMode() {
        const savedMode = localStorage.getItem("darkMode");
        const enable = savedMode === "true";
        this.setDarkMode(enable);
    },

    setDarkMode(enable) {
        if (enable) {
            document.documentElement.classList.add("dark");
            document.body.classList.add("dark-mode");
            localStorage.setItem("darkMode", "true");
        } else {
            document.documentElement.classList.remove("dark");
            document.body.classList.remove("dark-mode");
            localStorage.setItem("darkMode", "false");
        }
    },

    // Dynamic Navigation Link Patcher
    fixNavigationLinks() {
        document.querySelectorAll(".nav-menu a, .nav-logout a, .dropdown-menu a, .topbar-actions a, .topbar-actions button").forEach(el => {
            let linkText = el.querySelector("span")?.textContent.trim() || el.getAttribute("aria-label") || "";
            let isSubDir = window.location.pathname.includes("/events/");
            let prefix = isSubDir ? "../" : "";

            if (linkText === "Dashboard" || el.querySelector('[data-lucide="layout-dashboard"]')) {
                el.setAttribute("href", prefix + "dashboard.html");
            } else if (linkText === "Community Feed" || el.querySelector('[data-lucide="users-2"]')) {
                el.setAttribute("href", prefix + "CommunityFeed.html");
            } else if (linkText === "Mentors" || el.querySelector('[data-lucide="graduation-cap"]')) {
                el.setAttribute("href", prefix + "mentors.html");
            } else if (linkText === "Events" || el.querySelector('[data-lucide="calendar"]')) {
                el.setAttribute("href", prefix + "events/Events.html");
            } else if (linkText === "Resources" || el.querySelector('[data-lucide="book-open"]')) {
                el.setAttribute("href", prefix + "resources.html");
            } else if (linkText === "Messages" || el.querySelector('[data-lucide="message-square"]') || linkText === "Messages" || el.getAttribute("aria-label") === "Messages") {
                if (el.tagName === "BUTTON") {
                    const a = document.createElement("a");
                    a.className = el.className;
                    a.innerHTML = el.innerHTML;
                    a.setAttribute("href", prefix + "message.html");
                    a.setAttribute("aria-label", "Messages");
                    el.replaceWith(a);
                } else {
                    el.setAttribute("href", prefix + "message.html");
                }
            } else if (linkText === "Notifications" || el.querySelector('[data-lucide="bell"]') || linkText === "Notifications" || el.getAttribute("aria-label") === "Notifications") {
                if (el.tagName === "BUTTON") {
                    const a = document.createElement("a");
                    a.className = el.className;
                    a.innerHTML = el.innerHTML;
                    a.setAttribute("href", prefix + "notifications.html");
                    a.setAttribute("aria-label", "Notifications");
                    el.replaceWith(a);
                } else {
                    el.setAttribute("href", prefix + "notifications.html");
                }
            } else if (linkText === "Profile" || el.querySelector('[data-lucide="user"]')) {
                el.setAttribute("href", prefix + "Profile.html");
            } else if (linkText === "Settings" || el.querySelector('[data-lucide="settings"]')) {
                el.setAttribute("href", prefix + "setting.html");
            } else if (linkText.toLowerCase().includes("help") || el.querySelector('[data-lucide="help-circle"]')) {
                el.setAttribute("href", prefix + "help-support.html");
            } else if (linkText === "Logout" || el.querySelector('[data-lucide="log-out"]')) {
                el.setAttribute("href", prefix + "index.html");
            }
        });
    }
};

window.AppService = AppService;
AppService.initSession();
AppService.checkConnectivity();

function bootAppService() {
    AppService.injectFooter();
    AppService.fixNavigationLinks();
    AppService.initDarkMode();
    AppService.updateGlobalBadges();
    AppService.startBadgeAutoRefresh();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAppService);
} else {
    bootAppService();
}
