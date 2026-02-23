import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Info } from 'lucide-react';

// 器官坐标数据（基于百分比）
const ORGANS = [
  { "name": "腮腺", "style": { "left": "85%", "top": "11%", "width": "10%", "height": "4%" } },
  { "name": "咽", "style": { "left": "90%", "top": "16%", "width": "5%", "height": "4%" } },
  { "name": "喉", "style": { "left": "3%", "top": "20%", "width": "7%", "height": "4%" } },
  { "name": "气管", "style": { "left": "86%", "top": "22%", "width": "9%", "height": "4%" } },
  { "name": "支气管", "style": { "left": "3%", "top": "28%", "width": "13%", "height": "4%" } },
  { "name": "左肺", "style": { "left": "86%", "top": "31%", "width": "9%", "height": "4%" } },
  { "name": "右肺", "style": { "left": "3%", "top": "38%", "width": "9%", "height": "4%" } },
  { "name": "胃", "style": { "left": "91%", "top": "47%", "width": "4%", "height": "4%" } },
  { "name": "肝", "style": { "left": "3%", "top": "53%", "width": "5%", "height": "4%" } },
  { "name": "脾脏", "style": { "left": "87%", "top": "58%", "width": "8%", "height": "4%" } },
  { "name": "胆", "style": { "left": "3%", "top": "60%", "width": "4%", "height": "4%" } },
  { "name": "胰腺", "style": { "left": "86%", "top": "63%", "width": "9%", "height": "4%" } },
  { "name": "肾", "style": { "left": "3%", "top": "65%", "width": "4%", "height": "4%" } },
  { "name": "大肠", "style": { "left": "3%", "top": "73%", "width": "9%", "height": "4%" } },
  { "name": "小肠", "style": { "left": "86%", "top": "74%", "width": "9%", "height": "4%" } },
  { "name": "膀胱", "style": { "left": "86%", "top": "83%", "width": "9%", "height": "4%" } }
];

const Body2D: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  
  // 模拟向后端请求数据
  const fetchOrganData = async (organName: string) => {
    console.log(`Fetching data for: ${organName}`);
    // TODO: 替换为真实的 API 请求
    setSelectedOrgan(organName);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 左侧：2D 模型展示区 (70%) */}
      <div className="w-[70%] relative bg-gray-50 flex items-center justify-center overflow-hidden">
        {/* 顶部导航 */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white/80 text-gray-700 rounded-full hover:bg-primary hover:text-white transition-colors shadow-sm backdrop-blur-sm border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-gray-800 font-bold text-lg tracking-wider">2D 人体器官图谱</h1>
        </div>

        {/* 2D 图片容器 */}
        <div className="relative h-full w-full flex items-center justify-center p-8">
          <div className="relative inline-block h-full">
            <img 
              src="/models/model01.jpeg" 
              alt="Human Body 2D" 
              className="h-full w-auto object-contain"
            />
            
            {/* 器官热区标记 */}
            {ORGANS.map((organ, index) => (
              <button
                key={index}
                onClick={() => fetchOrganData(organ.name)}
                className="absolute bg-transparent hover:bg-primary/20 border-2 border-transparent hover:border-primary rounded cursor-pointer transition-colors z-10"
                style={organ.style}
                title={organ.name}
              />
            ))}
          </div>
        </div>

        {/* 底部操作提示 */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs md:text-sm bg-white/80 px-4 py-2 rounded-full shadow-sm backdrop-blur-sm border border-gray-100 pointer-events-none">
          点击图片两侧的文字查看器官详情
        </div>
      </div>

      {/* 右侧：相关说明 (30%) */}
      <div className="w-[30%] h-full flex flex-col border-l border-gray-200 shadow-xl relative z-20">
        {selectedOrgan ? (
          <div className="flex flex-col h-full">
            {/* 头部：白色背景 (60%) */}
            <div className="h-[60%] bg-white p-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">{selectedOrgan}</h2>
                <button 
                  onClick={() => setSelectedOrgan(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">器官简介</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {/* 这里将来替换为从后端获取的真实数据 */}
                    这里是关于<span className="font-bold text-primary mx-1">{selectedOrgan}</span>的详细生理结构与功能介绍。该器官在人体新陈代谢中起着至关重要的作用。
                  </p>
                </div>

                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    经脉关联
                  </h3>
                  <p className="text-gray-800 font-medium text-lg">
                    足厥阴肝经
                  </p>
                </div>
              </div>
            </div>

            {/* 底部：绿色背景 (40%) */}
            <div className="h-[40%] bg-gradient-to-br from-primary to-green-600 p-8 text-white overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-white/20 pb-2">
                <Info className="w-5 h-5" />
                药物禁忌与健康提示
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                  <h4 className="font-semibold text-green-100 mb-1">用药禁忌</h4>
                  <p className="text-sm text-white/90 leading-relaxed">
                    服用对{selectedOrgan}有潜在毒性的药物时需严格遵医嘱。避免过量使用抗生素及非甾体抗炎药。
                  </p>
                </div>

                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                  <h4 className="font-semibold text-green-100 mb-1">体质调理</h4>
                  <p className="text-sm text-white/90 leading-relaxed">
                    建议保持规律作息，避免熬夜。饮食宜清淡，少食辛辣油腻，多补充维生素。
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Info className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">未选择器官</h3>
            <p className="text-sm">请点击左侧模型上的标记点<br/>查看详细信息</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Body2D;
