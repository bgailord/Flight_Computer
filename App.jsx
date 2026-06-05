import { useState, useCallback } from "react";

const TABS = ["Calculs", "Navigation Vent", "Conversions"];

// ─── Helpers ───────────────────────────────────────────────────────────────
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
const mod360 = (x) => ((x % 360) + 360) % 360;

function Field({ label, value, onChange, unit, readOnly, hint }) {
  return (
    <div className="field">
      <label>{label}{unit && <span className="unit"> {unit}</span>}</label>
      <input
        type="number"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        className={readOnly ? "readonly" : ""}
        placeholder={hint || ""}
      />
    </div>
  );
}

function Result({ label, value, unit, accent }) {
  return (
    <div className={`result-row ${accent ? "accent" : ""}`}>
      <span className="rl">{label}</span>
      <span className="rv">{value !== "" && value !== null && !isNaN(value) ? `${value}${unit ? " " + unit : ""}` : "—"}</span>
    </div>
  );
}

function Card({ title, color, children }) {
  return (
    <div className="card" style={{ "--card-accent": color }}>
      <div className="card-title">{title}</div>
      <div className="card-body">{children}</div>
    </div>
  );
}

// ─── TAB 1 : CALCULS ────────────────────────────────────────────────────────
function CalcTab() {
  // TAS
  const [cas, setCas] = useState("");
  const [alt, setAlt] = useState("");
  const [oat, setOat] = useState("");

  // Fuel
  const [fuelFlow, setFuelFlow] = useState("");
  const [fuelTime, setFuelTime] = useState("");

  // Time / Dist
  const [tdDist, setTdDist] = useState("");
  const [tdSpeed, setTdSpeed] = useState("");

  // Descent
  const [descRate, setDescRate] = useState("");
  const [descTas, setDescTas] = useState("");

  // ---- TAS calc ----
  const calcTas = () => {
    const c = parseFloat(cas), h = parseFloat(alt), t = parseFloat(oat);
    if (isNaN(c) || isNaN(h) || isNaN(t)) return "";
    // ISA temp at altitude
    const isaTemp = 15 - 1.98 * (h / 1000);
    const deltaT = t - isaTemp;
    // Pressure ratio approximation
    const pressRatio = Math.pow(1 - 0.0000226 * h, 5.256);
    // Density ratio
    const tempRatioK = (t + 273.15) / (isaTemp + 273.15);
    const densityRatio = pressRatio / tempRatioK;
    const tas = c / Math.sqrt(densityRatio);
    return Math.round(tas);
  };

  const isaTemp = () => {
    const h = parseFloat(alt);
    if (isNaN(h)) return "";
    return Math.round((15 - 1.98 * (h / 1000)) * 10) / 10;
  };

  // ---- Fuel ----
  const calcFuelBurn = () => {
    const f = parseFloat(fuelFlow), t = parseFloat(fuelTime);
    if (isNaN(f) || isNaN(t)) return "";
    return Math.round(f * (t / 60) * 10) / 10;
  };
  const calcEndurance = () => {
    const f = parseFloat(fuelFlow);
    if (isNaN(f) || f === 0) return "";
    // If user enters a total fuel via fuelTime reuse field — let's use fuelTime as "total fuel litres" when fuelFlow set
    return "";
  };

  // ---- Time / Distance ----
  const calcTime = () => {
    const d = parseFloat(tdDist), s = parseFloat(tdSpeed);
    if (isNaN(d) || isNaN(s) || s === 0) return "";
    const mins = (d / s) * 60;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}min` : `${m} min`;
  };
  const calcDist = () => {
    const t = parseFloat(fuelTime), s = parseFloat(tdSpeed);
    if (isNaN(t) || isNaN(s)) return "";
    return Math.round((s * t) / 60 * 10) / 10;
  };

  // ---- Descent ----
  const calcDescAngle = () => {
    const r = parseFloat(descRate), v = parseFloat(descTas);
    if (isNaN(r) || isNaN(v) || v === 0) return "";
    // angle = atan(rate / TAS_fpm)  — TAS in kt -> fpm = kt*101.3
    const tasFpm = v * 101.3;
    return Math.round(toDeg(Math.atan(r / tasFpm)) * 10) / 10;
  };
  const calcDescGrad = () => {
    const r = parseFloat(descRate), v = parseFloat(descTas);
    if (isNaN(r) || isNaN(v) || v === 0) return "";
    const tasFpm = v * 101.3;
    return Math.round((r / tasFpm) * 1000 * 10) / 10; // ft per nm
  };

  return (
    <div className="tab-content">
      <Card title="✈ TAS depuis CAS / Alt / OAT" color="#f59e0b">
        <Field label="CAS" value={cas} onChange={setCas} unit="kt" />
        <Field label="Altitude-pression" value={alt} onChange={setAlt} unit="ft" />
        <Field label="OAT" value={oat} onChange={setOat} unit="°C" />
        <div className="results">
          <Result label="Temp ISA" value={isaTemp()} unit="°C" />
          <Result label="TAS" value={calcTas()} unit="kt" accent />
        </div>
      </Card>

      <Card title="⛽ Carburant" color="#10b981">
        <Field label="Débit carburant" value={fuelFlow} onChange={setFuelFlow} unit="L/h" />
        <Field label="Durée vol" value={fuelTime} onChange={setFuelTime} unit="min" />
        <div className="results">
          <Result label="Carburant brûlé" value={calcFuelBurn()} unit="L" accent />
        </div>
      </Card>

      <Card title="🕐 Temps / Distance" color="#6366f1">
        <Field label="Distance" value={tdDist} onChange={setTdDist} unit="nm" />
        <Field label="Vitesse sol" value={tdSpeed} onChange={setTdSpeed} unit="kt" />
        <div className="results">
          <Result label="Temps de vol" value={calcTime()} accent />
          <Result label="Distance (si durée)" value={calcDist()} unit="nm" />
        </div>
        <p className="hint-text">Pour distance: entrer la durée dans le champ "Durée vol" ci-dessus</p>
      </Card>

      <Card title="📉 Descente" color="#ef4444">
        <Field label="Taux de descente" value={descRate} onChange={setDescRate} unit="ft/min" />
        <Field label="TAS" value={descTas} onChange={setDescTas} unit="kt" />
        <div className="results">
          <Result label="Angle de descente" value={calcDescAngle()} unit="°" accent />
          <Result label="Gradient" value={calcDescGrad()} unit="ft/nm" />
        </div>
      </Card>
    </div>
  );
}

// ─── TAB 2 : NAVIGATION VENT (Wind Triangle) ────────────────────────────────
function WindTab() {
  const [hdg, setHdg] = useState("");      // True heading
  const [tas, setTas] = useState("");      // TAS kt
  const [windDir, setWindDir] = useState(""); // Wind FROM direction
  const [windSpd, setWindSpd] = useState(""); // Wind speed kt

  const compute = () => {
    const H = parseFloat(hdg);
    const T = parseFloat(tas);
    const WD = parseFloat(windDir);
    const WS = parseFloat(windSpd);
    if ([H, T, WD, WS].some(isNaN)) return null;

    // Wind components
    const wca_rad = toRad(WD - H);
    const crossWind = WS * Math.sin(wca_rad);
    const headWind = WS * Math.cos(wca_rad);

    // Ground speed
    const gs = T - headWind;

    // Wind correction angle
    const wca = toDeg(Math.asin(crossWind / T));

    // Track
    const track = mod360(H + wca);

    return {
      gs: Math.round(gs),
      wca: Math.round(wca * 10) / 10,
      track: Math.round(track),
      headWind: Math.round(headWind),
      crossWind: Math.round(Math.abs(crossWind)),
      crossDir: crossWind > 0 ? "Droite" : "Gauche",
      windComponent: headWind > 0 ? "Face" : "Arrière",
    };
  };

  // Reverse: find heading from track + wind
  const [track, setTrack] = useState("");
  const [gs, setGs] = useState("");
  const [rWindDir, setRWindDir] = useState("");
  const [rWindSpd, setRWindSpd] = useState("");

  const computeReverse = () => {
    const TR = parseFloat(track);
    const GS = parseFloat(gs);
    const WD = parseFloat(rWindDir);
    const WS = parseFloat(rWindSpd);
    if ([TR, GS, WD, WS].some(isNaN)) return null;

    // iterative approach
    let hdgEst = TR;
    for (let i = 0; i < 20; i++) {
      const wca_rad = toRad(WD - hdgEst);
      const crossWind = WS * Math.sin(wca_rad);
      const headWind = WS * Math.cos(wca_rad);
      const tasEst = GS + headWind;
      if (tasEst <= 0) return null;
      const wcaNew = toDeg(Math.asin(Math.min(1, Math.max(-1, crossWind / tasEst))));
      hdgEst = mod360(TR - wcaNew);
    }
    const wca_rad = toRad(WD - hdgEst);
    const headWind = WS * Math.cos(wca_rad);
    const crossWind = WS * Math.sin(wca_rad);
    const tas = GS + headWind;
    const wca = toDeg(Math.asin(Math.min(1, Math.max(-1, crossWind / tas))));

    return {
      hdg: Math.round(mod360(hdgEst)),
      tas: Math.round(tas),
      wca: Math.round(wca * 10) / 10,
    };
  };

  const res = compute();
  const resRev = computeReverse();

  // Wind triangle SVG visualization
  const WindDiagram = () => {
    if (!res) return null;
    const H = parseFloat(hdg);
    const WD = parseFloat(windDir);
    const WS = parseFloat(windSpd);
    const T = parseFloat(tas);
    const scale = 0.6;
    const cx = 100, cy = 100;
    // TAS vector (heading direction)
    const tasX = cx + T * scale * Math.sin(toRad(H));
    const tasY = cy - T * scale * Math.cos(toRad(H));
    // Wind vector (wind goes TO opposite of FROM)
    const windToDir = mod360(WD + 180);
    const wX = tasX + WS * scale * Math.sin(toRad(windToDir));
    const wY = tasY - WS * scale * Math.cos(toRad(windToDir));

    return (
      <svg viewBox="0 0 200 200" className="wind-svg">
        <circle cx={cx} cy={cy} r={2} fill="#f59e0b" />
        {/* TAS */}
        <line x1={cx} y1={cy} x2={tasX} y2={tasY} stroke="#6366f1" strokeWidth="2" markerEnd="url(#arr)" />
        {/* Wind */}
        <line x1={tasX} y1={tasY} x2={wX} y2={wY} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4" />
        {/* GS (resultant) */}
        <line x1={cx} y1={cy} x2={wX} y2={wY} stroke="#10b981" strokeWidth="2" markerEnd="url(#arr2)" />
        <text x={cx-8} y={cy-6} fill="#aaa" fontSize="9">A/C</text>
        <text x={tasX+3} y={tasY} fill="#6366f1" fontSize="8">TAS</text>
        <text x={wX+3} y={wY} fill="#10b981" fontSize="8">GS</text>
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#6366f1" />
          </marker>
          <marker id="arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#10b981" />
          </marker>
        </defs>
      </svg>
    );
  };

  return (
    <div className="tab-content">
      <Card title="🧭 Cap → Route (avec vent)" color="#6366f1">
        <div className="two-col">
          <Field label="Cap vrai" value={hdg} onChange={setHdg} unit="°" />
          <Field label="TAS" value={tas} onChange={setTas} unit="kt" />
          <Field label="Vent de" value={windDir} onChange={setWindDir} unit="°" />
          <Field label="Vitesse vent" value={windSpd} onChange={setWindSpd} unit="kt" />
        </div>
        <WindDiagram />
        {res && (
          <div className="results">
            <Result label="Vitesse sol (GS)" value={res.gs} unit="kt" accent />
            <Result label="Route vraie" value={res.track} unit="°" accent />
            <Result label="Correction vent (WCA)" value={res.wca} unit="°" />
            <Result label="Vent de face/arrière" value={`${Math.abs(res.headWind)} kt ${res.windComponent}`} />
            <Result label="Vent traversier" value={`${res.crossWind} kt ${res.crossDir}`} />
          </div>
        )}
      </Card>

      <Card title="🔁 Route → Cap (inverse)" color="#f59e0b">
        <div className="two-col">
          <Field label="Route souhaitée" value={track} onChange={setTrack} unit="°" />
          <Field label="Vitesse sol visée" value={gs} onChange={setGs} unit="kt" />
          <Field label="Vent de" value={rWindDir} onChange={setRWindDir} unit="°" />
          <Field label="Vitesse vent" value={rWindSpd} onChange={setRWindSpd} unit="kt" />
        </div>
        {resRev && (
          <div className="results">
            <Result label="Cap à tenir" value={resRev.hdg} unit="°T" accent />
            <Result label="TAS nécessaire" value={resRev.tas} unit="kt" accent />
            <Result label="WCA" value={resRev.wca} unit="°" />
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── TAB 3 : CONVERSIONS ────────────────────────────────────────────────────
function ConvTab() {
  const [val, setVal] = useState("");
  const v = parseFloat(val);

  const convGroups = [
    {
      title: "🌡 Température",
      color: "#ef4444",
      items: [
        { label: "°C → °F", fn: () => Math.round((v * 9/5 + 32) * 10)/10 },
        { label: "°F → °C", fn: () => Math.round(((v - 32) * 5/9) * 10)/10 },
        { label: "°C → K", fn: () => Math.round((v + 273.15) * 10)/10 },
      ],
    },
    {
      title: "📏 Distance",
      color: "#10b981",
      items: [
        { label: "nm → km", fn: () => Math.round(v * 1.852 * 100)/100 },
        { label: "km → nm", fn: () => Math.round(v / 1.852 * 100)/100 },
        { label: "nm → miles stat.", fn: () => Math.round(v * 1.150779 * 100)/100 },
        { label: "ft → m", fn: () => Math.round(v * 0.3048 * 10)/10 },
        { label: "m → ft", fn: () => Math.round(v / 0.3048 * 10)/10 },
      ],
    },
    {
      title: "⚡ Vitesse",
      color: "#6366f1",
      items: [
        { label: "kt → km/h", fn: () => Math.round(v * 1.852 * 10)/10 },
        { label: "km/h → kt", fn: () => Math.round(v / 1.852 * 10)/10 },
        { label: "kt → m/s", fn: () => Math.round(v * 0.5144 * 100)/100 },
        { label: "kt → mph", fn: () => Math.round(v * 1.15078 * 100)/100 },
      ],
    },
    {
      title: "⛽ Volume / Poids",
      color: "#f59e0b",
      items: [
        { label: "L → US Gal", fn: () => Math.round(v * 0.264172 * 1000)/1000 },
        { label: "US Gal → L", fn: () => Math.round(v * 3.78541 * 100)/100 },
        { label: "Imp Gal → L", fn: () => Math.round(v * 4.54609 * 100)/100 },
        { label: "L → Imp Gal", fn: () => Math.round(v * 0.219969 * 1000)/1000 },
        { label: "kg → lbs", fn: () => Math.round(v * 2.20462 * 100)/100 },
        { label: "lbs → kg", fn: () => Math.round(v * 0.453592 * 100)/100 },
      ],
    },
    {
      title: "🔵 Pression",
      color: "#8b5cf6",
      items: [
        { label: "hPa → inHg", fn: () => Math.round(v * 0.02953 * 10000)/10000 },
        { label: "inHg → hPa", fn: () => Math.round(v * 33.8639 * 100)/100 },
        { label: "PSI → hPa", fn: () => Math.round(v * 68.9476 * 10)/10 },
      ],
    },
  ];

  return (
    <div className="tab-content">
      <div className="conv-input-wrap">
        <div className="conv-input-label">Valeur à convertir</div>
        <input
          type="number"
          className="conv-input"
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="Entrez un nombre..."
        />
      </div>
      {convGroups.map(g => (
        <Card key={g.title} title={g.title} color={g.color}>
          <div className="results">
            {g.items.map(item => {
              const result = !isNaN(v) ? item.fn() : null;
              return <Result key={item.label} label={item.label} value={result !== null ? result : ""} />;
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0a0a0f;
          color: #e8e8f0;
          font-family: 'DM Mono', monospace;
          -webkit-font-smoothing: antialiased;
          min-height: 100dvh;
        }

        .app {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: #0d0d16;
        }

        header {
          padding: 20px 20px 0;
          background: linear-gradient(180deg, #13131f 0%, #0d0d16 100%);
          border-bottom: 1px solid #1e1e30;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
        }

        .header-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .logo {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: conic-gradient(from 135deg, #f59e0b, #ef4444, #6366f1, #10b981, #f59e0b);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .header-text h1 {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.3px;
        }

        .header-text p {
          font-size: 10px;
          color: #555568;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #1e1e30;
          margin: 0 -20px;
        }

        .tab-btn {
          flex: 1;
          padding: 10px 4px;
          background: none;
          border: none;
          color: #555568;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
          letter-spacing: 0.3px;
        }

        .tab-btn.active {
          color: #e8e8f0;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 10%;
          width: 80%;
          height: 2px;
          border-radius: 2px 2px 0 0;
          background: linear-gradient(90deg, #f59e0b, #6366f1);
        }

        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px 16px 100px;
        }

        .card {
          background: #13131f;
          border-radius: 16px;
          border: 1px solid #1e1e30;
          overflow: hidden;
          position: relative;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--card-accent, #6366f1);
          opacity: 0.8;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          padding: 14px 16px 10px;
          color: #c8c8d8;
          border-bottom: 1px solid #1e1e30;
          letter-spacing: -0.2px;
        }

        .card-body {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        label {
          font-size: 10px;
          color: #666680;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .unit {
          color: #444458;
          text-transform: none;
          letter-spacing: 0;
        }

        input[type="number"] {
          background: #0a0a12;
          border: 1px solid #222235;
          border-radius: 10px;
          padding: 10px 12px;
          color: #e8e8f0;
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          width: 100%;
          transition: border-color 0.15s;
          -moz-appearance: textfield;
        }

        input[type="number"]:focus {
          outline: none;
          border-color: #6366f1;
          background: #0c0c18;
        }

        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
        }

        input.readonly {
          background: #0d0d18;
          color: #888;
          border-color: #1a1a28;
          cursor: default;
        }

        .results {
          background: #0a0a12;
          border-radius: 10px;
          border: 1px solid #1e1e2e;
          overflow: hidden;
        }

        .result-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid #131320;
          transition: background 0.15s;
        }

        .result-row:last-child { border-bottom: none; }

        .result-row.accent {
          background: linear-gradient(90deg, rgba(99,102,241,0.08) 0%, transparent 100%);
        }

        .rl {
          font-size: 11px;
          color: #666680;
          letter-spacing: 0.3px;
        }

        .rv {
          font-size: 15px;
          color: #e8e8f0;
          font-weight: 500;
        }

        .result-row.accent .rv {
          color: #a5b4fc;
        }

        .hint-text {
          font-size: 10px;
          color: #444458;
          text-align: center;
          padding-top: 2px;
        }

        .wind-svg {
          width: 100%;
          max-width: 200px;
          display: block;
          margin: 8px auto;
          background: #0a0a12;
          border-radius: 50%;
          border: 1px solid #1e1e2e;
        }

        .conv-input-wrap {
          background: #13131f;
          border-radius: 16px;
          border: 1px solid #1e1e30;
          padding: 16px;
          position: sticky;
          top: 89px;
          z-index: 50;
        }

        .conv-input-label {
          font-size: 10px;
          color: #666680;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
        }

        .conv-input {
          background: #0a0a12;
          border: 1px solid #6366f1;
          border-radius: 10px;
          padding: 12px 16px;
          color: #e8e8f0;
          font-family: 'DM Mono', monospace;
          font-size: 20px;
          width: 100%;
          -moz-appearance: textfield;
        }

        .conv-input:focus {
          outline: none;
          border-color: #a5b4fc;
        }

        .conv-input::-webkit-outer-spin-button,
        .conv-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
        }

        main { flex: 1; overflow-y: auto; }
      `}</style>

      <div className="app">
        <header>
          <div className="header-top">
            <div className="logo">✈</div>
            <div className="header-text">
              <h1>CRP-5 Digital</h1>
              <p>Pooley's Flight Computer</p>
            </div>
          </div>
          <div className="tabs">
            {TABS.map((t, i) => (
              <button
                key={t}
                className={`tab-btn ${tab === i ? "active" : ""}`}
                onClick={() => setTab(i)}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        <main>
          {tab === 0 && <CalcTab />}
          {tab === 1 && <WindTab />}
          {tab === 2 && <ConvTab />}
        </main>
      </div>
    </>
  );
}
