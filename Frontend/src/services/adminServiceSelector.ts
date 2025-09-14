// Service selector for admin functionality
import realAdminService from './adminService';

// Using real backend service only
const adminService = realAdminService;

console.log('Admin Service: Using REAL backend service');

export default adminService;