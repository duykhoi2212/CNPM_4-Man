import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Button, Rate, Radio } from 'antd'; // Thêm Radio để làm bộ lọc
import { EnvironmentOutlined, FilterOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';

// Dữ liệu giả (Mock Data)
const PITCHES = [
  { id: 1, name: "Sân DAU 1 (Sân 5)", type: "5 người", price: "200.000đ/h", rating: 4.5, image: "https://conhantao.net/wp-content/uploads/2019/12/kich-thuoc-san-bong-da-5-nguoi.jpg" },
  { id: 2, name: "Sân DAU 2 (Sân 7)", type: "7 người", price: "300.000đ/h", rating: 5.0, image: "https://phuongthanhngoc.com/media/news/1709_kich-thuoc-san-bong-da-7-nguoi-tieu-chuan-fifa.jpg" },
  { id: 3, name: "Sân VIP Futsal", type: "Futsal", price: "250.000đ/h", rating: 4.0, image: "https://thicongsanthethao.com.vn/Content/Images/kich-thuoc-san-bong-da-futsal-min.jpg" },
  { id: 4, name: "Sân Cỏ Tự Nhiên", type: "11 người", price: "800.000đ/h", rating: 5.0, image: "https://thegioithethao.vn/upload_images/images/2021/12/03/kich-thuoc-san-bong-da-11-nguoi-tieu-chuan-fifa-1.jpg" }, // Thêm sân 11 người để test lọc
];

const Home = () => {
  const navigate = useNavigate();
  
  // 1. State lưu loại sân đang chọn (Mặc định là 'All')
  const [filterType, setFilterType] = useState('All');

  // 2. Logic lọc sân: Nếu chọn 'All' thì lấy hết, ngược lại chỉ lấy sân có type trùng khớp
  const filteredPitches = filterType === 'All' 
    ? PITCHES 
    : PITCHES.filter(pitch => pitch.type === filterType);

  return (
    <MainLayout>
      {/* PHẦN TIÊU ĐỀ & BỘ LỌC */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">🏟️ Danh sách sân bóng</h2>
          <p className="text-gray-500">Tìm sân phù hợp với đội của bạn</p>
        </div>

        {/* Component Bộ Lọc */}
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
           <span className="mr-3 font-semibold text-gray-600"><FilterOutlined /> Bộ lọc:</span>
           <Radio.Group 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)} 
              buttonStyle="solid"
           >
              <Radio.Button value="All">Tất cả</Radio.Button>
              <Radio.Button value="5 người">Sân 5</Radio.Button>
              <Radio.Button value="7 người">Sân 7</Radio.Button>
              <Radio.Button value="11 người">Sân 11</Radio.Button>
              <Radio.Button value="Futsal">Futsal</Radio.Button>
           </Radio.Group>
        </div>
      </div>

      {/* DANH SÁCH SÂN ĐÃ LỌC */}
      {filteredPitches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPitches.map((pitch) => (
            <Card
              key={pitch.id}
              hoverable
              cover={<img alt={pitch.name} src={pitch.image} className="h-48 object-cover transition-transform duration-300 hover:scale-105" />}
              className="shadow-md overflow-hidden rounded-xl border-gray-200"
              onClick={() => navigate(`/pitch/${pitch.id}`)} 
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold line-clamp-1">{pitch.name}</h3>
                <Tag color={
                    pitch.type === '5 người' ? 'green' : 
                    pitch.type === '7 người' ? 'blue' : 
                    pitch.type === '11 người' ? 'orange' : 'purple'
                }>
                    {pitch.type}
                </Tag>
              </div>
              
              <p className="text-gray-500 mb-3 text-sm"><EnvironmentOutlined /> Khu thể thao ĐH Kiến Trúc</p>
              
              <div className="flex justify-between items-center border-t pt-3 mt-2">
                <div>
                  <p className="text-red-600 font-bold text-lg m-0">{pitch.price}</p>
                  <Rate disabled defaultValue={pitch.rating} style={{ fontSize: 12 }} />
                </div>
                <Button 
                  type="primary" 
                  className="bg-blue-600 font-semibold shadow-md"
                  onClick={(e) => {
                      e.stopPropagation(); 
                      navigate(`/pitch/${pitch.id}`);
                  }}
                >
                  Đặt ngay
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Hiển thị khi không tìm thấy sân nào
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-600">Không tìm thấy sân bóng loại này</h3>
            <Button type="link" onClick={() => setFilterType('All')}>Xem tất cả sân</Button>
        </div>
      )}
    </MainLayout>
  );
};

export default Home;