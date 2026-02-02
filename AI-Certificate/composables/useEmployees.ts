import type { Employee } from '~/types';

export const useEmployees = () => {
  const employees = ref<Employee[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Получить всех сотрудников
  const fetchEmployees = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch<Employee[]>('/api/employees');
      employees.value = response;
      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при загрузке сотрудников';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Получить сотрудника по ID
  const getEmployee = async (id: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch<Employee>(`/api/employees/${id}`);
      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при загрузке сотрудника';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Поиск сотрудника по ФИО
  const searchEmployees = async (query: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch<Employee[]>(`/api/employees/search?q=${encodeURIComponent(query)}`);
      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при поиске сотрудников';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Создать нового сотрудника
  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch<Employee>('/api/employees', {
        method: 'POST',
        body: employeeData,
      });

      await fetchEmployees();
      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при создании сотрудника';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Обновить сотрудника
  const updateEmployee = async (id: number, employeeData: Partial<Employee>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch<Employee>(`/api/employees/${id}`, {
        method: 'PUT',
        body: employeeData,
      });

      await fetchEmployees();
      return response;
    } catch (e: any) {
      error.value = e.message || 'Ошибка при обновлении сотрудника';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Удалить сотрудника
  const deleteEmployee = async (id: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      await $fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      await fetchEmployees();
    } catch (e: any) {
      error.value = e.message || 'Ошибка при удалении сотрудника';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    getEmployee,
    searchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
};
