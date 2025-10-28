export interface ProductImage {
  id: string;
  imageUrl?: string;
  ImageUrl?: string;
  altText?: string;
  AltText?: string;
  sortOrder: number;
  isMain?: boolean;
  isPrimary?: boolean;
  IsPrimary?: boolean;
  SortOrder?: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  effectivePrice: number;
  currency: string;
  discountPrice?: number;
  discountPercentage: number;
  isOnSale: boolean;
  isInStock: boolean;
  stockQuantity: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'OutOfStock' | 'Discontinued';
  sku: string;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  images: ProductImage[];
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  seller?: {
    id: string;
    businessName: string;
  };
  brand?: string;
  model?: string;
  weight?: number;
  weightUnit?: string;
  dimensions?: string;
  attributes: Record<string, string>;
  averageRating?: number;
  reviewCount?: number;
  tags?: string[];
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  helpful: number;
  images?: ProductImage[];
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  productCount: number;
}

export interface ProductBrand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  productCount: number;
}