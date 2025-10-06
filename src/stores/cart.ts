import { persistentAtom } from '@nanostores/persistent';

// Cart item type that matches Snipcart format
export interface CartItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  url?: string;
  quantity: number;
}

// Persistent cart store
export const cart = persistentAtom<CartItem[]>('snipcart-cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Cart actions
export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const currentCart = cart.get();
  const existingItem = currentCart.find(cartItem => cartItem.id === item.id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    currentCart.push({ ...item, quantity: 1 });
  }
  
  cart.set([...currentCart]);
}

export function removeFromCart(itemId: string) {
  cart.set(cart.get().filter(item => item.id !== itemId));
}

export function updateQuantity(itemId: string, quantity: number) {
  const currentCart = cart.get();
  const item = currentCart.find(cartItem => cartItem.id === itemId);
  
  if (item) {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      item.quantity = quantity;
      cart.set([...currentCart]);
    }
  }
}

export function clearCart() {
  cart.set([]);
}

// Force clear cart from localStorage (useful for debugging)
export function forceClearCart() {
  cart.set([]);
  localStorage.removeItem('snipcart-cart');
}

export function getCartCount() {
  return cart.get().reduce((total, item) => total + item.quantity, 0);
}

export function getCartTotal() {
  return cart.get().reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Transfer cart to Snipcart for checkout
export function transferToSnipcart() {
  const cartItems = cart.get();
  
  if (cartItems.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  // Clear Snipcart first
  if ((window as any).Snipcart && (window as any).Snipcart.api) {
    (window as any).Snipcart.api.cart.clear();
    
    // Add each item to Snipcart
    cartItems.forEach(item => {
      (window as any).Snipcart.api.cart.add({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        url: item.url || window.location.origin + '/product-page/' + item.id,
        description: item.description,
        image: item.image
      });
    });
    
    // Open Snipcart checkout
    (window as any).Snipcart.api.cart.open();
    
    // Clear Nanostores cart after transfer
    clearCart();
  } else {
    alert('Checkout system is loading, please try again in a moment.');
  }
}
