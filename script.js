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
