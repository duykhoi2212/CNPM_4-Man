# ADR-001: Chọn MySQL làm Hệ quản trị Cơ sở dữ liệu chính

**Ngày quyết định:** 11/02/2026
**Trạng thái:** Accepted
**Người quyết định:** Phùng Văn Duy Khôi (Team Leader)

## 1. Bối cảnh (Context)
Hệ thống Website đặt lịch sân bóng đá yêu cầu lưu trữ các dữ liệu có tính cấu trúc cao và quan hệ chặt chẽ với nhau (User, Sân bóng, Khung giờ, Đơn đặt sân). Đặc biệt, nghiệp vụ Đặt sân (Booking) yêu cầu tính toàn vẹn dữ liệu tuyệt đối (ACID) để xử lý các giao dịch đồng thời, đảm bảo không bao giờ xảy ra trường hợp hai người đặt cùng một sân trong cùng một giờ (Double Booking).

## 2. Các phương án xem xét (Options Considered)

* **Option 1: MySQL (Relational DB)**
  * *Ưu điểm:* Hỗ trợ Transaction (ACID) rất tốt, an toàn cho logic xử lý đặt lịch. Phổ biến, tài liệu phong phú. Dễ dàng thực hiện các truy vấn phức tạp (JOIN) để xuất báo cáo thống kê doanh thu.
  * *Nhược điểm:* Cấu trúc (Schema) cứng nhắc, cần thiết kế kỹ từ đầu. Khả năng scale ngang kém hơn NoSQL.
* **Option 2: MongoDB (NoSQL)**
  * *Ưu điểm:* Schema linh hoạt (JSON-like), tốc độ ghi (Write) rất nhanh. Dễ dàng thay đổi cấu trúc dữ liệu.
  * *Nhược điểm:* Xử lý quan hệ (Relationship) và Transaction phức tạp hơn SQL. Không có sẵn ràng buộc khóa ngoại (Foreign Key) chặt chẽ.

## 3. Quyết định (Decision)
**Chọn: Option 1 (MySQL)**

*Lý do:* Ưu tiên hàng đầu của đồ án là tính chính xác và nhất quán của dữ liệu đặt sân (Data Integrity). MySQL cung cấp cơ chế khóa cấp dòng (Row-level locking) và Transaction chuẩn, giúp ngăn chặn triệt để các xung đột khi có nhiều người đặt sân cùng lúc. Ngoài ra, MySQL tương thích hoàn hảo với ORM của Django, giúp quá trình phát triển thuận lợi hơn.

## 4. Hậu quả (Consequences)
* **Tích cực:** Đảm bảo tính toàn vẹn dữ liệu ở mức cao nhất; dễ dàng thực hiện các truy vấn thống kê phức tạp cho Admin; tận dụng được các tính năng bảo mật tích hợp sẵn của RDBMS.
* **Tiêu cực:** Đòi hỏi nhóm phải thiết kế sơ đồ ERD thật chặt chẽ ngay từ giai đoạn đầu; việc thay đổi cấu trúc các bảng sau này sẽ tốn công sức (phải viết Migration).
