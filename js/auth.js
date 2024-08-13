// auth.js
import jwtDecode from './jwtdecode.js';

const adminEmails = ['sorinacaleap@gmail.com', 'alexandrucaleap@gmail.com', 'bogdan97m@gmail.com', 'a.razvanolos@gmail.com'];
const premiumEmails = ['botualfred@gmail.com', 'premium2@example.com'];
const demoEmails = ['demo1@example.com', 'demo2@example.com', 'demo3@example.com'];

export function isAdmin(email) {
    return adminEmails.includes(email);
}

export function isPremium(email) {
    return premiumEmails.includes(email);
}

export function isDemo(email) {
    return demoEmails.includes(email);
}

export function getUserRole(email) {
    if (isAdmin(email)) return 'admin';
    if (isPremium(email)) return 'premium';
    if (isDemo(email)) return 'demo';
    return 'normal';
}

export function checkAuth() {
    const token = localStorage.getItem('jwt_token');
    return !!token;
}

function handleCredentialResponse(response, updateUI) {
    if (response.credential) {
        try {
            const decoded = jwtDecode(response.credential);
            const email = decoded.email;
            const name = decoded.name;
            const userRole = getUserRole(email);

            localStorage.setItem('jwt_token', response.credential);
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_name', name);
            localStorage.setItem('user_role', userRole);

            if (updateUI) {
                updateUI(true, name, userRole);
            }
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            alert('An error occurred during sign-in. Please try again.');
        }
    } else {
        console.error('No credential found in response');
        alert('Sign-in failed. Please try again.');
    }
}

export function initializeGoogleSignIn(updateUI) {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
            client_id: '597856920733-0hj8h3kk76k8bh65ms06csmvu6aac1de.apps.googleusercontent.com',
            callback: (response) => handleCredentialResponse(response, updateUI)
        });
        google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { theme: 'outline', size: 'large' }
        );
    } else {
        console.error('Google Sign-In library is not loaded or initialized properly.');
    }
}

export function handleSignOut(updateUI) {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
    }
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    if (updateUI) {
        updateUI(false);
    }
}

// New function to check if the user is signed in
export function isSignedIn() {
    return !!localStorage.getItem('jwt_token');
}