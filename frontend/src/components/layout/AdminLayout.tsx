import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, LogOut, Bell } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 侧边导航栏 */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold mr-3">AI</div>
          <span className="text-lg font-bold tracking-tight">MedSafe Admin</span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <Link 
            to="/admin/dashboard" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/dashboard') ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            仪表盘
          </Link>
          <Link 
            to="/admin/users" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/users') ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <Users className="w-5 h-5" />
            用户管理
          </Link>
          <Link 
            to="/admin/feedback" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/feedback') ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <MessageSquare className="w-5 h-5" />
            药物反馈
          </Link>
          <Link 
            to="/admin/settings" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/settings') ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <Settings className="w-5 h-5" />
            系统设置
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {location.pathname === '/admin/users' ? '用户管理' : '仪表盘'}
          </h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">管理员</span>
            </div>
          </div>
        </header>

        {/* 内容 */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;