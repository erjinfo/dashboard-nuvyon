import { useState, useRef, useCallback, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

// ═══════════════════════════════════════════════════════════════════
// STORAGE — persiste metadados e dados entre sessões
// ═══════════════════════════════════════════════════════════════════
const STORAGE_KEY = "nuvyon-dados-v2";

async function salvarStorage(dados) {
  try {
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      nomes: dados.nomes,
      agentes: dados.agentes,
      tecnicos: dados.tecnicos,
      clientes: dados.clientes,
      totais: dados.totais,
    });
    localStorage.setItem(STORAGE_KEY, payload);
  } catch (e) { console.warn("Storage save failed:", e); }
}

async function carregarStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY); const r = raw ? { value: raw } : null;
    if (r?.value) return JSON.parse(r.value);
  } catch (e) { console.warn("Storage load failed:", e); }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// DADOS-BASE (fallback enquanto não há upload)
// ═══════════════════════════════════════════════════════════════════
const BASE_AGENTES = {
  "Ana Carolina":     { total:1258, finalizados:1056, transferidos:202, reincidentes:518, tempo_atend_min:0.0,  score:48, veredicto:"Treinar", taxa_resolucao:83.9, taxa_reincidencia:41.2, taxa_transferencia:16.1 },
  "Anderson":         { total:417,  finalizados:365,  transferidos:52,  reincidentes:180, tempo_atend_min:0.0,  score:50, veredicto:"Treinar", taxa_resolucao:87.5, taxa_reincidencia:43.2, taxa_transferencia:12.5 },
  "Eldo M":           { total:194,  finalizados:172,  transferidos:22,  reincidentes:93,  tempo_atend_min:7.4,  score:48, veredicto:"Treinar", taxa_resolucao:88.7, taxa_reincidencia:47.9, taxa_transferencia:11.3 },
  "Felipe":           { total:1826, finalizados:1409, transferidos:408, reincidentes:763, tempo_atend_min:0.0,  score:43, veredicto:"Treinar", taxa_resolucao:77.2, taxa_reincidencia:41.8, taxa_transferencia:22.3 },
  "Felipe Policiano": { total:599,  finalizados:474,  transferidos:125, reincidentes:243, tempo_atend_min:0.0,  score:45, veredicto:"Treinar", taxa_resolucao:79.1, taxa_reincidencia:40.6, taxa_transferencia:20.9 },
  "Gabriel":          { total:440,  finalizados:418,  transferidos:22,  reincidentes:188, tempo_atend_min:36.0, score:55, veredicto:"Treinar", taxa_resolucao:95.0, taxa_reincidencia:42.7, taxa_transferencia:5.0  },
  "Luiza":            { total:769,  finalizados:653,  transferidos:116, reincidentes:304, tempo_atend_min:0.0,  score:50, veredicto:"Treinar", taxa_resolucao:84.9, taxa_reincidencia:39.5, taxa_transferencia:15.1 },
  "Marcelo":          { total:875,  finalizados:874,  transferidos:1,   reincidentes:383, tempo_atend_min:6.6,  score:58, veredicto:"Treinar", taxa_resolucao:99.9, taxa_reincidencia:43.8, taxa_transferencia:0.1  },
  "Maria Ligia":      { total:1810, finalizados:1421, transferidos:388, reincidentes:758, tempo_atend_min:0.0,  score:44, veredicto:"Treinar", taxa_resolucao:78.5, taxa_reincidencia:41.9, taxa_transferencia:21.4 },
  "Rafael":           { total:1533, finalizados:1293, transferidos:238, reincidentes:630, tempo_atend_min:0.9,  score:49, veredicto:"Treinar", taxa_resolucao:84.3, taxa_reincidencia:41.1, taxa_transferencia:15.5 },
  "Rafaella":         { total:984,  finalizados:817,  transferidos:166, reincidentes:420, tempo_atend_min:0.0,  score:47, veredicto:"Treinar", taxa_resolucao:83.0, taxa_reincidencia:42.7, taxa_transferencia:16.9 },
  "Trainee":          { total:648,  finalizados:544,  transferidos:104, reincidentes:265, tempo_atend_min:0.0,  score:48, veredicto:"Treinar", taxa_resolucao:84.0, taxa_reincidencia:40.9, taxa_transferencia:16.0 },
};
const BASE_TECNICOS = {
  "1Alexandre Moc":    { os:234, reinc:6,  taxa_r:2.6,  taxa_rap:15.0, taxa_gen:12.0, score:77, v:"Manter",   flag:"Normal"    },
  "1Batista Moc":      { os:241, reinc:1,  taxa_r:0.4,  taxa_rap:8.0,  taxa_gen:8.0,  score:97, v:"Manter",   flag:"Elogio"    },
  "1Daniel Moc":       { os:293, reinc:10, taxa_r:3.4,  taxa_rap:18.0, taxa_gen:14.0, score:72, v:"Treinar",  flag:"Normal"    },
  "1Gustavo Moc":      { os:207, reinc:12, taxa_r:5.8,  taxa_rap:22.0, taxa_gen:18.0, score:48, v:"Treinar",  flag:"Atenção"   },
  "1Lucas Moc":        { os:160, reinc:2,  taxa_r:1.2,  taxa_rap:10.0, taxa_gen:9.0,  score:91, v:"Manter",   flag:"Elogio"    },
  "4Matheus Henrique da Silva - CBN": { os:300, reinc:6, taxa_r:2.0, taxa_rap:12.0, taxa_gen:10.0, score:84, v:"Manter", flag:"Normal" },
  "5Jonathan EXP":     { os:275, reinc:6,  taxa_r:2.2,  taxa_rap:13.0, taxa_gen:11.0, score:83, v:"Manter",   flag:"Normal"    },
  "7Cesar Augusto Ferraz": { os:216, reinc:23, taxa_r:10.6, taxa_rap:25.0, taxa_gen:28.0, score:0, v:"Desligar", flag:"Alto Risco" },
  "7Jose Carlos Barbosa": { os:263, reinc:3, taxa_r:1.1, taxa_rap:1.1, taxa_gen:4.6,  score:93, v:"Manter",   flag:"Elogio"    },
  "7Juan Micheli Dias": { os:220, reinc:15, taxa_r:6.8, taxa_rap:20.0, taxa_gen:18.0, score:38, v:"Treinar",  flag:"Atenção"   },
  "7Maykon Aparecido Da Silva": { os:97, reinc:0, taxa_r:0.0, taxa_rap:5.0, taxa_gen:8.0, score:99, v:"Manter", flag:"Elogio" },
  "7Thiago Souza da Cruz": { os:220, reinc:30, taxa_r:13.6, taxa_rap:22.0, taxa_gen:30.0, score:20, v:"Desligar", flag:"Alto Risco" },
  "9.1Jordel Almeida": { os:427, reinc:11, taxa_r:2.6,  taxa_rap:15.0, taxa_gen:10.0, score:82, v:"Manter",   flag:"Normal"    },
  "9.1Thiago Leal":    { os:289, reinc:4,  taxa_r:1.4,  taxa_rap:12.0, taxa_gen:8.0,  score:88, v:"Manter",   flag:"Normal"    },
};
const BASE_CLIENTES = [
  { codigo:34884, nome:"MAICON DE OLIVEIRA VIEIRA",       os:5, reinc:3, health:25, risco:"Alto",  acao:"Retenção Urgente: VIP + Upgrade" },
  { codigo:51047, nome:"ANA CLAUDIA BISPO PINHEIRO",      os:5, reinc:3, health:25, risco:"Alto",  acao:"Retenção Urgente: VIP + Upgrade" },
  { codigo:55853, nome:"SIDNEY ROBERTO DA COSTA",         os:4, reinc:3, health:25, risco:"Alto",  acao:"Retenção Urgente: VIP + Upgrade" },
  { codigo:37074, nome:"ELTON FIRMINO DE BRITO MARCELINO",os:4, reinc:2, health:50, risco:"Alto",  acao:"Refidelização: Bonificação + Revisão" },
  { codigo:22268, nome:"M C GOHLKE LTDA",                 os:3, reinc:2, health:50, risco:"Alto",  acao:"Refidelização: Bonificação + Revisão" },
  { codigo:13078, nome:"ROSIMEIRE TEIXEIRA",              os:4, reinc:2, health:50, risco:"Alto",  acao:"Refidelização: Bonificação + Revisão" },
  { codigo:50081, nome:"ANA PAULA GOMES DA SILVA",        os:3, reinc:2, health:50, risco:"Médio", acao:"Monitoramento Ativo" },
  { codigo:49013, nome:"EMILIANO DE BARROS OCAMPO",       os:3, reinc:2, health:50, risco:"Médio", acao:"Monitoramento Ativo" },
  { codigo:20975, nome:"IVONETE PEREIRA DA SILVA MURER",  os:6, reinc:2, health:50, risco:"Médio", acao:"Monitoramento Ativo" },
];
const BASE_TOTAIS = { total_os:7424, total_sac:27240, total_at:12501, reinc_os:252, clientes_alto_risco:22, inconsistencias_diag:485 };

