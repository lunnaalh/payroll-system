import { useState } from "react";
import * as XLSX from "xlsx";

export default function ShippingCost({ data, setData }) {
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const raw = new Uint8Array(evt.target.result);
      const wb = XLSX.read(raw, { type: "array" });
      const allRows = [];
      wb.SheetNames.forEach((sheetName) => {
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "", range: 1 });
        json.forEach((r) => {
          const awb = String(r["AWB NO"] || r["BL / AWB NO"] || "").replace(/\s/g, "");
          const carrier = String(r["Courier"] || "").toUpperCase().includes("FEDEX") ? "FedEx" : "DHL";
          const invoice = String(r["No Invoice"] || "—");
          const destination = String(r["Country"] || "—");
          const rawDate = r["DATE"];
          let date = "—";
          try {
            if (rawDate && typeof rawDate === "number") {
              const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
              if (!isNaN(d.getTime())) date = d.toISOString().split("T")[0];
            } else if (rawDate) {
              date = String(rawDate);
            }
          } catch (e) {
            date = "—";
          }
          const weight = r["Weight of shipment (kgs)"] || r["Weight"] || null;
          const customer = String(r["Nama Customer"] || "—");
          if (awb && awb.length > 3) {
            allRows.push({
              awb,
              invoice,
              carrier,
              destination,
              date,
              weight: weight ? `${weight} kg` : null,
              freight: null,
              duty: null,
              billed: null,
              status: "Pending",
              customer,
              sheet: sheetName,
            });
          }
        });
      });
      setData(allRows);
    };
    reader.readAsArrayBuffer(file);
  };

  const filtered = data.filter((r) =>
    r.awb.includes(search) &&
    (carrierFilter ? r.carrier === carrierFilter : true) &&
    (statusFilter ? r.status === statusFilter : true)
  );

  const totalCost = data.filter(r => r.billed).reduce((s, r) => s + r.billed, 0);
  const pendingCount = data.filter(r => r.status === "Pending").length;

  const fetchSingle = async (awb, carrier) => {
    setData(prev => prev.map(r =>
      r.awb === awb ? { ...r, status: "Fetching..." } : r
    ));

    try {
      const response = await fetch("https://tttm-payroll-backend-production-d976.up.railway.app/track-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awb, carrier })
      });

      const result = await response.json();

      if (result.success) {
        const trackData = result.data?.output?.completeTrackResults?.[0]?.trackResults?.[0];
        const status = trackData?.latestStatusDetail?.description ||
                       trackData?.latestStatusDetail?.statusByLocale ||
                       "In Transit";
        const weight = trackData?.packageDetails?.weightAndDimensions?.weight?.[0]?.value
          ? `${trackData.packageDetails.weightAndDimensions.weight[0].value} kg`
          : null;

        setData(prev => prev.map(r =>
          r.awb === awb ? { ...r, status, weight: weight || r.weight } : r
        ));
      } else {
        setData(prev => prev.map(r =>
          r.awb === awb ? { ...r, status: "Error" } : r
        ));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setData(prev => prev.map(r =>
        r.awb === awb ? { ...r, status: "Error" } : r
      ));
    }
  };

  const fetchAll = () => {
    data.filter(r => r.status === "Pending" || r.status === "Error").forEach(r => fetchSingle(r.awb, r.carrier));
  };

  return (
    <main className="main">
      <h1>Shipping Cost</h1>

      <input type="file" accept=".xlsx,.xls" onChange={handleUpload} style={{ marginBottom: "1.5rem", background: "white", border: "1px dashed #cbd5f5", padding: "14px", borderRadius: "10px", cursor: "pointer", display: "block" }} />

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
          <option value="Pending">Pending</option>
          <option value="In Transit">In Transit</option>
          <option value="Customs Clearance Process">Customs Clearance Process</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Error">Error</option>
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
              <th>Customer</th>
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
                <td>{r.customer}</td>
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
                    {r.status === "Fetching..." ? "..." : "Fetch"}
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