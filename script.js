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

// 사진을 받으면 이 배열에 { src: './assets/photo-01.jpg', alt: '사진 설명' } 형식으로 추가합니다.
const galleryPhotos = [];
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
  document.querySelector('[data-gallery-subtitle]').textContent = '사진을 눌러 크게 보실 수 있습니다.';
  galleryPhotos.forEach((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.galleryItem = '';
    button.setAttribute('aria-label', `${index + 1}번째 사진 크게 보기`);
    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = photo.alt || `웨딩 사진 ${index + 1}`;
    image.loading = 'lazy';
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
let lastFocusedGalleryItem = null;

document.addEventListener('click', (event) => {
  const item = event.target.closest('[data-gallery-item]');
  if (!item) return;
  const image = item.querySelector('img');
  if (!image) return;
  lastFocusedGalleryItem = item;
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = image.alt;
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lightbox.querySelector('[data-lightbox-close]').focus();
  if (lightbox.requestFullscreen) lightbox.requestFullscreen().catch(() => {});
});

function closeLightbox() {
  if (document.fullscreenElement === lightbox) document.exitFullscreen().catch(() => {});
  lightbox.hidden = true;
  lightboxImage.removeAttribute('src');
  document.body.style.overflow = '';
  lastFocusedGalleryItem?.focus();
}

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox || event.target.closest('[data-lightbox-close]')) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && !lightbox.hidden) closeLightbox();
});
lightbox.addEventListener('dblclick', (event) => event.preventDefault());
lightbox.addEventListener('gesturestart', (event) => event.preventDefault());
lightbox.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
lightbox.addEventListener('contextmenu', (event) => event.preventDefault());
