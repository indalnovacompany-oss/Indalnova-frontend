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
  const currentUser = localStorage.getItem("currentUser") || null; // can be email or phone
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return { currentUser, isLoggedIn };
}

let { currentUser, isLoggedIn } = getCurrentUser();

// ===== Load Products =====
document.addEventListener("DOMContentLoaded", async () => {
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
            if (typeof addToCart === "function") addToCart(productToAdd); // from cart.js
            showAlert("success", `${productToAdd.name} added to cart!`);
          });
        });

        // ===== Buy Now Event =====
        document.querySelectorAll(".buy-now").forEach(button => {
          button.addEventListener("click", () => {
            const id = parseInt(button.dataset.id);
            const productToBuy = products.find(p => p.id === id);
            showLoader();
            if (typeof addToCart === "function") addToCart(productToBuy); // from cart.js
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

  // ===== Login Button Toggle (email or phone) =====
  const loginBtn = document.getElementById("loginBtn");

  if (loginBtn) loginBtn.style.display = "none"; // hide initially to avoid flash

  if (currentUser && isLoggedIn) {
    try {
      const body = {};
      if (currentUser.includes("@")) body.email = currentUser;
      else body.phone = currentUser;

      const res = await fetch("/api/checkuser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.exists) {
        if (loginBtn) loginBtn.style.display = "none"; // hide login button
      } else {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("isLoggedIn");
        if (loginBtn) loginBtn.style.display = "inline-block"; // show login button
      }
    } catch (err) {
      console.error(err);
      if (loginBtn) loginBtn.style.display = "inline-block"; // show login on error
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block"; // show login if not logged in
  }

  // ===== Logout Button (optional) =====
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("isLoggedIn");
      if (currentUser) localStorage.removeItem("cart_" + currentUser);
      location.reload();
    });
  }

  // ===== If cart.html page, hide loader after load =====
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


