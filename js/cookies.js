document.addEventListener('DOMContentLoaded', function() {
    const cookiesPopup = document.getElementById('cookiesPopup');
    const cookiesModal = document.getElementById('cookiesModal');
    const acceptCookiesBtn = document.getElementById('acceptCookies');
    const declineCookiesBtn = document.getElementById('declineCookies');
    const cookieSettingsBtn = document.getElementById('cookieSettings');
    const closeCookiesModalBtn = document.getElementById('closeCookiesModal');
    const saveCookieSettingsBtn = document.getElementById('saveCookieSettings');
    
    const hasSeenPopup = localStorage.getItem('96studios_cookie_seen');
    
    if (!hasSeenPopup) {
        setTimeout(() => {
            cookiesPopup.classList.add('active');
            
            setTimeout(() => {
                if (cookiesPopup.classList.contains('active')) {
                    cookiesPopup.classList.remove('active');
                    localStorage.setItem('96studios_cookie_seen', 'true');
                    localStorage.setItem('96studios_cookie_choice', 'ignored');
                }
            }, 10000);
        }, 10000);
    }
    
    if (acceptCookiesBtn) {
        acceptCookiesBtn.addEventListener('click', function() {
            const preferences = {
                essential: true,
                analytics: true,
                marketing: true,
                preferences: true,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('96studios_cookie_seen', 'true');
            localStorage.setItem('96studios_cookie_choice', 'accepted');
            localStorage.setItem('96studios_cookie_preferences', JSON.stringify(preferences));
            
            cookiesPopup.classList.remove('active');
            showMessage('Cookies accepted!');
        });
    }
    
    if (declineCookiesBtn) {
        declineCookiesBtn.addEventListener('click', function() {
            const preferences = {
                essential: true,
                analytics: false,
                marketing: false,
                preferences: false,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('96studios_cookie_seen', 'true');
            localStorage.setItem('96studios_cookie_choice', 'declined');
            localStorage.setItem('96studios_cookie_preferences', JSON.stringify(preferences));
            
            cookiesPopup.classList.remove('active');
            showMessage('Cookies declined. Only essential cookies enabled.');
        });
    }
    
    if (cookieSettingsBtn) {
        cookieSettingsBtn.addEventListener('click', function() {
            loadPreferencesIntoModal();
            
            cookiesModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeCookiesModalBtn) {
        closeCookiesModalBtn.addEventListener('click', function() {
            cookiesModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (saveCookieSettingsBtn) {
        saveCookieSettingsBtn.addEventListener('click', function() {
            const preferences = {
                essential: true,
                analytics: document.getElementById('analyticsCookies').checked,
                marketing: document.getElementById('marketingCookies').checked,
                preferences: document.getElementById('preferenceCookies').checked,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('96studios_cookie_seen', 'true');
            localStorage.setItem('96studios_cookie_choice', 'custom');
            localStorage.setItem('96studios_cookie_preferences', JSON.stringify(preferences));
            
            cookiesPopup.classList.remove('active');
            cookiesModal.classList.remove('active');
            document.body.style.overflow = '';
            
            showMessage('Cookie preferences saved!');
        });
    }
    
    function loadPreferencesIntoModal() {
        const saved = localStorage.getItem('96studios_cookie_preferences');
        
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                
                if (document.getElementById('analyticsCookies')) {
                    document.getElementById('analyticsCookies').checked = preferences.analytics || false;
                }
                if (document.getElementById('marketingCookies')) {
                    document.getElementById('marketingCookies').checked = preferences.marketing || false;
                }
                if (document.getElementById('preferenceCookies')) {
                    document.getElementById('preferenceCookies').checked = preferences.preferences || false;
                }
            } catch (e) {
                console.error('Error loading preferences:', e);
            }
        } else {
            if (document.getElementById('analyticsCookies')) {
                document.getElementById('analyticsCookies').checked = true;
            }
            if (document.getElementById('marketingCookies')) {
                document.getElementById('marketingCookies').checked = false;
            }
            if (document.getElementById('preferenceCookies')) {
                document.getElementById('preferenceCookies').checked = true;
            }
        }
    }
    
    if (cookiesModal) {
        cookiesModal.addEventListener('click', function(e) {
            if (e.target === this) {
                cookiesModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && cookiesModal.classList.contains('active')) {
            cookiesModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    function showMessage(text) {
        const message = document.createElement('div');
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #009B5B;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }
    
});