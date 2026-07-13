import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Product, Category, Review } from '@shared/types';

export interface ProductFilters {
  search?: string;
  category?: string;
  veg?: 'all' | 'veg' | 'non-veg';
  bestseller?: boolean;
  featured?: boolean;
  sortBy?: 'popular' | 'price-low' | 'price-high';
}

export const useCategoriesQuery = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });
};

export const useProductsQuery = (filters: ProductFilters = {}) => {
  return useQuery<Product[]>({
    queryKey: ['products', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.veg && filters.veg !== 'all') params.append('veg', filters.veg);
      if (filters.bestseller) params.append('bestseller', 'true');
      if (filters.featured) params.append('featured', 'true');
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const queryStr = params.toString();
      return api.get<Product[]>(`/products?${queryStr}`);
    },
  });
};

export const useProductBySlugQuery = (slug: string) => {
  return useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: () => api.get<Product>(`/products/${slug}`),
    enabled: !!slug,
  });
};

export const useProductReviewsQuery = (productId: string) => {
  return useQuery<Review[]>({
    queryKey: ['reviews', productId],
    queryFn: () => api.get<Review[]>(`/products/${productId}/reviews`),
    enabled: !!productId,
  });
};
