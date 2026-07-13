import React, { useState } from 'react';
import { useProductsQuery, useCategoriesQuery } from '../hooks/useProducts';
import { useCreateProductMutation, useDeleteProductMutation } from '../hooks/useAdmin';

export const AdminProducts: React.FC = () => {
  const { data: products, isLoading: prodsLoading } = useProductsQuery({ sortBy: 'price-low' });
  const { data: categories } = useCategoriesQuery();

  const createProduct = useCreateProductMutation();
  const deleteProduct = useDeleteProductMutation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    price: 0,
    preparationTime: 15,
    vegOrNonveg: 'veg',
    image: '🍣',
  });

  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.categoryId || !formData.description || formData.price <= 0) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      await createProduct.mutateAsync({
        name: formData.name,
        categoryId: formData.categoryId,
        description: formData.description,
        price: Number(formData.price),
        preparationTime: Number(formData.preparationTime),
        vegOrNonveg: formData.vegOrNonveg as 'veg' | 'non-veg',
        image: formData.image,
        active: true,
      });
      setShowAddForm(false);
      setFormData({
        name: '',
        categoryId: '',
        description: '',
        price: 0,
        preparationTime: 15,
        vegOrNonveg: 'veg',
        image: '🍣',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to create product.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct.mutateAsync(id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (prodsLoading) {
    return (
      <div className="bg-white border border-muted p-6 rounded-premium shadow-card animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-charcoal text-base font-sans">Product Catalog</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full"
        >
          {showAddForm ? 'Close Form' : '+ Add New Product'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-muted/40 p-6 rounded-xl border border-muted space-y-4 max-w-xl animate-slide-down">
          <h4 className="font-bold text-sm text-charcoal">Add New Product Details</h4>
          {error && <p className="text-xs text-accent font-bold">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-charcoal/60">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-muted-dark rounded text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-charcoal/60">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-muted-dark rounded text-xs bg-white"
              >
                <option value="">Select Category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-charcoal/60">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-muted-dark rounded text-xs focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-charcoal/60">Price (₹)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-muted-dark rounded text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-charcoal/60">Prep Time (mins)</label>
              <input
                type="number"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-muted-dark rounded text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-charcoal/60">Veg / Non-Veg</label>
              <select
                value={formData.vegOrNonveg}
                onChange={(e) => setFormData({ ...formData, vegOrNonveg: e.target.value })}
                className="w-full px-3 py-2 border border-muted-dark rounded text-xs bg-white"
              >
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={createProduct.isPending}
            className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-full disabled:opacity-50"
          >
            {createProduct.isPending ? 'Creating...' : 'Create Product'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products?.map((p) => (
          <div key={p.id} className="border border-muted p-4 rounded-xl flex gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <span className="text-3xl">{p.image}</span>
              <div>
                <h4 className="font-bold text-sm text-charcoal">{p.name}</h4>
                <p className="text-xs text-muted-medium font-semibold">₹{p.price}</p>
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black ${
                  p.vegOrNonveg === 'veg' ? 'bg-success/15 text-success' : 'bg-accent/15 text-accent'
                }`}>
                  {p.vegOrNonveg}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(p.id)}
              disabled={deleteProduct.isPending}
              className="text-xs text-accent hover:underline font-bold"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminProducts;
