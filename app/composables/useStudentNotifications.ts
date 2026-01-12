
import { ref, computed } from 'vue';

export const useStudentNotifications = () => {
    const notifications = ref<any[]>([]);
    const unreadCount = ref(0);
    const { user } = useAuth();
    const { authFetch } = useAuthFetch();

    // Проверяем роль
    const isStudent = computed(() => user.value?.role === 'STUDENT');

    const fetchNotifications = async () => {
        if (!isStudent.value) return;

        try {
            const response = await authFetch('/api/students/notifications?unread=true');

            if (response.success && response.notifications) {
                notifications.value = response.notifications;
                unreadCount.value = notifications.value.length;
            }
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await authFetch(`/api/students/notifications/${id}/read`, { method: 'POST' });
            // Убираем из списка локально
            notifications.value = notifications.value.filter(n => n.id !== id);
            unreadCount.value = Math.max(0, notifications.value.length);
        } catch (e) {
            console.error('Failed to mark notification as read', e);
        }
    };

    // Polling
    let pollingInterval: NodeJS.Timeout | null = null;

    const startPolling = (intervalMs = 30000) => {
        if (pollingInterval) clearInterval(pollingInterval);
        fetchNotifications();
        pollingInterval = setInterval(fetchNotifications, intervalMs);
    };

    const stopPolling = () => {
        if (pollingInterval) clearInterval(pollingInterval);
        pollingInterval = null;
    };

    return {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        isStudent,
        startPolling,
        stopPolling
    };
};
