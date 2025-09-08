// ===== Loader Functions =====
function showLoader() { document.getElementById("loadingOverlay").style.display = "flex"; }
function hideLoader() { document.getElementById("loadingOverlay").style.display = "none"; }

// ===== Current User Setup =====
const currentUserEmail = localStorage.getItem("currentUser") || null;

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
                <button class="add-to-cart" data-id="${product.id}">Add to cart <i class="fa-solid fa-cart-shopping"></i></button>
                <button class="buy-now" data-id="${product.id}">Buy Now</button>
              </div>
            </div>
          `;
          productContainer.appendChild(div);
        });

        // Add to Cart
        document.querySelectorAll(".add-to-cart").forEach(button => {
          button.addEventListener("click", () => {
            const id = parseInt(button.dataset.id);
            const productToAdd = products.find(p => p.id === id);
            addToCart(productToAdd);
            alert(`${productToAdd.name} added to cart!`);
          });
        });

        // Buy Now
        document.querySelectorAll(".buy-now").forEach(button => {
          button.addEventListener("click", () => {
            const id = parseInt(button.dataset.id);
            const productToBuy = products.find(p => p.id === id);
            addToCart(productToBuy);
            window.location.href = "cart.html";
          });
        });
      });
  }

  // ===== Login/Logout Toggle =====
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (currentUserEmail) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "flex";
  } else {
    loginBtn.style.display = "flex";
    logoutBtn.style.display = "none";
  }

  window.logoutUser = function () {
    localStorage.setItem("isLoggedIn", "false");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
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

