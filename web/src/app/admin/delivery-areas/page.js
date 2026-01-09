'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { RingLoader } from 'react-spinners';
import { MapPin, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';

export default function DeliveryAreasPage() {
  const toast = useToast();
  const [areas, setAreas] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [formData, setFormData] = useState({
    area_name: '',
    city: 'Chittoor',
    state: 'Andhra Pradesh',
    pincode: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [areasData, statsData] = await Promise.all([
        adminAPI.getAllDeliveryAreas(),
        adminAPI.getDeliveryStats()
      ]);
      setAreas(areasData.areas || []);
      setStats(statsData.stats || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load delivery areas');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (area = null) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        area_name: area.area_name || '',
        city: area.city || 'Chittoor',
        state: area.state || 'Andhra Pradesh',
        pincode: area.pincode || '',
        is_active: area.is_active !== false,
      });
    } else {
      setEditingArea(null);
      setFormData({
        area_name: '',
        city: 'Chittoor',
        state: 'Andhra Pradesh',
        pincode: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingArea(null);
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
      if (editingArea) {
        await adminAPI.updateDeliveryArea(editingArea.id, formData);
        toast.success('Delivery area updated successfully');
      } else {
        await adminAPI.createDeliveryArea(formData);
        toast.success('Delivery area added successfully');
      }
      closeModal();
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save delivery area');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await adminAPI.toggleDeliveryAreaStatus(id);
      toast.success('Area status updated');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteDeliveryArea(id);
      toast.success('Delivery area deleted');
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete delivery area');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-green-600" />
            Delivery Areas
          </h1>
          <p className="text-gray-600 text-sm mt-1">Manage delivery locations and availability</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Add Area
        </button>
      </div>

      {/* Delivery Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-green-600 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📦</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Delivery Policy</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Orders placed <strong>before 6 PM</strong> → Delivered next day</li>
              <li>• Orders placed <strong>after 6 PM</strong> → Delivered day after tomorrow</li>
              <li>• Currently serving areas in <strong>Chittoor, Andhra Pradesh</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.slice(0, 3).map((stat) => (
            <div key={stat.id} className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{stat.area_name}</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Orders:</span>
                  <span className="font-semibold text-gray-900">{stat.total_orders || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivered:</span>
                  <span className="font-semibold text-green-600">{stat.delivered_orders || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold text-orange-600">{stat.pending_orders || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Areas List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RingLoader color="#16a34a" size={50} />
        </div>
      ) : areas.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-md">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No delivery areas yet</h3>
          <p className="text-gray-600 mb-4">Add your first delivery area to start serving customers</p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Area
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pincode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {areas.map((area) => (
                  <tr key={area.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">{area.area_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.city}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.state}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.pincode || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        area.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {area.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(area.id)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title={area.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {area.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => openModal(area)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(area)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingArea ? 'Edit Delivery Area' : 'Add Delivery Area'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area Name *</label>
                <input
                  type="text"
                  name="area_name"
                  value={formData.area_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., KR Palli, Kattamanchi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Chittoor"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Andhra Pradesh"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="517001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  id="is_active_check"
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="is_active_check" className="text-sm text-gray-700">
                  Area is active and available for delivery
                </label>
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
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingArea ? 'Update' : 'Add Area')}
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Delivery Area</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.area_name}</strong>? 
              This action cannot be undone. Areas with existing orders cannot be deleted.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
