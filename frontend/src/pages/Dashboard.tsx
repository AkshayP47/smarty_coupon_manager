import React from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { DashboardStats } from "../types";

const Dashboard: React.FC = () => {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [error, setError] = React.useState("");
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [cited, setCited] = React.useState<DashboardStats["recentCoupons"]>([]);
  const [asking, setAsking] = React.useState(false);
  const [askError, setAskError] = React.useState("");

  React.useEffect(() => {
    api.get("/dashboard").then((res) => setStats(res.data.data)).catch(() => setError("Failed to load dashboard"));
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAskError("");
    setAnswer("");
    try {
      const res = await api.post("/ai/ask", { question, limit: 5 });
      setAnswer(res.data.data.answer);
      setCited(res.data.data.coupons);
    } catch {
      setAskError("Could not answer that question");
    } finally {
      setAsking(false);
    }
  };

  if (error) return <div className="container mx-auto mt-10"><p className="text-red-500">{error}</p></div>;
  if (!stats) return <div className="container mx-auto mt-10">Loading...</div>;

  return (
    <div className="container mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500">Total Coupons</h3>
          <p className="text-2xl font-bold">{stats.totalCoupons}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500">Active Coupons</h3>
          <p className="text-2xl font-bold">{stats.activeCoupons}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500">Expired Coupons</h3>
          <p className="text-2xl font-bold">{stats.expiredCoupons}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500">Expiring Soon</h3>
          <p className="text-2xl font-bold">{stats.expiringSoon}</p>
        </div>
      </div>
      <h3 className="text-xl font-bold mt-8 mb-2">Ask about your coupons</h3>
      <div className="flex gap-4 mb-2">
        <input type="text" placeholder="e.g. Which coupons expire this week?" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }} className="border p-2 flex-1" />
        <button onClick={handleAsk} disabled={asking} className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50">{asking ? "Thinking..." : "Ask"}</button>
      </div>
      {askError && <p className="text-red-500 mb-2">{askError}</p>}
      {answer && (
        <div className="bg-white shadow rounded p-4 mb-2">
          <p>{answer}</p>
          {cited.length > 0 && (
            <ul className="mt-2 space-y-1">
              {cited.map((c) => (
                <li key={c._id}><Link to={`/coupons/${c._id}`} className="text-blue-500 text-sm">{c.title} ({c.code})</Link></li>
              ))}
            </ul>
          )}
        </div>
      )}
      <h3 className="text-xl font-bold mt-8 mb-2">Recently added</h3>
      {stats.recentCoupons.length === 0 ? (
        <p className="text-gray-500">No coupons yet.</p>
      ) : (
        <ul className="bg-white shadow rounded divide-y">
          {stats.recentCoupons.map((c) => (
            <li key={c._id} className="p-3 flex justify-between">
              <span>{c.title} <span className="text-gray-500 text-sm">({c.store})</span></span>
              <Link to={`/coupons/${c._id}`} className="text-blue-500">View</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
