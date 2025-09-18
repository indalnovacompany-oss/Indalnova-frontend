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

let { email: currentUserEmail, isLoggedIn } = getCurrentUser();

// Each user has a separate cart
let cart = currentUserEmail
  ? JSON.parse(localStorage.getItem("cart_" + currentUserEmail) || "[]")
  : JSON.parse(localStorage.getItem("guestCart") || "[]");

// ===== Save Cart Function =====
function saveCart() {
  if (currentUserEmail) {
    localStorage.setItem("cart_" + currentUserEmail, JSON.stringify(cart));
  } else {
    localStorage.setItem("guestCart", JSON.stringify(cart));
  }
}

// ===== Load Products =====
document.addEventListener("DOMContentLoaded", () => {
  const productContainer = document.querySelector(".product-container");
  if (productContainer) {
    showLoader();
    fetch("product.json")
      .then(res => res.json())
      .then(products => {
        products.forEach(product => {
          const div = document.createElement("div");
          div.classList.add("top-product");
          div.innerHTML = `
            <div class="product-img">
              <img src="${product.image}" alt="${product.name}">
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
            addToCart(productToAdd);
            showAlert("success", `${productToAdd.name} added to cart!`);
          });
        });

        // ===== Buy Now Event =====
        document.querySelectorAll(".buy-now").forEach(button => {
          button.addEventListener("click", () => {
            const id = parseInt(button.dataset.id);
            const productToBuy = products.find(p => p.id === id);
            addToCart(productToBuy);
            showAlert("info", `Redirecting to cart for ${productToBuy.name}...`);
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
  }

  // ===== Login/Logout Toggle =====
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn && logoutBtn) {
    const { email, isLoggedIn } = getCurrentUser();
    if (email && isLoggedIn) {
      loginBtn.style.display = "none";
      logoutBtn.style.display = "flex";
    } else {
      loginBtn.style.display = "flex";
      logoutBtn.style.display = "none";
    }
  }

  // ===== Logout Function =====
  window.logoutUser = function () {
    localStorage.setItem("isLoggedIn", "false");
    localStorage.removeItem("currentUser");
    showAlert("info", "You have been logged out!");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
  };
});

// ===== Add to Cart =====
function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
}

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
  if (!overlay) {
    console.error("Custom alert overlay not found!");
    return;
  }

  const icon = overlay.querySelector(".alert-icon");
  const title = overlay.querySelector(".alert-title");
  const msg = overlay.querySelector(".alert-message");
  const okBtn = overlay.querySelector(".alert-ok");

  if (!icon || !title || !msg || !okBtn) {
    console.error("Custom alert inner elements missing!");
    return;
  }

  // Set alert type
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

// ===== Optional simpler alert calls =====
function showCustomAlert(message) {
  const alertBox = document.getElementById("customAlert");
  const alertMessage = alertBox.querySelector(".alert-message");
  alertMessage.textContent = message;
  alertBox.style.display = "flex";
}

function closeCustomAlert() {
  document.getElementById("customAlert").style.display = "none";
}

function closeCustomAlert() {
  document.getElementById("customAlert").style.display = "none";
}

