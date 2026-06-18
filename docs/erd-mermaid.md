# ERD Mermaid - Beauty E-commerce System

File này chia ERD thành nhiều sơ đồ nhỏ để dễ nhìn, dễ export ảnh và dễ đưa vào báo cáo.

Cách xuất ảnh:

1. Mở https://mermaid.live
2. Copy từng khối `mermaid`
3. Dán vào Mermaid Live Editor
4. Export PNG/SVG để đưa vào báo cáo

## 1. ERD Tổng Quan Hệ Thống

```mermaid
erDiagram
    users ||--o{ shops : owns
    users ||--o{ carts : has
    users ||--o{ orders : places
    users ||--o{ reviews : writes
    users ||--o{ wishlists : saves
    users ||--o{ notifications : receives
    users ||--o{ conversations : joins

    shops ||--o{ products : sells
    shops ||--o{ orders : receives
    shops ||--o{ shop_staffs : has
    shops ||--o{ shop_addresses : has
    shops ||--o{ seller_wallets : owns

    products ||--o{ product_variants : has
    products ||--o{ product_media : has
    products ||--o{ reviews : receives
    products ||--o{ order_items : included_in
    products ||--o{ cart_items : added_to

    carts ||--o{ cart_items : contains
    orders ||--o{ order_items : contains
    orders ||--o{ payments : paid_by
    orders ||--o{ shipments : shipped_by
    shipments ||--o{ shipment_logs : tracks

    users {
        int id PK
        string email
        string full_name
        string phone
        int role_id FK
    }

    shops {
        int id PK
        int owner_id FK
        string name
        string slug
        boolean is_verified
    }

    products {
        int id PK
        int shop_id FK
        int brand_id FK
        string name
        string slug
        decimal avg_rating
    }

    carts {
        int id PK
        int user_id FK
    }

    orders {
        int id PK
        int user_id FK
        int shop_id FK
        string status
        string payment_status
        decimal total_amount
    }

    payments {
        int id PK
        int order_id FK
        string provider
        decimal amount
        string status
    }

    shipments {
        int id PK
        int order_id FK
        string carrier
        string tracking_number
        string status
    }
```

## 2. ERD Người Dùng, Xác Thực Và Phân Quyền

```mermaid
erDiagram
    role ||--o{ users : assigned_to
    role ||--o{ rolepermission : has
    permission ||--o{ rolepermission : belongs_to

    users ||--o{ userpermission : has_custom
    permission ||--o{ userpermission : grants

    users ||--o{ auth_identities : logs_in_with
    users ||--o{ refresh_tokens : owns
    users ||--o{ device_otps : verifies
    users ||--o{ oauth_login_codes : receives
    users ||--o{ addresses : has

    users {
        int id PK
        string email
        string password_hash
        string full_name
        string avatar_url
        string phone
        int role_id FK
        boolean is_active
        boolean is_deleted
    }

    role {
        int id PK
        string name
    }

    permission {
        int id PK
        string name
    }

    rolepermission {
        int role_id PK,FK
        int permission_id PK,FK
    }

    userpermission {
        int user_id PK,FK
        int permission_id PK,FK
    }

    auth_identities {
        int id PK
        int user_id FK
        string provider
        string provider_user_id
    }

    refresh_tokens {
        int id PK
        int user_id FK
        string device_id
        string token
        datetime expires_at
        boolean is_revoked
    }

    device_otps {
        int id PK
        int user_id FK
        string device_id
        string otp_hash
        datetime expires_at
    }

    oauth_login_codes {
        string code PK
        int user_id FK
        datetime expires_at
        boolean used
    }

    addresses {
        int id PK
        int user_id FK
        string recipient
        string phone
        string province
        string district
        string ward
        string street
    }
```

## 3. ERD Cửa Hàng, Sản Phẩm, Danh Mục

