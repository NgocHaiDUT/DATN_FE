export const ROUTES = {
  // Auth
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    FIRST_CHANGER_PASSWORD: "/first-change-password",
    CALLBACK: "/callback",
  },

  // User profile
  PROFILE: {
    VIEW: "/profile", // xem thông tin bản thân
    PUBLIC: (id: number | string) => `/profile/${id}`,
    EDIT: "/profile/edit", // edit thông tin
    CHANGE_PASSWORD: "/profile/password",
    ADDRESSES: "/profile/addresses",
    PAYMENT_QR: "/profile/payment-qr",
  },

  // Posts / social
  POSTS: {
    LIST: "/posts", // list tất cả bài viết
    DETAIL: (id: number | string) => `/post/${id}`,
    CREATE: "/posts/create",
    EDIT: (id: number | string) => `/post/${id}/edit`,
  },

  // Comments
  COMMENTS: {
    REPLIES: (postId: number) => `/posts/${postId}/comments`,
  },

  // Shops / Products
  SHOP: {
    PRODUCTS: "/shop", // list sản phẩm (Shop marketplace)
    PRODUCT_DETAIL: (id: number | string) => `/product/${id}`, // chi tiết sản phẩm
    SHOP_DETAIL: (slug: string | number) => `/shop/${slug}`, // public shop profile
    BRANDS: "/brands",
    SEARCH: "/shop/search",
  },

  SEARCH: "/search",

  // Cart & Checkout
  CART: "/cart",
  CHECKOUT: "/checkout",

  // Orders
  ORDERS: "/orders",
  ORDER_DETAIL: (id: number) => `/orders/${id}`,

  // Notifications
  NOTIFICATIONS: "/notifications",

  // Chat
  CHAT: "/chat",
  CONVERSATION: (conversationId: string) => `/chat/${conversationId}`,

  // Users (admin)
  USERS: "/admin/users",
  USER_DETAIL: (id: number) => `/admin/users/${id}`,
  CREATE_USER: "/admin/users/create",

  // Shops (admin)
  SHOPS: "/admin/shops",

  // Dashboard / Home
  HOME: "/",
} as const;
