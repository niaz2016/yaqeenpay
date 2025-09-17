// src/pages/seller/index.ts
// Keep compatibility: default export from file is now UserRegistrationPage
export { default as SellerRegistrationPage } from './SellerRegistrationPage';
export { default as UserRegistrationPage } from './SellerRegistrationPage';
export { default as SellerOrdersPage } from './SellerOrdersPage';
export { default as SellerOrderDetailsPage } from './SellerOrderDetailsPage';
export { default as SellerAnalyticsPage } from './SellerAnalyticsPage';
// User-prefixed aliases for gradual migration
export { default as UserOrdersPage } from './SellerOrdersPage';
export { default as UserOrderDetailsPage } from './SellerOrderDetailsPage';
export { default as UserAnalyticsPage } from './SellerAnalyticsPage';
// Keep SellerWithdrawalsPage as a deprecated alias for compatibility
import WithdrawalsPage from './WithdrawalsPage';
export const SellerWithdrawalsPage = WithdrawalsPage;
export default WithdrawalsPage;