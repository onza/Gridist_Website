const siteUrl = (process.env.SITE_URL ?? 'https://gridist.app').replace(/\/$/, '')

export default {
  name: 'Gridist',
  url: siteUrl,
  apex: new URL(siteUrl).hostname,
  author: 'Martin Farkas',
  ogImage: '/og-image.jpg',
  ogImageAlt: 'Gridist — Window management for macOS',
  twitterCard: 'summary_large_image',
  themeColor: '#0d1f16',
  githubUrl: 'https://github.com/onza/Gridist',
  downloadUrl: 'https://github.com/onza/Gridist/releases',
  licenseUrl: 'https://github.com/onza/Gridist/blob/main/LICENSE',
  companyUrl: 'https://www.websites-graphix.com/',
  companyName: 'Websites & Graphix',
  app: {
    repo: 'onza/Gridist',
    fallback: {
      tag: 'v0.1.1',
      version: '0.1.1',
      macos: {
        url: 'https://github.com/onza/Gridist/releases/download/v0.1.1/Gridist-0.1.1.dmg',
      },
    },
  },
}
