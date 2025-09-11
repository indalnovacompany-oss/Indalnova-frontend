// ===== Current User & Cart =====
const currentUserRaw = localStorage.getItem("currentUser") || null;
let cart = currentUserRaw
  ? JSON.parse(localStorage.getItem("cart_" + currentUserRaw) || "[]")
  : JSON.parse(localStorage.getItem("guestCart") || "[]");

// ===== Save Cart =====
function saveCart() {
  if (currentUserRaw) {
    localStorage.setItem("cart_" + currentUserRaw, JSON.stringify(cart));
  } else {
    localStorage.setItem("guestCart", JSON.stringify(cart));
  }
}

// ===== Load Products =====
fetch("product.json")
  .then(res => res.json())
  .then(products => {
    const container = document.querySelector(".skincare-product-container");

    products.forEach(product => {
      const div = document.createElement("div");
      div.classList.add("skincare-product");
      div.innerHTML = `
        <div class="skincare-product-image">
          <img src="${product.image}" alt="">
        </div>
        <div class="product-details-box">
          <span id="skincare-name">${product.name}</span>
          <div class="price-detail">
            <span id="price">&#x20B9;${product.price}</span>
            <span id="actual-price">&#x20B9;${product.original}</span>
            <span id="discount">${product.discount} OFF</span>
          </div>
          <span id="alert">MRP Inclusive Of All Taxes</span>
          <div class="skin-rating">
            <i class="fa-solid fa-star"></i>4.7 | 67
          </div>
          <div class="skincare-atc">
            <button class="add-to-cart" data-id="${product.id}">
              Add to cart <i class="fa-solid fa-cart-shopping" style="margin-left:10px;"></i>
            </button>
            <button class="buy-now" data-id="${product.id}">
              Buy Now
            </button>
            <span id="note">* Delivery will take approx 2-7 days.</span>
          </div>
        </div>
      `;
      container.appendChild(div);
    });

    // Add-to-cart button
    document.querySelectorAll(".add-to-cart").forEach(button => {
      button.addEventListener("click", () => {
        const id = parseInt(button.dataset.id);
        const product = products.find(p => p.id === id);
        addToCart(product);
        alert(`${product.name} added to cart`);
      });
    });

    // Buy-now button
    document.querySelectorAll(".buy-now").forEach(button => {
      button.addEventListener("click", () => {
        const id = parseInt(button.dataset.id);
        const product = products.find(p => p.id === id);
        addToCart(product);
        window.location.href = "cart.html"; // redirect immediately
      });
    });
  })
  .catch(err => console.error("Error loading products:", err));

// ===== Add to Cart =====
function addToCart(product) {
  let existing = cart.find(p => p.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    product.qty = 1;
    cart.push(product);
  }
  saveCart(); // ✅ use correct save system
}
