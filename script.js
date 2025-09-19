// ===== Loader Functions =====
function showLoader() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "flex";
}
function hideLoader() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "none";
}

// ===== Current User & Login Status =====
function getCurrentUser() {
  const email = localStorage.getItem("currentUser") || null;
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return { email, isLoggedIn };
}

// ===== Verify User From DB =====
async function verifyUser(silent = true) {
  const { email, isLoggedIn } = getCurrentUser();
  if (!email || !isLoggedIn) return true; // Not logged in → continue

  showLoader();
  try {
    const res = await fetch(`/api/checkUser?identifier=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (!data.success) {
      // User deleted → force logout
      localStorage.removeItem("currentUser");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("cart_" + email);

      if (!silent) showAlert("error", "Your account was deleted. Please log in again.");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
      return false;
    }
    return true; // User verified
  } catch (err) {
    console.error("User verification failed:", err);
    return true; // Allow page to continue even if verification fails
  } finally {
    hideLoader();
  }
}

// ===== Load Products & Setup =====
document.addEventListener("DOMContentLoaded", async () => {
  const loginBtn = document.getElementById("loginBtn");

  // Compute login status fresh
  let { email, isLoggedIn } = getCurrentUser();

  // Show login button first if user not logged in
  if (!isLoggedIn) {
    if (loginBtn) loginBtn.style.display = "flex";
  }

  // Only verify user if logged in
  if (isLoggedIn) {
    const verified = await verifyUser(true); // silent
    if (verified && loginBtn) loginBtn.style.display = "none";
  }

  // Load products
  const productContainer = document.querySelector(".product-container");
  if (!productContainer) return;

  showLoader();
  fetch("product.json")
    .then(res => res.json())
    .then(products => {
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
              <button class="add-to-cart" data-id="${product.id}">
                Add to cart <i class="fa-solid fa-cart-shopping"></i>
              </button>
              <button class="buy-now" data-id="${product.id}">Buy Now</button>
            </div>
          </div>
        `;
        productContainer.appendChild(div);
      });

      hideLoader();

      // Add to cart buttons
      document.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("click", () => {
          const id = parseInt(button.dataset.id);
          const productToAdd = products.find(p => p.id === id);
          if (typeof addToCart === "function") addToCart(productToAdd);
          showAlert("success", `${productToAdd.name} added to cart!`);
        });
      });

      // Buy now buttons
      document.querySelectorAll(".buy-now").forEach(button => {
        button.addEventListener("click", () => {
          const id = parseInt(button.dataset.id);
          const productToBuy = products.find(p => p.id === id);
          showLoader();
          if (typeof addToCart === "function") addToCart(productToBuy);
          setTimeout(() => {
            window.location.href = "cart.html";
          }, 1200);
        });
      });
    })
    .catch(() => {
      hideLoader();
      showAlert("error", "Failed to load products!");
    });

  // Hide loader on cart page
  if (window.location.pathname.includes("cart.html")) hideLoader();
});

// ===== Nav Toggles =====
function hideelement() {
  document.querySelector(".nav-2").classList.toggle("show");
}
function back() {
  document.querySelector(".nav-2").classList.remove("show");
}

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

