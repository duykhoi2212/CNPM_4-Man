import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      {/* Có thể thêm Header chung ở đây sau */}
      <main className="min-h-screen bg-gray-50">
        <AppRouter />
      </main>
      {/* Có thể thêm Footer chung ở đây sau */}
    </BrowserRouter>
  );
}

export default App;