import createProxyMiddleware from 'http-proxy-middleware';

module.exports = function addProxyMiddleware(app) {
  app.use('/api', createProxyMiddleware({
    target: 'localhost:3000/api/auth/sendAutomatedEmail', // 替換為你的 API 伺服器 URL
    changeOrigin: true,
  }));
};
