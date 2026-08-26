const dialog = document.querySelector('.search-dialog');
const searchButton = document.querySelector('.search-trigger');
const closeSearch = document.querySelector('.close-search');
const searchInput = document.querySelector('#search-input');
const searchForm = document.querySelector('#search-form');
const searchNote = document.querySelector('.search-note');
const menuButton = document.querySelector('.menu-trigger');
const navLinks = document.querySelector('.nav-links');
const slides = [...document.querySelectorAll('.hero-slide')];
const dots = [...document.querySelectorAll('[data-go]')];
let activeSlide = 0;
let carouselTimer;

function showSlide(index) {
  activeSlide = index;
  slides.forEach((slide, slideIndex) => {
    const active = slideIndex === index;
    slide.hidden = !active;
    slide.classList.toggle('is-active', active);
  });
  dots.forEach((dot, dotIndex) => {
    const active = dotIndex === index;
    dot.classList.toggle('is-current', active);
    dot.setAttribute('aria-selected', String(active));
  });
}

function resetCarousel() {
  window.clearInterval(carouselTimer);
  carouselTimer = window.setInterval(() => showSlide((activeSlide + 1) % slides.length), 6000);
}

dots.forEach((dot) => dot.addEventListener('click', () => {
  showSlide(Number(dot.dataset.go));
  resetCarousel();
}));
resetCarousel();

function openSearch() {
  dialog.classList.add('is-open');
  dialog.setAttribute('aria-hidden', 'false');
  searchButton.setAttribute('aria-expanded', 'true');
  window.setTimeout(() => searchInput.focus(), 120);
}

function hideSearch() {
  dialog.classList.remove('is-open');
  dialog.setAttribute('aria-hidden', 'true');
  searchButton.setAttribute('aria-expanded', 'false');
  searchButton.focus();
}

searchButton.addEventListener('click', openSearch);
closeSearch.addEventListener('click', hideSearch);
dialog.addEventListener('click', (event) => { if (event.target === dialog) hideSearch(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && dialog.classList.contains('is-open')) hideSearch(); });

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  searchNote.textContent = query ? `No results for “${query}” yet — try browsing the latest issue.` : 'Enter a search term to explore the issue.';
});

menuButton.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});

navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navLinks.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}));
