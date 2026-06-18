# CHI TIẾT CÁC HÀM (API ENDPOINTS) TRONG CÁC MODULE CHỨC NĂNG BACKEND PBL6

Tài liệu này liệt kê chi tiết chức năng cụ thể dựa trên danh sách các API (HTTP Endpoints) được định nghĩa bên trong các Controller của từng Module trong `src/`.

---

## 1. Auth Module (`/auth`)
*Phụ trách các nghiệp vụ liên quan đến xác thực, bảo mật tài khoản và phân quyền, bao gồm đăng nhập thường và OAuth.*

*   **Đăng ký & Đăng nhập cơ bản:**
    *   `POST /auth/register` - Đăng ký tài khoản người dùng mới.
    *   `POST /auth/login` - Đăng nhập tài khoản bằng email/mật khẩu.
    *   `POST /auth/admin/login` - Đăng nhập dành riêng cho quản trị viên (Admin).
*   **Bảo mật & Quên mật khẩu:**
    *   `POST /auth/forgot-password` - Gửi yêu cầu đặt lại mật khẩu (Gửi email OTP/Link).
    *   `POST /auth/change-password` - Đổi mật khẩu.
    *   `POST /auth/change-password-first-time` - Yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.
    *   `POST /auth/verify-device` - Xác thực thiết bị đăng nhập mới (Device OTP).
*   **Quản lý Token (Phiên đăng nhập):**
    *   `POST /auth/refresh-token` - Cấp lại Access Token mới dựa trên Refresh Token hợp lệ.
    *   `POST /auth/exchange-token` - Đổi mã tạm lấy token chính thức.
    *   `POST /auth/logout` - Đăng xuất, hủy bỏ phiên (Revoke token).
*   **OAuth (Đăng nhập mxh ngoài):**
    *   `GET /auth/google` & `GET /auth/google/callback` - Quy trình đăng nhập thông qua Google.
    *   `GET /auth/facebook` & `GET /auth/facebook/callback` - Quy trình đăng nhập thông qua Facebook.

## 2. Users Module (`/admin/users`)
*Dành cho quản trị viên (Admin) quản lý tập trung người dùng và phân quyền hệ thống (Roles & Permissions).*

*   **Quản lý User (CRUD cơ bản):**
    *   `GET /admin/users` - Lấy danh sách toàn bộ người dùng.
    *   `GET /admin/users/page-info` - Lấy thông tin phân trang người dùng.
    *   `POST /admin/users` - Admin tạo mới một người dùng.
    *   `GET /admin/users/:id` - Xem chi tiết tài khoản.
    *   `PATCH /admin/users/:id` - Cập nhật thông tin tài khoản.
    *   `DELETE /admin/users/:id` - Xóa/Khóa tài khoản (Soft Delete).
    *   `PATCH /admin/users/:id/avatar` - Cập nhật ảnh đại diện người dùng.
*   **Quản lý Quyền (RBAC):**
    *   `PATCH /admin/users/:id/role` - Gán Role (vai trò) cho người dùng.
    *   `GET /admin/users/:id/permissions` - Xem danh sách quyền riêng biệt của 1 user.
    *   `PATCH /admin/users/:id/permissions` - Cấp quyền/tước quyền cụ thể cho user đó.
    *   `GET /admin/users/roles/all` & `POST /admin/users/roles` - Lấy danh sách Roles và Tạo Role mới.
    *   `PATCH /admin/users/roles/:roleId/permissions` - Phân quyền trực tiếp cho một nhóm Role (Ví dụ: nhóm "Staff").
    *   `GET /admin/users/permissions/all` & `POST /admin/users/permissions` - Lấy/Tạo danh sách các mã quyền (Permission ID).

## 3. Profile & Address (Alias `/users` & `/address`)
*Cung cấp API cho người dùng hiện tại (Current User) tự cập nhật thông tin cá nhân và quản lý sổ địa chỉ giao hàng.*

*   **Profile (`/users/me`):**
    *   `GET /users/me`, `/users/user-info` - Lấy thông tin tài khoản cá nhân của người đang đăng nhập.
    *   `PATCH /users/me/full-name` - Sửa họ tên.
    *   `PATCH /users/me/phone` - Sửa số điện thoại.
    *   `PATCH /users/me/story` - Cập nhật trạng thái/tiểu sử (Story Bio).
    *   `POST /users/me/avatar` - Tải lên ảnh đại diện mới.
