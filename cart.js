// ===== Loader =====
function showLoader() {
  document.getElementById("loadingOverlay").style.display = "flex";
}
function hideLoader() {
  document.getElementById("loadingOverlay").style.display = "none";
}

// ===== Current User & Cart =====
const currentUserRaw = localStorage.getItem("currentUser") || null;
let cart = currentUserRaw
  ? JSON.parse(localStorage.getItem("cart_" + currentUserRaw) || "[]")
  : JSON.parse(localStorage.getItem("guestCart") || "[]");

// ===== Identify User (email or phone) =====
function getUserIdentifier() {
  if (!currentUserRaw) return null;

  // If 10-digit number → treat as phone
  if (/^[0-9]{10}$/.test(currentUserRaw)) {
    return { loginId: currentUserRaw };
  }
  // Otherwise treat as email
  return { email: currentUserRaw };
}

// ===== Save Cart =====
function saveCart() {
  if (currentUserRaw) {
    localStorage.setItem("cart_" + currentUserRaw, JSON.stringify(cart));
  } else {
    localStorage.setItem("guestCart", JSON.stringify(cart));
  }
}

// ===== Render Cart =====
function renderCart() {
  const container = document.querySelector(".cart-container");
  if (!container) return;
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart">Your cart is empty</p>`;
  }

  cart.forEach(item => {
    const discountPercent = Math.round(
      ((item.original - item.price) / item.original) * 100
    );
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
      const product = cart.find(p => p.id === id);
      if (product) {
        product.qty += 1;
        saveCart();
        renderCart();
      }
    });
  });

  document.querySelectorAll(".decrease").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.closest(".product-card").dataset.id);
      const item = cart.find(p => p.id === id);
      if (item && item.qty > 1) {
        item.qty -= 1;
      } else {
        cart = cart.filter(p => p.id !== id); // remove if qty=0
      }
      saveCart();
      renderCart();
    });
  });

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.closest(".product-card").dataset.id);
      cart = cart.filter(p => p.id !== id); // completely remove
      saveCart();
      renderCart();
    });
  });
}

// ===== Checkout Button =====
const checkoutBtn = document.querySelector(".checkout-btn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    // Case 1: Not logged in
    if (!currentUserRaw) {
      alert("Please login first.");
      window.location.href = "login.html";
      return;
    }

    // Case 2: Save checkout data
    let total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const checkoutData = {
      ...getUserIdentifier(),
      cart: cart,
      total: total,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("checkoutData", JSON.stringify(checkoutData));

    // Case 3: Redirect to address page
    window.location.href = "adress.html";
  });
}

// ===== Fix: Add product fresh after removal =====
function addToCart(newItem) {
  // Always check if item exists
  const existing = cart.find(p => p.id === newItem.id);
  if (existing) {
    // Reset if it was previously removed completely
    existing.qty = (existing.qty || 0) + (newItem.qty || 1);
  } else {
    cart.push({ ...newItem, qty: newItem.qty || 1 });
  }
  saveCart();
  renderCart();
}

// ===== Init =====
window.addEventListener("load", () => {
  hideLoader();
  renderCart();
});
