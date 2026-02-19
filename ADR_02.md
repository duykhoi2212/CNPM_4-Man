# ADR-002: Chọn Django Framework cho Backend

**Ngày quyết định:** 11/02/2026
**Trạng thái:** Accepted
**Người quyết định:** Lê Thọ Khánh (Product Owner / Backend)

## 1. Bối cảnh (Context)
Hệ thống cần cung cấp các RESTful API phục vụ cho Frontend (ReactJS), đồng thời yêu cầu một trang quản trị (Admin Dashboard) mạnh mẽ để chủ sân quản lý Booking, Sân bãi, cấu hình giá cả và xem thống kê. Đồ án có thời gian phát triển ngắn nên cần một framework hỗ trợ phát triển nhanh (Rapid Development) nhưng vẫn phải đảm bảo tính bảo mật cao (Xác thực, Phân quyền User/Admin).

## 2. Các phương án xem xét (Options Considered)

* **Option 1: Django (Python)**
  * *Ưu điểm:* Triết lý "Batteries-included" (cung cấp sẵn mọi thứ từ Auth, ORM đến Admin Interface). Tốc độ phát triển tính năng cực nhanh. Bảo mật mặc định rất tốt.
  * *Nhược điểm:* Cấu trúc hệ thống có thể trở nên cồng kềnh (Monolithic). Hiệu năng xử lý I/O không bằng các framework bất đồng bộ.
* **Option 2: Node.js (Express)**
  * *Ưu điểm:* Sử dụng chung ngôn ngữ JavaScript với hệ sinh thái Frontend (React), thuận tiện cho các bạn Fullstack. Hiệu năng xử lý concurrent cao.
  * *Nhược điểm:* Framework "trần" (phải tự cài đặt và cấu hình nhiều thư viện rời rạc như ORM, Auth). Không có sẵn trang Admin, tốn rất nhiều thời gian tự thiết kế và code giao diện quản trị.

## 3. Quyết định (Decision)
**Chọn: Option 1 (Django)**

*Lý do:* Yêu cầu bắt buộc của đồ án là phải có chức năng quản trị hệ thống cho Admin (Module Quản lý Sân & Booking). Django cung cấp sẵn hệ thống **Django Admin** ngay khi khởi tạo dự án với đầy đủ các thao tác CRUD. Quyết định này giúp nhóm tiết kiệm đến 30-40% thời gian xây dựng giao diện quản trị, từ đó có thể tập trung tối đa thời gian vào việc giải quyết các logic cốt lõi phức tạp như thuật toán chống trùng lịch Booking.

## 4. Hậu quả (Consequences)
* **Tích cực:** Có ngay trang Admin Dashboard đầy đủ tính năng mà không tốn effort code Frontend; hệ thống bảo mật cao (ngăn chặn sẵn SQL Injection, XSS, CSRF); cấu trúc dự án rõ ràng, chuẩn mực theo mô hình MTV.
* **Tiêu cực:** Yêu cầu các thành viên nhóm phải làm quen với ngôn ngữ Python; có thể gặp khó khăn nếu muốn tùy biến giao diện trang Django Admin theo những yêu cầu UX/UI quá đặc biệt.
