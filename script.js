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
  const isLoggedIn = localStorage.getItem("userLoggedIn") === "true"; // <-- updated key
  return { email, isLoggedIn };
}

let { email: currentUserEmail, isLoggedIn } = getCurrentUser();

// ===== Verify User From DB =====
async function verifyUser(silent = true) {
  if (!currentUserEmail || !isLoggedIn) return false; // No verification needed

  showLoader(); // Show loader while checking DB

  try {
    const res = await fetch(`/api/checkUser?identifier=${encodeURIComponent(currentUserEmail)}`);
    const data = await res.json();

    if (!data.success) {
      // User deleted → force logout
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userLoggedIn");
      localStorage.removeItem("cart_" + currentUserEmail);

      if (!silent) showAlert("error", "Your account was deleted. Please log in again.");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
      return false;
    }

    return true; // User verified
  } catch (err) {
    console.error("User verification failed:", err);
    if (!silent) showAlert("error", "Unable to verify account. Try again later.");
    return false;
  } finally {
    hideLoader();
  }
}

// ===== Load Products =====
document.addEventListener("DOMContentLoaded", async () => {
  const loginBtn = document.getElementById("loginBtn");

  // Check login status first
  const { email, isLoggedIn } = getCurrentUser();
  if (loginBtn) loginBtn.style.display = email && isLoggedIn ? "none" : "flex";

  // Verify user silently if logged in
  if (isLoggedIn) {
    const valid = await verifyUser(true); // silent verification
    if (!valid) {
      if (loginBtn) loginBtn.style.display = "flex";
    } else {
      if (loginBtn) loginBtn.style.display = "none";
    }
  }

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

      // ===== Add to Cart Event =====
      document.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("click", () => {
          const id = parseInt(button.dataset.id);
          const productToAdd = products.find(p => p.id === id);
          if (typeof addToCart === "function") addToCart(productToAdd);
          showAlert("success", `${productToAdd.name} added to cart!`);
        });
      });

      // ===== Buy Now Event =====
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

  // ===== Hide loader if on cart.html =====
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

