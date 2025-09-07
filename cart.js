// ===== Loader =====
function showLoader() { document.getElementById("loadingOverlay").style.display = "flex"; }
function hideLoader() { document.getElementById("loadingOverlay").style.display = "none"; }

// ===== Current User & Cart =====
const currentUserEmail = localStorage.getItem("currentUser") || null;
let cart = currentUserEmail
  ? JSON.parse(localStorage.getItem("cart_" + currentUserEmail) || "[]")
  : JSON.parse(localStorage.getItem("guestCart") || "[]");

function saveCart() {
  if (currentUserEmail) {
    localStorage.setItem("cart_" + currentUserEmail, JSON.stringify(cart));
  } else {
    localStorage.setItem("guestCart", JSON.stringify(cart));
  }
}

// ===== Render Cart =====
function renderCart() {
  const container = document.querySelector(".cart-container");
  if (!container) return;
  container.innerHTML = "";

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
      const id = parseInt(btn.closest(".product-card").dataset.id);
      cart.find(p => p.id === id).qty += 1;
      saveCart();
      renderCart();
    });
  });

  document.querySelectorAll(".decrease").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.closest(".product-card").dataset.id);
      const item = cart.find(p => p.id === id);
      if (item.qty > 1) item.qty -= 1;
      saveCart();
      renderCart();
    });
  });

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.closest(".product-card").dataset.id);
      cart = cart.filter(p => p.id !== id);
      saveCart();
      renderCart();
    });
  });
}

// ===== Checkout Button =====
const checkoutBtn = document.querySelector(".checkout-btn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (!currentUserEmail) {
      alert("Please login first.");
      window.location.href = "login.html";
      return;
    }

    // Redirect to shipping page every time checkout is clicked
    window.location.href = "shipping.html";
  });
}

// ===== Init =====
window.addEventListener("load", () => {
  hideLoader();
  renderCart();
});
