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

// ===== Feature strip mobile slider =====
document.addEventListener("DOMContentLoaded", () => {
  const features = document.querySelectorAll(".feature > div");
  if (!features.length) return;

  let index = 0;
  let interval;

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
    clearInterval(interval);
    features.forEach(f => f.classList.remove("active"));
    index = 0;
    startSlider();
  });
});

// ===== Hero slider =====
const slider = document.getElementById('slider');
const slides = slider ? slider.querySelectorAll('img') : [];
let currentIndex = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.style.display = (i === index) ? 'block' : 'none';
  });
}

if (slides.length) {
  showSlide(currentIndex);
  setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    showSlide(currentIndex);
  }, 5000);
}

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