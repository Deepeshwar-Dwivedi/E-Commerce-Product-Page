const API_URL = 'https://fakestoreapi.com/products';
const productsContainer = document.getElementById('products');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cartModal');
const cartItemsDiv = document.getElementById('cartItems');
const cartTotalDiv = document.getElementById('cartTotal');
const closeCartBtn = document.getElementById('closeCart');
const clearCartBtn = document.getElementById('clearCart');
const sortSelect = document.getElementById('sortSelect');
const categoryFilter = document.getElementById('categoryFilter');
const cartBtn = document.querySelector('.cart');

let products = [];
let filteredProducts = [];
let categories = [];
let cart = {};

// --- Fetch Products & Categories ---
async function fetchProducts() {
  try {
    const res = await fetch(API_URL);
    products = await res.json();
    filteredProducts = [...products];
    renderProducts();
    fetchCategories();
  } catch (err) {
    productsContainer.innerHTML = `<p style="color:red">Failed to load products.</p>`;
  }
}

async function fetchCategories() {
  try {
    const res = await fetch('https://fakestoreapi.com/products/categories');
    categories = await res.json();
    renderCategories();
  } catch (err) {
    // fallback: extract from products
    categories = [...new Set(products.map(p => p.category))];
    renderCategories();
  }
}

function renderCategories() {
  categoryFilter.innerHTML = `<option value="all">All</option>`;
  for (const cat of categories) {
    categoryFilter.innerHTML += `<option value="${cat}">${capitalize(cat)}</option>`;
  }
}

// --- Render Products ---
function renderProducts() {
  if (!filteredProducts.length) {
    productsContainer.innerHTML = `<p>No products found.</p>`;
    return;
  }
  productsContainer.innerHTML = '';
  filteredProducts.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${prod.image}" alt="${prod.title}" />
      <div class="product-title">${prod.title}</div>
      <div class="product-category">${capitalize(prod.category)}</div>
      <div class="product-price">$${prod.price.toFixed(2)}</div>
      <button data-id="${prod.id}">Add to Cart</button>
    `;
    card.querySelector('button').onclick = () => addToCart(prod);
    productsContainer.appendChild(card);
  });
}

// --- Sorting ---
sortSelect.addEventListener('change', () => {
  sortProducts(sortSelect.value);
  renderProducts();
});

function sortProducts(type) {
  switch (type) {
    case 'price-asc': filteredProducts.sort((a,b) => a.price - b.price); break;
    case 'price-desc': filteredProducts.sort((a,b) => b.price - a.price); break;
    case 'title-asc': filteredProducts.sort((a,b) => a.title.localeCompare(b.title)); break;
    case 'title-desc': filteredProducts.sort((a,b) => b.title.localeCompare(a.title)); break;
    default: filteredProducts = [...products];
  }
}

// --- Filtering ---
categoryFilter.addEventListener('change', () => {
  const cat = categoryFilter.value;
  filteredProducts = cat === 'all' ? [...products] : products.filter(p => p.category === cat);
  sortProducts(sortSelect.value);
  renderProducts();
});

// --- Cart Logic (localStorage) ---
function loadCart() {
  cart = JSON.parse(localStorage.getItem('cart')) || {};
  updateCartCount();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  let total = 0;
  for (const id in cart) total += cart[id].qty;
  cartCount.textContent = total;
}

function addToCart(product) {
  if (!cart[product.id]) {
    cart[product.id] = { ...product, qty: 1 };
  } else {
    cart[product.id].qty++;
  }
  saveCart();
  showCart();
}

cartBtn.addEventListener('click', showCart);

function showCart() {
  renderCart();
  cartModal.style.display = 'flex';
}

closeCartBtn.onclick = () => cartModal.style.display = 'none';

window.onclick = (e) => {
  if (e.target === cartModal) cartModal.style.display = 'none';
};

function renderCart() {
  cartItemsDiv.innerHTML = '';
  let total = 0;
  const ids = Object.keys(cart);
  if (!ids.length) {
    cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
    cartTotalDiv.textContent = '';
    return;
  }
  ids.forEach(id => {
    const item = cart[id];
    total += item.price * item.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <span class="cart-item-title">${item.title}</span>
      <button class="remove-btn" title="Remove" data-id="${id}">&minus;</button>
      <span class="cart-item-qty">${item.qty}</span>
      <button class="remove-btn" title="Add" data-id="${id}" data-add="1">&plus;</button>
      <span style="font-weight:bold;">$${(item.price*item.qty).toFixed(2)}</span>
    `;
    // Remove and add handlers
    const [minusBtn, plusBtn] = div.querySelectorAll('.remove-btn');
    minusBtn.onclick = () => changeQty(id, -1);
    plusBtn.onclick = () => changeQty(id, 1);
    cartItemsDiv.appendChild(div);
  });
  cartTotalDiv.textContent = `Total: $${total.toFixed(2)}`;
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  saveCart();
  renderCart();
}

clearCartBtn.onclick = () => {
  cart = {};
  saveCart();
  renderCart();
};

// --- Utility ---
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Init ---
window.onload = () => {
  fetchProducts();
  loadCart();
};