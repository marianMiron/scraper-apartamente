import jwtDecode from './jwtdecode.js';

const adminEmails = ['sorinacaleap@gmail.com', 'alexandrucaleap@gmail.com', 'bogdan97m@gmail.com'];
const premiumEmails = ['premium1@example.com', 'premium2@example.com'];
const demoEmails = ['demo1@example.com', 'demo2@example.com', 'demo3@example.com'];

function isAdmin(email) {
    return adminEmails.includes(email);
}

function isPremium(email) {
    return premiumEmails.includes(email);
}

function isDemo(email) {
    return demoEmails.includes(email);
}

function checkAuth() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function handleCredentialResponse(response, updateUI) {
    if (response.credential) {
        try {
            const decoded = jwtDecode(response.credential);
            const email = decoded.email;
            const name = decoded.name;

            localStorage.setItem('jwt_token', response.credential);
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_name', name);

            if (updateUI) {
                updateUI(true, name);
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

function initializeGoogleSignIn(updateUI) {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
            client_id: '597856920733-0hj8h3kk76k8bh65ms06csmvu6aac1de.apps.googleusercontent.com',
            callback: (response) => handleCredentialResponse(response, updateUI)
        });
        google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { theme: 'outline', size: 'large' }
        );
        google.accounts.id.prompt();
    } else {
        console.error('Google Sign-In library is not loaded or initialized properly.');
    }
}

function handleSignOut(updateUI) {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    if (updateUI) {
        updateUI(false);
    }
    window.location.href = 'index.html';
}

export { checkAuth, isAdmin, isPremium, isDemo, initializeGoogleSignIn, handleSignOut };