// ===== Loader Functions =====
function showLoader() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "flex";
}
function hideLoader() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "none";
}

// ===== Custom Alert =====
const customAlert = document.getElementById("customAlert");
const alertMessage = customAlert ? customAlert.querySelector(".alert-message") : null;
const alertOkBtn = customAlert ? customAlert.querySelector(".alert-ok") : null;

function showCustomAlert(message, duration = 3500) {
  if (!customAlert || !alertMessage) return;
  alertMessage.textContent = message;
  customAlert.style.display = "flex";
  clearTimeout(showCustomAlert._t);
  showCustomAlert._t = setTimeout(() => { customAlert.style.display = "none"; }, duration);
}
if (alertOkBtn) {
  alertOkBtn.addEventListener("click", () => { customAlert.style.display = "none"; });
}

function showAlert(type, message) {
  const overlay = document.getElementById("customAlert");
  if (!overlay) return;

  const icon = overlay.querySelector(".alert-icon");
  const title = overlay.querySelector(".alert-title");
  const msg = overlay.querySelector(".alert-message");
  const okBtn = overlay.querySelector(".alert-ok");

  if (!icon || !title || !msg || !okBtn) return;

  let iconClass = "fa-circle-exclamation";
  let color = "#ff4d4d";
  let titleText = "Alert";

  if (type === "success") {
    iconClass = "fa-circle-check";
    color = "#28a745";
    titleText = "Success";
  } else if (type === "error") {
    iconClass = "fa-circle-xmark";
    color = "#ff4d4d";
    titleText = "Error";
  } else if (type === "info") {
    iconClass = "fa-circle-info";
    color = "#007bff";
    titleText = "Info";
  }

  icon.className = `fa-solid ${iconClass} alert-icon`;
  icon.style.color = color;
  title.innerText = titleText;
  msg.innerText = message;
  overlay.style.display = "flex";

  okBtn.onclick = () => (overlay.style.display = "none");
}

// ===== Coming Soon (pages / features under development) =====
function comingSoon(e) {
  if (e && e.preventDefault) e.preventDefault();
  showCustomAlert("This page is under development. We're launching online soon!");
}

// ===== Feature strip mobile auto-slider =====
document.addEventListener("DOMContentLoaded", () => {
  const features = document.querySelectorAll(".feature > div");
  if (!features.length) return;

  let index = 0;
  let interval = null;

  function showNextFeature() {
    features.forEach(f => f.classList.remove("active"));
    features[index].classList.add("active");
    index = (index + 1) % features.length;
  }

  function startSlider() {
    if (window.innerWidth <= 440) {
      showNextFeature();
      interval = setInterval(showNextFeature, 3000);
    } else {
      features.forEach(f => f.classList.add("active"));
    }
  }

  startSlider();

  window.addEventListener("resize", () => {
    if (interval) clearInterval(interval);
    features.forEach(f => f.classList.remove("active"));
    index = 0;
    startSlider();
  });
});

// ===== Hero slider =====
const slider = document.getElementById('slider');
const slides = slider ? slider.querySelectorAll('picture') : [];
const heroIndicators = document.querySelectorAll('.hero-indicator');
const heroPrev = document.getElementById('heroPrev');
const heroNext = document.getElementById('heroNext');
let currentIndex = 0;
let heroInterval;

function updateHeroAspectRatio() {
  const activeImage = slides[currentIndex]?.querySelector('img');
  if (!activeImage || !activeImage.naturalWidth || !activeImage.naturalHeight) return;

  const hero = slider.closest('.hero-slider');
  if (hero) {
    hero.style.aspectRatio = `${activeImage.naturalWidth} / ${activeImage.naturalHeight}`;
  }
}

function showSlide(index) {
  if (!slides.length) return;
  currentIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    slide.style.display = (i === currentIndex) ? 'block' : 'none';
  });
  heroIndicators.forEach((indicator, i) => {
    indicator.classList.toggle('active', i === currentIndex);
    indicator.setAttribute('aria-current', i === currentIndex ? 'true' : 'false');
  });
  updateHeroAspectRatio();
}

if (slides.length) {
  slides.forEach(slide => {
    slide.querySelector('img')?.addEventListener('load', updateHeroAspectRatio);
  });
  showSlide(currentIndex);
  heroInterval = setInterval(() => {
    showSlide(currentIndex + 1);
  }, 7000);

  heroIndicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      showSlide(index);
      clearInterval(heroInterval);
      heroInterval = setInterval(() => showSlide(currentIndex + 1), 7000);
    });
  });

  const restartHeroInterval = () => {
    clearInterval(heroInterval);
    heroInterval = setInterval(() => showSlide(currentIndex + 1), 7000);
  };

  heroPrev?.addEventListener('click', () => {
    showSlide(currentIndex - 1);
    restartHeroInterval();
  });

  heroNext?.addEventListener('click', () => {
    showSlide(currentIndex + 1);
    restartHeroInterval();
  });
}

