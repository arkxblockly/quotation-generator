/* =======================================================
   auth.js — Frontend Authentication Gate
   Protects the website with password authentication
   Password: admin123
   ======================================================= */

var Auth = (function () {
    var ADMIN_PASSWORD = 'admin123';
    var SESSION_KEY = 'invoice_gen_auth_session';
    var LOCAL_KEY = 'invoice_gen_auth_local';
    var REDIRECT_TARGET_KEY = 'invoice_gen_redirect_target';

    function isAuthenticated() {
        try {
            return sessionStorage.getItem(SESSION_KEY) === 'true' ||
                   localStorage.getItem(LOCAL_KEY) === 'true';
        } catch (e) {
            return false;
        }
    }

    function login(password, rememberMe) {
        if (password === ADMIN_PASSWORD) {
            try {
                sessionStorage.setItem(SESSION_KEY, 'true');
                if (rememberMe) {
                    localStorage.setItem(LOCAL_KEY, 'true');
                } else {
                    localStorage.removeItem(LOCAL_KEY);
                }
            } catch (e) {
                console.error('Storage error during login:', e);
            }
            return true;
        }
        return false;
    }

    function logout() {
        try {
            sessionStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(LOCAL_KEY);
            sessionStorage.removeItem(REDIRECT_TARGET_KEY);
        } catch (e) {
            console.error('Storage error during logout:', e);
        }
        window.location.replace('login.html?logged_out=1');
    }

    function getCurrentPageName() {
        var path = window.location.pathname;
        var page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        return page;
    }

    function initAuthProtection() {
        var page = getCurrentPageName();

        // If on login page
        if (page === 'login.html') {
            var params = new URLSearchParams(window.location.search);
            if (params.get('logged_out') === '1') {
                try {
                    sessionStorage.removeItem(SESSION_KEY);
                    localStorage.removeItem(LOCAL_KEY);
                } catch (e) {}
                return;
            }

            if (isAuthenticated()) {
                var target = params.get('returnUrl') || sessionStorage.getItem(REDIRECT_TARGET_KEY) || 'index.html';
                sessionStorage.removeItem(REDIRECT_TARGET_KEY);
                window.location.replace(target);
            }
            return;
        }

        // Protected pages (index.html, settings.html, preview.html, etc.)
        if (!isAuthenticated()) {
            if (document.documentElement) {
                document.documentElement.style.display = 'none';
            }
            var returnUrl = page + (window.location.search || '');
            try {
                sessionStorage.setItem(REDIRECT_TARGET_KEY, returnUrl);
            } catch (e) {}
            window.location.replace('login.html?returnUrl=' + encodeURIComponent(returnUrl));
        }
    }

    // Run auth check immediately upon script load
    initAuthProtection();

    return {
        isAuthenticated: isAuthenticated,
        login: login,
        logout: logout,
        initAuthProtection: initAuthProtection,
        getCurrentPageName: getCurrentPageName
    };
})();
