import api from './api';
import { Store, CreateStoreRequest, UpdateStoreRequest } from '@/types/store';

export const storeApi = {
    getAll: () => api.get<{ stores: Store[]; count: number }>('/stores'),

    getById: (id: string) => api.get<Store>(`/stores/${id}`),

    create: (data: CreateStoreRequest) => api.post<Store>('/stores', data),

    update: (id: string, data: UpdateStoreRequest) =>
        api.put<Store>(`/stores/${id}`, data),

    delete: (id: string) => api.delete(`/stores/${id}`),
};
