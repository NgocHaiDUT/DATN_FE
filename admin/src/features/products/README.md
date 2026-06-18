# Products Feature

## Overview
The Products feature manages cosmetic products in the web admin application. It follows Clean Architecture principles with clear separation between domain, use cases, data, and presentation layers.

## Architecture

### Domain Layer (`domain/`)
- **Entities**: Core business objects
  - `Product`: Main product entity with properties like name, price, brand, category, stock, etc.
  - `CreateProductInput`: DTO for creating new products
  - `UpdateProductInput`: DTO for updating existing products

- **Repositories**: Interface definitions
  - `IProductRepository`: Defines contract for product data operations

### Use Cases Layer (`usecases/`)
Business logic and application-specific flows:
- `GetProductsUseCase`: Retrieve products with filtering and pagination
- `GetProductByIdUseCase`: Get single product details
- `CreateProductUseCase`: Create new product with validation
- `UpdateProductUseCase`: Update existing product
- `DeleteProductUseCase`: Delete product by ID

### Data Layer (`data/`)
- **API**: HTTP client and DTOs
  - `productApi.ts`: API endpoints (placeholder for future implementation)
  - `mappers.ts`: Convert between DTOs and domain entities

- **Repositories**: Implementation of repository interfaces
  - `ProductRepositoryImpl`: Mock implementation using in-memory data

- **Mock Data**: `mockProducts.ts` - Sample product data for development

### Presentation Layer (`ui/`)
- **Components**:
  - `ProductTable`: Display products in table format
  - `ProductForm`: Form for creating/editing products
  - `Pagination`: Pagination controls

- **Pages**:
  - `ProductsPage`: Main products management page with search, filter, CRUD operations
  - `ProductDetailPage`: Detailed view of a single product

### Hooks (`hooks/`)
- `useProducts`: React hook connecting UI to use cases, managing state and actions

## Usage

### Import the feature
```typescript
import { ProductsPage, useProducts } from '@/features/products';
```

### Use the Products page
```tsx
import { ProductsPage } from '@/features/products';

function App() {
  return <ProductsPage />;
}
```

### Use the hook directly
```tsx
import { useProducts } from '@/features/products';

function MyComponent() {
  const { products, loading, error, fetchProducts } = useProducts();
  
  useEffect(() => {
    fetchProducts({ page: 1, limit: 10 });
  }, []);
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Features

### Product Management
- ✅ List products with pagination
- ✅ Search products by name, description, or brand
- ✅ Filter by category
- ✅ Filter by shop
- ✅ View product details
- ✅ Create new products
- ✅ Edit existing products
- ✅ Delete products
- ✅ Visual stock alerts for low inventory

### Validation
- Name is required
- Price must be non-negative
- Stock quantity must be non-negative
- Shop ID is required

## Data Model

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  shopId: string;
  category: string;
  brand: string;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Integration (Future)
The current implementation uses mock data. To integrate with a real API:

1. Implement API calls in `data/api/productApi.ts`
2. Update `ProductRepositoryImpl` to use the API client
3. Update mappers if DTO structure differs from mock data

Example:
```typescript
// data/api/productApi.ts
export const productApi = {
  async fetchProducts(params) {
    const response = await axios.get('/api/products', { params });
    return response.data;
  },
  // ... other endpoints
};
```

## Testing
- Unit tests should be added for use cases (business logic)
- Integration tests for repository implementations
- Component tests for UI components

## Related Features
- **Shops**: Products belong to shops
- **Orders**: Products are included in orders
- **Users**: Sellers manage products in their shops

## Contributing
When adding new functionality:
1. Follow the Clean Architecture layers
2. Add JSDoc comments to all exported functions
3. Update this README with new features
4. Ensure TypeScript types are properly defined
