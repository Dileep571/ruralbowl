'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { RingLoader } from 'react-spinners';

export default function AdminSubscriptionsPage() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '30',
    total_deliveries: '',
    delivery_frequency: 'weekly',
    features: '',
    is_active: true,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminAPI.getSubscriptionPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price?.toString() || '',
        duration_days: (plan.validity_days || plan.duration_days)?.toString() || '30',
        total_deliveries: plan.total_deliveries?.toString() || '',
        delivery_frequency: plan.delivery_frequency || 'weekly',
        features: Array.isArray(plan.features) ? plan.features.join('\n') : 
                  (Array.isArray(plan.items) ? plan.items.join('\n') : ''),
        is_active: plan.is_active !== false,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        duration_days: '30',
        total_deliveries: '',
        delivery_frequency: 'weekly',
        features: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const planData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        validity_days: parseInt(formData.duration_days),
        total_deliveries: parseInt(formData.total_deliveries),
        delivery_frequency: formData.delivery_frequency || 'weekly',
        items: formData.features.split('\n').filter(f => f.trim()),
        is_active: formData.is_active,
      };

      if (editingPlan) {
        await adminAPI.updateSubscriptionPlan(editingPlan.id, planData);
        toast.success('Plan updated successfully');
      } else {
        await adminAPI.createSubscriptionPlan(planData);
        toast.success('Plan created successfully');
      }

      closeModal();
      loadPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteSubscriptionPlan(id);
      toast.success('Plan deleted successfully');
      setDeleteConfirm(null);
      loadPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to delete plan');
    }
  };

  const getDurationLabel = (plan) => {
    const days = plan.validity_days || plan.duration_days;
    if (days === 7) return '1 Week';
    if (days === 14 || days === 15) return '2 Weeks';
    if (days === 30) return '1 Month';
    if (days === 90) return '3 Months';
    return `${days} Days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600 text-sm mt-1">Manage subscription plans for customers</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 text-sm rounded-lg font-semibold shadow-md shadow-primary-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/35 hover:scale-105"
        >
          <span>➕</span>
          Add Plan
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <RingLoader color="#16a34a" size={50} />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900">No subscription plans yet</h3>
          <p className="text-gray-600 mt-1">Create your first subscription plan to get started</p>
          <button
            onClick={() => openModal()}
            className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 text-sm rounded-lg font-semibold"
          >
            Create Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-xl shadow-elegant border ${plan.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'} overflow-hidden`}>
              <div className={`px-5 py-4 ${plan.is_active ? 'bg-gradient-to-r from-primary-600 to-primary-700' : 'bg-gray-400'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-primary-100 text-sm">{getDurationLabel(plan)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${plan.is_active ? 'bg-white/20 text-white' : 'bg-gray-600 text-white'}`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-white">₹{Number(plan.price).toFixed(0)}</span>
                  <span className="text-primary-100 text-sm">/{getDurationLabel(plan).toLowerCase()}</span>
                </div>
              </div>

              <div className="p-5">
                {plan.description && (
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                )}

                {(() => {
                  const featureList = plan.features || plan.items || [];
                  return Array.isArray(featureList) && featureList.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {featureList.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-primary-600">✓</span>
                          {feature}
                        </li>
                      ))}
                      {featureList.length > 4 && (
                        <li className="text-sm text-gray-500">+{featureList.length - 4} more items</li>
                      )}
                    </ul>
                  );
                })()}

                {plan.total_deliveries && (
                  <p className="text-sm text-gray-600 mb-4">
                    📦 {plan.total_deliveries} deliveries included
                  </p>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openModal(plan)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(plan)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Weekly Veg Box"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Brief description of the plan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="399"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                  <select
                    name="duration_days"
                    value={formData.duration_days}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="7">1 Week (7 days)</option>
                    <option value="14">2 Weeks (14 days)</option>
                    <option value="30">1 Month (30 days)</option>
                    <option value="90">3 Months (90 days)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Deliveries *</label>
                  <input
                    type="number"
                    name="total_deliveries"
                    value={formData.total_deliveries}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of deliveries in this plan</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Frequency</label>
                  <select
                    name="delivery_frequency"
                    value={formData.delivery_frequency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Items/Features (one per line) *</label>
                <textarea
                  name="features"
                  value={formData.features}
                  onChange={handleChange}
                  rows={4}
                  required
                  placeholder="5-6 different seasonal vegetables&#10;Serves 2-3 people&#10;Free delivery&#10;Customizable preferences"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Enter each item/feature on a new line</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  id="is_active"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Plan is active and available for purchase</label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Plan</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? 
              This will not affect existing subscriptions but will prevent new purchases.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
