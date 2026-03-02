import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { authService } from '../services/auth';
import { useAuthStore } from '../store/authStore';

const Home: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSendCode = async () => {
    if (!phone) {
      alert('请输入手机号');
      return;
    }
    try {
      setLoading(true);
      await authService.sendCode(phone);
      setCodeSent(true);
      alert('验证码已发送 (开发环境默认 8888)');
    } catch (error) {
      alert('发送验证码失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !code) {
      alert('请输入手机号和验证码');
      return;
    }
    
    try {
      setLoading(true);
      const data = await authService.login(phone, code);
      
      // Store user data
      login(data.token, { id: data.user_id, phone: data.phone, constitution: data.constitution }, data.is_first_login);
      localStorage.setItem('token', data.token);
      
      // Redirect logic
      if (data.is_first_login) {
        navigate('/constitution-analysis');
      } else {
        navigate('/analysis');
      }
    } catch (error) {
      alert('登录失败，请检查验证码');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background font-sans text-secondary">
      {/* PC 端左侧 / 移动端顶部：宣传区 (60%) */}
      <div className="w-full md:w-[60%] bg-surface relative flex flex-col justify-center items-start p-8 md:p-16 lg:p-24 overflow-hidden">
        {/* 背景装饰（模拟宣传图效果） */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-white opacity-50 z-0"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Logo */}
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-10 flex items-center gap-2">
          <img src="/favicon.png" alt="MedSafe AI" className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-bold tracking-tight">MedSafe AI</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            AI 分析体质，<br />
            <span className="text-primary">精准规避</span> 药物禁忌
          </h1>
          <p className="text-lg text-gray-600 mb-8 md:mb-12">
            结合传统中医体质学说与现代 AI 技术，为您提供个性化的用药安全建议。
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>智能识别体质类型（阴虚、阳虚、湿热等）</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>多维度药物禁忌分析（体质、配伍、特殊人群）</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>3D 可视化人体经脉穴位知识</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/analysis')}
              className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-green-600 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2"
            >
              开始体质分析 <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/analysis')}
              className="px-8 py-3 border border-gray-300 bg-white rounded-lg font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center"
            >
              立即查询药物
            </button>
          </div>
        </div>
        
      </div>

      {/* PC 端右侧 / 移动端底部：登录表单 (40%) */}
      <div className="w-full md:w-[40%] bg-white flex flex-col justify-center p-8 md:p-12 lg:p-16 shadow-2xl z-20">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">欢迎使用 MedSafe AI</h2>
            <div className="text-sm text-gray-500">
               手机验证码快捷登录/注册
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">手机号</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="请输入手机号"
                required
              />
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">验证码</label>
                    <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="请输入验证码"
                    required
                    />
                </div>
                <div className="flex items-end">
                    <button 
                        type="button" 
                        onClick={handleSendCode}
                        disabled={loading || codeSent}
                        className="px-4 py-2 mb-[1px] h-[42px] text-primary border border-primary rounded-lg text-sm hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {codeSent ? '已发送' : '获取验证码'}
                    </button>
                </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-secondary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors mt-4 disabled:opacity-70"
            >
              {loading ? '登录中...' : '登录 / 注册'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-xs text-gray-400 md:hidden">
            © 2024 MedSafe AI. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
