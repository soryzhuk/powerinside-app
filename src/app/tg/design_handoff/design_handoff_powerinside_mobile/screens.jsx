// screens.jsx — PowerInside mobile screens
// Palette: warm dark + soft sand, inspired by editorial/luxury aesthetics
// No neon, no acidic hues. Serif display (Fraunces) + sans body (Inter)

const P = {
  bg:        '#17140F',    // warm near-black
  surface:   '#211D17',    // lifted card
  surface2:  '#2A251D',    // lifted card 2
  line:      'rgba(237,230,215,0.08)',
  lineSoft:  'rgba(237,230,215,0.05)',
  text:      '#EDE6D7',    // warm ivory
  textDim:   'rgba(237,230,215,0.58)',
  textMute:  'rgba(237,230,215,0.36)',
  sand:      '#C9A574',    // warm tan accent (muted, not saturated)
  sandDeep:  '#A7855A',
  sandSoft:  'rgba(201,165,116,0.14)',
  stone:     '#8A7F6E',    // secondary
  success:   '#7D9575',    // muted sage
};

const serif = "'Fraunces', Georgia, serif";
const sans  = "'Inter', system-ui, sans-serif";
const mono  = "'JetBrains Mono', ui-monospace, monospace";

// ─── Generic bits ──────────────────────────────────────────────────────

function Shell({ children, scroll = false }) {
  return (
    <div style={{
      position:'absolute', inset:0, background:P.bg, color:P.text,
      fontFamily:sans, display:'flex', flexDirection:'column',
      overflow: scroll ? 'hidden' : 'hidden',
    }}>
      {children}
    </div>
  );
}

function StatusBarPad() { return <div style={{ height: 54 }} />; }
function HomePad()      { return <div style={{ height: 34 }} />; }

function Avatar({ initials, size = 40, tone = 'sand' }) {
  const bg = tone === 'sand' ? 'linear-gradient(135deg,#C9A574,#8A6A3E)' :
             tone === 'stone' ? 'linear-gradient(135deg,#8A7F6E,#5B5248)' :
             tone === 'sage' ? 'linear-gradient(135deg,#8AA082,#5C7257)' :
             'linear-gradient(135deg,#6B6458,#403A30)';
  return (
    <div style={{
      width:size, height:size, borderRadius:size/2, background:bg,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#FFF8EA', fontFamily:serif, fontWeight:500,
      fontSize: size * 0.38, letterSpacing:0.5,
      boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.3)',
    }}>{initials}</div>
  );
}

