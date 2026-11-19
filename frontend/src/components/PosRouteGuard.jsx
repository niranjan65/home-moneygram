import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { customPos } from "../api/customPos";
import { hasOpenCashCounterFlag, isCashCounterOpen, syncCashCounterFlag } from "../api/cashCounterSession";

export default function PosRouteGuard({ children }) {
  const { selectedWarehouse } = useSettings();
  const location = useLocation();
  const warehouse = selectedWarehouse?.warehouse;
  const [state, setState] = useState({ warehouse: null, loading: true, data: null, error: "" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!warehouse) return;
    let live = true;

    // Once a counter has opened in this browser session, route changes are
    // instant. The backend still validates every protected transaction.
    if (hasOpenCashCounterFlag(warehouse)) {
      setState({ warehouse, loading: false, data: { enabled: true, status: "open" }, error: "" });
      return () => { live = false; };
    }

    customPos.getStatus(warehouse)
      .then(data => { if (live) { syncCashCounterFlag(warehouse, data?.status, data?.enabled); setState({ warehouse, loading: false, data, error: "" }); } })
      .catch(error => { if (live) setState({ warehouse, loading: false, data: null, error: error.message }); });
    return () => { live = false; };
  }, [warehouse, location.key, retry]);

  if (!warehouse) return <div className="min-h-screen grid place-items-center px-4"><div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg"><h1 className="text-xl font-bold">Choose your active location</h1><p className="mt-2 text-gray-600">A branch location is required before starting a cash transaction.</p><Link className="mt-5 inline-block rounded-lg bg-[#E00000] px-5 py-2 text-white" to="/settings">Open Settings</Link></div></div>;
  if (state.loading || state.warehouse !== warehouse) return <div className="min-h-screen grid place-items-center text-gray-600">Checking cash counter status…</div>;
  if (state.error) return <div className="min-h-screen grid place-items-center px-4"><div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg"><h1 className="text-xl font-bold">Cash counter status unavailable</h1><p className="mt-2 text-gray-600">{state.error}</p><button className="mt-5 rounded-lg bg-[#E00000] px-5 py-2 text-white" onClick={() => { setState(current => ({ ...current, loading: true })); setRetry(value => value + 1); }}>Retry</button></div></div>;
  if (state.data?.enabled === false) return children;
  if (!isCashCounterOpen(state.data?.status)) {
    return <Navigate to="/pos" replace state={{ from: location.pathname, reason: state.data?.status }} />;
  }
  return children;
}
