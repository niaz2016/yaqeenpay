// src/types/roles.ts
export type UserRole = 'buyer' | 'seller' | 'admin' | 'Buyer' | 'Seller' | 'Admin';

export interface RoleAccess {
  buyer: boolean;
  seller: boolean;
  admin: boolean;
}

export const ALL_ROLES: RoleAccess = {
  buyer: true,
  seller: true,
  admin: true,
};

export const BUYER_ONLY: RoleAccess = {
  buyer: true,
  seller: false,
  admin: false,
};

export const SELLER_ONLY: RoleAccess = {
  buyer: false,
  seller: true,
  admin: false,
};

export const ADMIN_ONLY: RoleAccess = {
  buyer: false,
  seller: false,
  admin: true,
};

export const BUYER_SELLER: RoleAccess = {
  buyer: true,
  seller: true,
  admin: false,
};

export const ADMIN_SELLER: RoleAccess = {
  buyer: false,
  seller: true,
  admin: true,
};