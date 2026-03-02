import api from './api';

export const authService = {
  sendCode: async (phone: string) => {
    const response = await api.post('/auth/send-code/', { phone });
    return response.data;
  },

  login: async (phone: string, code: string) => {
    const response = await api.post('/auth/login/', { phone, code });
    return response.data;
  },
};

export const constitutionService = {
  getQuestions: async () => {
    const response = await api.get('/constitution/');
    return response.data;
  },
  
  submitAnswers: async (answers: Record<number, number>, gender: 'M' | 'F') => {
    const response = await api.post('/constitution/submit/', { answers, gender });
    return response.data;
  }
};
