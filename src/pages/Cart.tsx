
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

type Product = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  unit: string;
  image_url: string | null;
  vendor_id: string;
};

const Cart = () => {
  const { profile } = useAuth();
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [address, setAddress] = useState(profile?.address || '');

  useEffect(() => {
    const cartLS = localStorage.getItem('cart');
    if (cartLS) setCart(JSON.parse(cartLS));
  }, []);

  useEffect(() => {
    if (Object.keys(cart).length > 0) fetchProducts();
    // eslint-disable-next-line
  }, [JSON.stringify(cart)]);

  const fetchProducts = async () => {
    setLoading(true);
    const ids = Object.keys(cart);
    if (ids.length === 0) return setProducts([]);
    const { data, error } = await supabase.from('products').select('*').in('id', ids);
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const handleQtyChange = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => {
      const updated = { ...prev, [id]: qty };
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemove = (id: string) => {
    setCart(prev => {
      const updated = { ...prev };
      delete updated[id];
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCheckout = async () => {
    if (!profile) return;
    if (!address.trim()) {
      setCheckoutMsg('Please enter a delivery address.');
      return;
    }
    setLoading(true);
    setCheckoutMsg('');
    // Optionally update profile address for future checkouts
    if (address !== profile.address) {
      await supabase.from('profiles').update({ address }).eq('user_id', profile.user_id);
    }
    // Group products by vendor
    const vendorGroups: { [vendorId: string]: Product[] } = {};
    products.forEach(p => {
      if (!vendorGroups[p.vendor_id]) vendorGroups[p.vendor_id] = [];
      vendorGroups[p.vendor_id].push(p);
    });
    // Create one order per vendor
    for (const vendorId of Object.keys(vendorGroups)) {
      const items = vendorGroups[vendorId];
      const total = items.reduce((sum, p) => sum + (p.price * (cart[p.id] || 1)), 0);
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        seller_id: profile.user_id,
        vendor_id: vendorId,
        delivery_address: address,
        total_amount: total,
        status: 'pending',
      }).select().single();
      if (orderError || !order) {
        setCheckoutMsg('Order failed. Please try again.');
        setLoading(false);
        return;
      }
      // Insert order items
      for (const p of items) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: p.id,
          quantity: cart[p.id],
          unit_price: p.price,
          subtotal: p.price * cart[p.id],
        });
      }
    }
    setCart({});
    localStorage.removeItem('cart');
    setCheckoutMsg('Order placed successfully!');
    setLoading(false);
  };

  const total = products.reduce((sum, p) => sum + (p.price * (cart[p.id] || 1)), 0);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Cart</h1>
      <div className="bg-white rounded shadow p-4">
        {products.length === 0 ? <div>Your cart is empty.</div> : (
          <>
            <table className="w-full text-left mb-4">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-t">
                    <td>{p.name}</td>
                    <td>₹{p.price}</td>
                    <td>
                      <input type="number" min={1} value={cart[p.id] || 1} onChange={e => handleQtyChange(p.id, Number(e.target.value))} className="border p-1 rounded w-16" />
                    </td>
                    <td>₹{p.price * (cart[p.id] || 1)}</td>
                    <td><Button size="sm" variant="destructive" onClick={() => handleRemove(p.id)}>Remove</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Address input */}
            <div className="mb-4">
              <label className="block font-medium mb-1" htmlFor="address">Delivery Address</label>
              <input
                id="address"
                type="text"
                className="border p-2 rounded w-full"
                placeholder="Enter your delivery address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </>
        )}
        {products.length > 0 && (
          <div className="flex justify-between items-center">
            <div className="font-bold">Total: ₹{total}</div>
            <Button onClick={handleCheckout} disabled={loading}>Checkout</Button>
          </div>
        )}
        {checkoutMsg && <div className="mt-4 text-green-600 font-semibold">{checkoutMsg}</div>}
      </div>
    </div>
  );
};

export default Cart;
