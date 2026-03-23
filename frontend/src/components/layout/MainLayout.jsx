import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Phần nội dung chính sẽ tự động thay đổi theo URL */}
      <main className="flex-grow bg-gray-50">
        <Outlet /> 
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;