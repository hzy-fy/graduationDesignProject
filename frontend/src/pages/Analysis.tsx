import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Search, AlertTriangle, ShieldCheck, Info, Share2, Bookmark, ChevronRight } from 'lucide-react';

const Analysis: React.FC = () => {
  const [drugName, setDrugName] = useState('');
  const [hasResult, setHasResult] = useState(false);

  const handleAnalyze = () => {
    setHasResult(true);
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        {/* 左侧：用户信息与快捷入口 (PC: 20%) */}
        <aside className="hidden lg:block lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">当前体质</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-50 text-primary text-sm rounded-full border border-green-100">阴虚体质</span>
              <span className="px-3 py-1 bg-yellow-50 text-yellow-600 text-sm rounded-full border border-yellow-100">过敏体质</span>
            </div>
            <button className="mt-4 text-xs text-primary hover:underline flex items-center">
              重新评测 <ChevronRight className="w-3 h-3 ml-1" />
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">常用药物</h3>
            <ul className="space-y-2 text-sm">
              <li className="cursor-pointer hover:text-primary transition-colors">阿司匹林</li>
              <li className="cursor-pointer hover:text-primary transition-colors">布洛芬</li>
              <li className="cursor-pointer hover:text-primary transition-colors">连花清瘟</li>
            </ul>
          </div>
        </aside>

        {/* 中间：核心分析区 (PC: 60%) */}
        <section className="col-span-1 lg:col-span-7 space-y-6 pb-20 md:pb-0">
          {/* 输入区 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4">药物禁忌分析</h2>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-green-50 rounded-lg focus:border-primary outline-none transition-colors text-lg"
                placeholder="请输入药物名称，如：阿司匹林"
              />
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                关联我的体质数据
              </label>
            </div>

            <button 
              onClick={handleAnalyze}
              className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg shadow-green-200"
            >
              开始智能分析
            </button>
          </div>

          {/* 结果区 */}
          {hasResult && (
            <div className="space-y-4 animate-fade-in">
              {/* 药物基本信息 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">阿司匹林肠溶片</h3>
                    <p className="text-sm text-gray-500 mt-1">非甾体抗炎药 | 解热镇痛</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-primary">
                      <Bookmark className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-primary">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold">通用剂量：</span> 成人一次 300-600mg，一日 3 次，必要时每 4 小时 1 次。
                </div>
              </div>

              {/* 禁忌结果 - 核心 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 体质禁忌 */}
                <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-3 text-red-700 font-bold">
                    <AlertTriangle className="w-5 h-5" />
                    <h4>体质相关禁忌</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>阴虚体质者慎用，可能加重口干、咽燥症状。</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>过敏体质者需进行皮试，存在高风险过敏反应。</span>
                    </li>
                  </ul>
                </div>

                {/* 配伍禁忌 */}
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 mb-3 text-orange-700 font-bold">
                    <Info className="w-5 h-5" />
                    <h4>配伍禁忌</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-orange-800">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>避免与布洛芬同时服用，可能降低心血管保护作用。</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 安全提示 */}
              <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-3 text-green-700 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                  <h4>安全用药建议</h4>
                </div>
                <p className="text-sm text-green-800 leading-relaxed">
                  基于您的体质分析，建议在饭后服用以减少胃肠道刺激。如出现胃痛、黑便等症状，请立即停药并就医。建议定期监测凝血功能。
                </p>
              </div>

              {/* 底部反馈 */}
              <div className="flex justify-end gap-3 text-sm text-gray-400 mt-4">
                <button className="hover:text-primary">结果不准确?</button>
                <span>|</span>
                <button className="hover:text-primary">补充信息</button>
              </div>
            </div>
          )}
        </section>

        {/* 右侧：推荐与知识 (PC: 20%) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">相关推荐</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0"></div>
                <div>
                  <h4 className="text-sm font-medium">布洛芬缓QP</h4>
                  <p className="text-xs text-gray-500">同类替代药物</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0"></div>
                <div>
                  <h4 className="text-sm font-medium">对乙酰氨基酚</h4>
                  <p className="text-xs text-gray-500">温和解热镇痛</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-xl border border-primary/10">
            <h3 className="font-bold text-primary mb-2">每日健康知识</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              阴虚体质者饮食宜清淡，多吃滋阴润燥的食物，如银耳、百合、梨等，少吃辛辣刺激性食物。
            </p>
          </div>
        </aside>
      </div>
    </Layout>
  );
};

export default Analysis;