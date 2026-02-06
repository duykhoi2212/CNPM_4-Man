import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Register = () => {
  const navigate = useNavigate();

  const onFinish = (values) => {
    if (values.password !== values.confirmPassword) {
      return message.error('Mật khẩu nhập lại không khớp!');
    }
    console.log('Register Values:', values);
    message.success('Đăng ký thành công! Vui lòng đăng nhập.');
    setTimeout(() => {
      navigate('/'); 
    }, 1500);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="w-96 shadow-lg rounded-lg">
        <div className="text-center mb-6">
          <Title level={3} style={{ margin: 0 }}>Đăng Ký</Title>
          <Text type="secondary">Tạo tài khoản mới</Text>
        </div>

        <Form name="register" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="fullname" rules={[{ required: true, message: 'Nhập họ tên!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
          </Form.Item>

          <Form.Item name="email" rules={[{ required: true, message: 'Nhập Email!' }, { type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item name="phone" rules={[{ required: true, message: 'Nhập SĐT!' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item name="confirmPassword" rules={[{ required: true, message: 'Nhập lại mật khẩu!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block className="bg-green-600 hover:bg-green-500 font-bold">
              Đăng ký ngay
            </Button>
          </Form.Item>
          
          <div className="text-center">
            <Text>Đã có tài khoản? <Link to="/" className="text-blue-500">Đăng nhập</Link></Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;