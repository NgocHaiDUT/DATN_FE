# Cập nhật cách vẽ makeup trong ProductMakeupAR.tsx

## Tóm tắt thay đổi

Đã cập nhật **hoàn toàn** cách vẽ makeup trong `ProductMakeupAR.tsx` để khớp chính xác với `AIStudioMakeup.tsx`, bao gồm:

1. **Thay đổi cách lấy dữ liệu từ MediaPipe results**
2. **Thay đổi cách vẽ makeup từ hàm legacy sang hàm chuyên biệt**
3. **Cập nhật logic so sánh trước/sau từ static snapshots sang live camera feed**

---

## Chi tiết thay đổi

### 1. **Thay đổi nguồn dữ liệu từ MediaPipe**

#### Trước (cách cũ):
```tsx
const source = videoRef.current;
canvas.width = source.videoWidth;
canvas.height = source.videoHeight;
ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

const landmarks = extractFaceLandmarks(results);
```

#### Sau (giống AIStudioMakeup):
```tsx
const width = results.image.width;
const height = results.image.height;
canvas.width = width;
canvas.height = height;
ctx.drawImage(results.image, 0, 0, width, height);

const landmarks = results.multiFaceLandmarks?.[0];
```

**Lý do**: `results.image` là nguồn chính xác từ MediaPipe, đảm bảo kích thước và nội dung khớp với landmarks.

---

### 2. **Thay đổi cách vẽ makeup**

#### Trước (dùng hàm legacy `drawMakeup`):
```tsx
const makeupConfig: any = {};
switch (group) {
  case 'LIPS':
    makeupConfig.lipstick = { color: shadeColor, opacity: settings.lipstickOpacity };
    break;
  // ...
}
drawMakeup(ctx, landmarks, makeupConfig);
```

#### Sau (dùng hàm chuyên biệt cho từng feature):
```tsx
if (group === 'LIPS') {
  const lipUpper = FEATURE_CONFIGS.find((c) => c.name === 'LIP_UPPER');
  const lipLower = FEATURE_CONFIGS.find((c) => c.name === 'LIP_LOWER');
  if (lipUpper) {
    drawFeature(ctx, landmarks, lipUpper.indices, width, height, rgb, opacity);
  }
  if (lipLower) {
    drawFeature(ctx, landmarks, lipLower.indices, width, height, rgb, opacity);
  }
}
```

**Lý do**: 
- Hàm `drawMakeup` là legacy, chỉ hỗ trợ lipstick, eyeshadow, blush cơ bản
- Các hàm chuyên biệt (`drawFeature`, `drawBlush`, `drawEyeliner`, etc.) hỗ trợ đầy đủ tất cả makeup features với hiệu ứng tốt hơn
- Sử dụng `FEATURE_CONFIGS` để lấy chính xác indices của từng feature

---

### 3. **Mapping đúng feature names**

| Product Category | Feature Names trong FEATURE_CONFIGS |
|-----------------|-------------------------------------|
| LIPS | `LIP_UPPER`, `LIP_LOWER` |
| EYESHADOW | `EYESHADOW_LEFT`, `EYESHADOW_RIGHT` |
| BLUSH | `BLUSH_LEFT`, `BLUSH_RIGHT` |
| EYELINER | `EYELINER_LEFT`, `EYELINER_RIGHT` |
| FOUNDATION | `FOUNDATION` |

---

### 4. **Thay đổi logic so sánh (Compare Mode)**

#### Trước (static snapshots):
```tsx
// Capture before snapshot on first frame
if (!beforeSnapshot && isCameraActive) {
  const tempCanvas = document.createElement('canvas');
  // ... capture to beforeSnapshot
}

// Capture after snapshot when entering compare mode
if (!isComparing) {
  setAfterSnapshot(canvas.toDataURL());
}

// Display: <img src={beforeSnapshot} /> <img src={afterSnapshot} />
```

#### Sau (live camera feed):
```tsx
// No snapshot capture needed!

// Sync video stream to compareVideoRef
useEffect(() => {
  if (isComparing && compareVideoRef.current) {
    compareVideoRef.current.srcObject = videoRef.current.srcObject;
    compareVideoRef.current.play();
  }
}, [isComparing]);

// Copy canvas continuously
useEffect(() => {
  const copyFrame = () => {
    destCtx.drawImage(sourceCanvas, 0, 0);
    requestAnimationFrame(copyFrame);
  };
  copyFrame();
}, [isComparing]);

// Display: <video ref={compareVideoRef} /> <canvas ref={compareCanvasRef} />
```

**Lợi ích**:
- ✅ Real-time comparison (so sánh theo thời gian thực)
- ✅ Không cần capture/store snapshots
- ✅ Mượt mà hơn, không có độ trễ
- ✅ Nhất quán với AIStudioMakeup.tsx

---

## Các imports đã thêm

```tsx
import { FEATURE_CONFIGS } from "@/lib/faceFeatures";
```

---

## Các hàm drawing được sử dụng

Từ `@/lib/makeup-drawing`:
- `drawFeature()` - Vẽ feature cơ bản (lips, eyeshadow)
- `drawBlush()` - Vẽ má hồng với gradient
- `drawEyeliner()` - Vẽ kẻ mắt
- `drawFoundation()` - Vẽ phấn nền
- `drawEyebrow()` - Vẽ lông mày
- `drawMascara()` - Vẽ mascara

---

## Cách hoạt động hiện tại

1. **MediaPipe xử lý frame** → `onResults()` được gọi
2. **Lấy dữ liệu**:
   - `results.image` → nguồn ảnh
   - `results.multiFaceLandmarks[0]` → landmarks
3. **Vẽ video frame** lên canvas
4. **Xác định product category** → lấy feature configs tương ứng
5. **Vẽ makeup** bằng hàm chuyên biệt cho từng feature
6. **Nếu đang compare**:
   - Video gốc hiển thị ở `compareVideoRef` (không makeup)
   - Canvas với makeup được copy sang `compareCanvasRef`

---

## Testing

Để test các thay đổi:

1. ✅ Mở trang product makeup AR
2. ✅ Bật camera
3. ✅ Chọn sản phẩm thuộc các category khác nhau:
   - Son môi (LIPS)
   - Phấn mắt (EYESHADOW)
   - Má hồng (BLUSH)
   - Kẻ mắt (EYELINER)
   - Phấn nền (FOUNDATION)
4. ✅ Kiểm tra makeup được vẽ chính xác
5. ✅ Nhấn "So sánh" → xem live comparison
6. ✅ Điều chỉnh độ đậm → makeup cập nhật real-time

---

## Kết quả

Bây giờ `ProductMakeupAR.tsx` và `AIStudioMakeup.tsx` sử dụng **cùng một cách thức vẽ makeup**, đảm bảo:
- ✅ Chất lượng makeup nhất quán
- ✅ Hiệu suất tốt hơn
- ✅ Dễ bảo trì
- ✅ Hỗ trợ đầy đủ tất cả makeup features
