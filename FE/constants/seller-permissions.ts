// Seller permissions only - MUST MATCH backend Permission.enum.ts
export const SELLER_PERMISSIONS = {
  // Product management
  MANAGE_PRODUCT: 'manage_product',
  
  // Order management
  MANAGE_ORDER: 'manage_order',
  
  // Dashboard/Analytics
  VIEW_DASHBOARD: 'view_dashboard',
  
  // Shop profile
  EDIT_PROFILE_SHOP: 'edit_profile_shop',
  
  // Communication
  CHAT_WITH_CUSTOMER: 'chat_with_customer',
  
  // Try-on feature
  TRY_ON_TESTER: 'try_on_tester',
  
  // Staff management (owner only)
  MANAGE_SHOP_STAFF: 'manage_shop_staff',
  
  // Shop settings
  MANAGE_SHOP_SETTING: 'manage_shop_setting',
  
  // Address management
  MANAGE_SHOP_ADDRESS: 'manage_shop_address',
  
  // Tutorial/Guide access
  VIEW_SHOP_TUTORIAL: 'view_shop_tutorial',
} as const;

export const SELLER_PERMISSION_DETAILS = {
  [SELLER_PERMISSIONS.MANAGE_PRODUCT]: {
    name: 'Quản lý sản phẩm',
    description: 'Tạo, chỉnh sửa, xóa sản phẩm',
    icon: 'Package',
    category: 'Quản lý sản phẩm'
  },
  [SELLER_PERMISSIONS.MANAGE_ORDER]: {
    name: 'Quản lý đơn hàng',
    description: 'Xem và xử lý đơn hàng',
    icon: 'ShoppingCart',
    category: 'Quản lý đơn hàng'
  },
  [SELLER_PERMISSIONS.VIEW_DASHBOARD]: {
    name: 'Xem Dashboard',
    description: 'Xem báo cáo và thống kê shop',
    icon: 'BarChart',
    category: 'Thống kê & Báo cáo'
  },
  [SELLER_PERMISSIONS.EDIT_PROFILE_SHOP]: {
    name: 'Chỉnh sửa thông tin Shop',
    description: 'Cập nhật logo, banner, mô tả shop',
    icon: 'Settings',
    category: 'Cài đặt Shop'
  },
  [SELLER_PERMISSIONS.CHAT_WITH_CUSTOMER]: {
    name: 'Chat với khách hàng',
    description: 'Nhắn tin và hỗ trợ khách hàng',
    icon: 'MessageSquare',
    category: 'Giao tiếp'
  },
  [SELLER_PERMISSIONS.TRY_ON_TESTER]: {
    name: 'Thử đồ ảo',
    description: 'Sử dụng tính năng thử đồ ảo',
    icon: 'Camera',
    category: 'Tính năng đặc biệt'
  },
  [SELLER_PERMISSIONS.MANAGE_SHOP_STAFF]: {
    name: 'Quản lý nhân viên',
    description: 'Thêm, xóa, phân quyền nhân viên',
    icon: 'Users',
    category: 'Quản lý nhân viên'
  },
  [SELLER_PERMISSIONS.MANAGE_SHOP_SETTING]: {
    name: 'Quản lý cài đặt',
    description: 'Cấu hình các thiết lập shop',
    icon: 'Sliders',
    category: 'Cài đặt Shop'
  },
  [SELLER_PERMISSIONS.MANAGE_SHOP_ADDRESS]: {
    name: 'Quản lý địa chỉ',
    description: 'Thêm, sửa, xóa địa chỉ lấy hàng của shop',
    icon: 'MapPin',
    category: 'Cài đặt Shop'
  },
  [SELLER_PERMISSIONS.VIEW_SHOP_TUTORIAL]: {
    name: 'Xem hướng dẫn',
    description: 'Truy cập các tutorial và hướng dẫn của shop',
    icon: 'BookOpen',
    category: 'Hỗ trợ'
  },
} as const;

export type SellerPermissionType = typeof SELLER_PERMISSIONS[keyof typeof SELLER_PERMISSIONS];
