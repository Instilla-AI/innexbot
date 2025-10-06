'use client';

import { useEffect, useState } from 'react';

interface TrackingMetric {
  id: number;
  event_type: string;
  weight: number;
  category: string;
  instruction: string;
  is_active: boolean;
}

const TrackingPage = () => {
  const [metrics, setMetrics] = useState<TrackingMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ weight: 0, category: '', instruction: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMetric, setNewMetric] = useState({ eventType: '', weight: 10, category: '', instruction: '' });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/tracking');
      const data = await response.json();
      setMetrics(data.metrics || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (metric: TrackingMetric) => {
    setEditingId(metric.id);
    setEditData({
      weight: metric.weight,
      category: metric.category,
      instruction: metric.instruction,
    });
  };

  const handleSave = async (id: number) => {
    try {
      await fetch('/api/tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editData }),
      });
      setEditingId(null);
      fetchMetrics();
    } catch (error) {
      console.error('Error updating metric:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler disattivare questa metrica?')) return;
    try {
      await fetch(`/api/tracking?id=${id}`, { method: 'DELETE' });
      fetchMetrics();
    } catch (error) {
      console.error('Error deleting metric:', error);
    }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMetric),
      });
      if (response.ok) {
        setShowAddModal(false);
        setNewMetric({ eventType: '', weight: 10, category: '', instruction: '' });
        await fetchMetrics();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to add metric'));
      }
    } catch (error) {
      console.error('Error adding metric:', error);
      alert('Error adding metric');
    }
  };

  if (loading) {
    return <div className="p-7">Caricamento...</div>;
  }

  return (
    <div className="mx-auto max-w-full">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Tracking Metrics
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium text-white transition hover:bg-opacity-90"
          style={{ backgroundColor: '#3C50E0' }}
        >
          + Add Metric
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="px-5 py-4">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            All Metrics
          </h4>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 dark:border-white/[0.05]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Event Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Weight
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Category
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Instruction
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {metrics.map((metric) => (
                <tr key={metric.id}>
                  <td className="px-5 py-4">
                    <code className="rounded-lg bg-gray-100 px-2 py-1 text-sm font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      {metric.event_type}
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    {editingId === metric.id ? (
                      <input
                        type="number"
                        value={editData.weight}
                        onChange={(e) => setEditData({ ...editData, weight: parseInt(e.target.value) })}
                        className="w-20 rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-900"
                      />
                    ) : (
                      <span className="text-sm text-gray-800 dark:text-white/90">{metric.weight}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingId === metric.id ? (
                      <input
                        type="text"
                        value={editData.category}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-900"
                      />
                    ) : (
                      <span className="text-sm capitalize text-gray-800 dark:text-white/90">{metric.category}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingId === metric.id ? (
                      <input
                        type="text"
                        value={editData.instruction}
                        onChange={(e) => setEditData({ ...editData, instruction: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-900"
                      />
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{metric.instruction}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingId === metric.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleSave(metric.id)} className="text-sm text-primary hover:underline">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleEdit(metric)} className="text-gray-500 transition hover:text-primary dark:text-gray-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(metric.id)} className="text-gray-500 transition hover:text-red-500 dark:text-gray-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/[0.05] dark:bg-gray-900">
            <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">Add New Metric</h3>
            <form onSubmit={handleAddMetric} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMetric.eventType}
                  onChange={(e) => setNewMetric({ ...newMetric, eventType: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-gray-800 outline-none transition focus:border-primary dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="e.g., pageview, click"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weight <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newMetric.weight}
                  onChange={(e) => setNewMetric({ ...newMetric, weight: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-gray-800 outline-none transition focus:border-primary dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <input
                  type="text"
                  value={newMetric.category}
                  onChange={(e) => setNewMetric({ ...newMetric, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-gray-800 outline-none transition focus:border-primary dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="e.g., engagement"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Instruction
                </label>
                <textarea
                  value={newMetric.instruction}
                  onChange={(e) => setNewMetric({ ...newMetric, instruction: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-gray-800 outline-none transition focus:border-primary dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Description..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90"
                  style={{ backgroundColor: '#3C50E0' }}
                >
                  Add Metric
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;
