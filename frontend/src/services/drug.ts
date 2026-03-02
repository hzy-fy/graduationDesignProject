import api from './api';

export const drugService = {
  analyze: async (drugName: string, constitution: string) => {
    const response = await api.post('/drugs/analyze/', {
      drug_name: drugName,
      constitution: constitution
    }, {
      timeout: 60000 // 增加超时时间到 60秒，因为 AI 分析可能较慢
    });
    return response.data;
  }
};
