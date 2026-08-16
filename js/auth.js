import { 
    supabase, 
    signUp, 
    signIn, 
    signInWithGoogle, 
    signOut, 
    resetPassword, 
    getCurrentUser, 
    getOrCreateClientId, 
    onAuthStateChange 
} from './supabase.js';

let currentUser = null;

function getFriendlyErrorMessage(error) {
    if (!error) return 'An error occurred. Please try again.';
    
    const msg = error.message || '';
    console.log('Auth error:', msg);
    
    if (msg.includes('Invalid login credentials')) {
        return 'Invalid email or password. Please check your credentials.';
    }
    if (msg.includes('Email not confirmed')) {
        return 'Please verify your email address before logging in. Check your inbox for the verification link.';
    }
    if (msg.includes('User already registered')) {
        return 'This email is already registered. Please use a different email or try logging in.';
    }
    if (msg.includes('Password should be at least 6 characters')) {
        return 'Password must be at least 6 characters long.';
    }
    if (msg.includes('invalid email')) {
        return 'Please enter a valid email address.';
    }
    if (msg.includes('too many requests')) {
        return 'Too many failed attempts. Please try again later.';
    }
    if (msg.includes('unexpected failure')) {
        return 'Connection error. Please check your internet and try again.';
    }
    
    return msg || 'An error occurred. Please try again.';
}

function getInitials(email) {
    if (!email) return 'U';
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase();
}

function updateAuthUI() {
    const desktopBtn = document.getElementById('desktopProfileBtn');
    const mobileBtn = document.getElementById('mobileProfileBtn');
    const mobileLink = document.getElementById('mobileAccountLink');

    if (currentUser) {
        const initials = getInitials(currentUser.email);
        if (desktopBtn) {
            desktopBtn.innerHTML = `
                <div class="profile-initials" style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#004370;background:#004370;color:white;font-weight:600;font-size:14px;">
                    ${initials}
                </div>
            `;
            desktopBtn.title = 'Account Settings';
        }
        if (mobileBtn) {
            const icon = mobileBtn.querySelector('.nav-icon-mobile');
            if (icon) {
                icon.innerHTML = `
                    <div class="profile-initials" style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#004370;color:white;font-weight:600;font-size:14px;">
                        ${initials}
                    </div>
                `;
            }
        }
        if (mobileLink) mobileLink.style.display = 'block';
    } else {
        if (desktopBtn) {
            desktopBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
            desktopBtn.title = 'Login / Register';
        }
        if (mobileBtn) {
            const icon = mobileBtn.querySelector('.nav-icon-mobile');
            if (icon) icon.innerHTML = '<i class="fas fa-user"></i>';
        }
        if (mobileLink) mobileLink.style.display = 'none';
    }
}

function closeAllModals() {
    const overlays = ['desktopAuthOverlay', 'mobileAuthContainer', 'accountSection'];
    overlays.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) deleteModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function switchAuthTab(tab, platform) {
    const containerId = platform === 'mobile' ? 'mobileAuthContainer' : 'desktopAuthOverlay';
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    container.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    const formId = `${platform}${tab.charAt(0).toUpperCase() + tab.slice(1)}Form`;
    const form = document.getElementById(formId);
    if (form) form.classList.add('active');
    
    const msgDiv = document.getElementById(`${platform}AuthMessages`);
    if (msgDiv) msgDiv.innerHTML = '';
}

function showMessage(container, type, text) {
    if (!container) return;
    container.innerHTML = '';
    const div = document.createElement('div');
    div.className = `message ${type}`;
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    const icon = iconMap[type] || 'fa-info-circle';
    div.innerHTML = `<i class="fas ${icon}"></i> <span>${text}</span>`;
    container.appendChild(div);
    
    if (type === 'success') {
        setTimeout(() => {
            if (div.parentNode === container) div.remove();
        }, 5000);
    }
}

function showLoading(btn) {
    if (!btn) return;
    const span = btn.querySelector('span');
    const spinner = btn.querySelector('.fa-spinner');
    if (span) span.style.display = 'none';
    if (spinner) spinner.style.display = 'inline-block';
    btn.disabled = true;
}

function hideLoading(btn) {
    if (!btn) return;
    const span = btn.querySelector('span');
    const spinner = btn.querySelector('.fa-spinner');
    if (span) span.style.display = 'inline';
    if (spinner) spinner.style.display = 'none';
    btn.disabled = false;
}

