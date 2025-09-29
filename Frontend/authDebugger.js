// authDebugger.js
// Copy this entire file and paste into your browser's developer console 
// when facing authentication issues

(function() {
  
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
  
  // Check token expiry
  const expiry = localStorage.getItem('token_expiry');
  if (expiry) {
    const expiryDate = new Date(parseInt(expiry));
    const now = new Date();
    const isExpired = now > expiryDate;
    const timeLeft = isExpired ? 
      'EXPIRED' : 
      `${Math.round((expiryDate.getTime() - now.getTime()) / 1000 / 60)} minutes`;
    
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
  
  console.log('\n======= End of Auth Debugger =======');
})();