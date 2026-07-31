
/* ========= Storage ========= */
const KEY = 'wh_app_sidebar_test';
const defaultState = () => {
  const makeDate = daysAgo => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    return {
      hijri: toHijri(date),
      day: ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][date.getDay()]
    };
  };

  const employees = Array.from({ length: 15 }, (_, i) => ({
    id: `demo-emp-${i + 1}`,
    name: `موظف تجريبي ${String(i + 1).padStart(2, '0')}`,
    phone: `050000${String(i + 1).padStart(4, '0')}`,
    department: i % 5,
    notes: 'بيانات تجريبية'
  }));

  const warehouseNumbers = Array.from({ length: 30 }, (_, i) => {
    const group = String.fromCharCode(65 + Math.floor(i / 10));
    return `${group}${String((i % 10) + 1).padStart(2, '0')}`;
  });

  const warehouses = warehouseNumbers.map((number, i) => ({
    id: `demo-wh-${i + 1}`,
    number,
    location: `المبنى ${(i % 3) + 1}`,
    notes: 'مستودع تجريبي'
  }));

  const assignments = [];

  // 24 مستودعًا مشغولًا حاليًا = 80%
  for(let i = 0; i < 24; i++){
    const received = makeDate(i % 18);
    assignments.push({
      id: `demo-active-${i + 1}`,
      warehouseId: warehouses[i].id,
      employeeId: employees[i % employees.length].id,
      receivedAt: received.hijri,
      receivedDay: received.day,
      returnedAt: null,
      returnedDay: null,
      handoverReason: '',
      notes: 'عهدة تجريبية نشطة'
    });
  }

  // حركات سابقة لمستودعات مشغولة حاليًا
  for(let i = 0; i < 12; i++){
    const activeReceivedDaysAgo = i % 18;
    const returned = makeDate(activeReceivedDaysAgo + 1);
    const received = makeDate(activeReceivedDaysAgo + 21);

    assignments.push({
      id: `demo-history-${i + 1}`,
      warehouseId: warehouses[i].id,
      employeeId: employees[(i + 5) % employees.length].id,
      receivedAt: received.hijri,
      receivedDay: received.day,
      returnedAt: returned.hijri,
      returnedDay: returned.day,
      handoverReason: 'جاهز ونظيف',
      notes: 'حركة سابقة تجريبية'
    });
  }

  // سجل سابق للمستودعات الستة الفارغة حاليًا
  for(let i = 24; i < 30; i++){
    const returned = makeDate(i - 24);
    const received = makeDate((i - 24) + 15);

    assignments.push({
      id: `demo-free-history-${i + 1}`,
      warehouseId: warehouses[i].id,
      employeeId: employees[(i + 3) % employees.length].id,
      receivedAt: received.hijri,
      receivedDay: received.day,
      returnedAt: returned.hijri,
      returnedDay: returned.day,
      handoverReason: 'جاهز ونظيف',
      notes: 'مستودع فارغ بعد الاستلام'
    });
  }

  return {
    users: [
      { id: 'u1', username: 'admin', password: '1234', role: 'admin' },
      { id: 'u2', username: 'user', password: '1234', role: 'user' }
    ],
    employees,
    warehouses,
    assignments,
    departments: [
      'القسم الأول',
      'القسم الثاني',
      'القسم الثالث',
      'القسم الرابع',
      'القسم الخامس'
    ]
  };
};
function load(){
  try{
    const r = localStorage.getItem(KEY);
    if(r){
      const s = JSON.parse(r);
      // ضمان توافر حقل الأقسام للحالات القديمة
      if(!Array.isArray(s.departments) || s.departments.length<5){
        s.departments = ['القسم الأول','القسم الثاني','القسم الثالث','القسم الرابع','القسم الخامس'];
      }
      return s;
    }
  }catch(e){}
  const s = defaultState(); save(s); return s;
}
function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
let state = load();
let session = null;
const uid = () => Math.random().toString(36).slice(2,10);
function toHijri(d){
  if(!d) return '';
  const date = (d instanceof Date) ? d : new Date(d);
  if(isNaN(date.getTime())) return String(d);
  try{
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{year:'numeric',month:'2-digit',day:'2-digit'});
    const parts = f.formatToParts(date);
    const y = parts.find(p=>p.type==='year').value.replace(/\D/g,'');
    const m = parts.find(p=>p.type==='month').value.padStart(2,'0');
    const day = parts.find(p=>p.type==='day').value.padStart(2,'0');
    return `${y}/${m}/${day}`;
  }catch(e){ return date.toISOString().slice(0,10); }
}
function toast(msg, type){
  type = type||'info';
  const container = document.getElementById('toast-container');
  if(!container) return;
  const el = document.createElement('div');
  el.className = 'toast-msg ' + type;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(()=>{
    el.style.animation='toastOut .3s ease forwards';
    setTimeout(()=>el.remove(), 320);
  }, 3000);
}

function fmtDate(s){
  if(!s) return '-';
  let canonical;
  if(/^\d{4}\/\d{2}\/\d{2}$/.test(s)) canonical = s;
  else if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)){
    const p = s.split('/'); canonical = `${p[2]}/${p[1].padStart(2,'0')}/${p[0].padStart(2,'0')}`;
  }
  else if(/\u0647\u064f/.test(s)){
    const clean = s.replace(/\s*\u0647\u064f\s*$/,'').trim();
    const parts2 = clean.split(/[-\/]/);
    canonical = parts2.length===3 ? `${parts2[0].padStart(4,'0')}/${parts2[1].padStart(2,'0')}/${parts2[2].padStart(2,'0')}` : clean;
  }
  else if(/^\d{4}-\d{2}-\d{2}$/.test(s)) canonical = toHijri(s);
  else return s;
  return dispDate(canonical);
}
const today = () => toHijri(new Date());
const todayISO = () => { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
/* تحويل أرقام لاتينية → عربية هندية والعكس */
const AR_INDIC = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
const arDigits = s => String(s ?? '').replace(/[0-9]/g, d => AR_INDIC[+d]);
const toLatinDigits = s => String(s||'').replace(/[٠-٩]/g, d => String(AR_INDIC.indexOf(d)));
/* صيغة العرض: تاريخ هجري بالأرقام العربية الهندية بصيغة سنة/شهر/يوم */
function dispDate(s){
  if(!s) return '';
  const t = toLatinDigits(String(s).trim());
  let canonical;
  const m1 = t.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if(m1) canonical = `${m1[1]}/${m1[2].padStart(2,'0')}/${m1[3].padStart(2,'0')}`;
  else {
    const m2 = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(m2) canonical = `${m2[3]}/${m2[2].padStart(2,'0')}/${m2[1].padStart(2,'0')}`;
    else return t;
  }
  return arDigits(canonical);
}
/* تحويل صيغة العرض إلى canonical (سنة/شهر/يوم لاتيني) */
function parseDispDate(s){
  if(!s) return '';
  const t = toLatinDigits(String(s).trim());
  const m1 = t.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if(m1) return `${m1[1]}/${m1[2].padStart(2,'0')}/${m1[3].padStart(2,'0')}`;
  const m2 = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m2) return `${m2[3]}/${m2[2].padStart(2,'0')}/${m2[1].padStart(2,'0')}`;
  return t;
}
const todayDisp = () => dispDate(today());
/* اسم اليوم بالعربية */
const AR_DAYS = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
function dayName(d){
  const date = (d instanceof Date) ? d : new Date(d);
  if(isNaN(date.getTime())) return '';
  return AR_DAYS[date.getDay()];
}
const todayDay = () => dayName(new Date());
/* Modern date input: gregorian picker + live hijri preview. Returns hijri string on save. */
function modernDate(id, label){
  return `<div class="field">
    <label>${label}</label>
    <div class="mdate">
      <input id="${id}" type="date" value="${todayISO()}" oninput="document.getElementById('${id}_h').textContent = dispDate(toHijri(this.value||new Date()))" />
      <div class="mdate-hijri">📅 الهجري: <span id="${id}_h">${todayDisp()}</span></div>
    </div>
  </div>`;
}
function readModernDate(id){ const v = document.getElementById(id).value; return v ? toHijri(v) : today(); }
const esc = s => String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ========= Auth ========= */
function doLogin(){
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginErr');
  const user = state.users.find(x => x.username === u && x.password === p);
  if(!user){ err.textContent = 'بيانات الدخول غير صحيحة'; return; }
  err.textContent = '';
  session = user;
  sessionStorage.setItem('wh_session', user.id);
  showApp();
}
function doLogout(){
  session = null;
  sessionStorage.removeItem('wh_session');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginUsername').value='';
  document.getElementById('loginPassword').value='';
}
function restoreSession(){
  const id = sessionStorage.getItem('wh_session');
  if(!id) return false;
  const u = state.users.find(x => x.id === id);
  if(!u) return false;
  session = u; return true;
}
function showApp(){
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('currentUserLabel').textContent = session.username;
  document.getElementById('currentRoleLabel').textContent = session.role==='admin'?'مدير':'مستخدم';
  nav('dashboard');
}

/* ========= Theme ========= */
const THEME_KEY = 'wh_theme';
function applyTheme(theme){
  const t = (theme === 'dark') ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  try{ localStorage.setItem(THEME_KEY, t); }catch(e){}
  const btn = document.getElementById('themeToggleBtn');
  if(btn) btn.title = (t==='dark') ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن';
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}
(function initTheme(){
  let saved = null;
  try{ saved = localStorage.getItem(THEME_KEY); }catch(e){}
  if(!saved){
    saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  applyTheme(saved);
})();

/* ========= Nav ========= */
let current = 'dashboard';
function nav(p){
  current = p;
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.page === p));
  if(p==='dashboard') renderDashboard();
  else if(p==='custody') renderCustody();
  else if(p==='free-warehouses') renderFreeWarehouses();
  else if(p==='warehouses') renderWarehouses();
  else if(p==='employees') renderEmployees();
  else if(p==='assignments') renderAssignments();
  else if(p==='users'){ if(!isAdmin()){ toast('يتطلب صلاحية المسؤول', 'error'); current='settings'; renderSettings(); return; } renderUsers(); }
  else if(p==='reports') renderReports();
  else if(p==='statistics') renderStatistics();
  else if(p==='settings') renderSettings();
}

/* ========= Helpers ========= */
const isAdmin = () => session?.role === 'admin';
function activeAssignmentForWarehouse(wid){
  return state.assignments.find(a => a.warehouseId === wid && !a.returnedAt);
}
function activeAssignmentsForEmployee(eid){
  return state.assignments.filter(a => a.employeeId === eid && !a.returnedAt);
}
function empName(id){ return state.employees.find(e => e.id===id)?.name || '-'; }
function whNumber(id){ return state.warehouses.find(w => w.id===id)?.number || '-'; }

