import React, { useState } from 'react';
import { 
  Plus, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Download 
} from 'lucide-react';
import { SubscriptionItem, TransactionItem } from '../types';

export const SubscriptionManagementPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionItem[]>([
    {
      id: 'sub-free',
      name: 'Free',
      price: 0,
      period: 'forever',
      features: [
        { text: '2 emergency groups', included: true },
        { text: 'Up to 5 contacts per group', included: true },
        { text: 'SOS alerts', included: true },
        { text: 'Video calls', included: false },
        { text: 'Unlimited contacts', included: false },
        { text: 'Incident journal', included: false },
      ],
    },
    {
      id: 'sub-premium',
      name: 'Premium',
      price: 5.0,
      period: 'month',
      features: [
        { text: 'Unlimited groups', included: true },
        { text: 'Unlimited Contacts per groups', included: true },
        { text: 'SOS alerts', included: true },
        { text: 'Group video calls', included: true },
        { text: 'Incident journal', included: true },
        { text: 'Wearable integration (coming soon)', included: true },
      ],
    },
  ]);

  const transactions: TransactionItem[] = [
    { id: 'tx-1', userName: 'Sarah Mitchell', plan: 'Premium', amount: '$10.00', date: 'Aug 1, 2025', status: 'Paid' },
    { id: 'tx-2', userName: 'James Okafor', plan: 'Free', amount: '$5.00', date: 'Aug 1, 2025', status: 'Paid' },
    { id: 'tx-3', userName: 'Emily Chen', plan: 'Free', amount: '$5.00', date: 'Jul 31, 2025', status: 'Paid' },
    { id: 'tx-4', userName: 'Carlos Rivera', plan: 'Premium', amount: '$10.00', date: 'Jul 30, 2025', status: 'Failed' },
    { id: 'tx-5', userName: 'Aisha Johnson', plan: 'Premium', amount: '$10.00', date: 'Jul 29, 2025', status: 'Paid' },
    { id: 'tx-6', userName: 'Ryan Park', plan: 'Free', amount: '$5.00', date: 'Jul 28, 2025', status: 'Refunded' },
  ];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionItem | null>(null);

  // Form State
  const [modalName, setModalName] = useState('');
  const [modalPrice, setModalPrice] = useState('');
  const [modalFeatures, setModalFeatures] = useState<string[]>(['']);

  const handleOpenAdd = () => {
    setModalName('');
    setModalPrice('0.00');
    setModalFeatures(['Feature description 1', 'Feature description 2']);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionItem) => {
    setEditingPlan(plan);
    setModalName(plan.name);
    setModalPrice(plan.price.toFixed(2));
    setModalFeatures(plan.features.map((f) => f.text));
  };

  const handleAddFeatureField = () => {
    setModalFeatures([...modalFeatures, '']);
  };

  const handleRemoveFeatureField = (idx: number) => {
    setModalFeatures(modalFeatures.filter((_, i) => i !== idx));
  };

  const handleFeatureChange = (idx: number, val: string) => {
    const updated = [...modalFeatures];
    updated[idx] = val;
    setModalFeatures(updated);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) return;
    const newPlan: SubscriptionItem = {
      id: `sub-${Date.now()}`,
      name: modalName.trim(),
      price: parseFloat(modalPrice) || 0,
      period: 'month',
      features: modalFeatures.filter((f) => f.trim().length > 0).map((f) => ({ text: f, included: true })),
    };
    setPlans([...plans, newPlan]);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !modalName.trim()) return;
    setPlans(
      plans.map((p) =>
        p.id === editingPlan.id
          ? {
              ...p,
              name: modalName.trim(),
              price: parseFloat(modalPrice) || 0,
              features: modalFeatures.filter((f) => f.trim().length > 0).map((f) => ({ text: f, included: true })),
            }
          : p
      )
    );
    setEditingPlan(null);
  };

  const handleDelete = (id: string) => {
    setPlans(plans.filter((p) => p.id !== id));
  };

  const exportCSV = () => {
    const csvContent =
      'USER,PLAN,AMOUNT,DATE,STATUS\n' +
      transactions.map((t) => `"${t.userName}","${t.plan}","${t.amount}","${t.date}","${t.status}"`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SafeAlert_Transactions.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Subscription Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage plans, track revenue, and monitor transactions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Top 2 Subscription Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isPremium = plan.name.toLowerCase().includes('premium');
          return (
            <div key={plan.id} className="figma-card p-4 sm:p-6 flex flex-col justify-between">
              <div>
                {/* Header row: Plan Name & Price */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between pb-4 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                  <div className="sm:text-right">
                    <span className="text-2xl font-extrabold text-[#2563EB]">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400 font-medium ml-1">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="py-4 space-y-2.5">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs">
                      {feat.included ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                          <X className="w-3 h-3" />
                        </div>
                      )}
                      <span className={feat.included ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Buttons: Edit (Blue) & Delete (Red) */}
              <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Table: Recent Transactions */}
      <div className="figma-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
          <button
            onClick={exportCSV}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Export CSV
          </button>
        </div>

        <div className="md:hidden divide-y divide-gray-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="px-4 py-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-xs text-gray-900 truncate">{tx.userName}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  <span className={tx.plan === 'Premium' ? 'text-amber-500 font-semibold' : ''}>
                    {tx.plan}
                  </span>
                  {' · '}
                  {tx.date}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-xs text-gray-800">{tx.amount}</p>
                <p
                  className={`text-[11px] font-bold mt-0.5 ${
                    tx.status === 'Paid'
                      ? 'text-emerald-600'
                      : tx.status === 'Failed'
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}
                >
                  {tx.status}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 text-gray-400 uppercase text-[10px] tracking-wider font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 text-xs">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-gray-900">{tx.userName}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`font-semibold ${
                        tx.plan === 'Premium' ? 'text-amber-500' : 'text-gray-500'
                      }`}
                    >
                      {tx.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-gray-800">{tx.amount}</td>
                  <td className="px-6 py-3.5 text-gray-500">{tx.date}</td>
                  <td className="px-6 py-3.5 text-right">
                    <span
                      className={`font-bold ${
                        tx.status === 'Paid'
                          ? 'text-emerald-600'
                          : tx.status === 'Failed'
                          ? 'text-red-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subscription Modal Container */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-y-auto max-h-[90dvh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Add Subscription</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subscription Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Price (per month)
                </label>
                <input
                  type="text"
                  placeholder="$ 0.00"
                  value={modalPrice}
                  onChange={(e) => setModalPrice(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold text-gray-700">Features</label>
                  <button
                    type="button"
                    onClick={handleAddFeatureField}
                    className="text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    + Add feature
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {modalFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <input
                        type="text"
                        placeholder="Feature description"
                        value={feat}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeatureField(idx)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  Add Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal Container */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-y-auto max-h-[90dvh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Edit Subscription</h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subscription Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Price (per month)
                </label>
                <input
                  type="text"
                  placeholder="$ 0.00"
                  value={modalPrice}
                  onChange={(e) => setModalPrice(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold text-gray-700">Features</label>
                  <button
                    type="button"
                    onClick={handleAddFeatureField}
                    className="text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    + Add feature
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {modalFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <input
                        type="text"
                        placeholder="Feature description"
                        value={feat}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeatureField(idx)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  Update Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