// ═══════════════════════════════════════════════════════════════════
// PROCESSAMENTO DOS ARQUIVOS
// ═══════════════════════════════════════════════════════════════════
function parseTime(t) {
  if (!t || typeof t !== "string") return null;
  const p = t.trim().split(":");
  if (p.length >= 2) return parseInt(p[0]) * 60 + parseInt(p[1]);
  return null;
}

function processOS(rows) {
  const tMap = {};
  let total = 0, reinc_total = 0, incons_total = 0;
  rows.forEach(r => {
    total++;
    const tecs = String(r["tecnicos"] || "").split(",").map(t => t.trim()).filter(Boolean);
    const tipo = String(r["tipo_ordem_servico"] || "").trim();
    const motivo = String(r["motivos_fechamento"] || "").replace(/\n/g, "").trim().toLowerCase();
    const desc = String(r["descricao_fechamento"] || "").toLowerCase();
    const isReinc = /REINCID/i.test(tipo);
    const isIncons = /SEM SINAL|COM SINAL/i.test(tipo) && /fonte|onu|roteador|troca de equip/i.test(motivo);
    const hi = parseTime(String(r["hora_inicio_executado"] || ""));
    const hf = parseTime(String(r["hora_termino_executado"] || ""));
    const dur = (hi != null && hf != null && hf > hi) ? hf - hi : null;
    const isRapida = dur != null && dur < 20;
    const isGen = desc.length < 15 || (desc.length < 30 && /^(ok|pronto|resolvido|feito)/.test(desc.trim()));
    if (isReinc) reinc_total++;
    if (isIncons) incons_total++;
    tecs.forEach(t => {
      if (!tMap[t]) tMap[t] = { os: 0, reinc: 0, rapidas: 0, gen: 0, incons: 0 };
      tMap[t].os++;
      if (isReinc) tMap[t].reinc++;
      if (isRapida) tMap[t].rapidas++;
      if (isGen) tMap[t].gen++;
      if (isIncons) tMap[t].incons++;
    });
  });
  const tecnicos = {};
  Object.entries(tMap).forEach(([k, v]) => {
    if (v.os < 3) return;
    const taxa_r   = +((v.reinc   / v.os) * 100).toFixed(1);
    const taxa_rap = +((v.rapidas / v.os) * 100).toFixed(1);
    const taxa_gen = +((v.gen     / v.os) * 100).toFixed(1);
    const score    = Math.round(Math.max(0, Math.min(100, 100 - taxa_r*4 - taxa_gen*0.5 - taxa_rap*0.3)));
    const flag     = v.reinc === 0 && taxa_gen < 20 ? "Elogio" : taxa_r > 10 ? "Alto Risco" : taxa_r > 5 ? "Atenção" : "Normal";
    const verd     = taxa_r > 8 && taxa_gen > 30 ? "Desligar" : taxa_r > 4 || (taxa_rap > 40 && v.reinc > 2) ? "Treinar" : "Manter";
    tecnicos[k]    = { os: v.os, reinc: v.reinc, taxa_r, taxa_rap, taxa_gen, score, v: verd, flag };
  });
  // clientes
  const cliMap = {};
  rows.forEach(r => {
    const cod  = r["codigo_cliente"];
    const nome = String(r["nome_razaosocial"] || "").trim();
    const tipo = String(r["tipo_ordem_servico"] || "");
    const isReinc = /REINCID/i.test(tipo);
    if (!cliMap[cod]) cliMap[cod] = { nome, os: 0, reinc: 0 };
    cliMap[cod].os++;
    if (isReinc) cliMap[cod].reinc++;
  });
  const clientes = Object.entries(cliMap)
    .map(([cod, v]) => {
      const health = Math.max(0, 100 - v.reinc * 25);
      const risco  = health <= 25 ? "Alto" : health <= 50 ? "Alto" : health <= 74 ? "Médio" : "Baixo";
      const acao   = health <= 25 ? "Retenção Urgente: VIP + Upgrade" : health <= 50 ? "Refidelização: Bonificação + Revisão" : "Monitoramento Ativo";
      return { codigo: +cod, nome: v.nome, os: v.os, reinc: v.reinc, health, risco, acao };
    })
    .filter(c => c.risco !== "Baixo")
    .sort((a, b) => a.health - b.health)
    .slice(0, 40);
  return { tecnicos, clientes, total_os: total, reinc_os: reinc_total, incons: incons_total };
}