```mermaid
erDiagram
    users ||--o{ shops : owns
    shops ||--o{ shop_staffs : employs
    users ||--o{ shop_staffs : works_at
    shops ||--o{ shop_addresses : has

    shops ||--o{ products : sells
    brands ||--o{ products : brand_of
    categories ||--o{ categories : parent_of
    products ||--o{ product_categories : classified_as
    categories ||--o{ product_categories : contains
    products ||--o{ product_media : has
    products ||--o{ product_variants : has

    users {
        int id PK
        string email
        string full_name
    }

    shops {
        int id PK
        int owner_id FK
        string name
        string slug
        string logo_url
        string cover_url
        boolean is_verified
        decimal commission_rate
    }

    shop_staffs {
        int id PK
        int shop_id FK
        int user_id FK
        boolean is_manager
    }

    shop_addresses {
        int id PK
        int shop_id FK
        string name
        string phone
        string province
        string district
        string ward
        string street
    }

    brands {
        int id PK
        string name
        string slug
        string logo_url
    }

    categories {
        int id PK
        int parent_id FK
        string name
        string slug
    }

    products {
        int id PK
        int shop_id FK
        int brand_id FK
        string name
        string slug
        string moderation_status
        boolean is_published
        decimal avg_rating
        int review_count
    }

    product_categories {
        int product_id PK,FK
        int category_id PK,FK
    }

    product_media {
        int id PK
        int product_id FK
        string url
        string type
        int sort_order
    }

    product_variants {
        int id PK
        int product_id FK
        string sku
        string name
        string shade_hex
        decimal price
        int stock
        int weight
    }
```

## 4. ERD Giỏ Hàng, Đơn Hàng, Thanh Toán, Vận Chuyển

```mermaid
erDiagram
    users ||--|| carts : owns
    carts ||--o{ cart_items : contains
    products ||--o{ cart_items : added
    product_variants ||--o{ cart_items : selected

    users ||--o{ orders : places
    shops ||--o{ orders : receives
    addresses ||--o{ orders : shipping_address
    shop_addresses ||--o{ orders : pickup_address

    orders ||--o{ order_items : contains
    products ||--o{ order_items : sold_as
    product_variants ||--o{ order_items : sold_variant

    orders ||--o{ payments : has
    orders ||--o{ shipments : has
    shipments ||--o{ shipment_logs : records
    orders ||--o{ return_requests : may_have

    users {
        int id PK
        string email
        string full_name
    }

    shops {
        int id PK
        int owner_id FK
        string name
    }

    carts {
        int id PK
        int user_id FK
    }

    cart_items {
        int id PK
        int cart_id FK
        int product_id FK
        int variant_id FK
        int quantity
        decimal price_snapshot
    }

    orders {
        int id PK
        int user_id FK
        int shop_id FK
        string status
        string payment_status
        decimal subtotal_amount
        decimal discount_amount
        decimal shipping_fee
        decimal total_amount
        int shipping_address_id FK
        int pickup_address_id FK
        string ghn_order_code
    }

    order_items {
        int id PK
        int order_id FK
        int product_id FK
        int variant_id FK
        string name_snapshot
        decimal unit_price
        int quantity
        decimal line_total
    }

    payments {
        int id PK
        int order_id FK
        string provider
        decimal amount
        string status
        string transaction_id
    }

    shipments {
        int id PK
        int order_id FK
        string status
        string carrier
        string tracking_number
        datetime shipped_at
        datetime delivered_at
    }

    shipment_logs {
        int id PK
        int shipment_id FK
        string status
        string location_description
        datetime updated_at
    }

    return_requests {
        int id PK
        int order_id FK
        int user_id FK
        string reason
        string status
        decimal refund_amount
    }

    products {
        int id PK
        string name
    }

    product_variants {
        int id PK
        int product_id FK
        string sku
        decimal price
    }

    addresses {
        int id PK
        int user_id FK
        string street
    }

    shop_addresses {
        int id PK
        int shop_id FK
        string street
    }
```

## 5. ERD Đánh Giá, Wishlist, Voucher

