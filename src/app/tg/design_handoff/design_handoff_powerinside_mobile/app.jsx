// app.jsx — PowerInside design canvas assembly

function Frame({ children }) {
  // Tighter iPhone — 380 width, 800 height — no title/nav, we supply our own
  return (
    <IOSDevice width={380} height={800} dark={true}>
      {children}
    </IOSDevice>
  );
}

function App() {
  return (
    <div style={{
      position:'fixed', inset:0, background:'#EDEAE3',
    }}>
      {/* Header */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:100,
        padding:'18px 28px 16px',
        background:'linear-gradient(180deg,#EDEAE3 0%, rgba(237,234,227,0.92) 100%)',
        borderBottom:'1px solid rgba(0,0,0,0.06)',
        display:'flex', alignItems:'baseline', gap:18,
      }}>
        <div style={{
          fontFamily:"'Fraunces', serif", fontSize:22, fontWeight:500,
          letterSpacing:-0.4, color:'#1F1B16',
        }}>PowerInside <span style={{ fontStyle:'italic', color:'#A7855A' }}>— Mobile</span></div>
        <div style={{
          fontFamily:"'JetBrains Mono', monospace", fontSize:10.5,
          letterSpacing:1.2, color:'rgba(31,27,22,0.5)', textTransform:'uppercase',
        }}>Telegram Mini App · Dark · Warm sand accent</div>
        <div style={{ flex:1 }} />
        <div style={{
          fontFamily:"'JetBrains Mono', monospace", fontSize:10,
          color:'rgba(31,27,22,0.4)', letterSpacing:1,
        }}>PAN · ZOOM · FOCUS</div>
      </div>

      <div style={{ position:'absolute', top:58, left:0, right:0, bottom:0 }}>
        <DesignCanvas>
          <DCSection id="flow" title="Основний флоу" subtitle="Онбординг → вибір тренера → розмова">
            <DCArtboard id="ob"  label="01 · Онбординг"        width={380} height={800}>
              <Frame><Onboarding /></Frame>
            </DCArtboard>
            <DCArtboard id="cl"  label="02 · Вибір тренера"    width={380} height={800}>
              <Frame><CoachesList /></Frame>
            </DCArtboard>
            <DCArtboard id="ec"  label="03 · Перша розмова"    width={380} height={800}>
              <Frame><EmptyChat /></Frame>
            </DCArtboard>
            <DCArtboard id="ch"  label="04 · Розмова"          width={380} height={800}>
              <Frame><Chat /></Frame>
            </DCArtboard>
          </DCSection>

          <DCSection id="account" title="Акаунт" subtitle="Баланс повідомлень, профіль, тарифи">
            <DCArtboard id="bl"  label="05 · Баланс"  width={380} height={800}>
              <Frame><Balance /></Frame>
            </DCArtboard>
            <DCArtboard id="pr"  label="06 · Профіль" width={380} height={800}>
              <Frame><Profile /></Frame>
            </DCArtboard>
          </DCSection>

          <DCSection id="notes" title="Система" subtitle="Дизайн-токени та примітки">
            <DCArtboard id="sys" label="Палітра + тип" width={720} height={800}>
              <SystemBoard />
            </DCArtboard>
          </DCSection>
        </DesignCanvas>
      </div>
    </div>
  );
}

