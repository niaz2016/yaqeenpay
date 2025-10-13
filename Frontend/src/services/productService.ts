import apiService from './api';

export interface ProductImage {
  file: File;
  isPrimary: boolean;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: string;
  discountPrice?: string;
  stockQuantity: string;
  categoryId: string;
  status: 'Draft' | 'Active' | 'Inactive';
  currency: string;
  attributes?: ProductAttribute[];
  images: ProductImage[];
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  discountPrice?: number;
  sku: string;
  stockQuantity: number;
  status: string;
  categoryId: string;
  sellerId: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
  images: Array<{
    imageUrl: string;
    altText: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  attributes: Record<string, string>;
}

class ProductService {
  // Upload a single image and return the URL
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use the existing profile upload endpoint for now
      // TODO: Create a dedicated product image upload endpoint
      console.log('[ProductService] Uploading image file:', file.name, 'Size:', file.size);
      const response = await apiService.post<{ url: string }>('/profile/upload-image', formData);
      console.log('[ProductService] Image upload response:', response);
      console.log('[ProductService] Extracted URL:', response.url);
      
      if (!response.url || response.url.trim() === '') {
        console.error('[ProductService] WARNING: Upload returned empty or invalid URL!', response);
        throw new Error('Upload endpoint returned empty URL');
      }
      
