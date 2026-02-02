import type { Certificate, CertificateFilters, CertificateStats, ProcessedCertificateResponse } from '~/types';

export const useCertificates = () => {
  const certificates = ref<Certificate[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Получить все сертификаты с фильтрами
  const fetchCertificates = async (filters?: CertificateFilters) => {
    loading.value = true;
    error.value = null;
    
    try {
      const query = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query.append(key, String(value));
          }
        });
      }

      const response = await $fetch<Certificate[]>(`/api/certificates?${query.toString()}`);
      certificates.value = response;
      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при загрузке сертификатов';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Получить сертификат по ID
  const getCertificate = async (id: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch<Certificate>(`/api/certificates/${id}`);
      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при загрузке сертификата';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Загрузить и обработать новый сертификат
  const uploadCertificate = async (file: File, employeeId?: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (employeeId) {
        formData.append('employeeId', String(employeeId));
      }

      const response = await $fetch<ProcessedCertificateResponse>('/api/certificates/upload', {
        method: 'POST',
        body: formData,
      });

      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при загрузке сертификата';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Сохранить сертификат после проверки
  const saveCertificate = async (certificateData: Partial<Certificate>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch<Certificate>('/api/certificates', {
        method: 'POST',
        body: certificateData,
      });

      await fetchCertificates();
      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при сохранении сертификата';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Обновить сертификат
  const updateCertificate = async (id: number, certificateData: Partial<Certificate>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch<Certificate>(`/api/certificates/${id}`, {
        method: 'PUT',
        body: certificateData,
      });

      await fetchCertificates();
      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при обновлении сертификата';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Удалить сертификат
  const deleteCertificate = async (id: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      await $fetch(`/api/certificates/${id}`, {
        method: 'DELETE',
      });

      await fetchCertificates();
    } catch (e: any) {
      error.value = e.message || 'Ошибка при удалении сертификата';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Получить статистику
  const getStats = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch<CertificateStats>('/api/certificates/stats');
      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при загрузке статистики';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    certificates,
    loading,
    error,
    fetchCertificates,
    getCertificate,
    uploadCertificate,
    saveCertificate,
    updateCertificate,
    deleteCertificate,
    getStats,
  };
};