```mermaid
erDiagram
    users ||--o{ reviews : writes
    products ||--o{ reviews : receives

    users ||--o{ wishlists : saves
    products ||--o{ wishlists : saved_by

    coupons ||--o{ user_vouchers : issued_as
    users ||--o{ user_vouchers : owns
    orders ||--o{ user_vouchers : used_in

    orders ||--o{ order_coupons : applies
    coupons ||--o{ order_coupons : discount
    user_vouchers ||--o{ order_coupons : redeemed

    users ||--o{ vr_model_reviews : writes
    user_vouchers ||--o{ vr_model_reviews : reward

    users ||--|| vr_review_prompt_settings : has

    users {
        int id PK
        string email
    }

    products {
        int id PK
        string name
    }

    reviews {
        int id PK
        int user_id FK
        int product_id FK
        int rating
        string title
        string content
        boolean is_verified_purchase
    }

    wishlists {
        int user_id PK,FK
        int product_id PK,FK
        datetime created_at
    }

    coupons {
        int id PK
        string code
        string discount_type
        decimal discount_value
        string voucher_type
        int usage_limit
        int used_count
    }

    user_vouchers {
        int id PK
        int user_id FK
        int coupon_id FK
        string status
        datetime expires_at
        int order_id FK
    }

    order_coupons {
        int order_id PK,FK
        int coupon_id PK,FK
        int user_voucher_id FK
        decimal amount
    }

    vr_model_reviews {
        int id PK
        int user_id FK
        int rating
        string content
        int reward_voucher_id FK
    }

    vr_review_prompt_settings {
        int user_id PK,FK
        datetime snooze_until
    }

    orders {
        int id PK
        decimal total_amount
    }
```

## 6. ERD Ví, Doanh Thu, Rút Tiền

```mermaid
erDiagram
    users ||--|| user_wallets : owns
    user_wallets ||--o{ user_wallet_transactions : has
    user_wallets ||--o{ wallet_topup_requests : topups

    shops ||--|| seller_wallets : owns
    seller_wallets ||--o{ wallet_transactions : has
    seller_wallets ||--o{ payout_requests : requested_from

    shops ||--o{ shop_bank_accounts : saves
    shop_bank_accounts ||--o{ payout_requests : used_by

    shops ||--o{ platform_revenue : generates
    orders ||--|| platform_revenue : settled_as

    users {
        int id PK
        string email
    }

    shops {
        int id PK
        string name
        decimal commission_rate
    }

    user_wallets {
        int id PK
        int user_id FK
        decimal balance
    }

    user_wallet_transactions {
        int id PK
        int wallet_id FK
        int order_id
        string type
        decimal amount
        string note
    }

    wallet_topup_requests {
        int id PK
        int wallet_id FK
        decimal amount
        string status
        string vnp_txn_ref
    }

    seller_wallets {
        int id PK
        int shop_id FK
        decimal balance
        decimal pending_balance
        decimal total_earned
    }

    wallet_transactions {
        int id PK
        int wallet_id FK
        int order_id
        string type
        decimal amount
    }

    platform_revenue {
        int id PK
        int order_id FK
        int shop_id FK
        decimal gross_amount
        decimal commission_amt
        decimal seller_amt
    }

    payout_requests {
        int id PK
        int shop_id FK
        int wallet_id FK
        decimal amount
        int bank_account_id FK
        string status
        string admin_note
    }

    shop_bank_accounts {
        int id PK
        int shop_id FK
        string bank_name
        string bank_account
        string account_name
        boolean is_default
    }

    orders {
        int id PK
        decimal total_amount
    }
```

## 7. ERD Chat, Tin Nhắn, Thông Báo

