import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Search, Filter, Plus, Download, Trash2, Edit, Eye, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const UserManagement: React.FC = () => {
  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        {/* 左侧筛选栏 (20%) */}
        <div className="w-full lg:w-1/5 bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-gray-700 font-bold">
            <Filter className="w-5 h-5" />
            <h3>筛选条件</h3>
          </div>
          
          <div className="space-y-5 flex-1 overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">用户状态</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" defaultChecked />
                  正常
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                  已禁用
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">体质类型</label>
              <select className="w-full text-sm border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                <option>全部类型</option>
                <option>阴虚体质</option>
                <option>阳虚体质</option>
                <option>湿热体质</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">注册时间</label>
              <input type="date" className="w-full text-sm border-gray-300 rounded-lg focus:ring-primary focus:border-primary mb-2" />
              <input type="date" className="w-full text-sm border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4">
            <button className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
              应用筛选
            </button>
            <button className="w-full py-2 text-gray-500 text-sm mt-2 hover:text-gray-700">
              重置
            </button>
          </div>
        </div>

        {/* 中间用户列表 (70%) */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          {/* 列表头部工具栏 */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="搜索用户名/手机号..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="flex gap-2">
              <span className="text-sm text-gray-500">共找到 <strong className="text-gray-900">1,248</strong> 位用户</span>
            </div>
          </div>

          {/* 表格 */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">ID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">用户名</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">手机号</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">体质类型</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">状态</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">#100{i}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">User_{i}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">138****000{i}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">阴虚体质</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">正常</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1 text-gray-400 hover:text-primary transition-colors" title="查看"><Eye className="w-4 h-4" /></button>
                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="编辑"><Edit className="w-4 h-4" /></button>
                        <button className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="禁用"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 底部统计与分页 */}
          <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-xl">
            <div className="flex gap-6 text-xs text-gray-500">
              <span>总用户数: <strong className="text-gray-900">12,450</strong></span>
              <span>今日活跃: <strong className="text-green-600">342</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-600">1 / 45</span>
              <button className="p-1 rounded hover:bg-gray-200"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* 右侧快捷操作 (10%) */}
        <div className="w-full lg:w-[10%] flex flex-col gap-4">
          <button className="flex flex-col items-center justify-center gap-2 p-4 bg-primary text-white rounded-xl shadow-sm hover:bg-green-600 transition-colors">
            <Plus className="w-6 h-6" />
            <span className="text-xs font-medium">新增用户</span>
          </button>
          
          <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white text-gray-700 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            <Download className="w-6 h-6" />
            <span className="text-xs font-medium">导出报表</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white text-gray-700 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-xs font-medium">批量操作</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;