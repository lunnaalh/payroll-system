import { useState } from "react";

const mockData = [
  { awb: "1234567890", invoice: "INV-001", carrier: "DHL", destination: "Singapore", date: "2026-04-28", freight: 38.00, duty: 7.20, weight: "2.5 kg", billed: 45.20, status: "Delivered" },
  { awb: "9876543210", invoice: "INV-002", carrier: "FedEx", destination: "Tokyo, JP", date: "2026-04-28", freight: 80.00, duty: 11.40, weight: "4.1 kg", billed: 91.40, status: "Delivered" },
  { awb: "1122334455", invoice: "INV-003", carrier: "DHL", destination: "Sydney, AU", date: "2026-04-27", freight: 100.00, duty: 14.60, weight: "6.0 kg", billed: 114.60, status: "Out for Delivery" },
  { awb: "5566778899", invoice: "INV-004", carrier: "FedEx", destination: "Dubai, UAE", date: "2026-04-27", freight: 68.00, duty: 7.00, weight: "3.2 kg", billed: 75.00, status: "In Transit" },
  { awb: "4455667788", invoice: "INV-005", carrier: "DHL", destination: "Jakarta, ID", date: "2026-04-29", freight: null, duty: null, weight: null, billed: null, status: "Customs Clearance Process" },
  { awb: "8899001122", invoice: "INV-006", carrier: "FedEx", destination: "Bangkok, TH", date: "2026-04-30", freight: null, duty: null, weight: null, billed: null, status: "In Transit" },
  { awb: "9900112233", invoice: "INV-007", carrier: "DHL", destination: "Mumbai, IN", date: "2026-04-30", freight: null, duty: null, weight: null, billed: null, status: "In Transit" },
];

export default function ShippingCost() {
  const [data, setData] = useState(mockData);
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = data.filter((r) =>
    r.awb.includes(search) &&
    (carrierFilter ? r.carrier === carrierFilter : true) &&
    (statusFilter ? r.status === statusFilter : true)
  );

  const totalCost = data.filter(r => r.billed).reduce((s, r) => s + r.billed, 0);
  const pendingCount = data.filter(r => !r.billed).length;

  const fetchSingle = async (awb, carrier) => {
    setData(prev => prev.map(r =>
      r.awb === awb ? { ...r, status: "In Transit" } : r
    ));

    try {
      const response = await fetch("https://tttm-payroll-backend-production-d976.up.railway.app/track-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awb, carrier })
      });

      const result = await response.json();
      console.log("FedEx response:", result);

      if (result.success) {
        const trackData = result.data?.output?.completeTrackResults?.[0]?.trackResults?.[0];
        console.log("Track data:", trackData);
        const status = trackData?.latestStatusDetail?.description ||
                       trackData?.latestStatusDetail?.statusByLocale ||
                       "In Transit";
        const weight = trackData?.packageDetails?.weightAndDimensions?.weight?.[0]?.value
          ? `${trackData.packageDetails.weightAndDimensions.weight[0].value} kg`
          : "—";

        setData(prev => prev.map(r =>
          r.awb === awb ? { ...r, status, weight } : r
        ));
      } else {
        alert("Could not fetch shipment: " + (result.error || "Unknown error"));
        setData(prev => prev.map(r =>
          r.awb === awb ? { ...r, status: "In Transit" } : r
        ));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to connect to server!");
    }
  };

  const fetchAll = () => {
    data.filter(r => !r.billed).forEach(r => fetchSingle(r.awb, r.carrier));
  };

  return (
    <main className="main">
      <h1>Shipping Cost</h1>

      <div className="summary">
        <div className="card"><h3>Total Shipments</h3><p>{data.length}</p></div>
        <div className="card"><h3>Total Billed</h3><p>${totalCost.toFixed(2)}</p></div>
        <div className="card"><h3>Pending Fetch</h3><p>{pendingCount}</p></div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          className="search"
          placeholder="Search AWB number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="search" value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}>
          <option value="">All carriers</option>
          <option value="DHL">DHL</option>
          <option value="FedEx">FedEx</option>
        </select>
        <select className="search" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="In Transit">In Transit</option>
          <option value="Customs Clearance Process">Customs Clearance Process</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
        </select>
        <button className="pdf" onClick={fetchAll} style={{ backgroundColor: "#4CAF50" }}>
          Fetch All Costs
        </button>
      </div>

      <div className="excel-wrap">
        <table className="excel">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>AWB Number</th>
              <th>Carrier</th>
              <th>Destination</th>
              <th>Date</th>
              <th>Weight</th>
              <th>Freight Cost</th>
              <th>Duty Cost</th>   
              <th>Total Billed</th>  
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td>{r.invoice}</td>
                <td><code>{r.awb}</code></td>
                <td>{r.carrier}</td> 
                <td>{r.destination}</td>
                <td>{r.date}</td>
                <td style={{ color: r.weight ? "inherit" : "#aaa", fontStyle: r.weight ? "normal" : "italic" }}>{r.weight || "—"}</td>
                <td style={{ color: r.freight ? "inherit" : "#aaa", fontStyle: r.freight ? "normal" : "italic" }}>{r.freight ? `$${r.freight.toFixed(2)}` : "—"}</td>
                <td style={{ color: r.duty ? "inherit" : "#aaa", fontStyle: r.duty ? "normal" : "italic" }}>{r.duty ? `$${r.duty.toFixed(2)}` : "—"}</td>
                <td style={{ fontWeight: r.billed ? "600" : "normal", color: r.billed ? "inherit" : "#aaa", fontStyle: r.billed ? "normal" : "italic" }}>{r.billed ? `$${r.billed.toFixed(2)}` : "—"}</td>
                <td>{r.status}</td>
                <td>
                  <button
                    onClick={() => fetchSingle(r.awb, r.carrier)}
                    style={{ backgroundColor: "#003D5C", color: "white", border: "none", padding: "4px 10px", borderRadius: "4px", cursor: "pointer" }}
                  >
                    {r.billed ? "Refresh" : "Fetch"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}