*   **Sổ địa chỉ (`/address` & `/users/me/addresses`):**
    *   `GET /provinces`, `/districts`, `/wards` - Lấy Master Data về ranh giới hành chính của Việt Nam.
    *   `GET, POST, PUT, DELETE /users/me/addresses` - Chức năng Thêm/Sửa/Xóa địa chỉ cá nhân người dùng để mua hàng.
    *   `GET, POST, PUT, DELETE /shops/:shopId/addresses` - Quản lý nhanh địa chỉ lấy hàng của Shop.

## 4. Product Module (`/products`)
*Quản lý danh mục hàng hóa, kiểm duyệt và thuộc tính sản phẩm.*

*   **User/Public (Trải nghiệm mua sắm):**
    *   `GET /products` - Lấy danh sách toàn bộ sản phẩm công khai (Đã duyệt).
    *   `GET /products/search`, `/products/filter` - Các hàm tìm kiếm nâng cao (Lọc theo giá, khoảng giá, rating...).
    *   `GET /products/slug/:slug` - Truy xuất thông tin chi tiết của 1 sản phẩm theo chuỗi định danh (Slug).
    *   `GET /products/:productId` - Lấy thông tin theo Product ID.
    *   `GET /products/shops/:shopId` - Lấy toàn bộ sản phẩm của một của hàng.
*   **Wishlist & Cart (Giao điểm tại API `/products`):**
    *   `GET, POST, DELETE /products/wishlist` - Thao tác với danh sách sản phẩm Yêu thích (Wishlist).
*   **Brands & Categories (Quản lý Danh mục - Thường nằm ở quyền Admin/Staff):**
    *   `GET, POST, PATCH, DELETE /products/brands/:brandId` - Quản trị Thương hiệu (Brand).
    *   `GET, POST, PATCH, DELETE /products/categories/:categoryId` - Quản trị Danh mục Sản phẩm.
*   **Quản lý của Shop (Seller):**
    *   `POST /products` - Đăng sản phẩm mới (chờ duyệt).
    *   `GET /products/:productId/manage` - Xem chi tiết thông số riêng của shop sở hữu sản phẩm đó.
    *   `POST /products/variants`, `DELETE /products/variants/:variantId` - Quản lý phân loại sản phẩm (VD: Size, Màu sắc - Variants).
    *   `POST /products/:productId/media` - Đăng ảnh/video giới thiệu sản phẩm.
*   **Quản lý của Admin (Kiểm duyệt):**
    *   `GET /products/all` - Xem toàn bộ (kể cả sản phẩm chưa được duyệt hoặc bị gỡ).
    *   `GET /products/pending/:productId` - Thông tin sản phẩm đang chờ duyệt.
    *   `PATCH /products/:productId/approve` - Admin phê duyệt/từ chối hiển thị sản phẩm.
    *   `DELETE /products/:productId` - Chức năng xóa sản phẩm.

## 5. Shop Module (`/shop`)
*Module quản lý Cửa hàng, dành cho cả Người dùng tìm kiếm shop và Người bán quản lý Cửa hàng của họ.*

*   **Thông tin Cửa hàng:**
    *   `GET /shop/list` - Lấy danh sách các cửa hàng có trên hệ thống (Phân trang/Tìm kiếm).
    *   `GET /shop/public/:shopid`, `/shop/:shopId/profile` - Xem hồ sơ công khai của một cửa hàng.
    *   `PATCH /shop/:shopId/logo`, `/banner`, `/phone`, `/email`, `/description` - Cập nhật thông tin shop hiện tại của Seller.
*   **Quản trị Staff Shop (Phân quyền nhân viên cho shop):**
    *   `GET, POST, DELETE /shop/:shopId/staffs` - Mời/Xóa nhân viên quản lý ra khỏi cửa hàng.
    *   `GET, PUT, DELETE /shop/:shopId/staff/:staffEmail/permissions` - Thiết lập quyền giới hạn (Xem đơn, Cập nhật sản phẩm...) cho nhân viên trong shop nội bộ.
*   **Tích hợp Vận Chuyển GHN:**
    *   `POST /shop/:shopId/ghn-register` - Cấu hình tài khoản Giao Hàng Nhanh vào shop để thực hiện tự động tính phí ship và gọi vận đơn.
*   **Hành động Follow Shop (Tích hợp):**
    *   `POST /shop/:shopid/follow`, `DELETE /shop/:shopid/follow` - Theo dõi/Hủy theo dõi cửa hàng đó.
