
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  unit: string;
  image_url: string | null;
  category_id: string;
};

type Category = {
  id: string;
  name: string;
};

const Inventory = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    unit: '',
    image_url: '',
    category_id: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  // Fetch categories for dropdown
  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (!error && data) setCategories(data);
  };

  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', profile?.user_id);
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.user_id) fetchProducts();
    fetchCategories();
    // eslint-disable-next-line
  }, [profile?.user_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingId) {
      // Update
      await supabase.from('products').update({
        ...form,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
      }).eq('id', editingId);
    } else {
      // Insert
      await supabase.from('products').insert({
        ...form,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        vendor_id: profile?.user_id,
        is_available: true,
        category_id: form.category_id || (categories[0]?.id ?? ''),
      });
    }
    setForm({ name: '', description: '', price: '', stock_quantity: '', unit: '', image_url: '', category_id: '' });
    setEditingId(null);
    fetchProducts();
    setLoading(false);
  };

  const handleEdit = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      stock_quantity: String(p.stock_quantity),
      unit: p.unit,
      image_url: p.image_url || '',
      category_id: p.category_id,
    });
    setEditingId(p.id);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Manage Inventory</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" required />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" min="0" className="border p-2 rounded" required />
        <input name="stock_quantity" value={form.stock_quantity} onChange={handleChange} placeholder="Stock" type="number" min="0" className="border p-2 rounded" required />
        <input name="unit" value={form.unit} onChange={handleChange} placeholder="Unit (e.g. kg, pcs)" className="border p-2 rounded" required />
        <select name="category_id" value={form.category_id} onChange={handleChange} className="border p-2 rounded" required>
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="Image URL (optional)" className="border p-2 rounded col-span-2" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border p-2 rounded col-span-2" />
        <div className="col-span-2 flex gap-2">
          <Button type="submit" disabled={loading}>{editingId ? 'Update' : 'Add'} Product</Button>
          {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm({ name: '', description: '', price: '', stock_quantity: '', unit: '', image_url: '', category_id: '' }); }}>Cancel</Button>}
        </div>
      </form>
      <div className="bg-white rounded shadow p-4">
        {loading ? <div>Loading...</div> : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Category</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t">
                  <td>{p.name}</td>
                  <td>₹{p.price}</td>
                  <td>{p.stock_quantity}</td>
                  <td>{p.unit}</td>
                  <td>{categories.find(c => c.id === p.category_id)?.name || ''}</td>
                  <td>{p.description}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>Edit</Button>{' '}
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Inventory;