async function handleLogin(email, password, platform) {
    const msgDiv = document.getElementById(`${platform}AuthMessages`);
    const btn = document.getElementById(`${platform}LoginButton`);
    
    if (!email || !password) {
        showMessage(msgDiv, 'error', 'Please enter both email and password.');
        return;
    }
    
    showLoading(btn);
    msgDiv.innerHTML = '';
    
    try {
        const { data, error } = await signIn(email, password);
        
        if (error) {
            showMessage(msgDiv, 'error', getFriendlyErrorMessage(error));
            hideLoading(btn);
            return;
        }
        
        if (!data?.user) {
            showMessage(msgDiv, 'error', 'Login failed. Please try again.');
            hideLoading(btn);
            return;
        }
        
        const user = data.user;
        const clientId = await getOrCreateClientId(user.id);
        
        currentUser = {
            id: user.id,
            email: user.email,
            emailVerified: !!user.email_confirmed_at,
            clientId: clientId
        };
        
        localStorage.setItem(`permanentClientId_${user.id}`, clientId);
        localStorage.setItem('userClientId', clientId);
        
        showMessage(msgDiv, 'success', 'Login successful!');
        updateAuthUI();
        
        setTimeout(() => {
            closeAllModals();
            hideLoading(btn);
        }, 1500);
        
    } catch (err) {
        console.error('Login error:', err);
        showMessage(msgDiv, 'error', getFriendlyErrorMessage(err));
        hideLoading(btn);
    }
}

async function handleRegister(email, password, confirm, platform) {
    const msgDiv = document.getElementById(`${platform}AuthMessages`);
    const btn = document.getElementById(`${platform}RegisterButton`);
    
    if (!email || !password || !confirm) {
        showMessage(msgDiv, 'error', 'Please fill in all fields.');
        return;
    }
    
    if (password.length < 6) {
        showMessage(msgDiv, 'error', 'Password must be at least 6 characters long.');
        return;
    }
    
    if (password !== confirm) {
        showMessage(msgDiv, 'error', 'Passwords do not match.');
        return;
    }
    
    showLoading(btn);
    msgDiv.innerHTML = '';
    
    try {
        const { data, error } = await signUp(email, password);
        
        if (error) {
            showMessage(msgDiv, 'error', getFriendlyErrorMessage(error));
            hideLoading(btn);
            return;
        }
        
        if (!data?.user) {
            showMessage(msgDiv, 'error', 'Registration failed. Please try again.');
            hideLoading(btn);
            return;
        }
        
        const user = data.user;
        const clientId = await getOrCreateClientId(user.id);
        
        currentUser = {
            id: user.id,
            email: user.email,
            emailVerified: !!user.email_confirmed_at,
            clientId: clientId
        };
        
        localStorage.setItem(`permanentClientId_${user.id}`, clientId);
        localStorage.setItem('userClientId', clientId);
        
        showMessage(msgDiv, 'success', `Account created! Your Client ID: ${clientId}. A verification email has been sent to ${email}.`);
        updateAuthUI();
        
        const form = document.getElementById(`${platform}RegisterForm`);
        if (form) form.reset();
        
        setTimeout(() => {
            switchAuthTab('login', platform);
            showMessage(msgDiv, 'info', 'Please check your email and verify your account before logging in.');
            hideLoading(btn);
        }, 3000);
        
    } catch (err) {
        console.error('Register error:', err);
        showMessage(msgDiv, 'error', getFriendlyErrorMessage(err));
        hideLoading(btn);
    }
}

async function handleForgotPassword(email, platform) {
    const msgDiv = document.getElementById(`${platform}AuthMessages`);
    const btn = document.getElementById(`${platform}ResetButton`);
    
    if (!email) {
        showMessage(msgDiv, 'error', 'Please enter your email address.');
        return;
    }
    
    showLoading(btn);
    msgDiv.innerHTML = '';
    
    try {
        const { error } = await resetPassword(email);
        
        if (error) {
            showMessage(msgDiv, 'error', getFriendlyErrorMessage(error));
            hideLoading(btn);
            return;
        }
        
        showMessage(msgDiv, 'success', 'Password reset email sent! Check your inbox.');
        const form = document.getElementById(`${platform}ForgotPasswordForm`);
        if (form) form.reset();
        
        setTimeout(() => {
            switchAuthTab('login', platform);
            hideLoading(btn);
        }, 3000);
        
    } catch (err) {
        console.error('Reset password error:', err);
        showMessage(msgDiv, 'error', getFriendlyErrorMessage(err));
        hideLoading(btn);
    }
}