      return response.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  // Upload multiple images and return their URLs
  async uploadImages(images: ProductImage[]): Promise<Array<{ imageUrl: string; isPrimary: boolean }>> {
    try {
      const uploadPromises = images.map(async (image) => {
        const imageUrl = await this.uploadImage(image.file);
        return {
          imageUrl,
          isPrimary: image.isPrimary
        };
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload one or more images');
    }
  }

  // Create a product
  async createProduct(productData: CreateProductRequest): Promise<ProductResponse> {
    try {
      // First, upload all images if any
      let imageUrls: Array<{ imageUrl: string; isPrimary: boolean }> = [];
      
      if (productData.images && productData.images.length > 0) {
        imageUrls = await this.uploadImages(productData.images);
      }

      // Prepare the CreateProductCommand - this matches the backend's expected structure
      const createProductCommand = {
        categoryId: productData.categoryId, // This should be a GUID string
        name: productData.name,
        description: productData.description,
        shortDescription: undefined,
        price: parseFloat(productData.price),
        currency: productData.currency || 'PKR',
        discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : undefined,
        sku: `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, // Generate unique SKU
        stockQuantity: parseInt(productData.stockQuantity),
        minOrderQuantity: 1,
        maxOrderQuantity: 999999,
        weight: 0,
        weightUnit: 'kg',
        dimensions: undefined,
        brand: undefined,
        model: undefined,
        color: undefined,
        size: undefined,
        material: undefined,
        allowBackorders: false,
        tags: [],
        attributes: productData.attributes ? 
          productData.attributes.reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {} as Record<string, string>) : {},
        images: imageUrls.map((img, index) => {
          console.log(`[ProductService] Processing image ${index + 1}:`, {
            originalImageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
            sortOrder: index
          });
          return {
            ImageUrl: img.imageUrl,
            AltText: `${productData.name} image ${index + 1}`,
            SortOrder: index,
            IsPrimary: img.isPrimary
          };
        })
      };

      console.log('[ProductService] Final createProductCommand:', JSON.stringify(createProductCommand, null, 2));
      console.log('[ProductService] Images in command:', createProductCommand.images);

      const response = await apiService.post<{ id: string }>('/products', createProductCommand);
      
      return {
        id: response.id,
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        currency: productData.currency,
        discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : undefined,
        sku: '', // Will be generated by backend
        stockQuantity: parseInt(productData.stockQuantity),
        status: productData.status,
        categoryId: productData.categoryId,
        sellerId: '', // Will be filled by backend
        createdAt: new Date().toISOString(),
        category: {
          id: productData.categoryId,
          name: '' // Will be filled by backend
        },
        images: [], // Will be populated after creation
        attributes: {} // Default empty attributes
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Get products for marketplace
  async getProducts(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.categoryId) queryParams.append('categoryId', params.categoryId);

      const url = `/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('[ProductService] Fetching products from:', url);
      console.log('[ProductService] Parameters:', params);
      
      const response = await apiService.get(url);
      console.log('[ProductService] Products API response:', response);
      console.log('[ProductService] Response type:', typeof response);
      console.log('[ProductService] Response keys:', response ? Object.keys(response) : 'null');
      
      // Handle both PascalCase (C#) and camelCase (JavaScript) property names  
      const responseData = response as any;
      const items = responseData.items || responseData.Items || [];
      const totalCount = responseData.totalCount || responseData.TotalCount || 0;
      
      // Log detailed product information, especially images
      if (items && Array.isArray(items) && items.length > 0) {
        console.log('[ProductService] First product full details:', JSON.stringify(items[0], null, 2));
        items.forEach((product: any, index: number) => {
          console.log(`[ProductService] Product ${index + 1} images:`, product.images);
          if (product.images && Array.isArray(product.images)) {
            product.images.forEach((img: any, imgIndex: number) => {
              console.log(`[ProductService] Product ${index + 1} Image ${imgIndex + 1} - ALL PROPERTIES:`, img);
              console.log(`[ProductService] Product ${index + 1} Image ${imgIndex + 1} - STRUCTURED:`, {
                id: img.id,
                imageUrl: img.imageUrl,
                ImageUrl: img.ImageUrl,
                isPrimary: img.isPrimary,
                IsPrimary: img.IsPrimary,
                altText: img.altText,
                AltText: img.AltText,
                sortOrder: img.sortOrder,
                SortOrder: img.SortOrder
              });
            });
          }
        });
      }
      
      console.log('[ProductService] Response structure check:', {
        hasSuccess: response && typeof response === 'object' && 'success' in response,
        hasData: response && typeof response === 'object' && 'data' in response,
        hasItems: responseData.items || responseData.Items,
        hasItemsUppercase: !!responseData.Items,
        hasItemsLowercase: !!responseData.items,
        hasTotalCount: responseData.totalCount || responseData.TotalCount
      });
      
      // Return normalized structure with lowercase property names for frontend consistency
      const normalizedResponse = {
        items: items,
        totalCount: totalCount,
        pageNumber: responseData.pageNumber || responseData.PageNumber || 1,
        pageSize: responseData.pageSize || responseData.PageSize || items.length,
        totalPages: responseData.totalPages || responseData.TotalPages || Math.ceil(totalCount / (responseData.pageSize || responseData.PageSize || 12))
      };
      
      console.log('[ProductService] Returning normalized response:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error: any) {
      console.error('[ProductService] Error fetching products:', error);
      console.error('[ProductService] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Get seller's products
  async getSellerProducts(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = `/products/seller${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Error fetching seller products:', error);
      throw error;
    }
  }

  // Get product by ID
  async getProductById(productId: string): Promise<ProductResponse> {
    try {
      console.log('[ProductService] Fetching product by ID:', productId);
      const response = await apiService.get(`/products/${productId}`);
      console.log('[ProductService] Product details response:', response);
      
      // Handle both PascalCase (C#) and camelCase (JavaScript) property names
      const data = response as any;
      return {
        id: data.id || data.Id,
        name: data.name || data.Name,
        description: data.description || data.Description,
        price: data.price || data.Price,
        currency: data.currency || data.Currency || 'PKR',
        discountPrice: data.discountPrice || data.DiscountPrice,
        sku: data.sku || data.Sku || data.SKU || '',
        stockQuantity: data.stockQuantity || data.StockQuantity,
        status: data.status || data.Status,
        categoryId: data.categoryId || data.CategoryId,
        sellerId: data.sellerId || data.SellerId,
        createdAt: data.createdAt || data.CreatedAt,
        category: {
          id: (data.category || data.Category)?.id || (data.category || data.Category)?.Id || '',
          name: (data.category || data.Category)?.name || (data.category || data.Category)?.Name || ''
        },
        images: (data.images || data.Images || []).map((img: any) => ({
          imageUrl: img.imageUrl || img.ImageUrl || '',
          altText: img.altText || img.AltText || '',
          isPrimary: img.isPrimary || img.IsPrimary || false,
          sortOrder: img.sortOrder || img.SortOrder || 0
        })),
        attributes: data.attributes || data.Attributes || {}
      };
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw new Error('Failed to fetch product details');
    }
  }

  // Update existing product
  async updateProduct(productId: string, updateData: {
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    stockQuantity: number;
    categoryId: string;
    status: 'Draft' | 'Active' | 'Inactive';
    currency: string;
    imagesToDelete?: string[];
    newImages?: Array<{ file: File; isPrimary: boolean }>;
  }): Promise<ProductResponse> {
    try {
      console.log('[ProductService] Updating product:', productId, updateData);
      
      // Upload new images first if any
      let newImageUrls: Array<{ imageUrl: string; isPrimary: boolean }> = [];
      if (updateData.newImages && updateData.newImages.length > 0) {
        console.log('[ProductService] Uploading new images...');
        newImageUrls = await Promise.all(
          updateData.newImages.map(async (imageData) => {
            const imageUrl = await this.uploadImage(imageData.file);
            return {
              imageUrl,
              isPrimary: imageData.isPrimary
            };
          })
        );
        console.log('[ProductService] New images uploaded:', newImageUrls);
      }

      // Prepare the update payload
      const payload = {
        id: productId,
        categoryId: updateData.categoryId,
        name: updateData.name,
        description: updateData.description,
        shortDescription: '', // Add default short description
        price: updateData.price,
        currency: updateData.currency,
        discountPrice: updateData.discountPrice,
        stockQuantity: updateData.stockQuantity,
        minOrderQuantity: 1, // Add default min order quantity
        maxOrderQuantity: 999999, // Add default max order quantity
        weight: 0, // Add default weight
        weightUnit: 'kg', // Add default weight unit
        dimensions: null, // Add default dimensions
        brand: null, // Add default brand
        model: null, // Add default model
        color: null, // Add default color
        size: null, // Add default size
        material: null, // Add default material
        allowBackorders: false, // Add default allow backorders
        status: updateData.status === 'Active' ? 'Active' : updateData.status === 'Inactive' ? 'Inactive' : 'Draft',
        tags: [], // Add default tags
        attributes: {}, // Add default attributes
        // Include image operations
        imagesToDelete: updateData.imagesToDelete || [],
        newImages: newImageUrls.map(img => ({
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
          altText: '', // Could be enhanced to accept alt text
          sortOrder: 0 // Could be enhanced to accept sort order
        }))
      };

      console.log('[ProductService] Update payload:', payload);
      const response = await apiService.put(`/products/${productId}`, payload);
      console.log('[ProductService] Product updated successfully:', response);
      
      // Fetch and return the updated product
      return await this.getProductById(productId);
      
    } catch (error) {
      console.error('Error updating product:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update product');
    }
  }

  // Reduce stock quantity when payment is made
  async reduceStock(productId: string, quantity: number): Promise<void> {
    try {
      console.log(`[ProductService] Reducing stock for product ${productId} by ${quantity}`);
      
      const response = await apiService.post<{ success: boolean; message: string; newStockQuantity: number }>(
        `/products/${productId}/reduce-stock`, 
        { quantity }
      );
      
      console.log('[ProductService] Stock reduction response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reduce stock');
      }
    } catch (error) {
      console.error('Error reducing product stock:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to reduce product stock');
    }
  }

  // Bulk reduce stock for multiple products (for orders with multiple items)
  async bulkReduceStock(items: Array<{ productId: string; quantity: number }>): Promise<void> {
    try {
      console.log('[ProductService] Bulk reducing stock for items:', items);
      
      const response = await apiService.post<{ success: boolean; message: string; results: Array<{ productId: string; success: boolean; newStockQuantity?: number; error?: string }> }>(
        '/products/bulk-reduce-stock', 
        { items }
      );
      
      console.log('[ProductService] Bulk stock reduction response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reduce stock for some items');
      }

      // Check if any individual items failed
      const failedItems = response.results?.filter(result => !result.success) || [];
      if (failedItems.length > 0) {
        const errorDetails = failedItems.map(item => `${item.productId}: ${item.error}`).join(', ');
        throw new Error(`Stock reduction failed for: ${errorDetails}`);
      }
    } catch (error) {
      console.error('Error in bulk stock reduction:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to reduce stock for multiple products');
    }
  }
}

const productService = new ProductService();
export default productService;