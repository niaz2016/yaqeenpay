// src/components/seller/index.ts (DEPRECATION STUB)
// This stub remains to provide backward compatibility for imports from
// `components/seller`. Prefer importing from `components/user` instead.
// The file intentionally re-exports from user wrappers and logs a warning
// to aid discovery during runtime in development builds.
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
	// eslint-disable-next-line no-console
	console.warn('[DEPRECATION] Importing from components/seller is deprecated. Use components/user instead.');
}

export { default as BusinessProfileForm } from '../user/BusinessProfileForm';
export { default as KycDocumentUpload } from '../user/KycDocumentUpload';
export { default as RegistrationSummary } from '../user/RegistrationSummary';
export { default as WithdrawalRequestForm } from '../user/WithdrawalRequestForm';