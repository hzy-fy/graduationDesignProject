import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search, User, Activity, Box, MessageCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">AI</div>
            <span className="text-xl font-bold tracking-tight text-secondary">MedSafe AI</span>
          </Link>

          {/* PC端中间导航 */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/analysis" 
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/analysis') ? 'text-primary' : 'text-gray-600'}`}
            >
              药物分析
            </Link>
            <Link 
              to="/constitution-analysis" 
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/constitution-analysis') ? 'text-primary' : 'text-gray-600'}`}
            >
              体质辨识
            </Link>
            <Link 
              to="/3d-body" 
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/3d-body') ? 'text-primary' : 'text-gray-600'}`}
            >
              3D人体
            </Link>
          </nav>

          {/* 搜索框 (PC) */}
          <div className="hidden md:flex items-center relative w-64">
            <Search className="w-4 h-4 absolute left-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索药物..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* 右侧用户菜单 (PC) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-700">{user.phone}</span>
                    <span className="text-xs text-gray-400">已登录</span>
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <User className="w-4 h-4" />
                </div>
                <button 
                  onClick={() => { logout(); window.location.href = '/'; }}
                  className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors ml-2"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-600 transition-colors">
                登录 / 注册
              </Link>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <button className="md:hidden p-2 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50">
        <Link to="/" className="flex flex-col items-center gap-1 text-gray-400">
          <Box className="w-6 h-6" />
          <span className="text-[10px]">首页</span>
        </Link>
        <Link to="/analysis" className={`flex flex-col items-center gap-1 ${isActive('/analysis') ? 'text-primary' : 'text-gray-400'}`}>
          <Activity className="w-6 h-6" />
          <span className="text-[10px]">分析</span>
        </Link>
        <Link to="/3d-body" className={`flex flex-col items-center gap-1 ${isActive('/3d-body') ? 'text-primary' : 'text-gray-400'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px]">3D</span>
        </Link>
        <Link to="#" className="flex flex-col items-center gap-1 text-gray-400">
          <MessageCircle className="w-6 h-6" />
          <span className="text-[10px]">问答</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;