const weddingDate = new Date('2027-03-06T15:00:00+09:00').getTime();
const countdown = {
  days: document.querySelector('[data-count="days"]'),
  hours: document.querySelector('[data-count="hours"]'),
  minutes: document.querySelector('[data-count="minutes"]'),
  seconds: document.querySelector('[data-count="seconds"]'),
};

function updateCountdown() {
  const secondsLeft = Math.max(0, Math.floor((weddingDate - Date.now()) / 1000));
  const values = {
    days: Math.floor(secondsLeft / 86400),
    hours: Math.floor((secondsLeft % 86400) / 3600),
    minutes: Math.floor((secondsLeft % 3600) / 60),
    seconds: secondsLeft % 60,
  };
  for (const [unit, node] of Object.entries(countdown)) node.textContent = String(values[unit]).padStart(2, '0');
  if (secondsLeft === 0) document.querySelector('.countdown-label').textContent = '오늘, 저희 결혼합니다';
}
updateCountdown();
setInterval(updateCountdown, 1000);

const galleryPhotos = Array.from({ length: 20 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return {
    src: `./assets/gallery/photo-${number}.webp`,
    thumb: `./assets/gallery/photo-${number}-thumb.webp`,
    alt: `웨딩 사진 ${index + 1}`,
  };
});
const gallery = document.querySelector('[data-gallery]');
if (galleryPhotos.length === 0) {
  gallery.classList.add('is-pending');
  for (let number = 1; number <= 20; number++) {
    const slot = document.createElement('div');
    slot.className = 'gallery-slot';
    slot.setAttribute('aria-hidden', 'true');
    slot.textContent = String(number).padStart(2, '0');
    gallery.append(slot);
  }
} else {
  galleryPhotos.forEach((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.galleryItem = '';
    button.dataset.galleryIndex = String(index);
    button.setAttribute('aria-label', `${index + 1}번째 사진 크게 보기`);
    const image = document.createElement('img');
    image.src = photo.thumb || photo.src;
    image.alt = photo.alt || `웨딩 사진 ${index + 1}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    button.append(image);
    gallery.append(button);
  });
}

const revealNodes = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  revealNodes.forEach((node) => observer.observe(node));
} else revealNodes.forEach((node) => node.classList.add('is-visible'));

const toast = document.querySelector('.toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

document.querySelector('[data-share]').addEventListener('click', async () => {
  const shareData = { title: document.title, text: '전윤호 · 이수정 결혼식에 초대합니다.', url: location.href };
  try {
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(location.href);
      showToast('청첩장 링크를 복사했습니다.');
    }
  } catch (error) {
    if (error.name !== 'AbortError') showToast('링크를 복사하지 못했습니다.');
  }
});

document.querySelectorAll('[data-account-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const details = document.getElementById(button.getAttribute('aria-controls'));
    const opening = details.hidden;
    details.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
    button.textContent = opening ? '접기' : '계좌 보기';
  });
});

async function copyAccountNumber(number) {
  const digitsOnly = number.replace(/\D/g, '');
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(digitsOnly);
      return true;
    }
  } catch { /* 일부 앱 내 브라우저에서는 다른 복사 방법을 사용합니다. */ }
  const field = document.createElement('textarea');
  field.value = digitsOnly;
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* 복사를 지원하지 않는 브라우저 */ }
  field.remove();
  return copied;
}

document.querySelectorAll('[data-copy-account]').forEach((button) => {
  button.addEventListener('click', async () => {
    const copied = await copyAccountNumber(button.dataset.copyAccount);
    showToast(copied ? '계좌번호 숫자만 복사했습니다.' : '계좌번호를 복사하지 못했습니다.');
    button.focus();
  });
});

const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxCaption = lightbox.querySelector('.lightbox-caption');
const lightboxCount = lightbox.querySelector('.lightbox-count');
let lastFocusedGalleryItem = null;
let currentGalleryIndex = -1;

function showGalleryPhoto(index) {
  if (!galleryPhotos.length) return;
  currentGalleryIndex = (index + galleryPhotos.length) % galleryPhotos.length;
  const photo = galleryPhotos[currentGalleryIndex];
  const description = photo.alt || `웨딩 사진 ${currentGalleryIndex + 1}`;
  lightboxImage.src = photo.src;
  lightboxImage.alt = description;
  lightboxCaption.textContent = photo.caption || '';
  lightboxCount.textContent = `${currentGalleryIndex + 1} / ${galleryPhotos.length}`;
  [-1, 1].forEach((offset) => {
    const preload = new Image();
    preload.src = galleryPhotos[(currentGalleryIndex + offset + galleryPhotos.length) % galleryPhotos.length].src;
  });
}

gallery.addEventListener('click', (event) => {
  const item = event.target.closest('[data-gallery-item]');
  if (!item) return;
  const index = Number(item.dataset.galleryIndex);
  if (!Number.isInteger(index) || index < 0 || index >= galleryPhotos.length) return;
  lastFocusedGalleryItem = item;
  showGalleryPhoto(index);
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lightbox.querySelectorAll('.lightbox-nav').forEach((button) => { button.hidden = galleryPhotos.length < 2; });
  lightbox.querySelector('[data-lightbox-close]').focus();
  if (lightbox.requestFullscreen) lightbox.requestFullscreen().catch(() => {});
});

function closeLightbox() {
  if (lightbox.hidden) return;
  if (document.fullscreenElement === lightbox) document.exitFullscreen().catch(() => {});
  lightbox.hidden = true;
  lightboxImage.removeAttribute('src');
  document.body.style.overflow = '';
  lastFocusedGalleryItem?.focus();
  currentGalleryIndex = -1;
}

lightbox.addEventListener('click', (event) => {
  if (event.target.closest('[data-lightbox-prev]')) showGalleryPhoto(currentGalleryIndex - 1);
  else if (event.target.closest('[data-lightbox-next]')) showGalleryPhoto(currentGalleryIndex + 1);
  else if (event.target === lightbox || event.target.closest('[data-lightbox-close]')) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (lightbox.hidden) return;
  if (event.key === 'Escape') closeLightbox();
  else if (event.key === 'ArrowLeft') { event.preventDefault(); showGalleryPhoto(currentGalleryIndex - 1); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); showGalleryPhoto(currentGalleryIndex + 1); }
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && !lightbox.hidden) closeLightbox();
});
let touchStart = null;
lightbox.addEventListener('touchstart', (event) => {
  touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
}, { passive: true });
lightbox.addEventListener('touchend', (event) => {
  if (!touchStart || lightbox.hidden || event.changedTouches.length !== 1) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    showGalleryPhoto(currentGalleryIndex + (dx < 0 ? 1 : -1));
  }
  touchStart = null;
}, { passive: true });
lightbox.addEventListener('touchcancel', () => { touchStart = null; });
lightbox.addEventListener('dblclick', (event) => event.preventDefault());
lightbox.addEventListener('gesturestart', (event) => event.preventDefault());
lightbox.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
lightbox.addEventListener('contextmenu', (event) => event.preventDefault());