async function handleGoogleAuth(platform) {
    const msgDiv = document.getElementById(`${platform}AuthMessages`);
    if (msgDiv) {
        showMessage(msgDiv, 'info', 'Redirecting to Google...');
    }
    
    try {
        const { data, error } = await signInWithGoogle();
        
        if (error) {
            if (msgDiv) {
                showMessage(msgDiv, 'error', getFriendlyErrorMessage(error));
            }
            console.error('Google auth error:', error);
            return;
        }

        
    } catch (err) {
        console.error('Google auth error:', err);
        if (msgDiv) {
            showMessage(msgDiv, 'error', getFriendlyErrorMessage(err));
        }
    }
}

async function loadUserData() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            document.getElementById('userEmail').textContent = 'Not logged in';
            return;
        }
        
        const clientId = await getOrCreateClientId(user.id);
        
        document.getElementById('userEmail').textContent = user.email || 'No email';
        
        const statusEl = document.getElementById('emailStatus');
        if (user.email_confirmed_at) {
            statusEl.innerHTML = `
                <span class="verified-badge">
                    <i class="fas fa-check-circle"></i> Verified
                </span>
            `;
            document.getElementById('verificationMessage').textContent = 'Your email address has been verified.';
            document.getElementById('resendVerificationBtn').style.display = 'none';
            enableAccountSettings(true);
        } else {
            statusEl.innerHTML = `
                <span class="unverified-badge">
                    <i class="fas fa-exclamation-circle"></i> Not Verified
                </span>
            `;
            document.getElementById('verificationMessage').textContent = 'Please verify your email address. Check your inbox for the verification link.';
            document.getElementById('resendVerificationBtn').style.display = 'inline-flex';
            enableAccountSettings(false);
        }
        
        document.getElementById('clientId').textContent = clientId || 'N/A';
        
    } catch (err) {
        console.error('Load user data error:', err);
    }
}

function enableAccountSettings(enabled) {
    const btns = ['changePasswordBtn', 'deleteAccountBtn'];
    btns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? '1' : '0.6';
            btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        }
    });
}

async function handleChangePassword(current, newPass, confirm) {
    const msgDiv = document.getElementById('accountMessages');
    const btn = document.getElementById('changePasswordBtn');
    
    if (!current || !newPass || !confirm) {
        showMessage(msgDiv, 'error', 'Please fill in all fields.');
        return;
    }
    
    if (newPass.length < 6) {
        showMessage(msgDiv, 'error', 'Password must be at least 6 characters.');
        return;
    }
    
    if (newPass !== confirm) {
        showMessage(msgDiv, 'error', 'Passwords do not match.');
        return;
    }
    
    if (current === newPass) {
        showMessage(msgDiv, 'error', 'New password must be different from current password.');
        return;
    }
    
    showLoading(btn);
    msgDiv.innerHTML = '';
    
    try {
        const { error } = await supabase.auth.updateUser({ password: newPass });
        
        if (error) {
            showMessage(msgDiv, 'error', getFriendlyErrorMessage(error));
            hideLoading(btn);
            return;
        }
        
        showMessage(msgDiv, 'success', 'Password updated successfully!');
        document.getElementById('changePasswordForm').reset();
        hideLoading(btn);
        
    } catch (err) {
        console.error('Change password error:', err);
        showMessage(msgDiv, 'error', getFriendlyErrorMessage(err));
        hideLoading(btn);
    }
}