function processSAC(rows) {
  const aMap = {};
  rows.forEach(r => {
    const ag = String(r["Agente"] || r["agente"] || "").trim();
    if (!ag) return;
    if (!aMap[ag]) aMap[ag] = { total: 0, fin: 0, transf: 0, reinc: 0, tempo: [] };
    aMap[ag].total++;
    if (/Finalizado/i.test(String(r["Status"] || ""))) aMap[ag].fin++;
    if (/Transferido/i.test(String(r["Status"] || ""))) aMap[ag].transf++;
    if (/Reincidente/i.test(String(r["Recorrência"] || r["Recorrencia"] || ""))) aMap[ag].reinc++;
    const ta = parseFloat(r["Tempo de Atendimento"] || 0);
    if (ta > 0) aMap[ag].tempo.push(ta * 1440);
  });
  const agentes = {};
  Object.entries(aMap).forEach(([k, v]) => {
    const taxa_resolucao    = +((v.fin   / v.total) * 100).toFixed(1);
    const taxa_reincidencia = +((v.reinc / v.total) * 100).toFixed(1);
    const taxa_transferencia= +((v.transf/ v.total) * 100).toFixed(1);
    const tempo_atend_min   = v.tempo.length ? +(v.tempo.reduce((a,b)=>a+b,0)/v.tempo.length).toFixed(1) : 0;
    const score = Math.round(Math.max(0, Math.min(100, taxa_resolucao*0.4 - taxa_reincidencia*0.5 - taxa_transferencia*0.3 + 40)));
    const veredicto = score >= 65 ? "Manter" : score >= 40 ? "Treinar" : "Desligar";
    agentes[k] = { total: v.total, finalizados: v.fin, transferidos: v.transf, reincidentes: v.reinc,
                   tempo_atend_min, taxa_resolucao, taxa_reincidencia, taxa_transferencia, score, veredicto };
  });
  return { agentes, total_sac: rows.length };
}

function processAT(rows) {
  return { total_at: rows.length };
}

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════
const C = {
  bg:"#080C14", panel:"#0E1420", card:"#131B2E", border:"#1E2A40",
  text:"#E8EFF8", muted:"#5A6A85", accent:"#00C9A7",
  red:"#F05252", yellow:"#F4A429", orange:"#F97316",
  blue:"#3B82F6", purple:"#8B5CF6", green:"#10B981",
};
const PAL = [C.accent, C.blue, C.purple, C.orange, C.yellow, C.red, "#EC4899", "#84CC16"];

