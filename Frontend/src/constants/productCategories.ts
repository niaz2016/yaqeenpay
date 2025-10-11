export interface ProductCategory {
  id: string;
  name: string;
  description: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Smartphones, laptops, computers, cameras, and video games'
  },
  {
    id: 'fashion',
    name: 'Fashion',
    description: 'Clothing, shoes, jewelry, and accessories like handbags and watches'
  },
  {
    id: 'home-kitchen',
    name: 'Home and Kitchen',
    description: 'Furniture, decor, kitchen appliances, and home security items'
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty and Personal Care',
    description: 'Cosmetics, skincare, and personal care appliances'
  },
  {
    id: 'food-beverage',
    name: 'Food and Beverage',
    description: 'Groceries, drinks, and related household items'
  },
  {
    id: 'books',
    name: 'Books',
    description: 'Physical and digital books across various genres'
  },
  {
    id: 'toys-hobbies',
    name: 'Toys and Hobbies',
    description: 'Games, educational toys, and hobby-related equipment'
  },
  {
    id: 'pet-supplies',
    name: 'Pet Supplies',
    description: 'Pet food, care products, and toys'
  },
  {
    id: 'sports-outdoors',
    name: 'Sports and Outdoors',
    description: 'Sports equipment, athletic apparel, and outdoor gear'
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Car electronics, GPS devices, and accessories'
  },
  {
    id: 'office-stationery',
    name: 'Office and Stationery',
    description: 'Office supplies, stationery, and greeting cards'
  },
  {
    id: 'others',
    name: 'Others',
    description: 'Miscellaneous items that don\'t fit other categories'
  }
];

// Helper function to get category by id
export const getCategoryById = (id: string): ProductCategory | undefined => {
  return PRODUCT_CATEGORIES.find(category => category.id === id);
};

// Helper function to get category name by id
export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category ? category.name : 'Unknown Category';
};