*   **Quản lý bởi Admin Server:**
    *   `PUT /shop/:shopid/ban`, `/shop/:shopid/unban` - Khóa vĩnh viễn quyền đăng bán của một Shop vi phạm.

## 6. Cart & Order Module (`/cart`, `/order`, `/payment`)
*Module điều hướng dòng chảy thanh toán Checkout (Từ Thêm Mua Hàng -> Tạo Đơn -> Theo dõi Giao Hàng).*

*   **Cart (Giỏ Hàng):**
    *   `GET /cart` - Lấy toàn bộ sản phẩm đang có trong giỏ hàng.
    *   `POST /cart/add` - Thêm sản phẩm.
    *   `PATCH /cart/item/:id` - Tăng/giảm số lượng.
    *   `DELETE /cart/item/:id`, `DELETE /cart/clear` - Xóa 1 mã hoặc làm rạch rỏ hàng.
*   **Order (Đặt hàng & Theo dõi vận chuyển):**
    *   `POST /order/calculate-cart-shipping` - Tính phí ship tổng cho toàn bộ giỏ.
    *   `POST /order/create` - Lên đơn hàng mới từ dữ kiện Giỏ hàng.
    *   `POST /order/create-from-product` - Mua ngay lập tức 1 sản phẩm không qua giỏ.
    *   `GET /order/my-orders` - Xem danh sách đơn mua của tôi.
    *   `GET /order/:id` - Xem chi tiết quá trình của 1 đơn hàng (Giá trị, Phương thức, Trạng thái).
    *   `POST /order/:id/cancel` - Khách hủy đơn mua.
*   **Quản lý Đơn cho Người bán (Seller Role):**
    *   `GET /order/seller/orders` - Danh sách toàn bộ đơn hàng khách đã mua của shop.
    *   `POST /order/seller/orders/:id/status` - Đổ trạng thái đơn (Xác nhận, Đã đóng gói, Giao thành công...).
*   **GHN Delivery Booking (Kết nối tự động):**
    *   `POST /order/shipping/services` - Tính toán hình thức giao hàng khả dụng (Hỏa tốc, Chuyển phát chuẩn).
    *   `POST /order/shipping/preview`, `/order/shipping/leadtime` - Ước lượng thời gian và chi tiết phí giao nhận.
    *   `GET /order/:id/ghn/track` - Cập nhật tracking định vị vị trí cục hàng đang giao đi qua hệ thống vận chuyển GHN.
    *   `POST /order/:id/ghn/cancel`, `POST /order/:id/ghn/return` - Hủy vận đơn đối tác thứ 3, hoàn hàng.
*   **Payment Gateway (VNPay):**
    *   `POST /payment/create-vnpay-url` - Sinh link thanh toán.
    *   `GET /payment/vnpay-return`, `/payment/vnpay-ipn` - URL Catch event khi VNPay trừ tiền thành công, gạch nợ trạng thái hóa đơn (`payment_status: paid`).
*   **Admin Mode:**
    *   `GET /order/admin/orders` - Lên danh sách toàn server.
    *   `POST /order/admin/orders/:id/refund` - Admin ép hoàn tiền đơn hàng.

## 7. Makeup & AI Module (`/makeup`)
*Các chức năng phân tích sắc đẹp, công nghệ thử đồ AR (Try-on).*

*   `GET /makeup/recommend` - Gợi ý sản phẩm dựa trên tuýp da đã phân tích trước đó của người dùng.
*   `GET /makeup/categories` - Lọc lấy các dòng mỹ phẩm (Sơn môi, Cọ nền...).
*   `PATCH /makeup/variant/:variantId/shade` - Update cấu hình gam màu (Hex color, mã màu phân tích da) vào một loại phân loại sản phẩm.
*   *(Note: Logic xử lý tính toán AI thông qua các service nội bộ được điều phối thêm qua Socket hoặc Controller Chatbot / Makeup Service ngầm)*

## 8. Nền tảng Mạng Xã Hội (Social: Posts, Comments, Likes, Follows, Story)
*Hỗ trợ người dùng đăng bài, tương tác tự do (Tương tự Instagram/Fb).*

