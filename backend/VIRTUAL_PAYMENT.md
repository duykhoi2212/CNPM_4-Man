# Virtual Payment QR Code Guide

## Tổng quan
Hệ thống sử dụng thanh toán ảo với QR code static từ ảnh bạn cung cấp. Khi user nhấn thanh toán, hệ thống sẽ hiển thị QR code từ ảnh đã được cấu hình.

## Cấu hình QR Code

### 1. Chuẩn bị ảnh QR code
- Ảnh QR code phải là file PNG/JPG
- QR code nên chứa thông tin thanh toán (số tài khoản, ngân hàng, v.v.)
- Kích thước khuyến nghị: 300x300px trở lên

### 2. Chuyển ảnh thành base64
```bash
# Sử dụng Python để convert
python -c "
import base64
with open('your_qr_image.png', 'rb') as f:
    data = base64.b64encode(f.read()).decode()
    print('data:image/png;base64,' + data)
"
```

### 3. Cập nhật file .env
```env
PAYMENT_QR_CODE=data:image/png;base64,YOUR_BASE64_STRING_HERE
```

## Cách hoạt động

### Flow thanh toán:
1. User tạo booking → Tạo payment
2. User nhấn "Thanh toán" → Hiển thị QR code từ ảnh
3. User scan QR và chuyển khoản thủ công
4. User nhấn "Đã thanh toán" → Status chuyển thành `user_confirmed`
5. Admin kiểm tra và xác nhận → Status chuyển thành `completed`

### Fallback:
- Nếu chưa cấu hình ảnh QR, hệ thống tạo QR code đơn giản
- Tất cả payment methods (bank_transfer, momo, vnpay) đều sử dụng cùng QR code

## Test hệ thống

Chạy script test:
```bash
cd backend
python test_virtual_payment.py
```

## Cập nhật ảnh QR

1. Thay thế ảnh mới
2. Convert thành base64
3. Cập nhật `PAYMENT_QR_CODE` trong `.env`
4. Restart server

## Lưu ý

- QR code được trả về dưới dạng data URL (base64)
- Frontend có thể hiển thị trực tiếp trong thẻ `<img src="data:image...">`
- Không có integration với API bên ngoài
- Thanh toán hoàn toàn thủ công</content>
<parameter name="filePath">e:\DA.CN-CNPM\CNPM_4-Man\backend\VIRTUAL_PAYMENT.md