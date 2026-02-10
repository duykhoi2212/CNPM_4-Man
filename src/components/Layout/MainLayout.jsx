import React from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons'; 

const { Header, Content, Footer } = Layout;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: "100vh" }}>

      {/* HEADER */}
      <Header
        style={{
          background: "#e22538",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between", // 2. Quan trọng: Đẩy 2 phần tử ra 2 đầu
          padding: "0 40px",
          height: "64px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
      >
        {/* Logo bên trái */}
        <div
          style={{
            color: "white",
            fontSize: "20px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
          onClick={() => navigate('/home')}
        >
          <span>⚽</span> DAU FOOTBALL
        </div>

        {/* User Profile bên phải - MỚI THÊM */}
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                background: "rgba(255,255,255,0.15)", // Nền mờ nhẹ cho đẹp
                padding: "5px 15px",
                borderRadius: "30px",
                transition: "all 0.3s"
            }}
            onClick={() => navigate('/profile')} // Bấm vào là chuyển trang Profile
        >
            <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "white",
                color: "#e22538",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <UserOutlined />
            </div>
            <span style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>
                Nguyễn Văn An
            </span>
        </div>

      </Header>

      {/* CONTENT */}
      <Content
        style={{
          padding: "40px",
          background: "#f3f4f6",
          flex: 1
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto"
          }}
        >
          {children}
        </div>
      </Content>

      {/* FOOTER */}
      <Footer
        style={{
          textAlign: "center",
          background: "#e5e7eb",
          color: "#6b7280"
        }}
      >
        DAU Football Booking ©2026 - Đồ án Chuyên Ngành Công Nghệ Phần Mềm
      </Footer>

    </Layout>
  );
};

export default MainLayout;