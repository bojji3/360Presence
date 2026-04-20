import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student-dashboard/" element={<StudentDashboard />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="*" element={<StudentDashboard />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;