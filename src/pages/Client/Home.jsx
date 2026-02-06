import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import hook điều hướng
import { Card, Tag, Button, Rate } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';

// Dữ liệu giả (Mock Data) - Sau này sẽ lấy từ Database Django
const PITCHES = [
  { id: 1, name: "Sân DAU 1 (Sân 5)", type: "5 người", price: "200.000đ/h", rating: 4.5, image: "https://conhantao.net/wp-content/uploads/2019/12/kich-thuoc-san-bong-da-5-nguoi.jpg" },
  { id: 2, name: "Sân DAU 2 (Sân 7)", type: "7 người", price: "300.000đ/h", rating: 5.0, image: "https://phuongthanhngoc.com/media/news/1709_kich-thuoc-san-bong-da-7-nguoi-tieu-chuan-fifa.jpg" },
  { id: 3, name: "Sân VIP Futsal", type: "Futsal", price: "250.000đ/h", rating: 4.0, image: "https://thicongsanthethao.com.vn/Content/Images/kich-thuoc-san-bong-da-futsal-min.jpg" },
];

const Home = () => {
  const navigate = useNavigate(); // 2. Khai báo hook để dùng

  return (
    <MainLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🏟️ Danh sách sân bóng</h2>
        <p className="text-gray-500">Chọn sân phù hợp để đặt lịch ngay hôm nay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PITCHES.map((pitch) => (
          <Card
            key={pitch.id}
            hoverable
            cover={<img alt={pitch.name} src={pitch.image} className="h-48 object-cover" />}
            className="shadow-md"
            // Cho phép click vào cả cái thẻ Card cũng chuyển trang luôn cho tiện
            onClick={() => navigate(`/pitch/${pitch.id}`)} 
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold">{pitch.name}</h3>
              <Tag color="blue">{pitch.type}</Tag>
            </div>
            
            <p className="text-gray-500 mb-2"><EnvironmentOutlined /> Khu thể thao ĐH Kiến Trúc</p>
            <div className="flex justify-between items-center mt-4">
              <div>
                <p className="text-red-600 font-bold text-lg">{pitch.price}</p>
                <Rate disabled defaultValue={pitch.rating} style={{ fontSize: 12 }} />
              </div>
              <Button 
                type="primary" 
                size="large"
                // 3. Sự kiện Click chuyển hướng kèm theo ID của sân
                onClick={(e) => {
                    e.stopPropagation(); // Ngăn sự kiện click của Card (để tránh bị double click)
                    navigate(`/pitch/${pitch.id}`);
                }}
              >
                Đặt ngay
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default Home;