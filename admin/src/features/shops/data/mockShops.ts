import type { Shop } from '../domain/entities/Shop';

/**
 * Mock shops data using real seller IDs from mockUsers.
 * Seller IDs: '2' (Trần Thị Bảo), '6' (Đặng Thị Phương), '9' (Đỗ Văn Inh), 
 * '12' (Dương Thị Mai), '16' (Vũ Thị Quỳnh), '19' (Tô Văn Uy)
 * 
 * Staff IDs from mockUsers (regular users):
 * '1' (Nguyễn Văn An), '3' (Lê Văn Cường), '4' (Phạm Thị Dung),
 * '7' (Võ Văn Giang), '10' (Ngô Thị Kim), '11' (Đinh Văn Long),
 * '13' (Lý Văn Nam), '14' (Hồ Thị Oanh), '17' (Mai Văn Sơn), '20' (La Thị Vân)
 */
export const mockShops: Shop[] = [
  {
    id: 'shop-1',
    name: "Makeup Haven",
    sellerId: '2', // Trần Thị Bảo
    description: 'Premium cosmetics and skincare products',
    isActive: true,
    staffIds: ['1', '4', '10'], // Nguyễn Văn An, Phạm Thị Dung, Ngô Thị Kim
    productIds: ['prod-1', 'prod-2', 'prod-3'], // MAC Lipstick, Estée Lauder Foundation, La Roche-Posay Sunscreen
  },
  {
    id: 'shop-2',
    name: "Glamour Hub",
    sellerId: '6', // Đặng Thị Phương
    description: 'Trend-forward makeup and beauty tools',
    isActive: true,
    staffIds: ['7', '13'], // Võ Văn Giang, Lý Văn Nam
    productIds: ['prod-4', 'prod-5'], // Urban Decay Palette, Benefit Mascara
  },
  {
    id: 'shop-3',
    name: 'Beauty Box',
    sellerId: '9', // Đỗ Văn Inh
    description: 'Curated monthly beauty subscription boxes',
    isActive: false,
    staffIds: [], // No staff
    productIds: [], // No products
  },
  {
    id: 'shop-4',
    name: 'Skin Glow Studio',
    sellerId: '12', // Dương Thị Mai
    description: 'Professional skincare and treatment center',
    isActive: true,
    staffIds: ['1', '3', '4', '14'], // Nguyễn Văn An, Lê Văn Cường, Phạm Thị Dung, Hồ Thị Oanh
    productIds: ['prod-6', 'prod-7', 'prod-8', 'prod-9'], // CeraVe, The Ordinary, Neutrogena, Paula's Choice
  },
  {
    id: 'shop-5',
    name: 'Luxe Beauty Boutique',
    sellerId: '16', // Vũ Thị Quỳnh
    description: 'High-end luxury cosmetics and fragrances',
    isActive: true,
    staffIds: ['10', '20'], // Ngô Thị Kim, La Thị Vân
    productIds: ['prod-10', 'prod-11', 'prod-12'], // Chanel Lipstick, Dior Foundation, Tom Ford Perfume
  },
  {
    id: 'shop-6',
    name: 'Natural Beauty Co',
    sellerId: '19', // Tô Văn Uy
    description: 'Organic and eco-friendly beauty products',
    isActive: false,
    staffIds: ['17'], // Mai Văn Sơn
    productIds: ['prod-13', 'prod-14'], // Herbivore Moisturizer, RMS Beauty Highlighter
  },
  {
    id: 'shop-7',
    name: 'K-Beauty Paradise',
    sellerId: '2', // Trần Thị Bảo (có thể có nhiều shop)
    description: 'Korean skincare and makeup specialists',
    isActive: true,
    staffIds: ['3', '7', '11'], // Lê Văn Cường, Võ Văn Giang, Đinh Văn Long
    productIds: ['prod-15', 'prod-16', 'prod-17', 'prod-18'], // COSRX, Laneige, Etude House, Innisfree
  },
  {
    id: 'shop-8',
    name: 'Nail & Beauty Bar',
    sellerId: '6', // Đặng Thị Phương (có thể có nhiều shop)
    description: 'Full-service nail salon and beauty bar',
    isActive: true,
    staffIds: ['13', '20'], // Lý Văn Nam, La Thị Vân
    productIds: ['prod-19', 'prod-20', 'prod-21'], // OPI, Essie, CND
  },
];
