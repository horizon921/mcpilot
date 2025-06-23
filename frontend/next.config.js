/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 如果未来需要支持从外部域名加载图片，可以在这里配置
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'example.com',
  //       port: '',
  //       pathname: '/images/**',
  //     },
  //   ],
  // },
};

module.exports = nextConfig;