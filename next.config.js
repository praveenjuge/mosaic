module.exports = {
  async redirects() {
    return [
      {
        source: '/use',
        destination: 'https://get.mosaicimg.com/image/get_image',
        permanent: true,
      },
    ]
  },
}