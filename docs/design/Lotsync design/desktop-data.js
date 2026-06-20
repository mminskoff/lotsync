/* =============================================================
   LotSync — Desktop demo data + view wiring
   ============================================================= */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const set = (id, html) => { const n = document.getElementById(id); if (n) n.innerHTML = html; };

  const badge = {
    synced:  '<span class="badge badge-synced"><span class="dot"></span>Synced</span>',
    pending: '<span class="badge badge-pending"><span class="dot"></span>Pending</span>',
    failed:  '<span class="badge badge-failed"><span class="dot"></span>Failed</span>',
    offline: '<span class="badge badge-offline"><span class="dot"></span>Offline</span>',
  };

  function batt(pct) {
    const color = pct > 40 ? 'var(--green-500)' : pct > 18 ? 'var(--status-pending)' : 'var(--status-failed)';
    return `<span class="batt"><span class="batt-bar"><i style="width:${pct}%;background:${color}"></i></span><span class="mono" style="font-size:12px;color:var(--neutral-600)">${pct}%</span></span>`;
  }
  function signal(n) {
    let bars = '';
    for (let i = 1; i <= 4; i++) bars += `<i class="${i <= n ? 'on' : ''}" style="height:${4 + i * 2.5}px"></i>`;
    return `<span class="signal">${bars}</span>`;
  }
  function thumb(c) {
    return `<span class="thumb" style="background:linear-gradient(135deg, ${c}, ${c}cc); box-shadow: inset 0 0 0 1px rgba(11,15,13,0.06)"></span>`;
  }

  /* ---------- view switching ---------- */
  const titles = {
    dashboard: 'Dashboard', vehicles: 'Vehicles', devices: 'ESL Devices',
    assignments: 'Assignments', audit: 'Audit Log', sync: 'Sync Events',
    reports: 'Reports', settings: 'Settings',
  };
  function go(view) {
    $$('.page-view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    set('mtTitle', titles[view] || '');
    const main = $('.main'); if (main) main.scrollTop = 0;
  }
  $$('.nav-item[data-view]').forEach(n => n.addEventListener('click', () => go(n.dataset.view)));
  $$('[data-jump]').forEach(b => b.addEventListener('click', () => go(b.dataset.jump)));

  /* ---------- vehicles ---------- */
  const vehicles = [
    { c:'#2E3338', y:2023, mk:'Toyota',     md:'RAV4 XLE AWD',      vin:'2T3W1RFV8PC284417', stock:'P28417', price:'$32,450', tag:'ESL-4471', sync:'synced',  up:'2m ago' },
    { c:'#B8443C', y:2022, mk:'Honda',      md:'Civic Sport',       vin:'2HGFE2F58NH512093', stock:'P51209', price:'$26,980', tag:'ESL-4472', sync:'synced',  up:'8m ago' },
    { c:'#8A8F94', y:2024, mk:'Ford',       md:'F-150 Lariat',      vin:'1FTFW1E84PFA90233', stock:'N90233', price:'$58,210', tag:'ESL-4503', sync:'pending', up:'just now' },
    { c:'#1B2733', y:2021, mk:'BMW',        md:'X3 xDrive30i',      vin:'5UX53DP02M9F18820', stock:'U18820', price:'$37,995', tag:'ESL-4419', sync:'synced',  up:'31m ago' },
    { c:'#D8DBDE', y:2023, mk:'Tesla',      md:'Model 3 RWD',       vin:'5YJ3E1EA8PF492013', stock:'U49201', price:'$34,600', tag:'ESL-4488', sync:'failed',  up:'4m ago' },
    { c:'#3A4A5A', y:2020, mk:'Subaru',     md:'Outback Premium',   vin:'4S4BTACC6L3214778', stock:'U21477', price:'$24,150', tag:'—',        sync:'offline', up:'1h ago' },
    { c:'#6B4A2B', y:2022, mk:'Jeep',       md:'Grand Cherokee',    vin:'1C4RJKBG7N8512640', stock:'P51264', price:'$41,300', tag:'ESL-4456', sync:'synced',  up:'12m ago' },
    { c:'#9AA0A6', y:2024, mk:'Hyundai',    md:'Tucson SEL',        vin:'5NMJBCAE9PH204519', stock:'N20451', price:'$29,870', tag:'ESL-4511', sync:'synced',  up:'18m ago' },
  ];
  set('vehRows', vehicles.map(v => `
    <tr>
      <td><span class="checkbox"></span></td>
      <td><div class="cellflex">${thumb(v.c)}<div><div class="cell-strong">${v.y} ${v.mk} ${v.md}</div><div class="cell-muted" style="font-size:12px">${v.mk}</div></div></div></td>
      <td class="mono" style="font-size:12.5px;color:var(--neutral-600)">${v.vin}</td>
      <td class="mono" style="font-size:12.5px">${v.stock}</td>
      <td class="num cell-strong">${v.price}</td>
      <td class="mono" style="font-size:12.5px;color:${v.tag==='—'?'var(--neutral-400)':'var(--green-700)'}">${v.tag}</td>
      <td>${badge[v.sync]}</td>
      <td class="cell-muted" style="font-size:12.5px">${v.up}</td>
      <td><span class="row-actions">⋯</span></td>
    </tr>`).join(''));

  /* ---------- ESL devices ---------- */
  const devices = [
    { id:'ESL-4471', model:'Pricer SmartTAG HD', pair:'2023 Toyota RAV4 XLE',  batt:92, sig:4, seen:'1m ago',  st:'synced'  },
    { id:'ESL-4472', model:'Pricer SmartTAG HD', pair:'2022 Honda Civic Sport', batt:88, sig:4, seen:'3m ago',  st:'synced'  },
    { id:'ESL-4488', model:'Pricer SmartTAG HD', pair:'2023 Tesla Model 3',     batt:34, sig:2, seen:'4m ago',  st:'failed'  },
    { id:'ESL-4503', model:'Pricer SmartTAG XL', pair:'2024 Ford F-150 Lariat', batt:76, sig:3, seen:'just now',st:'pending' },
    { id:'ESL-4419', model:'Pricer SmartTAG HD', pair:'2021 BMW X3 xDrive30i',  batt:61, sig:4, seen:'30m ago', st:'synced'  },
    { id:'ESL-4456', model:'Pricer SmartTAG XL', pair:'2022 Jeep Grand Cherokee',batt:14,sig:1, seen:'2h ago',  st:'offline' },
    { id:'ESL-4511', model:'Pricer SmartTAG HD', pair:'2024 Hyundai Tucson SEL',batt:97, sig:4, seen:'17m ago', st:'synced'  },
    { id:'ESL-4520', model:'Pricer SmartTAG HD', pair:'Unpaired',               batt:100,sig:3, seen:'5m ago',  st:'offline' },
  ];
  set('devRows', devices.map(d => `
    <tr>
      <td><span class="checkbox"></span></td>
      <td class="mono cell-strong" style="font-size:12.5px;color:var(--green-700)">${d.id}</td>
      <td>${d.model}</td>
      <td class="${d.pair==='Unpaired'?'cell-muted':''}" style="font-size:13px">${d.pair}</td>
      <td>${batt(d.batt)}</td>
      <td>${signal(d.sig)}</td>
      <td class="cell-muted" style="font-size:12.5px">${d.seen}</td>
      <td>${badge[d.st]}</td>
    </tr>`).join(''));

  /* ---------- assignments ---------- */
  const assigns = [
    { veh:'2023 Toyota RAV4 XLE',  tag:'ESL-4471', by:'M. Cole',  init:'MC', when:'Today · 9:41 AM', src:'Mobile',  st:'synced'  },
    { veh:'2024 Ford F-150 Lariat',tag:'ESL-4503', by:'M. Cole',  init:'MC', when:'Today · 9:38 AM', src:'Mobile',  st:'pending' },
    { veh:'2023 Tesla Model 3',    tag:'ESL-4488', by:'A. Reyes', init:'AR', when:'Today · 8:12 AM', src:'Desktop', st:'failed'  },
    { veh:'2022 Honda Civic Sport',tag:'ESL-4472', by:'M. Cole',  init:'MC', when:'Yesterday',       src:'Mobile',  st:'synced'  },
    { veh:'2021 BMW X3 xDrive30i', tag:'ESL-4419', by:'DMS Sync', init:'DM', when:'Yesterday',       src:'Auto',    st:'synced'  },
    { veh:'2022 Jeep Grand Cherokee',tag:'ESL-4456',by:'J. Pratt',init:'JP', when:'Mar 14',          src:'Mobile',  st:'synced'  },
  ];
  set('asgRows', assigns.map(a => `
    <tr>
      <td><span class="checkbox"></span></td>
      <td class="cell-strong" style="font-size:13px">${a.veh}</td>
      <td class="mono" style="font-size:12.5px;color:var(--green-700)">${a.tag}</td>
      <td><div class="cellflex"><span class="avatar" style="width:24px;height:24px;font-size:10px">${a.init}</span>${a.by}</div></td>
      <td class="cell-muted" style="font-size:12.5px">${a.when}</td>
      <td><span class="badge badge-outline">${a.src}</span></td>
      <td>${badge[a.st]}</td>
      <td><span class="row-actions">⋯</span></td>
    </tr>`).join(''));

  /* ---------- audit log ---------- */
  const audit = [
    { t:'09:41:06', who:'M. Cole',  act:'pair',     ent:'RAV4 XLE ↔ ESL-4471', chg:'Tag paired', src:'Mobile'  },
    { t:'09:38:52', who:'M. Cole',  act:'pair',     ent:'F-150 ↔ ESL-4503',    chg:'Tag paired', src:'Mobile'  },
    { t:'09:12:20', who:'A. Reyes', act:'price',    ent:'Model 3 RWD',          chg:'$35,990 → $34,600', src:'Desktop' },
    { t:'08:55:03', who:'DMS Sync', act:'status',   ent:'Outback Premium',      chg:'Available → Sold',  src:'Auto' },
    { t:'08:31:47', who:'A. Reyes', act:'reassign', ent:'ESL-4488 → Model 3',   chg:'Reassigned from X5', src:'Desktop' },
    { t:'08:02:11', who:'J. Pratt', act:'unpair',   ent:'ESL-4399',             chg:'Tag unpaired',       src:'Mobile' },
    { t:'07:48:30', who:'DMS Sync', act:'price',    ent:'Grand Cherokee',       chg:'$42,100 → $41,300',  src:'Auto' },
  ];
  const actColor = { pair:'var(--green-700)', price:'var(--status-info)', status:'var(--neutral-700)', reassign:'var(--status-pending)', unpair:'var(--status-failed)' };
  set('audRows', audit.map(a => `
    <tr>
      <td class="mono cell-muted" style="font-size:12.5px">${a.t}</td>
      <td><div class="cellflex"><span class="avatar" style="width:24px;height:24px;font-size:10px">${a.who.split(' ').map(w=>w[0]).join('').slice(0,2)}</span>${a.who}</div></td>
      <td><span class="badge" style="background:transparent;border:1px solid var(--border);color:${actColor[a.act]||'var(--neutral-600)'};text-transform:capitalize">${a.act}</span></td>
      <td class="cell-strong" style="font-size:13px">${a.ent}</td>
      <td class="mono cell-muted" style="font-size:12px">${a.chg}</td>
      <td><span class="badge badge-outline">${a.src}</span></td>
    </tr>`).join(''));

  /* ---------- sync events ---------- */
  const sync = [
    { ev:'Price update',  tag:'ESL-4503', type:'Price',  res:'pending', lat:'—',    rt:'0', time:'just now',  f:'pending' },
    { ev:'Price update',  tag:'ESL-4488', type:'Price',  res:'failed',  lat:'8.0s', rt:'3', time:'4m ago',    f:'failed'  },
    { ev:'Status change', tag:'ESL-4471', type:'Status', res:'synced',  lat:'0.9s', rt:'0', time:'2m ago',    f:'all'     },
    { ev:'Full refresh',  tag:'ESL-4472', type:'Refresh',res:'synced',  lat:'1.4s', rt:'0', time:'8m ago',    f:'all'     },
    { ev:'Price update',  tag:'ESL-4419', type:'Price',  res:'synced',  lat:'1.1s', rt:'1', time:'31m ago',   f:'all'     },
    { ev:'Pairing',       tag:'ESL-4456', type:'Pair',   res:'failed',  lat:'12.0s',rt:'2', time:'2h ago',    f:'failed'  },
    { ev:'Status change', tag:'ESL-4511', type:'Status', res:'synced',  lat:'0.8s', rt:'0', time:'18m ago',   f:'all'     },
  ];
  function renderSync(filter) {
    const rows = sync.filter(s => filter === 'all' ? true : s.f === filter);
    const has = rows.length > 0;
    $('#syncTableCard').style.display = has ? '' : 'none';
    $('#syncEmpty').style.display = has ? 'none' : 'block';
    set('syncRows', rows.map(s => `
      <tr>
        <td class="cell-strong" style="font-size:13px">${s.ev}</td>
        <td class="mono" style="font-size:12.5px;color:var(--green-700)">${s.tag}</td>
        <td class="cell-muted">${s.type}</td>
        <td>${badge[s.res]}</td>
        <td class="num">${s.lat}</td>
        <td class="num cell-muted">${s.rt}</td>
        <td class="cell-muted" style="font-size:12.5px">${s.time}</td>
      </tr>`).join(''));
  }
  renderSync('all');
  $$('#syncSeg button').forEach(b => b.addEventListener('click', () => {
    $$('#syncSeg button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    renderSync(b.dataset.f);
  }));

  /* ---------- dashboard: needs attention ---------- */
  set('attnRows', [
    { v:'2023 Tesla Model 3',    t:'ESL-4488', i:'Sync failed · retry 3/3', s:'failed'  },
    { v:'2022 Jeep Grand Cherokee',t:'ESL-4456',i:'Tag offline · low battery', s:'offline' },
    { v:'2024 Ford F-150 Lariat',t:'ESL-4503', i:'Price update queued',     s:'pending' },
    { v:'2020 Subaru Outback',   t:'—',        i:'No tag assigned',          s:'offline' },
  ].map(r => `
    <tr>
      <td class="cell-strong" style="font-size:13px">${r.v}</td>
      <td class="mono" style="font-size:12.5px;color:${r.t==='—'?'var(--neutral-400)':'var(--green-700)'}">${r.t}</td>
      <td class="cell-muted" style="font-size:12.5px">${r.i}</td>
      <td>${badge[r.s]}</td>
    </tr>`).join(''));

  /* ---------- dashboard: activity feed ---------- */
  const feedIcon = {
    pair:  ['var(--green-50)','var(--green-700)','<path d="M9 7H6a3 3 0 0 0 0 6h3M15 7h3a3 3 0 0 1 0 6h-3M8 10h8"/>'],
    price: ['var(--status-info-bg)','var(--status-info)','<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'],
    fail:  ['var(--status-failed-bg)','var(--status-failed)','<path d="M12 8v4M12 16h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'],
    sold:  ['var(--neutral-100)','var(--neutral-600)','<path d="M20 6 9 17l-5-5"/>'],
  };
  function feed(type, title, meta, time) {
    const [bg, fg, p] = feedIcon[type];
    return `<div class="feed-item">
      <span class="feed-dot" style="background:${bg};color:${fg}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg></span>
      <div class="feed-main"><div class="feed-title">${title}</div><div class="feed-meta">${meta}</div></div>
      <span class="feed-time">${time}</span>
    </div>`;
  }
  set('dashFeed',
    feed('pair',  '<strong>M. Cole</strong> paired <span class="mono">ESL-4471</span>', 'RAV4 XLE · Mobile', '2m') +
    feed('price', 'Price synced to <span class="mono">ESL-4419</span>', 'BMW X3 · $37,995', '31m') +
    feed('fail',  'Sync failed on <span class="mono">ESL-4488</span>', 'Tesla Model 3 · retry 3/3', '4m') +
    feed('sold',  'Outback Premium marked <strong>Sold</strong>', 'DMS auto-update', '1h') +
    feed('pair',  '<strong>J. Pratt</strong> unpaired <span class="mono">ESL-4399</span>', 'X5 sold · Mobile', '2h')
  );

  /* ---------- dashboard bars ---------- */
  function bars(id, data, accentLast) {
    set(id, data.map((d, i) => {
      const muted = accentLast && i < data.length - 1 ? '' : '';
      return `<div class="bar"><div class="b${muted}" style="height:${d.h}%"></div><span>${d.l}</span></div>`;
    }).join(''));
  }
  bars('dashBars', [
    {l:'Mon',h:52},{l:'Tue',h:68},{l:'Wed',h:61},{l:'Thu',h:84},{l:'Fri',h:96},{l:'Sat',h:73},{l:'Sun',h:44},
  ]);

  /* ---------- reports ---------- */
  set('repBars', [
    {l:'Northgate',h:99.4},{l:'Westpark',h:98.9},{l:'Riverside',h:99.6},{l:'Summit',h:97.8},{l:'Harbor',h:99.1},{l:'Crossroads',h:98.2},
  ].map(d => `<div class="bar"><div class="b" style="height:${(d.h-96)/4*100}%"></div><span>${d.l}<br><strong class="mono" style="color:var(--foreground);font-size:11px">${d.h}%</strong></span></div>`).join(''));

  const reps = [
    { r:'Northgate Toyota',  v:742, t:728, cov:'98.1%', pair:'6.9s', suc:'99.4%' },
    { r:'Westpark Honda',    v:613, t:589, cov:'96.1%', pair:'7.2s', suc:'98.9%' },
    { r:'Riverside Ford',    v:884, t:861, cov:'97.4%', pair:'7.0s', suc:'99.6%' },
    { r:'Summit BMW',        v:421, t:402, cov:'95.5%', pair:'8.1s', suc:'97.8%' },
    { r:'Harbor Subaru',     v:534, t:521, cov:'97.6%', pair:'7.4s', suc:'99.1%' },
    { r:'Crossroads CDJR',   v:716, t:680, cov:'95.0%', pair:'7.9s', suc:'98.2%' },
  ];
  set('repRows', reps.map(r => `
    <tr>
      <td class="cell-strong" style="font-size:13px">${r.r}</td>
      <td class="num">${r.v.toLocaleString()}</td>
      <td class="num">${r.t.toLocaleString()}</td>
      <td class="num">${r.cov}</td>
      <td class="num">${r.pair}</td>
      <td class="num" style="color:var(--green-700);font-weight:500">${r.suc}</td>
    </tr>`).join(''));

  /* ---------- segment toggles (generic, non-sync) ---------- */
  $$('.seg').forEach(seg => {
    if (seg.id === 'syncSeg') return;
    seg.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', seg).forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    });
  });

  /* ---------- filter pills toggle ---------- */
  $$('.filter-pill').forEach(p => p.addEventListener('click', () => p.classList.toggle('on')));

})();
