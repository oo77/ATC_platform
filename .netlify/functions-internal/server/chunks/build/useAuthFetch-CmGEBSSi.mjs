import { h as useCookie } from './server.mjs';

const useAuthFetch = () => {
  const token = useCookie("auth_token");
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers
    };
    if (token.value) {
      headers["Authorization"] = `Bearer ${token.value}`;
    }
    return $fetch(url, {
      ...options,
      headers
    });
  };
  return {
    authFetch
  };
};

export { useAuthFetch as u };
//# sourceMappingURL=useAuthFetch-CmGEBSSi.mjs.map