async function handleDeleteAccount(password) {
    const msgDiv = document.getElementById('accountMessages');
    const btn = document.getElementById('confirmDeleteBtn');
    
    if (!password) {
        showMessage(msgDiv, 'error', 'Please enter your password.');
        return;
    }
    
    showLoading(btn);
    msgDiv.innerHTML = '';
    
    try {
        const user = await getCurrentUser();
        if (!user) {
            showMessage(msgDiv, 'error', 'No user logged in.');
            hideLoading(btn);
            return;
        }
        
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);
        
        if (deleteError) {
            console.error('Delete user error:', deleteError);
            showMessage(msgDiv, 'error', 'Unable to delete account. Please contact support.');
            hideLoading(btn);
            return;
        }
        
        await signOut();
        
        localStorage.removeItem(`permanentClientId_${user.id}`);
        localStorage.removeItem('userClientId');
        
        currentUser = null;
        updateAuthUI();
        
        showMessage(msgDiv, 'success', 'Account deleted successfully.');
        
        setTimeout(() => {
            closeAllModals();
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (err) {
        console.error('Delete account error:', err);
        showMessage(msgDiv, 'error', getFriendlyErrorMessage(err));
        hideLoading(btn);
    }
}

async function handleResendVerification() {
    const msgDiv = document.getElementById('accountMessages');
    const btn = document.getElementById('resendVerificationBtn');
    
    showLoading(btn);
    msgDiv.innerHTML = '';
    
    try {
        const user = await getCurrentUser();
        if (!user) {
            showMessage(msgDiv, 'error', 'No user logged in.');
            hideLoading(btn);
            return;
        }
        
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: user.email
        });
        
        if (error) {
            showMessage(msgDiv, 'error', getFriendlyErrorMessage(error));
            hideLoading(btn);
            return;
        }
        
        showMessage(msgDiv, 'success', 'Verification email sent! Please check your inbox.');
        
    } catch (err) {
        console.error('Resend verification error:', err);
        showMessage(msgDiv, 'error', getFriendlyErrorMessage(err));
    }
    
    hideLoading(btn);
}