const shortName  = n => n.replace(/^\d+\.?\d*/, "").trim();
const vColor     = v => v === "Manter" ? C.green : v === "Treinar" ? C.yellow : C.red;
const flagColor  = f => f === "Elogio" ? C.green : f === "Alto Risco" ? C.red : f === "Atenção" ? C.orange : C.muted;
const flagIcon   = f => f === "Elogio" ? "⭐" : f === "Alto Risco" ? "🚨" : f === "Atenção" ? "⚠️" : "·";
const hColor     = h => h <= 25 ? C.red : h <= 50 ? C.orange : h <= 74 ? C.yellow : C.green;

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1A2235", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 13px", fontSize:12 }}>
      <div style={{ color:C.muted, marginBottom:3 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color||C.accent, fontWeight:600 }}>{p.name}: {typeof p.value==="number"?p.value.toLocaleString("pt-BR"):p.value}</div>)}
    </div>
  );
};
const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18, ...style }}>{children}</div>
);
const Chip = ({ children, color=C.accent }) => (
  <span style={{ background:color+"22", color, border:`1px solid ${color}55`, borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{children}</span>
);
const KPI = ({ label, value, sub, color=C.accent, icon }) => (
  <Card style={{ textAlign:"center" }}>
    {icon && <div style={{ fontSize:20, marginBottom:5 }}>{icon}</div>}
    <div style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>{label}</div>
    <div style={{ color, fontSize:26, fontWeight:800, fontFamily:"monospace" }}>{value}</div>
    {sub && <div style={{ color:C.muted, fontSize:10, marginTop:3 }}>{sub}</div>}
  </Card>
);
const ScorBar = ({ val, color, h=5 }) => (
  <div style={{ background:C.border, borderRadius:4, height:h, overflow:"hidden", width:"100%" }}>
    <div style={{ height:"100%", width:`${Math.min(100,val||0)}%`, background:color, borderRadius:4, transition:"width 0.4s" }} />
  </div>
);
const SecTitle = ({ children, color=C.accent }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
    <div style={{ width:3, height:16, background:color, borderRadius:2 }} />
    <h3 style={{ margin:0, color:C.text, fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{children}</h3>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// UPLOAD PANEL — 3 arquivos com status individual
// ═══════════════════════════════════════════════════════════════════
function UploadPanel({ nomes, onProcessed, onClose }) {
  const [files, setFiles]     = useState({ os: null, at: null, sac: null });
  const [status, setStatus]   = useState({ os:"idle", at:"idle", sac:"idle" });
  const [parsed, setParsed]   = useState({ os: null, at: null, sac: null });
  const [erro, setErro]       = useState({});
  const refs = { os: useRef(), at: useRef(), sac: useRef() };

  const SLOTS = [
    { key:"os",  label:"Relatório de OS",          icon:"🔧", accept:".xlsx,.xls", hint:"Relatorio-OS*.xlsx",           col: C.accent  },
    { key:"at",  label:"Relatório de Atendimento", icon:"📋", accept:".xlsx,.xls", hint:"relatorio-de-atendimento*.xlsx", col: C.blue    },
    { key:"sac", label:"Relatório SAC",            icon:"🎧", accept:".csv",        hint:"RELATORIO-SAC.csv",             col: C.purple  },
  ];

  const processFile = useCallback(async (key, file) => {
    setStatus(s => ({ ...s, [key]: "loading" }));
    setErro(e => ({ ...e, [key]: null }));
    try {
      if (key === "sac") {
        // CSV
        const text = await new Promise((res, rej) => {
          const fr = new FileReader();
          fr.onload  = e => res(e.target.result);
          fr.onerror = rej;
          fr.readAsText(file, "ISO-8859-1");
        });
        const lines  = text.split(/\r?\n/).filter(Boolean);
        const header = lines[0].split(";").map(h => h.trim().replace(/^"|"$/g,""));
        const rows   = lines.slice(1).map(l => {
          const vals = l.split(";").map(v => v.trim().replace(/^"|"$/g,""));
          return Object.fromEntries(header.map((h,i) => [h, vals[i] ?? ""]));
        });
        setParsed(p => ({ ...p, [key]: rows }));
      } else {
        // XLSX via SheetJS CDN
        const { read, utils } = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
        const buf  = await file.arrayBuffer();
        const wb   = read(buf);
        const rows = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        setParsed(p => ({ ...p, [key]: rows }));
      }
      setFiles(f  => ({ ...f, [key]: file.name }));
      setStatus(s => ({ ...s, [key]: "ok" }));
    } catch (e) {
      setErro(er  => ({ ...er, [key]: e.message }));
      setStatus(s => ({ ...s, [key]: "error" }));
    }
  }, []);

  const handleDrop = useCallback((key, e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) processFile(key, f);
  }, [processFile]);

  const allReady = status.os === "ok" && status.at === "ok" && status.sac === "ok";
  const anyReady = status.os === "ok" || status.at === "ok" || status.sac === "ok";

  const aplicar = () => {
    const os_data  = parsed.os  ? processOS(parsed.os)   : null;
    const sac_data = parsed.sac ? processSAC(parsed.sac) : null;
    const at_data  = parsed.at  ? processAT(parsed.at)   : null;

    const novos = {
      nomes: {
        os:  files.os  || nomes.os,
        at:  files.at  || nomes.at,
        sac: files.sac || nomes.sac,
      },
      agentes:  sac_data?.agentes || null,
      tecnicos: os_data?.tecnicos || null,
      clientes: os_data?.clientes || null,
      totais: {
        total_os:              os_data?.total_os  || BASE_TOTAIS.total_os,
        total_sac:             sac_data?.total_sac|| BASE_TOTAIS.total_sac,
        total_at:              at_data?.total_at  || BASE_TOTAIS.total_at,
        reinc_os:              os_data?.reinc_os  || BASE_TOTAIS.reinc_os,
        inconsistencias_diag:  os_data?.incons    || BASE_TOTAIS.inconsistencias_diag,
        clientes_alto_risco:   os_data?.clientes?.filter(c=>c.risco==="Alto").length || BASE_TOTAIS.clientes_alto_risco,
      },
    };
    salvarStorage(novos);
    onProcessed(novos);
    onClose();
  };

  const statusIcon = (s) => s === "ok" ? "✅" : s === "loading" ? "⏳" : s === "error" ? "❌" : "○";

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000ee", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={onClose}>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:18, width:"min(700px,100%)", padding:30, maxHeight:"92vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <div>
            <h2 style={{ margin:0, color:C.text, fontSize:18, fontWeight:800 }}>📂 Atualizar Dados</h2>
            <p style={{ margin:"4px 0 0", color:C.muted, fontSize:12 }}>Suba 1, 2 ou os 3 arquivos. O que não subir mantém os dados anteriores.</p>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer", borderRadius:8, padding:"6px 12px", fontSize:13 }}>✕</button>
        </div>

        {/* Arquivos já carregados */}
        {(nomes.os || nomes.at || nomes.sac) && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
            <div style={{ color:C.muted, fontSize:11, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>📌 Último carregamento salvo</div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {[["🔧 OS", nomes.os, C.accent],["📋 Atendimento", nomes.at, C.blue],["🎧 SAC", nomes.sac, C.purple]].map(([l,n,c]) => n && (
                <div key={l} style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ color:C.muted, fontSize:12, minWidth:110 }}>{l}</span>
                  <span style={{ color:c, fontSize:12, fontWeight:600 }}>{n}</span>
                  <span style={{ color:C.green, fontSize:11 }}>✓ em uso</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drop zones */}
        <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:22 }}>
          {SLOTS.map(({ key, label, icon, accept, hint, col }) => {
            const st = status[key];
            const isDone = st === "ok";
            return (
              <div key={key}>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(key, e)}
                  onClick={() => refs[key].current.click()}
                  style={{
                    border:`2px dashed ${isDone ? col : C.border}`,
                    borderRadius:12,
                    padding:"18px 20px",
                    cursor:"pointer",
                    display:"flex",
                    alignItems:"center",
                    gap:16,
                    background: isDone ? col+"0A" : "transparent",
                    transition:"all 0.2s",
                  }}>
                  <input ref={refs[key]} type="file" accept={accept} style={{ display:"none" }}
                    onChange={e => e.target.files[0] && processFile(key, e.target.files[0])} />
                  <div style={{ fontSize:26, flexShrink:0 }}>{icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:C.text, fontWeight:700, fontSize:13, marginBottom:2 }}>{label}</div>
                    <div style={{ color:C.muted, fontSize:11 }}>{hint} · {accept}</div>
                    {files[key] && <div style={{ color:col, fontSize:12, fontWeight:600, marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📄 {files[key]}</div>}
                    {erro[key]  && <div style={{ color:C.red, fontSize:11, marginTop:4 }}>⚠ {erro[key]}</div>}
                  </div>
                  <div style={{ fontSize:22, flexShrink:0 }}>{statusIcon(st)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão aplicar */}
        <div style={{ display:"flex", gap:10 }}>
          <button
            disabled={!anyReady}
            onClick={aplicar}
            style={{
              flex:1, background: anyReady ? C.accent : C.border,
              color: anyReady ? "#000" : C.muted,
              border:"none", borderRadius:10, padding:"12px 0", cursor: anyReady ? "pointer" : "default",
              fontWeight:800, fontSize:14, transition:"all 0.2s",
            }}>
            {allReady ? "✅ Aplicar os 3 Arquivos" : anyReady ? "⚡ Aplicar Arquivos Carregados" : "Carregue ao menos 1 arquivo"}
          </button>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:10, padding:"12px 20px", cursor:"pointer", fontWeight:600, fontSize:13 }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BOLETIM MODAL
// ═══════════════════════════════════════════════════════════════════
function Boletim({ tipo, nome, dados, onClose }) {
  const isAgente = tipo === "agente";
  const scolor   = vColor(dados.veredicto || dados.v);
  const radarData = isAgente ? [
    { m:"Resolução",   v: dados.taxa_resolucao },
    { m:"Sem Reinc.",  v: Math.max(0, 100 - dados.taxa_reincidencia * 2) },
    { m:"Eficiência",  v: Math.max(0, 100 - dados.taxa_transferencia * 2) },
    { m:"Tempo",       v: dados.tempo_atend_min > 0 ? Math.max(0, 100 - dados.tempo_atend_min * 2) : 80 },
    { m:"Volume",      v: Math.min(100, dados.total / 20) },
  ] : [
    { m:"Qualidade",   v: Math.max(0, 100 - dados.taxa_r * 5) },
    { m:"Volume",      v: Math.min(100, dados.os / 5) },
    { m:"Rapidez",     v: Math.max(0, 100 - dados.taxa_rap) },
    { m:"Desc. OK",    v: Math.max(0, 100 - dados.taxa_gen) },
    { m:"Sem Reinc.",  v: Math.max(0, 100 - dados.taxa_r * 6) },
  ];
  const resolvidos = isAgente ? dados.finalizados : dados.os - dados.reinc;
  const problemas  = isAgente ? dados.transferidos : dados.reinc;
  const ver = dados.veredicto || dados.v;

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000dd", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:18, width:"min(820px,100%)", maxHeight:"92vh", overflowY:"auto", padding:28 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <div style={{ display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ width:50, height:50, borderRadius:14, background:scolor+"20", border:`2px solid ${scolor}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
              {isAgente ? "🎧" : "🔧"}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:19, color:C.text }}>{isAgente ? nome : shortName(nome)}</div>
              <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>{isAgente ? "Agente SAC" : nome}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <Chip color={scolor}>{ver}</Chip>
            <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer", borderRadius:8, padding:"6px 12px", fontSize:12 }}>✕</button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
          {[
            { l:"Resolvidos",   v:resolvidos.toLocaleString("pt-BR"), c:C.green  },
            { l:isAgente?"Transf.":"Reinc.", v:problemas, c:C.red },
            { l:isAgente?"Chats":"OS",       v:(isAgente?dados.total:dados.os).toLocaleString("pt-BR"), c:C.accent },
            { l:"Score",        v:dados.score, c:scolor },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px", textAlign:"center" }}>
              <div style={{ color:C.muted, fontSize:10, marginBottom:4, textTransform:"uppercase" }}>{l}</div>
              <div style={{ color:c, fontSize:24, fontWeight:800, fontFamily:"monospace" }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
          <Card>
            <SecTitle color={C.blue}>Radar de Performance</SecTitle>
            <ResponsiveContainer width="100%" height={195}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={C.border} />
                <PolarAngleAxis dataKey="m" tick={{ fill:C.muted, fontSize:11 }} />
                <PolarRadiusAxis domain={[0,100]} tick={false} />
                <Radar dataKey="v" stroke={scolor} fill={scolor} fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SecTitle color={C.purple}>Indicadores</SecTitle>
            <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
              {(isAgente ? [
                { l:"Taxa Resolução",    v:dados.taxa_resolucao,    c:C.green  },
                { l:"Taxa Reincidência", v:dados.taxa_reincidencia, c:C.red    },
                { l:"Taxa Transferência",v:dados.taxa_transferencia,c:C.yellow },
              ] : [
                { l:"Taxa Reincidência", v:dados.taxa_r,   c:C.red    },
                { l:"OS Rápidas (<20min)",v:dados.taxa_rap, c:C.yellow },
                { l:"Desc. Genéricas",   v:dados.taxa_gen, c:C.orange },
              ]).map(({ l, v, c }) => (
                <div key={l}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ color:C.muted, fontSize:12 }}>{l}</span>
                    <span style={{ color:c, fontWeight:700, fontSize:12 }}>{v}%</span>
                  </div>
                  <ScorBar val={v} color={c} />
                </div>
              ))}
              {isAgente && dados.tempo_atend_min > 0 && (
                <div style={{ marginTop:6, padding:"9px 12px", background:C.panel, borderRadius:8 }}>
                  <span style={{ color:C.muted, fontSize:11 }}>Tempo médio atendimento: </span>
                  <span style={{ color:C.accent, fontWeight:700 }}>{dados.tempo_atend_min} min</span>
                </div>
              )}
              {!isAgente && <Chip color={flagColor(dados.flag)}>{flagIcon(dados.flag)} {dados.flag}</Chip>}
            </div>
          </Card>
        </div>

        <Card style={{ background:scolor+"0C", borderColor:scolor+"44" }}>
          <div style={{ fontWeight:700, color:scolor, fontSize:13, marginBottom:6 }}>📋 VEREDITO: {ver.toUpperCase()}</div>
          <div style={{ color:C.text, fontSize:13, lineHeight:1.65 }}>
            {ver === "Manter"   && `${isAgente?nome:shortName(nome)} demonstra performance consistente com os dados disponíveis. Mantenha o monitoramento padrão e considere reconhecimento se os resultados se sustentarem no próximo período.`}
            {ver === "Treinar"  && `${isAgente?nome:shortName(nome)} apresenta indicadores que necessitam atenção. Recomendamos treinamento focado em ${isAgente?"técnicas de resolução e redução de transferências":"diagnóstico técnico e documentação detalhada de chamados"}. Prazo de reavaliação: 30 dias.`}
            {ver === "Desligar" && `${isAgente?nome:shortName(nome)} apresenta indicadores críticos persistentes. Os dados frios indicam padrão de baixa qualidade. Recomenda-se reunião de feedback formal e, se não houver melhora em 15 dias, desligamento.`}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABAS
// ═══════════════════════════════════════════════════════════════════
function AbaSAC({ agentes, totais, onSelect }) {
  const list = Object.entries(agentes).sort((a,b) => b[1].score - a[1].score);
  const barData = list.map(([k,v]) => ({ nome:k.split(" ")[0], Resolvidos:v.finalizados, Transferidos:v.transferidos, Reincidentes:v.reincidentes }));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <KPI label="Total Chats SAC" value={totais.total_sac.toLocaleString("pt-BR")} icon="💬" color={C.accent} />
        <KPI label="Agentes" value={list.length} icon="👥" color={C.blue} />
        <KPI label="Total Reincidentes" value={list.reduce((a,[,v])=>a+v.reincidentes,0).toLocaleString("pt-BR")} icon="🔁" color={C.red} />
        <KPI label="Maior Tempo Atend." value={`${Math.max(...list.map(([,v])=>v.tempo_atend_min||0)).toFixed(1)} min`} icon="⏱" color={C.yellow} />
      </div>
      <Card>
        <SecTitle color={C.blue}>Distribuição por Agente</SecTitle>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={barData} margin={{ top:0, right:20, bottom:30, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="nome" tick={{ fill:C.muted, fontSize:11 }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fill:C.muted, fontSize:10 }} />
            <Tooltip content={<TT />} />
            <Bar dataKey="Resolvidos"   fill={C.green}  stackId="a" />
            <Bar dataKey="Transferidos" fill={C.yellow} stackId="a" />
            <Bar dataKey="Reincidentes" fill={C.red}    stackId="a" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:6 }}>
          {[["Resolvidos",C.green],["Transferidos",C.yellow],["Reincidentes",C.red]].map(([l,c]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.muted }}>
              <div style={{ width:9, height:9, borderRadius:2, background:c }} />{l}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SecTitle color={C.accent}>Ranking de Agentes — Clique para ver Boletim</SecTitle>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["Agente","Total","Resolvidos","Transf.","Reinc.%","Tempo","Score","Veredito",""].map(h => (
                  <th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, textAlign:"left", fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(([nome,v]) => (
                <tr key={nome}
                  style={{ borderBottom:`1px solid ${C.border}22`, cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background="#ffffff06"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}
                  onClick={() => onSelect("agente", nome, v)}>
                  <td style={{ padding:"10px", color:C.text, fontWeight:600 }}>{nome}</td>
                  <td style={{ padding:"10px", color:C.muted }}>{v.total.toLocaleString("pt-BR")}</td>
                  <td style={{ padding:"10px", color:C.green, fontWeight:600 }}>{v.finalizados.toLocaleString("pt-BR")}</td>
                  <td style={{ padding:"10px", color:C.yellow }}>{v.transferidos}</td>
                  <td style={{ padding:"10px" }}><Chip color={v.taxa_reincidencia>45?C.red:C.yellow}>{v.taxa_reincidencia}%</Chip></td>
                  <td style={{ padding:"10px", color:v.tempo_atend_min>15?C.orange:C.muted }}>{v.tempo_atend_min>0?`${v.tempo_atend_min}m`:"<1m"}</td>
                  <td style={{ padding:"10px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ flex:1, minWidth:45 }}><ScorBar val={v.score} color={vColor(v.veredicto)} /></div>
                      <span style={{ color:vColor(v.veredicto), fontWeight:700, fontSize:12, minWidth:22 }}>{v.score}</span>
                    </div>
                  </td>
                  <td style={{ padding:"10px" }}><Chip color={vColor(v.veredicto)}>{v.veredicto}</Chip></td>
                  <td style={{ padding:"10px", color:C.muted }}>›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AbaTecnicos({ tecnicos, totais, onSelect }) {
  const [filtro, setFiltro] = useState("Todos");
  const [sort, setSort]     = useState("score");
  let list = Object.entries(tecnicos).filter(([,v]) => v.os >= 3);
  if (filtro !== "Todos") list = list.filter(([,v]) => v.flag===filtro || v.v===filtro);
  list = list.sort((a,b) => sort==="score"?b[1].score-a[1].score:sort==="os"?b[1].os-a[1].os:b[1].taxa_r-a[1].taxa_r);
  const scatter = Object.entries(tecnicos).filter(([,v])=>v.os>=3).map(([k,v])=>({ nome:shortName(k).substring(0,16), x:v.os, y:v.taxa_r, z:v.score, verd:v.v }));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
        <KPI label="Total OS"      value={totais.total_os.toLocaleString("pt-BR")} icon="🔧" color={C.accent} />
        <KPI label="Reincidências" value={totais.reinc_os}       icon="🔁" color={C.red}    sub="OS tipo REINCIDÊNCIA" />
        <KPI label="Inconsistências" value={totais.inconsistencias_diag} icon="⚠️" color={C.orange} sub="diagnóstico × motivo" />
        <KPI label="Desligar"      value={Object.values(tecnicos).filter(v=>v.v==="Desligar").length} icon="🚨" color={C.red} />
        <KPI label="Elogio"        value={Object.values(tecnicos).filter(v=>v.flag==="Elogio").length} icon="⭐" color={C.green} />
      </div>
      <Card>
        <SecTitle color={C.orange}>Volume OS × Taxa de Reincidência</SecTitle>
        <div style={{ color:C.muted, fontSize:12, marginBottom:10 }}>Ideal: canto inferior direito. 🔴 Desligar · 🟡 Treinar · 🟢 Manter</div>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top:10, right:30, bottom:20, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="x" name="OS" tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Total OS", position:"insideBottom", offset:-10, fill:C.muted, fontSize:11 }} />
            <YAxis dataKey="y" name="Reinc%" tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Reinc.%", angle:-90, position:"insideLeft", fill:C.muted, fontSize:11 }} />
            <ZAxis dataKey="z" range={[30,350]} />
            <Tooltip cursor={false} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return <div style={{ background:"#1A2235", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 13px", fontSize:12 }}>
                <div style={{ color:C.accent, fontWeight:700 }}>{d?.nome}</div>
                <div style={{ color:C.muted }}>OS: {d?.x} | Reinc: {d?.y}% | Score: {d?.z}</div>
                <Chip color={vColor(d?.verd)}>{d?.verd}</Chip>
              </div>;
            }} />
            <Scatter data={scatter}>
              {scatter.map((d,i) => <Cell key={i} fill={vColor(d.verd)} fillOpacity={0.82} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:14 }}>
          <SecTitle color={C.accent}>Lista de Técnicos — Clique para Boletim</SecTitle>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {["Todos","Elogio","Atenção","Alto Risco","Manter","Treinar","Desligar"].map(f => {
              const fc = f==="Elogio"?C.green:f==="Alto Risco"?C.red:f==="Atenção"?C.orange:f==="Desligar"?C.red:f==="Treinar"?C.yellow:f==="Manter"?C.green:C.muted;
              return <button key={f} onClick={()=>setFiltro(f)} style={{ background:filtro===f?fc+"22":"transparent", color:filtro===f?fc:C.muted, border:`1px solid ${filtro===f?fc:C.border}`, borderRadius:6, padding:"4px 9px", cursor:"pointer", fontSize:11, fontWeight:600 }}>{f}</button>;
            })}
            <select value={sort} onChange={e=>setSort(e.target.value)} style={{ background:C.card, color:C.muted, border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px", fontSize:11 }}>
              <option value="score">↓ Score</option><option value="os">↓ OS</option><option value="reinc">↓ Reinc.</option>
            </select>
          </div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["Técnico","OS","Reinc.","Taxa R.","OS Rápidas","Desc.Gen.","Score","Status","Veredito",""].map(h=>(
                  <th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, textAlign:"left", fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(([nome,v])=>(
                <tr key={nome} style={{ borderBottom:`1px solid ${C.border}22`, cursor:"pointer" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#ffffff06"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  onClick={()=>onSelect("tecnico",nome,v)}>
                  <td style={{ padding:"10px", color:C.text, fontWeight:600 }}>{shortName(nome)}</td>
                  <td style={{ padding:"10px", color:C.accent, fontWeight:700 }}>{v.os}</td>
                  <td style={{ padding:"10px", color:C.red }}>{v.reinc}</td>
                  <td style={{ padding:"10px" }}><Chip color={v.taxa_r>8?C.red:v.taxa_r>4?C.orange:C.green}>{v.taxa_r}%</Chip></td>
                  <td style={{ padding:"10px", color:v.taxa_rap>40?C.yellow:C.muted }}>{v.taxa_rap}%</td>
                  <td style={{ padding:"10px", color:v.taxa_gen>25?C.orange:C.muted }}>{v.taxa_gen}%</td>
                  <td style={{ padding:"10px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ flex:1, minWidth:40 }}><ScorBar val={v.score} color={vColor(v.v)} /></div>
                      <span style={{ color:vColor(v.v), fontWeight:700, fontSize:12, minWidth:22 }}>{v.score}</span>
                    </div>
                  </td>
                  <td style={{ padding:"10px" }}><Chip color={flagColor(v.flag)}>{flagIcon(v.flag)} {v.flag}</Chip></td>
                  <td style={{ padding:"10px" }}><Chip color={vColor(v.v)}>{v.v}</Chip></td>
                  <td style={{ padding:"10px", color:C.muted }}>›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AbaClientes({ clientes, totais }) {
  const [filtro, setFiltro] = useState("Todos");
  const [busca,  setBusca]  = useState("");
  const lista = clientes.filter(c => (filtro==="Todos"||c.risco===filtro) && (!busca||c.nome.toLowerCase().includes(busca.toLowerCase())));
  const dist = [
    { name:"0-25 (Crítico)",   v:clientes.filter(c=>c.health<=25).length,              fill:C.red    },
    { name:"26-50 (Alto)",     v:clientes.filter(c=>c.health>25&&c.health<=50).length,  fill:C.orange },
    { name:"51-74 (Médio)",    v:clientes.filter(c=>c.health>50&&c.health<=74).length,  fill:C.yellow },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <KPI label="Clientes em Risco"  value={totais.clientes_alto_risco} icon="🩺" color={C.red}    sub="health ≤ 50" />
        <KPI label="Health Crítico"     value={clientes.filter(c=>c.health<=25).length} icon="🚨" color={C.red} />
        <KPI label="Para Refidelizar"   value={clientes.filter(c=>c.risco==="Alto").length} icon="🎯" color={C.orange} />
        <KPI label="Em Monitoramento"   value={clientes.filter(c=>c.risco==="Médio").length} icon="👀" color={C.yellow} />
      </div>
      <Card style={{ borderColor:C.blue+"44", background:C.blue+"07" }}>
        <SecTitle color={C.blue}>📊 Health Score — Metodologia</SecTitle>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          {[["🔴","-25","Por OS reincidente"],["🟠","-15","Lentidão/Sem Acesso não resolvido"],["🟡","-10","Espera SAC > 15 min"],["⚡","≤25","Retenção Urgente: VIP + Upgrade"],["🎯","26-50","Refidelização + Revisão Técnica"],["👀","51-74","Monitoramento Ativo"]].map(([ic,lb,ds])=>(
            <div key={lb} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ fontSize:16 }}>{ic}</span>
              <div><div style={{ color:C.text, fontWeight:700, fontSize:12 }}>{lb}</div><div style={{ color:C.muted, fontSize:11 }}>{ds}</div></div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SecTitle color={C.orange}>Distribuição por Faixa de Health</SecTitle>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={dist} margin={{ top:0, right:20, bottom:0, left:-10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fill:C.muted, fontSize:11 }} />
            <YAxis tick={{ fill:C.muted, fontSize:10 }} />
            <Tooltip content={<TT />} />
            <Bar dataKey="v" name="Clientes" radius={[4,4,0,0]}>
              {dist.map((d,i)=><Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:14 }}>
          <SecTitle color={C.red}>🚨 Clientes em Risco — Plano de Ação</SecTitle>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            <input placeholder="🔍 Buscar..." value={busca} onChange={e=>setBusca(e.target.value)}
              style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:7, padding:"5px 11px", color:C.text, fontSize:12, outline:"none", width:170 }} />
            {["Todos","Alto","Médio"].map(r=>(
              <button key={r} onClick={()=>setFiltro(r)} style={{ background:filtro===r?(r==="Alto"?C.red:r==="Médio"?C.yellow:C.accent)+"22":"transparent", color:filtro===r?(r==="Alto"?C.red:r==="Médio"?C.yellow:C.accent):C.muted, border:`1px solid ${filtro===r?(r==="Alto"?C.red:r==="Médio"?C.yellow:C.accent):C.border}`, borderRadius:6, padding:"5px 11px", cursor:"pointer", fontSize:11, fontWeight:600 }}>{r}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["Cliente","Cód.","OS","Reinc.","Health","Risco","Ação"].map(h=>(
                  <th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, textAlign:"left", fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((c,i)=>{
                const hc = hColor(c.health);
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.border}22` }}>
                    <td style={{ padding:"10px", color:C.text, fontWeight:600 }}>{c.nome}</td>
                    <td style={{ padding:"10px", color:C.muted, fontSize:11 }}>{c.codigo}</td>
                    <td style={{ padding:"10px", color:C.accent }}>{c.os}</td>
                    <td style={{ padding:"10px", color:C.red, fontWeight:700 }}>{c.reinc}</td>
                    <td style={{ padding:"10px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ flex:1, minWidth:55 }}><ScorBar val={c.health} color={hc} /></div>
                        <span style={{ color:hc, fontWeight:800, fontFamily:"monospace", minWidth:26 }}>{c.health}</span>
                      </div>
                    </td>
                    <td style={{ padding:"10px" }}><Chip color={c.risco==="Alto"?C.red:C.yellow}>{c.risco}</Chip></td>
                    <td style={{ padding:"10px", color:C.text, fontSize:12 }}>{c.acao}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AbaGestor({ agentes, tecnicos, onSelect }) {
  const [busca, setBusca] = useState("");
  const [tipo,  setTipo]  = useState("Todos");
  const ags  = Object.entries(agentes).map(([k,v])=>({ tipo:"agente",  nome:k, dados:v, score:v.score,  ver:v.veredicto }));
  const tecs = Object.entries(tecnicos).filter(([,v])=>v.os>=3).map(([k,v])=>({ tipo:"tecnico", nome:k, dados:v, score:v.score, ver:v.v }));
  const todos = [...ags,...tecs].filter(x=>(tipo==="Todos"||x.tipo===tipo||x.ver===tipo)&&(!busca||x.nome.toLowerCase().includes(busca.toLowerCase()))).sort((a,b)=>a.score-b.score);
  const desligar = todos.filter(x=>x.ver==="Desligar");

  const PersonCard = ({ x }) => {
    const vc = vColor(x.ver);
    return (
      <div onClick={()=>onSelect(x.tipo,x.nome,x.dados)}
        style={{ background:C.card, border:`1px solid ${vc}44`, borderRadius:10, padding:14, cursor:"pointer", transition:"transform 0.15s, border-color 0.2s" }}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=vc;}}
        onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=vc+"44";}}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
          <span style={{ fontSize:18 }}>{x.tipo==="agente"?"🎧":"🔧"}</span>
          <Chip color={vc}>{x.ver}</Chip>
        </div>
        <div style={{ fontWeight:700, color:C.text, fontSize:13, marginBottom:1 }}>{x.tipo==="agente"?x.nome:shortName(x.nome)}</div>
        <div style={{ color:C.muted, fontSize:10, marginBottom:9 }}>{x.tipo==="agente"?"Agente SAC":"Técnico Campo"}</div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
          <div><div style={{ color:C.accent, fontWeight:700 }}>{x.tipo==="agente"?x.dados.total:x.dados.os}</div><div style={{ color:C.muted, fontSize:9 }}>{x.tipo==="agente"?"chats":"OS"}</div></div>
          <div style={{ textAlign:"right" }}><div style={{ color:C.red, fontWeight:700 }}>{x.tipo==="agente"?x.dados.taxa_reincidencia+"%":x.dados.taxa_r+"%"}</div><div style={{ color:C.muted, fontSize:9 }}>reinc.</div></div>
          <div style={{ textAlign:"right" }}><div style={{ color:vc, fontWeight:700 }}>{x.score}</div><div style={{ color:C.muted, fontSize:9 }}>score</div></div>
        </div>
        <ScorBar val={x.score} color={vc} />
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <KPI label="Total Avaliados" value={ags.length+tecs.length} icon="👥" color={C.accent} />
        <KPI label="Desligar"        value={[...ags,...tecs].filter(x=>x.ver==="Desligar").length} icon="🚨" color={C.red} />
        <KPI label="Treinar"         value={[...ags,...tecs].filter(x=>x.ver==="Treinar").length}  icon="📚" color={C.yellow} />
        <KPI label="Manter"          value={[...ags,...tecs].filter(x=>x.ver==="Manter").length}   icon="⭐" color={C.green} />
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <input placeholder="🔍 Buscar por nome..." value={busca} onChange={e=>setBusca(e.target.value)}
          style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 13px", color:C.text, fontSize:13, outline:"none", width:220 }} />
        {["Todos","agente","tecnico","Manter","Treinar","Desligar"].map(t=>{
          const fc = t==="Desligar"?C.red:t==="Treinar"?C.yellow:t==="Manter"?C.green:C.accent;
          return <button key={t} onClick={()=>setTipo(t)} style={{ background:tipo===t?fc+"22":"transparent", color:tipo===t?fc:C.muted, border:`1px solid ${tipo===t?fc:C.border}`, borderRadius:7, padding:"6px 12px", cursor:"pointer", fontWeight:600, fontSize:11 }}>{t==="agente"?"🎧 SAC":t==="tecnico"?"🔧 Campo":t}</button>;
        })}
      </div>
      {desligar.length > 0 && busca==="" && (tipo==="Todos"||tipo==="Desligar") && (
        <Card style={{ borderColor:C.red+"55", background:C.red+"07" }}>
          <SecTitle color={C.red}>🚨 Indicados para Desligamento</SecTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:12 }}>
            {desligar.map((x,i) => <PersonCard key={i} x={x} />)}
          </div>
        </Card>
      )}
      <Card>
        <SecTitle color={C.accent}>Todos os Colaboradores — Clique para Boletim</SecTitle>
        {todos.length === 0 ? <div style={{ color:C.muted, textAlign:"center", padding:"35px 0" }}>Nenhum resultado.</div> : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:10 }}>
            {todos.map((x,i) => <PersonCard key={i} x={x} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [aba,          setAba]          = useState("sac");
  const [showUpload,   setShowUpload]   = useState(false);
  const [boletim,      setBoletim]      = useState(null);
  const [loading,      setLoading]      = useState(true);

  // dados vivos (pode ser substituído pelo upload)
  const [agentes,  setAgentes]  = useState(BASE_AGENTES);
  const [tecnicos, setTecnicos] = useState(BASE_TECNICOS);
  const [clientes, setClientes] = useState(BASE_CLIENTES);
  const [totais,   setTotais]   = useState(BASE_TOTAIS);
  const [nomes,    setNomes]    = useState({ os: "Relatorio-OS1ate5-3.xlsx", at: "relatorio-de-atendimentook.xlsx", sac: "RELATORIO-SAC.csv" });
  const [loadedAt, setLoadedAt] = useState(null);

  // Tenta recuperar do storage ao iniciar
  useEffect(() => {
    carregarStorage().then(saved => {
      if (saved) {
        if (saved.agentes)  setAgentes(saved.agentes);
        if (saved.tecnicos) setTecnicos(saved.tecnicos);
        if (saved.clientes) setClientes(saved.clientes);
        if (saved.totais)   setTotais(saved.totais);
        if (saved.nomes)    setNomes(saved.nomes);
        if (saved.timestamp) setLoadedAt(new Date(saved.timestamp).toLocaleString("pt-BR"));
      }
      setLoading(false);
    });
  }, []);

  const aplicarNovos = useCallback((novos) => {
    if (novos.agentes)  setAgentes(novos.agentes);
    if (novos.tecnicos) setTecnicos(novos.tecnicos);
    if (novos.clientes) setClientes(novos.clientes);
    if (novos.totais)   setTotais(novos.totais);
    if (novos.nomes)    setNomes(novos.nomes);
    setLoadedAt(new Date().toLocaleString("pt-BR"));
  }, []);

  const TABS = [
    { k:"sac",      l:"🎧 Auditoria SAC"     },
    { k:"campo",    l:"🔧 Qualidade Técnica"  },
    { k:"clientes", l:"🩺 Saúde do Cliente"   },
    { k:"gestor",   l:"⚖️ Gestor Justo"       },
  ];

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:C.muted, fontSize:14 }}>⏳ Carregando dados salvos…</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* TOP BAR */}
      <div style={{ background:C.panel, borderBottom:`1px solid ${C.border}`, padding:"14px 26px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div>
          <h1 style={{ margin:0, fontSize:19, fontWeight:800, letterSpacing:"-0.02em" }}>
            <span style={{ color:C.accent }}>▸</span> Nuvyon — Inteligência Operacional
          </h1>
          <p style={{ margin:"3px 0 0", color:C.muted, fontSize:11 }}>
            OS: <span style={{ color:C.accent }}>{totais.total_os.toLocaleString("pt-BR")}</span> ·
            SAC: <span style={{ color:C.purple }}>{totais.total_sac.toLocaleString("pt-BR")}</span> ·
            Atend.: <span style={{ color:C.blue }}>{totais.total_at.toLocaleString("pt-BR")}</span>
            {loadedAt && <span style={{ color:C.muted }}> · Atualizado: {loadedAt}</span>}
          </p>
        </div>

        {/* STATUS DAS FONTES + BOTÃO UPLOAD */}
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          {[["🔧", nomes.os, C.accent], ["📋", nomes.at, C.blue], ["🎧", nomes.sac, C.purple]].map(([ic, n, c]) => (
            <div key={ic} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 10px", display:"flex", gap:5, alignItems:"center" }}>
              <span style={{ fontSize:13 }}>{ic}</span>
              <span style={{ color:n?c:C.muted, fontSize:11, fontWeight:600, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {n || "não carregado"}
              </span>
            </div>
          ))}
          <button
            onClick={() => setShowUpload(true)}
            style={{ background:C.accent, color:"#000", border:"none", borderRadius:9, padding:"9px 18px", cursor:"pointer", fontWeight:800, fontSize:12, display:"flex", gap:6, alignItems:"center" }}>
            ⬆ Atualizar Dados
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background:C.panel, borderBottom:`1px solid ${C.border}`, padding:"0 26px", display:"flex", gap:2, overflowX:"auto" }}>
        {TABS.map(({ k, l }) => (
          <button key={k} onClick={() => setAba(k)} style={{
            background:"transparent", color:aba===k?C.accent:C.muted,
            border:"none", borderBottom:`2px solid ${aba===k?C.accent:"transparent"}`,
            padding:"13px 18px", cursor:"pointer", fontWeight:aba===k?700:500, fontSize:13,
            whiteSpace:"nowrap", transition:"all 0.2s",
          }}>{l}</button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding:"22px 26px", maxWidth:1200, margin:"0 auto" }}>
        {aba === "sac"      && <AbaSAC      agentes={agentes} totais={totais} onSelect={(t,n,d) => setBoletim({t,n,d})} />}
        {aba === "campo"    && <AbaTecnicos tecnicos={tecnicos} totais={totais} onSelect={(t,n,d) => setBoletim({t,n,d})} />}
        {aba === "clientes" && <AbaClientes clientes={clientes} totais={totais} />}
        {aba === "gestor"   && <AbaGestor   agentes={agentes} tecnicos={tecnicos} onSelect={(t,n,d) => setBoletim({t,n,d})} />}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop:`1px solid ${C.border}`, padding:"18px 26px 28px" }}>
        {/* fórmulas */}
        <div style={{ textAlign:"center", color:C.muted, fontSize:10, marginBottom:18 }}>
          Score Técnico = 100 − reinc×4 − gen×0.5 − rápidas×0.3 · Score SAC = resolução×0.4 − reinc×0.5 − transf×0.3 + 40 · Health = 100 − 25×reinc.OS
        </div>

        {/* crédito */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14,
                      background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
                      padding:"12px 22px", maxWidth:420, margin:"0 auto" }}>
          <img
            src={new URL('./logo-eric.png', import.meta.url).href}
            alt="Eric Jonas Engenheiro"
            style={{ width:48, height:48, objectFit:"contain", borderRadius:8, flexShrink:0 }}
          />
          <div>
            <div style={{ color:C.accent, fontWeight:800, fontSize:13, letterSpacing:"0.03em" }}>
              Site desenvolvido por Eng. Eric Jonas
            </div>
            <a href="mailto:erj.informatica@gmail.com"
               style={{ color:C.muted, fontSize:11, textDecoration:"none", transition:"color 0.2s" }}
               onMouseEnter={e => e.target.style.color = C.accent}
               onMouseLeave={e => e.target.style.color = C.muted}>
              ✉ erj.informatica@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {showUpload && (
        <UploadPanel nomes={nomes} onProcessed={aplicarNovos} onClose={() => setShowUpload(false)} />
      )}

      {/* BOLETIM MODAL */}
      {boletim && (
        <Boletim tipo={boletim.t} nome={boletim.n} dados={boletim.d} onClose={() => setBoletim(null)} />
      )}
    </div>
  );
}
