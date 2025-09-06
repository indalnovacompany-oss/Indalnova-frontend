// ===== Cart Setup =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let appliedCoupon = null;

// ===== Render Cart =====
function renderCart() {
  const container = document.querySelector(".cart-container");
  container.innerHTML = "";

  cart.forEach(item => {
    const discountPercent = Math.round(((item.original - item.price) / item.original) * 100);
    const div = document.createElement("div");
    div.classList.add("product-card");
    div.setAttribute("data-id", item.id);
    div.setAttribute("data-price", item.price);
    div.setAttribute("data-original", item.original);
    div.innerHTML = `
      <img src="${item.image}" alt="Product" class="product-image">
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
  let total = 0;
  cart.forEach(item => total += item.price * item.qty);

  if (appliedCoupon) {
    if (appliedCoupon.type === "percent") total -= total * appliedCoupon.value / 100;
    else if (appliedCoupon.type === "fixed") total -= appliedCoupon.value;
  }

  document.querySelector(".total-text").innerText = "Total: ₹" + total;
}

// ===== Attach Events =====
function attachEvents() {
  document.querySelectorAll(".increase").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      const id = parseInt(card.getAttribute("data-id"));
      const item = cart.find(p => p.id === id);
      item.qty += 1;
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });

  document.querySelectorAll(".decrease").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      const id = parseInt(card.getAttribute("data-id"));
      const item = cart.find(p => p.id === id);
      if (item.qty > 1) item.qty -= 1;
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      const id = parseInt(card.getAttribute("data-id"));
      cart = cart.filter(p => p.id !== id);
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });
}

// ===== Coupon Toggle =====
const couponHeader = document.querySelector(".coupn-header");
const couponItems = document.getElementById("coupon-items");
if (couponHeader) {
  couponHeader.addEventListener("click", () => {
    couponItems.style.display = couponItems.style.display === "flex" ? "none" : "flex";
  });
}

document.querySelectorAll(".apply-coupon, .apply").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!appliedCoupon) {
      appliedCoupon = {
        code: btn.dataset.code,
        type: btn.dataset.type,
        value: parseInt(btn.dataset.value)
      };
      alert("Coupon applied: " + (btn.previousElementSibling?.innerText || "Manual Code"));
      updateTotal();
    } else {
      alert("Only one coupon can be applied at a time!");
    }
  });
});

// ===== Toggle Eye Icon =====
const eye = document.getElementById("eye");
const eyeSlash = document.getElementById("eyeSlash");
const toggleBtn = document.getElementById("toggel");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    if (eye.style.display !== "none") {
      eye.style.display = "none";
      eyeSlash.style.display = "inline-block";
    } else {
      eye.style.display = "inline-block";
      eyeSlash.style.display = "none";
    }
  });
}

// ===== Scroll Behavior =====
window.onload = () => {
  renderCart();
  const cartContainer = document.querySelector(".cart-container");
  if (cartContainer.scrollHeight > window.innerHeight) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }
};

// ===== Delivery Modal =====
const modal = document.getElementById("deliveryModal");
const closeBtn = modal.querySelector(".close");
document.querySelector(".checkout-btn").addEventListener("click", () => modal.style.display = "flex");
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

// ===== Handle Delivery Form & Razorpay Checkout =====
document.getElementById("deliveryForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = e.target;
  const user = {
    name: form.querySelector('input[name="name"]').value,
    phone: form.querySelector('input[name="phone"]').value,
    address: form.querySelector('input[name="address"]').value,
    landmark: form.querySelector('input[name="landmark"]').value,
    city: form.querySelector('input[name="city"]').value,
    state: form.querySelector('input[name="state"]').value,
    pincode: form.querySelector('input[name="pincode"]').value
  };

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart, user })
    });
    const data = await res.json();

    if (res.ok && data.orderId) {
      modal.style.display = "none";

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Indalnova",
        description: "Purchase",
        order_id: data.orderId,
        handler: function (response) {
          alert("Payment Successful! Razorpay ID: " + response.razorpay_payment_id);
          localStorage.removeItem("cart");
          window.location.href = "index.html";
        },
        theme: { color: "#F37254" }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    } else {
      alert(data.message || "Failed to create order");
    }

  } catch (err) {
    console.error(err);
    alert("Something went wrong!");
  }
});
