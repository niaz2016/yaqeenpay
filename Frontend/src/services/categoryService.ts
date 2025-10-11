import apiService from './api';

// Category interface matching backend structure
export interface Category {
  id: string; // GUID from backend
  name: string;
  description: string;
  imageUrl?: string;
  parentCategoryId?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  subCategories: Category[];
}

class CategoryService {
  // Cache for categories to avoid repeated API calls
  private categoriesCache: Category[] | null = null;

  // Get all categories from backend
  async getCategories(includeInactive: boolean = false): Promise<Category[]> {
    try {
      if (this.categoriesCache && !includeInactive) {
        return this.categoriesCache;
      }

      const params = new URLSearchParams();
      if (includeInactive) {
        params.append('includeInactive', 'true');
      }

      const categories = await apiService.get<Category[]>(`/categories${params.toString() ? '?' + params.toString() : ''}`);
      
      if (categories && Array.isArray(categories)) {
        this.categoriesCache = categories;
        return categories;
      }

      // If API fails, return empty array
      console.warn('Failed to load categories from API');
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get flattened list of all categories (including subcategories)
  getFlattenedCategories(categories: Category[]): Category[] {
    const flattened: Category[] = [];
    
    const flatten = (cats: Category[]) => {
      for (const cat of cats) {
        flattened.push(cat);
        if (cat.subCategories && cat.subCategories.length > 0) {
          flatten(cat.subCategories);
        }
      }
    };

    flatten(categories);
    return flattened;
  }

  // Find category by ID
  findCategoryById(categories: Category[], id: string): Category | undefined {
    for (const cat of categories) {
      if (cat.id === id) return cat;
      
      if (cat.subCategories && cat.subCategories.length > 0) {
        const found = this.findCategoryById(cat.subCategories, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  // Get category name by ID
  getCategoryName(categoryId: string, categories: Category[] = []): string {
    const category = this.findCategoryById(categories, categoryId);
    return category ? category.name : 'Unknown Category';
  }

  // Clear cache (useful for refreshing categories)
  clearCache(): void {
    this.categoriesCache = null;
  }
}

const categoryService = new CategoryService();
export default categoryService;