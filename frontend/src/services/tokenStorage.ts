const key = "loopy.access-token";
export const tokenStorage = {
  getToken: () => localStorage.getItem(key),
  setToken: (token: string) => localStorage.setItem(key, token),
  clearToken: () => localStorage.removeItem(key),
};
