import apiService from './api';
import type { ProductDetail } from '../types/product';
import type { AxiosRequestConfig } from 'axios';
import { invalidateProductCache, invalidateAllProductCache } from '../hooks/useProductCache';

// Response wrapper interface
interface BaseApiResponse {
  success: boolean;
  message?: string;
}

interface ApiResponseWrapper<T> extends BaseApiResponse {
  data: T;
}

// Product response types
export type ProductDetailResponse = ApiResponseWrapper<ProductDetail>;
export type ProductListResponse = ApiResponseWrapper<ProductDetail[]>;
export type UploadResponse = ApiResponseWrapper<{ url: string }>;

// Paginated response type
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// API response types
export type PaginatedProductResponse = ApiResponseWrapper<PaginatedResponse<ProductDetail>>;

export interface ProductImage {
  file: File;
  isPrimary: boolean;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

type VariantPrimitive = string | number | boolean | undefined;

export interface ProductVariantDTO {
  size?: string;
  color?: string;
  price?: string;
  stockQuantity?: string;
  sku?: string;
  [key: string]: VariantPrimitive;
}

export interface ProductVariantInput {
  size?: string;
  color?: string;
  price?: number;
  stockQuantity?: number;
  sku?: string;
  [key: string]: VariantPrimitive;
}

export interface UploadProgressEvent {
  index: number;
  total: number;
  percent: number;
  fileName: string;
}

export interface CreateProductOptions {
  onUploadStart?: (info: { total: number }) => void;
  onUploadProgress?: (event: UploadProgressEvent) => void;
  onUploadComplete?: () => void;
  onSubmitting?: () => void;
}

// (CreateProductRequest defined later with richer options)

export interface CreateProductDTO {
  id?: string;  // Include ID for updates
  name: string;
  description: string;
  price: string;
  discountPrice?: string;
  stockQuantity: string;
  categoryId: string;
  status: 'Draft' | 'Active' | 'Inactive';
  currency: string;
  // Optional details
  minOrderQuantity?: string;
  maxOrderQuantity?: string;
  weight?: string;
  weightUnit?: string;
  dimensions?: string;
  brand?: string;
  model?: string;
  material?: string;
  tags?: string[];
  attributes?: { name: string; value: string }[];
  faqs?: { question: string; answer: string }[];
  images?: ProductImage[];
  imagesToDelete?: string[];
  variants?: ProductVariantDTO[];
  allowBackorders?: boolean;
  isFeatured?: boolean;
  featuredUntil?: string;
}

// Frontend-friendly create request that supports uploading newImages (files)
export type CreateProductRequest = Omit<CreateProductDTO, 'images' | 'variants'> & {
  newImages?: ProductImage[];
  images?: ProductImage[]; // existing images (for updates)
  imagesToDelete?: string[];
  sku?: string;
  variants?: ProductVariantInput[];
};

interface ProductImagePayload {
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  discountPrice?: string;
  stockQuantity: number;
  categoryId: string;
  status: number;
  currency: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  weight?: number;
  weightUnit?: string;
  dimensions?: string;
  brand?: string;
  model?: string;
  material?: string;
  tags?: string[];
  attributes: Record<string, string>;
  faqs?: { question: string; answer: string }[];
  images: ProductImagePayload[];
  imagesToDelete?: string[];
  sku: string;
  variants?: ProductVariantInput[];
  allowBackorders?: boolean;
  isFeatured?: boolean;
  featuredUntil?: string;
}

interface ProductVariantUpdatePayload {
  size?: string;
  color?: string;
  price?: number;
  stockQuantity?: number;
  sku?: string;
  [key: string]: VariantPrimitive;
}

interface UpdateProductPayload {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  discountPrice?: string;
  stockQuantity?: number;
  categoryId?: string;
  status?: number;
  currency?: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  weight?: number;
  weightUnit?: string;
  dimensions?: string;
  brand?: string;
  model?: string;
  material?: string;
  tags?: string[];
  attributes?: Record<string, string>;
  faqs?: { question: string; answer: string }[];
  NewImages?: ProductImagePayload[];
  ImagesToDelete?: string[];
  variants?: ProductVariantUpdatePayload[];
}

class ProductService {
  private statusToEnum(status?: string): number | undefined {
    if (!status) return undefined;
    const map: Record<string, number> = {
      Draft: 0,
      Active: 1,
      Inactive: 2,
      OutOfStock: 3,
      Discontinued: 4,
      PendingReview: 5,
      Rejected: 6,
    };
    return map[status as keyof typeof map];
  }

