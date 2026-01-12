import { ref, render, h } from 'vue';
import { _ as __nuxt_component_4 } from './Notification-Bd1V2gNg.mjs';

const notifications = ref([]);
let notificationId = 0;
const getOrCreateContainer = () => {
  let container = (void 0).getElementById("notification-container");
  if (!container) {
    container = (void 0).createElement("div");
    container.id = "notification-container";
    container.className = "fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none";
    (void 0).body.appendChild(container);
  }
  return container;
};
const useNotification = () => {
  const show = (options) => {
    const id = notificationId++;
    const wrapper = (void 0).createElement("div");
    const parentContainer = getOrCreateContainer();
    parentContainer.appendChild(wrapper);
    const onClose = () => {
      const index = notifications.value.findIndex((n) => n.id === id);
      if (index > -1) {
        const notification = notifications.value[index];
        if (notification) {
          render(null, notification.container);
          if (wrapper.parentElement) {
            wrapper.parentElement.removeChild(wrapper);
          }
          notifications.value.splice(index, 1);
        }
      }
    };
    const vnode = h(__nuxt_component_4, {
      ...options,
      onClose
    });
    render(vnode, wrapper);
    notifications.value.push({
      id,
      vnode,
      container: wrapper
    });
    return {
      close: onClose
    };
  };
  const success = (message, title, duration) => {
    return show({
      type: "success",
      message,
      title,
      duration
    });
  };
  const error = (message, title, duration) => {
    return show({
      type: "error",
      message,
      title,
      duration
    });
  };
  const warning = (message, title, duration) => {
    return show({
      type: "warning",
      message,
      title,
      duration
    });
  };
  const info = (message, title, duration) => {
    return show({
      type: "info",
      message,
      title,
      duration
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
    closeAll
  };
};

export { useNotification as u };
//# sourceMappingURL=useNotification-C2RwAN1X.mjs.map
