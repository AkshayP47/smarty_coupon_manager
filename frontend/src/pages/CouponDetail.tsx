import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { Coupon } from "../types";

const CouponDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [coupon, setCoupon] = React.useState<Coupon | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    api.get(`/coupons/${id}`).then((res) => setCoupon(res.data.data.coupon)).catch(() => navigate("/"));
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      await api.delete(`/coupons/${id}`);
      navigate("/coupons");
    } catch {
      setError("Failed to delete coupon");
    }
  };

  if (!coupon) return <div className="container mx-auto mt-10">Loading...</div>;

  return (
    <div className="container mx-auto mt-10 max-w-2xl">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="text-blue-500">&larr; Back</button>
        <Link to={`/coupons/${id}/edit`} className="bg-blue-500 text-white px-4 py-1 rounded">Edit</Link>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="bg-red-500 text-white px-4 py-1 rounded">Delete</button>
        ) : (
          <>
            <span className="text-sm">Delete this coupon?</span>
            <button onClick={handleDelete} className="bg-red-600 text-white px-3 py-1 rounded">Yes, delete</button>
            <button onClick={() => setConfirming(false)} className="border px-3 py-1 rounded">Cancel</button>
          </>
        )}
      </div>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <h2 className="text-2xl font-bold mb-4">{coupon.title}</h2>
      <div className="bg-white shadow rounded p-6 space-y-3">
        <p><span className="font-bold">Code:</span> {coupon.code}</p>
        <p><span className="font-bold">Store:</span> {coupon.store}</p>
        <p><span className="font-bold">Category:</span> {coupon.category}</p>
        <p><span className="font-bold">Discount:</span> {coupon.discountValue} ({coupon.discountType})</p>
        <p><span className="font-bold">Description:</span> {coupon.description}</p>
        <p><span className="font-bold">Expiry:</span> {coupon.expiryDate}</p>
      </div>
    </div>
  );
};

export default CouponDetail;