function showEmpDetails(id){
  const e = state.employees.find(x => x.id===id); if(!e) return;
  const active = activeAssignmentsForEmployee(id);
  const rows = active.map(a => {
    const w = state.warehouses.find(x => x.id===a.warehouseId);
    return `<tr>
      <td style="white-space:nowrap"><b>${esc(w?.number||'-')}</b></td>
      <td style="white-space:nowrap;direction:ltr;text-align:right">${esc(fmtDate(a.receivedAt))}</td>
      <td>${esc(w?.location||'-')}</td>
      <td style="font-size:.82rem;color:var(--muted)">${esc(a.notes || w?.notes || '-')}</td>
    </tr>`;
  }).join('');
  modal(`
    <h3 style="margin-bottom:.75rem">👤 تفاصيل عهدة الموظف</h3>
    <div style="background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.85rem 1.1rem;margin-bottom:1rem;display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem 1rem;font-size:.9rem">
      <div><span style="color:var(--muted)">الاسم:</span> <b>${esc(e.name)}</b></div>
      <div><span style="color:var(--muted)">الجوال:</span> <b>${esc(e.phone||'-')}</b></div>
      <div><span style="color:var(--muted)">عدد المستودعات:</span> <b style="color:var(--primary)">${active.length}</b></div>
      ${e.notes?`<div style="grid-column:1/-1"><span style="color:var(--muted)">ملاحظات:</span> ${esc(e.notes)}</div>`:''}
    </div>
    ${active.length===0
      ? `<div class="empty">لا توجد مستودعات مسندة حالياً</div>`
      : `<div style="max-height:480px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="sticky-thead"><thead><tr><th style="width:14%">رقم المستودع</th><th style="width:18%">تاريخ التسليم للموظف</th><th style="width:25%">الموقع</th><th style="width:43%">ملاحظات</th></tr></thead><tbody>${rows}</tbody></table></div>`}
    <div class="modal-actions" style="margin-top:1rem;flex-wrap:wrap">
      ${isAdmin()?`
      <button class="btn btn-success" onclick="closeModal();openHandover('${id}')">📤 تسليم مستودع للموظف</button>
      <button class="btn btn-primary" onclick="closeModal();openReceive('${id}')">📥 استلام مستودع من الموظف</button>
      `:''}
      <button class="btn btn-ghost" onclick="closeModal()">إغلاق</button>
    </div>
  `, {wide: 880});
}

/* عرض تفاصيل مستودع + زر استلام سريع من الموظف */
function showWarehouseDetails(wid){
  const w = state.warehouses.find(x => x.id===wid); if(!w) return;
  const a = activeAssignmentForWarehouse(wid);
  const history = state.assignments.filter(x => x.warehouseId===wid).slice().reverse();
  const histRows = history.map(h => `<tr>
      <td><b>${esc(empName(h.employeeId))}</b></td>
      <td style="white-space:nowrap;direction:ltr;text-align:right">${esc(fmtDate(h.receivedAt))}</td>
      <td style="white-space:nowrap;direction:ltr;text-align:right">${h.returnedAt?esc(fmtDate(h.returnedAt)):'<span class="badge badge-busy">نشط</span>'}</td>
      <td style="font-size:.82rem;color:var(--muted)">${esc(h.notes||'-')}</td>
    </tr>`).join('');
  modal(`
    <h3 style="margin-bottom:.75rem">🏷️ تفاصيل المستودع ${esc(w.number)}</h3>
    <div style="background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.85rem 1.1rem;margin-bottom:1rem;display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem 1rem;font-size:.9rem">
      <div><span style="color:var(--muted)">الرقم:</span> <b>${esc(w.number)}</b></div>
      <div><span style="color:var(--muted)">الموقع:</span> <b>${esc(w.location||'-')}</b></div>
      <div><span style="color:var(--muted)">الحالة:</span> ${a?`<b style="color:var(--danger)">مشغول</b>`:'<b style="color:var(--success)">شاغر</b>'}</div>
      ${a?`<div style="grid-column:1/-1"><span style="color:var(--muted)">العهدة الحالية:</span> <b>${esc(empName(a.employeeId))}</b> <span style="color:var(--muted)">— مستلم منذ</span> <span style="direction:ltr;display:inline-block;font-weight:600">${esc(fmtDate(a.receivedAt))}</span></div>`:''}
      ${w.notes?`<div style="grid-column:1/-1"><span style="color:var(--muted)">ملاحظات:</span> ${esc(w.notes)}</div>`:''}
    </div>
    ${a && isAdmin() ? `
    <div id="handoverSection" style="margin:.75rem 0">
      <button class="btn btn-primary" onclick="toggleHandoverForm()" id="handoverToggleBtn">📥 استلام من الموظف</button>
      <div id="handoverForm" style="display:none;margin-top:.75rem;background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.85rem 1rem">
        <div class="field"><label>تاريخ الاستلام من الموظف</label>
          <input id="detail_handover_date" type="text" value="${todayDisp()}" placeholder="١٤٤٧/١٢/٠٥" style="direction:ltr;text-align:right" />
        </div>
        <div class="field"><label>حالة المستودع عند الاستلام *</label>
          <select id="detail_handover_reason">
            <option value="فارغة">فارغة</option>
            <option value="للصيانة">للصيانة</option>
          </select>
        </div>
        <div style="display:flex;gap:.5rem;margin-top:.5rem">
          <button class="btn btn-primary" onclick="confirmDetailHandover('${a.id}')">✓ تأكيد الاستلام</button>
          <button class="btn btn-ghost" onclick="toggleHandoverForm()">إلغاء</button>
        </div>
      </div>
    </div>` : ''}
    <div style="font-weight:600;margin:.75rem 0 .5rem">📜 سجل العهدة (${history.length})</div>
    ${history.length===0 ? `<div class="empty">لا يوجد سجل</div>` :
      `<div style="max-height:420px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="sticky-thead"><thead><tr><th style="width:25%">الموظف</th><th style="width:18%">تاريخ التسليم للموظف</th><th style="width:18%">تاريخ الاستلام منه</th><th style="width:39%">ملاحظات</th></tr></thead><tbody>${histRows}</tbody></table></div>`}
    <div class="modal-actions" style="margin-top:1rem;flex-wrap:wrap">
      ${!a && isAdmin() ? `<button class="btn btn-success" onclick="closeModal();openHandoverForFree('${wid}')">📤 تسليم المستودع لموظف</button>` : ''}
      <button class="btn btn-ghost" onclick="closeModal()">إغلاق</button>
    </div>
  `, {wide: 880});
}

/* استلام سريع لمستودع من موظف */
function quickHandover(aid){
  const a = state.assignments.find(x => x.id===aid); if(!a) return;
  const w = state.warehouses.find(x => x.id===a.warehouseId);
  modal(`
    <h3>📥 استلام المستودع ${esc(w?.number||'')} من الموظف</h3>
    <p style="color:var(--muted);font-size:.85rem;margin:.25rem 0 .75rem">الموظف: <b>${esc(empName(a.employeeId))}</b> — مستلم منذ ${esc(fmtDate(a.receivedAt))}</p>
    ${modernDate('qh_date','تاريخ الاستلام من الموظف *')}
    <div class="field"><label>حالة المستودع عند الاستلام *</label>
      <select id="qh_reason">
        <option value="فارغة">فارغة</option>
        <option value="للصيانة">للصيانة</option>
      </select>
    </div>
    <div class="field"><label>حالة المستودع عند التسليم</label>
      <select id="qh_cond">
        <option value="سليم وفارغ">سليم وفارغ</option>
        <option value="يحتاج صيانة">يحتاج صيانة</option>
        <option value="ملاحظات أخرى">ملاحظات أخرى</option>
      </select>
    </div>
    <div class="field"><label>ملاحظات</label><textarea id="qh_notes" rows="2"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="saveQuickHandover('${aid}')">✓ تأكيد الاستلام</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`);
}
function saveQuickHandover(aid){
  const a = state.assignments.find(x => x.id===aid); if(!a) return;
  const d = readModernDate('qh_date');
  const reason = document.getElementById('qh_reason')?.value || 'فارغة';
  const cond = document.getElementById('qh_cond').value;
  const extra = document.getElementById('qh_notes').value.trim();
  a.returnedAt = d;
  a.handoverReason = reason;
  const tag = `[استلام ${dispDate(d)} — ${reason} — ${cond}${extra?': '+extra:''}]`;
  a.notes = a.notes ? (a.notes + ' ' + tag) : tag;
  save(state); closeModal(); renderDashboard();
  toast('✓ تم استلام المستودع من الموظف بتاريخ ' + dispDate(d) + ' — أصبح فارغاً', 'success');
}

function modal(html, opts){
  // جميع النوافذ ثابتة افتراضياً: لا تُغلق عند الضغط خارجها — استخدم زر "إلغاء/إغلاق"
  const wide = opts && opts.wide;
  const styleAttr = wide ? ` style="max-width:min(${typeof wide==='number'?wide:720}px,96vw);width:100%"` : '';
  document.getElementById('modalMount').innerHTML =
    `<div class="modal-back"><div class="modal"${styleAttr}>${html}</div></div>`;
}
function closeModal(){ document.getElementById('modalMount').innerHTML=''; }

/* ========= Dashboard ========= */
function renderDashboard(){
  const total = state.warehouses.length;
  const busy = state.warehouses.filter(w => activeAssignmentForWarehouse(w.id)).length;
  const free = total - busy;
  const empCount = state.employees.length;
  const pBusy = total ? Math.round(busy*100/total) : 0;
  const pFree = total ? Math.round(free*100/total) : 0;

  const freeList = state.warehouses.filter(w => !activeAssignmentForWarehouse(w.id))
    .map(w => `<tr><td><a class="wh-link" onclick="closeWarehousesModal();showWarehouseDetails('${w.id}')">${esc(w.number)}</a></td><td style="text-align:center"><span class="badge badge-free">شاغر</span></td><td>${esc(w.location||'-')}</td><td><button class="btn btn-success btn-sm" onclick="openHandoverForFree('${w.id}')">📤 تسليم</button></td></tr>`).join('');

  // Received: group by employee (no name repetition)
  const empGroups = {};
  state.warehouses.forEach(w => {
    const a = activeAssignmentForWarehouse(w.id);
    if(!a) return;
    if(!empGroups[a.employeeId]) empGroups[a.employeeId] = { emp: a.employeeId, items: [] };
    empGroups[a.employeeId].items.push({ w, a });
  });
  const empGroupRows = Object.values(empGroups)
    .sort((x,y)=> empName(x.emp).localeCompare(empName(y.emp),'ar'))
    .map(g => {
      return `<tr>
        <td style="max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><a class="emp-link" onclick="showEmpDetails('${g.emp}')" title="${esc(empName(g.emp))}">${esc(empName(g.emp))}</a></td>
        <td style="width:140px;white-space:nowrap;text-align:center"><span class="badge badge-busy">${g.items.length}</span></td>
      </tr>`;
    }).join('');

  // Middle column: all warehouses as chips with status
  const allWhChips = state.warehouses
    .slice()
    .sort((a,b)=> String(a.number).localeCompare(String(b.number),'ar',{numeric:true}))
    .map(w => {
      const a = activeAssignmentForWarehouse(w.id);
      const cls = a ? 'busy' : 'free';
      const tip = a ? `${empName(a.employeeId)} — ${fmtDate(a.receivedAt)}` : 'شاغر';
      return `<span class="wh-chip ${cls}" onclick="showWarehouseDetails('${w.id}')" title="${esc(tip)}"><span class="dot"></span>${esc(w.number)}</span>`;
    }).join('');

  document.getElementById('main').innerHTML = `
    <div class="page-head">
      <div class="title">
        <h1>اللوحة الرئيسية</h1>
        <div class="desc">نظرة عامة على حركة المستودعات</div>
      </div>
      <div class="dash-toolbar">
        <div class="search" style="min-width:260px;flex:0 1 320px">
          <input id="dashSearch" placeholder="ابحث برقم المستودع أو اسم الموظف..." oninput="dashFilter()" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        ${isAdmin()?`
        <div class="action-bar">
          <button class="btn btn-success" onclick="openHandover()" title="تسليم مستودع فارغ لموظف (يصبح بعهدته)">📤 تسليم مستودع لموظف</button>
          <button class="btn btn-primary" onclick="openReceive()" title="استلام مستودع من موظف (يصبح فارغاً)">📥 استلام مستودع من موظف</button>
          
          
        </div>`:''}
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-icon si-violet"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
        <div class="meta"><div class="l">الموظفون</div><div class="v">${empCount}</div></div>
      </div>
      <div class="stat">
        <div class="stat-icon si-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
        <div class="meta"><div class="l">المستودعات بعهدة الموظفين</div><div class="v">${busy}</div></div>
      </div>
      <div class="stat">
        <div class="stat-icon si-amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
        <div class="meta"><div class="l">المستودعات الفارغة</div><div class="v">${free}</div></div>
      </div>
      <div class="stat">
        <div class="stat-icon si-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>
        <div class="meta"><div class="l">إجمالي المستودعات</div><div class="v">${total}</div></div>
      </div>
    </div>

    <div class="card dept-card">
      <div class="card-h" style="margin-bottom:.65rem">
        <div class="ttl">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          الأقسام
        </div>
        ${isAdmin()?`
          <div style="display:flex;gap:.4rem;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="openDeptEdit()" title="تعديل ونقل الموظفين بين الأقسام">✏️ تعديل</button>
            <button class="btn btn-ghost btn-sm" onclick="openDeptSettings()" title="تغيير أسماء الأقسام">⚙️ تغيير أسماء الأقسام</button>
          </div>`:''}
      </div>
      <div class="dept-buttons">
        ${state.departments.map((name, i) => {
          const empsInDept = state.employees.filter(e => e.department === i);
          const empCount = empsInDept.length;
          const whCount = empsInDept.reduce((sum, e) => sum + activeAssignmentsForEmployee(e.id).length, 0);
          return `<button class="dept-btn dept-btn-${i+1}" onclick="openDeptModal(${i})">
            <span class="dept-name">${esc(name)}</span>
            <span class="dept-meta">
              <span class="dept-meta-item"><span class="dept-meta-lbl">الموظفون</span><span class="dept-count">${empCount}</span></span>
              <span class="dept-meta-item"><span class="dept-meta-lbl">المستودعات</span><span class="dept-count">${whCount}</span></span>
            </span>
          </button>`;
        }).join('')}
      </div>
    </div>

    <div class="split3">
      <div class="card">
        <div class="card-h"><div class="ttl">
          <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          المستودعات بعهدة الموظفين (${busy})
        </div><input id="recvEmpSearch" placeholder="ابحث باسم الموظف..." oninput="filterRecvEmp()" style="width:160px;padding:.35rem .6rem;border:1px solid var(--border);border-radius:8px;font-size:.8rem;font-family:inherit" /></div>
        ${Object.keys(empGroups).length===0 ? `<div class="empty">لا توجد نتائج</div>` :
          `<div style="max-height:340px;overflow:auto"><table id="recvEmpTable"><thead><tr><th>الموظف</th><th style="width:140px;white-space:nowrap;text-align:center">عدد المستودعات</th></tr></thead><tbody>${empGroupRows}</tbody></table></div>`}
      </div>
      <div class="card">
        <div class="card-h"><div class="ttl">
          <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          المستودعات (${total})
        </div><input id="allWhSearch" placeholder="ابحث برقم المستودع..." oninput="filterAllWh()" style="width:160px;padding:.35rem .6rem;border:1px solid var(--border);border-radius:8px;font-size:.8rem;font-family:inherit" /></div>
        ${total===0 ? `<div class="empty">لا توجد مستودعات</div>` :
          `<div id="allWhChipsBox" class="wh-chips" style="max-height:340px;overflow:auto">${allWhChips}</div>`}
      </div>
      <div class="card">
        <div class="card-h"><div class="ttl">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          المستودعات الفارغة (${free})
        </div></div>
        <div style="padding:.5rem .25rem .75rem">
          <input id="freeWhSearch" placeholder="ابحث برقم..." oninput="filterFreeWh()" style="width:100%;box-sizing:border-box;padding:.45rem .7rem;border:1px solid var(--border);border-radius:8px;font-size:.85rem;font-family:inherit" />
        </div>
        ${free===0 ? `<div class="empty">لا توجد نتائج</div>` :
          `<div style="max-height:340px;overflow:auto"><table id="freeWhTable"><thead><tr><th>الرقم</th><th>الحالة</th><th>الموقع</th><th>إجراء</th></tr></thead><tbody>${freeList}</tbody></table></div>`}
      </div>
    </div>

    <div class="card">
      <div class="card-h"><div class="ttl">نسبة التوزيع</div></div>
      <div class="dist">
        <div class="row"><div class="lbl"><span>مستلمة</span><span>${busy} / ${total} (${pBusy}%)</span></div><div class="bar bar-green"><span style="width:${pBusy}%"></span></div></div>
        <div class="row"><div class="lbl"><span>فارغة</span><span>${free} / ${total} (${pFree}%)</span></div><div class="bar bar-amber"><span style="width:${pFree}%"></span></div></div>
      </div>
    </div>

    `; // employee-card removed
}
function dashFilter(){
  const q = document.getElementById('dashSearch').value.trim().toLowerCase();
  document.querySelectorAll('.card tbody tr').forEach(tr => {
    tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
function filterFreeWh(){
  const q = (document.getElementById('freeWhSearch')?.value || '').trim().toLowerCase();
  const tbl = document.getElementById('freeWhTable');
  if(!tbl) return;
  tbl.querySelectorAll('tbody tr').forEach(tr => {
    tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
function filterRecvEmp(){
  const q = (document.getElementById('recvEmpSearch')?.value || '').trim().toLowerCase();
  const tbl = document.getElementById('recvEmpTable');
  if(!tbl) return;
  tbl.querySelectorAll('tbody tr').forEach(tr => {
    tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
function filterAllWh(){
  const q = (document.getElementById('allWhSearch')?.value || '').trim().toLowerCase();
  const box = document.getElementById('allWhChipsBox');
  if(!box) return;
  box.querySelectorAll('.wh-chip').forEach(chip => {
    chip.style.display = !q || chip.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/* ========= Warehouses ========= */
function renderWarehouses(){
  const rows = state.warehouses.map(w => {
    const a = activeAssignmentForWarehouse(w.id);
    const status = a ? `<span class="badge badge-busy">مشغول — ${esc(empName(a.employeeId))}</span>` : `<span class="badge badge-free">شاغر</span>`;
    return `<tr>
      <td>${esc(w.number)}</td>
      <td>${esc(w.location||'-')}</td>
      <td>${status}</td>
      <td>${esc(w.notes||'-')}</td>
      <td>${isAdmin() ? `
          <button class="btn btn-sm btn-ghost" onclick="editWarehouse('${w.id}')">تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="delWarehouse('${w.id}')">حذف</button>`:''}</td>
    </tr>`;
  }).join('');
  document.getElementById('main').innerHTML = `
    <div class="page-head">
      ${isAdmin()?`<div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="addWarehouse()">+ مستودع جديد</button>
        <button class="btn btn-ghost" onclick="addWarehouseRange()">+ نطاق</button>
      </div>`:'<span></span>'}
      <div class="title"><h1>المستودعات</h1><div class="desc">إدارة وعرض جميع المستودعات</div></div>
    </div>
    <div class="card">
      ${state.warehouses.length===0 ? `<div class="empty">لا توجد مستودعات بعد</div>` :
      (state.warehouses.length > 10
        ? `<div style="max-height:440px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="wh-table"><thead><tr><th>الرقم</th><th>الموقع</th><th>الحالة</th><th>ملاحظات</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
           <div class="hint" style="margin-top:.5rem;text-align:center">عرض ${state.warehouses.length} مستودعاً — مرّر للأسفل لرؤية الباقي</div>`
        : `<table><thead><tr><th>الرقم</th><th>الموقع</th><th>الحالة</th><th>ملاحظات</th><th></th></tr></thead><tbody>${rows}</tbody></table>`)}
    </div>`;
}
function addWarehouse(){
  const opts = state.employees.map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join('');
  modal(`
    <h3>مستودع جديد</h3>
    <div class="field"><label>رقم المستودع *</label><input id="w_num" placeholder="مثال: A05" oninput="this.value=this.value.toUpperCase()" /></div>
    <div class="field"><label>ملاحظات</label><textarea id="w_notes" rows="2"></textarea></div>
    <div class="field"><label>إسناد لموظف (اختياري)</label>
      <select id="w_emp"><option value="">— بدون —</option>${opts}</select>
    </div>
    <div class="field"><label>تاريخ التسليم للموظف (هجري)</label><input id="w_date" type="text" value="${todayDisp()}" placeholder="١٤٤٧/١٢/٠٥" style="direction:ltr;text-align:right" /></div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveNewWarehouse()">حفظ</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`);
}
function saveNewWarehouse(){
  const num = document.getElementById('w_num').value.trim().toUpperCase();
  if(!num) return toast('رقم المستودع مطلوب', 'error');
  if(!/^[A-Z]\d{2}$/.test(num)) return toast('صيغة رقم المستودع: حرف إنجليزي + رقمين (مثال: A05)', 'error');
  if(state.warehouses.some(w => w.number === num)) return toast('هذا الرقم موجود مسبقاً', 'error');
  const w = { id: uid(), number: num, location: '', notes: document.getElementById('w_notes').value.trim() };
  state.warehouses.push(w);
  const emp = document.getElementById('w_emp').value;
  if(emp){
    state.assignments.push({ id: uid(), warehouseId: w.id, employeeId: emp, receivedAt: parseDispDate(document.getElementById('w_date').value) || today(), returnedAt: null, notes: '' });
  }
  save(state); closeModal(); renderWarehouses();
}
function addWarehouseRange(){
  const letters = Array.from({length:26}, (_,i) => String.fromCharCode(65+i));
  const letterOpts = letters.map(L => `<option value="${L}">${L}</option>`).join('');
  modal(`
    <h3>إضافة نطاق مستودعات</h3>
    <div class="field"><label>الحرف *</label>
      <select id="wr_letter" onchange="updateRangePreview()">${letterOpts}</select>
    </div>
    <div style="display:flex;gap:.6rem">
      <div class="field" style="flex:1"><label>من *</label>
        <input id="wr_from" type="number" min="1" max="99" value="1" oninput="updateRangePreview()" />
      </div>
      <div class="field" style="flex:1"><label>إلى *</label>
        <input id="wr_to" type="number" min="1" max="99" value="80" oninput="updateRangePreview()" />
      </div>
    </div>
    <div class="hint" id="wr_preview" style="margin:.4rem 0;font-weight:600">النطاق: A01 - A80 (80 مستودع)</div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveNewWarehouseRange()">حفظ</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`);
}
function updateRangePreview(){
  const L = document.getElementById('wr_letter').value;
  const f = parseInt(document.getElementById('wr_from').value,10);
  const t = parseInt(document.getElementById('wr_to').value,10);
  const el = document.getElementById('wr_preview');
  if(!Number.isFinite(f) || !Number.isFinite(t) || f<1 || t<1 || f>99 || t>99 || f>t){
    el.textContent = 'النطاق غير صالح (الأرقام بين 01 و 99، ومن ≤ إلى)';
    el.style.color = '#b91c1c';
    return;
  }
  const pad = n => String(n).padStart(2,'0');
  el.textContent = `النطاق: ${L}${pad(f)} - ${L}${pad(t)} (${t-f+1} مستودع)`;
  el.style.color = '';
}
function saveNewWarehouseRange(){
  const L = document.getElementById('wr_letter').value;
  const f = parseInt(document.getElementById('wr_from').value,10);
  const t = parseInt(document.getElementById('wr_to').value,10);
  if(!L || !Number.isFinite(f) || !Number.isFinite(t)) return toast('يرجى تعبئة الحقول', 'error');
  if(f<1 || t<1 || f>99 || t>99) return toast('الأرقام يجب أن تكون بين 01 و 99', 'error');
  if(f>t) return toast('"من" يجب أن يكون أقل من أو يساوي "إلى"', 'error');
  const pad = n => String(n).padStart(2,'0');
  const existing = new Set(state.warehouses.map(w => w.number));
  let added = 0, skipped = 0;
  for(let i=f; i<=t; i++){
    const num = `${L}${pad(i)}`;
    if(existing.has(num)){ skipped++; continue; }
    state.warehouses.push({ id: uid(), number: num, location: '', notes: '' });
    existing.add(num);
    added++;
  }
  if(added===0){ toast('جميع الأرقام في النطاق موجودة مسبقاً', 'error'); return; }
  save(state); closeModal(); renderWarehouses();
  toast(`✓ تم إضافة ${added} مستودع${skipped?` (تم تخطي ${skipped} موجود مسبقاً)`:''}`, 'success');
}
function editWarehouse(id){
  const w = state.warehouses.find(x => x.id===id);
  modal(`
    <h3>تعديل مستودع</h3>
    <div class="field"><label>الرقم *</label><input id="ew_num" value="${esc(w.number)}" /></div>
    <div class="field"><label>الموقع</label><input id="ew_loc" value="${esc(w.location||'')}" /></div>
    <div class="field"><label>ملاحظات</label><textarea id="ew_notes" rows="2">${esc(w.notes||'')}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveEditWarehouse('${id}')">حفظ</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`);
}
function saveEditWarehouse(id){
  const w = state.warehouses.find(x => x.id===id);
  const num = document.getElementById('ew_num').value.trim();
  if(!num) return toast('الرقم مطلوب', 'error');
  if(state.warehouses.some(x => x.number===num && x.id!==id)) return toast('الرقم موجود', 'error');
  w.number = num; w.location = document.getElementById('ew_loc').value.trim(); w.notes = document.getElementById('ew_notes').value.trim();
  save(state); closeModal(); renderWarehouses();
}
function delWarehouse(id){
  if(!confirm('حذف المستودع وجميع إسناداته؟')) return;
  state.warehouses = state.warehouses.filter(w => w.id!==id);
  state.assignments = state.assignments.filter(a => a.warehouseId!==id);
  save(state); renderWarehouses();
}

/* ========= Employees ========= */
function renderEmployees(){
  const rows = state.employees.map(e => {
    const active = activeAssignmentsForEmployee(e.id);
    const whNumbers = active.map(a => whNumber(a.warehouseId));
    const whChips = active.length
      ? active.sort((a,b)=>String(whNumber(a.warehouseId)).localeCompare(String(whNumber(b.warehouseId)),'ar',{numeric:true}))
              .map(a=>`<span class="wh-pill" onclick="showWarehouseDetails('${a.warehouseId}')" title="عرض تفاصيل المستودع ${esc(whNumber(a.warehouseId))}">${esc(whNumber(a.warehouseId))}</span>`).join('')
      : '-';
    const searchKey = ((e.name||'') + ' ' + (e.phone||'') + ' ' + whNumbers.join(' ')).toLowerCase();
    return `<tr data-search="${esc(searchKey)}">
  <td style="width:32%;min-width:190px">
    <a class="emp-link" onclick="showEmpDetails('${e.id}')">${esc(e.name)}</a>
  </td>

  <td style="width:1%;white-space:nowrap">
    ${esc(e.phone || '-')}
  </td>

  <td style="width:48%;min-width:260px">
    <div style="display:flex;flex-wrap:wrap;gap:.15rem">${whChips}</div>
  </td>

  <td style="width:1%;white-space:nowrap">
    ${esc(e.notes || '-')}
  </td>

  <td style="width:1%;white-space:nowrap">
    ${isAdmin() ? `
      <button class="btn btn-sm btn-ghost" onclick="editEmployee('${e.id}')">تعديل</button>
      <button class="btn btn-sm btn-danger" onclick="delEmployee('${e.id}')">حذف</button>
    ` : ''}
  </td>
</tr>`;
  }).join('');
  document.getElementById('main').innerHTML = `
    <div class="page-head">
      <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
        ${isAdmin()?`<button class="btn btn-primary" onclick="addEmployee()">+ موظف جديد</button>`:''}
        <div class="search" style="min-width:260px">
          <input id="empSearch" placeholder="ابحث باسم الموظف أو رقم الجوال أو رقم المستودع..." oninput="filterEmployees()" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
      </div>
      <div class="title"><h1>الموظفون</h1><div class="desc">إدارة الموظفين والعهد</div></div>
    </div>
    <div class="card">
      ${state.employees.length===0 ? `<div class="empty">لا يوجد موظفون</div>` :
      `<div style="max-height:560px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="sticky-thead" id="empTable"><colgroup><col style="width:32%"><col style="width:1%"><col style="width:48%"><col style="width:1%"><col style="width:1%"></colgroup><thead><tr><th>الاسم</th><th>رقم الجوال</th><th>المستودعات (أفقي)</th><th>ملاحظات</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
       <div id="empSearchEmpty" class="empty hidden">لا توجد نتائج مطابقة</div>`}
    </div>`;
}
function filterEmployees(){
  const q = (document.getElementById('empSearch')?.value || '').trim().toLowerCase();
  const rows = document.querySelectorAll('#empTable tbody tr');
  let visible = 0;
  rows.forEach(tr => {
    const key = tr.getAttribute('data-search') || '';
    const show = !q || key.includes(q);
    tr.style.display = show ? '' : 'none';
    if(show) visible++;
  });
  const emptyMsg = document.getElementById('empSearchEmpty');
  if(emptyMsg) emptyMsg.classList.toggle('hidden', visible !== 0);
}function addEmployee(){
  modal(`
    <h3>موظف جديد</h3>
    <div class="field"><label>الاسم *</label><input id="e_name" /></div>
    <div class="field"><label>رقم المستودع</label>
      <input id="e_whs" placeholder="مثال: A05" oninput="this.value=this.value.toUpperCase()" maxlength="3" />
      <div class="hint">حرف إنجليزي + رقمين بدون فواصل (مثال: A05). سيُنشأ إن لم يوجد ويُربط بالموظف.</div>
    </div>
    <div class="field"><label>رقم الجوال</label><input id="e_phone" /></div>
    <div class="field"><label>ملاحظات</label><textarea id="e_notes" rows="2"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveNewEmployee()">حفظ</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`);
}
function saveNewEmployee(){
  const name = document.getElementById('e_name').value.trim();
  if(!name) return toast('الاسم مطلوب', 'error');
  const whInput = document.getElementById('e_whs').value.trim().toUpperCase();
  if(whInput && !/^[A-Z]\d{2}$/.test(whInput)) return toast('صيغة رقم المستودع: حرف إنجليزي + رقمين (مثال: A05)', 'error');
  const emp = { id: uid(), name, phone: document.getElementById('e_phone').value.trim(), notes: document.getElementById('e_notes').value.trim() };
  state.employees.push(emp);
  if(whInput){
    let w = state.warehouses.find(x => x.number === whInput);
    if(!w){ w = { id: uid(), number: whInput, location:'', notes:'' }; state.warehouses.push(w); }
    if(!activeAssignmentForWarehouse(w.id)){
      state.assignments.push({ id: uid(), warehouseId: w.id, employeeId: emp.id, receivedAt: today(), returnedAt: null, notes:'' });
    }
  }
  save(state); closeModal(); renderEmployees();
}
function editEmployee(id){
  const e = state.employees.find(x => x.id===id);
  modal(`
    <h3>تعديل موظف</h3>
    <div class="field"><label>الاسم *</label><input id="ee_name" value="${esc(e.name)}" /></div>
    <div class="field"><label>الهاتف</label><input id="ee_phone" value="${esc(e.phone||'')}" /></div>
    <div class="field"><label>ملاحظات</label><textarea id="ee_notes" rows="2">${esc(e.notes||'')}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveEditEmployee('${id}')">حفظ</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`);
}
function saveEditEmployee(id){
  const e = state.employees.find(x => x.id===id);
  const n = document.getElementById('ee_name').value.trim();
  if(!n) return toast('الاسم مطلوب', 'error');
  e.name = n; e.phone = document.getElementById('ee_phone').value.trim(); e.notes = document.getElementById('ee_notes').value.trim();
  save(state); closeModal(); renderEmployees();
}
function delEmployee(id){
  if(!confirm('حذف الموظف وجميع إسناداته؟')) return;
  state.employees = state.employees.filter(e => e.id!==id);
  state.assignments = state.assignments.filter(a => a.employeeId!==id);
  save(state); renderEmployees();
}

/* ========= Assignments (kept, accessible from warehouses if needed) ========= */
function renderAssignments(){
  const rows = state.assignments.slice().sort((a,b) => (b.receivedAt||'').localeCompare(a.receivedAt||'')).map(a => `
    <tr>
      <td>${esc(whNumber(a.warehouseId))}</td>
      <td>${esc(empName(a.employeeId))}</td>
      <td>${esc(fmtDate(a.receivedAt))}</td>
      <td>${a.returnedAt ? esc(fmtDate(a.returnedAt)) : '<span class="badge badge-busy">نشط</span>'}</td>
      <td>${esc(a.notes||'-')}</td>
      <td>${isAdmin() && !a.returnedAt ? `<button class="btn btn-sm btn-primary" onclick="returnAssignment('${a.id}')">استلام من الموظف</button>`:''}
          ${isAdmin() ? `<button class="btn btn-sm btn-danger" onclick="delAssignment('${a.id}')">حذف</button>`:''}</td>
    </tr>`).join('');
  document.getElementById('main').innerHTML = `
    <div class="page-head">
      ${isAdmin()?`<button class="btn btn-primary" onclick="addAssignment()">+ إسناد جديد</button>`:'<span></span>'}
      <div class="title"><h1>الإسنادات</h1><div class="desc">سجل توزيع المستودعات</div></div>
    </div>
    <div class="card">
      ${state.assignments.length===0 ? `<div class="empty">لا توجد إسنادات</div>` :
      `<table><thead><tr><th>المستودع</th><th>الموظف</th><th>التسليم للموظف</th><th>الاستلام منه</th><th>ملاحظات</th><th></th></tr></thead><tbody>${rows}</tbody></table>`}
    </div>`;
}
function addAssignment(){
  if(!state.warehouses.length || !state.employees.length) return toast('يجب وجود مستودع وموظف أولاً', 'error');
  const wOpts = state.warehouses.filter(w => !activeAssignmentForWarehouse(w.id)).map(w => `<option value="${w.id}">${esc(w.number)}</option>`).join('');
  const eOpts = state.employees.map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join('');
  if(!wOpts) return toast('لا توجد مستودعات شاغرة', 'error');
  modal(`
    <h3>إسناد جديد</h3>
    <div class="field"><label>المستودع *</label><select id="a_w">${wOpts}</select></div>
    <div class="field"><label>الموظف *</label><select id="a_e">${eOpts}</select></div>
    <div class="field"><label>تاريخ التسليم للموظف (هجري)</label><input id="a_date" type="text" value="${todayDisp()}" placeholder="١٤٤٧/١٢/٠٥" style="direction:ltr;text-align:right" /></div>
    <div class="field"><label>ملاحظات</label><textarea id="a_notes" rows="2"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveAssignment()">حفظ</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`);
}
function saveAssignment(){
  state.assignments.push({
    id: uid(),
    warehouseId: document.getElementById('a_w').value,
    employeeId: document.getElementById('a_e').value,
    receivedAt: parseDispDate(document.getElementById('a_date').value) || today(),
    returnedAt: null,
    notes: document.getElementById('a_notes').value.trim(),
  });
  save(state); closeModal(); renderAssignments();
}
function returnAssignment(id){
  const a = state.assignments.find(x => x.id===id);
  const d = prompt('تاريخ استلام المستودع من الموظف (هجري — سنة/شهر/يوم):', todayDisp()); if(!d) return;
  a.returnedAt = parseDispDate(d); save(state); renderAssignments();
}
function delAssignment(id){
  if(!confirm('حذف الإسناد؟')) return;
  state.assignments = state.assignments.filter(a => a.id!==id); save(state); renderAssignments();
}

/* ========= Quick Handover / Receive (Dashboard) ========= */
/* تسليم مستودع: اختر موظفاً (قائمة + بحث) ثم مستودعاً فارغاً، ويُسجَّل اليوم والتاريخ الهجري تلقائياً */
function openHandover(preEmpId){
  if(!state.employees.length) return toast('لا يوجد موظفون مسجلون', 'error');
  const free = state.warehouses.filter(w => !activeAssignmentForWarehouse(w.id));
  if(!free.length) return toast('لا توجد مستودعات فارغة حالياً', 'error');

  const day = todayDay();
  const hijri = today();

  const empListHtml = state.employees
    .slice().sort((a,b)=> (a.name||'').localeCompare(b.name||'','ar'))
    .map(e => `<div class="pick-item${preEmpId===e.id?' selected':''}" data-search="${esc(((e.name||'')+' '+(e.phone||'')).toLowerCase())}" onclick="hoSelectEmp(this,'${e.id}')">
        <b>${esc(e.name)}</b>${e.phone?`<span style="color:var(--muted);font-size:.78rem;margin-right:.4rem">— ${esc(e.phone)}</span>`:''}
      </div>`).join('');

  modal(`
    <h3>📤 تسليم مستودع لموظف</h3>
    <div class="auto-date">
      <span>📅</span>
      <span class="lbl">اليوم:</span><span class="val">${esc(day)}</span>
      <span class="lbl">الهجري:</span><span class="val" style="direction:ltr">${esc(dispDate(hijri))}</span>
    </div>
    <div class="field"><label>1) اختر الموظف</label>
      <input id="ho_emp_search" placeholder="ابحث باسم الموظف أو رقم الجوال..." oninput="hoFilterEmp()" />
    </div>
    <div id="ho_emp_list" class="pick-list">${empListHtml}</div>
    <input type="hidden" id="ho_emp_id" value="${preEmpId||''}" />

    <div id="ho_step2" style="${preEmpId?'':'display:none;'}margin-top:.85rem">
      <div class="field"><label>2) اختر المستودع الفارغ</label>
        <input id="ho_w_search" placeholder="ابحث برقم المستودع أو الموقع..." oninput="hoFilterW()" />
      </div>
      <div id="ho_w_list" class="pick-list">
        ${free.map(w => `<div class="pick-item" data-search="${esc(((w.number||'')+' '+(w.location||'')).toLowerCase())}" onclick="hoSelectW(this,'${w.id}')">
            <b>مستودع ${esc(w.number)}</b>${w.location?`<span style="color:var(--muted);font-size:.78rem;margin-right:.4rem">— ${esc(w.location)}</span>`:''}
          </div>`).join('')}
      </div>
      <input type="hidden" id="ho_w_id" value="" />

      <div class="field" style="margin-top:.85rem"><label>ملاحظات (اختياري)</label>
        <textarea id="ho_notes" rows="2" placeholder="مثال: تم تسليم المفاتيح..."></textarea>
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveHandover()">✓ تأكيد التسليم</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`, {persistent:true});
}
function hoFilterEmp(){
  const q = (document.getElementById('ho_emp_search').value||'').trim().toLowerCase();
  document.querySelectorAll('#ho_emp_list .pick-item').forEach(el => {
    el.style.display = (!q || (el.getAttribute('data-search')||'').includes(q)) ? '' : 'none';
  });
}
function hoFilterW(){
  const q = (document.getElementById('ho_w_search').value||'').trim().toLowerCase();
  document.querySelectorAll('#ho_w_list .pick-item').forEach(el => {
    el.style.display = (!q || (el.getAttribute('data-search')||'').includes(q)) ? '' : 'none';
  });
}
function hoSelectEmp(el, eid){
  document.getElementById('ho_emp_id').value = eid;
  document.querySelectorAll('#ho_emp_list .pick-item').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('ho_step2').style.display = 'block';
}
function hoSelectW(el, wid){
  document.getElementById('ho_w_id').value = wid;
  document.querySelectorAll('#ho_w_list .pick-item').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
}
function saveHandover(){
  const eid = document.getElementById('ho_emp_id').value;
  if(!eid) return toast('اختر الموظف أولاً', 'error');
  const wid = document.getElementById('ho_w_id').value;
  if(!wid) return toast('اختر المستودع الفارغ', 'error');
  if(activeAssignmentForWarehouse(wid)) return toast('هذا المستودع مشغول الآن', 'error');
  const hijri = today();
  const day = todayDay();
  const extra = (document.getElementById('ho_notes').value||'').trim();
  const tag = `[تسليم ${day} ${dispDate(hijri)}${extra?' — '+extra:''}]`;
  state.assignments.push({
    id: uid(), warehouseId: wid, employeeId: eid,
    receivedAt: hijri, receivedDay: day, returnedAt: null, notes: tag,
  });
  save(state); closeModal(); renderDashboard();
  const emp = state.employees.find(e=>e.id===eid);
  toast('✓ تم تسليم المستودع إلى ' + (emp?emp.name:'') + ' — ' + day + ' ' + dispDate(hijri), 'success');
}

/* استلام مستودع: ابحث برقم المستودع المشغول → يعرض اسم الموظف وحالة المستودع → "تم" → يُسجَّل اليوم والهجري تلقائياً */
function openReceive(preEmpId){
  let busy = state.warehouses.filter(w => activeAssignmentForWarehouse(w.id));
  if(preEmpId){
    busy = busy.filter(w => activeAssignmentForWarehouse(w.id).employeeId === preEmpId);
    if(!busy.length) return toast('لا توجد مستودعات مشغولة لدى هذا الموظف', 'error');
  } else if(!busy.length) return toast('لا توجد مستودعات مشغولة حالياً', 'error');

  const day = todayDay();
  const hijri = today();
  const titleSuffix = preEmpId ? ` — ${esc(empName(preEmpId))}` : '';

  const items = busy
    .slice().sort((a,b)=> String(a.number).localeCompare(String(b.number),'ar',{numeric:true}))
    .map(w => {
      const a = activeAssignmentForWarehouse(w.id);
      const en = empName(a.employeeId);
      return `<div class="pick-item" data-search="${esc(((w.number||'')+' '+en).toLowerCase())}" onclick="rcSelectW(this,'${w.id}','${a.id}')">
        <b>مستودع ${esc(w.number)}</b><span style="color:var(--muted);font-size:.8rem;margin-right:.5rem">— ${esc(en)}</span>
      </div>`;
    }).join('');

  modal(`
    <h3>📥 استلام مستودع من موظف${titleSuffix}</h3>
    <div class="auto-date">
      <span>📅</span>
      <span class="lbl">اليوم:</span><span class="val">${esc(day)}</span>
      <span class="lbl">الهجري:</span><span class="val" style="direction:ltr">${esc(dispDate(hijri))}</span>
    </div>
    <div class="field"><label>ابحث برقم المستودع المشغول</label>
      <input id="rc_search" placeholder="مثال: A05 أو اسم الموظف..." oninput="rcFilter()" />
    </div>
    <div id="rc_w_list" class="pick-list">${items}</div>
    <input type="hidden" id="rc_w_id" value="" />
    <input type="hidden" id="rc_a_id" value="" />

    <div id="rc_step2" style="display:none;margin-top:.85rem">
      <div style="background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.65rem .85rem;margin-bottom:.75rem">
        <div style="font-size:.78rem;color:var(--muted);margin-bottom:.15rem">الموظف الحالي</div>
        <div id="rc_emp_name" style="font-weight:700;font-size:1rem"></div>
      </div>
      <div class="field"><label>حالة المستودع</label>
        <select id="rc_cond">
          <option value="جاهز ونظيف">جاهز ونظيف</option>
          <option value="يحتاج تجهيز">يحتاج تجهيز</option>
        </select>
      </div>
      <div class="field"><label>ملاحظات (اختياري)</label>
        <textarea id="rc_notes" rows="2"></textarea>
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-primary" onclick="saveReceive()">✓ تأكيد الاستلام</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`, {persistent:true});
}
function rcFilter(){
  const q = (document.getElementById('rc_search').value||'').trim().toLowerCase();
  document.querySelectorAll('#rc_w_list .pick-item').forEach(el => {
    el.style.display = (!q || (el.getAttribute('data-search')||'').includes(q)) ? '' : 'none';
  });
}
function rcSelectW(el, wid, aid){
  document.getElementById('rc_w_id').value = wid;
  document.getElementById('rc_a_id').value = aid;
  const a = state.assignments.find(x => x.id===aid);
  document.getElementById('rc_emp_name').textContent = a ? empName(a.employeeId) : '-';
  document.querySelectorAll('#rc_w_list .pick-item').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('rc_step2').style.display = 'block';
}
function saveReceive(){
  const aid = document.getElementById('rc_a_id').value;
  if(!aid) return toast('اختر المستودع أولاً', 'error');
  const a = state.assignments.find(x => x.id===aid);
  if(!a) return toast('الإسناد غير موجود', 'error');
  const cond = document.getElementById('rc_cond').value;
  const extra = (document.getElementById('rc_notes').value||'').trim();
  const hijri = today();
  const day = todayDay();
  a.returnedAt = hijri;
  a.returnedDay = day;
  a.handoverReason = cond;
  const tag = `[استلام ${day} ${dispDate(hijri)} — ${cond}${extra?': '+extra:''}]`;
  a.notes = a.notes ? (a.notes + ' ' + tag) : tag;
  save(state); closeModal(); renderDashboard();
  toast('✓ تم استلام المستودع — أصبح فارغاً (' + day + ' ' + dispDate(hijri) + ')', 'success');
}



/* ========= Users ========= */
function renderUsers(){
  const admin = isAdmin();
  const rows = state.users.map(u => `
    <tr>
      <td>${esc(u.username)}</td>
      <td><span class="badge badge-${u.role}">${u.role==='admin'?'مدير':'مستخدم'}</span></td>
      ${admin?`<td>
        <button class="btn btn-sm btn-ghost" onclick="editUser('${u.id}')">تعديل</button>
        ${u.id!==session.id?`<button class="btn btn-sm btn-danger" onclick="delUser('${u.id}')">حذف</button>`:''}
      </td>`:''}
    </tr>`).join('');
  document.getElementById('main').innerHTML = `
    <div class="page-head">
      <div style="display:flex;gap:.5rem">
        ${admin?`<button class="btn btn-primary" onclick="addUser()">+ مستخدم جديد</button>`:''}
        <button class="btn btn-secondary no-print" onclick="window.print()">🖨 طباعة</button>
      </div>
      <div class="title"><h1>المستخدمون</h1><div class="desc">${admin?'إدارة حسابات الدخول':'عرض وطباعة فقط'}</div></div>
    </div>
    <div class="card"><table><thead><tr><th>اسم المستخدم</th><th>الصلاحية</th>${admin?'<th></th>':''}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
function addUser(){
  modal(`
    <h3>مستخدم جديد</h3>
    <div class="field"><label>اسم المستخدم *</label><input id="u_name" /></div>
    <div class="field"><label>كلمة المرور *</label><input id="u_pass" type="text" /></div>
    <div class="field"><label>الصلاحية</label>
      <select id="u_role"><option value="user">مستخدم</option><option value="admin">مدير</option></select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveNewUser()">حفظ</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`);
}
function saveNewUser(){
  const n = document.getElementById('u_name').value.trim();
  const p = document.getElementById('u_pass').value;
  if(!n||!p) return toast('الاسم وكلمة المرور مطلوبان', 'error');
  if(state.users.some(x => x.username===n)) return toast('الاسم موجود', 'error');
  state.users.push({ id: uid(), username:n, password:p, role: document.getElementById('u_role').value });
  save(state); closeModal(); renderUsers();
}
function editUser(id){
  const u = state.users.find(x => x.id===id);
  modal(`
    <h3>تعديل مستخدم</h3>
    <div class="field"><label>اسم المستخدم *</label><input id="eu_name" value="${esc(u.username)}" /></div>
    <div class="field"><label>كلمة المرور *</label><input id="eu_pass" type="text" value="${esc(u.password)}" /></div>
    <div class="field"><label>الصلاحية</label>
      <select id="eu_role">
        <option value="user" ${u.role==='user'?'selected':''}>مستخدم</option>
        <option value="admin" ${u.role==='admin'?'selected':''}>مدير</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveEditUser('${id}')">حفظ</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>`);
}
function saveEditUser(id){
  const u = state.users.find(x => x.id===id);
  const n = document.getElementById('eu_name').value.trim();
  const p = document.getElementById('eu_pass').value;
  if(!n||!p) return toast('مطلوب', 'error');
  if(state.users.some(x => x.username===n && x.id!==id)) return toast('الاسم موجود', 'error');
  u.username=n; u.password=p; u.role = document.getElementById('eu_role').value;
  save(state); closeModal(); renderUsers();
}
function delUser(id){
  if(id===session.id) return;
  if(!confirm('حذف المستخدم؟')) return;
  state.users = state.users.filter(u => u.id!==id); save(state); renderUsers();
}

/* ========= Settings ========= */
function renderSettings(){
  const counts = `مستودعات: ${state.warehouses.length} • موظفون: ${state.employees.length} • إسنادات: ${state.assignments.length} • مستخدمون: ${state.users.length}`;
  document.getElementById('main').innerHTML = `
    <div class="page-head">
      <span></span>
      <div class="title"><h1>الإعدادات</h1><div class="desc">إدارة البيانات وتفضيلات النظام</div></div>
    </div>
    <div class="card">
      <div class="card-h"><div class="ttl">النسخ الاحتياطي والاستعادة</div></div>
      <p style="color:var(--muted);font-size:.88rem;margin-bottom:1rem">${counts}</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="exportBackup()">⬇ تنزيل نسخة احتياطية</button>
        ${isAdmin()?`<button class="btn btn-success" onclick="document.getElementById('importFile').click()">⬆ استعادة من ملف</button>`:''}
        ${isAdmin()?`<button class="btn btn-danger" onclick="resetAll()">حذف جميع البيانات</button>`:''}
        <input type="file" id="importFile" accept=".json,application/json" style="display:none" onchange="importBackup(event)" />
      </div>
      <div class="hint" style="margin-top:1rem">
        ملف النسخة الاحتياطية يحتوي على جميع البيانات (المستودعات، الموظفون، الإسنادات، المستخدمون).
      </div>
    </div>
    <div class="card" style="margin-top:1rem;border:1px dashed var(--border)">
      <div class="card-h"><div class="ttl" style="color:var(--muted)">⚙ التأسيس الأولي (يستخدم مرة واحدة)</div></div>
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:.75rem">استيراد أسماء الموظفين والمستودعات من Excel أو CSV ثم ربطها دفعة واحدة.</p>
      ${isAdmin()?`<div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <button class="btn btn-secondary" onclick="openWizard()" style="font-size:.85rem">🧙 فتح معالج الإعداد</button>
        <button class="btn btn-primary" onclick="openWizard(2)" style="font-size:.85rem">🔗 ربط</button>
      </div>`:`<div class="hint">يتطلب صلاحية المسؤول</div>`}
    </div>
    ${isAdmin()?`<div class="card" style="margin-top:1rem">
      <div class="card-h"><div class="ttl">👥 المستخدمون</div></div>
      <p style="color:var(--muted);font-size:.88rem;margin-bottom:1rem">إدارة حسابات الدخول وصلاحياتها.</p>
      <button class="btn btn-primary" onclick="nav('users')">فتح إدارة المستخدمين</button>
    </div>`:''}
    <div class="card" id="settingsExtra" style="display:none"></div>`;
}
function exportBackup(){
  const data = { exportedAt: new Date().toISOString(), version: 1, data: state };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `warehouses-backup-${today().replace(/\//g,'-')}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function importBackup(ev){
  const f = ev.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const obj = JSON.parse(reader.result);
      const d = obj.data || obj;
      if(!d.users || !d.warehouses || !d.employees || !d.assignments) throw new Error('ملف غير صالح');
      _pendingRestore = d;
      modal(`
        <h3 style="color:var(--danger)">⚠ تأكيد استعادة النسخة الاحتياطية</h3>
        <p style="color:var(--muted);font-size:.88rem;margin:.5rem 0 1rem">
          سيتم <b>استبدال جميع البيانات الحالية</b> بمحتوى الملف:<br>
          مستودعات: <b>${d.warehouses.length}</b> • موظفون: <b>${d.employees.length}</b> •
          إسنادات: <b>${d.assignments.length}</b> • مستخدمون: <b>${d.users.length}</b>
          <br>هذا الإجراء <b>لا يمكن التراجع عنه</b>.
        </p>
        <div class="field" style="display:flex;align-items:center;gap:.5rem">
          <input type="checkbox" id="restoreAck" style="width:auto" />
          <label for="restoreAck" style="margin:0">أؤكد أنني أرغب باستبدال البيانات الحالية</label>
        </div>
        <div class="modal-actions">
          <button class="btn btn-danger" onclick="confirmRestore()">✓ استعادة الآن</button>
          <button class="btn btn-ghost" onclick="cancelRestore()">إلغاء</button>
        </div>`);
    }catch(e){ toast('فشل قراءة الملف: ' + e.message, 'error'); }
    ev.target.value = '';
  };
  reader.readAsText(f);
}
let _pendingRestore = null;
function cancelRestore(){ _pendingRestore = null; closeModal(); }
function confirmRestore(){
  if(!document.getElementById('restoreAck').checked) return toast('يجب تأكيد الموافقة أولاً', 'error');
  const d = _pendingRestore; _pendingRestore = null;
  if(!d) return closeModal();
  state = { users: d.users, warehouses: d.warehouses, employees: d.employees, assignments: d.assignments };
  save(state); closeModal();
  toast('✓ تمت الاستعادة بنجاح', 'success');
  if(!state.users.find(u => u.id === session?.id)){ doLogout(); } else { renderSettings(); }
}

function resetAll(){
  modal(`
    <h3 style="color:var(--danger)">⚠ حذف جميع البيانات</h3>
    <p style="color:var(--muted);font-size:.88rem;margin:.5rem 0 1rem">
      سيتم حذف <b>جميع</b> المستودعات والموظفون والإسنادات والمستخدمين والعودة للحالة الافتراضية.
      هذا الإجراء <b>لا يمكن التراجع عنه</b>.
    </p>
    <div class="field">
      <label>أدخل كلمة مرور المسؤول للتأكيد</label>
      <input id="wipePass" type="password" autocomplete="current-password" />
    </div>
    <label style="display:flex;gap:.5rem;align-items:center;font-size:.88rem;margin:.5rem 0">
      <input type="checkbox" id="wipeAck" /> أؤكد رغبتي بحذف جميع البيانات
    </label>
    <div id="wipeErr" class="err" style="margin-top:.25rem"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
      <button class="btn btn-danger" onclick="confirmWipe()">حذف نهائي</button>
    </div>`);
  setTimeout(() => document.getElementById('wipePass').focus(), 50);
}
function confirmWipe(){
  const pass = document.getElementById('wipePass').value;
  const ack  = document.getElementById('wipeAck').checked;
  const err  = document.getElementById('wipeErr');
  if(!ack){ err.textContent = 'يجب تأكيد رغبتك بالحذف'; return; }
  const admin = state.users.find(u => u.username === (session?.username) && u.role === 'admin');
  if(!admin || admin.password !== pass){ err.textContent = 'كلمة مرور المسؤول غير صحيحة'; return; }
  const currentUsername = session?.username;
  localStorage.removeItem(KEY);
  state = load();
  const reboundUser = state.users.find(u => u.username === currentUsername);
  if(reboundUser){
    session = reboundUser;
    sessionStorage.setItem('wh_session', reboundUser.id);
  }
  closeModal();
  toast('✓ تم حذف جميع البيانات', 'success');
  if(reboundUser){ renderSettings(); } else { doLogout(); }
}


/* ========= Setup Wizard (one-time) ========= */
let wiz = {
  step: 1,
  importedE: 0,
  skippedE: 0,
  lockedEmp: null,
  protectedAssignmentIds: []
};

function openWizard(step){
  if(!isAdmin()) return toast('يتطلب صلاحية المسؤول', 'error');
  const s = (step===1 || step===2) ? step : 1;
  wiz = {
  step: s,
  importedE: 0,
  skippedE: 0,
  lockedEmp: null,
  protectedAssignmentIds: state.assignments
    .filter(a => !a.returnedAt)
    .map(a => a.id)
};
  renderWizard();
}

function renderWizard(){
  const dot = n => `<span style="display:inline-block;width:28px;height:28px;border-radius:50%;line-height:28px;text-align:center;font-weight:700;background:${wiz.step>=n?'var(--primary)':'#e5e7eb'};color:${wiz.step>=n?'#fff':'#6b7a90'}">${n}</span>`;
  const sep = ok => `<span style="flex:1;height:2px;background:${ok?'var(--primary)':'#e5e7eb'};margin:0 .5rem"></span>`;
  const header = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
      <div style="display:flex;align-items:center;flex:1">
        ${dot(1)}${sep(wiz.step>=2)}${dot(2)}
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:.78rem;color:var(--muted);margin-bottom:1rem">
      <span>الموظفون</span><span>الربط</span>
    </div>`;

  let body = '';
  if(wiz.step === 1){
    body = `
      <h3 style="margin-bottom:.5rem">الخطوة 1: استيراد الموظفين 👥</h3>
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:1rem">أعمدة الملف: <b>الاسم</b> | <b>الجوال</b> (اختياري) | <b>ملاحظات</b> (اختياري)</p>
      <div class="hint" style="background:#eff6ff;color:#1e3a8a;padding:.6rem .85rem;border-radius:8px;margin-bottom:1rem;font-size:.82rem">
        💡 المستودعات تُضاف من <b>قائمة المستودعات</b> (زر «+ نطاق» أو «+ مستودع جديد»). هنا نستورد الموظفين فقط ثم ننتقل للربط.
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">
        <button class="btn btn-secondary" onclick="downloadTemplate('employees')">⬇ تحميل قالب Excel</button>
        <button class="btn btn-secondary" onclick="downloadTemplate('employeesCsv')">⬇ قالب CSV</button>
      </div>
      <input type="file" id="wizFileE" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleImport(event,'employees')" />
      <button class="btn btn-primary" onclick="document.getElementById('wizFileE').click()" style="width:100%">📂 رفع ملف الموظفين (xlsx / csv)</button>
      ${wiz.importedE>0 || wiz.skippedE>0 ? `<div class="hint" style="margin-top:1rem;background:#dcfce7;color:#166534;padding:.65rem .85rem;border-radius:8px">✅ أضيف ${wiz.importedE} موظف${wiz.skippedE?` • تم تجاهل ${wiz.skippedE} مكرر`:''}</div>`:''}`;
  } else {
    const freeW = state.warehouses.filter(w => !activeAssignmentForWarehouse(w.id));
    const linked = state.assignments.filter(a => !a.returnedAt).length;
    const total = state.warehouses.length;
    const wOpts = freeW.map(w => `<option value="${w.id}">${esc(w.number)}</option>`).join('');
    const eOpts = state.employees.map(e => `<option value="${e.id}" ${wiz.lockedEmp===e.id?'selected':''}>${esc(e.name)}</option>`).join('');
    const lockedEmpObj = wiz.lockedEmp ? state.employees.find(x=>x.id===wiz.lockedEmp) : null;
    const lockedCount = wiz.lockedEmp ? activeAssignmentsForEmployee(wiz.lockedEmp).length : 0;
    body = `
      <h3 style="margin-bottom:.5rem">الخطوة 2: الربط 🔗</h3>
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:1rem">تم ربط <b>${linked}</b> من <b>${total}</b> مستودع. اختر موظفاً وأضف له مستودعاته، ثم اضغط <b>تم</b> للانتقال إلى موظف آخر.</p>
      ${state.employees.length===0 || total===0 ? `<div class="hint" style="background:#fee2e2;color:#991b1b;padding:.75rem;border-radius:8px">${total===0 ? 'لا توجد مستودعات بعد. أضفها من <b>قائمة المستودعات</b> (زر «+ نطاق» أو «+ مستودع جديد») ثم عد إلى هنا.' : 'لا يوجد موظفون. ارجع للخطوة السابقة لاستيرادهم.'}</div>` : `
      ${lockedEmpObj ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:.6rem .85rem;margin-bottom:.75rem;font-size:.88rem">
        🎯 الموظف الحالي: <b>${esc(lockedEmpObj.name)}</b> — عهدته: <b style="color:var(--primary)">${lockedCount}</b> مستودع
      </div>`:''}
      <div style="display:grid;grid-template-columns:1fr 1fr auto auto;gap:.5rem;align-items:end;margin-bottom:1rem">
        <div><label style="font-size:.8rem;color:var(--muted)">الموظف</label>
          <select id="linkEmp" class="input" style="width:100%" ${wiz.lockedEmp?'disabled':''}>${eOpts}</select></div>
        <div><label style="font-size:.8rem;color:var(--muted)">المستودع (Ctrl للاختيار المتعدد)</label>
          <select id="linkWh" class="input" multiple size="5" style="width:100%">${wOpts}</select></div>
        <button class="btn btn-primary" onclick="doLink()" ${freeW.length===0?'disabled':''}>🔗 ربط</button>
        ${wiz.lockedEmp ? `<button class="btn btn-success" onclick="doneEmp()" title="انتقال إلى موظف آخر">✓ تم</button>`:''}
      </div>
      ${freeW.length===0 ? `<div class="hint" style="background:#dcfce7;color:#166534;padding:.65rem;border-radius:8px">🎉 تم ربط جميع المستودعات!</div>`:''}
      <div style="max-height:200px;overflow:auto;border:1px solid var(--border);border-radius:8px;padding:.5rem">
        ${state.assignments.filter(a=>!a.returnedAt).slice(-20).reverse().map(a => `
          <div style="display:flex;justify-content:space-between;padding:.35rem .5rem;border-bottom:1px solid var(--border-2);font-size:.85rem">
            <span><b>#${esc(whNumber(a.warehouseId))}</b> ← ${esc(empName(a.employeeId))}</span>
            ${wiz.protectedAssignmentIds.includes(a.id)
  ? `<span style="color:var(--muted);font-size:.75rem">🔒 عهدة سابقة محمية</span>`
  : `<button class="btn btn-ghost" style="padding:.1rem .4rem;font-size:.75rem" onclick="unlink('${a.id}')">إلغاء</button>`
}
          </div>`).join('') || '<div style="text-align:center;color:var(--muted);padding:1rem">لا توجد روابط بعد</div>'}
      </div>`}`;
  }

  const footer = `
    <div style="display:flex;justify-content:space-between;margin-top:1.25rem;gap:.5rem">
      <button class="btn btn-ghost" onclick="closeModal()">إغلاق</button>
      <div style="display:flex;gap:.5rem">
        ${wiz.step>1 ? `<button class="btn btn-secondary" onclick="wizGo(${wiz.step-1})">← السابق</button>`:''}
        ${wiz.step<2 ? `<button class="btn btn-primary" onclick="wizGo(${wiz.step+1})">التالي →</button>`
                     : `<button class="btn btn-success" onclick="closeModal()">✓ إنهاء</button>`}
      </div>
    </div>`;

  document.getElementById('modalMount').innerHTML =
    `<div class="modal-back">
      <div class="modal" style="max-width:min(880px,95vw);width:100%">
        <h2 style="margin-bottom:1rem">🧙 معالج الإعداد الأولي</h2>
        ${header}${body}${footer}
      </div>
    </div>`;
}
function wizGo(n){ wiz.step = n; renderWizard(); }

function downloadTemplate(kind){
  let aoa, name;
  if(kind === 'warehouses'){ aoa = [['رقم_المستودع','ملاحظات'],['A01',''],['A02','']]; name = 'قالب_المستودعات.xlsx'; }
  else if(kind === 'warehousesCsv'){ aoa = [['رقم_المستودع','ملاحظات'],['A01',''],['A02','']]; name = 'قالب_المستودعات.csv'; }
  else if(kind === 'employees'){ aoa = [['الاسم','الجوال','ملاحظات'],['محمد أحمد','0500000000',''],['',''],['','','']]; name = 'قالب_الموظفين.xlsx'; }
  else { aoa = [['الاسم','الجوال','ملاحظات'],['محمد أحمد','0500000000','']]; name = 'قالب_الموظفين.csv'; }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  if(name.endsWith('.csv')){
    const csv = '\uFEFF' + XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, name);
  }
}

function handleImport(ev, kind){
  const f = ev.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try{
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type:'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval:'' });
      if(kind === 'warehouses') importWarehouses(rows);
      else importEmployees(rows);
    }catch(err){ toast('فشل قراءة الملف: ' + err.message, 'error'); }
    ev.target.value = '';
  };
  reader.readAsArrayBuffer(f);
}

function pickKey(obj, candidates){
  const keys = Object.keys(obj);
  for(const c of candidates){
    const k = keys.find(k => k.trim().toLowerCase() === c.trim().toLowerCase());
    if(k) return obj[k];
  }
  return '';
}

function importWarehouses(rows){
  let added = 0, skipped = 0;
  for(const r of rows){
    let num = String(pickKey(r, ['رقم_المستودع','رقم المستودع','number','رقم','warehouse'])).trim().toUpperCase();
    if(!num) continue;
    if(state.warehouses.some(w => w.number === num)){ skipped++; continue; }
    const notes = String(pickKey(r, ['ملاحظات','notes'])).trim();
    state.warehouses.push({ id: uid(), number: num, location:'', notes });
    added++;
  }
  save(state);
  wiz.importedW += added; wiz.skippedW += skipped;
  renderWizard();
}

function importEmployees(rows){
  let added = 0, skipped = 0;
  for(const r of rows){
    const name = String(pickKey(r, ['الاسم','name','اسم'])).trim();
    if(!name) continue;
    if(state.employees.some(e => e.name === name)){ skipped++; continue; }
    const phone = String(pickKey(r, ['الجوال','phone','mobile','جوال','الهاتف','رقم الجوال','رقم الهاتف'])).trim();
    const notes = String(pickKey(r, ['ملاحظات','notes'])).trim();
    state.employees.push({ id: uid(), name, phone, notes });
    added++;
  }
  save(state);
  wiz.importedE += added; wiz.skippedE += skipped;
  renderWizard();
}

function doLink(){
  const eid = wiz.lockedEmp || document.getElementById('linkEmp').value;
  const sel = Array.from(document.getElementById('linkWh').selectedOptions).map(o => o.value);
  if(!eid || sel.length===0) return toast('اختر موظف ومستودع واحد على الأقل', 'error');
  for(const wid of sel){
    if(activeAssignmentForWarehouse(wid)) continue;
    state.assignments.push({ id: uid(), warehouseId: wid, employeeId: eid, receivedAt: today(), returnedAt: null, notes:'' });
  }
  wiz.lockedEmp = eid;
  save(state);
  renderWizard();
}

function doneEmp(){
  wiz.lockedEmp = null;
  renderWizard();
}

function unlink(aid){
  if(wiz.protectedAssignmentIds.includes(aid)){
    toast(
      'هذه عهدة سابقة ولا يمكن إلغاؤها من معالج التأسيس. استخدم استلام مستودع من موظف لتسجيل الحركة والتاريخ.',
      'error'
    );
    return;
  }

  state.assignments = state.assignments.filter(a => a.id !== aid);
  save(state);
  renderWizard();
}


/* ========= Warehouses Modal ========= */
function openWarehousesModal(){
  const chips = state.warehouses
    .slice()
    .sort((a,b)=> String(a.number).localeCompare(String(b.number),'ar',{numeric:true}))
    .map(w => {
      const a = activeAssignmentForWarehouse(w.id);
      const cls = a ? 'busy' : 'free';
      const tip = a ? `${empName(a.employeeId)} — ${fmtDate(a.receivedAt)}` : 'شاغر';
      return `<span class="wh-chip ${cls}" onclick="closeWarehousesModal();showWarehouseDetails('${w.id}')" title="${esc(tip)}"><span class="dot"></span>${esc(w.number)}</span>`;
    }).join('');
  document.getElementById('whModalMount').innerHTML = `
    <div id="whModalBackdrop" style="position:fixed;inset:0;background:rgba(15,31,58,.55);backdrop-filter:blur(4px);display:grid;place-items:center;padding:1rem;z-index:60;animation:fade .15s ease-out">
      <div style="background:var(--surface);border-radius:18px;padding:1.75rem;width:100%;max-width:950px;max-height:90vh;overflow:auto;box-shadow:0 30px 70px rgba(15,31,58,.25);position:relative">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
          <h3 style="font-size:1.15rem;font-weight:700">🏪 جميع المستودعات (${state.warehouses.length})</h3>
          <button onclick="closeWarehousesModal()" style="width:34px;height:34px;border-radius:8px;border:1px solid var(--border);background:var(--surface);cursor:pointer;font-size:1.1rem;display:grid;place-items:center;color:var(--muted)">✕</button>
        </div>
        <div style="margin-bottom:1rem">
          <div class="search">
            <input id="whNumSearch" placeholder="ابحث برقم المستودع..." oninput="whNumFilter()" style="width:100%" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
        </div>
        <div id="whModalChips" class="wh-chips" style="padding:.75rem">${chips}</div>
      </div>
    </div>`;
}
function closeWarehousesModal(){ document.getElementById('whModalMount').innerHTML=''; }
function filterWhModal(){
  whNumFilter();
}
function whNumFilter(){
  const q = (document.getElementById('whNumSearch')?.value || '').trim().toLowerCase();
  // تصفية chips داخل modal المستودعات
  document.querySelectorAll('#whModalChips .wh-chip').forEach(chip => {
    chip.style.display = !q || chip.textContent.trim().toLowerCase().includes(q) ? '' : 'none';
  });
  // تصفية صفوف الجداول في اللوحة الرئيسية
  document.querySelectorAll('#main .card tbody tr').forEach(tr => {
    tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
function quickHandoverFromDetails(aid, hijriDate){
  const a = state.assignments.find(x => x.id===aid); if(!a) return;
  const w = state.warehouses.find(x => x.id===a.warehouseId);
  const canonical = parseDispDate(hijriDate);
  if(!confirm('تأكيد استلام المستودع ' + (w?.number||'') + ' من الموظف بتاريخ ' + dispDate(canonical) + '؟')) return;
  a.returnedAt = canonical;
  const tag = '[استلام ' + dispDate(canonical) + ' — سليم وفارغ]';
  a.notes = a.notes ? (a.notes + ' ' + tag) : tag;
  save(state); closeModal(); renderDashboard();
  toast('✓ تم استلام المستودع من الموظف بتاريخ ' + dispDate(canonical) + ' — أصبح فارغاً', 'success');
}
function openHandoverForFree(whId){
  const w = state.warehouses.find(x=>x.id===whId); if(!w) return;
  if(!state.employees.length) return toast('لا يوجد موظفون مسجلون', 'error');
  if(activeAssignmentForWarehouse(whId)) return toast('هذا المستودع مشغول الآن', 'error');
  const day = todayDay();
  const hijri = today();
  const empListHtml = state.employees
    .slice().sort((a,b)=> (a.name||'').localeCompare(b.name||'','ar'))
    .map(e => `<div class="pick-item" data-search="${esc(((e.name||'')+' '+(e.phone||'')).toLowerCase())}" onclick="fhoSelectEmp(this,'${e.id}')">
        <b>${esc(e.name)}</b>${e.phone?`<span style="color:var(--muted);font-size:.78rem;margin-right:.4rem">— ${esc(e.phone)}</span>`:''}
      </div>`).join('');
  modal(`
    <h3>📤 تسليم المستودع ${esc(w.number)}</h3>
    <div class="auto-date">
      <span>📅</span>
      <span class="lbl">اليوم:</span><span class="val">${esc(day)}</span>
      <span class="lbl">الهجري:</span><span class="val" style="direction:ltr">${esc(dispDate(hijri))}</span>
    </div>
    <div class="field"><label>اختر الموظف المستلم</label>
      <input id="fho_search" placeholder="ابحث باسم الموظف..." oninput="fhoFilter()" />
    </div>
    <div id="fho_emp_list" class="pick-list" style="max-height:240px">${empListHtml}</div>
    <input type="hidden" id="fho_emp_id" value="" />
    <div class="modal-actions">
      <button class="btn btn-success" onclick="confirmFreeHandover('${whId}')">✓ تأكيد التسليم</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>
  `);
}
function fhoFilter(){
  const q = (document.getElementById('fho_search').value||'').trim().toLowerCase();
  document.querySelectorAll('#fho_emp_list .pick-item').forEach(el => {
    el.style.display = (!q || (el.getAttribute('data-search')||'').includes(q)) ? '' : 'none';
  });
}
function fhoSelectEmp(el, eid){
  document.getElementById('fho_emp_id').value = eid;
  document.querySelectorAll('#fho_emp_list .pick-item').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
}
function confirmFreeHandover(whId){
  const eid = document.getElementById('fho_emp_id').value;
  if(!eid) return toast('اختر الموظف', 'error');
  if(activeAssignmentForWarehouse(whId)) return toast('هذا المستودع مشغول الآن', 'error');
  const hijri = today();
  const day = todayDay();
  const tag = `[تسليم ${day} ${dispDate(hijri)}]`;
  state.assignments.push({
    id: uid(), warehouseId: whId, employeeId: eid,
    receivedAt: hijri, receivedDay: day, returnedAt: null, notes: tag,
  });
  save(state); closeModal(); renderDashboard();
  const emp = state.employees.find(e=>e.id===eid);
  toast('✓ تم تسليم المستودع إلى ' + (emp?emp.name:'') + ' — ' + day + ' ' + dispDate(hijri), 'success');
}
function toggleHandoverForm(){
  const form = document.getElementById('handoverForm');
  if(!form) return;
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}
function confirmDetailHandover(aid){
  const a = state.assignments.find(x => x.id===aid); if(!a) return;
  const dateVal = document.getElementById('detail_handover_date').value;
  if(!dateVal) return toast('الرجاء تحديد تاريخ استلام المستودع من الموظف', 'error');
  const hijriDate = parseDispDate(dateVal);
  const reason = document.getElementById('detail_handover_reason')?.value || 'فارغة';
  a.returnedAt = hijriDate;
  a.handoverReason = reason;
  const tag = '[استلام ' + dispDate(hijriDate) + ' — ' + reason + ']';
  a.notes = a.notes ? (a.notes + ' ' + tag) : tag;
  save(state); closeModal(); renderDashboard();
  toast('✓ تم استلام المستودع من الموظف — أصبح فارغاً', 'success');
}

/* ========= Reports ========= */
function renderReports(){
  const empOpts = state.employees.map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join('');
  const whOpts = state.warehouses.map(w => `<option value="${w.id}">${esc(w.number)}</option>`).join('');
  const [hYear, hMonth, hDay] = toHijri(new Date()).split('/');
const hijriMonths = ['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
const hDayOpts = Array.from({length:30}, (_,i) => {
  const value = String(i + 1).padStart(2,'0');
  return `<option value="${value}" ${value===hDay?'selected':''}>${arDigits(i + 1)}</option>`;
}).join('');
const hMonthOpts = hijriMonths.map((name,i) => {
  const value = String(i + 1).padStart(2,'0');
  return `<option value="${value}" ${value===hMonth?'selected':''}>${name}</option>`;
}).join('');
  document.getElementById('main').innerHTML = `
    <div class="page-head">
      <span></span>
      <div class="title"><h1>التقارير</h1><div class="desc">تقارير تفصيلية عن الموظفين والمستودعات والحركات</div></div>
    </div>
    <div class="split">
      <div class="card">
        <div class="card-h"><div class="ttl">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          تقرير الموظف
        </div></div>
        <div class="field"><label>اختر الموظف</label>
          <select id="rpt_emp" onchange="renderEmpReport()"><option value="">— اختر —</option>${empOpts}</select>
        </div>
        <div id="rpt_emp_result"></div>
      </div>
      <div class="card">
        <div class="card-h"><div class="ttl">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          تقرير المستودع
        </div></div>
        <div class="field"><label>اختر المستودع</label>
          <select id="rpt_wh" onchange="renderWhReport()"><option value="">— اختر —</option>${whOpts}</select>
        </div>
        <div id="rpt_wh_result"></div>
      </div>
    </div>

    <div class="card" style="margin-top:1rem">
      <div class="card-h"><div class="ttl">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        تقرير الحركات بتاريخ معيّن
      </div></div>
      <div style="display:flex;gap:.75rem;align-items:flex-end;flex-wrap:wrap;margin-bottom:.75rem">
        <div class="field" style="flex:1 1 430px;margin-bottom:0">
  <label>اختر التاريخ الهجري</label>

  <div style="display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:.5rem">
    <select id="rpt_mv_h_day" onchange="renderMovementsReport()">
      ${hDayOpts}
    </select>

    <select id="rpt_mv_h_month" onchange="renderMovementsReport()">
      ${hMonthOpts}
    </select>

    <input
      id="rpt_mv_h_year"
      type="number"
      min="1300"
      max="1600"
      value="${hYear}"
      oninput="renderMovementsReport()"
      aria-label="السنة الهجرية"
    />
  </div>

  <div class="mdate-hijri">
    📅 يقابله ميلاديًا:
    <span id="rpt_mv_gregorian">${new Date().toLocaleDateString('ar-SA-u-ca-gregory',{day:'numeric',month:'long',year:'numeric'})}</span>
  </div>
</div>
        <div style="flex:0 0 220px">
          <label style="display:block;font-size:.82rem;margin-bottom:.35rem">نوع الحركة</label>
          <select id="rpt_mv_type" onchange="renderMovementsReport()">
            <option value="all">كل الحركات</option>
            <option value="out">تسليم (فارغ ← مشغول)</option>
            <option value="in">استلام (مشغول ← فارغ)</option>
          </select>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="printMovementsReport()" title="طباعة">🖨️ طباعة</button>
      </div>
      <div id="rpt_mv_result"></div>
    </div>`;
  renderMovementsReport();
}
function hijriToGregorianDate(year, month, day){
  const pad = value => String(value).padStart(2,'0');
  const target = `${year}/${pad(month)}/${pad(day)}`;
  const approximateYear = Math.floor(Number(year) * 0.970224 + 621.5774);

  const current = new Date(approximateYear - 1, 0, 1, 12);
  const end = new Date(approximateYear + 1, 11, 31, 12);

  while(current <= end){
    if(toHijri(current) === target) return new Date(current);
    current.setDate(current.getDate() + 1);
  }

  return null;
}
function renderMovementsReport(){
  const hDaySel = document.getElementById('rpt_mv_h_day');
const hMonthSel = document.getElementById('rpt_mv_h_month');
const hYearInput = document.getElementById('rpt_mv_h_year');
const typeSel = document.getElementById('rpt_mv_type');
const el = document.getElementById('rpt_mv_result');

if(!hDaySel || !hMonthSel || !hYearInput || !el) return;

const hDay = hDaySel.value;
const hMonth = hMonthSel.value;
const hYear = hYearInput.value;
const hijri = `${hYear}/${hMonth}/${hDay}`;
const hijriDisp = dispDate(hijri);
const gDate = hijriToGregorianDate(hYear, hMonth, hDay);
const day = gDate ? dayName(gDate) : '-';

const gregorianSpan = document.getElementById('rpt_mv_gregorian');
if(gregorianSpan){
  gregorianSpan.textContent = gDate
    ? gDate.toLocaleDateString('ar-SA-u-ca-gregory',{
        day:'numeric',
        month:'long',
        year:'numeric'
      })
    : 'تاريخ هجري غير صحيح';
}

  const type = typeSel ? typeSel.value : 'all';
  const movements = [];
  state.assignments.forEach(a => {
    const w = state.warehouses.find(x=>x.id===a.warehouseId);
    const wn = w ? w.number : '-';
    const en = empName(a.employeeId);
    if((type==='all'||type==='out') && a.receivedAt && a.receivedAt===hijri){
      movements.push({
        kind:'out',
        day: a.receivedDay || day,
        date: hijriDisp,
        wh: wn, emp: en,
        cond: '-',
        notes: a.notes || ''
      });
    }
    if((type==='all'||type==='in') && a.returnedAt && a.returnedAt===hijri){
      movements.push({
        kind:'in',
        day: a.returnedDay || day,
        date: hijriDisp,
        wh: wn, emp: en,
        cond: a.handoverReason || '-',
        notes: a.notes || ''
      });
    }
  });

  if(movements.length===0){
    el.innerHTML = `<div class="empty">لا توجد حركات في هذا التاريخ (${esc(day)} — ${esc(hijriDisp)})</div>`;
    return;
  }
  // ترتيب: التسليم قبل الاستلام، ثم برقم المستودع
  movements.sort((a,b)=>{
    if(a.kind!==b.kind) return a.kind==='out' ? -1 : 1;
    return String(a.wh).localeCompare(String(b.wh),'ar',{numeric:true});
  });
  const outCount = movements.filter(m=>m.kind==='out').length;
  const inCount  = movements.filter(m=>m.kind==='in').length;
  const rows = movements.map(m => {
    const badge = m.kind==='out'
      ? `<span class="badge badge-busy" style="background:#dcfce7;color:#15803d">📤 تسليم</span>`
      : `<span class="badge badge-free" style="background:#fee2e2;color:#b91c1c">📥 استلام</span>`;
    const note = m.notes ? `<span style="color:var(--muted);font-size:.78rem">${esc(m.notes)}</span>` : '-';
    return `<tr>
      <td>${badge}</td>
      <td>${esc(m.day||'-')}</td>
      <td style="direction:ltr;text-align:right">${esc(m.date)}</td>
      <td><b>${esc(m.wh)}</b></td>
      <td>${esc(m.emp)}</td>
      <td>${esc(m.cond)}</td>
      <td>${note}</td>
    </tr>`;
  }).join('');
  el.innerHTML = `
    <p style="font-size:.85rem;color:var(--muted);margin-bottom:.5rem">
      التاريخ: <b>${esc(day)} — ${esc(hijriDisp)}</b> |
      إجمالي الحركات: <b>${movements.length}</b> |
      تسليم: <b style="color:#15803d">${outCount}</b> |
      استلام: <b style="color:#b91c1c">${inCount}</b>
    </p>
    <div style="max-height:520px;overflow:auto;border:1px solid var(--border-2);border-radius:10px">
    <table id="rpt_mv_table" class="sticky-thead">
      <thead><tr>
        <th>النوع</th><th>اليوم</th><th>التاريخ الهجري</th><th>المستودع</th><th>الموظف</th><th>الحالة / السبب</th><th>ملاحظات</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}
function printMovementsReport(){
  const tbl = document.getElementById('rpt_mv_table');
  if(!tbl){ toast('لا توجد بيانات للطباعة', 'error'); return; }
  const hDay = document.getElementById('rpt_mv_h_day')?.value || '';
const hMonth = document.getElementById('rpt_mv_h_month')?.value || '';
const hYear = document.getElementById('rpt_mv_h_year')?.value || '';
const hijriValue = `${hYear}/${hMonth}/${hDay}`;
const hijri = dispDate(hijriValue);
const gDate = hijriToGregorianDate(hYear, hMonth, hDay);
const day = gDate ? dayName(gDate) : '';
  const w = window.open('', '_blank');
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير الحركات ${hijri}</title>
    <style>
      body{font-family:'Segoe UI','Tahoma','Cairo',sans-serif;padding:1.5rem;color:#0f1f3a}
      h1{font-size:1.2rem;margin-bottom:.25rem}
      .sub{color:#6b7a90;font-size:.85rem;margin-bottom:1rem}
      table{width:100%;border-collapse:collapse;font-size:.88rem}
      th,td{border:1px solid #e6ecf3;padding:.5rem .65rem;text-align:right}
      th{background:#f8fafc}
    </style></head><body>
    <h1>تقرير الحركات</h1>
    <div class="sub">${esc(day)} — ${esc(hijri)}</div>
    ${tbl.outerHTML}
    <script>window.onload=()=>{window.print()}<\/script>
    </body></html>`);
  w.document.close();
}
function renderEmpReport(){
  const eid = document.getElementById('rpt_emp').value;
  const el = document.getElementById('rpt_emp_result');
  if(!eid){ el.innerHTML=''; return; }
  const e = state.employees.find(x=>x.id===eid);
  const assignments = state.assignments.filter(a=>a.employeeId===eid).sort((a,b)=>(b.receivedAt||'').localeCompare(a.receivedAt||''));
  const rows = assignments.map(a=>{
    const w = state.warehouses.find(x=>x.id===a.warehouseId);
    const status = a.returnedAt
      ? `<span class="badge badge-free">مُسلَّم — ${esc(fmtDate(a.returnedAt))}</span>`
      : `<span class="badge badge-busy">نشط</span>`;
    const reason = a.handoverReason ? `<span style="color:var(--muted);font-size:.8rem">(${esc(a.handoverReason)})</span>` : '';
    return `<tr><td><b>${esc(w?.number||'-')}</b></td><td>${esc(fmtDate(a.receivedAt))}</td><td>${status} ${reason}</td></tr>`;
  }).join('');
  el.innerHTML = assignments.length===0
    ? `<div class="empty">لا توجد عهد لهذا الموظف</div>`
    : `<p style="font-size:.85rem;color:var(--muted);margin-bottom:.5rem">الموظف: <b>${esc(e.name)}</b> | الجوال: ${esc(e.phone||'-')} | إجمالي العهد: <b>${assignments.length}</b></p>
       <div style="max-height:520px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="sticky-thead"><thead><tr><th>المستودع</th><th>تاريخ التسليم للموظف</th><th>الحالة</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderWhReport(){
  const wid = document.getElementById('rpt_wh').value;
  const el = document.getElementById('rpt_wh_result');
  if(!wid){ el.innerHTML=''; return; }
  const w = state.warehouses.find(x=>x.id===wid);
  const assignments = state.assignments.filter(a=>a.warehouseId===wid).sort((a,b)=>(b.receivedAt||'').localeCompare(a.receivedAt||''));
  const rows = assignments.map(a=>{
    const empN = empName(a.employeeId);
    const statusBadge = a.returnedAt
      ? `<span class="badge badge-free">${esc(fmtDate(a.returnedAt))}</span>`
      : `<span class="badge badge-busy">نشط</span>`;
    const reason = a.handoverReason ? esc(a.handoverReason) : '-';
    return `<tr><td>${esc(empN)}</td><td>${esc(fmtDate(a.receivedAt))}</td><td>${statusBadge}</td><td>${reason}</td></tr>`;
  }).join('');
  const currentA = activeAssignmentForWarehouse(wid);
  const currentStatus = currentA
    ? `<span style="color:var(--danger)">مشغول — ${esc(empName(currentA.employeeId))}</span>`
    : `<span style="color:var(--success)">شاغر</span>`;
  el.innerHTML = assignments.length===0
    ? `<div class="empty">لا يوجد سجل لهذا المستودع</div>`
    : `<p style="font-size:.85rem;color:var(--muted);margin-bottom:.5rem">المستودع: <b>${esc(w.number)}</b> | الحالة: ${currentStatus} | عدد الدورات: <b>${assignments.length}</b></p>
       <div style="max-height:520px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="sticky-thead"><thead><tr><th>الموظف</th><th>تاريخ التسليم للموظف</th><th>تاريخ الاستلام منه</th><th>حالة المستودع عند الاستلام</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
/* ========= Emp Assign Panel ========= */
function showEmpAssignPanel(){
  const empRows2 = state.employees.map(e => {
    const act = activeAssignmentsForEmployee(e.id);
    return `<tr><td style="min-width:220px;white-space:nowrap"><a class="emp-link" onclick="showEmpDetails('${e.id}')">${esc(e.name)}</a></td><td style="white-space:nowrap">${esc(e.phone||'-')}</td><td>${act.length ? act.map(a=>esc(whNumber(a.warehouseId))).join('، ') : '-'}</td></tr>`;
  }).join('');
  document.getElementById('modalMount').innerHTML = `
    <div class="modal-back"><div class="modal" style="max-width:min(720px,95vw)">
      <h3>👥 الموظفون والعهدة</h3>
      ${state.employees.length===0 ? `<div class="empty">لا يوجد موظفون بعد. أضفهم من صفحة الموظفين.</div>` :
        `<div style="max-height:560px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="sticky-thead"><thead><tr><th style="min-width:220px">الاسم</th><th>الهاتف</th><th>المستودعات المُسندة</th></tr></thead><tbody>${empRows2}</tbody></table></div>`}
      <div class="modal-actions" style="margin-top:1rem"><button class="btn btn-ghost" onclick="closeModal()">إغلاق</button><button class="btn btn-primary" style="margin-right:.5rem" onclick="closeModal();nav('employees')">صفحة الموظفين</button></div>
    </div></div>`;
}

/* ========= Stats Panel ========= */
function showStatsPanel(){
  const total = state.warehouses.length;
  const busy = state.warehouses.filter(w => activeAssignmentForWarehouse(w.id)).length;
  const free = total - busy;
  const empCount = state.employees.length;
  const pBusy = total ? Math.round(busy/total*100) : 0;
  const pFree = total ? 100-pBusy : 0;

  // أعلى الموظفين بعدد المستودعات
  const empWithCount = state.employees.map(e => ({
    e, count: activeAssignmentsForEmployee(e.id).length
  })).filter(x => x.count > 0).sort((a,b) => b.count - a.count).slice(0,10);
  const topEmpRows = empWithCount.length ? empWithCount.map((x,i) => `
    <tr>
      <td style="text-align:center;width:40px;color:var(--muted);font-weight:700">${arDigits(i+1)}</td>
      <td><a class="emp-link" onclick="closeModal();showEmpDetails('${x.e.id}')">${esc(x.e.name)}</a></td>
      <td style="text-align:center"><span class="badge badge-busy">${arDigits(x.count)}</span></td>
    </tr>`).join('') : '';

  // الأقسام
  const deptStats = state.departments.map((name, i) => {
    const empsInDept = state.employees.filter(e => e.department === i);
    const empN = empsInDept.length;
    const whN = empsInDept.reduce((s,e) => s + activeAssignmentsForEmployee(e.id).length, 0);
    return { name, empN, whN };
  }).sort((a,b) => b.whN - a.whN);
  const deptRows = deptStats.map(d => `
    <tr>
      <td><b>${esc(d.name)}</b></td>
      <td style="text-align:center">${arDigits(d.empN)}</td>
      <td style="text-align:center"><span class="badge badge-busy">${arDigits(d.whN)}</span></td>
    </tr>`).join('');

  // حركات آخر 30 يوم (تقديريًا — حسب canonical hijri المخزّن)
  const moves30 = (() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30*24*3600*1000);
    const cutoffH = toHijri(cutoff);
    let out = 0, inn = 0;
    state.assignments.forEach(a => {
      if(a.receivedAt && a.receivedAt >= cutoffH) out++;
      if(a.returnedAt && a.returnedAt >= cutoffH) inn++;
    });
    return {out, inn};
  })();

  // أكثر المستودعات تداولاً
  const whUsage = state.warehouses.map(w => ({
    w, count: state.assignments.filter(a => a.warehouseId === w.id).length
  })).filter(x => x.count > 0).sort((a,b) => b.count - a.count).slice(0,10);
  const topWhRows = whUsage.length ? whUsage.map((x,i) => {
    const a = activeAssignmentForWarehouse(x.w.id);
    return `<tr>
      <td style="text-align:center;width:40px;color:var(--muted);font-weight:700">${arDigits(i+1)}</td>
      <td><a class="wh-link" onclick="closeModal();showWarehouseDetails('${x.w.id}')"><b>${esc(x.w.number)}</b></a></td>
      <td style="text-align:center">${arDigits(x.count)}</td>
      <td style="text-align:center">${a ? `<span class="badge badge-busy">مشغول</span>` : `<span class="badge badge-free">شاغر</span>`}</td>
    </tr>`;
  }).join('') : '';

  // عدد الموظفين بدون عهدة
  const empsNoCustody = state.employees.filter(e => activeAssignmentsForEmployee(e.id).length === 0).length;

  document.getElementById('modalMount').innerHTML = `
    <div class="modal-back"><div class="modal" style="max-width:min(960px,95vw)">
      <h3 style="margin-bottom:1rem">📊 الإحصائيات التفصيلية</h3>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-bottom:1.25rem">
        <div style="background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.7rem .9rem">
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:.25rem">إجمالي المستودعات</div>
          <div style="font-size:1.4rem;font-weight:700;color:var(--primary)">${arDigits(total)}</div>
        </div>
        <div style="background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.7rem .9rem">
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:.25rem">المستلمة</div>
          <div style="font-size:1.4rem;font-weight:700;color:var(--success)">${arDigits(busy)} <span style="font-size:.75rem;color:var(--muted);font-weight:500">(${arDigits(pBusy)}%)</span></div>
        </div>
        <div style="background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.7rem .9rem">
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:.25rem">الفارغة</div>
          <div style="font-size:1.4rem;font-weight:700;color:var(--warn)">${arDigits(free)} <span style="font-size:.75rem;color:var(--muted);font-weight:500">(${arDigits(pFree)}%)</span></div>
        </div>
        <div style="background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.7rem .9rem">
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:.25rem">الموظفون</div>
          <div style="font-size:1.4rem;font-weight:700;color:#7c3aed">${arDigits(empCount)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-bottom:1.25rem">
        <div style="background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.7rem .9rem">
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:.25rem">📤 تسليمات (آخر ٣٠ يوم)</div>
          <div style="font-size:1.2rem;font-weight:700;color:var(--success)">${arDigits(moves30.out)}</div>
        </div>
        <div style="background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.7rem .9rem">
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:.25rem">📥 استلامات (آخر ٣٠ يوم)</div>
          <div style="font-size:1.2rem;font-weight:700;color:var(--primary)">${arDigits(moves30.inn)}</div>
        </div>
        <div style="background:var(--table-head);border:1px solid var(--border);border-radius:10px;padding:.7rem .9rem">
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:.25rem">موظفون بدون عهدة</div>
          <div style="font-size:1.2rem;font-weight:700;color:var(--muted)">${arDigits(empsNoCustody)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
        <div>
          <div style="font-weight:600;margin-bottom:.5rem">🏆 أعلى الموظفين بالعهدة</div>
          ${topEmpRows
            ? `<div style="max-height:320px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="sticky-thead"><thead><tr><th style="width:40px">#</th><th>الموظف</th><th style="width:80px;text-align:center">العدد</th></tr></thead><tbody>${topEmpRows}</tbody></table></div>`
            : `<div class="empty">لا يوجد موظفون لديهم عهدة</div>`}
        </div>
        <div>
          <div style="font-weight:600;margin-bottom:.5rem">📦 أكثر المستودعات تداولاً</div>
          ${topWhRows
            ? `<div style="max-height:320px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="sticky-thead"><thead><tr><th style="width:40px">#</th><th>الرقم</th><th style="width:70px;text-align:center">المرّات</th><th style="width:90px;text-align:center">الحالة</th></tr></thead><tbody>${topWhRows}</tbody></table></div>`
            : `<div class="empty">لا توجد حركات مسجّلة</div>`}
        </div>
      </div>

      <div>
        <div style="font-weight:600;margin-bottom:.5rem">🏢 توزيع الأقسام</div>
        ${deptRows
          ? `<div style="max-height:280px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="sticky-thead"><thead><tr><th>القسم</th><th style="width:120px;text-align:center">الموظفون</th><th style="width:140px;text-align:center">المستودعات المُسندة</th></tr></thead><tbody>${deptRows}</tbody></table></div>`
          : `<div class="empty">لا توجد أقسام</div>`}
      </div>

      <div class="modal-actions" style="margin-top:1.25rem">
        <button class="btn btn-ghost" onclick="closeModal()">إغلاق</button>
        <button class="btn btn-primary" style="margin-right:.5rem" onclick="closeModal();nav('reports')">📑 الانتقال للتقارير</button>
      </div>
    </div></div>`;
}

/* ========= الأقسام (Departments) ========= */
function openDeptModal(idx){
  const name = state.departments[idx] || `القسم ${idx+1}`;
  const members = state.employees.filter(e => e.department === idx)
    .sort((a,b)=> (a.name||'').localeCompare(b.name||'','ar'));
  const colCount = isAdmin() ? 4 : 3;
  const widths = isAdmin()
    ? `<th style="width:38%">الاسم</th><th style="width:22%">الجوال</th><th style="width:22%;text-align:center">عدد المستودعات</th><th style="width:18%"></th>`
    : `<th style="width:48%">الاسم</th><th style="width:27%">الجوال</th><th style="width:25%;text-align:center">عدد المستودعات</th>`;
  const rows = members.map(e => {
    const whs = activeAssignmentsForEmployee(e.id).length;
    return `<tr>
      <td style="white-space:nowrap"><a class="emp-link" onclick="closeModal();showEmpDetails('${e.id}')">${esc(e.name)}</a></td>
      <td style="white-space:nowrap">${esc(e.phone||'-')}</td>
      <td style="text-align:center"><span class="badge badge-busy">${whs}</span></td>
      ${isAdmin()?`<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="removeEmpFromDept('${e.id}',${idx})">إزالة</button></td>`:''}
    </tr>`;
  }).join('');
  modal(`
    <h3>🏷️ ${esc(name)}</h3>
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:.85rem">عدد الموظفين في القسم: <b>${members.length}</b></p>
    ${members.length===0
      ? `<div class="empty">لا يوجد موظفون في هذا القسم</div>`
      : `<div style="max-height:480px;overflow:auto;border:1px solid var(--border-2);border-radius:10px"><table class="sticky-thead"><thead><tr>${widths}</tr></thead><tbody>${rows}</tbody></table></div>`}
    <div class="modal-actions" style="flex-wrap:wrap">
      ${isAdmin()?`<button class="btn btn-success" onclick="openAddEmpToDept(${idx})">+ إضافة موظف</button>`:''}
      <button class="btn btn-ghost" onclick="closeModal()">إغلاق</button>
    </div>
  `, {wide: 820});
}
function openAddEmpToDept(idx){
  const name = state.departments[idx] || `القسم ${idx+1}`;
  // فقط الموظفون غير المنتسبين لأي قسم
  const candidates = state.employees
    .filter(e => typeof e.department !== 'number')
    .sort((a,b)=> (a.name||'').localeCompare(b.name||'','ar'));
  if(!candidates.length) return toast('لا يوجد موظفون بدون قسم. استخدم زر «✏️ تعديل» لنقل موظف من قسم آخر.', 'info');
  const items = candidates.map(e =>
    `<div class="pick-item" data-search="${esc(((e.name||'')+' '+(e.phone||'')).toLowerCase())}" onclick="addEmpToDept('${e.id}',${idx})">
      <b>${esc(e.name)}</b>${e.phone?`<span style="color:var(--muted);font-size:.78rem;margin-right:.4rem">— ${esc(e.phone)}</span>`:''}
    </div>`).join('');
  modal(`
    <h3>+ إضافة موظف إلى ${esc(name)}</h3>
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:.5rem">تظهر فقط الأسماء غير المُسندة لأي قسم. لنقل موظف من قسم آخر استخدم زر <b>✏️ تعديل</b>.</p>
    <div class="field"><label>ابحث</label>
      <input id="dept_add_search" placeholder="ابحث باسم الموظف أو الجوال..." oninput="deptAddFilter()" />
    </div>
    <div id="dept_add_list" class="pick-list" style="max-height:300px">${items}</div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="openDeptModal(${idx})">رجوع</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>
  `);
}
function deptAddFilter(){
  const q = (document.getElementById('dept_add_search')?.value || '').trim().toLowerCase();
  document.querySelectorAll('#dept_add_list .pick-item').forEach(el => {
    el.style.display = (!q || (el.getAttribute('data-search')||'').includes(q)) ? '' : 'none';
  });
}
function addEmpToDept(eid, idx){
  const e = state.employees.find(x => x.id===eid); if(!e) return;
  const prev = (typeof e.department === 'number') ? state.departments[e.department] : null;
  e.department = idx;
  save(state);
  const deptName = state.departments[idx] || `القسم ${idx+1}`;
  toast(prev
    ? `✓ تم نقل ${e.name} من ${prev} إلى ${deptName}`
    : `✓ تم إضافة ${e.name} إلى ${deptName}`, 'success');
  // تحديث أعداد الأقسام في اللوحة الرئيسية إن كانت معروضة
  if(document.getElementById('main')?.querySelector('.dept-buttons')) renderDashboard();
  openDeptModal(idx);
}
function removeEmpFromDept(eid, idx){
  const e = state.employees.find(x => x.id===eid); if(!e) return;
  if(!confirm(`إزالة ${e.name} من ${state.departments[idx]||''}؟`)) return;
  e.department = null;
  save(state);
  toast('✓ تمت الإزالة', 'success');
  if(document.getElementById('main')?.querySelector('.dept-buttons')) renderDashboard();
  openDeptModal(idx);
}
function openDeptSettings(){
  if(!isAdmin()) return;
  const fields = state.departments.map((n,i) =>
    `<div class="field"><label>اسم القسم ${i+1}</label><input id="dept_name_${i}" value="${esc(n)}" /></div>`
  ).join('');
  modal(`
    <h3>⚙️ تغيير أسماء الأقسام</h3>
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:.5rem">يمكن تخصيص اسم كل قسم. عدد الأقسام ثابت (5).</p>
    ${fields}
    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveDeptNames()">حفظ</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>
  `);
}
/* تعديل أقسام جميع الموظفين دفعة واحدة */
function openDeptEdit(){
  if(!isAdmin()) return;
  if(!state.employees.length) return toast('لا يوجد موظفون مسجلون', 'info');
  const deptOptions = (currentIdx) => {
    const none = `<option value="">— بدون قسم —</option>`;
    const opts = state.departments.map((n,i) =>
      `<option value="${i}"${currentIdx===i?' selected':''}>${esc(n)}</option>`).join('');
    return none + opts;
  };
  const rows = state.employees
    .slice().sort((a,b)=> (a.name||'').localeCompare(b.name||'','ar'))
    .map(e => {
      const cur = (typeof e.department === 'number') ? e.department : null;
      return `<tr data-search="${esc(((e.name||'')+' '+(e.phone||'')).toLowerCase())}">
        <td style="white-space:nowrap"><b>${esc(e.name)}</b></td>
        <td style="white-space:nowrap;color:var(--muted);font-size:.85rem">${esc(e.phone||'-')}</td>
        <td style="min-width:220px"><select class="dept-edit-sel" data-eid="${e.id}" data-orig="${cur===null?'':cur}" style="width:100%">${deptOptions(cur)}</select></td>
      </tr>`;
    }).join('');
  modal(`
    <h3>✏️ تعديل توزيع الموظفين على الأقسام</h3>
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:.5rem">عدّل قسم أيّ موظف من القائمة المنسدلة بجانب اسمه ثم اضغط <b>حفظ التغييرات</b>.</p>
    <div class="field" style="margin-bottom:.6rem">
      <input id="dept_edit_search" placeholder="ابحث باسم الموظف أو الجوال..." oninput="deptEditFilter()" />
    </div>
    <div style="max-height:480px;overflow:auto;border:1px solid var(--border-2);border-radius:10px">
      <table class="sticky-thead" id="deptEditTable">
        <thead><tr><th style="width:38%">الاسم</th><th style="width:22%">الجوال</th><th style="width:40%">القسم</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="saveDeptEdit()">✓ حفظ التغييرات</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>
  `, {wide: 820});
}
function deptEditFilter(){
  const q = (document.getElementById('dept_edit_search')?.value || '').trim().toLowerCase();
  document.querySelectorAll('#deptEditTable tbody tr').forEach(tr => {
    const k = tr.getAttribute('data-search') || '';
    tr.style.display = (!q || k.includes(q)) ? '' : 'none';
  });
}
function saveDeptEdit(){
  let changed = 0;
  document.querySelectorAll('.dept-edit-sel').forEach(sel => {
    const eid = sel.getAttribute('data-eid');
    const orig = sel.getAttribute('data-orig');
    const val = sel.value;
    const e = state.employees.find(x => x.id===eid);
    if(!e) return;
    const newDept = val === '' ? null : Number(val);
    const oldDept = orig === '' ? null : Number(orig);
    if(newDept !== oldDept){
      e.department = (newDept===null) ? null : newDept;
      changed++;
    }
  });
  save(state); closeModal();
  toast(changed>0 ? `✓ تم حفظ ${changed} تغييراً` : 'لا توجد تغييرات', changed>0?'success':'info');
  if(document.getElementById('main')?.querySelector('.dept-buttons')) renderDashboard();
}
function saveDeptNames(){
  const names = [];
  for(let i=0;i<5;i++){
    const v = (document.getElementById('dept_name_'+i)?.value || '').trim();
    names.push(v || `القسم ${i+1}`);
  }
  state.departments = names;
  save(state); closeModal();
  toast('✓ تم حفظ أسماء الأقسام', 'success');
  if(document.getElementById('main')?.querySelector('.dept-buttons')) renderDashboard();
}

/* ========= Boot ========= */
document.getElementById('loginPassword').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
if(restoreSession()) showApp();


/* ========= Warehouses in Employee Custody ========= */
function renderCustody(){
  const items = state.employees
    .map(employee => ({
      employee,
      assignments: activeAssignmentsForEmployee(employee.id)
    }))
    .filter(item => item.assignments.length > 0);

  const rows = items.map(item => `
    <tr>
      <td>
        <a class="emp-link"
           onclick="showEmpDetails('${item.employee.id}')">
          ${esc(item.employee.name)}
        </a>
      </td>

      <td>${esc(item.employee.phone || '-')}</td>

      <td style="text-align:center">
        <span class="badge badge-busy">
          ${item.assignments.length}
        </span>
      </td>

      <td>
        ${item.assignments.map(assignment => `
          <div style="margin:.3rem 0">
            <span class="wh-pill"
                  onclick="showWarehouseDetails('${assignment.warehouseId}')">
              ${esc(whNumber(assignment.warehouseId))}
            </span>

            <span style="color:var(--muted);font-size:.8rem">
              تاريخ التسليم: ${esc(fmtDate(assignment.receivedAt))}
            </span>
          </div>
        `).join('')}
      </td>
    </tr>
  `).join('');

  document.getElementById('main').innerHTML = `
    <div class="page-head">
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-success" onclick="openHandover()">
          📤 تسليم مستودع لموظف
        </button>

        <button class="btn btn-primary" onclick="openReceive()">
          📥 استلام مستودع من موظف
        </button>
      </div>

      <div class="title">
        <h1>المستودعات بعهدة الموظفين</h1>
        <div class="desc">
          الموظفون والمستودعات الموجودة بعهدتهم حاليًا
        </div>
      </div>
    </div>

    <div class="card">
      ${items.length === 0
        ? `<div class="empty">لا توجد مستودعات بعهدة الموظفين</div>`
        : `
          <div style="max-height:520px;overflow:auto;border:1px solid var(--border-2);border-radius:10px">
  <table class="sticky-thead">
    <thead>
      <tr>
        <th>الموظف</th>
        <th>الجوال</th>
        <th style="text-align:center">العدد</th>
        <th>المستودعات وتاريخ التسليم</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>
        `
      }
    </div>
  `;
}

/* ========= Free Warehouses ========= */
function renderFreeWarehouses(){
  const freeWarehouses = state.warehouses
    .filter(warehouse =>
      !activeAssignmentForWarehouse(warehouse.id)
    )
    .sort((a, b) =>
      String(a.number).localeCompare(
        String(b.number),
        'ar',
        { numeric: true }
      )
    );

  const rows = freeWarehouses.map(warehouse => `
    <tr>
      <td>
        <a class="wh-link"
           onclick="showWarehouseDetails('${warehouse.id}')">
          ${esc(warehouse.number)}
        </a>
      </td>

      <td>
        <span class="badge badge-free">فارغ</span>
      </td>

      <td>${esc(warehouse.location || '-')}</td>

      <td>${esc(warehouse.notes || '-')}</td>

      <td>
        ${isAdmin() ? `
          <button
            class="btn btn-success btn-sm"
            onclick="openHandoverForFree('${warehouse.id}')"
          >
            📤 تسليم لموظف
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');

  document.getElementById('main').innerHTML = `
    <div class="page-head">
      ${isAdmin() ? `
        <button class="btn btn-success" onclick="openHandover()">
          📤 تسليم مستودع لموظف
        </button>
      ` : '<span></span>'}

      <div class="title">
        <h1>المستودعات الفارغة</h1>
        <div class="desc">
          المستودعات الجاهزة للتسليم إلى الموظفين
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-h">
        <div class="ttl">
          المستودعات الفارغة (${freeWarehouses.length})
        </div>

        <input
          id="freePageSearch"
          placeholder="ابحث برقم المستودع..."
          oninput="filterFreeWarehousesPage()"
          style="max-width:300px"
        />
      </div>

      ${freeWarehouses.length === 0
        ? `<div class="empty">لا توجد مستودعات فارغة حاليًا</div>`
        : `
          <div style="max-height:520px;overflow:auto;border:1px solid var(--border-2);border-radius:10px">
            <table id="freeWarehousesTable" class="sticky-thead">
              <thead>
                <tr>
                  <th>رقم المستودع</th>
                  <th>الحالة</th>
                  <th>الموقع</th>
                  <th>ملاحظات</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `
      }
    </div>
  `;
}

function filterFreeWarehousesPage(){
  const query = (
    document.getElementById('freePageSearch')?.value || ''
  ).trim().toLowerCase();

  document
    .querySelectorAll('#freeWarehousesTable tbody tr')
    .forEach(row => {
      row.style.display =
        !query || row.textContent.toLowerCase().includes(query)
          ? ''
          : 'none';
    });
}
/* ========= Statistics Page ========= */
function renderStatistics(){
  /* نبني الإحصائيات باستخدام الوظيفة الحالية */
  showStatsPanel();

  const modalContent = document.querySelector(
    '#modalMount .modal'
  );

  if(!modalContent){
    document.getElementById('main').innerHTML = `
      <div class="empty">تعذر تحميل الإحصائيات</div>
    `;
    return;
  }

  const statisticsHtml = modalContent.innerHTML;

  /* نغلق النسخة المنبثقة */
  closeModal();

  /* نعرض المحتوى داخل صفحة مستقلة */
  document.getElementById('main').innerHTML = `
    <div class="page-head">
      <span></span>

      <div class="title">
        <h1>الإحصائيات</h1>
        <div class="desc">
          نظرة تحليلية على المستودعات والموظفين والحركات
        </div>
      </div>
    </div>

    <div class="card" id="statisticsPageContent">
      ${statisticsHtml}
    </div>
  `;

  const pageContent = document.getElementById(
    'statisticsPageContent'
  );

  /* إزالة عنوان النافذة القديم وأزرار الإغلاق */
  pageContent.querySelector('h3')?.remove();
  pageContent.querySelector('.modal-actions')?.remove();
}