export const environment = {
  production: false,
  apiUrl:
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:8000/api/v1'
      : 'http://127.0.0.1:8000/api/v1',
};
