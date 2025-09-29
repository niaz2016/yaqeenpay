// Debug helper for YaqeenPay authentication
// Run this in your browser console

function inspectAuth() {
  // Get tokens from localStorage
  const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken');
  const tokenExpiry = localStorage.getItem('token_expiry');
  
  // Format the output
  console.group('Authentication Debug Info');
  
  
  if (tokenExpiry) {
    const expiryDate = new Date(parseInt(tokenExpiry));
    const now = new Date();
    const isExpired = now > expiryDate;
    
  } else {
    console.log('Token Expiry: Not set');
  }
  
  console.groupEnd();
  
  return {
    accessToken,
    refreshToken,
    tokenExpiry,
    expiryDate: tokenExpiry ? new Date(parseInt(tokenExpiry)) : null,
    isValid: tokenExpiry ? new Date() < new Date(parseInt(tokenExpiry)) : false
  };
}

// Run the function immediately
inspectAuth();