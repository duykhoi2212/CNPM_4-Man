import React, { useState } from 'react'; // 1. Thêm useState
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Button, Image, Typography, Modal, message } from 'antd'; // 2. Thêm Modal, message
import { EnvironmentOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import BookingSchedule from '../../components/Schedule/BookingSchedule'; // 3. Import Component Lịch

const { Title, Paragraph } = Typography;

// Dữ liệu giả lập (Sau này sẽ gọi API lấy chi tiết theo ID)
const MOCK_DATA = {
  1: { 
    id: 1, 
    name: "Sân DAU 1 (Sân 5)", 
    type: "5 người", 
    address: "Khu thể thao ĐH Kiến Trúc - 566 Núi Thành, Đà Nẵng",
    description: "Sân cỏ nhân tạo chất lượng cao, mới thay cỏ năm 2025. Hệ thống đèn chiếu sáng tiêu chuẩn, có căng tin phục vụ nước uống.",
    images: [
      "https://conhantao.net/wp-content/uploads/2019/12/kich-thuoc-san-bong-da-5-nguoi.jpg",
      "https://thegioithethao.vn/upload_images/images/2021/12/03/kich-thuoc-san-bong-da-5-nguoi-tieu-chuan-fifa.jpg"
    ],
    price: ["200.000đ/h (05:00 - 16:00)", "300.000đ/h (16:00 - 22:00)"]
  },
  2: { 
    id: 2, 
    name: "Sân DAU 2 (Sân 7)", 
    type: "7 người", 
    address: "Khu thể thao ĐH Kiến Trúc - 566 Núi Thành, Đà Nẵng",
    description: "Sân 7 người rộng rãi, phù hợp đá giao hữu công ty. Có chỗ để xe rộng rãi, an ninh tốt.",
    images: [
      "https://phuongthanhngoc.com/media/news/1709_kich-thuoc-san-bong-da-7-nguoi-tieu-chuan-fifa.jpg"
    ],
    price: ["300.000đ/h (05:00 - 16:00)", "450.000đ/h (16:00 - 22:00)"]
  },
  3: { 
    id: 3, 
    name: "Sân VIP Futsal", 
    type: "Futsal", 
    address: "Nhà thi đấu đa năng DAU",
    description: "Sân sàn gỗ tiêu chuẩn thi đấu, có mái che, không lo mưa nắng. Phù hợp các giải đấu chuyên nghiệp.",
    images: [
      "https://thicongsanthethao.com.vn/Content/Images/kich-thuoc-san-bong-da-futsal-min.jpg"
    ],
    price: ["250.000đ/h (Cả ngày)"]
  }
};

const PitchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const pitch = MOCK_DATA[id];

  // 4. State lưu thông tin đặt sân (Ngày, Giờ, Giá)
  const [bookingInfo, setBookingInfo] = useState(null);

  if (!pitch) return <div className="text-center mt-20">Không tìm thấy sân bóng!</div>;

  // 5. Hàm xử lý khi người dùng chọn một ô giờ từ Component con
  const onSelectSlot = (slot, date) => {
    // Tách giá tiền giả lập (Lấy số đầu tiên trong chuỗi giá để tính toán)
    // Thực tế bạn sẽ có logic tính tiền phức tạp hơn dựa trên giờ cao điểm
    const tempPrice = pitch.price[0]; 

    setBookingInfo({
      pitchName: pitch.name,
      date: date.format('DD/MM/YYYY'), // Format ngày cho đẹp
      time: slot,
      price: tempPrice
    });
  };

  // 6. Hàm xử lý khi bấm nút "Xác nhận đặt sân"
  const handleBooking = () => {
    Modal.confirm({
      title: 'Xác nhận đặt sân?',
      content: (
        <div>
          <p>Sân: <b>{bookingInfo?.pitchName}</b></p>
          <p>Ngày: <b>{bookingInfo?.date}</b></p>
          <p>Khung giờ: <b className="text-blue-600">{bookingInfo?.time}</b></p>
          <p>Giá tạm tính: <b>{bookingInfo?.price}</b></p>
          <p className="text-red-500 italic text-xs">*Vui lòng đến đúng giờ.</p>
        </div>
      ),
      onOk() {
        // Sau này gọi API POST /booking ở đây
        message.success('Đặt sân thành công!');
        navigate('/home'); // Quay về trang chủ
      }
    });
  };

  return (
    <MainLayout>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/home')} 
        className="mb-4"
      >
        Quay lại danh sách
      </Button>

      {/* Phần 1: Thông tin chi tiết sân */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={14}>
             <Image src={pitch.images[0]} className="rounded-lg w-full object-cover" height={400} />
             <div className="flex gap-2 mt-4 overflow-x-auto">
                {pitch.images.map((img, index) => (
                  <Image key={index} src={img} width={100} className="rounded-md cursor-pointer" />
                ))}
             </div>
          </Col>

          <Col xs={24} md={10}>
            <Tag color="blue" className="mb-2 text-lg px-3 py-1">{pitch.type}</Tag>
            <Title level={2} style={{ marginTop: 0 }}>{pitch.name}</Title>
            
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <EnvironmentOutlined /> <span>{pitch.address}</span>
            </div>

            <Paragraph className="text-gray-500 text-justify">
              {pitch.description}
            </Paragraph>

            <Card title="Bảng giá thuê sân" size="small" className="bg-gray-50 mb-6">
              <ul className="list-disc pl-4 mb-0">
                {pitch.price.map((p, idx) => (
                   <li key={idx} className="text-gray-700 font-medium">{p}</li>
                ))}
              </ul>
            </Card>

            <div className="flex gap-4 justify-center text-gray-500 text-sm">
               <span><CheckCircleOutlined className="text-green-500"/> Có bãi đỗ xe</span>
               <span><CheckCircleOutlined className="text-green-500"/> Free nước lọc</span>
               <span><CheckCircleOutlined className="text-green-500"/> Cho thuê giày</span>
            </div>
          </Col>
        </Row>
      </div>

      {/* Phần 2: Lịch đặt sân (Mới thêm) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <Title level={3} className="mb-4">📅 Xem lịch trống & Đặt sân</Title>
        <Row gutter={24}>
          {/* Cột trái: Component Lịch */}
          <Col xs={24} md={16}>
            <BookingSchedule onSelectSlot={onSelectSlot} />
          </Col>
          
          {/* Cột phải: Form xác nhận (Booking Cart) */}
          <Col xs={24} md={8}>
            <Card 
              className="mt-6 md:mt-0 bg-blue-50 border-blue-200 shadow-sm" 
              title="🎫 Thông tin đặt sân"
            >
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
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-bold text-red-600 text-xl">{bookingInfo.price}</span>
                  </div>
                  
                  <Button 
                    type="primary" 
                    size="large" 
                    block 
                    onClick={handleBooking} 
                    className="mt-4 bg-red-600 hover:bg-red-500 border-none h-12 font-bold"
                  >
                    XÁC NHẬN ĐẶT SÂN
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