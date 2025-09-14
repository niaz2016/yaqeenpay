// authDebugger.js
// Copy this entire file and paste into your browser's developer console 
// when facing authentication issues

(function() {
  console.clear();
  console.log('======= YaqeenPay Auth Debugger =======');
  
  // Get all auth-related items from localStorage
  const tokenKeys = [
    'access_token', 'token', 'refresh_token', 'refreshToken', 'token_expiry'
  ];
  
  const tokens = {};
  tokenKeys.forEach(key => {
    const value = localStorage.getItem(key);
    tokens[key] = value ? 
      (key.includes('token') ? 
        `${value.substring(0, 15)}...` : value) 
      : 'Not set';
  });
  
  console.log('🔑 Auth Tokens:', tokens);
  
  // Check token expiry
  const expiry = localStorage.getItem('token_expiry');
  if (expiry) {
    const expiryDate = new Date(parseInt(expiry));
    const now = new Date();
    const isExpired = now > expiryDate;
    const timeLeft = isExpired ? 
      'EXPIRED' : 
      `${Math.round((expiryDate.getTime() - now.getTime()) / 1000 / 60)} minutes`;
    
    console.log(`⏱️ Token expiry: ${expiryDate.toLocaleString()} (${timeLeft})`);
  } else {
    console.log('⏱️ Token expiry: Not set');
  }
  
  // Analyze token if present
  const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (accessToken) {
    try {
      // Token structure analysis
      const parts = accessToken.split('.');
      if (parts.length !== 3) {
        console.log('❌ Token format is invalid! Should have 3 parts (header.payload.signature)');
      } else {
        console.log('✅ Token format is valid (has 3 parts)');
        
        // Decode payload
        try {
          const payload = JSON.parse(atob(parts[1]));
          console.log('📦 Token payload:', payload);
          
          // Check important claims
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp) {
            const expTime = new Date(payload.exp * 1000).toLocaleString();
            const isExpired = payload.exp < now;
            console.log(`⏰ Token exp claim: ${expTime} (${isExpired ? 'EXPIRED' : 'Valid'})`);
          }
          
          if (payload.sub) {
            console.log(`👤 User ID (sub): ${payload.sub}`);
          }
          
          if (payload.email) {
            console.log(`📧 Email: ${payload.email}`);
          }
        } catch (e) {
          console.log('❌ Failed to decode token payload:', e);
        }
      }
    } catch (e) {
      console.log('❌ Error analyzing token:', e);
    }
  } else {
    console.log('❌ No access token found in localStorage');
  }
  
  // Check Authorization header for current page
  fetch(window.location.href, {
    method: 'HEAD',
    credentials: 'include'
  })
  .then(response => {
    console.log('🌐 Current page fetch request sent with credentials');
  })
  .catch(error => {
    console.log('❌ Error fetching current page:', error);
  });
  
  // Check API endpoint
  const apiUrl = localStorage.getItem('apiUrl') || 'https://localhost:7137/api';
  console.log(`🔌 API URL: ${apiUrl}`);
  
  // Provide debugging tips
  console.log('\n🔍 Debugging tips:');
  console.log('1. Check that token is not expired');
  console.log('2. Verify API URL is correct');
  console.log('3. Look for any CORS errors in the Console');
  console.log('4. Check that the token format is valid');
  console.log('5. Make sure localStorage has the correct token keys');
  console.log('6. Try clearing tokens and logging in again');
  
  console.log('\n🧹 To clear all auth tokens, run:');
  console.log('localStorage.removeItem("access_token"); localStorage.removeItem("token"); localStorage.removeItem("refresh_token"); localStorage.removeItem("refreshToken"); localStorage.removeItem("token_expiry");');
  
  console.log('\n======= End of Auth Debugger =======');
})();