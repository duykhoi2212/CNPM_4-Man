import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <Layout className="min-h-screen">
      <Header className="flex justify-between items-center bg-blue-700 px-8">
        {/* Logo / Tên App */}
        <div className="text-white text-xl font-bold cursor-pointer" onClick={() => navigate('/home')}>
          ⚽ DAU FOOTBALL
        </div>

        {/* Menu bên phải */}
        <div className="flex items-center gap-4">
          <span className="text-white"><UserOutlined /> Sinh viên DAU</span>
          <Button 
            type="text" 
            className="text-white hover:bg-blue-600"
            icon={<LogoutOutlined />}
            onClick={() => navigate('/')} // Quay về Login
          >
            Đăng xuất
          </Button>
        </div>
      </Header>

      {/* Phần nội dung thay đổi theo từng trang */}
      <Content className="p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </Content>

      <Footer className="text-center bg-gray-200">
        DAU Football Booking ©2026 - Đồ án Tốt nghiệp CNTT
      </Footer>
    </Layout>
  );
};

export default MainLayout;