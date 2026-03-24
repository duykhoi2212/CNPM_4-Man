from django.test import TestCase
from .serializers import FieldSerializer

class FieldValidationServiceTest(TestCase):
    
    def setUp(self):
        # Dữ liệu chuẩn (Happy path)
        self.valid_data = {
            "name": "Sân bóng A (5 người)",
            "location": "123 Đà Nẵng",
            "price_per_hour": 300000,
            "deposit_percent": 30
        }

    # Test 1: Đảm bảo dữ liệu chuẩn được tạo thành công
    def test_1_valid_field_creation(self):
        serializer = FieldSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), "Dữ liệu chuẩn phải pass validation")

    # Test 2: Bắt lỗi Validation khi Tên sân quá ngắn
    def test_2_invalid_name_too_short(self):
        invalid_data = self.valid_data.copy()
        invalid_data['name'] = "Sân" # Quá ngắn (dưới 5 ký tự)
        serializer = FieldSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    # Test 3: Bắt lỗi Validation khi Giá tiền âm
    def test_3_invalid_negative_price(self):
        invalid_data = self.valid_data.copy()
        invalid_data['price_per_hour'] = -50000
        serializer = FieldSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('price_per_hour', serializer.errors)

    # Test 4: Bắt lỗi Validation khi Phần trăm cọc vượt quá 100
    def test_4_invalid_deposit_percent_over_100(self):
        invalid_data = self.valid_data.copy()
        invalid_data['deposit_percent'] = 150 # Lỗi
        serializer = FieldSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('deposit_percent', serializer.errors)
        
    # Test 5: Bắt lỗi Validation khi Phần trăm cọc là số âm
    def test_5_invalid_deposit_percent_negative(self):
        invalid_data = self.valid_data.copy()
        invalid_data['deposit_percent'] = -10 # Lỗi
        serializer = FieldSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('deposit_percent', serializer.errors)