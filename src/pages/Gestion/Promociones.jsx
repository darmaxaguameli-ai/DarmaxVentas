import React, { useState, useEffect } from "react";
import { fetchPromotions, createPromotion, updatePromotion, deletePromotion, fetchProducts } from "../../api/apiClient";
import { formatDate } from "../../utils/formatters";
import Swal from "sweetalert2";

const promotionTypes = [
  { value: "DISCOUNT_PERCENT", label: "Descuento %" },
  { value: "DISCOUNT_FIXED", label: "Descuento Fijo ($)" },
  { value: "GIVEAWAY", label: "Regalo / Producto Gratis" },
  { value: "COUPON", label: "Cupón" },
  { value: "POINTS_MULTIPLIER", label: "Multiplicador de Puntos" },
];

const clientCategories = ["PARTICULAR", "EMPRESA", "HOSPITAL", "ESCUELA", "OTRO"];

const PromotionModal = ({ isOpen, onClose, promotionToEdit, onSave, products }) => {
  const [promo, setPromo] = useState({
    name: "",
    description: "",
    type: "DISCOUNT_PERCENT",
    value: "",
    couponCode: "",
    targetCategories: [],
    minOrderAmount: 0,
    isActive: true,
    startDate: "",
    endDate: "",
    giveawayProductId: "",
  });

  useEffect(() => {
    if (promotionToEdit) {
      setPromo({
        ...promotionToEdit,
        startDate: promotionToEdit.startDate ? promotionToEdit.startDate.split('T')[0] : "",
        endDate: promotionToEdit.endDate ? promotionToEdit.endDate.split('T')[0] : "",
        giveawayProductId: promotionToEdit.giveawayProductId || "",
      });
    } else {
      setPromo({
        name: "",
        description: "",
        type: "DISCOUNT_PERCENT",
        value: "",
        couponCode: "",
        targetCategories: [],
        minOrderAmount: 0,
        isActive: true,
        startDate: "",
        endDate: "",
        giveawayProductId: "",
      });
    }
  }, [promotionToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "isActive") {
      setPromo(prev => ({ ...prev, [name]: checked }));
    } else {
      setPromo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryToggle = (cat) => {
    setPromo(prev => {
      const categories = [...prev.targetCategories];
      if (categories.includes(cat)) {
        return { ...prev, targetCategories: categories.filter(c => c !== cat) };
      } else {
        return { ...prev, targetCategories: [...categories, cat] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...promo,
      value: parseFloat(promo.value) || 0,
      minOrderAmount: parseFloat(promo.minOrderAmount) || 0,
      startDate: promo.startDate ? new Date(promo.startDate) : null,
      endDate: promo.endDate ? new Date(promo.endDate) : null,
      giveawayProductId: promo.type === "GIVEAWAY" ? promo.giveawayProductId : null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-dark dark:text-white">
          {promotionToEdit ? "Editar Promoción" : "Nueva Promoción"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Promoción</label>
            <input name="name" type="text" value={promo.name} onChange={handleChange} required className="mt-1 block w-full input-style" placeholder="Ej: Especial Escuelas - 10%" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
            <textarea name="description" value={promo.description} onChange={handleChange} className="mt-1 block w-full input-style" rows="2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
              <select name="type" value={promo.type} onChange={handleChange} required className="mt-1 block w-full input-style">
                {promotionTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {promo.type !== "GIVEAWAY" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor (Número)</label>
                <input name="value" type="number" step="0.01" value={promo.value} onChange={handleChange} required className="mt-1 block w-full input-style" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Producto de Regalo</label>
                <select name="giveawayProductId" value={promo.giveawayProductId} onChange={handleChange} required className="mt-1 block w-full input-style">
                  <option value="">-- Selecciona --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {promo.type === "COUPON" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código de Cupón</label>
              <input name="couponCode" type="text" value={promo.couponCode} onChange={handleChange} required className="mt-1 block w-full input-style uppercase" placeholder="Ej: VERANO2026" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categorías Objetivo</label>
            <div className="flex flex-wrap gap-2">
              {clientCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryToggle(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    promo.targetCategories.includes(cat)
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Inicio</label>
              <input name="startDate" type="date" value={promo.startDate} onChange={handleChange} className="mt-1 block w-full input-style" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Fin</label>
              <input name="endDate" type="date" value={promo.endDate} onChange={handleChange} className="mt-1 block w-full input-style" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input name="isActive" type="checkbox" checked={promo.isActive} onChange={handleChange} id="isActive" className="h-4 w-4 text-primary rounded" />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Promoción Activa</label>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Promociones = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoToEdit, setPromoToEdit] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promosData, productsData] = await Promise.all([
        fetchPromotions(),
        fetchProducts()
      ]);
      setPromotions(promosData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (promo = null) => {
    setPromoToEdit(promo);
    setIsModalOpen(true);
  };

  const handleSave = async (promoData) => {
    try {
      if (promoData.id) {
        await updatePromotion(promoData.id, promoData);
        Swal.fire("¡Éxito!", "Promoción actualizada correctamente.", "success");
      } else {
        await createPromotion(promoData);
        Swal.fire("¡Éxito!", "Promoción creada correctamente.", "success");
      }
      loadData();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar la promoción.", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    });

    if (result.isConfirmed) {
      try {
        await deletePromotion(id);
        Swal.fire("Eliminado", "La promoción ha sido eliminada.", "success");
        loadData();
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la promoción.", "error");
      }
    }
  };

  const getGiftProductName = (id) => {
    const p = products.find(p => p.id === id);
    return p ? p.name : "Producto no encontrado";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark dark:text-white">Promociones y Ofertas</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Nueva Promoción
        </button>
      </div>

      <PromotionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        promotionToEdit={promoToEdit}
        onSave={handleSave}
        products={products}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="th-style">Nombre / Código</th>
              <th className="th-style">Tipo</th>
              <th className="th-style">Valor / Regalo</th>
              <th className="th-style">Categorías</th>
              <th className="th-style">Vigencia</th>
              <th className="th-style">Estado</th>
              <th className="th-style text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan="7" className="p-6 text-center text-gray-500">Cargando...</td></tr>
            ) : promotions.length === 0 ? (
              <tr><td colSpan="7" className="p-6 text-center text-gray-500">No hay promociones registradas.</td></tr>
            ) : (
              promotions.map((promo) => (
                <tr key={promo.id}>
                  <td className="td-style">
                    <div className="flex flex-col">
                      <span className="font-bold text-dark dark:text-white">{promo.name}</span>
                      {promo.couponCode && (
                        <span className="text-[10px] text-primary font-black uppercase tracking-tighter">
                          Código: {promo.couponCode}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="td-style text-xs">
                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {promotionTypes.find(t => t.value === promo.type)?.label || promo.type}
                    </span>
                  </td>
                  <td className="td-style">
                    {promo.type === "GIVEAWAY" ? (
                      <div className="flex items-center gap-1 text-emerald-600 font-bold">
                        <span className="material-symbols-outlined text-sm">redeem</span>
                        {getGiftProductName(promo.giveawayProductId)}
                      </div>
                    ) : (
                      <span className="font-mono">
                        {promo.type === "DISCOUNT_PERCENT" ? `${promo.value}%` : `$${promo.value}`}
                      </span>
                    )}
                  </td>
                  <td className="td-style">
                    <div className="flex flex-wrap gap-1">
                      {promo.targetCategories.map(cat => (
                        <span key={cat} className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="td-style text-xs">
                    {promo.startDate ? formatDate(promo.startDate, { month: 'short', day: 'numeric' }) : '---'} al {promo.endDate ? formatDate(promo.endDate, { month: 'short', day: 'numeric' }) : '---'}
                  </td>
                  <td className="td-style">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${promo.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {promo.isActive ? "ACTIVA" : "INACTIVA"}
                    </span>
                  </td>
                  <td className="td-style text-right">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => handleOpenModal(promo)} className="text-primary hover:text-primary/80 font-medium">Editar</button>
                      <button onClick={() => handleDelete(promo.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Promociones;
