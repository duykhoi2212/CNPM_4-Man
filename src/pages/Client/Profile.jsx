import React, { useState } from 'react';
import { Card, Avatar, Button, Table, Tag, Typography, Modal, message, Form, Input } from 'antd';
import { UserOutlined, EditOutlined, HistoryOutlined, LogoutOutlined, ExclamationCircleOutlined, PhoneOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';

const { Title, Text } = Typography;
const { confirm } = Modal;

// Dữ liệu lịch sử giả lập
const INITIAL_HISTORY = [
  { key: '1', date: '20/02/2026', time: '17:30 - 19:00', pitch: 'Sân DAU 1 (Sân 5)', price: 200000, status: 'Sắp tới' },
  { key: '2', date: '10/02/2026', time: '05:00 - 06:30', pitch: 'Sân DAU 2 (Sân 7)', price: 300000, status: 'Đã hoàn thành' },
  { key: '3', date: '01/02/2026', time: '19:00 - 20:30', pitch: 'Sân VIP Futsal', price: 250000, status: 'Đã hủy' },
];

const Profile = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(INITIAL_HISTORY);
  
  // 1. STATE QUẢN LÝ THÔNG TIN USER
  const [userInfo, setUserInfo] = useState({
    fullname: 'Nguyễn Văn An',
    email: 'an.nguyen@dau.edu.vn',
    phone: '0905 123 456',
    studentClass: '21CNTT',
    address: 'Hải Châu, Đà Nẵng'
  });

  // 2. STATE QUẢN LÝ MODAL CHỈNH SỬA
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm(); // Hook để thao tác với form

  // --- HÀM XỬ LÝ HỦY SÂN (Cũ) ---
  const handleCancel = (bookingId) => {
    confirm({
      title: 'Bạn có chắc chắn muốn hủy lịch đặt này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Đồng ý hủy',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk() {
        const newHistory = history.map(item => item.key === bookingId ? { ...item, status: 'Đã hủy' } : item);
        setHistory(newHistory);
        message.success('Đã hủy lịch đặt sân thành công!');
      },
    });
  };

  // --- 3. HÀM MỞ MODAL SỬA THÔNG TIN ---
  const showEditModal = () => {
    // Đổ dữ liệu hiện tại vào form
    form.setFieldsValue(userInfo);
    setIsEditModalOpen(true);
  };

  // --- 4. HÀM LƯU THÔNG TIN MỚI ---
  const handleEditSubmit = (values) => {
    // Cập nhật state userInfo với dữ liệu mới từ form
    setUserInfo({ 
        ...userInfo, 
        fullname: values.fullname,
        phone: values.phone,
        studentClass: values.studentClass,
        address: values.address
    });
    setIsEditModalOpen(false);
    message.success('Cập nhật thông tin thành công!');
  };

  // Cấu hình cột bảng
  const columns = [
    { title: 'Ngày đá', dataIndex: 'date', key: 'date' },
    { title: 'Khung giờ', dataIndex: 'time', key: 'time', render: (text) => <b className="text-blue-600">{text}</b> },
    { title: 'Sân bóng', dataIndex: 'pitch', key: 'pitch', responsive: ['md'] }, // Ẩn trên mobile nếu cần
    { title: 'Giá tiền', dataIndex: 'price', key: 'price', render: (price) => `${price.toLocaleString()}đ` },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'Sắp tới' ? 'blue' : status === 'Đã hoàn thành' ? 'green' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => record.status === 'Sắp tới' && (
        <Button type="primary" danger size="small" onClick={() => handleCancel(record.key)}>Hủy</Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* --- CỘT TRÁI: THÔNG TIN CÁ NHÂN --- */}
        <div className="w-full md:w-1/3">
          <Card className="shadow-md text-center sticky top-24">
            <div className="mb-6">
               <Avatar size={100} icon={<UserOutlined />} className="bg-blue-600 mb-4 shadow-lg" />
               <Title level={3} style={{ margin: 0 }}>{userInfo.fullname}</Title>
               <Text type="secondary">Sinh viên - {userInfo.studentClass}</Text>
            </div>

            <div className="text-left space-y-4 border-t pt-6">
               <div className="flex items-center gap-3">
                  <MailOutlined className="text-gray-400" />
                  <div>
                    <Text type="secondary" className="text-xs block">Email</Text>
                    <Text strong>{userInfo.email}</Text>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <PhoneOutlined className="text-gray-400" />
                  <div>
                    <Text type="secondary" className="text-xs block">Số điện thoại</Text>
                    <Text strong>{userInfo.phone}</Text>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <HomeOutlined className="text-gray-400" />
                  <div>
                    <Text type="secondary" className="text-xs block">Địa chỉ / Lớp</Text>
                    <Text strong>{userInfo.address}</Text>
                  </div>
               </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
                <Button 
                    icon={<EditOutlined />} 
                    type="primary" 
                    ghost 
                    block 
                    onClick={showEditModal} // Bấm nút này mở Modal
                >
                    Chỉnh sửa thông tin
                </Button>
                <Button icon={<LogoutOutlined />} danger block onClick={() => navigate('/')}>Đăng xuất</Button>
            </div>
          </Card>
        </div>

        {/* --- CỘT PHẢI: LỊCH SỬ ĐẶT SÂN --- */}
        <div className="w-full md:w-2/3">
           <Card className="shadow-md" title={<span><HistoryOutlined /> Lịch sử đặt sân</span>}>
              <Table 
                columns={columns} 
                dataSource={history} 
                pagination={{ pageSize: 5 }} 
                scroll={{ x: 600 }} // Hỗ trợ scroll ngang trên điện thoại
              />
           </Card>
        </div>
      </div>

      {/* --- MODAL CHỈNH SỬA THÔNG TIN --- */}
      <Modal
        title="Cập nhật thông tin cá nhân"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null} // Tắt footer mặc định để dùng nút trong Form
        centered
      >
        <Form
            form={form}
            layout="vertical"
            onFinish={handleEditSubmit}
            className="mt-4"
        >
            <Form.Item label="Họ và tên" name="fullname" rules={[{ required: true, message: 'Không được để trống tên!' }]}>
                <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" />
            </Form.Item>

            <Form.Item label="Email (Không thể thay đổi)" name="email">
                <Input prefix={<MailOutlined />} disabled className="bg-gray-100 text-gray-500" />
            </Form.Item>

            <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true, message: 'Nhập số điện thoại!' }]}>
                <Input prefix={<PhoneOutlined />} placeholder="0905..." />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Lớp / Khoa" name="studentClass">
                    <Input placeholder="Ví dụ: 21CNTT" />
                </Form.Item>
                <Form.Item label="Địa chỉ" name="address">
                    <Input prefix={<HomeOutlined />} placeholder="Đà Nẵng" />
                </Form.Item>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit" className="bg-blue-600">Lưu thay đổi</Button>
            </div>
        </Form>
      </Modal>

    </MainLayout>
  );
};

export default Profile;