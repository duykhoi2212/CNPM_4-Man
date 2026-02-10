import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Button, Image, Typography, Modal, message, Divider } from 'antd';
import { EnvironmentOutlined, ArrowLeftOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import BookingSchedule from '../../components/Schedule/BookingSchedule';

const { Title, Paragraph, Text } = Typography;

// Dữ liệu giả lập
const MOCK_DATA = {
  1: { 
    id: 1, 
    name: "Sân DAU 1 (Sân 5)", 
    type: "5 người", 
    address: "Khu thể thao ĐH Kiến Trúc - 566 Núi Thành, Đà Nẵng",
    description: "Sân cỏ nhân tạo chất lượng cao, mới thay cỏ năm 2025. Hệ thống đèn chiếu sáng tiêu chuẩn.",
    images: ["https://conhantao.net/wp-content/uploads/2019/12/kich-thuoc-san-bong-da-5-nguoi.jpg"],
    price: ["200.000đ/h (05:00 - 16:00)", "300.000đ/h (16:00 - 22:00)"]
  },
  2: { 
    id: 2, 
    name: "Sân DAU 2 (Sân 7)", 
    type: "7 người", 
    address: "Khu thể thao ĐH Kiến Trúc",
    description: "Sân 7 người rộng rãi, phù hợp đá giao hữu.",
    images: ["https://phuongthanhngoc.com/media/news/1709_kich-thuoc-san-bong-da-7-nguoi-tieu-chuan-fifa.jpg"],
    price: ["300.000đ/h (05:00 - 16:00)", "450.000đ/h (16:00 - 22:00)"]
  },
  3: { 
    id: 3, 
    name: "Sân VIP Futsal", 
    type: "Futsal", 
    address: "Nhà thi đấu đa năng DAU",
    description: "Sân sàn gỗ tiêu chuẩn thi đấu, có mái che.",
    images: ["https://thicongsanthethao.com.vn/Content/Images/kich-thuoc-san-bong-da-futsal-min.jpg"],
    price: ["250.000đ/h (Cả ngày)"]
  }
};

const PitchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const pitch = MOCK_DATA[id];

  const [bookingInfo, setBookingInfo] = useState(null);

  if (!pitch) return <div className="text-center mt-20">Không tìm thấy sân bóng!</div>;

  // Hàm chuyển đổi chuỗi giá tiền thành số (Ví dụ: "200.000đ/h..." -> 200000)
  const parsePrice = (priceString) => {
    // Lấy các ký tự số từ chuỗi đầu tiên tìm thấy
    const number = priceString.match(/(\d+)\./); 
    if (number) {
        return parseInt(number[1]) * 1000; // Vì mock data ghi là 200.000
    }
    return 200000; // Giá mặc định nếu lỗi
  };

  const onSelectSlot = (slot, date) => {
    // Logic giả lập: Nếu đá buổi tối (sau 17h) thì lấy giá cao, ngược lại giá thấp
    const hour = parseInt(slot.split(':')[0]);
    const priceString = hour >= 17 && pitch.price[1] ? pitch.price[1] : pitch.price[0];
    const rawPrice = parsePrice(priceString);

    setBookingInfo({
      pitchName: pitch.name,
      date: date.format('DD/MM/YYYY'),
      time: slot,
      price: rawPrice, // Lưu giá dạng số để tính toán
      displayPrice: priceString.split(' ')[0] // Lưu giá dạng chữ để hiển thị
    });
  };

  const handleBooking = () => {
    if (!bookingInfo) return;

    // TÍNH TOÁN TIỀN CỌC (30%)
    const DEPOSIT_PERCENT = 0.3;
    const depositAmount = bookingInfo.price * DEPOSIT_PERCENT;
    const remainingAmount = bookingInfo.price - depositAmount;

    Modal.confirm({
      title: 'Xác nhận đặt sân & Thanh toán cọc',
      width: 500,
      icon: <DollarOutlined />,
      content: (
        <div className="mt-4">
          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <p>🏟️ <b>{bookingInfo.pitchName}</b></p>
            <p>📅 Ngày: <b>{bookingInfo.date}</b></p>
            <p>⏰ Khung giờ: <b>{bookingInfo.time}</b></p>
          </div>
          
          <div className="space-y-2 text-base">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng tiền sân:</span>
              <span className="font-bold">{bookingInfo.price.toLocaleString()}đ</span>
            </div>
            
            <div className="flex justify-between text-blue-600">
              <span>Tiền cọc (30%):</span>
              <span className="font-bold">{depositAmount.toLocaleString()}đ</span>
            </div>
            
            <Divider style={{ margin: '8px 0' }} />
            
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Thu tại sân (Còn lại):</span>
              <span>{remainingAmount.toLocaleString()}đ</span>
            </div>
          </div>

          <p className="text-red-500 italic text-xs mt-4">
            *Lưu ý: Bạn cần thanh toán cọc để giữ chỗ. Tiền cọc sẽ không được hoàn lại nếu hủy sau 24h.
          </p>
        </div>
      ),
      okText: `Thanh toán ${depositAmount.toLocaleString()}đ`,
      cancelText: 'Hủy bỏ',
      onOk() {
        message.loading('Đang xử lý thanh toán...', 1.5)
          .then(() => {
            message.success('Đặt sân thành công! Vui lòng kiểm tra email.');
            navigate('/profile'); // Chuyển về trang lịch sử
          });
      }
    });
  };

  return (
    <MainLayout>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/home')} className="mb-4">
        Quay lại danh sách
      </Button>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={14}>
             <Image src={pitch.images[0]} className="rounded-lg w-full object-cover" height={400} />
          </Col>

          <Col xs={24} md={10}>
            <Tag color="blue" className="mb-2 text-lg px-3 py-1">{pitch.type}</Tag>
            <Title level={2} style={{ marginTop: 0 }}>{pitch.name}</Title>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <EnvironmentOutlined /> <span>{pitch.address}</span>
            </div>
            <Paragraph className="text-gray-500 text-justify">{pitch.description}</Paragraph>
            
            <Card title="Bảng giá thuê sân" size="small" className="bg-gray-50 mb-6">
              <ul className="list-disc pl-4 mb-0">
                {pitch.price.map((p, idx) => (
                   <li key={idx} className="text-gray-700 font-medium">{p}</li>
                ))}
              </ul>
            </Card>

            <div className="flex gap-4 text-gray-500 text-sm">
               <span><CheckCircleOutlined className="text-green-500"/> Có bãi đỗ xe</span>
               <span><CheckCircleOutlined className="text-green-500"/> Free nước lọc</span>
            </div>
          </Col>
        </Row>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <Title level={3} className="mb-4">📅 Xem lịch trống & Đặt sân</Title>
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <BookingSchedule onSelectSlot={onSelectSlot} />
          </Col>
          
          <Col xs={24} md={8}>
            <Card className="mt-6 md:mt-0 bg-blue-50 border-blue-200 shadow-sm" title="🎫 Thông tin đặt sân">
              {bookingInfo ? (
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Sân:</span>
                    <span className="font-bold">{bookingInfo.pitchName}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Ngày:</span>
                    <span className="font-bold">{bookingInfo.date}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Khung giờ:</span>
                    <span className="font-bold text-blue-600">{bookingInfo.time}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="font-bold text-red-600 text-xl">
                      {bookingInfo.price.toLocaleString()}đ
                    </span>
                  </div>
                  
                  <Button 
                    type="primary" 
                    size="large" 
                    block 
                    onClick={handleBooking} 
                    className="mt-4 bg-red-600 hover:bg-red-500 border-none h-12 font-bold"
                  >
                    ĐẶT CỌC NGAY
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Vui lòng chọn ngày và khung giờ trống ở bảng bên cạnh.</p>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
};

export default PitchDetail;