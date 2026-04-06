# Hướng Dẫn Quản Lý Dữ Liệu Tìm Đối Thủ (Matchmaking)

## 📊 Tình Trạng Hiện Tại

Hệ thống matchmaking của bạn hiện có:

### 👥 Người Dùng
- **Tổng cộng**: 11 người dùng
- **Real users** (người dùng thực): 7 người
- **Test users** (người dùng test): 4 người

**Real Users:**
- admin
- an
- ct3
- ctt
- cttt
- nva
- testuser

**Test Users (cần xóa):**
- player1
- player2
- testplayer
- testplayer9102

### 📋 Dữ Liệu Matchmaking
- **Opponent Requests**: 4 yêu cầu
- **Matches**: 2 trận đấu

---

## 🧹 Xóa Dữ Liệu Test

### Option 1: Xem trước (Preview)
```bash
python manage.py delete_test_users
```
Lệnh này sẽ hiển thị:
- Danh sách test users sẽ bị xóa
- Số lượng opponent requests sẽ bị xóa
- Số lượng matches sẽ bị xóa

### Option 2: Xóa thực tế (Confirm)
```bash
python manage.py delete_test_users --confirm
```
Lệnh này sẽ:
1. Hiển thị danh sách test users
2. Yêu cầu bạn nhập "yes" để xác nhận
3. Xóa tất cả test users và dữ liệu liên quan

### Option 3: Xem tất cả người dùng theo danh mục
```bash
python manage.py delete_test_users --list-all
```

---

## 🔍 Kiểm Tra Dữ Liệu Test/Fake

Để kiểm tra dữ liệu test với pattern test_team_*:
```bash
python manage.py check_fake_data --detailed
```

---

## 📝 Các Lệnh Quản Lý Khác

### Xem tất cả dữ liệu hiện tại
```bash
python view_matchmaking_data.py
```

### Xóa dữ liệu fake theo pattern cụ thể (test_team_*)
```bash
python manage.py delete_fake_data
python manage.py delete_fake_data --confirm
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Backup trước khi xóa**: Hãy backup database trước khi thực hiện xóa
2. **Xem trước trước khi xóa**: Luôn chạy lệnh mà không `--confirm` trước
3. **Dữ liệu cascade**: Xóa một user sẽ xóa tất cả opponent requests và matches liên quan
4. **Không thể hoàn tác**: Xóa dữ liệu là vĩnh viễn

---

## 🚀 Workflow Khuyến Nghị

### Bước 1: Kiểm tra dữ liệu test hiện có
```bash
# Kiểm tra test_team_* users
python manage.py check_fake_data --detailed

# Kiểm tra test/player users
python manage.py delete_test_users --list-all
```

### Bước 2: Xem trước dữ liệu sẽ xóa
```bash
# Xem trước test/player users
python manage.py delete_test_users

# Xem trước test_team_* users
python manage.py delete_fake_data
```

### Bước 3: Xóa dữ liệu test
```bash
# Xóa test/player users
python manage.py delete_test_users --confirm

# Xóa test_team_* users (nếu có)
python manage.py delete_fake_data --confirm
```

### Bước 4: Xác nhận dữ liệu
```bash
# Hiển thị dữ liệu cuối cùng
python view_matchmaking_data.py
```

---

## 🎯 Tự Động Ngăn Chặn Test Data

Để tránh tạo test data trong tương lai:

1. **Không chạy test_team_matchmaking.py** vào production
2. **Sử dụng Django fixtures** cho test data thay vì tạo nó trong code
3. **Sử dụng --settings=core.settings_test** khi chạy tests

---

## 📞 Câu Hỏi Thường Gặp (FAQ)

### Q: Làm thế nào để không xóa 'testuser'?
A: Script hiện có nguy hiểm xóa 'testuser' vì nó chứa từ 'test'. Bạn có thể:
1. Đổi tên 'testuser' là tên thật
2. Chỉnh sửa script để bỏ qua nó
3. Xóa manual from Django admin

### Q: Có thể xóa từng user riêng lẻ không?
A: Có, bạn có thể xóa từ Django admin hoặc chạy:
```bash
python manage.py shell
```

Sau đó:
```python
from django.contrib.auth.models import User
User.objects.filter(username='testplayer').delete()
```

### Q: Làm thế nào để backup trước khi xóa?
A: Sử dụng Django dumpdata:
```bash
python manage.py dumpdata > backup_$(date +%Y%m%d_%H%M%S).json
```

---

## 🔧 Tùy Chỉnh Script

Để xóa theo pattern tùy chỉnh:
```bash
python manage.py delete_test_users --pattern "demo"
```

---

Generated: 2026-04-06
