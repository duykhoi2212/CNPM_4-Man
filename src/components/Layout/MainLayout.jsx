import React from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';

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
          padding: "0 40px",
          height: "64px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
      >
        {/* Logo */}
        <div
          style={{
            color: "white",
            fontSize: "20px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
          onClick={() => navigate('/home')}
        >
          ⚽ DAU FOOTBALL
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
