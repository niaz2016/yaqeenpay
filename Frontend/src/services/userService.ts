// src/services/userService.ts
// Compatibility alias: re-export the existing sellerService under a user-prefixed module
export * from './sellerService';
export { sellerService as userService } from './sellerService';

import { sellerService } from './sellerService';
export default sellerService;
