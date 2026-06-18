export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    CHANGE_PASSWORD_FIRST_LOGIN: "/auth/change-password-first-time",
    CHANGE_PASSWORD: "/auth/change-password",
    UPDATE_PASSWORD: "/auth/update-password",
    GOOGLE: "/auth/google",
    GOOGLE_CALLBACK: "/auth/google/callback",
    FACEBOOK: "/auth/facebook",
    FACEBOOK_CALLBACK: "/auth/facebook/callback",
    VERIFY_DEVICE: "/auth/verify-device",
    REFRESH_TOKEN: "/auth/refresh-token",
    EXCHANGE_TOKEN: "/auth/exchange-token",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },

  // User Profile
  PROFILE: {
    GET: "/profile/user-info",
    UPDATE_FULLNAME: "/users/me/full-name",
    UPDATE_PHONE: "/users/me/phone",
    UPDATE_AVATAR: "/users/me/avatar", // POST method (not PATCH)
    UPDATE_STORY: "/users/me/story",
    UPDATE_PASSWORD: "/profile/update-password",
    // Address endpoints (from address.controller.ts)
    GET_ALL_ADDRESSES: "/address/users/me",
    ADD_ADDRESS: "/address/users/me",
    UPDATE_ADDRESS: (addressId: number) => `/address/users/me/${addressId}`, // PUT method
    DELETE_ADDRESS: (addressId: number) => `/address/users/me/${addressId}`,
    // Payment endpoints
    UPLOAD_QR_PAYMENT: "/profile/upload-qr-payment",
    GET_VIETQR_SETTINGS: "/profile/vietqr/settings",
    UPDATE_VIETQR_SETTINGS: "/profile/vietqr/update",
    GET_TOTAL_LIKES_BY_USER: (userId: number) =>
      `/likes/totalLikesByUser/${userId}`,
  },

  // Posts
  POSTS: {
    CREATE: "/posts",
    GET_ALL: "/posts",
    GET_BY_ID: (id: number) => `/posts/${id}`,
    GET_BY_USER_ID: (userId: number) => `/posts/user/${userId}`,
    GET_BY_USER: (userId: number) => `/posts/user/${userId}`, // Alias
    GET_PAGINATED: "/posts", // ✅ Sử dụng /posts với query params ?page=1&limit=10
    FOLLOWING: "/posts/following", // ✅ Get posts from followed users
    FILTER: "/posts/filter",
    UPDATE: (id: number) => `/posts/${id}`,
    DELETE: (id: number) => `/posts/${id}`,
    // Media uploads
    UPLOAD_COVER_IMAGE: (postId: number) => `/posts/${postId}/cover-image`,
    UPLOAD_COVER: (postId: number) => `/posts/${postId}/upload-cover`, // Alias
    UPLOAD_VIDEO: (postId: number) => `/posts/${postId}/upload-video`,
    UPLOAD_VIDEOS: (postId: number) => `/posts/${postId}/videos`,
    UPLOAD_ADDITIONAL_MEDIA: (postId: number) =>
      `/posts/${postId}/additional-media`,
    UPLOAD_MEDIA: (postId: number) => `/posts/${postId}/upload-media`, // Main media upload
    UPLOAD_IMAGES: (postId: number) => `/posts/${postId}/images`,
    ADD_IMAGES: "/posts/add-images",
    UPLOAD_SAMPLE_IMAGES: (postId: number) => `/posts/${postId}/sample-images`,
    DELETE_MEDIA: (mediaId: number) => `/posts/media/${mediaId}`,
    REMOVE_IMAGE: (imageId: number) => `/posts/images/${imageId}`,
    // Likes
    LIKE: (postId: number) => `/posts/${postId}/like`,
    UNLIKE: (postId: number) => `/posts/${postId}/unlike`,
    GET_LIKES: (postId: number) => `/posts/${postId}/likes`,
    CHECK_USER_LIKED: (postId: number, userId: number) =>
      `/posts/${postId}/like/${userId}`,
  },

  // Comments
  COMMENTS: {
    CREATE: "/comments",
    REPLY: "/comments/reply",
    GET_BY_POST_ID: (postId: number) => `/comments/post/${postId}`,
    GET_BY_POST: (postId: number) => `/comments/post/${postId}`, // Alias
    GET_BY_ID: (id: number) => `/comments/${id}`,
    UPDATE: (id: number) => `/comments/${id}`,
    DELETE: (id: number) => `/comments/${id}`,
    // Likes
    LIKE: (commentId: number) => `/comments/${commentId}/like`,
    UNLIKE: (commentId: number) => `/comments/${commentId}/unlike`,
    GET_LIKES: (commentId: number) => `/comments/${commentId}/likes`,
    CHECK_USER_LIKED: (commentId: number, userId: number) =>
      `/comments/${commentId}/like/${userId}`,
    // Replies
    GET_REPLIES: (commentId: number) => `/comments/${commentId}/replies`,
  },

  // Follows
  FOLLOWS: {
    FOLLOW: "/follows",
    UNFOLLOW: (followingId: number) => `/follows/${followingId}`,
    TOGGLE: (followingId: number) => `/follows/toggle/${followingId}`,
    STATS: (userId: number) => `/follows/stats/${userId}`,
    FOLLOWERS: (userId: number) => `/follows/followers/${userId}`,
    FOLLOWING: (userId: number) => `/follows/following/${userId}`,
  },

  // Chat & Messages
  CHAT: {
    GET_CONVERSATIONS: (userId: number) => `/chat/conversations/${userId}`,
    SEND_MESSAGE: "/chat/send",
    GET_MESSAGES: (conversationId: string) =>
      `/chat/messages/${conversationId}`,
    MARK_AS_READ: "/chat/mark-as-read",
  },

  // Messages (HTTP API for WebSocket fallback)
  MESSAGES: {
    SEND: "/messages",
    UPLOAD_MEDIA: "/messages/upload-media",
    GET_CONVERSATIONS: "/messages/conversations",
    FIND_OR_CREATE_CONVERSATION: (otherUserId: number) =>
      `/messages/conversations/find-or-create/${otherUserId}`,
    FIND_OR_CREATE_SHOP_CONVERSATION: (shopId: number) =>
      `/messages/conversations/shop/${shopId}`,
    // Shop messages
    SHOP_GET_CONVERSATIONS: (shopId: number) =>
      `/messages/shop/${shopId}/conversations`,
    SHOP_GET_MESSAGES: (shopId: number, conversationId: number) =>
      `/messages/shop/${shopId}/conversations/${conversationId}/messages`,
    SHOP_SEND_MESSAGE: (shopId: number) => `/messages/shop/${shopId}`,
    SHOP_MARK_ALL_AS_READ: (shopId: number, conversationId: number) =>
      `/messages/shop/${shopId}/conversations/${conversationId}/read-all`,
  },

  // Notifications
  NOTIFICATIONS: {
    GET_ALL: "/notifications",
    GET_UNREAD_COUNT: (userId: number) =>
      `/notifications/${userId}/unread-count`,
    MARK_AS_READ: (notificationId: number) =>
      `/notifications/${notificationId}/mark-read`,
    MARK_ALL_AS_READ: "/notifications/mark-all-read",
    DELETE_ALL_READ: "/notifications/read",
  },

  // Products (Shop)
  PRODUCTS: {
    CREATE: "/products",
    GET_ALL: "/products",
    GET_BY_ID: (id: number) => `/products/${id}`,
    GET_PRODUCT_DETAIL: (id: number) => `/products/${id}`,
    GET_PRODUCT_DETAIL_MANAGE: (id: number) => `/products/${id}/manage`,
    RECORD_VIEW: (id: number | string) => `/products/${id}/view`,
    GET_BY_BRAND: (brandId: number) => `/products/brand/${brandId}`,
    SEARCH: "/products/search",
    FILTER: "/products/filter",
    UPDATE: (id: number) => `/products/${id}`,
    DELETE: (id: number) => `/products/${id}`,
    RESTORE_REQUEST: (id: number) => `/products/${id}/restore-request`,
    // Shop products
    GET_SHOP_PRODUCTS: (shopId: number) => `/shop/${shopId}/products`,
    GET_SHOP_PRODUCTS_MANAGE: (shopId: number) =>
      `/shop/${shopId}/products/manage`,
    // Variants
    CREATE_VARIANT: "/products/variants",
    UPDATE_VARIANT: (variantId: number) => `/products/variants/${variantId}`,
    DELETE_VARIANT: (variantId: number) => `/products/variants/${variantId}`,
    // Media
    ADD_MEDIA: (productId: number) => `/products/${productId}/media`,
    DELETE_MEDIA: (mediaId: number) => `/products/media/${mediaId}`,
    // Brands & Categories
    GET_ALL_BRANDS: "/products/brands",
    GET_ALL_CATEGORIES: "/products/categories",
  },

  // Brands
  BRANDS: {
    GET_ALL: "/products/brands",
    GET_BY_ID: (id: number) => `/brands/${id}`,
  },

  // Search
  SEARCH: {
    ALL: "/search",
    POSTS: "/search/posts",
    USERS: "/search/users",
    SHOPS: "/search/shops",
    HASHTAGS: "/search/hashtags",
    AUTOCOMPLETE: "/search/autocomplete",
  },

  // Users (public profile)
  USERS: {
    GET_BY_ID: (id: number) => `/users/${id}`,
  },

  // Reviews
  REVIEWS: {
    BASE: "/reviews",
    CREATE: "/reviews",
    GET_ALL: "/reviews",
    GET_BY_ID: (id: number) => `/reviews/${id}`,
    UPDATE: (id: number) => `/reviews/${id}`,
    DELETE: (id: number) => `/reviews/${id}`,
    UPLOAD_MEDIA: (reviewId: number) => `/reviews/${reviewId}/media`,
    UPLOAD_TEMP: "/reviews/upload-temp",
    RATING_SUMMARY: (productId: number) =>
      `/reviews/products/${productId}/summary`,
  },

  // Cart (user)
  // Cart (user)
  // Cart (user)
  CART: {
    GET_CART: "/cart", // Corrected base path
    ADD_ITEM: "/cart/add",
    UPDATE_ITEM: (itemId: number) => `/cart/item/${itemId}`,
    REMOVE_ITEM: (itemId: number) => `/cart/item/${itemId}`,
    CLEAR: "/cart/clear",
  },

  // Wishlist
  WISHLIST: {
    GET_ALL: "/products/wishlist",
    ADD: "/products/wishlist",
    REMOVE: (productId: number) => `/products/wishlist/${productId}`,
  },

  // Makeup / Try-on / AI studio
  MAKEUP: {
    CREATE_SESSION: "/makeup/session",
    CREATE_ITEM: "/makeup/item",
    APPLY: "/makeup/apply",
    RECORD_TRYON: "/makeup/tryon/record",
    VR_REVIEW_STATUS: "/makeup/vr-review/status",
    VR_REVIEW_SUBMIT: "/makeup/vr-review",
    VR_REVIEW_SNOOZE: "/makeup/vr-review/snooze",
    VR_REVIEW_ADMIN_STATS: "/makeup/vr-review/admin/stats",
  },

  // Chatbot AI (AI Beauty Assistant)
  CHATBOT: {
    SEND: "/chatbot/send",
    SESSIONS: "/chatbot/sessions",
    MESSAGES: (sessionId: number) => `/chatbot/sessions/${sessionId}/messages`,
  },

  SHOP: {
    CREATE_SHOP: "/users/me/shop",
    GET_MY_SHOP: "/users/me/shop",
    UPDATE_LOGO: (shopId: number) => `/users/shops/${shopId}/logo`,
    UPDATE_BANNER: (shopId: number) => `/users/shops/${shopId}/banner`,
    UPDATE_PHONE: (shopId: number) => `/users/shops/${shopId}/phone`,
    UPDATE_EMAIL: (shopId: number) => `/users/shops/${shopId}/email`,
    UPDATE_DESCRIPTION: (shopId: number) =>
      `/users/shops/${shopId}/description`,
    // Shop addresses
    GET_ADDRESSES: (shopId: number) => `/address/shops/${shopId}`,
    ADD_ADDRESS: (shopId: number) => `/address/shops/${shopId}`,
    UPDATE_ADDRESS: (shopId: number, addressId: number) =>
      `/address/shops/${shopId}/${addressId}`,
    DELETE_ADDRESS: (shopId: number, addressId: number) =>
      `/address/shops/${shopId}/${addressId}`,
    // Staff Management
    GET_STAFF_LIST: (shopId: number) => `/shop/${shopId}/staffs`,
    ADD_STAFF: (shopId: number) => `/shop/${shopId}/staff`,
    DELETE_STAFF: "/shop/staff",
    UPDATE_STAFF_PERMISSIONS: (shopId: number, staffEmail: string) =>
      `/shop/${shopId}/staff/${staffEmail}/permissions`,
    DELETE_STAFF_PERMISSIONS: (shopId: number, staffEmail: string) =>
      `/shop/${shopId}/staff/${staffEmail}/permissions`,
    GET_STAFF_PERMISSIONS: (shopId: number, staffEmail: string) =>
      `/shop/${shopId}/staff/${staffEmail}/permissions`,
    GET_USER_PERMISSIONS: (userId?: number | string) =>
      `/users/${userId || "me"}/permissions`,
    DETAILS: (shopId: number | string) => `/shop/${shopId}/profile`,
    FOLLOW: (shopId: number) => `/shop/${shopId}/follow`,
    UNFOLLOW: (shopId: number) => `/shop/${shopId}/follow`,
    CHECK_FOLLOW: (shopId: number) => `/shop/${shopId}/follow/status`,
    DETAILS_ADMIN: (shopId: number) => `/shop/${shopId}/details`,
    REGISTER_GHN: (shopId: number) => `/shop/${shopId}/ghn-register`,
  },
  // Orders (Seller)
  ORDERS: {
    CREATE: "/order/create",
    CREATE_FROM_PRODUCT: "/order/create-from-product",
    CALCULATE_SHIPPING: "/order/calculate-cart-shipping",
    GET_MY_ORDERS: "/order/my-orders",
    GET_BY_ID: (id: number) => `/order/${id}`,
    CANCEL: (id: number) => `/order/${id}/cancel`,
    CONFIRM_RECEIVED: (id: number) => `/order/${id}/confirm-received`,
    TRACK_GHN: (id: number) => `/order/${id}/ghn/track`,
    GET_ORDERS_BY_SHOP: "/order/seller/orders",
    UPDATE_ORDER_STATUS: (orderId: number) =>
      `/order/seller/orders/${orderId}/status`,
    GET_ORDER_DETAILS: (orderId: number) => `/order/seller/orders/${orderId}`,
    // Return requests (buyer)
    CREATE_RETURN_REQUEST: "/order/return-request",
    GET_MY_RETURN_REQUESTS: "/order/return-requests/my",
    // Admin
    ADMIN_GET_ORDERS: "/order/admin/orders",
    ADMIN_GET_RETURN_REQUESTS: "/order/admin/return-requests",
    ADMIN_UPDATE_RETURN_REQUEST: (id: number) => `/order/admin/return-requests/${id}`,
  },

  // Coupons
  COUPONS: {
    VALIDATE: "/coupons/validate",
    MY: "/coupons/my",
    GET_ALL: "/coupons",
    CREATE: "/coupons",
    UPDATE: (id: number) => `/coupons/${id}`,
    DELETE: (id: number) => `/coupons/${id}`,
  },

  // Seller Wallet
  WALLET: {
    GET_MY_WALLET: "/wallet/me",
    GET_TRANSACTIONS: "/wallet/transactions",
    REQUEST_PAYOUT: "/wallet/payout-request",
    GET_MY_PAYOUTS: "/wallet/payout-requests",
    GET_BANK_ACCOUNTS: "/wallet/bank-accounts",
    ADD_BANK_ACCOUNT: "/wallet/bank-accounts",
    VERIFY_BANK_ACCOUNT: "/wallet/verify-bank-account",
    DELETE_BANK_ACCOUNT: (id: number) => `/wallet/bank-accounts/${id}`,
    SET_DEFAULT_BANK_ACCOUNT: (id: number) => `/wallet/bank-accounts/${id}/default`,
    ADMIN_LIST_PAYOUTS: "/admin/payout-requests",
    ADMIN_PROCESS_PAYOUT: (id: number) => `/admin/payout-requests/${id}`,
    ADMIN_PLATFORM_REVENUE: "/admin/platform-revenue",
  },

  // User Wallet (refund credit)
  USER_WALLET: {
    GET: "/user-wallet",
    GET_TRANSACTIONS: "/user-wallet/transactions",
    TOPUP: "/user-wallet/topup",
  },
  // ================= Analytics (SHOP) =================
  ANALYTICS: {
    OVERVIEW: (shopId: number) => `/analytics/shop/${shopId}/overview`,

    SALES_TRENDS: (shopId: number) => `/analytics/shop/${shopId}/sales-trends`,

    TOP_PRODUCTS: (shopId: number) => `/analytics/shop/${shopId}/top-products`,

    ENGAGEMENT: (shopId: number) => `/analytics/shop/${shopId}/engagement`,

    REVENUE_BREAKDOWN: (shopId: number) =>
      `/analytics/shop/${shopId}/revenue-breakdown`,

    STOCK_ALERTS: (shopId: number) => `/analytics/shop/${shopId}/stock-alerts`,

    NOTIFICATIONS: (shopId: number) =>
      `/analytics/shop/${shopId}/notifications`,

    ORDER_STATS: (shopId: number) => `/analytics/shop/${shopId}/orders/stats`,

    CUSTOMER_STATS: (shopId: number) =>
      `/analytics/shop/${shopId}/customers/stats`,

    CONVERSION_FUNNEL: (shopId: number) =>
      `/analytics/shop/${shopId}/conversion-funnel`,

    PRODUCT_STATS: (shopId: number) =>
      `/analytics/shop/${shopId}/products/stats`,
  },

  // Stories (story trên Explore) - map tới StoryController (/story)
  STORIES: {
    GET_ALL: "/story",
    GET_BY_ID: (id: number) => `/story/${id}`,
    UPDATE: (id: number) => `/story/${id}`,
    MARK_VIEWED: (id: number) => `/story/${id}/view`,
    CREATE: "/story",
    REACT: (id: number) => `/story/${id}/reaction`,
    UNREACT: (id: number) => `/story/${id}/reaction`,
    REPLY: (id: number) => `/story/${id}/reply`,
    DELETE: (id: number) => `/story/${id}`,
    GET_VIEWERS: (id: number) => `/story/${id}/viewers`,
    PRESIGNED_URL: "/story/presigned-url",
    COMPLETE_UPLOAD: "/story/complete-upload",
  },

  // Address & GHN
  ADDRESS: {
    PROVINCES: "/address/provinces",
    DISTRICTS: "/address/districts",
    WARDS: "/address/wards",
  },
} as const;
