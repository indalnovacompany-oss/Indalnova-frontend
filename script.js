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

// ===== Current User & Login Status =====
function getCurrentUser() {
  const email = localStorage.getItem("currentUser") || null;
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return { email, isLoggedIn };
}

let { email: currentUserEmail, isLoggedIn } = getCurrentUser();
const currentUser = currentUserEmail || "guest";
const cartKey = "cart_" + currentUser;

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

// ===== Load Products and Setup Events =====
document.addEventListener("DOMContentLoaded", async () => {
  const productContainer = document.querySelector(".product-container");
  const loginBtn = document.getElementById("loginBtn");
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
          user: currentUser
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
  if (loginBtn) loginBtn.style.display = "inline-block";

  if (currentUserEmail && isLoggedIn) {
    (async () => {
      try {
        const body = { email: currentUserEmail };
        const res = await fetch("/api/checkUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        let data;
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse JSON from /api/checkUser:", text);
          data = { exists: false };
        }

        if (data.exists) {
          loginBtn.style.display = "none";
        } else {
          localStorage.removeItem("currentUser");
          localStorage.removeItem("isLoggedIn");
          loginBtn.style.display = "inline-block";
        }
      } catch (err) {
        console.error("Login check failed:", err);
        loginBtn.style.display = "inline-block";
      }
    })();
  }

  // ===== Hide loader for cart page =====
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


