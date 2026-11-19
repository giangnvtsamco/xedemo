/* Xe Demo · trang nhân viên · v1.3
   Cần nạp trước: config.js, samco-core api.js + ui.js, print.js. */
(function () {
  const pad = n => String(n).padStart(2, '0');
  const isoNow = (addMin) => { const d = new Date(Date.now() + (addMin || 0) * 60000); d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const hmNow = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const TT = [['ngoai', 'Ngoại thất'], ['noi', 'Nội thất'], ['nhienLieu', 'Nhiên liệu · pin'], ['dauNhot', 'Dầu nhớt động cơ'], ['nuoc', 'Nước và dung dịch khác'], ['dien', 'Hệ thống điện'], ['lop', 'Lốp']];
  const KEY = 'xedemo_auth';
  let A = (() => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } })();
  let D = null, STAFF = [], tab = 'xe', printCache = {};
  const APP_V = '1.3.0', SITE = 'https://xedemo.vinfastsamcobinhtan.com/';
  // Lưu bản dữ liệu gần nhất trên máy: mở app là thấy ngay, rồi cập nhật ngầm
  const cKey = () => 'xedemo_cache_' + (A && A.ten || '');
  const cacheGet = () => { try { return JSON.parse(localStorage.getItem(cKey()) || 'null'); } catch (e) { return null; } };
  const cacheSet = d => { try { localStorage.setItem(cKey(), JSON.stringify(d)); } catch (e) {} };
  // Link nhắc duyệt: ?duyet=LT-... → mở thẳng tab Duyệt lệnh
  let goDuyet = (() => { try { return new URLSearchParams(location.search).get('duyet') || ''; } catch (e) { return ''; } })();
  if (goDuyet) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }

  const api = (fn, ...a) => call(fn, A, ...a);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(A)); } catch (e) {} };
  const sheet = id => document.getElementById(id);
  function openS(id) { sheet(id).hidden = false; document.body.style.overflow = 'hidden'; }
  function closeS(id) { sheet(id).hidden = true; if (!document.querySelector('.sheet-bg:not([hidden])')) document.body.style.overflow = ''; }
  function fail(e) { if (/đăng nhập/i.test(String(e))) { logout(); toast('Vui lòng chọn lại họ tên.', 1); return; } toast(e, 1); }

  /* ---------- Đăng nhập: chọn tên → (người duyệt) nhập mã 4 số, tự vào ---------- */
  async function boot() {
    XP.init({ base: '' });
    appFoot('Xe Demo', APP_V, $('#appFoot'));
    if (A && A.ten) {
      const c = cacheGet();
      if (c && c.me) { D = c; $('#vLogin').hidden = true; $('#vApp').hidden = false; render(); }
      return enter();
    }
    showLogin();
  }
  async function loadStaff() {
    try {
      STAFF = await call('xdStaff');
      const g = {}; STAFF.forEach(s => (g[s.boPhan] = g[s.boPhan] || []).push(s));
      $('#who').innerHTML = '<option value="">— Chọn họ tên —</option>' + Object.keys(g).map(b => `<optgroup label="${esc(b)}">` +
        g[b].map(s => `<option value="${esc(s.ten)}">${esc(s.ten)}</option>`).join('') + '</optgroup>').join('');
    } catch (e) { $('#who').innerHTML = '<option value="">Không tải được danh sách</option>'; toast(e, 1); }
  }
  function showLogin() {
    $('#vLogin').hidden = false; $('#vApp').hidden = true; $('#who').value = ''; $('#pinBox').hidden = true; $('#goBtn').hidden = false;
    if (!STAFF.length) loadStaff();
  }
  function logout() { try { localStorage.removeItem(cKey()); } catch (e) {} A = null; try { localStorage.removeItem(KEY); } catch (e) {} D = null; showLogin(); }
  let code = '';
  function onWho() {
    const s = STAFF.find(x => x.ten === $('#who').value);
    code = ''; dots();
    $('#pinBox').hidden = !(s && s.can); $('#goBtn').hidden = !!(s && s.can);
    $('#pinWho').textContent = s && s.can ? 'Người duyệt lệnh · nhập mã 4 số' : '';
  }
  function dots() { $$('#pinDots i').forEach((d, i) => d.classList.toggle('f', i < code.length)); }
  async function tryCode() {
    const ten = $('#who').value;
    A = { ten, ma: code };
    $('#pinMsg').textContent = 'Đang kiểm tra…';
    try { D = await api('xdInit'); save(); cacheSet(D); $('#pinMsg').textContent = ''; enter(true); }
    catch (e) { A = null; code = ''; dots(); $('#pinMsg').textContent = String(e).replace(/\s*\(đăng nhập\)/, ''); }
  }
  async function enter(loaded) {
    $('#vLogin').hidden = true; $('#vApp').hidden = false;
    if (!loaded) await load(); else render();
  }

  async function load() {
    try { D = await api('xdInit'); cacheSet(D); render(); }
    catch (e) {
      if (/đăng nhập/i.test(String(e))) return fail(e);
      if (D) return toast(String(e) + ' Đang hiện dữ liệu lần trước.', 1); // giữ màn hình cũ, không xóa trắng
      $('#xdGrid').innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(e)}<br><button class="btn sm out" style="margin-top:10px" id="xdRetry">Thử lại</button></div>`;
      $('#xdRetry').onclick = load;
    }
  }

  /* ---------- Giao diện chính ---------- */
  function render() {
    const me = D.me;
    $('#meName').textContent = me.ten;
    $('#meSub').textContent = (me.sale ? 'Sale · nhóm ' + (me.nhom || '—') : me.boPhan) + (me.duyet ? ' · ' + me.duyet.chucDanh : '');
    $('#tabs').hidden = !me.duyet;
    if (goDuyet && me.duyet) tab = 'duyet';
    const n = me.duyet && D.cho ? D.cho.cho.length : 0;
    $('#tabDuyet').innerHTML = 'Duyệt lệnh' + (n ? ` <span class="badge">${n}</span>` : '');
    $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    $('#vXe').hidden = tab !== 'xe'; $('#vDuyet').hidden = tab !== 'duyet' || !me.duyet;
    // phiếu của tôi
    $('#xdMine').innerHTML = D.mine.length ? `<div class="xd-mine"><span class="sect">Phiếu của bạn · ${D.mine.length}</span>${D.mine.map(p => {
      const car = D.cars.find(c => c.bien === p.bien) || {};
      const t = p.trangThai === 'Đang dùng' ? 'đang dùng · về ' + p.veDkHm : 'đặt ' + p.diDkHm + ' ' + p.ngay;
      return `<button data-phieu="${esc(p.id)}"><span><b>${esc(car.loai || p.bien)}</b> ${esc(t)}<br>${chipDuyet(p)}</span><span class="small b" style="color:var(--accent);white-space:nowrap">${p.trangThai === 'Đang dùng' ? 'Trả xe' : 'ODO · Trả xe'} ›</span></button>` +
        (p.duyet === 'Chờ duyệt' && p.nguoiDuyet ? `<button class="xd-nhac" data-nhac="${esc(p.id)}">Nhắc ${esc(String(p.nguoiDuyet).split(' ').pop())} duyệt</button>` : '');
    }).join('')}</div>` : '';
    $('#xdGrid').innerHTML = D.cars.map(c => `<button class="xd-car" data-bien="${esc(c.bien)}">
      <span class="n">${esc(c.loai)}</span><span class="b">${esc(c.bien)}</span>
      <span class="s xd-${c.st}"><i></i>${esc(c.label)}</span></button>`).join('');
    $('#xdRecent').innerHTML = D.ganDay.length ? `<span class="sect">Chuyến gần đây của bạn</span><div class="card flat" style="padding:4px 14px">${D.ganDay.map(p => `
      <div class="xd-row"><div><b>${esc((D.cars.find(c => c.bien === p.bien) || {}).loai || '')} ${esc(p.bien)}</b> · ${esc(p.muc)}<br><span class="small muted">${esc(p.ngayFull)} · ${p.km === '' ? '—' : esc(p.km) + ' km'}</span></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">${chipDuyet(p)}${p.muc === 'Công tác' ? `<button class="btn sm" data-inlai="${esc(p.id)}">In lệnh</button>` : ''}</div></div>`).join('')}</div>` : '';
    if (me.duyet) renderDuyet();
  }
  function chipDuyet(p) {
    const d = p.duyet;
    if (!d || d === 'Không cần' || d === 'Trước khi dùng app') return '';
    const cls = d === 'Đã duyệt' ? 'ok' : d === 'Không duyệt' ? 'bad' : 'warn';
    const who = d === 'Chờ duyệt' ? (p.nguoiDuyet ? ' · ' + p.nguoiDuyet.split(' ').pop() : ' · ' + p.capDuyet) : d === 'Đã duyệt' && p.cachDuyet === 'Giấy' ? ' · giấy' : '';
    return `<span class="chip ${cls}">${esc(d + who)}</span>`;
  }

  /* ---------- Tab duyệt lệnh ---------- */
  function renderDuyet() {
    const C = D.cho || { cho: [], xong: [] };
    const item = (x, done) => `<div class="xd-ap" data-ap="${esc(x.id)}">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
        <div style="min-width:0"><b>${esc(x.nguoi)}</b> <span class="small muted">· ${esc(x.boPhan)}</span><br>
          <span class="small">${esc(x.muc)} · <b>${esc(x.loai)} ${esc(x.bien)}</b>${x.xa ? ' · <b style="color:var(--warn)">đi xa</b>' : ''}</span></div>
        ${done ? `<span class="chip ${x.duyet === 'Đã duyệt' ? 'ok' : 'bad'}">${esc(x.duyet)}</span>` : `<span class="chip ${x.trangThai === 'Đã trả' ? 'mute' : 'acc'}">${esc(x.trangThai)}</span>`}</div>
      <div class="small">${esc(x.loTrinh)}</div>
      <div class="small muted mono">${esc(x.di)} → ${esc(x.ve)}${x.km !== '' ? ' · ' + esc(x.km) + ' km' : ''}${done ? ' · xử lý ' + esc(x.duyetLuc) : x.cho != null ? ' · chờ ' + x.cho + ' giờ' : ''}</div>
      ${done ? (x.yKien ? `<div class="small" style="color:var(--bad)">Lý do: ${esc(x.yKien)}</div>` : '') : `<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:8px">
        <button class="btn out" data-no style="color:var(--bad)">Không duyệt</button><button class="btn pri" data-ok>Duyệt</button></div>`}</div>`;
    $('#apCho').innerHTML = C.cho.length ? C.cho.map(x => item(x)).join('') : '<div class="empty">Không có lệnh nào chờ duyệt.</div>';
    $('#apXong').innerHTML = C.xong.length ? C.xong.map(x => item(x, true)).join('') : '<div class="empty">Chưa có.</div>';
    if (goDuyet) {
      const el = document.querySelector(`[data-ap="${CSS.escape(goDuyet)}"]`);
      if (el) { el.classList.add('xd-hl'); setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150); }
      else if (D.cho) toast('Lệnh ' + goDuyet + ' không còn chờ bạn duyệt.');
      goDuyet = '';
    }
  }
  async function decide(btn, id, ok) {
    let yKien = '';
    if (!ok) { yKien = prompt('Lý do không duyệt (bắt buộc):', ''); if (yKien === null) return; if (!yKien.trim()) return toast('Vui lòng ghi lý do không duyệt.', 1); }
    busy(btn, '', async () => {
      try { D.cho = await api('xdApprove', id, ok, yKien); toast(ok ? 'Đã duyệt lệnh' : 'Đã ghi nhận không duyệt'); render(); }
      catch (e) { fail(e); }
    });
  }

  /* ---------- Xe: thông tin + chuyến trước ---------- */
  function openCar(bien) {
    const c = D.cars.find(x => x.bien === bien); if (!c) return;
    $('#xdCarTitle').textContent = c.loai + ' · ' + c.bien;
    $('#xdCarInfo').innerHTML = `<span class="chip ${({ san: 'ok', sac: 'warn', di: 'acc', dat: 'acc', dv: 'warn', giu: 'warn' })[c.st] || 'mute'}">${esc(c.label)}</span>
      <span class="small muted">ODO ${c.odo === '' ? '—' : num(c.odo)} · pin ${c.pin == null ? '—' : c.pin + '%'}</span>`;
    const mine = c.mine && c.phieu;
    // xe giao cố định (Giám đốc, XMĐ…): vẫn lấy được, hỏi người giữ trước
    $('#xdCarGiu').hidden = !c.giu || c.st === 'ngung';
    $('#xdCarGiu').innerHTML = c.giu ? 'Xe <b>' + esc(c.giu) + '</b> đang giữ. Vui lòng hỏi ' + esc(c.giu) + ' trước khi lấy xe.' : '';
    $('#xdCarNew').hidden = c.st === 'ngung';
    $('#xdCarNew').textContent = mine ? 'Phiếu của bạn · ODO · Trả xe' : 'Lập phiếu';
    $('#xdCarNew').onclick = () => { closeS('xdCarDlg'); if (mine) openUse(c.phieu); else openForm(c, null); };
    const lich = c.lich || [];
    $('#xdLich').hidden = !lich.length;
    $('#xdLichList').innerHTML = lich.map(l => `<div class="kv"><span>${l.mine ? '<b>Bạn</b>' : esc(l.nguoi)}${l.dang ? ' · <b style="color:var(--accent)">đang dùng</b>' : ''}</span><span class="mono">${esc(l.tu)} → ${esc(l.den)}</span></div>`).join('');
    $('#xdLichHint').hidden = !lich.length || !!mine;
    const t = c.truoc;
    $('#xdLogList').innerHTML = t ? `<div class="card flat" style="padding:4px 14px">
        <div class="kv"><span>Người mượn</span><b>${esc(t.nguoi)}${t.muc ? ' · ' + esc(t.muc) : ''}</b></div>
        <div class="kv"><span>Trả xe lúc</span><span class="mono">${esc(t.tra || '—')}</span></div>
        <div class="kv"><span>ODO kết thúc</span><span class="mono b">${esc(t.odoVe || '—')}</span></div>
        <div class="kv"><span>Pin kết thúc</span><span class="mono b">${t.pin === '' || t.pin == null ? '—' : esc(t.pin) + '%'}</span></div></div>` : '<div class="empty">Chưa có chuyến nào.</div>';
    openS('xdCarDlg');
  }

  /* ---------- Nhắc người duyệt: chia sẻ qua Zalo hoặc sao chép tin ---------- */
  function nhacText(p) {
    const car = D.cars.find(c => c.bien === p.bien) || {};
    const goi = String(p.nguoiDuyet || '').split(/\s+/).pop();
    const xung = / Thị /.test(' ' + p.nguoiDuyet + ' ') ? 'chị' : 'anh'; // tên đệm "Thị" (VD Huỳnh Thị Anh Đào) → chị, còn lại → anh
    return 'Nhờ ' + xung + ' ' + goi + ' duyệt giúp lệnh xe:\n' +
      [car.loai, p.bien].filter(Boolean).join(' ') + ' · ' + p.muc + (p.xa ? ' · đi xa' : '') + '\n' +
      p.diDkHm + ' ' + (p.ngay || '') + ' → ' + p.veDkHm + ' · ' + D.me.ten + '\n' +
      (p.loTrinh ? p.loTrinh + '\n' : '') + 'Duyệt tại: ' + SITE + '?duyet=' + encodeURIComponent(p.id);
  }
  let NH = null;
  function openNhac(p) {
    NH = p; $('#xdNhacWho').textContent = p.nguoiDuyet; $('#xdNhacTxt').textContent = nhacText(p);
    $('#xdNhacShare').hidden = !navigator.share; openS('xdNhacDlg');
  }

  /* ---------- Bước 1: lập phiếu ---------- */
  let F = null;
  function openForm(car, p) {
    F = { car, id: p ? p.id : null, anhTruoc: '', anhSau: '', muc: p ? p.muc : D.mucDich[0] };
    $('#xdFormTitle').textContent = car.loai + ' ' + car.bien;
    $('#xdMode').hidden = D.mucDich.length < 2;
    const v = (id, x) => { $('#' + id).value = x || ''; };
    v('fKh', p && p.kh); v('fSdt', p && p.sdt); v('fDiaChi', p && p.diaChi); v('fGplx', p && p.gplx); v('fHan', p && p.hanGplx);
    const cache = p && printCache[p.id] || {};
    v('fCccd', cache.cccd); v('fCapNgay', cache.capNgay); v('fNoiCap', cache.noiCap);
    $('#fDongY').checked = p ? p.dongY : false; $('#fTuLai').checked = p ? p.tuLai : true; $('#fXa').checked = p ? p.xa : false;
    const xa = D.duyetXa, goi = xa.ten ? xa.ten.split(/\s+/).pop() : '';
    $('#fXaWho').textContent = xa.can && goi && xa.ten !== D.duyetGan.ten ? ' · ' + (goi === 'Quang' ? 'anh Quang' : goi) + ' duyệt' : '';
    v('fLoTrinh', p && p.loTrinh); v('fDiDk', p ? p.diDk : isoNow(10)); v('fVeDk', p ? p.veDk : isoNow(70));
    $$('#fPhoto button').forEach(b => { b.classList.remove('has'); b.textContent = b.dataset.side === 'truoc' ? 'Bằng lái mặt trước' : 'Mặt sau'; });
    syncForm(); openS('xdFormDlg');
    const st = $('#fPkdSt'); st.style.color = ''; st.textContent = 'Máy in PKD lầu 1: lưu phiếu và in thẳng ra máy in Phòng Kinh Doanh, không cần kết nối điện thoại.';
    api('inTram').then(t => { if (!t.bat) { st.style.color = 'var(--warn)'; st.textContent = 'Máy in PKD lầu 1 đang tắt: vẫn gửi được, máy bật là tự in (trong 6 giờ).'; } }).catch(() => {});
  }
  function syncForm() {
    const lt = F.muc === 'Khách lái thử';
    $$('#xdMode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === F.muc)));
    $('#fKhach').hidden = !lt;
    $('#fLoTrinh').placeholder = lt ? 'VD: Showroom → Võ Văn Kiệt → Showroom' : 'VD: Giao hồ sơ ngân hàng VPBank Q.6';
    $('#fPhoto').style.opacity = $('#fDongY').checked ? 1 : .45;
    const ap = $('#fXa').checked ? D.duyetXa : D.duyetGan;
    $('#fApv').innerHTML = ap.can ? `<span class="lbl">Người duyệt lệnh</span><b>${esc(ap.cap)}${ap.ten ? ' · ' + esc(ap.ten) : ''}</b><span class="small">${ap.ten ? 'Lấy xe được ngay, duyệt sau trên app.' : 'In lệnh, trình lãnh đạo ký giấy.'}</span>`
      : '<span class="lbl">Người duyệt lệnh</span><b>Không cần duyệt</b>';
    $('#fPrintNote').textContent = lt ? 'In: Lệnh điều xe + Phiếu yêu cầu (trang 1) · Giấy cam kết (trang 2)' : 'In: 2 Lệnh điều xe trên 1 trang (như mẫu gốc)';
  }
  function formData() {
    return { bien: F.car.bien, mucDich: F.muc, kh: $('#fKh').value, sdt: $('#fSdt').value, diaChi: $('#fDiaChi').value, gplx: $('#fGplx').value, hanGplx: $('#fHan').value,
      dongY: $('#fDongY').checked, tuLai: $('#fTuLai').checked, anhTruoc: F.anhTruoc, anhSau: F.anhSau, loTrinh: $('#fLoTrinh').value, xa: $('#fXa').checked,
      diDk: $('#fDiDk').value, veDk: $('#fVeDk').value };
  }
  async function saveForm(btn, thenPrint) {
    const d = formData();
    if (d.mucDich === 'Khách lái thử' && !d.kh.trim()) return toast('Vui lòng nhập họ tên khách.', 1);
    if (!d.loTrinh.trim()) return toast('Vui lòng nhập lộ trình hoặc nội dung.', 1);
    if (!d.diDk || !d.veDk) return toast('Vui lòng nhập giờ đi và giờ về dự kiến.', 1);
    return busy(btn, 'Đang lưu', async () => {
      try {
        const p = await api('xdSave', d, F.id);
        printCache[p.id] = { cccd: $('#fCccd').value.trim(), capNgay: $('#fCapNgay').value.trim(), noiCap: $('#fNoiCap').value.trim() }; // chỉ giữ trên máy
        closeS('xdFormDlg'); toast('Đã lưu phiếu ' + p.id);
        if (thenPrint) doPrint(p, thenPrint);
        await load();
        if (p.duyet === 'Chờ duyệt' && p.nguoiDuyet) openNhac(D.mine.find(x => x.id === p.id) || p);
      } catch (e) { fail(e); }
    });
  }
  /* ---------- In hồ sơ: ở máy in Phòng Kinh Doanh lầu 1 (trạm in) hoặc trên máy này ---------- */
  let PJ = null, inT = 0;
  // bỏ ảnh và chuỗi dài: hồ sơ in chỉ cần chữ, gửi đi cho nhẹ
  const gon = o => { const r = {}; Object.keys(o).forEach(k => { const v = o[k]; if (typeof v === 'string' && (v.length > 2000 || /^data:/.test(v))) return; r[k] = v; }); return r; };
  // cach: 'may' = in ngay trên máy này · 'pkd' = gửi thẳng máy in PKD lầu 1 · bỏ trống = hỏi chọn
  function doPrint(p, cach) {
    const car = D.cars.find(c => c.bien === p.bien) || {};
    const x = gon(Object.assign({}, p, { loai: car.loai || p.loai || '', nguoi: D.me.ten, vaiTro: D.me.vaiTro, boPhan: D.me.boPhan }));
    clearTimeout(inT);
    PJ = { x, cc: printCache[p.id] || null };
    if (cach === 'may') return XP.print(XP.hoSo(x, PJ.cc));
    $('#xdInId').textContent = 'Phiếu ' + p.id + ' · ' + (XP.hoSo(x, PJ.cc).length) + ' trang A4';
    $('#inChon').hidden = false; $('#inCho').hidden = true; $('#inCongTy').disabled = false;
    tram(null); openS('xdInDlg');
    if (cach === 'pkd') return inGui();
    api('inTram').then(t => tram(t.bat)).catch(() => tram(false));
  }
  function tram(bat) {
    const el = $('#inTram');
    el.className = 'xd-tram' + (bat === true ? ' on' : bat === false ? ' off' : '');
    el.querySelector('span').innerHTML = bat === null ? 'Đang kiểm tra máy in Phòng Kinh Doanh lầu 1…'
      : bat ? 'Máy in Phòng Kinh Doanh lầu 1 sẵn sàng<small>In xong trong khoảng 10 giây.</small>'
      : 'Máy trạm in đang tắt<small>Vẫn gửi được: hồ sơ tự in khi máy bật (giữ tối đa 6 giờ). Cần gấp: báo IT hoặc In trên máy này.</small>';
  }
  function inStt(kind, html) {
    $('#inChon').hidden = true; $('#inCho').hidden = false;
    $('#inStt').className = 'xd-instt' + (kind === 'ok' ? ' ok' : '');
    $('#inStt').innerHTML = (kind === 'cho' ? '<div class="xd-spin"></div>' : '') + html;
    $('#inMay2').hidden = kind === 'ok';
  }
  function inLocal() { if (!PJ) return; clearTimeout(inT); closeS('xdInDlg'); XP.print(XP.hoSo(PJ.x, PJ.cc)); }
  function inGui() {
    const job = PJ; if (!job) return;
    inStt('cho', '<b>Đang gửi đến máy in Phòng Kinh Doanh lầu 1…</b>');
    (async () => {
      try {
        const r = await api('inGui', { x: job.x, cc: job.cc });
        job.jid = r.jid;
        inStt('cho', '<b>Đã gửi đến máy in Phòng Kinh Doanh lầu 1</b><span class="small muted">' + (r.truoc ? 'Phía trước còn ' + r.truoc + ' hồ sơ. ' : '') + (r.tram ? 'Đang chờ in…' : 'Máy trạm đang tắt: hồ sơ sẽ tự in khi máy bật (trong 6 giờ).') + '</span>');
        doi(job, 0);
      } catch (e) { if (PJ === job) inStt('', '<b>Chưa gửi được</b><span class="small muted">' + esc(String(e)) + '</span>'); fail(e); }
    })();
  }
  // xem lệnh in đã in chưa: 3 giây/lần, tối đa ~2 phút
  function doi(job, n) {
    inT = setTimeout(async () => {
      if (PJ !== job) return;
      let r = null; try { r = await api('inStatus', job.jid); } catch (e) {}
      if (PJ !== job) return;
      const mo = !sheet('xdInDlg').hidden;
      if (r && r.tt === 'Đã in') {
        inStt('ok', '<b>Đã in xong</b><span class="small muted">Lấy hồ sơ ở máy in Phòng Kinh Doanh lầu 1.</span>');
        if (!mo) toast('Đã in xong hồ sơ ' + job.x.id + ' ở Phòng Kinh Doanh lầu 1.');
        return;
      }
      if (r && r.tt === 'Hết hạn') { inStt('', '<b>Lệnh in đã hết hạn</b><span class="small muted">Vui lòng gửi in lại.</span>'); return; }
      if (n >= 40) { inStt('', '<b>Hồ sơ đang trong hàng chờ</b><span class="small muted">Sẽ tự in khi máy trạm bật (giữ tối đa 6 giờ). Cần gấp: báo IT hoặc In trên máy này.</span>'); return; }
      doi(job, n + 1);
    }, 3000);
  }

  /* ---------- Bước 2: lên xe / trả xe ---------- */
  let U = null, TTV = {};
  function openUse(id) {
    const p = D.mine.find(x => x.id === id); if (!p) return;
    U = p; TTV = {}; TT.forEach(k => { TTV[k[0]] = 'Đạt'; }); // mặc định Đạt, không đạt thì đổi
    const car = D.cars.find(c => c.bien === p.bien) || { loai: '', bien: p.bien, odo: '' };
    $('#xdUseTitle').textContent = car.loai + ' · ' + car.bien;
    $('#xdUseInfo').innerHTML = `<span>${esc(p.muc)}${p.kh ? ' · ' + esc(p.kh) : ''}<br>${chipDuyet(p)}</span><span class="mono">${esc(p.diDkHm)}–${esc(p.veDkHm)}</span>`;
    $('#uOdoDi').value = p.odoDi || (car.odo === '' ? '' : car.odo);
    $('#uOdoHint').textContent = (car.odo !== '' ? 'ODO đi tự điền theo lần trả gần nhất (' + num(car.odo) + ') · sửa nếu khác. ' : '') + 'Có thể lưu ODO đi trước, ODO về điền sau.';
    $('#uOdoVe').value = ''; $('#uGioDi').value = p.gioDi || (p.diDkHm && p.diDkHm < hmNow() ? p.diDkHm : hmNow()); $('#uGioVe').value = hmNow(); $('#uPin').value = ''; $('#uPinWarn').hidden = true;
    renderTt();
    $('#uTtGhi').value = ''; $('#uXacNhan').checked = false;
    $('#uKyWrap').hidden = p.muc !== 'Khách lái thử'; $('#uKy').checked = false; $('#uDon').checked = false; $('#uSac').checked = false; $('#uGhi').value = '';
    const reg = p.trangThai === 'Đã đăng ký';
    $('#uStartBtn').hidden = !reg; $('#uCancelBtn').hidden = !reg; $('#uEditBtn').hidden = !reg;
    calcKm(); openS('xdUseDlg');
  }
  function renderTt() {
    $('#uTt').innerHTML = TT.map(k => `<div class="xd-cond" data-k="${k[0]}"><span>${k[1]}</span><span style="display:flex;gap:4px">
      <button type="button" class="pill${TTV[k[0]] === 'Đạt' ? ' on' : ''}" data-v="Đạt">Đạt</button><button type="button" class="pill${TTV[k[0]] === 'Không đạt' ? ' on bad' : ''}" data-v="Không đạt">Không đạt</button></span></div>`).join('');
    const bad = TT.some(k => TTV[k[0]] === 'Không đạt');
    $('#uTtGhiReq').hidden = !bad;
    $('#uTtLeft').textContent = TT.filter(k => !TTV[k[0]]).length ? 'Còn ' + TT.filter(k => !TTV[k[0]]).length + ' mục chưa chọn' : 'Đã chọn đủ 7 mục';
  }
  function calcKm() {
    const a = Number(String($('#uOdoDi').value).replace(/[^\d]/g, '')), b = Number(String($('#uOdoVe').value).replace(/[^\d]/g, ''));
    const g1 = $('#uGioDi').value, g2 = $('#uGioVe').value;
    let t = '';
    if (a && b && b >= a) t = (b - a) + ' km';
    if (g1 && g2) { let m = (+g2.slice(0, 2) * 60 + +g2.slice(3)) - (+g1.slice(0, 2) * 60 + +g1.slice(3)); if (m < 0) m += 1440; t += (t ? ' · ' : '') + Math.floor(m / 60) + ' giờ ' + (m % 60) + ' phút'; }
    $('#uKm').textContent = t || '—';
    const nguoc = g1 && g2 && g2 < g1;
    $('#uKm').style.color = nguoc ? 'var(--bad)' : '';
    if (nguoc) $('#uKm').textContent = 'Giờ về đang trước giờ đi · vui lòng kiểm tra';
  }

  /* ---------- Sự kiện ---------- */
  function bind() {
    $('#who').onchange = onWho;
    $('#goBtn').onclick = () => { const ten = $('#who').value; if (!ten) return toast('Vui lòng chọn họ tên.', 1); A = { ten }; save(); enter(); };
    $('#pinPad').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.k === 'del') code = code.slice(0, -1); else if (code.length < 4) code += b.dataset.k;
      dots(); if (code.length === 4) tryCode();
    };
    document.addEventListener('keydown', e => { if ($('#pinBox').hidden || $('#vLogin').hidden) return; if (/^\d$/.test(e.key) && code.length < 4) { code += e.key; dots(); if (code.length === 4) tryCode(); } else if (e.key === 'Backspace') { code = code.slice(0, -1); dots(); } });
    $('#btnOut').onclick = logout;
    $('#tabs').onclick = e => { const b = e.target.closest('button[data-t]'); if (b) { tab = b.dataset.t; render(); if (tab === 'duyet') load(); } };
    $('#vXe').addEventListener('click', e => {
      const nh = e.target.closest('[data-nhac]'); if (nh) { const p = D.mine.find(x => x.id === nh.dataset.nhac); if (p) openNhac(p); return; }
      const ph = e.target.closest('[data-phieu]'); if (ph) return openUse(ph.dataset.phieu);
      const c = e.target.closest('.xd-car'); if (c) return openCar(c.dataset.bien);
      const il = e.target.closest('[data-inlai]'); if (il) { const p = D.ganDay.find(x => x.id === il.dataset.inlai); if (p) doPrint(p); }
    });
    $('#vDuyet').addEventListener('click', e => {
      const b = e.target.closest('[data-ok],[data-no]'); if (!b) return;
      decide(b, b.closest('[data-ap]').dataset.ap, b.hasAttribute('data-ok'));
    });
    document.addEventListener('click', e => {
      if (e.target.classList && e.target.classList.contains('sheet-bg')) closeS(e.target.id);
      const cl = e.target.closest('[data-close]'); if (cl) closeS(cl.dataset.close);
    });
    $('#xdMode').onclick = e => { const b = e.target.closest('button[data-m]'); if (b) { F.muc = b.dataset.m; syncForm(); } };
    $('#fDongY').onchange = syncForm; $('#fXa').onchange = syncForm;
    $('#fPhoto').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (!$('#fDongY').checked) return toast('Chỉ chụp bằng lái khi khách đồng ý cho lưu ảnh.', 1);
      $('#fPhotoIn').dataset.side = b.dataset.side; $('#fPhotoIn').click();
    });
    $('#fPhotoIn').onchange = async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      try {
        const side = $('#fPhotoIn').dataset.side, b64 = await shrinkImage(f, 1600, 0.82);
        if (side === 'truoc') F.anhTruoc = b64; else F.anhSau = b64;
        const b = $('#fPhoto [data-side=' + side + ']'); b.classList.add('has'); b.textContent = (side === 'truoc' ? 'Mặt trước' : 'Mặt sau') + ' · đã chụp';
      } catch (err) { toast(err, 1); }
    };
    $('#fPrintBtn').onclick = () => saveForm($('#fPrintBtn'), 'may');
    $('#fPkdBtn').onclick = () => saveForm($('#fPkdBtn'), 'pkd');
    ['#uOdoDi', '#uOdoVe', '#uGioDi', '#uGioVe'].forEach(s => $(s).addEventListener('input', calcKm));
    // Pin dưới 80%: nhắc bắt buộc sạc lên trên 90% (quy tắc VinFast)
    const PIN_SAC = 80;
    $('#uPin').addEventListener('input', () => { const v = $('#uPin').value.trim(); $('#uPinWarn').hidden = !(v !== '' && Number(v) < PIN_SAC); });
    $('#uTt').addEventListener('click', e => { const b = e.target.closest('.pill'); if (!b) return; TTV[b.closest('.xd-cond').dataset.k] = b.dataset.v; renderTt(); });
    $('#uStartBtn').onclick = () => {
      const odo = $('#uOdoDi').value.trim(); if (!odo) return toast('Vui lòng nhập ODO đi.', 1);
      busy($('#uStartBtn'), '', async () => {
        try { await api('xdStart', U.id, { odoDi: odo, gioDi: $('#uGioDi').value }); closeS('xdUseDlg'); toast('Đã lưu ODO đi. Chúc chuyến đi an toàn.'); load(); } catch (e) { fail(e); }
      });
    };
    $('#uReturnBtn').onclick = () => {
      const d = Object.assign({ odoDi: $('#uOdoDi').value.trim(), odoVe: $('#uOdoVe').value.trim(), gioDi: $('#uGioDi').value, gioVe: $('#uGioVe').value, pin: $('#uPin').value.trim(),
        ttGhi: $('#uTtGhi').value.trim(), xacNhan: $('#uXacNhan').checked, daKy: $('#uKy').checked, daDon: $('#uDon').checked, daSac: $('#uSac').checked, ghiChu: $('#uGhi').value }, TTV);
      if (!d.odoDi || !d.odoVe) return toast('Vui lòng nhập ODO đi và ODO về (không nhớ thì ghi “Không nhớ”).', 1);
      if (!d.gioDi || !d.gioVe) return toast('Vui lòng nhập giờ đi và giờ về.', 1);
      if (d.pin === '') return toast('Vui lòng nhập % pin lúc về.', 1);
      const thieu = TT.filter(k => !TTV[k[0]]); if (thieu.length) return toast('Vui lòng chọn Đạt / Không đạt cho: ' + thieu.map(k => k[1]).join(', '), 1);
      if (TT.some(k => TTV[k[0]] === 'Không đạt') && !d.ttGhi) return toast('Có mục Không đạt: vui lòng ghi chú tình trạng xe.', 1);
      if (!d.xacNhan) return toast('Vui lòng tick xác nhận tình trạng xe (ký điện tử).', 1);
      if (U.muc === 'Khách lái thử' && !d.daKy) return toast('Vui lòng xác nhận khách đã ký hồ sơ.', 1);
      busy($('#uReturnBtn'), 'Đang lưu', async () => {
        try { const r = await api('xdReturn', U.id, d); closeS('xdUseDlg'); toast(Number(d.pin) < PIN_SAC ? 'Đã trả xe. Pin ' + d.pin + '%: vui lòng sạc lên trên 90%. Bận chưa sạc được thì báo Giang liền.' : 'Đã trả xe' + (r.km !== '' ? ' · ' + r.km + ' km' : '') + '. Cảm ơn anh/chị.'); load(); } catch (e) { fail(e); }
      });
    };
    $('#uReprint').onclick = () => doPrint(U, 'may');
    $('#uPkd').onclick = () => doPrint(U, 'pkd');
    $('#inCongTy').onclick = inGui;
    $('#inMay').onclick = inLocal; $('#inMay2').onclick = inLocal;
    $('#xdNhacShare').onclick = () => { navigator.share({ text: nhacText(NH) }).then(() => closeS('xdNhacDlg')).catch(() => {}); };
    $('#xdNhacCopy').onclick = () => { copyText(nhacText(NH)); closeS('xdNhacDlg'); };
    $('#uLogBtn').onclick = () => { closeS('xdUseDlg'); openCar(U.bien); };
    $('#uEditBtn').onclick = () => { closeS('xdUseDlg'); openForm(D.cars.find(c => c.bien === U.bien) || { loai: '', bien: U.bien }, U); };
    $('#uCancelBtn').onclick = () => {
      if (!confirm('Hủy phiếu ' + U.id + '?')) return;
      busy($('#uCancelBtn'), '', async () => { try { await api('xdCancel', U.id); closeS('xdUseDlg'); toast('Đã hủy phiếu'); load(); } catch (e) { fail(e); } });
    };
    let last = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && D && Date.now() - last > 60000 && !document.querySelector('.sheet-bg:not([hidden])')) { last = Date.now(); load(); }
    });
  }

  window.XD = { start: () => { bind(); boot(); } };
})();
