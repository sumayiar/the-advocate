const dialog = document.querySelector('.search-dialog');
const searchButton = document.querySelector('.search-trigger');
const archiveSearchButton = document.querySelector('.archive-search-trigger');
const closeSearch = document.querySelector('.close-search');
const searchInput = document.querySelector('#search-input');
const searchForm = document.querySelector('#search-form');
const searchNote = document.querySelector('.search-note');
const menuButton = document.querySelector('.menu-trigger');
const navLinks = document.querySelector('.nav-links');
const slides = [...document.querySelectorAll('.hero-slide')];
const dots = [...document.querySelectorAll('[data-go]')];
const currentSlideLabel = document.querySelector('.current-slide');
const carousel = document.querySelector('.hero-carousel');
const homeContent = document.querySelector('#home-content');
const reader = document.querySelector('#reader');
const archiveList = document.querySelector('#archive-list');
const archiveCategories = document.querySelector('#archive-categories');
const archiveSummary = document.querySelector('#archive-summary');
const loadMore = document.querySelector('#load-more');
const mastheadDate = document.querySelector('#masthead-date');

const newYorkDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});
const newYorkIsoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function refreshMastheadDate() {
  if (!mastheadDate) return;
  const date = new Date();
  const parts = Object.fromEntries(newYorkDateFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  const isoParts = Object.fromEntries(newYorkIsoDateFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  mastheadDate.textContent = `${parts.day} ${parts.month.toUpperCase()} ${parts.year}`;
  mastheadDate.dateTime = `${isoParts.year}-${isoParts.month}-${isoParts.day}`;
}

refreshMastheadDate();
window.setInterval(refreshMastheadDate, 60_000);

const query = new URLSearchParams(window.location.search);
const ARTICLE_PAGE_SIZE = 12;
const visibleCategorySlugs = ['conversations', 'cuny-experience', 'cuny-news', 'current-issue', 'current-issue-advocate', 'debate', 'editorials', 'features', 'letters', 'poetry', 'reviews', 'back-page', 'art-dispatch'];
const safeTags = new Set(['P', 'BR', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'I', 'B', 'A', 'IMG', 'FIGURE', 'FIGCAPTION', 'HR', 'DIV', 'SPAN', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'PRE', 'CODE']);
let activeSlide = 0;
let carouselTimer;
let catalog;
let filteredPosts = [];
let shownPosts = ARTICLE_PAGE_SIZE;
let lastSearchTrigger = searchButton;

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
  currentSlideLabel.textContent = String(index + 1).padStart(2, '0');
}

function resetCarousel() {
  window.clearInterval(carouselTimer);
  carouselTimer = window.setInterval(() => showSlide((activeSlide + 1) % slides.length), 6000);
}

dots.forEach((dot) => dot.addEventListener('click', () => {
  showSlide(Number(dot.dataset.go));
  resetCarousel();
}));

dots.forEach((dot) => dot.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const nextIndex = event.key === 'ArrowRight'
    ? (Number(dot.dataset.go) + 1) % dots.length
    : (Number(dot.dataset.go) - 1 + dots.length) % dots.length;
  dots[nextIndex].focus();
  showSlide(nextIndex);
  resetCarousel();
}));

carousel.addEventListener('mouseenter', () => window.clearInterval(carouselTimer));
carousel.addEventListener('mouseleave', resetCarousel);
resetCarousel();

function openSearch(event) {
  lastSearchTrigger = event?.currentTarget || searchButton;
  dialog.classList.add('is-open');
  dialog.setAttribute('aria-hidden', 'false');
  [searchButton, archiveSearchButton].filter(Boolean).forEach((button) => button.setAttribute('aria-expanded', 'true'));
  window.setTimeout(() => searchInput.focus(), 120);
}

function hideSearch() {
  dialog.classList.remove('is-open');
  dialog.setAttribute('aria-hidden', 'true');
  [searchButton, archiveSearchButton].filter(Boolean).forEach((button) => button.setAttribute('aria-expanded', 'false'));
  lastSearchTrigger.focus();
}

[searchButton, archiveSearchButton].filter(Boolean).forEach((button) => button.addEventListener('click', openSearch));
closeSearch.addEventListener('click', hideSearch);
dialog.addEventListener('click', (event) => { if (event.target === dialog) hideSearch(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && dialog.classList.contains('is-open')) hideSearch(); });

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const search = searchInput.value.trim();
  if (!search) {
    searchNote.textContent = 'Enter a search term to explore the full Advocate archive.';
    return;
  }
  window.location.href = `?search=${encodeURIComponent(search)}#archive`;
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

