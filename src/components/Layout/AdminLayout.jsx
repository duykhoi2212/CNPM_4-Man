import React from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import { 
  DashboardOutlined, 
  DatabaseOutlined, 
  CalendarOutlined, 
  LogoutOutlined,
  BarChartOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  // Menu bên trái
  const items = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: '/admin/pitches', icon: <DatabaseOutlined />, label: 'Quản lý sân bóng' }, // US-007
    { key: '/admin/bookings', icon: <CalendarOutlined />, label: 'Quản lý lịch đặt' },
    { key: '/admin/revenue', icon: <BarChartOutlined />, label: 'Báo cáo doanh thu' }, // US-020
  ];

  return (
    <Layout className="min-h-screen">
      <Sider collapsible breakpoint="lg">
        <div className="h-16 flex items-center justify-center bg-blue-900">
          <h1 className="text-white font-bold text-lg">⚽ ADMIN DAU</h1>
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          defaultSelectedKeys={[location.pathname]} 
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span className="mr-4 font-bold text-gray-700">Xin chào, Quản trị viên</span>
          <Button icon={<LogoutOutlined />} onClick={() => navigate('/')} danger>
            Đăng xuất
          </Button>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, background: token.colorBgContainer, borderRadius: 8 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;