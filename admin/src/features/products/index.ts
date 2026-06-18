// Domain exports
export type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from './domain/entities/Product';
export type { IProductRepository } from './domain/repositories/IProductRepository';

// Use cases exports
export {
  GetProductsUseCase,
  GetProductByIdUseCase,
  CreateProductUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
} from './usecases';

// Data layer exports
export { ProductRepositoryImpl } from './data/repositories';

// Hooks exports
export { useProducts } from './hooks';

// UI exports
export {
  ProductTable,
  Pagination,
  ProductForm,
} from './ui/components';
export {
  ProductsPage,
  ProductDetailPage,
  BrandsPage,
  CategoriesPage,
} from './ui/pages';
