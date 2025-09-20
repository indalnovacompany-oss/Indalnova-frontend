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

  okBtn.onclick = () => (overlay.style.display = "none");
}

// ===== Current User & Cart =====
const currentUserEmail = localStorage.getItem("currentUser") || null;
const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
const currentUser = currentUserEmail || "guest";
const cartKey = "cart_" + currentUser;
let cart = JSON.parse(localStorage.getItem(cartKey) || "[]");

// ===== Save Cart =====
function saveCart() {
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

// ===== Render Cart =====
function renderCart() {
  const container = document.querySelector(".cart-container");
  const totalElem = document.querySelector(".total-text");
  if (!container) return;
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart" style="text-align:center; padding:20px;">Your cart is empty</p>`;
    if (totalElem) totalElem.innerText = "Total: ₹0";
    hideLoader();
    return;
  }
  if (totalElem) totalElem.style.display = "block";

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
  const totalElem = document.querySelector(".total-text");
  if (!totalElem) return;
  if (cart.length === 0) {
    totalElem.innerText = "Total: ₹0";
    return;
  }
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  totalElem.innerText = "Total: ₹" + total;
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
        if (product.qty > 1) product.qty -= 1;
        else cart = cart.filter(p => p.id !== id);
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

// ===== Add to Cart =====
function addToCart(newItem) {
  const existing = cart.find(p => p.id === newItem.id);
  if (existing) existing.qty = (existing.qty || 0) + (newItem.qty || 1);
  else cart.push({ ...newItem, qty: newItem.qty || 1 });
  saveCart();
  renderCart();
  showAlert("success", `${newItem.name} added to cart`);
}

// ===== Checkout Button =====
const checkoutBtn = document.querySelector(".checkout-btn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (!currentUserEmail || !isLoggedIn) {
      showAlert("error", "Please login first.");
      setTimeout(() => window.location.href = "login.html", 1200);
      return;
    }

    if (cart.length === 0) {
      showAlert("error", "Cart is empty!");
      return;
    }

    // Save cart to localStorage for address.html
    localStorage.setItem("checkoutCart", JSON.stringify(cart));

    // Redirect to address page
    window.location.href = "adress.html";
  });
}

// ===== Init =====
window.addEventListener("load", () => {
  renderCart();
});

