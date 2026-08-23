/**
 * Pragya Yog External API Service
 * All requests to https://pragya-yog.com/api.php use multipart/form-data
 * (NOT JSON – the server reads $_POST / $_FILES, not php://input)
 */
const PragyaAPI = {
    BASE: 'https://pragya-yog.com/api.php',

    /**
     * POST to Pragya external API with multipart/form-data
     * @param {string} action  - API action name
     * @param {Object} fields  - Additional fields to send
     * @returns {Promise<Object|null>}
     */
    async call(action, fields = {}) {
        try {
            const form = new FormData();
            form.append('action', action);
            for (const [key, val] of Object.entries(fields)) {
                if (val !== undefined && val !== null) form.append(key, String(val));
            }
            const res = await fetch(this.BASE, { method: 'POST', body: form });
            if (!res.ok) return null;
            const data = await res.json();
            return data;
        } catch (err) {
            console.warn(`[PragyaAPI] ${action} failed:`, err.message);
            return null;
        }
    },

    /** Get JWT token stored from login */
    token() {
        return localStorage.getItem('pragya_token') || '';
    },

    /** Uploads base URL for teacher/profile images */
    uploadsBase: 'https://pragya-yog.com/uploads/',

    /** Resolve full image URL */
    img(path) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return this.uploadsBase + path;
    },

    // ─── Auth ──────────────────────────────────────────────────────────────────
    async login(email, password) {
        return this.call('login', { email, password });
    },

    async checkToken(token, refreshToken) {
        return this.call('check-token', { token, refresh_token: refreshToken });
    },

    // ─── Profile ────────────────────────────────────────────────────────────────
    async getProfile() {
        return this.call('get-profile', { token: this.token() });
    },

    async getMembership() {
        return this.call('get-active-membership', { token: this.token() });
    },

    // ─── Classes & Schedule ─────────────────────────────────────────────────────
    async getTodayClasses() {
        return this.call('today-class');
    },

    async getClassesByDate(date = '', filters = {}) {
        return this.call('publicClassByDate', { date, ...filters });
    },

    async getFilters() {
        return this.call('get-filters');
    },

    // ─── Events ─────────────────────────────────────────────────────────────────
    async getUpcomingEvents() {
        const tok = this.token();
        return this.call('upcoming-events', tok ? { token: tok } : {});
    },

    async getEventDetail(eventId) {
        const tok = this.token();
        return this.call('upcoming-event-detail', { event_id: eventId, ...(tok ? { token: tok } : {}) });
    },

    // ─── Teachers ───────────────────────────────────────────────────────────────
    async getTeachers() {
        return this.call('teachers');
    },

    // ─── Packages ───────────────────────────────────────────────────────────────
    async getPackages() {
        return this.call('get-packages');
    },

    async getPackageDetail(packageId) {
        return this.call('get-package-detail', { package_id: packageId });
    },

    // ─── Daily Quote ────────────────────────────────────────────────────────────
    async getDailyQuote() {
        return this.call('get-daily-quote');
    },

    // ─── Notifications ──────────────────────────────────────────────────────────
    async getNotifications() {
        return this.call('get-notification', { token: this.token() });
    },

    async deleteNotification(notifId) {
        return this.call('del-notification', { token: this.token(), id: notifId });
    },

    // ─── FAQs ────────────────────────────────────────────────────────────────────
    async getFAQs() {
        return this.call('faqs');
    },

    // ─── Yoga Poses ─────────────────────────────────────────────────────────────
    async getYogaPoses() {
        return this.call('get-yoga-poses');
    },

    // ─── Bookings ───────────────────────────────────────────────────────────────
    async getBookings() {
        return this.call('bookings', { token: this.token() });
    },

    // ─── Billings ───────────────────────────────────────────────────────────────
    async getBillings() {
        return this.call('billings', { token: this.token() });
    },

    // ─── Wallet ─────────────────────────────────────────────────────────────────
    async getWallet() {
        return this.call('wallet', { token: this.token() });
    }
};

// Make globally available
window.PragyaAPI = PragyaAPI;
