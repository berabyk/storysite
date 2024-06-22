/** @type {import('next').NextConfig} */
const nextConfig = {

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "www.notion.so"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.buymeacoffee.com",
      },
    ],
  },

  // rewrites: async () => {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/en',
  //     },
  //   ]
  // },
};

export default nextConfig;