function textFromHtml(html = '') {
  const template = document.createElement('template');
  template.innerHTML = html;
  return (template.content.textContent || '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${value}Z`));
}

function estimateReadTime(post) {
  return Math.max(1, Math.ceil(textFromHtml(post.content).split(/\s+/).filter(Boolean).length / 220));
}

function truncate(value, length = 190) {
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
}

function getPostCategories(post) {
  return post.categories
    .map((id) => catalog.categoriesById.get(id))
    .filter(Boolean);
}

function getPrimaryCategory(post) {
  const categories = getPostCategories(post);
  return categories.find((category) => !['articles', 'uncategorized', 'past-issues'].includes(category.slug)) || categories[0] || { name: 'The Advocate', slug: 'articles' };
}

function commentCount(post) {
  return catalog.commentCounts.get(String(post.id)) || 0;
}

function articleHref(slug) {
  return `?article=${encodeURIComponent(slug)}`;
}

function renderCategories(selected) {
  const available = catalog.categories
    .filter((category) => category.count && visibleCategorySlugs.includes(category.slug))
    .sort((a, b) => a.name.localeCompare(b.name));
  archiveCategories.innerHTML = [
    `<a class="${selected ? '' : 'is-active'}" href="#archive">All <span>${catalog.posts.length}</span></a>`,
    ...available.map((category) => `<a class="${selected === category.slug ? 'is-active' : ''}" href="?category=${encodeURIComponent(category.slug)}#archive">${escapeHtml(category.name)} <span>${category.count}</span></a>`)
  ].join('');
}

function articleCard(post, index) {
  const category = getPrimaryCategory(post);
  const comments = commentCount(post);
  const color = ['blue', 'pink', 'yellow', 'green'][index % 4];
  const typographyClass = category.slug === 'poetry' ? ' archive-card--poem' : category.slug === 'art-dispatch' ? ' archive-card--dispatch' : '';
  return `
    <article class="archive-card${typographyClass}">
      <a class="archive-art archive-art--${color}" href="${articleHref(post.slug)}" aria-label="Read ${escapeHtml(textFromHtml(post.title))}"><span>${String(index + 1).padStart(2, '0')}</span></a>
      <div class="archive-card__content">
        <p class="article-type">${escapeHtml(category.name)}</p>
        <h3><a href="${articleHref(post.slug)}">${escapeHtml(textFromHtml(post.title))}</a></h3>
        <p class="archive-excerpt">${escapeHtml(truncate(textFromHtml(post.excerpt || post.content)))}</p>
        <div class="article-meta"><span>${formatDate(post.date)} &middot; ${estimateReadTime(post)} min read</span><span class="comment-count">${comments} comment${comments === 1 ? '' : 's'}</span></div>
      </div>
    </article>`;
}

function renderArchive() {
  const selectedCategory = query.get('category');
  const search = query.get('search')?.trim().toLowerCase();
  filteredPosts = catalog.posts.filter((post) => {
    if (selectedCategory && !getPostCategories(post).some((category) => category.slug === selectedCategory)) return false;
    if (search) {
      const haystack = `${textFromHtml(post.title)} ${textFromHtml(post.excerpt)} ${textFromHtml(post.content)}`.toLowerCase();
      return haystack.includes(search);
    }
    return true;
  });
  shownPosts = Math.min(ARTICLE_PAGE_SIZE, filteredPosts.length);
  renderCategories(selectedCategory);
  const label = search
    ? `${filteredPosts.length} result${filteredPosts.length === 1 ? '' : 's'} for “${escapeHtml(search)}”`
    : selectedCategory
      ? `${filteredPosts.length} article${filteredPosts.length === 1 ? '' : 's'} in ${escapeHtml(catalog.categoriesBySlug.get(selectedCategory)?.name || 'this category')}`
      : `${catalog.posts.length} public articles from The Advocate archive`;
  archiveSummary.innerHTML = label;
  renderMoreArticles();
}

function renderMoreArticles() {
  archiveList.innerHTML = filteredPosts.slice(0, shownPosts).map(articleCard).join('');
  loadMore.hidden = shownPosts >= filteredPosts.length;
  loadMore.textContent = `Load ${Math.min(ARTICLE_PAGE_SIZE, filteredPosts.length - shownPosts)} more articles ↓`;
}

loadMore.addEventListener('click', () => {
  shownPosts = Math.min(shownPosts + ARTICLE_PAGE_SIZE, filteredPosts.length);
  renderMoreArticles();
});

function sanitizeContent(html = '') {
  const template = document.createElement('template');
  template.innerHTML = html;
  [...template.content.querySelectorAll('*')].forEach((element) => {
    if (!safeTags.has(element.tagName)) {
      if (element.tagName === 'IFRAME' && /^https?:/i.test(element.getAttribute('src') || '')) {
        const link = document.createElement('a');
        link.href = element.getAttribute('src');
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Open embedded content';
        element.replaceWith(link);
        return;
      }
      element.replaceWith(...element.childNodes);
      return;
    }
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      const allowed = (element.tagName === 'A' && name === 'href')
        || (element.tagName === 'IMG' && ['src', 'alt', 'width', 'height', 'loading'].includes(name))
        || (element.tagName === 'TH' && ['colspan', 'rowspan'].includes(name))
        || (element.tagName === 'TD' && ['colspan', 'rowspan'].includes(name));
      if (!allowed || /^javascript:/i.test(value)) element.removeAttribute(attribute.name);
    });
    if (element.tagName === 'IMG') {
      element.loading = 'lazy';
      element.decoding = 'async';
    }
    if (element.tagName === 'A' && /^https?:/i.test(element.getAttribute('href') || '')) {
      element.target = '_blank';
      element.rel = 'noopener noreferrer';
    }
  });
  return template.innerHTML;
}

