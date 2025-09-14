// Debug helper for YaqeenPay authentication
// Run this in your browser console

function inspectAuth() {
  // Get tokens from localStorage
  const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken');
  const tokenExpiry = localStorage.getItem('token_expiry');
  
  // Format the output
  console.group('Authentication Debug Info');
  
  console.log('Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'Not set');
  console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 10)}...` : 'Not set');
  
  if (tokenExpiry) {
    const expiryDate = new Date(parseInt(tokenExpiry));
    const now = new Date();
    const isExpired = now > expiryDate;
    
    console.log('Token Expiry:', expiryDate.toLocaleString());
    console.log('Current Time:', now.toLocaleString());
    console.log('Status:', isExpired ? '🔴 EXPIRED' : '🟢 VALID');
    console.log('Time Remaining:', isExpired ? 'Expired' : `${Math.floor((expiryDate.getTime() - now.getTime()) / 1000 / 60)} minutes`);
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

// Instructions
console.log(`
Authentication Debug Helper

To check your authentication status, run:
  inspectAuth()

To clear all tokens and log out:
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token_expiry');
  window.dispatchEvent(new CustomEvent('auth:logout'));
`);

// Run the function immediately
inspectAuth();