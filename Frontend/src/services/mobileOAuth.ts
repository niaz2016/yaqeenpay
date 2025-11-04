import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Start Google sign-in using system browser and capture the credential via deep link.
 * Returns the Google ID token (JWT) credential.
 */
export async function mobileGoogleSignIn(clientId: string): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Mobile Google Sign-In is only available on native platforms');
  }

  const redirectUri = 'yaqeenpay://auth-callback/google';
  const base = 'https://techtorio.online/yaqeenpay/google-mobile.html';
  const authUrl = `${base}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return new Promise<string>(async (resolve, reject) => {
    let sub: any;
    let finished = false;

    const cleanup = async () => {
      if (sub) sub.remove();
      try { await Browser.close(); } catch {}
    };

    sub = App.addListener('appUrlOpen', async (data) => {
      try {
        if (!data || !data.url) return;
        const url = new URL(data.url);
        if (url.protocol !== 'yaqeenpay:') return;
        if (url.host !== 'auth-callback') return;
        if (url.pathname !== '/google') return;
        const credential = url.searchParams.get('credential');
        finished = true;
        await cleanup();
        if (!credential) return reject(new Error('Missing Google credential'));
        resolve(credential);
      } catch (e: any) {
        finished = true;
        await cleanup();
        reject(e);
      }
    });

    try {
      await Browser.open({ url: authUrl, presentationStyle: 'popover' });
    } catch (e) {
      await cleanup();
      return reject(e);
    }

    // Safety timeout (2 minutes)
    setTimeout(async () => {
      if (!finished) {
        await cleanup();
        reject(new Error('Google sign-in timed out'));
      }
    }, 120000);
  });
}
