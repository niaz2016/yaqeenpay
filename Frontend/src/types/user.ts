// src/types/user.ts
// Compatibility layer: re-export existing seller types under user-prefixed names
// This file allows a gradual migration from "seller" terminology to "user".

export * from './seller';

// Aliases for clearer 'user' naming
export type UserAnalytics = import('./seller').SellerAnalytics;
export type UserWithdrawal = import('./seller').Withdrawal;

// NOTE: The underlying shapes still match the existing seller types (including fields like sellerId).
// When ready, consider updating the underlying types and API contracts to use userId etc.,
// and add serialization/migration mapping on the backend.
