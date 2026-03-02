import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { constitutionService } from '../services/auth';
import { CheckCircle, AlertTriangle, RefreshCw, User, Users } from 'lucide-react';

interface Question {
  id: number;
  content: string;
  constitution_name: string;
  constitution_code: string;
  order: number;
  gender_limit: 'M' | 'F' | 'N';
}

interface AnalysisResult {
  main_type: string;
  scores: Record<string, number>;
  analysis_id: string;
}

const ConstitutionAnalysis: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [gender, setGender] = useState<'M' | 'F' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await constitutionService.getQuestions();
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions', error);
      alert('加载问卷失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter questions based on gender
  const filteredQuestions = questions.filter(q => {
    if (!gender) return false;
    if (q.gender_limit === 'N') return true;
    return q.gender_limit === gender;
  });
  
  // Deduplicate questions by content for display
  const uniqueQuestions = filteredQuestions.filter((q, index, self) => 
      index === self.findIndex((t) => t.content === q.content)
  );

  const handleAnswer = (questionId: number, score: number) => {
    const targetQ = questions.find(q => q.id === questionId);
    if (!targetQ) return;
    
    // Find all questions with same content (within filtered list or global list? Global is safer)
    // Actually we only care about filtered list for submission logic in this view, 
    // but backend needs all ids.
    // Let's update all matching questions in the full list to be safe.
    const sameContentIds = questions
        .filter(q => q.content === targetQ.content)
        .map(q => q.id);
        
    const newAnswers = { ...answers };
    sameContentIds.forEach(id => {
        newAnswers[id] = score;
    });
    
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    // Check if all unique questions answered
    const answeredUniqueCount = uniqueQuestions.filter(q => answers[q.id]).length;
    if (answeredUniqueCount < uniqueQuestions.length) {
      alert(`还有 ${uniqueQuestions.length - answeredUniqueCount} 道题目未完成`);
      return;
    }
    
    if (!gender) {
        alert('请选择性别');
        return;
    }

    try {
      setSubmitting(true);
      const data = await constitutionService.submitAnswers(answers, gender);
      setResult(data);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Submit failed', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setAnswers({});
    setGender(null);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-primary">加载问卷中...</div>
        </div>
      </Layout>
    );
  }
  
  // Step 0: Gender Selection
  if (!gender) {
      return (
          <Layout>
            <div className="flex justify-center items-center h-[70vh]">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">欢迎进行中医体质辨识</h2>
                    <p className="text-gray-500 mb-8">请先选择您的性别，以便我们提供更准确的问卷</p>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <button 
                            onClick={() => setGender('M')}
                            className="flex flex-col items-center justify-center p-6 border-2 border-blue-100 bg-blue-50 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
                        >
                            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                                <User className="w-8 h-8 text-blue-600 group-hover:text-white" />
                            </div>
                            <span className="font-bold text-blue-800 text-lg">我是男生</span>
                        </button>
                        
                        <button 
                            onClick={() => setGender('F')}
                            className="flex flex-col items-center justify-center p-6 border-2 border-pink-100 bg-pink-50 rounded-xl hover:border-pink-500 hover:shadow-md transition-all group"
                        >
                            <div className="w-16 h-16 bg-pink-200 rounded-full flex items-center justify-center mb-4 group-hover:bg-pink-500 transition-colors">
                                <Users className="w-8 h-8 text-pink-600 group-hover:text-white" />
                            </div>
                            <span className="font-bold text-pink-800 text-lg">我是女生</span>
                        </button>
                    </div>
                    
                    <p className="mt-8 text-xs text-gray-400">
                        * 部分题目（如涉及生理期）将根据您的性别进行调整
                    </p>
                </div>
            </div>
          </Layout>
      )
  }

  if (result) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">判定结果：{result.main_type}</h2>
            <p className="text-gray-500 mt-2">基于您的回答分析得出</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                体质得分详情
              </h3>
              <div className="space-y-3">
                {Object.entries(result.scores).map(([code, score]) => (
                  <div key={code} className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium w-24">
                        {code === 'A' ? '平和质' : 
                         code === 'B' ? '气虚质' :
                         code === 'C' ? '阳虚质' :
                         code === 'D' ? '阴虚质' :
                         code === 'E' ? '痰湿质' :
                         code === 'F' ? '湿热质' :
                         code === 'G' ? '血瘀质' :
                         code === 'H' ? '气郁质' :
                         code === 'I' ? '特禀质' : code}
                    </span>
                    <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${score >= 40 ? 'bg-yellow-500' : 'bg-primary'}`} 
                        style={{ width: `${Math.min(score, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold mb-4 text-primary">调理建议</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                根据您的{result.main_type}，建议您在日常生活中注意饮食调节，避免{result.main_type === '平和质' ? '过度劳累' : '寒凉/辛辣/油腻'}食物。
                具体用药禁忌请前往“药物分析”页面查询。
              </p>
              <div className="mt-6">
                <button 
                  onClick={() => navigate('/analysis')}
                  className="w-full py-2 bg-primary text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  去查询药物禁忌
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={handleRetake}
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重新测评
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Question List
  const answeredUniqueCount = uniqueQuestions.filter(q => answers[q.id]).length;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">中医体质辨识问卷</h1>
              <p className="text-gray-500">请根据您近一年的体验和感觉回答</p>
          </div>
          <button onClick={() => setGender(null)} className="text-sm text-primary hover:underline">
            切换性别 ({gender === 'M' ? '男' : '女'})
          </button>
        </div>

        <div className="space-y-6">
          {uniqueQuestions.map((q, index) => (
            <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex gap-4 mb-4">
                <span className="text-primary font-bold text-lg">Q{index + 1}</span>
                <h3 className="text-lg font-medium text-gray-800">{q.content}</h3>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {[
                  { val: 1, label: '没有' },
                  { val: 2, label: '很少' },
                  { val: 3, label: '有时' },
                  { val: 4, label: '经常' },
                  { val: 5, label: '总是' }
                ].map((option) => (
                  <button
                    key={option.val}
                    onClick={() => handleAnswer(q.id, option.val)}
                    className={`
                      py-3 rounded-lg text-sm font-medium transition-all
                      ${answers[q.id] === option.val 
                        ? 'bg-primary text-white shadow-md transform scale-105' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 mb-12 flex flex-col items-center gap-4">
          <div className="text-sm text-gray-500">
            已完成 {answeredUniqueCount} / {uniqueQuestions.length}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full max-w-md overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(answeredUniqueCount / uniqueQuestions.length) * 100}%` }}
            ></div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full max-w-md py-4 bg-secondary text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? '分析中...' : '提交问卷'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ConstitutionAnalysis;
