import { useState, useEffect, useMemo } from 'react'

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const GOV_TYPES = ["SSS","PhilHealth","Pag-IBIG","BIR Income Tax","BIR VAT","BIR Percentage Tax","BIR DST","Other Gov't"]
const STORE_TYPES = ["Cost of Sales","Shipping Fee","Office Supplies","Utilities","Repairs & Maintenance","Advertising","Meals & Entertainment","Transportation","Professional Fees","Bank Charges","Miscellaneous"]
const ENTITIES = ["Oniisan","Limjoe","Both"]
const TABS = ["Dashboard","Gov't & Mandatory","Rental","Salaries","Store Expenses","VAT Register","All Entries","Settings"]

const fmt = (n) => "₱" + Number(n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtDate = (d) => { if(!d) return ""; const [y,m,da]=d.split("-"); return `${MONTHS[parseInt(m)-1]?.slice(0,3)} ${da}, ${y}` }
const today = () => new Date().toISOString().slice(0,10)
const curYr = new Date().getFullYear()

const s = {
  page: { minHeight:'100vh', background:'#f5f5f3', padding:'0' },
  header: { background:'#fff', borderBottom:'0.5px solid #e5e5e0', padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  container: { maxWidth:960, margin:'0 auto', padding:'20px 16px' },
  card: { background:'#fff', border:'0.5px solid #e5e5e0', borderRadius:12, padding:'16px 20px', marginBottom:12 },
  tabs: { display:'flex', gap:0, borderBottom:'0.5px solid #e5e5e0', marginBottom:20, overflowX:'auto', background:'#fff', padding:'0 24px' },
  tab: (active) => ({ padding:'10px 14px', border:'none', background:'none', cursor:'pointer', fontSize:13, fontWeight:active?600:400, color:active?'#185FA5':'#666', borderBottom:active?'2px solid #185FA5':'2px solid transparent', whiteSpace:'nowrap' }),
  input: { border:'0.5px solid #d5d5d0', borderRadius:6, padding:'7px 10px', fontSize:13, outline:'none', width:'100%', background:'#fff' },
  label: { fontSize:11, fontWeight:600, color:'#555', marginBottom:3, display:'block' },
  btn: (primary,danger) => ({ border:`0.5px solid ${danger?'#e2a0a0':primary?'#185FA5':'#ccc'}`, borderRadius:6, padding:'7px 16px', fontSize:13, cursor:'pointer', background:primary?'#185FA5':'transparent', color:primary?'#fff':danger?'#A32D2D':'#333', fontWeight:primary?600:400 }),
  formGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:10, marginBottom:10 },
  metric: { background:'#f9f9f8', border:'0.5px solid #e5e5e0', borderRadius:8, padding:'12px 14px' },
  badge: (cat) => {
    const map = { gov:{bg:'#E6F1FB',color:'#0C447C'}, rental:{bg:'#EAF3DE',color:'#3B6D11'}, salary:{bg:'#FAEEDA',color:'#854F0B'}, store:{bg:'#FBEAF0',color:'#993556'} }
    const c = map[cat]||{bg:'#eee',color:'#333'}
    return { background:c.bg, color:c.color, borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600 }
  }
}

const catLabel = (c) => ({gov:"Gov't",rental:"Rental",salary:"Salary",store:"Store"}[c]||c)

function FGroup({ label, children }) {
  return <div style={{display:'flex',flexDirection:'column',gap:3}}><label style={s.label}>{label}</label>{children}</div>
}

function Metric({ label, value, accent, danger }) {
  return (
    <div style={s.metric}>
      <div style={{fontSize:11,color:'#888',marginBottom:4}}>{label}</div>
      <div style={{fontSize:20,fontWeight:600,color:danger?'#C0392B':accent?'#185FA5':'#1a1a1a'}}>{value}</div>
    </div>
  )
}

function Table({ headers, rows, empty }) {
  if (!rows || rows.length===0) return <div style={{textAlign:'center',padding:'24px',color:'#aaa',fontSize:13}}>{empty||"No entries yet."}</div>
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead><tr>{headers.map((h,i)=><th key={i} style={{textAlign:h.right?'right':'left',padding:'8px 10px',borderBottom:'0.5px solid #e5e5e0',color:'#777',fontWeight:500,fontSize:11,whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  )
}

// ── PIN Login Screen ──────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleKey = (k) => {
    if (k==='del') { setPin(p=>p.slice(0,-1)); setError(''); return }
    if (pin.length>=6) return
    const newPin = pin+k
    setPin(newPin)
    if (newPin.length>=4) tryLogin(newPin)
  }

  const tryLogin = async (p) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'verify',pin:p}) })
      const data = await res.json()
      if (res.ok) { onLogin(data.user) }
      else { setError('Mali ang PIN. Subukan ulit.'); setPin('') }
    } catch { setError('Connection error. Try again.') }
    setLoading(false)
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f3',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 32px',textAlign:'center',width:320,border:'0.5px solid #e5e5e0'}}>
        <div style={{fontSize:11,fontWeight:700,color:'#185FA5',letterSpacing:1,marginBottom:6}}>ONIISAN · LIMJOE</div>
        <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Expense Tracker</div>
        <div style={{fontSize:12,color:'#888',marginBottom:28}}>Admin Access Only</div>

        <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:24}}>
          {[0,1,2,3,4,5].map(i=>(
            <div key={i} style={{width:12,height:12,borderRadius:'50%',background:i<pin.length?'#185FA5':'#e5e5e0',transition:'background 0.15s'}} />
          ))}
        </div>

        {error && <div style={{fontSize:12,color:'#A32D2D',marginBottom:12,background:'#FCEBEB',padding:'6px 12px',borderRadius:6}}>{error}</div>}

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:8}}>
          {keys.map((k,i)=>(
            <button key={i} onClick={()=>k&&handleKey(k)} disabled={loading} style={{
              padding:'16px',fontSize:k==='del'?13:18,fontWeight:k==='del'?400:500,border:'0.5px solid #e5e5e0',borderRadius:10,background:k?'#fff':'transparent',cursor:k?'pointer':'default',color:k==='del'?'#666':'#1a1a1a',transition:'background 0.1s'
            }}>{k==='del'?'⌫':k}</button>
          ))}
        </div>
        {loading && <div style={{fontSize:12,color:'#888',marginTop:8}}>Checking…</div>}
      </div>
    </div>
  )
}

