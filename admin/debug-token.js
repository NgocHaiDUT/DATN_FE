// Debug script - paste this in browser console to check your current token
console.log('=== CHECKING CURRENT TOKEN ===');

// Get token from memory (if using useAuth hook)
const checkToken = () => {
    // Try to get from localStorage/sessionStorage
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
        console.log('✓ Found refresh token in localStorage');

        // Decode JWT (simple base64 decode - NOT cryptographically secure, just for debugging)
        try {
            const parts = refreshToken.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                console.log('Token payload:', payload);
                console.log('User ID:', payload.sub);
                console.log('Email:', payload.email);
                console.log('Issued at:', new Date(payload.iat * 1000));
                console.log('Expires at:', new Date(payload.exp * 1000));
            }
        } catch (e) {
            console.error('Failed to decode token:', e);
        }
    } else {
        console.log('❌ No refresh token found in localStorage');
    }

    console.log('\n=== INSTRUCTIONS ===');
    console.log('1. Click LOGOUT button on the web admin');
    console.log('2. Login again with your admin credentials');
    console.log('3. Try delete/approve/reject again');
    console.log('\nNote: The access token is in memory only and expires in 5 minutes.');
    console.log('You MUST logout and login to get a new token with updated permissions!');
};

checkToken();
