import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useInventoryLogsQuery, useAdjustStockMutation } from '../hooks/useAdmin';
import { AlertCircle, Plus, Info } from 'lucide-react';

export const AdminInventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'recipes'>('stock');

  // Query inventory list
  const { data: inventory, isLoading: invLoading } = useQuery<any[]>({
    queryKey: ['inventory'],
    queryFn: () => api.get<any[]>('/inventory'),
  });

  const { data: logs } = useInventoryLogsQuery();
  const adjustStock = useAdjustStockMutation();

  const [selectedIng, setSelectedIng] = useState<any>(null);
  const [adjustData, setAdjustData] = useState({
    qty: 0,
    action: 'addition',
    reason: '',
  });

  const [error, setError] = useState('');

  // Sample static recipe calculations for dashboard presentation
  const recipeCosts = [
    {
      name: 'TRIMAKI Signature Rainbow Roll',
      retailPrice: 899,
      ingredients: [
        { name: 'Sushi Rice', qty: '0.1 kg', cost: 12 },
        { name: 'Seaweed Nori Sheets', qty: '1.0 pc', cost: 15 },
        { name: 'Fresh Salmon', qty: '0.08 kg', cost: 144 },
        { name: 'Avocado', qty: '0.5 pc', cost: 15 },
      ],
    },
    {
      name: 'Premium California Roll',
      retailPrice: 699,
      ingredients: [
        { name: 'Sushi Rice', qty: '0.1 kg', cost: 12 },
        { name: 'Seaweed Nori Sheets', qty: '1.0 pc', cost: 15 },
        { name: 'Crab Salad Mix', qty: '0.05 kg', cost: 22.5 },
        { name: 'Avocado', qty: '0.5 pc', cost: 15 },
      ],
    },
  ];

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedIng) return;
    if (adjustData.qty <= 0 || !adjustData.reason.trim()) {
      setError('Please provide valid quantity and reason.');
      return;
    }

    try {
      await adjustStock.mutateAsync({
        id: selectedIng.id,
        quantityChanged: Number(adjustData.qty),
        action: adjustData.action as 'addition' | 'deduction' | 'correction',
        reason: adjustData.reason,
      });
      setSelectedIng(null);
      setAdjustData({ qty: 0, action: 'addition', reason: '' });
    } catch (err: any) {
      setError(err?.message || 'Failed to adjust stock.');
    }
  };

  const exportCSV = () => {
    if (!inventory || inventory.length === 0) return;

    const headers = ['Ingredient Name', 'Available Quantity', 'Unit', 'Min Limit', 'Reorder Level', 'Supplier'];
    const rows = inventory.map((i) => [
      i.ingredient_name,
      i.available_quantity,
      i.unit,
      i.minimum_quantity,
      i.reorder_level,
      i.supplier || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trimaki_inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (invLoading) {
    return (
      <div className="bg-white border border-muted p-6 rounded-premium shadow-card animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-44 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sub-tab Switcher */}
      <div className="flex border-b border-muted">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 px-6 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'stock'
              ? 'border-primary text-primary'
              : 'border-transparent text-charcoal/60 hover:text-charcoal'
          }`}
        >
          Raw Materials Stock
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`pb-3 px-6 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'recipes'
              ? 'border-primary text-primary'
              : 'border-transparent text-charcoal/60 hover:text-charcoal'
          }`}
        >
          Recipe Cost & Margins
        </button>
      </div>

      {activeTab === 'stock' && (
        <>
          {/* Ingredients Overview Table */}
          <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-charcoal text-base font-sans">Raw Ingredients Stock</h3>
              <button
                onClick={exportCSV}
                disabled={!inventory || inventory.length === 0}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-muted text-muted-medium uppercase font-bold">
                    <th className="pb-3">Ingredient</th>
                    <th className="pb-3">In Stock</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3">Min Level</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {inventory?.map((ing) => {
                    const isLow = Number(ing.available_quantity) < Number(ing.reorder_level);
                    return (
                      <tr key={ing.id} className="text-charcoal/80">
                        <td className="py-4 font-bold text-charcoal">{ing.ingredient_name}</td>
                        <td className={`py-4 font-semibold ${isLow ? 'text-accent' : ''}`}>{Number(ing.available_quantity).toFixed(2)}</td>
                        <td className="py-4">{ing.unit}</td>
                        <td className="py-4">{Number(ing.minimum_quantity).toFixed(2)}</td>
                        <td className="py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded font-bold uppercase text-[9px]">
                              <AlertCircle className="w-3 h-3" />
                              <span>Low Stock Alert</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded font-bold uppercase text-[9px]">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setSelectedIng(ing)}
                            className="px-2.5 py-1 bg-charcoal text-white hover:bg-primary rounded text-[10px] font-bold"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjust Stock Overlay Form */}
          {selectedIng && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white border border-muted p-6 rounded-premium shadow-premium max-w-sm w-full space-y-4">
                <h3 className="font-extrabold text-charcoal text-base font-sans">
                  Adjust Stock: {selectedIng.ingredient_name}
                </h3>
                {error && <p className="text-xs text-accent font-bold">{error}</p>}
                <form onSubmit={handleAdjust} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-charcoal/60">Quantity</label>
                      <input
                        type="number"
                        step="0.001"
                        value={adjustData.qty}
                        onChange={(e) => setAdjustData({ ...adjustData, qty: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-muted-dark rounded text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-charcoal/60">Action</label>
                      <select
                        value={adjustData.action}
                        onChange={(e) => setAdjustData({ ...adjustData, action: e.target.value })}
                        className="w-full px-3 py-2 border border-muted-dark rounded text-xs bg-white"
                      >
                        <option value="addition">Add Stock</option>
                        <option value="deduction">Deduct Stock</option>
                        <option value="correction">Correct Total</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-charcoal/60">Reason / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Weekly vendor arrival"
                      value={adjustData.reason}
                      onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                      className="w-full px-3 py-2 border border-muted-dark rounded text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2 border-t border-muted">
                    <button
                      type="button"
                      onClick={() => setSelectedIng(null)}
                      className="px-4 py-2 border border-muted-dark rounded-full text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adjustStock.isPending}
                      className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-full disabled:opacity-50"
                    >
                      {adjustStock.isPending ? 'Saving...' : 'Apply Adjust'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Stock logs tracker */}
          {logs && logs.length > 0 && (
            <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
              <h3 className="font-extrabold text-charcoal text-base font-sans">Recent Stock Logs</h3>
              <div className="divide-y divide-muted space-y-3 max-h-60 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="pt-3 flex justify-between items-center text-xs text-charcoal/80">
                    <div>
                      <span className="font-bold text-charcoal uppercase block">{log.ingredient_name}</span>
                      <span className="text-[10px] text-muted-medium block">Reason: "{log.reason}"</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold block ${log.action === 'addition' ? 'text-success' : 'text-accent'}`}>
                        {log.action === 'addition' ? '+' : '-'}{log.quantityChanged}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recipeCosts.map((recipe, index) => {
            const rawCost = recipe.ingredients.reduce((acc, curr) => acc + curr.cost, 0);
            const profit = recipe.retailPrice - rawCost;
            const margin = (profit / recipe.retailPrice) * 100;

            return (
              <div key={index} className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-charcoal font-sans">{recipe.name}</h4>
                  <p className="text-[10px] text-muted-medium uppercase font-semibold">Cost Breakdown</p>
                </div>

                <div className="space-y-2 border-b border-muted pb-4">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between items-center text-xs text-charcoal/80">
                      <span>{ing.name} ({ing.qty})</span>
                      <span className="font-semibold">₹{ing.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 pt-2 text-xs">
                  <p className="flex justify-between">
                    <span>Sum Raw Cost:</span>
                    <span className="font-bold text-charcoal">₹{rawCost.toFixed(2)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Retail Price:</span>
                    <span className="font-bold text-primary">₹{recipe.retailPrice}</span>
                  </p>
                  <p className="flex justify-between border-t border-muted pt-2 text-sm font-extrabold">
                    <span>Gross profit margin:</span>
                    <span className="text-success">{margin.toFixed(0)}%</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default AdminInventory;
