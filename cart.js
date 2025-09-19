// ===== Loader =====
function showLoader() {
  const loader = document.getElementById("loadingOverlay");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("loadingOverlay");
  if (loader) loader.style.display = "none";
}

// ===== Custom Alert =====
function showAlert(type, message) {
  const overlay = document.getElementById("customAlert");
  if (!overlay) return;

  const icon = overlay.querySelector(".alert-icon");
  const title = overlay.querySelector(".alert-title");
  const msg = overlay.querySelector(".alert-message");
  const okBtn = overlay.querySelector(".alert-ok");

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

  okBtn.onclick = () => {
    overlay.style.display = "none";
  };
}

// ===== Current User & Cart =====
const currentUserRaw = localStorage.getItem("currentUser") || null;
const cartKey = currentUserRaw ? "cart_" + currentUserRaw : "guestCart";
let cart = JSON.parse(localStorage.getItem(cartKey) || "[]");

// ===== Identify User (email or phone) =====
function getUserIdentifier() {
  if (!currentUserRaw) return null;
  if (/^[0-9]{10}$/.test(currentUserRaw)) return { loginId: currentUserRaw };
  return { email: currentUserRaw };
}

// ===== Save Cart =====
function saveCart() {
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

// ===== Render Cart =====
function renderCart() {
  const container = document.querySelector(".cart-container");
  if (!container) return;
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart" style="text-align:center; padding:20px;">Your cart is empty</p>`;
    hideLoader();
    return;
  }

  cart.forEach(item => {
    const discountPercent = Math.round(((item.original - item.price) / item.original) * 100);
    const div = document.createElement("div");
    div.classList.add("product-card");
    div.dataset.id = item.id;
    div.innerHTML = `
      <img src="${item.image}" alt="" class="product-image">
      <div class="product-info">
        <h3 class="product-name">${item.name}</h3>
        <p class="product-mrp">MRP: <span class="strike">₹${item.original}</span></p>
        <p class="product-price">₹${item.price} <span class="savings">${discountPercent}% OFF</span></p>
        <p class="free-shipping">Free Shipping</p>
        <div class="quantity">
          <button class="decrease">-</button>
          <span class="qty">${item.qty}</span>
          <button class="increase">+</button>
        </div>
      </div>
      <span class="remove-btn"><i class="fa fa-trash"></i></span>
    `;
    container.appendChild(div);
  });

  attachEvents();
  updateTotal();
  hideLoader();
}

// ===== Update Total =====
function updateTotal() {
  let total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalElem = document.querySelector(".total-text");
  if (totalElem) totalElem.innerText = "Total: ₹" + total;
}

// ===== Attach Events =====
function attachEvents() {
  document.querySelectorAll(".increase").forEach(btn => {
    btn.addEventListener("click", () => {
      showLoader();
      const id = parseInt(btn.closest(".product-card").dataset.id);
      const product = cart.find(p => p.id === id);
      if (product) product.qty += 1;
      saveCart();
      renderCart();
    });
  });

  document.querySelectorAll(".decrease").forEach(btn => {
    btn.addEventListener("click", () => {
      showLoader();
      const id = parseInt(btn.closest(".product-card").dataset.id);
      const product = cart.find(p => p.id === id);
      if (product) {
        if (product.qty > 1) {
          product.qty -= 1;
        } else {
          cart = cart.filter(p => p.id !== id);
          showAlert("success", `${product.name} removed from cart`);
        }
        saveCart();
        renderCart();
      }
    });
  });

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      showLoader();
      const id = parseInt(btn.closest(".product-card").dataset.id);
      const product = cart.find(p => p.id === id);
      cart = cart.filter(p => p.id !== id);
      saveCart();
      renderCart();
      showAlert("success", `${product.name} removed from cart`);
    });
  });
}

// ===== Checkout Button =====
const checkoutBtn = document.querySelector(".checkout-btn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (!currentUserRaw) {
      showAlert("error", "Please login first.");
      setTimeout(() => window.location.href = "login.html", 1200);
      return;
    }
    if (cart.length === 0) {
      showAlert("error", "Cart is empty!");
      return;
    }

    showLoader();
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const checkoutData = { ...getUserIdentifier(), cart, total, timestamp: new Date().toISOString() };
    localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    setTimeout(() => {
      hideLoader();
      showAlert("success", "Proceeding to address page...");
      window.location.href = "adress.html";
    }, 800);
  });
}

// ===== Add to Cart =====
function addToCart(newItem) {
  const existing = cart.find(p => p.id === newItem.id);
  if (existing) {
    existing.qty = (existing.qty || 0) + (newItem.qty || 1);
  } else {
    cart.push({ ...newItem, qty: newItem.qty || 1 });
  }
  saveCart();
  renderCart();
  showAlert("success", `${newItem.name} added to cart`);
}

// ===== Init =====
window.addEventListener("load", () => {
  showLoader();

  if (currentUserRaw) {
    // POST check to backend (email or phone)
    const body = currentUserRaw.includes("@") ? { email: currentUserRaw } : { phone: currentUserRaw };
    fetch("/api/checkUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (!data.exists) {
          localStorage.removeItem("currentUser");
          localStorage.removeItem(cartKey);
          showAlert("error", "Your account no longer exists. Please sign up again.");
          setTimeout(() => window.location.href = "login.html", 1500);
          return;
        }
        // User exists → render cart
        renderCart();
      })
      .catch(() => {
        hideLoader();
        showAlert("error", "Unable to verify account. Try again later.");
      });
  } else {
    // Guest user → render cart
    renderCart();
  }
});

