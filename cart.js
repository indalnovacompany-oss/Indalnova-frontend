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
const currentUser = localStorage.getItem("username") || "guest";
const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
const cartKey = "cart_" + currentUser;
let cart = JSON.parse(localStorage.getItem(cartKey) || "[]");

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
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
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
  checkoutBtn.addEventListener("click", async () => {
    if (!currentUser || currentUser === "guest" || !isLoggedIn) {
      showAlert("error", "Please login first.");
      setTimeout(() => window.location.href = "login.html", 1200);
      return;
    }

    if (cart.length === 0) {
      showAlert("error", "Cart is empty!");
      return;
    }

    showLoader();

    // Get shipping details from form
    const shippingDetails = {
      name: document.getElementById("name")?.value,
      phone: document.getElementById("phone")?.value,
      address1: document.getElementById("address1")?.value,
      address2: document.getElementById("address2")?.value,
      city: document.getElementById("city")?.value,
      state: document.getElementById("state")?.value,
      pin: document.getElementById("pin")?.value,
      notes: document.getElementById("notes")?.value
    };

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "COD";

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          shippingDetails,
          paymentMethod,
          email: currentUser
        })
      });
      const data = await res.json();

      if (!data.success) {
        hideLoader();
        showAlert("error", data.message || "Checkout failed");
        return;
      }

      if (data.step === "checkout" && paymentMethod === "ONLINE") {
        // Razorpay payment
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          order_id: data.orderId,
          handler: async function (response) {
            const saveRes = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cart,
                shippingDetails,
                paymentMethod,
                email: currentUser,
                paymentId: response.razorpay_payment_id,
                paymentSignature: response.razorpay_signature
              })
            });
            const saveData = await saveRes.json();
            if (saveData.success) {
              showAlert("success", "Payment successful and order placed!");
              localStorage.removeItem(cartKey);
              setTimeout(() => window.location.href = `order-success.html?orderId=${saveData.data[0].order_id}`, 1000);
            } else showAlert("error", saveData.message || "Payment save failed");
          },
          prefill: { name: shippingDetails.name, email: currentUser, contact: shippingDetails.phone },
          theme: { color: "#28a745" }
        };
        const rzp = new Razorpay(options);
        rzp.open();
        hideLoader();
      } else if (data.step === "saved") {
        // COD order saved
        showAlert("success", "Order placed successfully (COD)!");
        localStorage.removeItem(cartKey);
        setTimeout(() => window.location.href = `order-success.html?orderId=${data.data[0].order_id}`, 1000);
        hideLoader();
      }
    } catch (err) {
      hideLoader();
      console.error(err);
      showAlert("error", "Checkout failed. Try again.");
    }
  });
}

// ===== Init =====
window.addEventListener("load", () => {
  renderCart();
});


