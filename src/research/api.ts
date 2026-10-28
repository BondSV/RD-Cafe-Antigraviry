export const isTestRoute = window.location.pathname.replace(/\/$/, '') === '/test';
export const researchApi = (path: string) => (isTestRoute ? '/api/test-research/' : '/api/research/') + path;
