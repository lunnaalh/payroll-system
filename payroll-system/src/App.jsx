import { useState } from "react";
import * as XLSX from "xlsx";
import "./index.css";
import { Routes, Route, Link } from "react-router-dom";
import ShippingCost from "./ShippingCost.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [shippingData, setShippingData] = useState([]);

  const login = () => {
    if (!email || !password) {
      alert("Enter email & password");
      return;
    }
    if (email === "office@ticketothemoon.com" && password === "T1cket77") {
      setUser({ email });
    } else {
      alert("Wrong email or password");
    }
  };

  const logout = () => {
    setUser(null);
    setEmail("");
    setPassword("");
  };

  const num = (v) => {
    if (!v || v === "") return 0;
    const cleaned = String(v)
      .replace(/Rp\s*/g, "")
      .replace(/,/g, "")
      .trim();
    return Number(cleaned) || 0;
  };

  const HEADERS = [
  "NO", "NO NIK", "ACCOUNT NOMBER MAYBANK", "NAME", "DATE OF HIRED",
  "YEAR", "MONTH", "POSITION", "WORKING DAY",
  "Basic salary 2026", "yearly working", "skill", "TOTAL FIXED",
  "Monthly Meal allowance", "Tranport allowance", "overtime",
  "Meal for overtime", "Productivity", "Homework earning", "THR",
  "TOTAL INCOME", "Tidak memenuhi Target", "Excessive Absence",
  "Advance cash", "TOTAL Deduction", "BPJS  KESEHATAN",
  "BPJS  TENAGA KERJA", "PPH 21", "TOTAL", "TAKE HOME",
  "email address"
];

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // range: 6 = skip to row 7 (0-indexed), which is the first data row
      // header array = hardcoded column names matching the sheet exactly
      const json = XLSX.utils.sheet_to_json(ws, {
        defval: "",
        range: 6,
        header: HEADERS,
      });
      // filter out any rows without a name (empty rows at bottom)
      const filtered = json.filter((r) => r["NAME"] && String(r["NAME"]).trim() !== "");
      setHeaders(HEADERS);
      setRows(filtered);
    };
    reader.readAsArrayBuffer(file);
  };

  const totalEmployees = rows.length;
  const grossPayroll = rows.reduce((s, r) => s + num(r["TOTAL INCOME"]), 0);
  const totalDeductions = rows.reduce((s, r) => s + num(r["TOTAL Deduction"]), 0);
  const netPayroll = rows.reduce((s, r) => s + num(r["TAKE HOME"]), 0);

  const sendEmailsToAll = async () => {
    if (rows.length === 0) {
      alert("No employee data loaded!");
      return;
    }
    setSending(true);
    try {
      const response = await fetch(
        "https://tttm-payroll-backend-production-d976.up.railway.app/send-payslips",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("✅ Emails sent successfully!");
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      alert(`❌ Failed to send emails: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const sendSingle = async (r) => {
    const empEmail = r["email address"] || r.Email || "";
    if (!empEmail || empEmail.trim() === "") {
      alert("No email for this employee!");
      return;
    }
    try {
      const response = await fetch(
        "https://tttm-payroll-backend-production-d976.up.railway.app/send-payslips",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: [r] }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert(`✅ Sent to ${r["NAME"]}!`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      alert(`❌ Failed: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="login">
        <h1>Payroll System</h1>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Ticket To The Moon</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <p
              style={{ color: "rgba(255,255,255,0.7)", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", transition: "background 0.2s" }}
              onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.1)"; e.target.style.color = "rgba(255,255,255,0.85)"; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "rgba(255,255,255,0.7)"; }}
            >Payroll</p>
          </Link>
          <Link to="/shipping" style={{ textDecoration: "none" }}>
            <p
              style={{ color: "rgba(255,255,255,0.7)", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", transition: "background 0.2s" }}
              onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.1)"; e.target.style.color = "rgba(255,255,255,0.85)"; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "rgba(255,255,255,0.7)"; }}
            >Shipping Cost</p>
          </Link>
        </div>
        <p style={{ fontSize: "12px" }}>
          Logged in as:<br />
          {user.email}
        </p>
        <button onClick={logout}>Logout</button>
      </aside>

      <Routes>
        <Route path="/" element={
          <main className="main">
            <h1>Payroll System</h1>
            <input type="file" accept=".xlsx,.xls" onChange={handleUpload} />
            <h2>Payroll Summary</h2>
            <div className="summary">
              <div className="card"><h3>Total Employees</h3><p>{totalEmployees}</p></div>
              <div className="card"><h3>Gross Payroll</h3><p>Rp {grossPayroll.toLocaleString()}</p></div>
              <div className="card"><h3>Total Deductions</h3><p>Rp {totalDeductions.toLocaleString()}</p></div>
              <div className="card"><h3>Net Payroll</h3><p>Rp {netPayroll.toLocaleString()}</p></div>
            </div>
            <input
              className="search"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="excel-wrap">
              <table className="excel">
                <thead>
                  <tr>
                    {headers.map((h) => <th key={h}>{h}</th>)}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .filter((r) =>
                      String(r["NAME"]).toLowerCase().includes(search.toLowerCase())
                    )
                    .map((r, i) => (
                      <tr key={i}>
                        {headers.map((h) => <td key={h}>{r[h]}</td>)}
                        <td>
                          <button
                            onClick={() => sendSingle(r)}
                            style={{ backgroundColor: "#003D5C", color: "white", border: "none", padding: "4px 10px", borderRadius: "4px", cursor: "pointer" }}
                          >📧</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <button
              className="pdf"
              onClick={sendEmailsToAll}
              disabled={sending}
              style={{ backgroundColor: sending ? "#ccc" : "#4CAF50" }}
            >
              {sending ? "Sending..." : "📧 Send Emails to All Employees"}
            </button>
          </main>
        } />
        <Route path="/shipping" element={<ShippingCost data={shippingData} setData={setShippingData} />} />
      </Routes>
    </div>
  );
}
