import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Coupon } from "../types";

const CouponList: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [store, setStore] = useState("");
  const [status, setStatus] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [expiryBefore, setExpiryBefore] = useState("");
  const [expiryAfter, setExpiryAfter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiMode, setAiMode] = useState<"rank" | "semantic">("rank");
  const [aiMethod, setAiMethod] = useState<string | null>(null);
  const [aiActive, setAiActive] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (store) params.store = store;
      if (status) params.status = status;
      if (discountType) params.discountType = discountType;
      if (expiryBefore) params.expiryBefore = expiryBefore;
      if (expiryAfter) params.expiryAfter = expiryAfter;
      const res = await api.get("/coupons", { params });
      setCoupons(res.data.data.coupons);
    } catch {
      setError("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setAiActive(false);
    setAiMethod(null);
    fetchCoupons();
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await api.post(aiMode === "semantic" ? "/ai/semantic-search" : "/ai/search", { query: aiQuery, limit: 20 });
      setCoupons(res.data.data.coupons);
      setAiMethod(res.data.data.method);
      setAiActive(true);
    } catch {
      setAiError("AI search failed");
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiSearch = () => {
    setAiQuery("");
    setAiMethod(null);
    setAiActive(false);
    fetchCoupons();
  };

  return (
    <div className="container mx-auto mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Coupons</h2>
        <Link to="/coupons/new" className="bg-blue-500 text-white px-4 py-2 rounded">Add Coupon</Link>
      </div>
      <div className="flex gap-4 mb-4">
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="border p-2 flex-1" />
        <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="border p-2" />
        <input type="text" placeholder="Store" value={store} onChange={(e) => setStore(e.target.value)} className="border p-2" />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded">Search</button>
      </div>
      <div className="flex gap-4 mb-4 flex-wrap">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border p-2">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="border p-2">
          <option value="">All discount types</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
          <option value="free_shipping">Free shipping</option>
          <option value="other">Other</option>
        </select>
        <label className="flex items-center gap-2 text-sm">Expires after
          <input type="date" value={expiryAfter} onChange={(e) => setExpiryAfter(e.target.value)} className="border p-2" />
        </label>
        <label className="flex items-center gap-2 text-sm">Expires before
          <input type="date" value={expiryBefore} onChange={(e) => setExpiryBefore(e.target.value)} className="border p-2" />
        </label>
      </div>
      <div className="flex gap-4 mb-4">
        <input type="text" placeholder="Ask in plain English, e.g. '20% off electronics'..." value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAiSearch(); }} className="border p-2 flex-1" />
        <select value={aiMode} onChange={(e) => setAiMode(e.target.value as "rank" | "semantic")} className="border p-2" aria-label="AI search mode">
          <option value="rank">Gemini rank</option>
          <option value="semantic">Semantic</option>
        </select>
        <button onClick={handleAiSearch} disabled={aiLoading} className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50">{aiLoading ? "Asking..." : "AI Search"}</button>
        {aiActive && <button onClick={clearAiSearch} className="border px-4 py-2 rounded">Clear</button>}
      </div>
      {aiMethod && <p className="text-sm text-gray-500 mb-2">Ranked by: {aiMethod}</p>}
      {aiError && <p className="text-red-500 mb-2">{aiError}</p>}
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {loading ? (
        <div className="bg-white shadow rounded p-6">Loading...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white shadow rounded p-6 text-gray-500">No coupons found.</div>
      ) : (
        <div className="bg-white shadow rounded">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Store</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Discount</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon._id} className="border-t">
                <td className="p-3">{coupon.title}</td>
                <td className="p-3">{coupon.code}</td>
                <td className="p-3">{coupon.store}</td>
                <td className="p-3">{coupon.category}</td>
                <td className="p-3">{coupon.discountValue} {coupon.discountType}</td>
                <td className="p-3">
                  <Link to={`/coupons/${coupon._id}`} className="text-blue-500 mr-2">View</Link>
                  <Link to={`/coupons/${coupon._id}/edit`} className="text-green-600">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default CouponList;
