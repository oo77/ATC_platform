<template>
    <div class="container mx-auto px-6 py-12">
        <h1 class="text-4xl font-bold mb-8">Добавить сотрудника</h1>

        <div class="glass p-8 rounded-3xl max-w-2xl">
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Фамилия *</label>
                        <input v-model="formData.lastName" type="text" required
                            class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="Atabayev" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Имя *</label>
                        <input v-model="formData.firstName" type="text" required
                            class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="Ravshanbek" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Отчество</label>
                        <input v-model="formData.middleName" type="text"
                            class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="(опционально)" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                        <input v-model="formData.email" type="email" required
                            class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="atabayev.r@example.com" />
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-slate-700 mb-2">Должность *</label>
                        <input v-model="formData.position" type="text" required
                            class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="Passenger Handling Services Specialist" />
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-slate-700 mb-2">Отдел *</label>
                        <input v-model="formData.department" type="text" required
                            class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="Passenger Services" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Телефон</label>
                        <input v-model="formData.phone" type="tel"
                            class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="+998901234567" />
                    </div>
                </div>

                <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p class="text-red-800">{{ error }}</p>
                </div>

                <div v-if="success" class="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p class="text-green-800">✅ Сотрудник успешно добавлен!</p>
                </div>

                <div class="flex items-center justify-between pt-6 border-t border-slate-200">
                    <NuxtLink to="/"
                        class="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors">
                        Отменить
                    </NuxtLink>

                    <button type="submit" :disabled="loading"
                        class="px-8 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span v-if="!loading">Добавить сотрудника</span>
                        <span v-else>Добавление...</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
const formData = ref({
    firstName: '',
    lastName: '',
    middleName: '',
    position: '',
    department: '',
    email: '',
    phone: '',
});

const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const handleSubmit = async () => {
    loading.value = true;
    error.value = null;
    success.value = false;

    try {
        const response = await $fetch('/api/employees', {
            method: 'POST',
            body: formData.value,
        });

        success.value = true;

        // Очистить форму
        formData.value = {
            firstName: '',
            lastName: '',
            middleName: '',
            position: '',
            department: '',
            email: '',
            phone: '',
        };

        // Перенаправить на главную через 2 секунды
        setTimeout(() => {
            navigateTo('/');
        }, 2000);

    } catch (e: any) {
        error.value = e.message || 'Ошибка при добавлении сотрудника';
    } finally {
        loading.value = false;
    }
};
</script>