const faqChatToggle = document.getElementById('faqChatToggle');
const faqChatPanel = document.getElementById('faqChatPanel');
const faqChatClose = document.getElementById('faqChatClose');
const faqChatMessages = document.getElementById('faqChatMessages');
const faqChatComposer = document.getElementById('faqChatComposer');
const faqChatInput = document.getElementById('faqChatInput');

function setFaqChatOpen(isOpen) {
  if (!faqChatToggle || !faqChatPanel) return;
  faqChatPanel.hidden = !isOpen;
  faqChatToggle.setAttribute('aria-expanded', String(isOpen));
}

faqChatToggle?.addEventListener('click', () => {
  setFaqChatOpen(faqChatPanel.hidden);
});

faqChatClose?.addEventListener('click', () => setFaqChatOpen(false));

document.querySelectorAll('.faq-chat-questions button').forEach(question => {
  question.addEventListener('click', () => {
    addFaqChatExchange(question.textContent, question.dataset.answer || '');
  });
});

function addFaqChatMessage(className, text) {
  if (!faqChatMessages || !text) return;

  const message = document.createElement('p');
  message.className = className;
  message.textContent = text;
  faqChatMessages.appendChild(message);
  message.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function addFaqChatExchange(question, answer) {
  if (!question || !answer) return;
  addFaqChatMessage('faq-chat-user', question);
  addFaqChatMessage('faq-chat-answer', answer);
}

faqChatComposer?.addEventListener('submit', event => {
  event.preventDefault();

  const question = faqChatInput?.value.trim() || '';
  if (!question) return;

  const normalizedQuestion = question.toLowerCase();
  const answer = normalizedQuestion.includes('contact')
    || normalizedQuestion.includes('email')
    || normalizedQuestion.includes('phone')
    || normalizedQuestion.includes('call')
    ? 'I’d be happy to help! You can email us at supportindalnova@gmail.com or call us on +91 884 039 3051. Our team will get back to you as soon as possible.'
    : 'We’re getting everything ready for you! Indalnova is launching online soon. Right now, we’re operating offline, but we’ll be online with our fragrances shortly.';

  addFaqChatMessage('faq-chat-answer', answer);
  if (faqChatInput) faqChatInput.value = '';
});

// ===== Helper: random rating (avg between 4.0-5.0, count under 30) =====
function randomRating() {
  const avg = (Math.random() * (5 - 4) + 4).toFixed(1);
  const count = Math.floor(Math.random() * 29) + 1; // 1-29
  return { avg, count };
}

// ===== Load Products =====
document.addEventListener("DOMContentLoaded", async () => {
  const productContainer = document.querySelector(".product-container");
  if (!productContainer) return;

  showLoader();

  try {
    const res = await fetch("product.json");
    const products = await res.json();

    products.forEach(product => {
      const rating = randomRating();
      const div = document.createElement("div");
      div.classList.add("top-product");
      div.innerHTML = `
        <div class="product-img">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="details">
          <div class="rating"><i class="fa-solid fa-star"></i> ${rating.avg} | ${rating.count}</div>
          <p>${product.name}</p>
          <p>&#8377;${product.price} <span class="dis">&#8377;${product.original}</span>
          <span class="savings">${product.discount} OFF</span></p>
          <div class="atc">
            <button class="buy-now" data-id="${product.id}">Buy Now</button>
          </div>
        </div>
      `;
      productContainer.appendChild(div);
    });

    hideLoader();

    document.querySelectorAll(".buy-now").forEach(btn => {
      btn.addEventListener("click", () => comingSoon());
    });

  } catch (err) {
    hideLoader();
    showAlert("error", "Failed to load products!");
    console.error(err);
  }
});

// ===== Nav Toggles =====
function hideelement() {
  const nav2 = document.querySelector(".nav-2");
  const overlay = document.getElementById("navOverlay");
  if (nav2) nav2.classList.toggle("show");
  if (overlay) overlay.classList.toggle("show");
}
function back() {
  const nav2 = document.querySelector(".nav-2");
  const overlay = document.getElementById("navOverlay");
  if (nav2) nav2.classList.remove("show");
  if (overlay) overlay.classList.remove("show");
}

// ===== Under Development / Coming Soon popup on load (home page only) =====
(function () {
  const devPopup = document.getElementById('devPopup');
  if (!devPopup) return;

  const devPopupClose = document.getElementById('devPopupClose');
  const devPopupOk = document.getElementById('devPopupOk');
  let autoCloseTimer;

  function openDevPopup() {
    devPopup.classList.add('show');
    autoCloseTimer = setTimeout(closeDevPopup, 8000);
  }

  function closeDevPopup() {
    devPopup.classList.remove('show');
    clearTimeout(autoCloseTimer);
  }

  window.addEventListener('load', openDevPopup);
  if (devPopupClose) devPopupClose.addEventListener('click', closeDevPopup);
  if (devPopupOk) devPopupOk.addEventListener('click', closeDevPopup);
  devPopup.addEventListener('click', (e) => {
    if (e.target === devPopup) closeDevPopup();
  });
})();