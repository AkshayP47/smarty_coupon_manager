import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const CreateCoupon: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", code: "", description: "", category: "", store: "",
    discountType: "percentage" as const, discountValue: 0,
    minimumPurchase: "", maximumDiscount: "", validFrom: "", expiryDate: "",
    usageLimit: "", termsAndConditions: "", source: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState("");

  const toDateInput = (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : "");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractMsg("");
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image exceeds 5MB limit");
      return;
    }
    setExtracting(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",", 2)[1] ?? "";
      const res = await api.post("/ai/extract", { image: base64, mimeType: file.type });
      const draft = res.data.data.coupon as Record<string, unknown>;
      setForm((f) => ({
        ...f,
        title: typeof draft.title === "string" ? draft.title : f.title,
        code: typeof draft.code === "string" ? draft.code : f.code,
        description: typeof draft.description === "string" ? draft.description : f.description,
        category: typeof draft.category === "string" ? draft.category : f.category,
        store: typeof draft.store === "string" ? draft.store : f.store,
        discountType: (["percentage", "fixed", "free_shipping", "other"] as const).includes(draft.discountType as never)
          ? (draft.discountType as typeof f.discountType)
          : f.discountType,
        discountValue: typeof draft.discountValue === "number" ? draft.discountValue : f.discountValue,
        minimumPurchase: draft.minimumPurchase != null ? String(draft.minimumPurchase) : f.minimumPurchase,
        maximumDiscount: draft.maximumDiscount != null ? String(draft.maximumDiscount) : f.maximumDiscount,
        validFrom: draft.validFrom ? toDateInput(draft.validFrom) : f.validFrom,
        expiryDate: draft.expiryDate ? toDateInput(draft.expiryDate) : f.expiryDate,
        termsAndConditions: typeof draft.termsAndConditions === "string" ? draft.termsAndConditions : f.termsAndConditions,
      }));
      setExtractMsg("Form prefilled from screenshot — please review before saving.");
    } catch {
      setError("Failed to extract coupon from image");
    } finally {
      setExtracting(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, minimumPurchase: form.minimumPurchase || null, maximumDiscount: form.maximumDiscount || null, validFrom: form.validFrom || null, expiryDate: form.expiryDate || null, usageLimit: form.usageLimit || null, remainingUses: form.usageLimit || null, termsAndConditions: form.termsAndConditions || null, source: form.source || null };
      await api.post("/coupons", payload);
      navigate("/");
    } catch (err) {
      setError("Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto mt-10 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Create Coupon</h2>
      {error && <p className="text-red-500">{error}</p>}
      {extractMsg && <p className="text-green-600">{extractMsg}</p>}
      <div className="mb-4">
        <label className="block mb-1">Screenshot (optional — prefill from image)</label>
        <input type="file" accept="image/*" onChange={handleFile} disabled={extracting} className="w-full border p-2" />
        {extracting && <p className="text-gray-500 text-sm mt-1">Extracting coupon details...</p>}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {["title","code","description","category","store","discountValue"].map((field) => (
          <div key={field}>
            <label className="block mb-1 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
            <input type={field === "discountValue" ? "number" : "text"} value={(form as any)[field]} onChange={(e) => setForm({...form, [field]: e.target.value})} className="w-full border p-2" required />
          </div>
        ))}
        <div>
          <label className="block mb-1">Discount Type</label>
          <select value={form.discountType} onChange={(e) => setForm({...form, discountType: e.target.value as any})} className="w-full border p-2">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
            <option value="free_shipping">Free Shipping</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex gap-4">
          <div className="flex-1"><label className="block mb-1">Min Purchase</label><input type="number" value={form.minimumPurchase} onChange={(e) => setForm({...form, minimumPurchase: e.target.value})} className="w-full border p-2" /></div>
          <div className="flex-1"><label className="block mb-1">Max Discount</label><input type="number" value={form.maximumDiscount} onChange={(e) => setForm({...form, maximumDiscount: e.target.value})} className="w-full border p-2" /></div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1"><label className="block mb-1">Valid From</label><input type="date" value={form.validFrom} onChange={(e) => setForm({...form, validFrom: e.target.value})} className="w-full border p-2" /></div>
          <div className="flex-1"><label className="block mb-1">Expiry Date</label><input type="date" value={form.expiryDate} onChange={(e) => setForm({...form, expiryDate: e.target.value})} className="w-full border p-2" /></div>
        </div>
        <button type="submit" disabled={saving} className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">{saving ? "Creating..." : "Create"}</button>
      </form>
    </div>
  );
};

export default CreateCoupon;
