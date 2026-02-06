import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 1. Thêm import Link
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();

  // Hàm xử lý khi bấm nút Đăng nhập
  const onFinish = (values) => {
    console.log('Success:', values);
    
    // Giả lập đăng nhập thành công
    message.success('Đăng nhập thành công! Đang chuyển trang...');
    
    // Chuyển hướng sang trang Home
    setTimeout(() => {
      navigate('/home'); 
    }, 1000);
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
            {/* 2. Sửa thẻ a thành Link để chuyển trang không bị load lại */}
            <Text>Chưa có tài khoản? <Link to="/register" className="text-blue-500">Đăng ký ngay</Link></Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;