function showReader(title, body, metadata = '', comments = [], typographyClass = '') {
  homeContent.hidden = true;
  reader.hidden = false;
  reader.innerHTML = `
    <a class="reader-back" href="./#archive">← Back to all articles</a>
    <article class="reader-article${typographyClass}">
      ${metadata ? `<p class="eyebrow">${metadata}</p>` : ''}
      <h1>${escapeHtml(title)}</h1>
      <div class="reader-body">${sanitizeContent(body)}</div>
      ${comments.length ? `<section class="reader-comments"><h2>${comments.length} public comment${comments.length === 1 ? '' : 's'}</h2>${comments.map((comment) => `<article><p class="comment-author">${escapeHtml(comment.authorName || 'Reader')} <span>${formatDate(comment.date)}</span></p><div>${sanitizeContent(comment.content)}</div></article>`).join('')}</section>` : ''}
    </article>`;
  reader.querySelectorAll('.reader-body p').forEach((paragraph) => {
    const opening = paragraph.textContent.trim().replace(/^[“"']+/, '');
    if (/^(ed\.?\s*note|editor'?s\s*note)\b/i.test(opening)) paragraph.classList.add('editors-note');
  });
  window.scrollTo(0, 0);
}

async function renderRoute() {
  const articleSlug = query.get('article');
  const pageSlug = query.get('page');
  if (articleSlug) {
    const post = catalog.posts.find((item) => item.slug === articleSlug);
    if (post) {
      const category = getPrimaryCategory(post);
      document.title = `${textFromHtml(post.title)} — The Advocate`;
      showReader(textFromHtml(post.title), '<p>Loading this article from the Advocate archive…</p>', `${escapeHtml(category.name)} · ${formatDate(post.date)}`);
      try {
        const response = await fetch(`data/articles/${post.date.slice(0, 4)}.json`);
        if (!response.ok) throw new Error(`Article request failed (${response.status})`);
        const yearArchive = await response.json();
        const article = yearArchive.posts.find((item) => item.slug === post.slug);
        const comments = yearArchive.comments.filter((comment) => comment.post === post.id);
        if (!article) throw new Error('Article not found in its archive year');
        showReader(
          textFromHtml(post.title),
          article.content,
          `${escapeHtml(category.name)} · ${formatDate(post.date)} · ${estimateReadTime(article)} min read · ${comments.length} comment${comments.length === 1 ? '' : 's'}`,
          comments,
          category.slug === 'poetry' ? ' reader-article--poem' : category.slug === 'art-dispatch' ? ' reader-article--dispatch' : ''
        );
      } catch (error) {
        reader.querySelector('.reader-body').innerHTML = '<p>This article could not load. Please return to the archive and try again.</p>';
        console.error(error);
      }
      return;
    }
  }
  if (pageSlug) {
    const page = catalog.pages.find((item) => item.slug === pageSlug);
    if (page) {
      document.title = `${textFromHtml(page.title)} — The Advocate`;
      showReader(textFromHtml(page.title), '<p>Loading this page from the Advocate archive…</p>', 'The Advocate');
      try {
        const response = await fetch('data/pages.json');
        if (!response.ok) throw new Error(`Page request failed (${response.status})`);
        const pages = await response.json();
        const fullPage = pages.find((item) => item.slug === page.slug);
        if (!fullPage) throw new Error('Page not found');
        showReader(textFromHtml(fullPage.title), fullPage.content, `The Advocate · ${formatDate(fullPage.modified || fullPage.date)}`);
      } catch (error) {
        reader.querySelector('.reader-body').innerHTML = '<p>This page could not load. Please return home and try again.</p>';
        console.error(error);
      }
      return;
    }
  }
  renderArchive();
}

async function loadCatalog() {
  try {
    const response = await fetch('data/catalog.json');
    if (!response.ok) throw new Error(`Archive request failed (${response.status})`);
    catalog = await response.json();
    catalog.categoriesById = new Map(catalog.categories.map((category) => [category.id, category]));
    catalog.categoriesBySlug = new Map(catalog.categories.map((category) => [category.slug, category]));
    catalog.commentCounts = new Map(Object.entries(catalog.commentCounts));
    await renderRoute();
  } catch (error) {
    archiveSummary.textContent = 'The archive could not load right now. Please refresh and try again.';
    console.error(error);
  }
}

loadCatalog();
