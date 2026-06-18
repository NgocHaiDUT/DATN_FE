# Cập nhật logic so sánh makeup trong ProductMakeupAR.tsx

## Tóm tắt thay đổi

Đã cập nhật logic vẽ makeup và chức năng so sánh trước/sau trong `ProductMakeupAR.tsx` để sử dụng camera trực tiếp (live camera feed) thay vì ảnh chụp tĩnh (static snapshots), giống với cách thức của `AIStudioMakeup.tsx`.

## Chi tiết thay đổi

### 1. **Thêm refs cho chế độ so sánh**
```tsx
const compareVideoRef = useRef<HTMLVideoElement>(null); // Video "trước" (không makeup)
const compareCanvasRef = useRef<HTMLCanvasElement>(null); // Canvas "sau" (có makeup)
```

### 2. **Loại bỏ state snapshots tĩnh**
- Đã xóa: `beforeSnapshot`, `afterSnapshot` states
- Không còn cần chụp ảnh tĩnh khi vào chế độ so sánh

### 3. **Đơn giản hóa logic toggle compare**
```tsx
// Trước (dùng snapshots)
const toggleCompare = () => {
  if (!isComparing) {
    // Capture snapshots...
    setAfterSnapshot(canvas.toDataURL());
  }
  setIsComparing(!isComparing);
};

// Sau (dùng live feed)
const toggleCompare = () => {
  setIsComparing(!isComparing);
};
```

### 4. **Thêm useEffect để đồng bộ video stream**
Khi vào chế độ so sánh, video stream từ camera chính được đồng bộ sang `compareVideoRef`:
```tsx
useEffect(() => {
  if (isComparing && isCameraActive && videoRef.current?.srcObject && compareVideoRef.current) {
    compareVideoRef.current.srcObject = videoRef.current.srcObject;
    compareVideoRef.current.play().catch(console.error);
  }
}, [isComparing, isCameraActive]);
```

### 5. **Thêm useEffect để copy canvas liên tục**
Canvas chính (có makeup) được copy liên tục sang `compareCanvasRef` bằng requestAnimationFrame:
```tsx
useEffect(() => {
  if (!isComparing || !isCameraActive || !canvasRef.current || !compareCanvasRef.current) {
    return;
  }

  const copyFrame = () => {
    destCtx.drawImage(sourceCanvas, 0, 0);
    frameId = requestAnimationFrame(copyFrame);
  };

  copyFrame();
  return () => cancelAnimationFrame(frameId);
}, [isComparing, isCameraActive]);
```

### 6. **Cập nhật UI hiển thị so sánh**
```tsx
{/* Trước: Hiển thị 2 ảnh tĩnh */}
<img src={beforeSnapshot} />
<img src={afterSnapshot} />

{/* Sau: Hiển thị video live và canvas live */}
<video ref={compareVideoRef} /> {/* Trước - không makeup */}
<canvas ref={compareCanvasRef} /> {/* Sau - có makeup */}
```

## Lợi ích của thay đổi

1. **Trải nghiệm real-time tốt hơn**: Người dùng thấy sự khác biệt trước/sau makeup theo thời gian thực
2. **Không cần chụp ảnh**: Loại bỏ bước capture snapshots, giảm độ phức tạp
3. **Nhất quán với AIStudioMakeup**: Cùng cách thức hoạt động, dễ bảo trì
4. **Mượt mà hơn**: Không có độ trễ khi chuyển đổi giữa các chế độ

## Cách hoạt động

1. Khi người dùng nhấn nút "So sánh":
   - `isComparing` được set thành `true`
   - Video stream được đồng bộ sang `compareVideoRef` (hiển thị video gốc không makeup)
   - Canvas chính được copy liên tục sang `compareCanvasRef` (hiển thị với makeup)

2. Hiển thị side-by-side:
   - **Bên trái (Trước)**: Video trực tiếp từ camera, không có makeup
   - **Bên phải (Sau)**: Canvas với makeup được vẽ lên

3. Khi tắt chế độ so sánh:
   - Quay lại hiển thị canvas chính toàn màn hình
   - Dừng việc copy canvas

## Testing

Để test thay đổi:
1. Mở trang product makeup AR
2. Bật camera
3. Chọn một sản phẩm makeup
4. Nhấn nút "So sánh"
5. Xác nhận thấy 2 view side-by-side:
   - Trái: Video không makeup (cập nhật real-time)
   - Phải: Video có makeup (cập nhật real-time)
