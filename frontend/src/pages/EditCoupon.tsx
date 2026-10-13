import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const toDateInput = (v: string | null) => (v ? v.slice(0, 10) : "");

const EditCoupon: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", code: "", description: "", category: "", store: "",
    discountType: "percentage" as "percentage" | "fixed" | "free_shipping" | "other",
    discountValue: 0,
    minimumPurchase: "", maximumDiscount: "", validFrom: "", expiryDate: "",
    termsAndConditions: "", source: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/coupons/${id}`)
      .then((res) => {
        const c = res.data.data.coupon;
        setForm({
          title: c.title ?? "",
          code: c.code ?? "",
          description: c.description ?? "",
          category: c.category ?? "",
          store: c.store ?? "",
          discountType: c.discountType ?? "percentage",
          discountValue: c.discountValue ?? 0,
          minimumPurchase: c.minimumPurchase?.toString() ?? "",
          maximumDiscount: c.maximumDiscount?.toString() ?? "",
          validFrom: toDateInput(c.validFrom),
          expiryDate: toDateInput(c.expiryDate),
          termsAndConditions: c.termsAndConditions ?? "",
          source: c.source ?? "",
        });
      })
      .catch(() => setError("Failed to load coupon"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        minimumPurchase: form.minimumPurchase === "" ? null : Number(form.minimumPurchase),
        maximumDiscount: form.maximumDiscount === "" ? null : Number(form.maximumDiscount),
        validFrom: form.validFrom || null,
        expiryDate: form.expiryDate || null,
        termsAndConditions: form.termsAndConditions || null,
        source: form.source || null,
      };
      await api.put(`/coupons/${id}`, payload);
      navigate(`/coupons/${id}`);
    } catch {
      setError("Failed to update coupon");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto mt-10">Loading...</div>;

  return (
    <div className="container mx-auto mt-10 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Edit Coupon</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {["title", "code", "description", "category", "store", "discountValue"].map((field) => (
          <div key={field}>
            <label className="block mb-1 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
            <input
              type={field === "discountValue" ? "number" : "text"}
              value={(form as any)[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="w-full border p-2"
              required
            />
          </div>
        ))}
        <div>
          <label className="block mb-1">Discount Type</label>
          <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })} className="w-full border p-2">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
            <option value="free_shipping">Free Shipping</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex gap-4">
          <div className="flex-1"><label className="block mb-1">Min Purchase</label><input type="number" value={form.minimumPurchase} onChange={(e) => setForm({ ...form, minimumPurchase: e.target.value })} className="w-full border p-2" /></div>
          <div className="flex-1"><label className="block mb-1">Max Discount</label><input type="number" value={form.maximumDiscount} onChange={(e) => setForm({ ...form, maximumDiscount: e.target.value })} className="w-full border p-2" /></div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1"><label className="block mb-1">Valid From</label><input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className="w-full border p-2" /></div>
          <div className="flex-1"><label className="block mb-1">Expiry Date</label><input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full border p-2" /></div>
        </div>
        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => navigate(-1)} className="border px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditCoupon;
