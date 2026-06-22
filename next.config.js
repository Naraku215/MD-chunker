/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许 formidable 在 API 路由中处理文件上传
  experimental: {
    serverComponentsExternalPackages: ['formidable']
  }
};

module.exports = nextConfig;
