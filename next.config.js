module.exports = {
  experimental: {
    reactCompiler: true,
    ppr: true,
  },
  async redirects() {
    return [
      {
        source: '/use',
        destination: 'https://get.mosaicimg.com/image/get_image',
        permanent: false,
      },
    ]
  },
}
