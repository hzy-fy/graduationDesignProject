import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import Body3D from './pages/Body3D';
import UserManagement from './pages/admin/UserManagement';

import Body2D from './pages/Body2D';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/3d-body" element={<Body3D />} />
        <Route path="/2d-body" element={<Body2D />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/dashboard" element={<div className="p-8">仪表盘 (开发中)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;