// ── Settings Page ─────────────────────────────────────────────────────────────
function SettingsPage({ currentUser }) {
  const [users, setUsers] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({username:'',pin:'',confirmPin:''})
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth').then(r=>r.json()).then(setUsers)
  }, [])

  const startEdit = (u) => { setEditing(u.id); setForm({username:u.username,pin:'',confirmPin:''}); setMsg('') }

  const save = async () => {
    if (form.pin !== form.confirmPin) return setMsg('Hindi magkatugma ang PIN!')
    if (form.pin.length < 4) return setMsg('Minimum 4 digits ang PIN.')
    setLoading(true)
    const res = await fetch('/api/auth', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:editing,pin:form.pin,username:form.username}) })
    if (res.ok) { setMsg('✓ Saved!'); setEditing(null); fetch('/api/auth').then(r=>r.json()).then(setUsers) }
    else setMsg('Error saving.')
    setLoading(false)
  }

  return (
    <div>
      <h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>Settings — Admin Users & PINs</h3>
      <div style={s.card}>
        <div style={{fontSize:12,color:'#888',marginBottom:16}}>Mag-click ng Edit para baguhin ang username o PIN ng bawat admin user.</div>
        {users.map(u=>(
          <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'0.5px solid #f0f0ee'}}>
            <div>
              <div style={{fontWeight:600}}>{u.username}</div>
              <div style={{fontSize:12,color:'#888'}}>PIN: ••••••</div>
            </div>
            <button style={s.btn(false,false)} onClick={()=>startEdit(u)}>Edit</button>
          </div>
        ))}
      </div>

      {editing && (
        <div style={s.card}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Edit Admin User</div>
          <div style={s.formGrid}>
            <FGroup label="Username">
              <input style={s.input} value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} />
            </FGroup>
            <FGroup label="Bagong PIN (min 4 digits)">
              <input style={s.input} type="password" value={form.pin} onChange={e=>setForm(p=>({...p,pin:e.target.value}))} placeholder="Bagong PIN" maxLength={6} />
            </FGroup>
            <FGroup label="Confirm PIN">
              <input style={s.input} type="password" value={form.confirmPin} onChange={e=>setForm(p=>({...p,confirmPin:e.target.value}))} placeholder="Ulitin ang PIN" maxLength={6} />
            </FGroup>
          </div>
          {msg && <div style={{fontSize:12,color:msg.startsWith('✓')?'#3B6D11':'#A32D2D',marginBottom:8}}>{msg}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button style={s.btn(false,false)} onClick={()=>setEditing(null)}>Cancel</button>
            <button style={s.btn(true,false)} onClick={save} disabled={loading}>Save PIN</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Forms ─────────────────────────────────────────────────────────────────────
function GovtForm({ onAdd }) {
  const [f, setF] = useState({date:today(),type:GOV_TYPES[0],entity:ENTITIES[0],ref:'',amount:'',period:'',remarks:''})
  const set = (k,v) => setF(p=>({...p,[k]:v}))
  const save = async () => {
    if (!f.amount) return alert('Enter an amount.')
    await onAdd({...f, category:'gov', amount:Number(f.amount)})
    setF(p=>({...p,ref:'',amount:'',period:'',remarks:''}))
  }
  return (
    <div style={s.card}>
      <div style={{fontSize:12,color:'#888',marginBottom:10}}>SSS, PhilHealth, Pag-IBIG, BIR taxes and other mandatory payments</div>
      <div style={s.formGrid}>
        <FGroup label="Date"><input style={s.input} type="date" value={f.date} onChange={e=>set('date',e.target.value)} /></FGroup>
        <FGroup label="Type"><select style={s.input} value={f.type} onChange={e=>set('type',e.target.value)}>{GOV_TYPES.map(t=><option key={t}>{t}</option>)}</select></FGroup>
        <FGroup label="Entity"><select style={s.input} value={f.entity} onChange={e=>set('entity',e.target.value)}>{ENTITIES.map(e=><option key={e}>{e}</option>)}</select></FGroup>
        <FGroup label="Reference / OR No."><input style={s.input} value={f.ref} onChange={e=>set('ref',e.target.value)} placeholder="e.g. BIR-2025-001" /></FGroup>
        <FGroup label="Amount (₱)"><input style={s.input} type="number" value={f.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00" /></FGroup>
        <FGroup label="Period Covered"><input style={s.input} type="month" value={f.period} onChange={e=>set('period',e.target.value)} /></FGroup>
      </div>
      <FGroup label="Remarks"><input style={{...s.input,marginBottom:10}} value={f.remarks} onChange={e=>set('remarks',e.target.value)} placeholder="Optional notes" /></FGroup>
      <div style={{display:'flex',justifyContent:'flex-end'}}><button style={s.btn(true)} onClick={save}>+ Add Entry</button></div>
    </div>
  )
}

function RentalForm({ onAdd }) {
  const [f, setF] = useState({date:today(),entity:ENTITIES[0],orNumber:'',lessor:'',amount:'',vatAmount:'',period:''})
  const set = (k,v) => setF(p=>({...p,[k]:v}))
  const save = async () => {
    if (!f.amount) return alert('Enter an amount.')
    await onAdd({...f, category:'rental', type:'Monthly Rent', supplier:f.lessor, base_amount:Number(f.amount), amount:Number(f.amount), vat_amount:Number(f.vatAmount)||null, or_number:f.orNumber})
    setF(p=>({...p,orNumber:'',lessor:'',amount:'',vatAmount:'',period:''}))
  }
  return (
    <div style={s.card}>
      <div style={s.formGrid}>
        <FGroup label="Date Paid"><input style={s.input} type="date" value={f.date} onChange={e=>set('date',e.target.value)} /></FGroup>
        <FGroup label="Entity"><select style={s.input} value={f.entity} onChange={e=>set('entity',e.target.value)}>{ENTITIES.map(e=><option key={e}>{e}</option>)}</select></FGroup>
        <FGroup label="OR Number"><input style={s.input} value={f.orNumber} onChange={e=>set('orNumber',e.target.value)} placeholder="OR No." /></FGroup>
        <FGroup label="Lessor / Supplier"><input style={s.input} value={f.lessor} onChange={e=>set('lessor',e.target.value)} placeholder="Lessor name" /></FGroup>
        <FGroup label="Monthly Rent (₱)"><input style={s.input} type="number" value={f.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00" /></FGroup>
        <FGroup label="Period Covered"><input style={s.input} type="month" value={f.period} onChange={e=>set('period',e.target.value)} /></FGroup>
        <FGroup label="VAT Charged (₱)"><input style={s.input} type="number" value={f.vatAmount} onChange={e=>set('vatAmount',e.target.value)} placeholder="0.00" /></FGroup>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end'}}><button style={s.btn(true)} onClick={save}>+ Add Entry</button></div>
    </div>
  )
}

function SalaryForm({ onAdd }) {
  const [f, setF] = useState({date:today(),entity:ENTITIES[0],name:'',position:'',basic:'',sss:'',ph:'',pi:'',wt:'',net:'',period:''})
  const set = (k,v) => setF(p=>({...p,[k]:v}))
  const save = async () => {
    if (!f.basic) return alert('Enter basic pay.')
    await onAdd({...f, category:'salary', basic:Number(f.basic), sss:Number(f.sss), ph:Number(f.ph), pi:Number(f.pi), wt:Number(f.wt), amount:Number(f.net)||Number(f.basic)})
    setF(p=>({...p,name:'',position:'',basic:'',sss:'',ph:'',pi:'',wt:'',net:'',period:''}))
  }
  return (
    <div style={s.card}>
      <div style={s.formGrid}>
        <FGroup label="Pay Date"><input style={s.input} type="date" value={f.date} onChange={e=>set('date',e.target.value)} /></FGroup>
        <FGroup label="Entity"><select style={s.input} value={f.entity} onChange={e=>set('entity',e.target.value)}>{ENTITIES.map(e=><option key={e}>{e}</option>)}</select></FGroup>
        <FGroup label="Employee Name"><input style={s.input} value={f.name} onChange={e=>set('name',e.target.value)} placeholder="Full name" /></FGroup>
        <FGroup label="Position"><input style={s.input} value={f.position} onChange={e=>set('position',e.target.value)} placeholder="Position/role" /></FGroup>
        <FGroup label="Basic Pay (₱)"><input style={s.input} type="number" value={f.basic} onChange={e=>set('basic',e.target.value)} placeholder="0.00" /></FGroup>
        <FGroup label="SSS Deduction (₱)"><input style={s.input} type="number" value={f.sss} onChange={e=>set('sss',e.target.value)} placeholder="0.00" /></FGroup>
        <FGroup label="PhilHealth (₱)"><input style={s.input} type="number" value={f.ph} onChange={e=>set('ph',e.target.value)} placeholder="0.00" /></FGroup>
        <FGroup label="Pag-IBIG (₱)"><input style={s.input} type="number" value={f.pi} onChange={e=>set('pi',e.target.value)} placeholder="0.00" /></FGroup>
        <FGroup label="Withholding Tax (₱)"><input style={s.input} type="number" value={f.wt} onChange={e=>set('wt',e.target.value)} placeholder="0.00" /></FGroup>
        <FGroup label="Net Pay (₱)"><input style={s.input} type="number" value={f.net} onChange={e=>set('net',e.target.value)} placeholder="0.00" /></FGroup>
        <FGroup label="Pay Period"><input style={s.input} type="month" value={f.period} onChange={e=>set('period',e.target.value)} /></FGroup>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end'}}><button style={s.btn(true)} onClick={save}>+ Add Entry</button></div>
    </div>
  )
}

function StoreForm({ onAdd }) {
  const [f, setF] = useState({date:today(),type:STORE_TYPES[0],entity:ENTITIES[0],supplier:'',orNumber:'',tin:'',base:'',vat:'',total:'',desc:''})
  const set = (k,v) => setF(p=>({...p,[k]:v}))
  const handleBase = (v) => {
    const base = parseFloat(v)||0
    const vat = parseFloat((base*0.12).toFixed(2))
    const total = parseFloat((base+vat).toFixed(2))
    setF(p=>({...p,base:v,vat:vat||'',total:total||''}))
  }
  const save = async () => {
    const base = Number(f.base), total = Number(f.total)||base
    if (!base&&!total) return alert('Enter an amount.')
    await onAdd({...f, category:'store', base_amount:base, vat_amount:Number(f.vat)||null, amount:total||base, or_number:f.orNumber, desc_text:f.desc})
    setF(p=>({...p,supplier:'',orNumber:'',tin:'',base:'',vat:'',total:'',desc:''}))
  }
  return (
    <div style={s.card}>
      <div style={s.formGrid}>
        <FGroup label="Date"><input style={s.input} type="date" value={f.date} onChange={e=>set('date',e.target.value)} /></FGroup>
        <FGroup label="Expense Type"><select style={s.input} value={f.type} onChange={e=>set('type',e.target.value)}>{STORE_TYPES.map(t=><option key={t}>{t}</option>)}</select></FGroup>
        <FGroup label="Entity"><select style={s.input} value={f.entity} onChange={e=>set('entity',e.target.value)}>{ENTITIES.map(e=><option key={e}>{e}</option>)}</select></FGroup>
        <FGroup label="Supplier Name"><input style={s.input} value={f.supplier} onChange={e=>set('supplier',e.target.value)} placeholder="Supplier / vendor" /></FGroup>
        <FGroup label="OR Number"><input style={s.input} value={f.orNumber} onChange={e=>set('orNumber',e.target.value)} placeholder="OR No." /></FGroup>
        <FGroup label="TIN of Supplier"><input style={s.input} value={f.tin} onChange={e=>set('tin',e.target.value)} placeholder="000-000-000" /></FGroup>
        <FGroup label="Amount before VAT (₱)"><input style={s.input} type="number" value={f.base} onChange={e=>handleBase(e.target.value)} placeholder="0.00" /></FGroup>
        <FGroup label="Input VAT 12% (₱)"><input style={s.input} type="number" value={f.vat} onChange={e=>set('vat',e.target.value)} placeholder="Auto-computed" /></FGroup>
        <FGroup label="Total Amount (₱)"><input style={s.input} type="number" value={f.total} onChange={e=>set('total',e.target.value)} placeholder="Auto-computed" /></FGroup>
      </div>
      <FGroup label="Description / particulars"><input style={{...s.input,marginBottom:10}} value={f.desc} onChange={e=>set('desc',e.target.value)} placeholder="Brief description" /></FGroup>
      <div style={{display:'flex',justifyContent:'flex-end'}}><button style={s.btn(true)} onClick={save}>+ Add Entry</button></div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState(0)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterEntity, setFilterEntity] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (user) loadEntries()
  }, [user])

  const loadEntries = async () => {
    setLoading(true)
    const res = await fetch('/api/expenses')
    const data = await res.json()
    setEntries(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const handleLogin = (u) => {
    sessionStorage.setItem('admin_user', JSON.stringify(u))
    setUser(u)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_user')
    setUser(null)
  }

  const addEntry = async (entry) => {
    const res = await fetch('/api/expenses', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(entry) })
    const data = await res.json()
    if (data.id) setEntries(prev => [data, ...prev])
  }

  const delEntry = async (id) => {
    if (!confirm('Delete this entry?')) return
    await fetch(`/api/expenses?id=${id}`, { method:'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const filtered = useMemo(() => entries.filter(e => {
    const mOk = !filterMonth || e.date?.startsWith(filterMonth)
    const enOk = !filterEntity || e.entity === filterEntity || e.entity === 'Both'
    return mOk && enOk
  }), [entries, filterMonth, filterEntity])

  const sum = (cat, arr=filtered) => arr.filter(e=>e.category===cat).reduce((s,e)=>s+Number(e.amount||0),0)
  const vatEntries = filtered.filter(e=>e.vat_amount&&Number(e.vat_amount)>0)
  const totalVAT = vatEntries.reduce((s,e)=>s+Number(e.vat_amount||0),0)

  if (!user) return <LoginScreen onLogin={handleLogin} />

  const FilterBar = () => (
    <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
      <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{...s.input,width:'auto',minWidth:150}}>
        <option value="">All months</option>
        {MONTHS.map((m,i)=>{ const v=`${curYr}-${String(i+1).padStart(2,'0')}`; return <option key={v} value={v}>{m} {curYr}</option> })}
      </select>
      <select value={filterEntity} onChange={e=>setFilterEntity(e.target.value)} style={{...s.input,width:'auto',minWidth:130}}>
        <option value="">All entities</option>
        {ENTITIES.map(en=><option key={en}>{en}</option>)}
      </select>
      {(filterMonth||filterEntity) && <button style={s.btn(false,false)} onClick={()=>{setFilterMonth('');setFilterEntity('')}}>Clear</button>}
    </div>
  )

  const TD = ({children,right,mono,muted,bold,accent,danger}) => (
    <td style={{padding:'8px 10px',borderBottom:'0.5px solid #f0f0ee',textAlign:right?'right':'left',fontFamily:mono?'monospace':undefined,fontSize:mono?12:13,color:muted?'#888':accent?'#185FA5':danger?'#A32D2D':'#1a1a1a',fontWeight:bold?600:400,verticalAlign:'middle'}}>{children}</td>
  )

  const pages = [
    // Dashboard
    () => (
      <div>
        <h3 style={{fontSize:16,fontWeight:600,marginBottom:12}}>Summary</h3>
        <FilterBar />
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:20}}>
          <Metric label="Total Expenses" value={fmt(sum('gov')+sum('rental')+sum('salary')+sum('store'))} danger />
          <Metric label="Gov't & Mandatory" value={fmt(sum('gov'))} />
          <Metric label="Rental" value={fmt(sum('rental'))} />
          <Metric label="Salaries" value={fmt(sum('salary'))} />
          <Metric label="Store Expenses" value={fmt(sum('store'))} />
          <Metric label="Input VAT (total)" value={fmt(totalVAT)} accent />
        </div>
        <div style={s.card}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>Recent entries</div>
          {loading ? <div style={{textAlign:'center',padding:20,color:'#888'}}>Loading…</div> :
          <Table headers={['Date','Category','Description','Entity',{label:'Amount',right:true}]}
            empty="No entries yet."
            rows={filtered.slice(0,15).map(e=>(
              <tr key={e.id}>
                <TD>{fmtDate(e.date)}</TD>
                <TD><span style={s.badge(e.category)}>{catLabel(e.category)}</span></TD>
                <TD>{e.type||e.name||e.desc_text||'—'}</TD>
                <TD muted>{e.entity}</TD>
                <TD right bold>{fmt(e.amount)}</TD>
              </tr>
            ))} />}
        </div>
      </div>
    ),
    // Govt
    () => (
      <div>
        <h3 style={{fontSize:16,fontWeight:600,marginBottom:12}}>Government & Mandatory Contributions</h3>
        <GovtForm onAdd={addEntry} />
        <FilterBar />
        <div style={s.card}>
          <Table headers={['Date','Type','OR / Ref','Entity','Period',{label:'Amount',right:true},'Remarks','']}
            rows={filtered.filter(e=>e.category==='gov').map(e=>(
              <tr key={e.id}>
                <TD>{fmtDate(e.date)}</TD>
                <TD>{e.type}</TD>
                <TD mono>{e.ref||'—'}</TD>
                <TD muted>{e.entity}</TD>
                <TD muted>{e.period||'—'}</TD>
                <TD right bold>{fmt(e.amount)}</TD>
                <TD muted>{e.remarks||'—'}</TD>
                <td style={{padding:'4px 8px'}}><button style={s.btn(false,true)} onClick={()=>delEntry(e.id)}>✕</button></td>
              </tr>
            ))} />
        </div>
      </div>
    ),
    // Rental
    () => (
      <div>
        <h3 style={{fontSize:16,fontWeight:600,marginBottom:12}}>Monthly Rental</h3>
        <RentalForm onAdd={addEntry} />
        <FilterBar />
        <div style={s.card}>
          <Table headers={['Date','OR No.','Lessor','Entity','Period',{label:'Rent',right:true},{label:'VAT',right:true},'']}
            rows={filtered.filter(e=>e.category==='rental').map(e=>(
              <tr key={e.id}>
                <TD>{fmtDate(e.date)}</TD>
                <TD mono>{e.or_number||'—'}</TD>
                <TD>{e.lessor||'—'}</TD>
                <TD muted>{e.entity}</TD>
                <TD muted>{e.period||'—'}</TD>
                <TD right bold>{fmt(e.amount)}</TD>
                <TD right accent>{e.vat_amount?fmt(e.vat_amount):'—'}</TD>
                <td style={{padding:'4px 8px'}}><button style={s.btn(false,true)} onClick={()=>delEntry(e.id)}>✕</button></td>
              </tr>
            ))} />
        </div>
      </div>
    ),
    // Salaries
    () => (
      <div>
        <h3 style={{fontSize:16,fontWeight:600,marginBottom:12}}>Salaries & Wages</h3>
        <SalaryForm onAdd={addEntry} />
        <FilterBar />
        <div style={s.card}>
          <Table headers={['Date','Employee','Position','Entity',{label:'Basic Pay',right:true},{label:'Deductions',right:true},{label:'Net Pay',right:true},'Period','']}
            rows={filtered.filter(e=>e.category==='salary').map(e=>{
              const ded=(Number(e.sss)||0)+(Number(e.ph)||0)+(Number(e.pi)||0)+(Number(e.wt)||0)
              return <tr key={e.id}>
                <TD>{fmtDate(e.date)}</TD>
                <TD>{e.name}</TD>
                <TD muted>{e.position||'—'}</TD>
                <TD muted>{e.entity}</TD>
                <TD right>{fmt(e.basic)}</TD>
                <TD right danger>{fmt(ded)}</TD>
                <TD right bold>{fmt(e.amount)}</TD>
                <TD muted>{e.period||'—'}</TD>
                <td style={{padding:'4px 8px'}}><button style={s.btn(false,true)} onClick={()=>delEntry(e.id)}>✕</button></td>
              </tr>
            })} />
        </div>
      </div>
    ),
    // Store
    () => (
      <div>
        <h3 style={{fontSize:16,fontWeight:600,marginBottom:12}}>Store Expenses</h3>
        <StoreForm onAdd={addEntry} />
        <FilterBar />
        <div style={s.card}>
          <Table headers={['Date','Type','Description','Supplier','OR No.','Entity',{label:'Base',right:true},{label:'VAT 12%',right:true},{label:'Total',right:true},'']}
            rows={filtered.filter(e=>e.category==='store').map(e=>(
              <tr key={e.id}>
                <TD>{fmtDate(e.date)}</TD>
                <TD>{e.type}</TD>
                <TD muted>{e.desc_text||'—'}</TD>
                <TD>{e.supplier||'—'}</TD>
                <TD mono>{e.or_number||'—'}</TD>
                <TD muted>{e.entity}</TD>
                <TD right>{fmt(e.base_amount)}</TD>
                <TD right accent>{e.vat_amount?fmt(e.vat_amount):'—'}</TD>
                <TD right bold>{fmt(e.amount)}</TD>
                <td style={{padding:'4px 8px'}}><button style={s.btn(false,true)} onClick={()=>delEntry(e.id)}>✕</button></td>
              </tr>
            ))} />
        </div>
      </div>
    ),
    // VAT
    () => (
      <div>
        <h3 style={{fontSize:16,fontWeight:600,marginBottom:12}}>VAT Input Register</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:16}}>
          <Metric label="Total Input VAT" value={fmt(totalVAT)} accent />
          <Metric label="Receipts with VAT" value={vatEntries.length} />
        </div>
        <FilterBar />
        <div style={s.card}>
          <Table headers={['Date','OR No.','Supplier','TIN','Entity','Type',{label:'Base',right:true},{label:'Input VAT',right:true},{label:'Total',right:true}]}
            empty="No VAT entries yet."
            rows={[
              ...vatEntries.map(e=>(
                <tr key={e.id}>
                  <TD>{fmtDate(e.date)}</TD>
                  <TD mono>{e.or_number||e.ref||'—'}</TD>
                  <TD>{e.supplier||e.lessor||'—'}</TD>
                  <TD mono>{e.tin||'—'}</TD>
                  <TD muted>{e.entity}</TD>
                  <TD>{e.type}</TD>
                  <TD right>{fmt(e.base_amount||e.amount)}</TD>
                  <TD right accent bold>{fmt(e.vat_amount)}</TD>
                  <TD right bold>{fmt(Number(e.base_amount||e.amount)+Number(e.vat_amount||0))}</TD>
                </tr>
              )),
              vatEntries.length>0 && <tr key="total" style={{background:'#f5f9ff'}}>
                <td colSpan={7} style={{textAlign:'right',padding:'10px',fontWeight:600,fontSize:13}}>Total Input VAT:</td>
                <td style={{textAlign:'right',padding:'10px',fontWeight:700,color:'#185FA5'}}>{fmt(totalVAT)}</td>
                <td/>
              </tr>
            ].filter(Boolean)} />
        </div>
      </div>
    ),
    // All
    () => (
      <div>
        <h3 style={{fontSize:16,fontWeight:600,marginBottom:12}}>All Entries</h3>
        <FilterBar />
        <div style={s.card}>
          <Table headers={['Date','Category','Type / Name','OR No.','Supplier','Entity',{label:'Amount',right:true},{label:'VAT',right:true},'']}
            empty="No entries yet."
            rows={filtered.map(e=>(
              <tr key={e.id}>
                <TD>{fmtDate(e.date)}</TD>
                <TD><span style={s.badge(e.category)}>{catLabel(e.category)}</span></TD>
                <TD>{e.type||e.name||e.desc_text||'—'}</TD>
                <TD mono>{e.or_number||e.ref||'—'}</TD>
                <TD>{e.supplier||e.lessor||'—'}</TD>
                <TD muted>{e.entity}</TD>
                <TD right bold>{fmt(e.amount)}</TD>
                <TD right accent>{e.vat_amount?fmt(e.vat_amount):'—'}</TD>
                <td style={{padding:'4px 8px'}}><button style={s.btn(false,true)} onClick={()=>delEntry(e.id)}>✕</button></td>
              </tr>
            ))} />
        </div>
      </div>
    ),
    // Settings
    () => <SettingsPage currentUser={user} />
  ]

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'#185FA5',letterSpacing:1}}>ONIISAN · LIMJOE</div>
          <div style={{fontSize:18,fontWeight:700}}>Financial & Store Expenses Tracker</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:12,color:'#888'}}>Hi, {user.username}!</span>
          <button style={s.btn(false,false)} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={{...s.tabs, padding:'0 16px'}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={s.tab(tab===i)}>{t}</button>
        ))}
      </div>

      <div style={s.container}>
        {pages[tab]?.()}
      </div>
    </div>
  )
}
