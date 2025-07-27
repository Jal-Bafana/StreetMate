
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
type Category = { id: string; name: string };

const Browse = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // Load cart from localStorage
    const cartLS = localStorage.getItem('cart');
    if (cartLS) setCart(JSON.parse(cartLS));
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*').eq('is_available', true);
    if (selectedCategory) query = query.eq('category_id', selectedCategory);
    const { data, error } = await query;
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (!error && data) setCategories(data);
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const updated = { ...prev, [product.id]: (prev[product.id] || 0) + 1 };
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Filter products by search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Browse Products</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <select value={selectedCategory} onChange={handleCategoryChange} className="border p-2 rounded">
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <input value={search} onChange={handleSearchChange} placeholder="Search products..." className="border p-2 rounded flex-1" />
      </div>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id} className="border-t">
                  <td>{p.name}</td>
                  <td>₹{p.price}</td>
                  <td>{p.stock_quantity}</td>
                  <td>{p.unit}</td>
                  <td>{categories.find(c => c.id === p.category_id)?.name || ''}</td>
                  <td>{p.description}</td>
                  <td>
                    <Button size="sm" onClick={() => handleAddToCart(p)} disabled={p.stock_quantity === 0}>
                      {p.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
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

export default Browse;