async function handleSignOut() {
    const msgDiv = document.getElementById('accountMessages');
    
    try {
        const { error } = await signOut();
        
        if (error) {
            showMessage(msgDiv, 'error', getFriendlyErrorMessage(error));
            return;
        }
        
        currentUser = null;
        updateAuthUI();
        showMessage(msgDiv, 'success', 'Signed out successfully.');
        
        setTimeout(() => {
            closeAllModals();
        }, 1500);
        
    } catch (err) {
        console.error('Sign out error:', err);
        showMessage(msgDiv, 'error', getFriendlyErrorMessage(err));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth module initialized');
        
    document.getElementById('desktopLoginForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('desktopLoginEmail').value.trim();
        const password = document.getElementById('desktopLoginPassword').value;
        handleLogin(email, password, 'desktop');
    });
    
    document.getElementById('mobileLoginForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('mobileLoginEmail').value.trim();
        const password = document.getElementById('mobileLoginPassword').value;
        handleLogin(email, password, 'mobile');
    });
        
    document.getElementById('desktopRegisterForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('desktopRegisterEmail').value.trim();
        const password = document.getElementById('desktopRegisterPassword').value;
        const confirm = document.getElementById('desktopConfirmPassword').value;
        handleRegister(email, password, confirm, 'desktop');
    });
    
    document.getElementById('mobileRegisterForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('mobileRegisterEmail').value.trim();
        const password = document.getElementById('mobileRegisterPassword').value;
        const confirm = document.getElementById('mobileConfirmPassword').value;
        handleRegister(email, password, confirm, 'mobile');
    });
        
    document.getElementById('desktopForgotPasswordForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('desktopResetEmail').value.trim();
        handleForgotPassword(email, 'desktop');
    });
    
    document.getElementById('mobileForgotPasswordForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('mobileResetEmail').value.trim();
        handleForgotPassword(email, 'mobile');
    });
        
    document.getElementById('desktopGoogleLoginButton')?.addEventListener('click', () => handleGoogleAuth('desktop'));
    document.getElementById('desktopGoogleRegisterButton')?.addEventListener('click', () => handleGoogleAuth('desktop'));
    document.getElementById('mobileGoogleLoginButton')?.addEventListener('click', () => handleGoogleAuth('mobile'));
    document.getElementById('mobileGoogleRegisterButton')?.addEventListener('click', () => handleGoogleAuth('mobile'));
        
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = document.getElementById(this.dataset.target);
            if (!input) return;
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
        
    document.querySelectorAll('#desktopAuthOverlay .auth-tab, #mobileAuthContainer .auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const platform = this.closest('#desktopAuthOverlay') ? 'desktop' : 'mobile';
            switchAuthTab(this.dataset.tab, platform);
        });
    });
    
    document.getElementById('desktopSwitchToRegister')?.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthTab('register', 'desktop');
    });
    document.getElementById('mobileSwitchToRegister')?.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthTab('register', 'mobile');
    });
    document.getElementById('desktopSwitchToLogin')?.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthTab('login', 'desktop');
    });
    document.getElementById('mobileSwitchToLogin')?.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthTab('login', 'mobile');
    });
    
    document.getElementById('desktopForgotPassword')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('#desktopAuthOverlay .auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById('desktopForgotPasswordForm').classList.add('active');
        document.getElementById('desktopAuthMessages').innerHTML = '';
    });
    document.getElementById('mobileForgotPassword')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('#mobileAuthContainer .auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById('mobileForgotPasswordForm').classList.add('active');
        document.getElementById('mobileAuthMessages').innerHTML = '';
    });
    
    document.getElementById('desktopBackToLogin')?.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthTab('login', 'desktop');
    });
    document.getElementById('mobileBackToLogin')?.addEventListener('click', function(e) {
        e.preventDefault();
        switchAuthTab('login', 'mobile');
    });
        
    document.getElementById('desktopProfileBtn')?.addEventListener('click', function() {
        if (currentUser) {
            const accountSection = document.getElementById('accountSection');
            accountSection.classList.add('active');
            document.body.style.overflow = 'hidden';
            loadUserData();
        } else {
            const overlay = document.getElementById('desktopAuthOverlay');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            switchAuthTab('login', 'desktop');
        }
    });
    
    document.getElementById('mobileProfileBtn')?.addEventListener('click', function() {
        if (currentUser) {
            const accountSection = document.getElementById('accountSection');
            accountSection.classList.add('active');
            document.body.style.overflow = 'hidden';
            loadUserData();
        } else {
            const container = document.getElementById('mobileAuthContainer');
            container.classList.add('active');
            document.body.style.overflow = 'hidden';
            switchAuthTab('login', 'mobile');
        }
    });
    
    document.getElementById('mobileAccountLink')?.addEventListener('click', function(e) {
        e.preventDefault();
        const accountSection = document.getElementById('accountSection');
        accountSection.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadUserData();
    });
        
    document.getElementById('closeDesktopAuth')?.addEventListener('click', closeAllModals);
    document.getElementById('closeMobileAuth')?.addEventListener('click', closeAllModals);
    document.getElementById('closeAccountSection')?.addEventListener('click', closeAllModals);
    
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', function() {
        document.getElementById('deleteModal').style.display = 'none';
    });
    
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    });
        
    document.getElementById('resendVerificationBtn')?.addEventListener('click', handleResendVerification);
    
    document.getElementById('refreshStatusBtn')?.addEventListener('click', function() {
        loadUserData();
        const msgDiv = document.getElementById('accountMessages');
        showMessage(msgDiv, 'info', 'Status refreshed.');
        setTimeout(() => {
            if (msgDiv) msgDiv.innerHTML = '';
        }, 2000);
    });
    
    document.getElementById('changePasswordForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const current = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmNewPassword').value;
        handleChangePassword(current, newPass, confirm);
    });
    
    document.getElementById('deleteAccountBtn')?.addEventListener('click', function() {
        document.getElementById('deleteModal').style.display = 'flex';
        document.getElementById('deletePassword').focus();
    });
    
    document.getElementById('deleteAccountForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('deletePassword').value;
        handleDeleteAccount(password);
    });
    
    document.getElementById('signOutBtn')?.addEventListener('click', handleSignOut);
        
    onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        const user = session?.user || null;
        
        if (user) {
            const clientId = await getOrCreateClientId(user.id);
            currentUser = {
                id: user.id,
                email: user.email,
                emailVerified: !!user.email_confirmed_at,
                clientId: clientId
            };
            localStorage.setItem(`permanentClientId_${user.id}`, clientId);
            localStorage.setItem('userClientId', clientId);
            updateAuthUI();
            
            if (event === 'SIGNED_IN') {
                closeAllModals();
            }
        } else {
            currentUser = null;
            updateAuthUI();
        }
    });
    
    getCurrentUser().then(async (user) => {
        if (user) {
            const clientId = await getOrCreateClientId(user.id);
            currentUser = {
                id: user.id,
                email: user.email,
                emailVerified: !!user.email_confirmed_at,
                clientId: clientId
            };
            localStorage.setItem(`permanentClientId_${user.id}`, clientId);
            localStorage.setItem('userClientId', clientId);
            updateAuthUI();
            console.log('User already logged in:', user.email);
        } else {
            console.log('No user session found');
        }
    }).catch(err => {
        console.error('Error checking session:', err);
    });
    
    window.closeAllModals = closeAllModals;
    window.switchAuthTab = switchAuthTab;
    window.loadUserData = loadUserData;
    
    console.log('✅ Auth module ready');
});