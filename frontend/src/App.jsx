import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <main className="min-h-screen bg-gray-50">
        <AppRouter />
      </main>
    </BrowserRouter>
  );
}

export default App;