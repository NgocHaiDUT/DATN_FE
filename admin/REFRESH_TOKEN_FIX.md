# Sửa lỗi Refresh Token - Logout khi F5

## Vấn đề đã tìm thấy và sửa chữa

### 1. ✅ useAuth - Catch block quá aggressive
**File:** [src/features/auth/hooks/useAuth.tsx](src/features/auth/hooks/useAuth.tsx)

**Vấn đề:** Khi F5 trang, nếu có bất kỳ lỗi nào (kể cả lỗi mạng tạm thời), code sẽ clear toàn bộ auth data và logout người dùng.

**Đã sửa:**
- Chỉ clear auth data khi refresh token thật sự hết hạn (`error.message === 'REFRESH_FAILED'`)
- Với các lỗi khác (network error), giữ refresh token và thử lại sau
- Cải thiện xử lý khi fetch user profile thất bại

### 2. ✅ UserApi - Không tự động refresh token
**File:** [src/features/users/data/api/userApi.ts](src/features/users/data/api/userApi.ts)

**Vấn đề:** Sử dụng `fetch` trực tiếp thay vì `authFetch` từ httpClient, dẫn đến không tự động refresh token khi nhận 401.

**Đã sửa:**
- Thêm import `authFetch` từ httpClient
- Thêm callback `onTokenUpdate` trong constructor
- Cập nhật tất cả methods để dùng `authFetch` thay vì `fetch`

### 3. ✅ useUsers hook - Thiếu callback onTokenUpdate
**File:** [src/features/users/hooks/useUsers.ts](src/features/users/hooks/useUsers.ts)

**Đã sửa:**
- Thêm `refreshSession` từ useAuth
- Tạo callback `handleTokenUpdate` để cập nhật token sau khi auto-refresh
- Truyền callback vào UserApi constructor

## Cần áp dụng cho các module khác

Các API sau đây cũng cần được cập nhật tương tự:

### Dashboard API
**File:** `src/features/dashboard/data/api/dashboardApi.ts`
- ❌ Đang dùng `fetch` trực tiếp (3 methods)

### Shops API
**File:** `src/features/shops/data/api/shopsApi.ts`
- ❌ Đang dùng `fetch` trực tiếp (5 methods)

### Products, Posts, Orders API
- Cần kiểm tra và cập nhật tương tự nếu đang dùng `fetch` trực tiếp

## Hướng dẫn áp dụng fix cho module khác

### Bước 1: Cập nhật API class

```typescript
// Thêm import
import { authFetch } from '../../../auth/data/api/httpClient';

export class YourApi {
  private baseUrl: string;
  private onTokenUpdate?: (newToken: string) => void;

  constructor(baseUrl?: string, onTokenUpdate?: (newToken: string) => void) {
    // ... existing code ...
    this.onTokenUpdate = onTokenUpdate;
  }

  async yourMethod(params: any, accessToken?: string | null) {
    const url = `${this.baseUrl}/your-endpoint`;
    
    // Thay thế fetch bằng authFetch
    const response = await authFetch(
      url,
      {
        method: 'GET', // hoặc POST, PATCH, DELETE
        headers: { 'Content-Type': 'application/json' }, // nếu cần
        body: JSON.stringify(data), // nếu cần
      },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    
    // ... xử lý response như bình thường ...
  }
}
```

### Bước 2: Cập nhật hook

```typescript
import { useCallback } from 'react';
import { useAuth } from '../../../features/auth/hooks/useAuth';

export const useYourFeature = () => {
  const { token, refreshSession } = useAuth();

  // Callback để cập nhật token sau khi auto-refresh
  const handleTokenUpdate = useCallback(async () => {
    await refreshSession();
  }, [refreshSession]);

  // Truyền callback vào API constructor
  const api = new YourApi(undefined, handleTokenUpdate);
  const repository = new YourRepositoryImpl(api, token);
  
  // ... rest of the hook ...
};
```

## Lợi ích của giải pháp

1. **Auto-refresh token:** Khi access token hết hạn (401), tự động dùng refresh token để lấy token mới
2. **Seamless UX:** Người dùng không bị logout khi F5 hoặc khi token hết hạn
3. **Xử lý lỗi tốt hơn:** Phân biệt giữa lỗi mạng và lỗi authentication thực sự
4. **Tránh duplicate requests:** httpClient có cơ chế queue requests khi đang refresh

## Testing

### Test case 1: F5 trang
1. Đăng nhập vào ứng dụng
2. F5 trang (hoặc Ctrl+R)
3. ✅ Vẫn giữ đăng nhập, không bị logout

### Test case 2: Access token hết hạn
1. Đăng nhập và để ứng dụng mở (không refresh)
2. Đợi access token hết hạn (thường 15-30 phút)
3. Thực hiện một hành động (load users, update, etc.)
4. ✅ Token tự động refresh, request thành công

### Test case 3: Refresh token hết hạn
1. Đăng nhập
2. Xóa refresh token trong localStorage (`__rt`)
3. F5 trang hoặc thực hiện action
4. ✅ Bị logout và redirect về login page

## Lưu ý quan trọng

1. **Access token chỉ trong memory:** Access token không được lưu trong localStorage, chỉ trong React Context
2. **Refresh token trong localStorage:** Refresh token lưu với key `__rt`
3. **Security:** Để bảo mật tốt hơn, backend nên gửi refresh token qua httpOnly cookie thay vì trong response body
4. **Device tracking:** Mỗi device có device_id riêng để backend quản lý sessions