```mermaid
erDiagram
    users ||--o{ conversation_participants : joins
    shops ||--o{ conversation_participants : joins_as_shop
    conversations ||--o{ conversation_participants : has

    conversations ||--o{ messages : contains
    users ||--o{ messages : sends
    shops ||--o{ messages : sends_as_shop
    messages ||--o{ messages : replies

    messages ||--o{ message_reads : read_by
    users ||--o{ message_reads : reads

    messages ||--o{ message_reactions : reacts
    messages ||--o{ message_media : attaches

    users ||--o{ notifications : receives
    users ||--o{ audit_logs : performs
    users ||--o{ moderation_logs : moderates

    conversations {
        int id PK
        string type
        datetime created_at
    }

    conversation_participants {
        int id PK
        int conversation_id FK
        int user_id FK
        int shop_id FK
        string entity_type
        string role
    }

    messages {
        int id PK
        int conversation_id FK
        int sender_id FK
        int sender_shop_id FK
        string sender_type
        string type
        string content
        int reply_to_id FK
        boolean is_deleted
    }

    message_reads {
        int message_id PK,FK
        int user_id PK,FK
        datetime read_at
    }

    message_reactions {
        int id PK
        int message_id FK
        int user_id
        string emoji
    }

    message_media {
        int id PK
        int message_id FK
        string media_url
        string media_type
        string file_name
    }

    notifications {
        int id PK
        int user_id FK
        string type
        string title
        string body
        boolean is_read
    }

    audit_logs {
        int id PK
        int actor_id FK
        string action
        string entity_type
        int entity_id
    }

    moderation_logs {
        int id PK
        int moderator_id FK
        string target_type
        int target_id
        string action
        string reason
    }

    users {
        int id PK
        string email
    }

    shops {
        int id PK
        string name
    }
```

## 8. ERD AI, AR Makeup, Chatbot

```mermaid
erDiagram
    users ||--o{ skin_analyses : has
    users ||--o{ tryon_sessions : starts
    tryon_sessions ||--o{ tryon_items : contains
    products ||--o{ tryon_items : tried
    product_variants ||--o{ tryon_items : selected

    users ||--o{ recommendations : receives
    users ||--o{ chatbot_sessions : starts
    chatbot_sessions ||--o{ chatbot_messages : contains

    users {
        int id PK
        string email
        string full_name
    }

    products {
        int id PK
        string name
        string slug
    }

    product_variants {
        int id PK
        int product_id FK
        string shade_hex
        decimal price
    }

    skin_analyses {
        int id PK
        int user_id FK
        string image_url
        string skin_type_pred
        string issues_json
        string routine_advice
    }

    tryon_sessions {
        int id PK
        int user_id FK
        string device
        string input_type
        string input_image_url
        string result_url
        int latency_ms
    }

    tryon_items {
        int id PK
        int session_id FK
        int product_id FK
        int variant_id FK
        string type
        string params_json
    }

    recommendations {
        int id PK
        int user_id FK
        string source
        int context_id
        string items_json
    }

    chatbot_sessions {
        int id PK
        int user_id FK
        string coze_conversation_id
        string title
    }

    chatbot_messages {
        int id PK
        int session_id FK
        string sender
        string content
    }
```

## 9. ERD Bài Viết Và Social Commerce

```mermaid
erDiagram
    users ||--o{ posts : writes
    shops ||--o{ posts : publishes

    posts ||--o{ post_media : has
    posts ||--o{ post_products : tags_product
    products ||--o{ post_products : appears_in

    posts ||--o{ post_tags : has
    tags ||--o{ post_tags : used_by

    users {
        int id PK
        string email
        string full_name
    }

    shops {
        int id PK
        string name
        string slug
    }

    products {
        int id PK
        string name
        string slug
    }

    posts {
        int id PK
        int user_id FK
        int shop_id FK
        string post_type
        string title
        string content_md
        string moderation_status
        string visibility
        int view_count
        int like_count
        boolean is_story
        datetime expires_at
    }

    post_media {
        int id PK
        int post_id FK
        string media_url
        string media_type
        int sort_order
    }

    post_products {
        int post_id PK,FK
        int product_id PK,FK
    }

    tags {
        int id PK
        string name
        string slug
    }

    post_tags {
        int post_id PK,FK
        int tag_id PK,FK
    }
```