  private extractUploadUrl(response: unknown): string | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const topLevel = response as { url?: unknown; data?: unknown };
    if (typeof topLevel.url === 'string') {
      return topLevel.url;
    }

    if (topLevel.data && typeof topLevel.data === 'object') {
      const dataLevel = topLevel.data as { url?: unknown; data?: unknown };
      if (typeof dataLevel.url === 'string') {
        return dataLevel.url;
      }

      if (dataLevel.data && typeof dataLevel.data === 'object') {
        const nestedLevel = dataLevel.data as { url?: unknown };
        if (typeof nestedLevel.url === 'string') {
          return nestedLevel.url;
        }
      }
    }

    return null;
  }
  async getProduct(id: string): Promise<ProductDetail> {
    try {
      // apiService.get unwraps ApiResponse and returns the inner data (or the raw response.data when no wrapper).
      const response = await apiService.get<ProductDetail>(`/products/${id}`);
      if (!response) throw new Error('Product not found');
      return response;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw error;
    }
  }

  async getRelatedProducts(productId: string, limit: number = 4): Promise<ProductDetail[]> {
    try {
      // apiService.get will return the unwrapped data (array of products) when endpoint returns ApiResponse
      const products = await apiService.get<ProductDetail[]>(`/products/${productId}/related`, {
        params: { limit }
      });
      return products || [];
    } catch (error) {
      console.warn('Failed to fetch related products:', error);
      return [];
    }
  }

  async uploadImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const config: AxiosRequestConfig | undefined = onProgress
      ? {
          onUploadProgress: (event) => {
            if (!event.total) return;
            const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
            onProgress(percent);
          },
        }
      : undefined;