function TabBar({ active = 'chat' }) {
  const items = [
    { id:'chat',    label:'Розмова',  icon: (c)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a8 8 0 0 1-11.4 7.2L4 21l1.8-5.6A8 8 0 1 1 21 12z"/>
      </svg>) },
    { id:'balance', label:'Баланс',   icon: (c)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2" fill={c}/>
      </svg>) },
    { id:'profile', label:'Профіль',  icon: (c)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.8"/><path d="M4 21c1.5-4 4.6-6 8-6s6.5 2 8 6"/>
      </svg>) },
  ];
  return (
    <div style={{
      display:'flex', justifyContent:'space-around', alignItems:'center',
      padding:'10px 8px 6px',
      borderTop:`1px solid ${P.line}`, background:P.bg,
    }}>
      {items.map(it => {
        const on = it.id === active;
        const c = on ? P.sand : P.textMute;
        return (
          <div key={it.id} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            flex:1, padding:'6px 0',
          }}>
            {it.icon(c)}
            <span style={{
              fontSize:10, letterSpacing:0.4, textTransform:'uppercase',
              color:c, fontWeight:500,
            }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 1. ONBOARDING ──────────────────────────────────────────────────────

function Onboarding() {
  return (
    <Shell>
      <StatusBarPad />
      <div style={{ padding:'24px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{
          fontFamily:mono, fontSize:11, letterSpacing:1.5, color:P.textMute,
          textTransform:'uppercase',
        }}>Powerinside · Est 2026</div>
        <div style={{
          width:28, height:28, borderRadius:14,
          background:P.surface, display:'flex', alignItems:'center', justifyContent:'center',
          border:`1px solid ${P.line}`,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={P.textDim} strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </div>
      </div>

      {/* Editorial frame */}
      <div style={{ flex:1, position:'relative', padding:'28px 28px 0' }}>
        <div style={{
          position:'relative', height:380, borderRadius:18,
          background:'linear-gradient(180deg,#2A251D 0%,#1B1812 100%)',
          overflow:'hidden', border:`1px solid ${P.line}`,
        }}>
          {/* Placeholder photo — diagonal stripes */}
          <div style={{
            position:'absolute', inset:0,
            backgroundImage: `repeating-linear-gradient(45deg, rgba(201,165,116,0.06) 0 10px, transparent 10px 20px)`,
          }} />
          {/* Big mark */}
          <div style={{
            position:'absolute', left:24, top:24, right:24,
            display:'flex', justifyContent:'space-between',
            fontFamily:mono, fontSize:10, color:P.textMute, letterSpacing:1,
          }}>
            <span>N° 001</span><span>— METHODOLOGY —</span><span>∞</span>
          </div>
          <div style={{
            position:'absolute', left:24, right:24, bottom:120,
            fontFamily:serif, fontSize:86, lineHeight:0.86, color:P.text,
            fontWeight:400, letterSpacing:-2,
          }}>
            Inside<br/>
            <span style={{ fontStyle:'italic', color:P.sand }}>power.</span>
          </div>
          <div style={{
            position:'absolute', left:24, right:24, bottom:24,
            fontSize:13, lineHeight:1.5, color:P.textDim, maxWidth:280,
          }}>
            AI-розмова з методикою твого тренера. Без шаблонів, без гугла — тільки те, що він сам би сказав.
          </div>
        </div>

        {/* 3 value points */}
        <div style={{ marginTop:22, display:'flex', flexDirection:'column', gap:10 }}>
          {[
            ['01', 'Обери тренера', 'Кожен пройшов 7 раундів AI-інтерв\'ю'],
            ['02', 'Постав запитання', 'Голосом або текстом, будь-коли'],
            ['03', 'Отримай відповідь', 'На основі його реальної методології'],
          ].map(([n,t,d]) => (
            <div key={n} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{
                fontFamily:mono, fontSize:11, color:P.sand,
                width:22, paddingTop:2,
              }}>{n}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, color:P.text }}>{t}</div>
                <div style={{ fontSize:12, color:P.textDim, marginTop:1 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'20px 28px 16px' }}>
        <div style={{
          background:P.sand, color:'#17140F', fontWeight:600,
          height:52, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:15, letterSpacing:0.2,
          boxShadow:'0 1px 0 rgba(255,255,255,0.2) inset, 0 10px 30px rgba(201,165,116,0.2)',
        }}>Почати розмову</div>
        <div style={{
          marginTop:12, textAlign:'center', fontSize:12, color:P.textMute,
        }}>
          Вже маєш акаунт? <span style={{ color:P.text, borderBottom:`1px solid ${P.stone}`, paddingBottom:1 }}>Увійти</span>
        </div>
      </div>
      <HomePad />
    </Shell>
  );
}

// ─── 2. COACHES LIST ────────────────────────────────────────────────────

function CoachesList() {
  const coaches = [
    { n:'Ілля Ковальов',    f:'Пауерліфтинг · Київ',     r:74, b:312, av:'ІК', tone:'sand' },
    { n:'Марина Романюк',  f:'Crossfit · Львів',         r:52, b:201, av:'МР', tone:'sage' },
    { n:'Андрій Тищенко',  f:'Важка атлетика · Харків',  r:91, b:440, av:'АТ', tone:'stone' },
    { n:'Дарина Рибак',     f:'Функціональний · Одеса',  r:38, b:156, av:'ДР', tone:'dark' },
  ];
  return (
    <Shell>
      <StatusBarPad />
      {/* Header */}
      <div style={{ padding:'16px 24px 8px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{
            fontFamily:mono, fontSize:11, letterSpacing:1.5, color:P.textMute,
            textTransform:'uppercase',
          }}>Бібліотека тренерів</div>
          <div style={{ display:'flex', gap:8 }}>
            <IconPill icon="search" />
            <IconPill icon="filter" />
          </div>
        </div>
        <div style={{
          fontFamily:serif, fontSize:38, lineHeight:1, fontWeight:400,
          letterSpacing:-0.8, color:P.text,
        }}>
          Обери, з ким<br/>
          <span style={{ fontStyle:'italic', color:P.stone }}>говорити.</span>
        </div>
        <div style={{ fontSize:13, color:P.textDim, marginTop:10, maxWidth:280 }}>
          Чотири активні методології. Кожен відповідає у своїй манері.
        </div>
      </div>

      {/* Tags filter row */}
      <div style={{ padding:'16px 24px 6px', display:'flex', gap:6, overflowX:'auto' }}>
        {['Всі', 'Сила', 'Crossfit', 'Витривалість', 'Техніка'].map((t,i) => (
          <div key={t} style={{
            padding:'6px 12px', borderRadius:999,
            fontSize:12, whiteSpace:'nowrap',
            background: i===0 ? P.text : 'transparent',
            color: i===0 ? P.bg : P.textDim,
            border: i===0 ? 'none' : `1px solid ${P.line}`,
            fontWeight: i===0 ? 500 : 400,
          }}>{t}</div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ flex:1, overflow:'hidden', padding:'10px 24px 8px', display:'flex', flexDirection:'column', gap:10 }}>
        {coaches.map((c,i) => (
          <div key={c.n} style={{
            background:P.surface, borderRadius:16, padding:'16px 16px',
            border:`1px solid ${P.line}`,
            display:'flex', alignItems:'center', gap:14,
            position:'relative', overflow:'hidden',
          }}>
            {i===0 && <div style={{
              position:'absolute', top:10, right:12,
              fontFamily:mono, fontSize:9, color:P.sand, letterSpacing:1,
            }}>⸻ РЕКОМЕНДОВАНО</div>}
            <Avatar initials={c.av} size={48} tone={c.tone} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:500, color:P.text }}>{c.n}</div>
              <div style={{ fontSize:12, color:P.textDim, marginTop:2 }}>{c.f}</div>
              <div style={{ display:'flex', gap:12, marginTop:8, fontFamily:mono, fontSize:10, color:P.textMute }}>
                <span>{c.r} правил</span>
                <span style={{ opacity:0.3 }}>·</span>
                <span>{c.b} записів</span>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </div>
        ))}
      </div>

      <TabBar active="chat" />
      <HomePad />
    </Shell>
  );
}

function IconPill({ icon }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
  };
  return (
    <div style={{
      width:36, height:36, borderRadius:18,
      background:P.surface, border:`1px solid ${P.line}`,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={P.textDim} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths[icon]}
      </svg>
    </div>
  );
}

// ─── 3. CHAT ────────────────────────────────────────────────────────────

function Chat() {
  const msgs = [
    { r:'coach', t:'Доброго ранку. На що сьогодні налаштовуємось?' },
    { r:'user',  t:'Привіт. Маю тренування через 2 години, ноги. Як розігрітись? Вчора трохи перетренувався.' },
    { r:'coach', t:'Якщо є легка перевтома — не економ на розминці. 10 хв велосипед у спокійному темпі, потім суглобова.\n\nПорожній присід 3×8, присід з порожнім грифом 2×8. Тільки потім — робочі підходи з 50% та відчуттям.' },
    { r:'coach', t:'Якщо після розминки коліна або попереку дадуть знати — скорочуй робочу вагу на 15%. Це день техніки, не день рекордів.', quote:true },
  ];

  return (
    <Shell>
      <StatusBarPad />
      {/* Coach header */}
      <div style={{
        padding:'8px 20px 12px', display:'flex', alignItems:'center', gap:12,
        borderBottom:`1px solid ${P.line}`,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.textDim} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        <Avatar initials="ІК" size={36} tone="sand" />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:500 }}>Ілля Ковальов</div>
          <div style={{ fontSize:11, color:P.textDim, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:5, height:5, borderRadius:3, background:P.success, display:'inline-block' }} />
            AI-методологія · 74 правила
          </div>
        </div>
        <IconPill icon="filter" />
      </div>

      {/* Day divider */}
      <div style={{ textAlign:'center', padding:'16px 0 6px' }}>
        <span style={{
          fontFamily:mono, fontSize:10, color:P.textMute,
          letterSpacing:1.5, textTransform:'uppercase',
        }}>Сьогодні · 09:14</span>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflow:'hidden', padding:'8px 20px 8px', display:'flex', flexDirection:'column', gap:10 }}>
        {msgs.map((m,i) => m.r === 'user' ? (
          <div key={i} style={{ alignSelf:'flex-end', maxWidth:'78%' }}>
            <div style={{
              background:P.sand, color:'#17140F',
              padding:'10px 14px', borderRadius:'16px 16px 4px 16px',
              fontSize:13.5, lineHeight:1.45, fontWeight:450,
            }}>{m.t}</div>
          </div>
        ) : m.quote ? (
          <div key={i} style={{ alignSelf:'flex-start', maxWidth:'88%' }}>
            <div style={{
              borderLeft:`2px solid ${P.sand}`, paddingLeft:12,
              fontFamily:serif, fontSize:15, lineHeight:1.4,
              color:P.text, fontStyle:'italic', fontWeight:400,
            }}>"{m.t}"</div>
            <div style={{
              marginTop:6, paddingLeft:14, fontFamily:mono, fontSize:10,
              color:P.textMute, letterSpacing:1,
            }}>— З МЕТОДИКИ ТРЕНЕРА · ПРАВИЛО 22</div>
          </div>
        ) : (
          <div key={i} style={{ alignSelf:'flex-start', maxWidth:'84%' }}>
            <div style={{
              background:P.surface, color:P.text,
              padding:'10px 14px', borderRadius:'16px 16px 16px 4px',
              fontSize:13.5, lineHeight:1.5, whiteSpace:'pre-wrap',
              border:`1px solid ${P.line}`,
            }}>{m.t}</div>
          </div>
        ))}
      </div>

      {/* Suggestion chips */}
      <div style={{ padding:'4px 20px 10px', display:'flex', gap:6, overflowX:'auto' }}>
        {['Скільки підходів?', 'Що їсти після?', 'Біль у попереку'].map(s => (
          <div key={s} style={{
            padding:'7px 12px', borderRadius:999,
            fontSize:11.5, color:P.textDim,
            border:`1px solid ${P.line}`, background:P.surface,
            whiteSpace:'nowrap',
          }}>{s}</div>
        ))}
      </div>

      {/* Composer */}
      <div style={{
        padding:'10px 16px 14px',
        borderTop:`1px solid ${P.line}`,
        display:'flex', gap:10, alignItems:'center',
      }}>
        <div style={{
          flex:1, background:P.surface, borderRadius:22,
          padding:'10px 16px', fontSize:13.5, color:P.textDim,
          border:`1px solid ${P.line}`, display:'flex', alignItems:'center', gap:8,
        }}>
          <span style={{ flex:1 }}>Запитай тренера…</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.textMute} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
          </svg>
        </div>
        <div style={{
          width:44, height:44, borderRadius:22,
          background:P.sand, display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 12px rgba(201,165,116,0.25)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17140F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </div>
      </div>
      <HomePad />
    </Shell>
  );
}

// ─── 4. BALANCE ─────────────────────────────────────────────────────────

function Balance() {
  return (
    <Shell>
      <StatusBarPad />
      <div style={{ padding:'16px 24px 0' }}>
        <div style={{
          fontFamily:mono, fontSize:11, letterSpacing:1.5, color:P.textMute,
          textTransform:'uppercase', marginBottom:18,
        }}>Баланс</div>

        {/* Hero counter */}
        <div style={{
          background:`linear-gradient(180deg, ${P.surface2} 0%, ${P.surface} 100%)`,
          borderRadius:20, padding:'22px 22px 20px',
          border:`1px solid ${P.line}`, position:'relative', overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', top:0, right:0,
            fontFamily:mono, fontSize:9, color:P.textMute,
            padding:'10px 14px', letterSpacing:1,
          }}>ВСЬОГО / ЗАЛИШОК</div>
          <div style={{
            fontFamily:serif, fontSize:86, lineHeight:0.9, fontWeight:400,
            color:P.text, letterSpacing:-2.5,
          }}>147</div>
          <div style={{ fontSize:12, color:P.textDim, marginTop:6 }}>повідомлень до тренера</div>

          {/* Bar */}
          <div style={{ marginTop:20, display:'flex', height:6, borderRadius:3, overflow:'hidden', gap:2 }}>
            <div style={{ flex:20, background:P.success, opacity:0.7 }} />
            <div style={{ flex:27, background:'#7A8BA0', opacity:0.7 }} />
            <div style={{ flex:100, background:P.sand }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontFamily:mono, fontSize:10, color:P.textMute }}>
            <span>● 20 безкоштовних</span>
            <span>● 27 тижневих</span>
            <span>● 100 куплених</span>
          </div>
        </div>

        {/* Subscription chip */}
        <div style={{
          marginTop:14, padding:'14px 16px',
          background:P.surface, borderRadius:14,
          border:`1px solid ${P.line}`,
          display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:P.sandSoft, display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13.5, fontWeight:500 }}>Individual · активна</div>
            <div style={{ fontSize:11.5, color:P.textDim, marginTop:1 }}>Продовжиться 14 травня · $30</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6"/>
          </svg>
        </div>
      </div>

      {/* Top up */}
      <div style={{ padding:'22px 24px 0' }}>
        <div style={{
          fontFamily:mono, fontSize:10, letterSpacing:1.5, color:P.textMute,
          textTransform:'uppercase', marginBottom:10,
        }}>— Пакети повідомлень</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { n:50,  p:'$5',  d:'Для розминки',  hot:false },
            { n:200, p:'$15', d:'Популярний',    hot:true },
            { n:500, p:'$30', d:'Найвигідніше',  hot:false },
          ].map(it => (
            <div key={it.n} style={{
              padding:'14px 16px', borderRadius:14,
              background: it.hot ? P.surface2 : P.surface,
              border:`1px solid ${it.hot ? P.sand+'44' : P.line}`,
              display:'flex', alignItems:'center', gap:14,
            }}>
              <div style={{
                fontFamily:serif, fontSize:28, fontWeight:400,
                color:P.text, letterSpacing:-0.5, width:58,
              }}>{it.n}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{it.d}</div>
                <div style={{ fontSize:11, color:P.textDim, marginTop:1 }}>≈ ${(parseFloat(it.p.slice(1))/it.n*100).toFixed(1)} / 100 повідомл.</div>
              </div>
              <div style={{
                padding:'8px 14px', borderRadius:10,
                background: it.hot ? P.sand : 'transparent',
                color: it.hot ? '#17140F' : P.text,
                border: it.hot ? 'none' : `1px solid ${P.line}`,
                fontSize:13, fontWeight:600,
              }}>{it.p}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex:1 }} />
      <TabBar active="balance" />
      <HomePad />
    </Shell>
  );
}

// ─── 5. PROFILE ─────────────────────────────────────────────────────────

function Profile() {
  const rows = [
    ['Тренери', '3 активних'],
    ['Підписка', 'Individual'],
    ['Сповіщення', 'Увімкнено'],
    ['Мова', 'Українська'],
    ['Зв’язатись з підтримкою', ''],
    ['Вийти з акаунту', ''],
  ];
  return (
    <Shell>
      <StatusBarPad />
      <div style={{ padding:'16px 24px 0' }}>
        <div style={{
          fontFamily:mono, fontSize:11, letterSpacing:1.5, color:P.textMute,
          textTransform:'uppercase', marginBottom:20,
        }}>Профіль</div>

        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <Avatar initials="НП" size={68} tone="stone" />
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:serif, fontSize:24, fontWeight:400, letterSpacing:-0.3 }}>Назар Поляков</div>
            <div style={{ fontSize:12, color:P.textDim, marginTop:2 }}>@nazar · Спортсмен</div>
            <div style={{
              marginTop:8, display:'inline-flex', gap:8, alignItems:'center',
              padding:'4px 10px', borderRadius:999,
              background:P.sandSoft, color:P.sand,
              fontFamily:mono, fontSize:10, letterSpacing:1,
            }}>● З НАМИ 142 ДНІ</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          marginTop:22, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0,
          background:P.surface, borderRadius:16, border:`1px solid ${P.line}`,
          overflow:'hidden',
        }}>
          {[
            ['312', 'Запитань'],
            ['18', 'Цього тижня'],
            ['7', 'Стрік, днів'],
          ].map(([n,l], i) => (
            <div key={l} style={{
              padding:'16px 10px', textAlign:'center',
              borderRight: i<2 ? `1px solid ${P.line}` : 'none',
            }}>
              <div style={{ fontFamily:serif, fontSize:26, fontWeight:400, color:P.text, letterSpacing:-0.5 }}>{n}</div>
              <div style={{ fontSize:10.5, color:P.textDim, marginTop:2, letterSpacing:0.3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings list */}
      <div style={{ padding:'22px 24px 0' }}>
        <div style={{
          fontFamily:mono, fontSize:10, letterSpacing:1.5, color:P.textMute,
          textTransform:'uppercase', marginBottom:10,
        }}>— Налаштування</div>
        <div style={{
          background:P.surface, borderRadius:14,
          border:`1px solid ${P.line}`, overflow:'hidden',
        }}>
          {rows.map(([l,r],i) => (
            <div key={l} style={{
              padding:'14px 16px', display:'flex', alignItems:'center',
              borderBottom: i < rows.length-1 ? `1px solid ${P.lineSoft}` : 'none',
            }}>
              <div style={{ flex:1, fontSize:13.5, color:i===rows.length-1 ? '#C99B85' : P.text }}>{l}</div>
              {r && <span style={{ fontSize:12, color:P.textDim, marginRight:8 }}>{r}</span>}
              {i < rows.length-1 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'16px 24px 8px', fontFamily:mono, fontSize:10, color:P.textMute, textAlign:'center' }}>
        POWERINSIDE · V 0.1 · TELEGRAM MINI APP
      </div>

      <div style={{ flex:1 }} />
      <TabBar active="profile" />
      <HomePad />
    </Shell>
  );
}

// ─── 6. EMPTY CHAT ─────────────────────────────────────────────────────

function EmptyChat() {
  const prompts = [
    'Склади розминку перед присідом',
    'Чи варто тренуватись при болю в спині?',
    'Як харчуватись у день змагань?',
    'Поясни, що таке авторегуляція',
  ];
  return (
    <Shell>
      <StatusBarPad />
      <div style={{
        padding:'8px 20px 12px', display:'flex', alignItems:'center', gap:12,
        borderBottom:`1px solid ${P.line}`,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.textDim} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        <Avatar initials="ІК" size={36} tone="sand" />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:500 }}>Ілля Ковальов</div>
          <div style={{ fontSize:11, color:P.textDim }}>Перша розмова</div>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'40px 28px 20px', overflow:'hidden' }}>
        <div style={{
          width:72, height:72, borderRadius:36,
          background:P.sandSoft, display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:20,
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a8 8 0 0 1-11.4 7.2L4 21l1.8-5.6A8 8 0 1 1 21 12z"/>
          </svg>
        </div>
        <div style={{
          fontFamily:serif, fontSize:30, lineHeight:1.05, fontWeight:400,
          letterSpacing:-0.5, color:P.text, maxWidth:260,
        }}>
          Спитай те, що давно<br/>
          <span style={{ fontStyle:'italic', color:P.stone }}>не наважувався.</span>
        </div>
        <div style={{ fontSize:13, color:P.textDim, marginTop:12, maxWidth:280 }}>
          Я відповідаю так, як мій тренер. Мої правила — його методика, не гугл.
        </div>

        <div style={{ marginTop:28, display:'flex', flexDirection:'column', gap:8 }}>
          {prompts.map((p,i) => (
            <div key={p} style={{
              padding:'13px 14px', borderRadius:12,
              background:P.surface, border:`1px solid ${P.line}`,
              display:'flex', alignItems:'center', gap:12,
            }}>
              <span style={{ fontFamily:mono, fontSize:10, color:P.sand, width:18 }}>0{i+1}</span>
              <span style={{ flex:1, fontSize:13 }}>{p}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.6" strokeLinecap="round">
                <path d="M7 17L17 7M7 7h10v10"/>
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div style={{
        padding:'10px 16px 14px',
        borderTop:`1px solid ${P.line}`,
        display:'flex', gap:10, alignItems:'center',
      }}>
        <div style={{
          flex:1, background:P.surface, borderRadius:22,
          padding:'10px 16px', fontSize:13.5, color:P.textDim,
          border:`1px solid ${P.line}`,
        }}>Напиши або скористайся підказкою…</div>
        <div style={{
          width:44, height:44, borderRadius:22,
          background:P.surface, border:`1px solid ${P.line}`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </div>
      </div>
      <HomePad />
    </Shell>
  );
}

Object.assign(window, {
  Onboarding, CoachesList, Chat, Balance, Profile, EmptyChat,
});
