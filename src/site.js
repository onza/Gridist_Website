import './scss/base/fonts.scss'
import './scss/main.scss'
import { DOWNLOAD_URL, GITHUB_URL, LICENSE_URL } from './config.js'

const header = document.querySelector('.header')
const yearEl = document.querySelector('[data-year]')

document.querySelectorAll('[data-download-link]').forEach((link) => {
  const href = link.getAttribute('href')
  if (!href || href === '#') {
    link.href = DOWNLOAD_URL
  }
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
})

document.querySelectorAll('[data-github-link]').forEach((link) => {
  link.href = GITHUB_URL
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
})

document.querySelectorAll('[data-license-link]').forEach((link) => {
  link.href = LICENSE_URL
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
})

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear())
}

const onScroll = () => {
  if (!header) return
  header.classList.toggle('is-scrolled', window.scrollY > 8)
}
window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

const langDropdown = document.querySelector('.lang-dropdown')
if (langDropdown) {
  langDropdown.addEventListener('toggle', () => {
    if (!langDropdown.open) return
    langDropdown.querySelector('.lang-link')?.focus()
  })

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node) || langDropdown.contains(event.target)) return
    langDropdown.open = false
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') langDropdown.open = false
  })
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const id = anchor.getAttribute('href')
    if (!id || id === '#') return
    const target = document.querySelector(id)
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})