    const result = await apiService.post<unknown>('/profile/upload-image', formData, config);
    // Support multiple possible shapes returned by the upload endpoint
    // - { url: '...' }
    // - { data: { url: '...' } }
    // - { success: true, data: { url: '...' } }
    const url = this.extractUploadUrl(result);
    if (!url) throw new Error('Upload succeeded but server did not return file URL');
    return url;
  }

  async uploadImages(
    images: ProductImage[],
    onProgress?: (event: UploadProgressEvent) => void
  ): Promise<Array<{ imageUrl: string; isPrimary: boolean }>> {
    const uploaded: Array<{ imageUrl: string; isPrimary: boolean }> = [];
    const total = images.length;

    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];
      const fileName = image.file?.name || `image-${index + 1}`;

      if (onProgress) {
        onProgress({ index, total, percent: 0, fileName });
      }

      const imageUrl = await this.uploadImage(image.file, (percent) => {
        if (onProgress) {
          onProgress({ index, total, percent, fileName });
        }
      });

      if (onProgress) {
        onProgress({ index, total, percent: 100, fileName });
      }

      uploaded.push({ imageUrl, isPrimary: image.isPrimary });
    }

    return uploaded;
  }

  async getProducts(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
  }): Promise<PaginatedProductResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);

    const url = `/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.get(url);
  }

  async getSellerProducts(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedProductResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `/products/seller${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.get(url);
  }

  async createProduct(data: CreateProductRequest, options?: CreateProductOptions): Promise<unknown> {
    // Prefer images passed in `images` (already in service format), otherwise use `newImages` (File uploads)
    const imagesToUpload = data.images?.length ? data.images : data.newImages ?? [];
    if (imagesToUpload.length && options?.onUploadStart) {
      options.onUploadStart({ total: imagesToUpload.length });
    }

    const uploadedImages = imagesToUpload.length
      ? await this.uploadImages(imagesToUpload, options?.onUploadProgress)
      : [];

    if (imagesToUpload.length && options?.onUploadComplete) {
      options.onUploadComplete();
    }

    options?.onSubmitting?.();

    // Build attributes object expected by backend (Dictionary<string,string>)
    const attributesObj = data.attributes?.reduce((acc, attr) => ({
      ...acc,
      [attr.name]: attr.value
    }), {} as Record<string, string>) || {};

    // Ensure SKU exists - backend requires SKU
    const sku = data.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const statusCode = this.statusToEnum(data.status) ?? this.statusToEnum('Active') ?? 1;

    const payload: CreateProductPayload = {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      discountPrice: data.discountPrice,
      stockQuantity: parseInt(data.stockQuantity, 10),
      categoryId: data.categoryId,
      status: statusCode,
      currency: data.currency,
      minOrderQuantity: data.minOrderQuantity ? parseInt(data.minOrderQuantity, 10) : undefined,
      maxOrderQuantity: data.maxOrderQuantity ? parseInt(data.maxOrderQuantity, 10) : undefined,
      weight: data.weight ? parseFloat(data.weight) : undefined,
      weightUnit: data.weightUnit,
      dimensions: data.dimensions,
      brand: data.brand,
      model: data.model,
      material: data.material,
      tags: data.tags,
      attributes: attributesObj,
      faqs: data.faqs,
      images: uploadedImages.map((img, index) => ({
        imageUrl: img.imageUrl,
        sortOrder: index,
        isPrimary: img.isPrimary
      })),
      imagesToDelete: data.imagesToDelete,
      sku,
      variants: data.variants?.map((variant) => ({
        ...variant
      })),
      allowBackorders: data.allowBackorders,
      isFeatured: data.isFeatured,
      featuredUntil: data.featuredUntil,
    };

    const result = await apiService.post<unknown>('/products', payload);
    
    // Invalidate all product cache to ensure product lists refresh
    invalidateAllProductCache();
    
    return result;
  }

  async getProductById(productId: string): Promise<ProductDetail> {
    const data = await apiService.get<ProductDetail>(`/products/${productId}`);
    if (!data) throw new Error('Product not found');
    return data;
  }

  async updateProduct(productId: string, data: Partial<CreateProductDTO>): Promise<ProductDetail> {
    // Handle image uploads if present
    let imageUrls: Array<{ imageUrl: string; isPrimary: boolean }> = [];
    if (data.images?.length) {
      imageUrls = await this.uploadImages(data.images);
    }

    // Prepare the update payload
    const statusCode = data.status ? this.statusToEnum(data.status) : undefined;
    const attributes = data.attributes?.reduce((acc, attr) => ({
      ...acc,
      [attr.name]: attr.value
    }), {} as Record<string, string>);

    const updateVariants = data.variants?.map<ProductVariantUpdatePayload>((variant) => ({
      ...variant,
      price: variant.price ? parseFloat(variant.price) : undefined,
      stockQuantity: variant.stockQuantity ? parseInt(variant.stockQuantity, 10) : undefined,
    }));

    const updatePayload: UpdateProductPayload = {
      id: productId,
      name: data.name,
      description: data.description,
      price: data.price ? parseFloat(data.price) : undefined,
      discountPrice: data.discountPrice,
      stockQuantity: data.stockQuantity ? parseInt(data.stockQuantity, 10) : undefined,
      categoryId: data.categoryId,
      status: statusCode,
      currency: data.currency,
      minOrderQuantity: data.minOrderQuantity ? parseInt(data.minOrderQuantity, 10) : undefined,
      maxOrderQuantity: data.maxOrderQuantity ? parseInt(data.maxOrderQuantity, 10) : undefined,
      weight: data.weight ? parseFloat(data.weight) : undefined,
      weightUnit: data.weightUnit,
      dimensions: data.dimensions,
      brand: data.brand,
      model: data.model,
      material: data.material,
      tags: data.tags,
      attributes,
      faqs: data.faqs,
      NewImages: imageUrls.length > 0 ? imageUrls.map((img, index) => ({
        imageUrl: img.imageUrl,
        altText: `${data.name || 'Product'} image ${index + 1}`,
        sortOrder: index,
        isPrimary: img.isPrimary
      })) : undefined,
      ImagesToDelete: data.imagesToDelete,
      variants: updateVariants,
    };

    const responseData = await apiService.put<ProductDetail>(`/products/${productId}`, updatePayload);
    if (!responseData) throw new Error('Failed to update product');
    
    // Invalidate cache for this product so it gets fresh data on next view
    invalidateProductCache(productId);
    
    return responseData;
  }

  async deleteProduct(productId: string): Promise<void> {
    await apiService.delete(`/products/${productId}`);
    
    // Invalidate cache for deleted product
    invalidateProductCache(productId);
  }

  async reduceStock(productId: string, quantity: number): Promise<void> {
    const response = await apiService.post<{ success: boolean; message: string }>(
      `/products/${productId}/reduce-stock`,
      { quantity }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to reduce stock');
    }
  }

  async bulkReduceStock(products: Array<{ productId: string; quantity: number }>): Promise<void> {
    const response = await apiService.post<{ success: boolean; message: string }>(
      '/products/bulk-reduce-stock',
      { products }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to reduce stock in bulk');
    }
  }
}

export default new ProductService();