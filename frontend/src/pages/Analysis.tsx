import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Search, AlertTriangle, ShieldCheck, Info, Share2, Bookmark, ChevronRight, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { drugService } from '../services/drug';
import { useAuthStore } from '../store/authStore';

const Analysis: React.FC = () => {
  const [drugName, setDrugName] = useState('');
  const [constitution, setConstitution] = useState('平和质');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const { user } = useAuthStore();
  const [thinkingText, setThinkingText] = useState('');
  // const [streamText, setStreamText] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      const texts = [
        "正在分析您的体质特征...",
        "正在检索药物禁忌数据...",
        "正在比对药理冲突...",
        "正在生成专业建议..."
      ];
      let index = 0;
      setThinkingText(texts[0]);
      interval = setInterval(() => {
        index = (index + 1) % texts.length;
        setThinkingText(texts[index]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (user?.constitution) {
        // 如果用户的体质包含在选项中，或者是类似 "平和质 (倾向)" 的格式，我们需要处理一下
        // 简单处理：如果 user.constitution 包含某个选项，就选中它
        const baseType = constitutionOptions.find(c => user.constitution?.includes(c));
        if (baseType) {
            setConstitution(baseType);
        }
    }
  }, [user]);

  const handleAnalyze = async () => {
    if (!drugName.trim()) {
      alert('请输入药物名称');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const data = await drugService.analyze(drugName, constitution);
      console.log("Analysis Result:", data.analysis_result); // Debug log
      setResult(data.analysis_result);
    } catch (error) {
      console.error(error);
      setResult('分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const constitutionOptions = [
    '平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', 
    '湿热质', '血瘀质', '气郁质', '特禀质'
  ];

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        {/* 左侧：用户信息与快捷入口 (PC: 20%) */}
        <aside className="hidden lg:block lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">当前设定体质</h3>
            <select 
              value={constitution}
              onChange={(e) => setConstitution(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              {constitutionOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="mt-2 text-xs text-gray-400">
              * 您可以手动切换体质以模拟不同场景
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">热门查询</h3>
            <ul className="space-y-2 text-sm">
              {['阿司匹林', '布洛芬', '连花清瘟', '六味地黄丸'].map(drug => (
                <li 
                  key={drug}
                  onClick={() => setDrugName(drug)}
                  className="cursor-pointer hover:text-primary transition-colors flex items-center justify-between group"
                >
                  {drug}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* 中间：核心分析区 (PC: 60%) */}
        <section className="col-span-1 lg:col-span-7 space-y-6 pb-20 md:pb-0">
          {/* 输入区 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              药物禁忌智能分析
            </h2>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
               <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={drugName}
                    onChange={(e) => setDrugName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-green-50 rounded-lg focus:border-primary outline-none transition-colors text-lg"
                    placeholder="请输入药物名称，如：阿司匹林"
                  />
               </div>
               
               {/* Mobile constitution select */}
               <div className="md:hidden">
                 <select 
                    value={constitution}
                    onChange={(e) => setConstitution(e.target.value)}
                    className="w-full p-3 border-2 border-green-50 rounded-lg bg-white"
                  >
                    {constitutionOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
               </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg shadow-green-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在检索文献并分析...
                </>
              ) : (
                '开始智能分析'
              )}
            </button>
          </div>

          {/* 分析结果区 */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-gray-500 text-sm animate-pulse">{thinkingText}</p>
            </div>
          ) : result ? (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">分析报告</h3>
                  <p className="text-sm text-gray-500">基于 {constitution} 对 {drugName} 的用药风险评估</p>
                </div>
              </div>
              
              {/* 核心结论摘要 */}
              {result?.risk_level && (
                 <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                   result.input_type === 'Other' ? 'bg-gray-50 border-gray-400 text-gray-800' :
                   result.risk_level === 'high' ? 'bg-red-50 border-red-500 text-red-800' :
                   result.risk_level === 'medium' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                   'bg-green-50 border-green-500 text-green-800'
                 }`}>
                   <div className="flex items-center gap-2 font-bold mb-1">
                     {result.input_type === 'Other' ? <Info className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                     {result.input_type === 'Other' ? '无法识别输入' :
                      result.risk_level === 'high' ? '高风险（不推荐/禁用）' :
                      result.risk_level === 'medium' ? '中风险（慎用/注意）' :
                      '低风险（可以使用）'}
                   </div>
                   <p className="text-sm">{result.summary}</p>
                 </div>
              )}

              {/* 药物类别专属板块 */}
              {result?.input_type === 'DrugClass' && (result.class_analysis || result.representative_drugs) && (
                <div className="mb-6 space-y-4">
                  {result.class_analysis && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="text-md font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <Bookmark className="w-4 h-4" /> 
                        {drugName}：类别整体禁忌
                      </h4>
                      <div className="text-sm text-blue-900 leading-relaxed">
                        <ReactMarkdown>{result.class_analysis}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {result.representative_drugs && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="text-md font-bold text-gray-700 mb-2 flex items-center gap-2">
                         <Share2 className="w-4 h-4" /> 代表性药物禁忌
                      </h4>
                      <div className="prose prose-sm prose-gray max-w-none">
                         <ReactMarkdown>{result.representative_drugs}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 相互作用禁忌板块 */}
              {result?.interactions && result.interactions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" /> 相互作用警示
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.interactions.map((item: any, idx: number) => (
                      <div key={idx} className={`p-3 rounded-lg border text-sm flex flex-col gap-2 ${
                        item.risk === 'high' ? 'bg-red-50 border-red-200 text-red-700' :
                        item.risk === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                        'bg-gray-50 border-gray-200 text-gray-600'
                      }`}>
                        <div className="flex justify-between items-start w-full">
                          <div>
                            <span className="font-bold block mb-1 flex items-center gap-2">
                              {item.name}
                              {item.type && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/50 rounded border border-current opacity-70">
                                  {item.type === 'Food' ? '食物' : item.type === 'Compound' ? '药物类别' : '药物'}
                                </span>
                              )}
                            </span>
                            <span className="text-xs opacity-80 block mb-1">{item.description}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                            item.risk === 'high' ? 'bg-red-200 text-red-800' :
                            item.risk === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {item.risk === 'high' ? '禁用' : item.risk === 'medium' ? '慎用' : '注意'}
                          </span>
                        </div>
                        
                        {/* 如果是化合物/类别，显示具体例子 */}
                        {item.type === 'Compound' && item.examples && (
                          <div className="text-xs bg-white/40 p-2 rounded w-full">
                             <span className="font-semibold mr-1">包含：</span>
                             {item.examples}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="prose prose-green max-w-none">
                <ReactMarkdown>{result?.detail || (typeof result === 'string' ? result : '')}</ReactMarkdown>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center text-sm text-gray-400">
                <span>数据来源：药理学教材、中医体质学、药品说明书</span>
                <div className="flex gap-4">
                  <button className="hover:text-primary flex items-center gap-1">
                    <Bookmark className="w-4 h-4" /> 收藏
                  </button>
                  <button className="hover:text-primary flex items-center gap-1">
                    <Share2 className="w-4 h-4" /> 分享
                  </button>
                </div>
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                 <Search className="w-8 h-8 text-gray-300" />
               </div>
               <p>输入药物名称，点击分析查看结果</p>
             </div>
          )}
        </section>

        {/* 右侧：推荐与知识 (PC: 20%) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-xl border border-primary/10">
            <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              注意事项
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              AI 分析结果仅供参考，不能替代医生诊断。如有用药疑问，请咨询专业医师或药师。
            </p>
          </div>
        </aside>
      </div>
    </Layout>
  );
};

export default Analysis;