function SystemBoard() {
  const serif = "'Fraunces', Georgia, serif";
  const sans  = "'Inter', system-ui, sans-serif";
  const mono  = "'JetBrains Mono', monospace";
  const swatches = [
    ['#17140F', 'ink',      'bg'],
    ['#211D17', 'coal',     'surface'],
    ['#2A251D', 'coal-2',   'surface-2'],
    ['#EDE6D7', 'ivory',    'text'],
    ['#C9A574', 'sand',     'accent'],
    ['#A7855A', 'sand-deep',''],
    ['#8A7F6E', 'stone',    'secondary'],
    ['#7D9575', 'sage',     'success'],
  ];
  return (
    <div style={{
      position:'absolute', inset:0, background:'#FBF9F4', padding:36,
      fontFamily:sans, color:'#1F1B16', overflow:'hidden',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:18 }}>
        <div>
          <div style={{ fontFamily:mono, fontSize:10, letterSpacing:1.5, color:'#7A6F5E', textTransform:'uppercase' }}>Design system</div>
          <div style={{ fontFamily:serif, fontSize:42, letterSpacing:-1, fontWeight:400, marginTop:4 }}>
            Warm dark, <span style={{ fontStyle:'italic', color:'#A7855A' }}>quiet accent.</span>
          </div>
        </div>
        <div style={{ fontFamily:mono, fontSize:10, color:'#A39A88', letterSpacing:1 }}>POWERINSIDE / V1</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        {/* Colors */}
        <div>
          <div style={{ fontFamily:mono, fontSize:10, letterSpacing:1.5, color:'#7A6F5E', textTransform:'uppercase', marginBottom:10 }}>— Colors</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {swatches.map(([hex, n, role]) => (
              <div key={hex} style={{
                background:hex, borderRadius:10, padding:'14px 14px',
                height:84, color: parseInt(hex.slice(1),16) > 0x888888 ? '#1F1B16' : '#EDE6D7',
                display:'flex', flexDirection:'column', justifyContent:'space-between',
                border:'1px solid rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontFamily:mono, fontSize:10, opacity:0.7 }}>{hex}</div>
                <div>
                  <div style={{ fontFamily:serif, fontSize:16, fontWeight:500 }}>{n}</div>
                  {role && <div style={{ fontFamily:mono, fontSize:9, opacity:0.65, marginTop:1 }}>{role}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Type + rules */}
        <div>
          <div style={{ fontFamily:mono, fontSize:10, letterSpacing:1.5, color:'#7A6F5E', textTransform:'uppercase', marginBottom:10 }}>— Type</div>
          <div style={{ background:'#17140F', borderRadius:14, padding:'22px 22px', color:'#EDE6D7' }}>
            <div style={{ fontFamily:mono, fontSize:9, color:'#C9A574', letterSpacing:1.5, marginBottom:6 }}>FRAUNCES · DISPLAY</div>
            <div style={{ fontFamily:serif, fontSize:44, lineHeight:0.95, letterSpacing:-1, fontWeight:400 }}>
              Inside <span style={{ fontStyle:'italic', color:'#C9A574' }}>power.</span>
            </div>
            <div style={{ height:12 }} />
            <div style={{ fontFamily:mono, fontSize:9, color:'#C9A574', letterSpacing:1.5, marginBottom:6 }}>INTER · BODY</div>
            <div style={{ fontSize:13, lineHeight:1.5, color:'rgba(237,230,215,0.7)' }}>
              Спортсмен отримує відповіді на основі реальної методології свого тренера.
              Кожна — нанизана на 7 раундів AI-інтерв'ю та 300+ записів у базі знань.
            </div>
            <div style={{ height:12 }} />
            <div style={{ fontFamily:mono, fontSize:9, color:'#C9A574', letterSpacing:1.5, marginBottom:6 }}>JETBRAINS MONO · META</div>
            <div style={{ fontFamily:mono, fontSize:11, letterSpacing:1.2, color:'rgba(237,230,215,0.6)' }}>
              N° 22 — RULE · METHODOLOGY · 09:14 SUNDAY
            </div>
          </div>

          <div style={{ fontFamily:mono, fontSize:10, letterSpacing:1.5, color:'#7A6F5E', textTransform:'uppercase', margin:'18px 0 10px' }}>— Principles</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              ['Без кислоти', 'Chroma ≤ 0.08. Жодних неонів.'],
              ['Тепла темна база', 'Відчуття паперу, не OLED.'],
              ['Serif як інструмент', 'Тільки на моментах сенсу.'],
              ['Моно для метаданих', 'Дати, правила, N°, лічильники.'],
              ['Повітря важливіше за дані', 'Щільність знижена на 20%.'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:14, fontSize:12.5 }}>
                <span style={{ fontFamily:serif, fontWeight:500, color:'#1F1B16', width:160, fontSize:14 }}>{k}</span>
                <span style={{ color:'#6B6458', flex:1 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { App, SystemBoard });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
