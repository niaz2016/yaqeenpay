import apiService from './api';
import type { ProductDetail } from '../types/product';

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
  images?: ProductImage[];
  imagesToDelete?: string[];
  variants?: Array<{
    size?: string;
    color?: string;
    price?: string;
    stockQuantity?: string;
    sku?: string;
    [key: string]: any;
  }>;
}

// Frontend-friendly create request that supports uploading newImages (files)
export type CreateProductRequest = Omit<CreateProductDTO, 'images' | 'variants'> & {
  newImages?: ProductImage[];
  images?: ProductImage[]; // existing images (for updates)
  imagesToDelete?: string[];
  sku?: string;
  variants?: Array<{
    size?: string;
    color?: string;
    price?: number;
    stockQuantity?: number;
    [key: string]: any;
  }>;
};

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

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    // apiService.post unwraps ApiResponse wrappers and returns inner data when possible.
    const result = await apiService.post<any>('/profile/upload-image', formData);
    // Support multiple possible shapes returned by the upload endpoint
    // - { url: '...' }
    // - { data: { url: '...' } }
    // - { success: true, data: { url: '...' } }
    const url = result?.url || result?.data?.url || (result?.data && result.data?.data?.url) || null;
    if (!url) throw new Error('Upload succeeded but server did not return file URL');
    return url;
  }

  async uploadImages(images: ProductImage[]): Promise<Array<{ imageUrl: string; isPrimary: boolean }>> {
    const uploadPromises = images.map(async (image) => {
      const imageUrl = await this.uploadImage(image.file);
      return { imageUrl, isPrimary: image.isPrimary };
    });
    return await Promise.all(uploadPromises);
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

  async createProduct(data: CreateProductRequest): Promise<any> {
    // Prefer images passed in `images` (already in service format), otherwise use `newImages` (File uploads)
    const imagesToUpload = (data.images && data.images.length) ? data.images : (data.newImages || []);

    const uploadedImages = imagesToUpload.length ? await this.uploadImages(imagesToUpload) : [];

    // Build attributes object expected by backend (Dictionary<string,string>)
    const attributesObj = data.attributes?.reduce((acc, attr) => ({
      ...acc,
      [attr.name]: attr.value
    }), {} as Record<string, string>) || {};

    // Ensure SKU exists - backend requires SKU
    const sku = (data as any).sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const payload: any = {
      ...data,
      sku,
      price: parseFloat(data.price),
      stockQuantity: parseInt(data.stockQuantity as any, 10),
      status: this.statusToEnum((data as any).status) ?? this.statusToEnum('Active'),
      // optional numeric conversions
      minOrderQuantity: data.minOrderQuantity ? parseInt(data.minOrderQuantity as any, 10) : undefined,
      maxOrderQuantity: data.maxOrderQuantity ? parseInt(data.maxOrderQuantity as any, 10) : undefined,
      weight: data.weight ? parseFloat(data.weight as any) : undefined,
      weightUnit: data.weightUnit,
      dimensions: (data as any).dimensions,
      brand: (data as any).brand,
      model: (data as any).model,
      material: (data as any).material,
      tags: (data as any).tags,
      attributes: attributesObj,
      images: uploadedImages.map((img, index) => ({
        imageUrl: img.imageUrl,
        altText: undefined,
        sortOrder: index,
        isPrimary: img.isPrimary
      }))
    };

    // Remove frontend-only props that backend doesn't expect
    delete payload.newImages;

    const response = await apiService.post<any>('/products', payload);
    return response;
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
    const updatePayload: any = {
      ...data,
      id: productId, // Include the product ID in the payload
      price: data.price ? parseFloat(data.price) : undefined,
      stockQuantity: data.stockQuantity ? parseInt(data.stockQuantity, 10) : undefined,
      minOrderQuantity: data.minOrderQuantity ? parseInt(data.minOrderQuantity, 10) : undefined,
      maxOrderQuantity: data.maxOrderQuantity ? parseInt(data.maxOrderQuantity, 10) : undefined,
      weight: data.weight ? parseFloat(data.weight) : undefined,
      status: this.statusToEnum((data as any).status),
      attributes: data.attributes?.reduce((acc, attr) => ({ 
        ...acc, [attr.name]: attr.value 
      }), {} as Record<string, string>),
      // Map to backend's expected property name for new images
      NewImages: imageUrls.length > 0 ? imageUrls.map((img, index) => ({
        imageUrl: img.imageUrl,
        altText: `${data.name || 'Product'} image ${index + 1}`,
        sortOrder: index,
        isPrimary: img.isPrimary
      })) : undefined,
      // Pass through imagesToDelete if provided
      ImagesToDelete: (data as any).imagesToDelete
    };

    // Include variants when provided by the frontend
    if ((data as any).variants && Array.isArray((data as any).variants)) {
      updatePayload.variants = (data as any).variants.map((v: any) => ({
        size: v.size,
        color: v.color,
        price: v.price ? parseFloat(v.price as any) : undefined,
        stockQuantity: v.stockQuantity ? parseInt(v.stockQuantity as any, 10) : undefined,
        sku: v.sku
      }));
    }

    const responseData = await apiService.put<ProductDetail>(`/products/${productId}`, updatePayload);
    if (!responseData) throw new Error('Failed to update product');
    return responseData;
  }

  async deleteProduct(productId: string): Promise<void> {
    await apiService.delete(`/products/${productId}`);
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