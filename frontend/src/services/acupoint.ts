import api from './api';

export interface Acupoint {
  id: number;
  code: string;
  name: string;
  cn_name: string;
  meridian_name: string;
  position_category_name: string;
  function_category_name: string;
  cn_position: string;
  cn_indication: string;
  cn_compatibility: string;
  cn_acupuncture: string;
}

export const acupointService = {
  getByName: async (name: string) => {
    // 移除 "穴" 字进行搜索，如果后端支持的话，或者直接传全名
    // 后端实现了 by_name?name=xxx，支持模糊匹配
    const response = await api.get(`/acupoints/by_name/?name=${name}`);
    return response.data;
  }
};
