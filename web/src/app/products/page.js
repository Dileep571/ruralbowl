'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { productsAPI } from '@/lib/api';

// Fallback simple card if ProductCard component is unavailable
function SimpleProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl shadow-elegant overflow-hidden hover:shadow-elegant-lg hover:-translate-y-1 transition-all duration-300">
      <div className="aspect-square bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url || '/images/placeholder.png'} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-2 sm:p-3 md:p-4">
        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-sm sm:text-base md:text-lg font-bold text-primary-600">₹{Number(product.price || 0).toFixed(2)}</p>
        <Link href={`/products/${product.slug}`} className="mt-2 inline-flex items-center text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium">View →</Link>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [search, setSearch] = useState(urlSearchQuery);

  // Update search state when URL search parameter changes
  useEffect(() => {
    setSearch(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [cats, prods] = await Promise.all([
          productsAPI.getCategories().catch(() => []),
          productsAPI.getAll().catch(() => []),
        ]);
        if (!isMounted) return;
        const categoriesArray = Array.isArray(cats) ? cats : [];
        const productsArray = Array.isArray(prods) ? prods : [];
        setCategories([{ id: 'all', name: 'All', slug: 'all' }, ...categoriesArray]);
        setProducts(productsArray);
        
        // Set selected category based on URL parameter
        if (urlCategory && urlCategory !== 'all') {
          const matchingCat = categoriesArray.find(c => c.slug === urlCategory || c.id === urlCategory);
          if (matchingCat) {
            setSelectedCategoryId(matchingCat.id);
          } else {
            setSelectedCategoryId(urlCategory);
          }
        }
      } catch (e) {
        if (!isMounted) return;
        setError('Failed to load products. Please try again later.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [urlCategory]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cat = selectedCategoryId;
    return (products || []).filter(p => {
      const matchesSearch = term ? (p.name || '').toLowerCase().includes(term) : true;
      const matchesCategory = cat === 'all' ? true : (
        p.category_id === cat ||
        p.category === cat ||
        (p.category && (p.category.id === cat || p.category.slug === cat)) ||
        (typeof cat === 'number' && (p.category_id === Number(cat))) ||
        (p.category_slug === cat)
      );
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategoryId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
        </div>
      </div>

      {/* Categories filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm border ${selectedCategoryId === cat.id ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center text-gray-600 py-20">Loading products…</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      {!loading && !error && (
        filtered.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filtered.map((p) => (
              <SimpleProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-20">No products found.</div>
        )
      )}
    </div>
  );
}