*   **Posts (`/posts`): Bài Đăng Feed**
    *   `GET, POST /posts` - Lấy danh sách timeline chung (Public Feed) / Tạo bài việt tĩnh mới.
    *   `GET /posts/user/:userId` - Xem tất cả bài viết của 1 ai đó.
    *   `GET /posts/following` - Only lấy bài của những người mình có thẻ Follow.
    *   `PATCH /posts/:id`, `DELETE /posts/:id` - Chỉnh sửa / Xóa bài.
    *   `POST /posts/:id/upload-media`, `/upload-cover`, `/upload-video` - Khâu xử lý ảnh/video đính kèm post thông qua luồng Upload tự tạo S3 / Signed URL.
    *   `POST /posts/:id/save`, `DELETE /posts/:id/save` - Lưu giữ liệu vào danh sách đọc sau (Saved Posts).
    *   `PATCH /posts/:id/moderate` - Admin gắn cờ/chặn hiển thị với bài viết vi phạm tiêu chuẩn cộng đồng.
*   **Story (`/story`): Tin Ngắn Biến Mất 24h**
    *   `GET, POST /story` - Tạo và đọc danh sách Story bản thân.
    *   `GET, POST /story/:id/viewers` - Chức năng đếm và xem ai đã lướt xem Story của người dùng.
    *   `POST, DELETE /story/:id/reaction` - Gửi reaction (tym/icon cười) thẳng vào strory người khác.
*   **Tương Tác (`/likes`, `/comments`, `/reviews`)**
    *   `POST /comments`, `GET /comments/:id/replies` - Tính năng đăng nhận xét văn bản, hỗ trợ Rep Cấp độ 2.
    *   `POST /likes/toggle/:targetType/:targetId` - Chức năng Toggle (Bật thích/ Hủy thích). Support TargetType là Like cho Bình Luận, Bài Đăng, hay Story.
    *   `GET, POST, PUT, DELETE /reviews` - Hệ thống bình chọn đánh giá trên **Sản phẩm (E-Commerce) bằng Rating Cấu trúc số (Sao).**
*   **Mạng Kết Nối (`/follows`)**
    *   `POST /follows/toggle/:followingId` - Follow / Bỏ Follow.
    *   `GET /follows/followers/:userId`, `/follows/following/:userId` - Thống kê ai đang theo dõi mình và mình đang theo dõi ai.

## 9. Messages & Chat System (`/messages`, `/chat`)
*Cơ chế giao tiếp nội bộ giữa Khách Hàng - Người dùng, Người dùng - Khách hàng hoặc Người Dùng - Khách Hàng.*

*   **Quản Lý Hộp Thoại (`/messages/conversations`)**
    *   `GET, POST /messages/conversations` - Khởi tạo phòng hội thoại chat mới.
    *   `POST /messages/conversations/find-or-create/:otherUserId` - Nhắn tin với 1 đối tượng User duy nhất (1-to-1).
    *   `GET, POST /messages/shop/:shopId` - Tính năng nhảy vọt nhắn tin với Box CSKH của 1 Cửa Hàng.
*   **Quản Lý Chat Dữ Liệu (`/messages` & `/chat`)**
    *   `GET /messages/conversations/:conversationId/messages` - Tải/Lấy xuống lịch sử đoạn chat của phong đó.
    *   `PATCH /messages/:messageId/read` - Gắn dấu tích (Đã đọc tin).
    *   `POST /chat/upload` , `/messages/upload-media` - Đính kèm file qua khung chat text.

## 10. Analytics & Search (`/analytics`, `/search`)
*Hỗ trợ tra cứu nhanh toàn máy chủ - và phân tích Data dành cho Server/Shop Manager.*

*   **Search Engine (`/search`)**
    *   `GET /search/posts`, `/search/users`, `/search/shops`, `/search/hashtags` - Dễ dàng tách bạch tra tìm theo thực thế độc lập.
    *   `GET /search/autocomplete` - Đổ dữ liệu gợi ý đánh máy ngầm trên thanh Tìm kiếm chung (Khách đang nhập dở text).
*   **Thống Kê Shop (`/analytics/shop/:shopId/*`)**
    *   Cung cấp các API: `/overview`, `/sales-trends` (Biểu đồ doanh thu), `/top-products` (SP bán chạy), `/revenue-breakdown`, `/stock-alerts` (Cảnh báo tồn kho), `/conversion-funnel` (Phễu tính lệ chuyển đổi ng dùng).
*   **Thống Kê Toàn Server (`/analytics/admin/*`)**
    *   `/stats`, `/revenue-trend`, `/product-categories` (Phân phối dữ kiện mua sẵm vĩ mô để Admin quản trị website).

*(Tài liệu này tổng hợp toàn bộ các Entry Point có hỗ trợ Decorators `@Get`, `@Post`, `@Patch`, `@Put`, `@Delete` cho toàn hệ thống dựa trên Source Code `app.controller` của PBL6)*