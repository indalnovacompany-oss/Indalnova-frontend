// ===== Loader Functions =====
function showLoader() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "flex";
}
function hideLoader() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "none";
}
document.addEventListener("DOMContentLoaded", () => {
  const features = document.querySelectorAll(".feature > div");
  let index = 0;
  let interval;

  function showNextFeature() {
    features.forEach(f => f.classList.remove("active"));
    features[index].classList.add("active");
    index = (index + 1) % features.length;
  }

  function startSlider() {
    if (window.innerWidth <= 440) {
      showNextFeature(); // show first
      interval = setInterval(showNextFeature, 3000); // change every 3s
    } else {
      features.forEach(f => f.classList.add("active")); // show all
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


const slider = document.getElementById('slider');
const slides = slider.querySelectorAll('img');
let currentIndex = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.style.display = (i === index) ? 'block' : 'none';
  });
}

// Initially show first slide
showSlide(currentIndex);

// Auto-slide every 3 seconds
setInterval(() => {
  currentIndex = (currentIndex + 1) % slides.length;
  showSlide(currentIndex);
}, 5000);
// ===== Custom Alert =====
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

// ===== Current User & Cart Key (UNIFIED!) =====
function getCurrentUser() {
  const email = localStorage.getItem("currentUser") || null;
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return { email, isLoggedIn };
}
function setLoginSession(userEmail) {
  localStorage.setItem("currentUser", userEmail);
  localStorage.setItem("isLoggedIn", "true");
}
function clearLoginSession() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("isLoggedIn");
}

let { email: currentUserEmail, isLoggedIn } = getCurrentUser();
// Unified Cart Key: guest = cart_guest, user = cart_email
const cartKey = currentUserEmail ? "cart_" + currentUserEmail : "cart_guest";

// ===== Cart Functions =====
function addToCart(newItem) {
  let cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
  const existing = cart.find(p => p.id === newItem.id);
  if (existing) {
    existing.qty = (existing.qty || 0) + (newItem.qty || 1);
  } else {
    cart.push({ ...newItem, qty: newItem.qty || 1 });
  }
  localStorage.setItem(cartKey, JSON.stringify(cart));
  showAlert("success", `${newItem.name} added to cart!`);
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
      const div = document.createElement("div");
      div.classList.add("top-product");
      div.innerHTML = `
        <div class="product-img">
          <img src="${product.image}" alt="">
        </div>
        <div class="details">
          <div class="rating"><i class="fa-solid fa-star"></i> 4.7 | 67</div>
          <p>${product.name}</p>
          <p>₹${product.price} <span class="dis">₹${product.original}</span>
          <span class="savings">${product.discount} OFF</span></p>
          <div class="atc">
            <button class="add-to-cart" data-id="${product.id}">Add to cart <i class="fa-solid fa-cart-shopping"></i></button>
            <button class="buy-now" data-id="${product.id}">Buy Now</button>
          </div>
        </div>
      `;
      productContainer.appendChild(div);
    });

    hideLoader();

    // ===== Add to Cart Event =====
    document.querySelectorAll(".add-to-cart").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const product = products.find(p => p.id === id);
        addToCart(product);
      });
    });

    // ===== Buy Now Event =====
    document.querySelectorAll(".buy-now").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const product = products.find(p => p.id === id);

        addToCart(product);

        localStorage.setItem("checkoutData", JSON.stringify({
          items: [product],
          total: product.price,
          timestamp: new Date().toISOString(),
          user: currentUserEmail || "guest"
        }));

        window.location.href = "cart.html";
      });
    });

  } catch (err) {
    hideLoader();
    showAlert("error", "Failed to load products!");
    console.error(err);
  }

  // ===== Login Button Toggle =====
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.style.display = "none"; // Hide by default

    if (currentUserEmail && isLoggedIn) {
      (async () => {
        try {
          const body = /^[0-9]{10}$/.test(currentUserEmail)
            ? { phone: currentUserEmail }
            : { email: currentUserEmail };

          const res = await fetch("/api/checkuser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          const data = await res.json();

          if (data.exists) {
            // User exists: keep hidden
            loginBtn.style.display = "none";
          } else {
            // User does not exist: clear and show
            clearLoginSession();
            loginBtn.style.display = "inline-block";
          }
        } catch (err) {
          // On error, clear session
          clearLoginSession();
          loginBtn.style.display = "inline-block";
        }
      })();
    } else {
      // No user: show login
      loginBtn.style.display = "inline-block";
    }
  }

  if (window.location.pathname.includes("cart.html")) {
    hideLoader();
  }
});

// ===== Nav Toggles =====
function hideelement() {
  document.querySelector(".nav-2").classList.toggle("show");
}
function back() {
  document.querySelector(".nav-2").classList.remove("show");
}
//follow-popup//
const popup = document.getElementById("popup");
const openBtn = document.getElementById("exploreProducts"); // heading trigger
const phoneInput = document.getElementById("phone-number");
const submitBtn = document.getElementById("submitPhoneBtn");
const customAlert = document.getElementById("customAlert");
const alertMessage = customAlert.querySelector(".alert-message");
const alertOkBtn = customAlert.querySelector(".alert-ok");

// Open popup on heading click
openBtn.addEventListener("click", () => { popup.style.display = "flex"; });

// Close popup
function closePopup() { popup.style.display = "none"; }

// Close when clicking outside
window.addEventListener("click", (e) => { if (e.target === popup) { closePopup(); } });

// Show alert
function showCustomAlert(message, duration = 3000) {
  alertMessage.textContent = message;
  customAlert.style.display = "flex";
  setTimeout(() => { customAlert.style.display = "none"; }, duration);
}
alertOkBtn.addEventListener("click", () => { customAlert.style.display = "none"; });

// Validate phone number & submit
submitBtn.addEventListener("click", async () => {
  const phone = phoneInput.value.trim();
  const phoneRegex = /^[1-9]\d{9}$/;

  if (!phoneRegex.test(phone)) {
    showCustomAlert("Please enter a valid 10-digit phone number.");
    return;
  }

  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });

    const result = await res.json();

    if (result.success) {
      showCustomAlert(result.message || "Thank you! Subscribed.");
      phoneInput.value = "";
      closePopup();
    } else {
      showCustomAlert(result.message || "Something went wrong.");
    }
  } catch (err) {
    console.error(err);
    showCustomAlert("Error: could not subscribe.");
  }
});



