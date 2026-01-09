'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, productsAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Save, X } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([
    { variant_name: 'Weight', variant_value: '', price: '', original_price: '', stock_quantity: '', sku: '', is_available: true }
  ]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    original_price: '',
    unit: 'kg',
    unit_value: '1',
    category_id: '',
    image_url: '',
    stock_quantity: '0',
    is_available: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await productsAPI.getCategories();
      const categoriesArray = Array.isArray(data) ? data : [];
      setCategories(categoriesArray);
      if (categoriesArray.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: categoriesArray[0].id }));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
      toast.error('Failed to load categories');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'name' && !formData.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('image', imageFile);

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Admin authentication required');
        setUploading(false);
        return null;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Image uploaded successfully!');
        return data.image.url;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload image: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { 
      variant_name: variants[0]?.variant_name || 'Weight',
      variant_value: '', 
      price: '', 
      original_price: '', 
      stock_quantity: '', 
      sku: '', 
      is_available: true 
    }]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    } else {
      toast.error('At least one variant is required when variants are enabled');
    }
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate variants if enabled
      if (hasVariants) {
        const invalidVariant = variants.find(v => !v.variant_value || !v.price);
        if (invalidVariant) {
          toast.error('All variants must have a value and price');
          setLoading(false);
          return;
        }
      }

      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const productData = {
        ...formData,
        image_url: imageUrl,
        price: hasVariants ? 0 : parseFloat(formData.price),
        original_price: hasVariants ? null : (formData.original_price ? parseFloat(formData.original_price) : null),
        stock_quantity: hasVariants ? 0 : parseInt(formData.stock_quantity),
        category_id: parseInt(formData.category_id),
        has_variants: hasVariants,
        variants: hasVariants ? variants.map(v => ({
          variant_name: v.variant_name,
          variant_value: v.variant_value,
          price: parseFloat(v.price),
          original_price: v.original_price ? parseFloat(v.original_price) : null,
          stock_quantity: parseInt(v.stock_quantity || 0),
          sku: v.sku || null,
          is_available: v.is_available
        })) : undefined
      };

      await adminAPI.createProduct(productData);
      toast.success('Product created successfully!');
      router.push('/admin/products');
    } catch (err) {
      setError(err.message || 'Failed to create product');
      toast.error(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600 mt-1">Create a new product for your store</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Product Image */}
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            📸 Product Image
          </label>
          <div className="flex items-start gap-6">
            {imagePreview && (
              <div className="relative w-40 h-40 border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    setFormData(prev => ({ ...prev, image_url: '' }));
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-600">✅ Supported: JPG, PNG, WebP, GIF</p>
                <p className="text-xs text-gray-600">✅ Max size: 5MB</p>
                {uploading && (
                  <p className="text-xs text-green-600 font-semibold animate-pulse">
                    ⏳ Uploading to Cloudinary...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Farm-Fresh Tomatoes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="farm-fresh-tomatoes"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Describe your product..."
          />
        </div>

        {/* Variants Toggle */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <label className="text-sm font-semibold text-gray-900">
                This product has multiple variants
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Enable this if your product comes in different sizes, weights, or packages (e.g., 200gm, 500gm, 1kg)
              </p>
            </div>
          </div>
        </div>

        {/* Variants Section */}
        {hasVariants ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={16} />
                Add Variant
              </button>
            </div>

            {variants.map((variant, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Variant #{index + 1}</h4>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <input
                      type="text"
                      value={variant.variant_name}
                      onChange={(e) => handleVariantChange(index, 'variant_name', e.target.value)}
                      placeholder="e.g., Weight"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Value *</label>
                    <input
                      type="text"
                      value={variant.variant_value}
                      onChange={(e) => handleVariantChange(index, 'variant_value', e.target.value)}
                      placeholder="e.g., 500gm"
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Original Price (₹)</label>
                    <input
                      type="number"
                      value={variant.original_price}
                      onChange={(e) => handleVariantChange(index, 'original_price', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                    <input
                      type="number"
                      value={variant.stock_quantity}
                      onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={variant.is_available}
                        onChange={(e) => handleVariantChange(index, 'is_available', e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-xs text-gray-700">Available</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Standard Product Fields */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required={!hasVariants}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₹)</label>
                <input
                  type="number"
                  name="original_price"
                  value={formData.original_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">For showing discounts (optional)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required={!hasVariants}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Unit Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Product Unit & Quantity
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Quantity/Weight *</label>
                  <input
                    type="number"
                    name="unit_value"
                    value={formData.unit_value}
                    onChange={handleChange}
                    required={!hasVariants}
                    step="0.001"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 500, 1, 2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter numeric value (e.g., 500 for 500gm, 1 for 1kg)</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Unit Type *</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="piece">Piece</option>
                    <option value="dozen">Dozen</option>
                    <option value="liter">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pack">Pack</option>
                    <option value="bundle">Bundle</option>
                    <option value="box">Box</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Preview: <span className="font-semibold text-green-600">
                      {formData.unit_value || '1'}{formData.unit}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category and Availability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select category</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Or Direct Image URL</label>
            <input
              type="text"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://... or /images/products/..."
              disabled={!!imageFile}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_available"
            checked={formData.is_available}
            onChange={handleChange}
            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
          />
          <label className="text-sm font-medium text-gray-700">
            Product is available for sale
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {uploading ? 'Uploading Image...' : loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
