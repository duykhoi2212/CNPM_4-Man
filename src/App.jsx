import { Routes, Route } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Home from './pages/Client/Home';
import PitchDetail from './pages/Client/PitchDetail';
import PitchManager from './pages/Admin/PitchManager';
import Register from './pages/Auth/Register';
import Profile from './pages/Client/Profile';

function App() {
  return (
    <>
      <Routes>
        {/* Đường dẫn mặc định "/" sẽ vào trang Login */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/pitch/:id" element={<PitchDetail />} />
        <Route path="/admin/pitches" element={<PitchManager />} />
        <Route path="/admin/dashboard" element={<PitchManager />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  )
}

export default App