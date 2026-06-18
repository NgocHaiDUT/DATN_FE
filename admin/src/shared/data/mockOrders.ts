import type { Order } from '../types/Order';

/**
 * Mock orders data for shops - order history spanning last 3 months
 * Using real user IDs from mockUsers as customers
 */
export const mockOrders: Order[] = [
  // Shop 1 (Makeup Haven) - Orders
  {
    id: 'order-1',
    shopId: 'shop-1',
    customerId: '1',
    customerName: 'Nguyễn Văn An',
    items: [
      { productId: 'prod-1', productName: 'MAC Ruby Woo Lipstick', price: 650000, quantity: 2, subtotal: 1300000 },
      { productId: 'prod-3', productName: 'La Roche-Posay Sunscreen SPF 50', price: 420000, quantity: 1, subtotal: 420000 },
    ],
    total: 1720000,
    status: 'completed',
    orderDate: '2024-10-15T14:30:00',
    paymentMethod: 'card',
    shippingAddress: '123 Đường Lê Lợi, Hồ Chí Minh',
  },
  {
    id: 'order-2',
    shopId: 'shop-1',
    customerId: '4',
    customerName: 'Phạm Thị Dung',
    items: [
      { productId: 'prod-2', productName: 'Estée Lauder Double Wear Foundation', price: 1250000, quantity: 1, subtotal: 1250000 },
    ],
    total: 1250000,
    status: 'completed',
    orderDate: '2024-10-12T10:15:00',
    paymentMethod: 'e-wallet',
  },
  {
    id: 'order-3',
    shopId: 'shop-1',
    customerId: '7',
    customerName: 'Võ Văn Giang',
    items: [
      { productId: 'prod-1', productName: 'MAC Ruby Woo Lipstick', price: 650000, quantity: 1, subtotal: 650000 },
      { productId: 'prod-2', productName: 'Estée Lauder Double Wear Foundation', price: 1250000, quantity: 1, subtotal: 1250000 },
      { productId: 'prod-3', productName: 'La Roche-Posay Sunscreen SPF 50', price: 420000, quantity: 2, subtotal: 840000 },
    ],
    total: 2740000,
    status: 'processing',
    orderDate: '2024-10-18T09:20:00',
    paymentMethod: 'transfer',
  },
  
  // Shop 2 (Glamour Hub) - Orders
  {
    id: 'order-4',
    shopId: 'shop-2',
    customerId: '10',
    customerName: 'Ngô Thị Kim',
    items: [
      { productId: 'prod-4', productName: 'Urban Decay Naked Palette', price: 1850000, quantity: 1, subtotal: 1850000 },
    ],
    total: 1850000,
    status: 'completed',
    orderDate: '2024-10-14T16:45:00',
    paymentMethod: 'card',
  },
  {
    id: 'order-5',
    shopId: 'shop-2',
    customerId: '13',
    customerName: 'Lý Văn Nam',
    items: [
      { productId: 'prod-5', productName: 'Benefit Roller Lash Mascara', price: 850000, quantity: 2, subtotal: 1700000 },
    ],
    total: 1700000,
    status: 'completed',
    orderDate: '2024-10-10T11:30:00',
    paymentMethod: 'e-wallet',
  },
  
  // Shop 4 (Skin Glow Studio) - Orders
  {
    id: 'order-6',
    shopId: 'shop-4',
    customerId: '1',
    customerName: 'Nguyễn Văn An',
    items: [
      { productId: 'prod-6', productName: 'CeraVe Hydrating Cleanser', price: 380000, quantity: 2, subtotal: 760000 },
      { productId: 'prod-7', productName: 'The Ordinary Niacinamide Serum', price: 280000, quantity: 3, subtotal: 840000 },
      { productId: 'prod-8', productName: 'Neutrogena Hydro Boost Water Gel', price: 450000, quantity: 1, subtotal: 450000 },
    ],
    total: 2050000,
    status: 'completed',
    orderDate: '2024-10-16T13:00:00',
    paymentMethod: 'card',
  },
  {
    id: 'order-7',
    shopId: 'shop-4',
    customerId: '14',
    customerName: 'Hồ Thị Oanh',
    items: [
      { productId: 'prod-9', productName: 'Paula\'s Choice BHA Exfoliant', price: 720000, quantity: 1, subtotal: 720000 },
      { productId: 'prod-7', productName: 'The Ordinary Niacinamide Serum', price: 280000, quantity: 2, subtotal: 560000 },
    ],
    total: 1280000,
    status: 'completed',
    orderDate: '2024-10-13T15:20:00',
    paymentMethod: 'e-wallet',
  },
  {
    id: 'order-8',
    shopId: 'shop-4',
    customerId: '17',
    customerName: 'Mai Văn Sơn',
    items: [
      { productId: 'prod-6', productName: 'CeraVe Hydrating Cleanser', price: 380000, quantity: 1, subtotal: 380000 },
    ],
    total: 380000,
    status: 'pending',
    orderDate: '2024-10-19T08:00:00',
    paymentMethod: 'cash',
  },
  
  // Shop 5 (Luxe Beauty Boutique) - Orders
  {
    id: 'order-9',
    shopId: 'shop-5',
    customerId: '4',
    customerName: 'Phạm Thị Dung',
    items: [
      { productId: 'prod-12', productName: 'Tom Ford Black Orchid Perfume', price: 4500000, quantity: 1, subtotal: 4500000 },
    ],
    total: 4500000,
    status: 'completed',
    orderDate: '2024-10-11T10:00:00',
    paymentMethod: 'card',
  },
  {
    id: 'order-10',
    shopId: 'shop-5',
    customerId: '20',
    customerName: 'La Thị Vân',
    items: [
      { productId: 'prod-10', productName: 'Chanel Rouge Allure Lipstick', price: 1350000, quantity: 2, subtotal: 2700000 },
      { productId: 'prod-11', productName: 'Dior Backstage Face & Body Foundation', price: 1650000, quantity: 1, subtotal: 1650000 },
    ],
    total: 4350000,
    status: 'completed',
    orderDate: '2024-10-09T14:30:00',
    paymentMethod: 'transfer',
  },
  
  // Shop 7 (K-Beauty Paradise) - Orders
  {
    id: 'order-11',
    shopId: 'shop-7',
    customerId: '3',
    customerName: 'Lê Văn Cường',
    items: [
      { productId: 'prod-15', productName: 'COSRX Snail Mucin Essence', price: 450000, quantity: 2, subtotal: 900000 },
      { productId: 'prod-16', productName: 'Laneige Water Sleeping Mask', price: 680000, quantity: 1, subtotal: 680000 },
    ],
    total: 1580000,
    status: 'completed',
    orderDate: '2024-10-17T12:00:00',
    paymentMethod: 'e-wallet',
  },
  {
    id: 'order-12',
    shopId: 'shop-7',
    customerId: '11',
    customerName: 'Đinh Văn Long',
    items: [
      { productId: 'prod-17', productName: 'Etude House Drawing Eyebrow', price: 120000, quantity: 3, subtotal: 360000 },
      { productId: 'prod-18', productName: 'Innisfree Green Tea Seed Serum', price: 520000, quantity: 1, subtotal: 520000 },
      { productId: 'prod-15', productName: 'COSRX Snail Mucin Essence', price: 450000, quantity: 1, subtotal: 450000 },
    ],
    total: 1330000,
    status: 'completed',
    orderDate: '2024-10-08T09:45:00',
    paymentMethod: 'card',
  },
  {
    id: 'order-13',
    shopId: 'shop-7',
    customerId: '7',
    customerName: 'Võ Văn Giang',
    items: [
      { productId: 'prod-15', productName: 'COSRX Snail Mucin Essence', price: 450000, quantity: 4, subtotal: 1800000 },
    ],
    total: 1800000,
    status: 'completed',
    orderDate: '2024-10-05T16:20:00',
    paymentMethod: 'transfer',
  },
  
  // Shop 8 (Nail & Beauty Bar) - Orders
  {
    id: 'order-14',
    shopId: 'shop-8',
    customerId: '13',
    customerName: 'Lý Văn Nam',
    items: [
      { productId: 'prod-19', productName: 'OPI Gel Color Polish', price: 350000, quantity: 3, subtotal: 1050000 },
      { productId: 'prod-21', productName: 'CND Solar Oil Nail Treatment', price: 420000, quantity: 1, subtotal: 420000 },
    ],
    total: 1470000,
    status: 'completed',
    orderDate: '2024-10-16T11:15:00',
    paymentMethod: 'cash',
  },
  {
    id: 'order-15',
    shopId: 'shop-8',
    customerId: '20',
    customerName: 'La Thị Vân',
    items: [
      { productId: 'prod-20', productName: 'Essie Expressie Quick-Dry', price: 280000, quantity: 2, subtotal: 560000 },
    ],
    total: 560000,
    status: 'completed',
    orderDate: '2024-10-14T10:30:00',
    paymentMethod: 'e-wallet',
  },
];

/**
 * Get orders by shop ID
 */
export const getOrdersByShopId = (shopId: string): Order[] => {
  return mockOrders.filter(order => order.shopId === shopId);
};

/**
 * Get order by ID
 */
export const getOrderById = (orderId: string): Order | undefined => {
  return mockOrders.find(order => order.id === orderId);
};

/**
 * Calculate total revenue for a shop
 */
export const calculateShopRevenue = (shopId: string): number => {
  return mockOrders
    .filter(order => order.shopId === shopId && order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);
};

/**
 * Get top selling products for a shop
 */
export const getTopProducts = (shopId: string, limit: number = 5): Array<{ productId: string; productName: string; quantity: number; revenue: number }> => {
  const productStats = new Map<string, { name: string; quantity: number; revenue: number }>();
  
  mockOrders
    .filter(order => order.shopId === shopId && order.status === 'completed')
    .forEach(order => {
      order.items.forEach(item => {
        const existing = productStats.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          productStats.set(item.productId, {
            name: item.productName,
            quantity: item.quantity,
            revenue: item.subtotal,
          });
        }
      });
    });
  
  return Array.from(productStats.entries())
    .map(([productId, stats]) => ({
      productId,
      productName: stats.name,
      quantity: stats.quantity,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
};
