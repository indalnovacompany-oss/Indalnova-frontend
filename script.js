let cart = JSON.parse(localStorage.getItem("cart")) || [];

// 🚫 Remove this → don't set always true (only set in login.html after successful login)
// localStorage.setItem("isLoggedIn", "true");

document.addEventListener("DOMContentLoaded", () => {
  // ===== Products Section (only runs if product-container exists) =====
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
              <div class="rating">
                <i class="fa-solid fa-star"></i>4.7 | 67
              </div>
              <p>${product.name}</p>
              <p>
                ₹${product.price} 
                <span class="dis">₹${product.original}</span> 
                <span class="savings">${product.discount} OFF</span>
              </p>
              <div class="atc">
                <button class="add-to-cart" data-id="${product.id}">
                  Add to cart <i class="fa-solid fa-cart-shopping"></i>
                </button>
                <button class="buy-now" data-id="${product.id}">
                  Buy Now
                </button>
              </div>
            </div>
          `;
          productContainer.appendChild(div);
        });

        // Add-to-Cart
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

  // ===== Login/Logout Section =====
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn && logoutBtn) { // ✅ Check they exist
    if (isLoggedIn) {
      loginBtn.style.display = "none";
      logoutBtn.style.display = "flex";
    } else {
      loginBtn.style.display = "flex";
      logoutBtn.style.display = "none";
    }
  }

  // Logout function
  window.logoutUser = function () {
    localStorage.setItem("isLoggedIn", "false");
    window.location.href = "login.html";
  };

  // Add to cart function
  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
  }
});
