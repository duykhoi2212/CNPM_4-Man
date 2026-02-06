import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import hook điều hướng
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate(); // 2. Khai báo hook để sử dụng

  // Hàm xử lý khi bấm nút Đăng nhập
  const onFinish = (values) => {
    console.log('Success:', values);
    
    // Giả lập đăng nhập thành công
    message.success('Đăng nhập thành công! Đang chuyển trang...');
    
    // 3. Chuyển hướng sang trang Home
    setTimeout(() => {
      navigate('/home'); 
    }, 1000); // Đợi 1 giây cho user đọc thông báo rồi mới chuyển
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="w-96 shadow-lg rounded-lg">
        <div className="text-center mb-6">
          <Title level={3} style={{ margin: 0 }}>Đăng Nhập</Title>
          <Text type="secondary">Quản lý đặt sân bóng đá</Text>
        </div>

        <Form
          name="login_form"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tài khoản!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Tài khoản" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Mật khẩu" 
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block className="bg-blue-600 hover:bg-blue-500">
              Đăng nhập
            </Button>
          </Form.Item>
          
          <div className="text-center">
            <Text>Chưa có tài khoản? <a href="#" className="text-blue-500">Đăng ký ngay</a></Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;