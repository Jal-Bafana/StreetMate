
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

type Order = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  vendor_id: string;
  seller_id: string;
};
type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: { name: string };
};

const Orders = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [profile?.user_id]);

  const fetchOrders = async () => {
    setLoading(true);
    if (!profile) return;
    // Show orders where user is seller or vendor
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`seller_id.eq.${profile.user_id},vendor_id.eq.${profile.user_id}`)
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  const fetchOrderItems = async (orderId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('order_items')
      .select('*, product:products(name)')
      .eq('order_id', orderId);
    if (!error && data) setOrderItems(data);
    setLoading(false);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const handleStatusUpdate = async (order: Order, status: string) => {
    setLoading(true);
    const updated_at = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at })
      .eq('id', order.id);
    if (updateError) {
      console.error('Supabase update error:', updateError);
      alert('Order update failed: ' + updateError.message);
    }
    // Re-fetch orders list
    fetchOrders();
    // Fetch the updated order and set as selectedOrder
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .maybeSingle();
    if (!error && updatedOrder) {
      setSelectedOrder(updatedOrder);
    } else if (selectedOrder) {
      setSelectedOrder({ ...selectedOrder, status });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      <div className="bg-white rounded shadow p-4">
        {loading ? <div>Loading...</div> : orders.length === 0 ? <div>No orders found.</div> : (
          <table className="w-full text-left mb-4">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-t">
                  <td>{order.id.slice(0, 8)}...</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>{order.status}</td>
                  <td>₹{order.total_amount}</td>
                  <td><Button size="sm" onClick={() => handleViewDetails(order)}>Details</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
              <button className="absolute top-2 right-2 text-xl" onClick={handleCloseDetails}>&times;</button>
              <h2 className="text-xl font-bold mb-2">Order Details</h2>
              <div className="mb-2">Order ID: {selectedOrder.id}</div>
              <div className="mb-2">Status: {selectedOrder.status}</div>
              <div className="mb-2">Total: ₹{selectedOrder.total_amount}</div>
              <div className="mb-2">Delivery Address: {selectedOrder.delivery_address}</div>
              <table className="w-full text-left mb-2">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map(item => (
                    <tr key={item.id} className="border-t">
                      <td>{item.product?.name || item.product_id}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.unit_price}</td>
                      <td>₹{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Status update for vendors */}
              {profile?.user_id === selectedOrder.vendor_id && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => handleStatusUpdate(selectedOrder, 'delivered')} disabled={selectedOrder.status === 'delivered'}>
                    Mark as Delivered
                  </Button>
                  <Button size="sm" onClick={() => handleStatusUpdate(selectedOrder, 'cancelled')} disabled={selectedOrder.status === 'cancelled'} variant="destructive">
                    Cancel Order
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
