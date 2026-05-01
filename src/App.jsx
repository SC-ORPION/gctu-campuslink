import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Public Pages
import Home from './pages/Home';
import Hostels from './pages/Hostels';
import HostelDetail from './pages/HostelDetail';
import PastQuestions from './pages/PastQuestions';
import About from './pages/About';
import Announcements from './pages/Announcements';

// Admin Pages
import AdminLayout from './pages/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import HostelsManage from './pages/Admin/HostelsManage';
import QuestionsManage from './pages/Admin/QuestionsManage';
import ReportsManage from './pages/Admin/ReportsManage';
import AdminsManage from './pages/Admin/AdminsManage';
import AnnouncementsManage from './pages/Admin/AnnouncementsManage';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="hostels" element={<Hostels />} />
          <Route path="hostel/:id" element={<HostelDetail />} />
          <Route path="past-questions" element={<PastQuestions />} />
          <Route path="about" element={<About />} />
          <Route path="announcements" element={<Announcements />} />
        </Route>

        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="hostels" element={<HostelsManage />} />
          <Route path="questions" element={<QuestionsManage />} />
          <Route path="reports" element={<ReportsManage />} />
          <Route path="admins" element={<AdminsManage />} />
          <Route path="announcements" element={<AnnouncementsManage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
