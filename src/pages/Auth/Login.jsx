import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Modal, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';

const BANNER_IMAGE =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2070&auto=format&fit=crop";

const Login = () => {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const onFinish = (values) => {
    message.success('Đăng nhập thành công!');
    setTimeout(() => {
      setIsLoginModalOpen(false);
      if (values.username === 'admin') {
        navigate('/admin/pitches');
      } else {
        navigate('/home');
      }
    }, 1000);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >

      {/* PHẦN TRÊN */}
      <div
        style={{
          flex: "0 0 10%",
          padding: "10px",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              background: "#16a34a",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "22px"
            }}
          >
            ⚽
          </div>
          <h1 style={{ margin: 0 }}>DAU SPORT</h1>
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <Button
            size="large"
            icon={<LoginOutlined />}
            onClick={() => setIsLoginModalOpen(true)}
          >
            Đăng nhập
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<UserAddOutlined />}
            onClick={() => navigate('/register')}
          >
            Đăng ký
          </Button>
        </div>
      </div>

      {/* PHẦN DƯỚI - BANNER FULL WIDTH */}
      <div
        style={{
          flex: "1",
          overflow: "hidden"
        }}
      >
        <img
          src={BANNER_IMAGE}
          alt="Banner"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />
      </div>

      {/* MODAL */}
      <Modal
        title="ĐĂNG NHẬP"
        open={isLoginModalOpen}
        onCancel={() => setIsLoginModalOpen(false)}
        footer={null}
        centered
      >
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true, message: 'Nhập tài khoản!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Tài khoản / Email" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Xác nhận
          </Button>
        </Form>
      </Modal>

    </div>
  );
};

export default Login;
