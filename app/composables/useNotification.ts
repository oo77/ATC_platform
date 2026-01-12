import { ref, h, render } from 'vue';
import type { VNode } from 'vue';
import Notification from '~/components/ui/Notification.vue';
import type { NotificationProps } from '~/components/ui/Notification.vue';

interface NotificationInstance {
  id: number;
  vnode: VNode;
  container: HTMLDivElement;
}

const notifications = ref<NotificationInstance[]>([]);
let notificationId = 0;

const getOrCreateContainer = () => {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none';
    document.body.appendChild(container);
  }
  return container;
};

export const useNotification = () => {
  const show = (options: NotificationProps) => {
    const id = notificationId++;
    const wrapper = document.createElement('div');
    const parentContainer = getOrCreateContainer();
    parentContainer.appendChild(wrapper);

    const onClose = () => {
      // Удаляем уведомление из списка
      const index = notifications.value.findIndex((n) => n.id === id);
      if (index > -1) {
        const notification = notifications.value[index];
        if (notification) {
          render(null, notification.container);
          // Only remove wrapper if it's still attached (safety check)
          if (wrapper.parentElement) {
            wrapper.parentElement.removeChild(wrapper);
          }
          notifications.value.splice(index, 1);

          // Clean up main container if empty? (Optional, skipping to avoid churn)
        }
      }
    };

    const vnode = h(Notification, {
      ...options,
      onClose,
    });

    render(vnode, wrapper);

    notifications.value.push({
      id,
      vnode,
      container: wrapper,
    });

    return {
      close: onClose,
    };
  };

  const success = (message: string, title?: string, duration?: number) => {
    return show({
      type: 'success',
      message,
      title,
      duration,
    });
  };

  const error = (message: string, title?: string, duration?: number) => {
    return show({
      type: 'error',
      message,
      title,
      duration,
    });
  };

  const warning = (message: string, title?: string, duration?: number) => {
    return show({
      type: 'warning',
      message,
      title,
      duration,
    });
  };

  const info = (message: string, title?: string, duration?: number) => {
    return show({
      type: 'info',
      message,
      title,
      duration,
    });
  };

  const closeAll = () => {
    notifications.value.forEach((notification) => {
      render(null, notification.container);
      if (notification.container.parentElement) {
        notification.container.parentElement.removeChild(notification.container);
      }
    });
    notifications.value = [];
  };

  return {
    show,
    success,
    error,
    warning,
    info,
    closeAll,
  };
};
