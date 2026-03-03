// =============================================================
// APP.JS — The Ink & Page Shop
// Merged from: cart.js + main.js
// =============================================================

// =============================================================
// SECTION 1: CART ENGINE (localStorage)
// =============================================================

const CART_KEY = 'inkpage_cart';

/** Get cart array from localStorage */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

/** Save cart array to localStorage */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/** Add an item to the cart (or increment qty if already exists) */
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  updateCartBadge();
  showCartToast(product.name);
  renderCartPanel();
}

/** Remove an item entirely from the cart */
function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  updateCartBadge();
  renderCartPanel();
}

/** Increment or decrement item quantity (removes if qty < 1) */
function updateQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty += delta;
    if (item.qty < 1) {
      removeFromCart(productId);
      return;
    }
  }
  saveCart(cart);
  updateCartBadge();
  renderCartPanel();
}

/** Get total item count across all cart lines */
function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

/** Get cart subtotal */
function getSubtotal() {
  return getCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/** Update the cart badge number in the navbar */
function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = getCartCount();
  badges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

/** Show a slide-up toast notification when an item is added */
function showCartToast(name) {
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className = 'cart-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>✓</span> <span><strong>${name}</strong> added to cart</span>`;
  toast.classList.add('show');
  clearTimeout(window._cartToastTimer);
  window._cartToastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/** Show a generic info toast (used for checkout, etc.) */
function showInfoToast(message) {
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className = 'cart-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>🛍️</span> <span>${message}</span>`;
  toast.classList.add('show');
  clearTimeout(window._cartToastTimer);
  window._cartToastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/** Render the full cart panel contents */
function renderCartPanel() {
  const container = document.getElementById('cart-items-container');
  const footer = document.getElementById('cart-footer');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p style="font-weight:600;color:#1a1a1a;margin-bottom:0.25rem;">Your cart is empty</p>
        <p style="font-size:0.85rem;">Start exploring our books and stationery!</p>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&q=60'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateQty('${item.id}', -1)">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <button class="cart-remove" onclick="removeFromCart('${item.id}')" title="Remove">✕</button>
    </div>
  `).join('');

  const subtotalEl = document.getElementById('cart-subtotal');
  if (subtotalEl) subtotalEl.textContent = `$${getSubtotal().toFixed(2)}`;
}

// =============================================================
// SECTION 2: PAGE BEHAVIORS
// =============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Init cart on every page ────────────────────────────────
  updateCartBadge();
  renderCartPanel();

  // ── Checkout button (no alert — uses toast) ────────────────
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      showInfoToast('Checkout coming soon! Your cart is safely saved.');
    });
  }

  // ── Navbar scroll behavior ────────────────────────────────
  const navbar = document.getElementById('main-navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on load
  }

  // ── Fade-up scroll animation (Intersection Observer) ──────
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    fadeEls.forEach(el => observer.observe(el));
  }

  // ── Filter tabs (books & stationery pages) ────────────────
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.filter-tabs');
      group.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterProducts(tab.dataset.filter);
    });
  });

  function filterProducts(category) {
    const cards = document.querySelectorAll('.product-card-wrap');
    cards.forEach(card => {
      const cardCat = card.dataset.category || 'all';
      if (category === 'all' || cardCat === category) {
        card.style.display = '';
        card.style.animation = 'fadeIn 0.35s ease';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // ── Contact form validation ───────────────────────────────
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.classList.add('was-validated');
        return;
      }
      const btn = contactForm.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Message Sent!';
      btn.disabled = true;
      btn.style.background = '#2a7c8a';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.disabled = false;
        btn.style.background = '';
        contactForm.reset();
        contactForm.classList.remove('was-validated');
      }, 3000);
    });
  }

  // ── Newsletter form ───────────────────────────────────────
  const newsletterForms = document.querySelectorAll('.newsletter-form');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const input = form.querySelector('input');
      const orig = btn.textContent;
      btn.textContent = '✓ Subscribed!';
      btn.disabled = true;
      input.value = '';
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = false;
      }, 3000);
    });
  });

});
