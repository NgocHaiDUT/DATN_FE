# Xóa điều chỉnh độ đậm - Sử dụng opacity từ variant

## Tóm tắt thay đổi

Đã xóa hoàn toàn chức năng điều chỉnh độ đậm (opacity slider) và sử dụng trực tiếp giá trị `opacity` từ product variant, với giá trị mặc định là **0.2 (20%)** nếu variant không có opacity.

---

## Chi tiết thay đổi

### 1. **Xóa state `settings`**

#### Trước:
```tsx
const [settings, setSettings] = useState<MakeupSettings>({
  lipstickOpacity: 0.6,
  eyeshadowOpacity: 0.5,
  blushOpacity: 0.4,
  eyelinerOpacity: 0.7,
  foundationOpacity: 0.3,
});
```

#### Sau:
```tsx
// Đã xóa hoàn toàn
```

---

### 2. **Sử dụng opacity từ variant**

#### Trước (dùng settings):
```tsx
const opacity = (() => {
  switch (group) {
    case 'LIPS':
      return settings.lipstickOpacity;
    case 'EYESHADOW':
      return settings.eyeshadowOpacity;
    // ...
  }
})();
```

#### Sau (dùng variant.opacity):
```tsx
// Get opacity from variant, default to 0.2 (20%) if null
const opacity = (selectedVariant as any).opacity ?? 0.2;
```

**Logic mới**:
- Nếu `variant.opacity` có giá trị → dùng giá trị đó
- Nếu `variant.opacity` là `null` hoặc `undefined` → dùng `0.2` (20%)

---

### 3. **Xóa các hàm helper**

Đã xóa 2 hàm:
- `getOpacityValue()` - Lấy opacity từ settings theo product group
- `setOpacityValue()` - Cập nhật opacity vào settings

---

### 4. **Xóa UI điều chỉnh độ đậm**

#### Trước:
```tsx
{isCameraActive && selectedVariant && (
  <div className="mt-6 space-y-4">
    <h3 className="font-semibold">Điều chỉnh độ đậm</h3>
    <div>
      <label className="text-sm text-gray-600">
        {product?.name}: {Math.round(getOpacityValue() * 100)}%
      </label>
      <Slider
        value={[getOpacityValue()]}
        onValueChange={([value]) => setOpacityValue(value)}
        min={0}
        max={1}
        step={0.1}
        className="mt-2"
      />
    </div>
  </div>
)}
```

#### Sau:
```tsx
// Đã xóa hoàn toàn
```

---

### 5. **Xóa imports không dùng**

```tsx
// Đã xóa:
import { Slider } from "@/components/ui/slider";
import { MakeupSettings } from "@/types/makeup.types";
```

---

### 6. **Cập nhật dependencies**

#### Trước:
```tsx
const onResults = useCallback(
  (results: any) => {
    // ...
  },
  [selectedVariant, settings, getMakeupCategory]
);
```

#### Sau:
```tsx
const onResults = useCallback(
  (results: any) => {
    // ...
  },
  [selectedVariant, getMakeupCategory]
);
```

Đã xóa `settings` khỏi dependency array vì không còn sử dụng.

---

## Lợi ích

1. **Đơn giản hóa UI**: Không còn slider phức tạp, giao diện gọn gàng hơn
2. **Nhất quán với backend**: Opacity được quản lý tập trung từ backend
3. **Giảm state management**: Ít state hơn, ít bug hơn
4. **Giá trị mặc định hợp lý**: 0.2 (20%) là giá trị phù hợp cho hầu hết makeup

---

## Cách hoạt động

1. **Backend gửi variant** với field `opacity` (có thể null)
2. **Frontend nhận variant** và lấy opacity:
   ```tsx
   const opacity = (selectedVariant as any).opacity ?? 0.2;
   ```
3. **Vẽ makeup** với opacity đã lấy được
4. **Không có UI điều chỉnh** - opacity cố định theo variant

---

## Ví dụ

### Variant có opacity:
```json
{
  "id": 123,
  "name": "Red Velvet",
  "shade_hex": "#FF0000",
  "opacity": 0.65
}
```
→ Makeup sẽ được vẽ với opacity = **0.65** (65%)

### Variant không có opacity:
```json
{
  "id": 124,
  "name": "Pink Blush",
  "shade_hex": "#FFB6C1",
  "opacity": null
}
```
→ Makeup sẽ được vẽ với opacity = **0.2** (20%) - giá trị mặc định

---

## Testing

Để test thay đổi:

1. ✅ Mở trang product makeup AR
2. ✅ Bật camera
3. ✅ Chọn variant **có** opacity → kiểm tra makeup vẽ đúng độ đậm
4. ✅ Chọn variant **không có** opacity → kiểm tra makeup vẽ với 20%
5. ✅ Xác nhận **không còn** slider điều chỉnh độ đậm

---

## Files đã thay đổi

- `components/pages/ai/ProductMakeupAR.tsx`:
  - Xóa state `settings`
  - Xóa hàm `getOpacityValue()`, `setOpacityValue()`
  - Xóa UI slider
  - Sử dụng `variant.opacity ?? 0.2`
  - Xóa imports `Slider`, `MakeupSettings`
