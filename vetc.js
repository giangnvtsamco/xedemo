/* Tab Thanh toán VETC · trang Quản lý Xe Demo (v1.2)
 * 1. Nạp Bảng kê hóa đơn điện tử (Excel tải từ VETC)   2. Nạp các file hóa đơn PDF
 * → kiểm tra đủ hóa đơn
 * → lập Giấy đề nghị thanh toán tiền mặt + Bảng kê phí VETC, ghép cùng hóa đơn thành 1 file PDF
 * → tải về máy, lưu vào Drive "Xe Lái Thử/VETC", ghi sổ VETC / VETC_THANG.
 * Dùng chung: PIN, call, $, $$, esc, toast, busy, norm (quanly.html + samco-core). */
(() => {
  const LIB = {
    xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfjsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    pdflib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
    fontkit: 'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js'
  };
  const FONT_BASE = () => window.VETC_FONT_BASE || 'fonts/';
  const S = { init: null, rows: [], info: null, files: [], excelName: '', pdfUrl: '' };
  const fm = n => Math.round(Number(n) || 0).toLocaleString('vi-VN');
  const nb = v => typeof v === 'number' ? v : Number(String(v == null ? '' : v).replace(/[^\d-]/g, '')) || 0;
  const pad = n => String(n).padStart(2, '0');
  const nfc = s => String(s == null ? '' : s).normalize('NFC');

  /* ---------- nạp thư viện khi mở tab (không làm chậm các tab khác) ---------- */
  const loaded = {};
  function lib(u) {
    return loaded[u] || (loaded[u] = new Promise((ok, no) => {
      const s = document.createElement('script'); s.src = u; s.onload = ok; s.onerror = () => { delete loaded[u]; no('Không tải được thư viện. Vui lòng kiểm tra mạng rồi thử lại.'); };
      document.head.appendChild(s);
    }));
  }

  /* ---------- số tiền bằng chữ (mẫu kế toán dùng "nghìn") ---------- */
  const CS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  function doc3(n, full) {
    const t = Math.floor(n / 100), c = Math.floor(n % 100 / 10), d = n % 10, o = [];
    if (full || t) o.push(CS[t] + ' trăm');
    if (c > 1) { o.push(CS[c] + ' mươi'); if (d === 1) o.push('mốt'); else if (d === 5) o.push('lăm'); else if (d) o.push(CS[d]); }
    else if (c === 1) { o.push('mười'); if (d === 5) o.push('lăm'); else if (d) o.push(CS[d]); }
    else if (d) { if (full || t) o.push('lẻ'); o.push(CS[d]); }
    return o.join(' ');
  }
  function bangChu(n) {
    n = Math.round(n); if (!n) return 'Không đồng.';
    const g = []; let x = n; while (x > 0) { g.push(x % 1000); x = Math.floor(x / 1000); }
    const U = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'], o = [];
    for (let i = g.length - 1; i >= 0; i--) { if (!g[i]) continue; o.push(doc3(g[i], i < g.length - 1) + (U[i] ? ' ' + U[i] : '')); }
    const s = o.join(' ').replace(/\s+/g, ' ').trim();
    return s[0].toUpperCase() + s.slice(1) + ' đồng' + '.';
  }
  window.vetcBangChu = bangChu;

  /* ---------- biển số VETC "51D62436T" → "51D-624.36" ---------- */
  function bien(v) {
    const s = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    let m = s.match(/^(\d{2}[A-Z]{1,2}\d?)(\d{3})(\d{2})[A-Z]?$/); if (m) return m[1] + '-' + m[2] + '.' + m[3];
    m = s.match(/^(\d{2}[A-Z]{1,2})(\d{4})[A-Z]?$/); if (m) return m[1] + '-' + m[2];
    return String(v || '');
  }
  window.vetcBien = bien;
  const tg = s => { const m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/); return m ? new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +(m[6] || 0)).getTime() : 0; };

  /* ---------- mở tab ---------- */
  async function open() {
    if (!S.init) {
      $('#vtBody').innerHTML = '<div class="loading"><span class="spin"></span>Đang tải…</div>';
      try { S.init = await call('vetcInit', PIN); }
      catch (e) { if (!(window.authFail && authFail(e))) $('#vtBody').innerHTML = `<div class="empty">${esc(e)}</div>`; return; }
      $('#vtBody').innerHTML = '';
      $('#vtMain').hidden = false;
      const c = S.init.cfg;
      $('#vtNguoi').value = c.nguoi; $('#vtBoPhan').value = c.boPhan;
      const d = new Date(); $('#vtNgay').value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
    drawList(); draw();
    lib(LIB.xlsx).catch(() => {});
  }
  window.vetcOpen = open;

  /* ---------- 1. Bảng kê Excel ---------- */
  $('#vtXls').onchange = async e => {
    delete $('#vtNd').dataset.sua;
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      await lib(LIB.xlsx);
      const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const a = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
      const hi = a.findIndex(r => r.some(c => norm(c) === 'stt') && r.some(c => /so hoa don/.test(norm(c))));
      if (hi < 0) throw 'File này không phải Bảng kê hóa đơn điện tử của VETC (không thấy dòng tiêu đề STT · Số hóa đơn).';
      const h = a[hi].map(norm), col = re => h.findIndex(c => re.test(c));
      const C = { so: col(/^so hoa don/), ky: col(/loai chung tu/), kh2: col(/^ky hieu/), tg: col(/ngay phat sinh hoa don/), gd: col(/ma giao dich/), bien: col(/bien so/),
        nd: col(/noi dung/), chua: col(/chua thue/), thue: col(/tien thue/), sau: col(/sau thue/), tram: col(/^tram/), loai: col(/loai hoa don/), tt: col(/trang thai/) };
      const top = a.slice(0, hi).map(r => r.filter(String).join(' ')).filter(String);
      const pick = re => { const l = top.find(x => re.test(norm(x))); return l ? nfc(l.replace(/^[^:]*:\s*/, '')).trim() : ''; };
      const kyMa = v => /^[0-9A-Z]{5,}$/.test(String(v).trim()) ? String(v).trim() : '';
      const rows = a.slice(hi + 1).filter(r => String(r[C.so] || '').trim() && String(r[C.gd] || '').trim()).map(r => ({
        so: String(r[C.so]).trim(), kyHieu: kyMa(r[C.ky]) || kyMa(r[C.kh2]), tgs: String(r[C.tg]).trim(), t: tg(r[C.tg]), gd: String(r[C.gd]).trim(),
        bienGoc: String(r[C.bien]).trim(), bien: bien(r[C.bien]), nd: nfc(r[C.nd]).trim(), chuaThue: nb(r[C.chua]), thue: nb(r[C.thue]), sauThue: nb(r[C.sau]),
        tram: nfc(r[C.tram]).trim(), loai: nfc(r[C.loai]).trim(), tt: nfc(r[C.tt]).trim()
      }));
      if (!rows.length) throw 'Bảng kê chưa có giao dịch nào.';
      const kh = top.find(x => /tu ngay .* den/.test(norm(x))) || '';
      const m = kh.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}).*?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      const ts = rows.map(r => r.t).filter(Boolean), d0 = new Date(Math.min(...ts)), d1 = new Date(Math.max(...ts));
      const tu = m ? [+m[1], +m[2], +m[3]] : [1, d0.getMonth() + 1, d0.getFullYear()];
      const den = m ? [+m[4], +m[5], +m[6]] : [new Date(d1.getFullYear(), d1.getMonth() + 1, 0).getDate(), d1.getMonth() + 1, d1.getFullYear()];
      S.info = { tk: pick(/so tai khoan giao thong|ma tai khoan/), ten: pick(/^ten nguoi mua|^ten khach hang/), mst: pick(/^ma so thue/),
        tu, den, thang: pad(tu[1]) + '/' + tu[2] };
      S.rows = rows; S.excelName = f.name; S.pdfUrl = '';
      match(); draw();
      toast('Đã đọc ' + rows.length + ' giao dịch tháng ' + S.info.thang);
    } catch (err) { toast(String(err), 1); }
  };

  /* ---------- 2. Hóa đơn PDF: đọc mã GD / số hóa đơn trên từng trang ---------- */
  $('#vtPdf').onchange = async e => {
    const fs = Array.from(e.target.files); e.target.value = ''; if (!fs.length) return;
    $('#vtPdfMsg').textContent = 'Đang đọc ' + fs.length + ' file…';
    try {
      await lib(LIB.pdfjs); pdfjsLib.GlobalWorkerOptions.workerSrc = LIB.pdfjsWorker;
      let n = 0, bad = 0;
      for (const f of fs) {
        if (S.files.some(x => x.name === f.name && x.size === f.size)) continue;
        try {
          const bytes = new Uint8Array(await f.arrayBuffer());
          const doc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise, pages = [];
          for (let i = 1; i <= doc.numPages; i++) {
            const t = (await (await doc.getPage(i)).getTextContent()).items.map(x => x.str).join(' ').replace(/\s+/g, ' ');
            const gd = (t.match(/mã\s*GD\s*:?\s*(\d{6,})/i) || [])[1] || '', so = (t.match(/Số\s*:\s*(\d{5,})/) || [])[1] || '';
            pages.push({ gd, so });
          }
          S.files.push({ name: f.name, size: f.size, bytes, pages }); n++;
        } catch (x) { bad++; }
        $('#vtPdfMsg').textContent = 'Đã đọc ' + S.files.length + ' file' + (bad ? ' · ' + bad + ' file lỗi' : '');
      }
      S.pdfUrl = ''; match(); draw();
    } catch (err) { toast(String(err), 1); $('#vtPdfMsg').textContent = ''; }
  };
  $('#vtPdfClear').onclick = () => { S.files = []; S.pdfUrl = ''; $('#vtPdfMsg').textContent = ''; match(); draw(); };

  /* ---------- ghép hóa đơn PDF với từng dòng bảng kê ---------- */
  function match() {
    const pages = [];
    S.files.forEach((f, fi) => f.pages.forEach((p, pi) => pages.push({ fi, pi, gd: p.gd, so: p.so, used: false })));
    S.rows.forEach(r => {
      const p = pages.find(x => !x.used && x.gd && x.gd === r.gd) || pages.find(x => !x.used && x.so && x.so === r.so);
      r.pdf = p ? (p.used = true, { fi: p.fi, pi: p.pi }) : null;
    });
    S.thua = pages.filter(p => !p.used).map(p => S.files[p.fi].name + (S.files[p.fi].pages.length > 1 ? ' (trang ' + (p.pi + 1) + ')' : ''));
  }

  /* ---------- vẽ ---------- */
  const ok = r => !/huy/.test(norm(r.tt)) && !/huy/.test(norm(r.loai));
  function draw() {
    const R = S.rows, has = R.length;
    $('#vtStep2').classList.toggle('dim', !has);
    $('#vtXlsLbl').textContent = has ? S.excelName : 'Chọn file Excel';
    $('#vtXlsInfo').textContent = has ? 'Tháng ' + S.info.thang + ' · từ ' + S.info.tu.join('/') + ' đến ' + S.info.den.join('/') + ' · ' + R.length + ' giao dịch' : 'File "Report_invoice_history…" tải ở mục Bảng kê hóa đơn điện tử trên trang VETC.';
    if (!has) { $('#vtCheck').hidden = true; return; }
    $('#vtCheck').hidden = false;
    const dung = R.filter(ok), tong = dung.reduce((t, r) => t + r.sauThue, 0);
    const coPdf = R.filter(r => r.pdf).length;
    $('#vtKpi').innerHTML = `<div><span class="l">Lượt qua trạm</span><b>${R.length}</b></div><div><span class="l">Tổng tiền gồm VAT</span><b style="font-size:22px">${fm(tong)}</b></div>`
      + `<div class="${coPdf < R.length ? 'bad' : ''}"><span class="l">Có hóa đơn PDF</span><b>${coPdf}/${R.length}</b></div>`
      + `<div><span class="l">Số xe</span><b>${new Set(R.map(r => r.bien)).size}</b></div>`;
    const carOrder = (S.init.cfg.thuTu || []).concat((S.init.cars || []).map(c => c.bien)).filter((b, k, a) => a.indexOf(b) === k);
    $('#vtBody2').innerHTML = R.map((r, i) => `<tr class="${!ok(r) ? 'off' : ''}">
      <td class="mono small">${i + 1}</td>
      <td class="mono small nw">${esc(r.tgs.replace(' ', ' · '))}</td>
      <td class="nw"><b class="mono">${esc(r.bien)}</b>${carOrder.indexOf(r.bien) < 0 ? '<span class="sub2" style="color:var(--warn)">Không có trong danh sách xe</span>' : ''}</td>
      <td class="small">${esc(r.tram)}</td>
      <td class="num mono">${fm(r.sauThue)}</td>
      <td class="mono small">${esc(r.so)}</td>
      <td>${r.pdf ? `<span class="chip ok">Có</span><span class="sub2">${esc(S.files[r.pdf.fi].name)}</span>` : '<span class="chip bad">Thiếu</span>'}</td>
    </tr>`).join('');
    const W = [];
    if (coPdf < R.length) W.push(`Thiếu ${R.length - coPdf} hóa đơn PDF: ` + R.filter(r => !r.pdf).map(r => r.so).join(', ') + '.');
    if (S.thua && S.thua.length) W.push('File PDF không khớp giao dịch nào (sẽ không ghép): ' + S.thua.join(', ') + '.');
    R.filter(r => !ok(r)).forEach(r => W.push(`Hóa đơn ${r.so} ${r.loai || ''} ${r.tt || ''}: không tính vào tổng.`));
    $('#vtWarn').innerHTML = W.map(w => `<div class="small" style="color:var(--warn)">⚠ ${esc(w)}</div>`).join('');
    // chỉ ghi xe có phát sinh phí trong tháng, theo thứ tự danh sách VETC_THU_TU_XE (_CauHinh)
    const ds = [...new Set(dung.slice().sort((a, b) => a.t - b.t).map(r => r.bien))];
    const xs = carOrder.filter(b => ds.indexOf(b) >= 0).concat(ds.filter(b => carOrder.indexOf(b) < 0));
    if (!$('#vtNd').dataset.sua) $('#vtNd').value = 'Thanh toán thu phí tự động VETC xe ' + xs.join(', ') + ' tháng ' + S.info.tu[1] + '/' + S.info.tu[2] + '.';
    $('#vtTong').textContent = fm(tong) + ' VNĐ · ' + bangChu(tong);
    $('#vtMake').disabled = false;
    if (!S.pdfUrl) { $('#vtPv').innerHTML = '<div class="empty">Bấm "Tạo bộ hồ sơ PDF" để xem trước.</div>'; $('#vtDl').hidden = true; }
  }
  $('#vtNd').addEventListener('input', () => { $('#vtNd').dataset.sua = 1; S.pdfUrl = ''; });

  function drawList() {
    const L = (S.init && S.init.list) || [];
    $('#vtList').innerHTML = L.length ? L.map(x => `<tr>
      <td><b class="mono">T${esc(x.thang)}</b><span class="sub2">${esc(x.tu)} – ${esc(x.den)}</span></td>
      <td class="num">${x.luot}</td><td class="num mono">${fm(x.tong)}</td>
      <td class="small">${esc(x.ngay)}</td>
      <td>${x.file ? `<a class="small" href="https://drive.google.com/file/d/${encodeURIComponent(x.file)}/view" target="_blank" rel="noopener">Mở PDF ↗</a>` : '—'}</td>
      <td><select class="inp" data-thang="${esc(x.thang)}" style="min-height:32px;font-size:12px">${S.init.trangThai.map(t => `<option${t === x.tt ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></td>
    </tr>`).join('') : '<tr><td colspan="6"><div class="empty">Chưa lập tháng nào.</div></td></tr>';
  }
  $('#vtList').addEventListener('change', async e => {
    const s = e.target.closest('select[data-thang]'); if (!s) return;
    try { S.init.list = (await call('vetcStatus', PIN, s.dataset.thang, s.value)).list; drawList(); toast('Đã cập nhật T' + s.dataset.thang); } catch (err) { toast(err, 1); }
  });

  /* ---------- 3. Tạo bộ hồ sơ PDF (pdf-lib, chữ Tinos = Times New Roman) ---------- */
  async function build() {
    await Promise.all([lib(LIB.pdflib), lib(LIB.fontkit)]);
    const { PDFDocument, rgb } = PDFLib;
    const out = await PDFDocument.create(); out.registerFontkit(fontkit);
    const ttf = async n => { const r = await fetch(FONT_BASE() + 'Tinos-' + n + '.ttf'); if (!r.ok) throw 'Không tải được phông chữ.'; return out.embedFont(await r.arrayBuffer(), { subset: true }); };
    const F = { r: await ttf('Regular'), b: await ttf('Bold'), i: await ttf('Italic'), bi: await ttf('BoldItalic') };
    const K = rgb(0, 0, 0);
    const W = (s, f, z) => f.widthOfTextAtSize(s, z);
    const T = (pg, s, x, y, f, z, al, w) => { s = nfc(s); const tw = W(s, f, z); pg.drawText(s, { x: al === 'c' ? x + (w - tw) / 2 : al === 'r' ? x + w - tw : x, y, size: z, font: f, color: K }); };
    const wrap = (s, f, z, w) => {
      const out2 = []; let cur = '';
      nfc(s).split(/\s+/).filter(Boolean).forEach(word => {
        const t = cur ? cur + ' ' + word : word;
        if (W(t, f, z) <= w) cur = t; else { if (cur) out2.push(cur); cur = word; while (W(cur, f, z) > w && cur.length > 1) { let k = cur.length; while (k > 1 && W(cur.slice(0, k), f, z) > w) k--; out2.push(cur.slice(0, k)); cur = cur.slice(k); } }
      });
      if (cur) out2.push(cur); return out2.length ? out2 : [''];
    };
    const R = S.rows, dung = R.filter(ok), tong = dung.reduce((t, r) => t + r.sauThue, 0), c = S.init.cfg;
    const nd = $('#vtNgay').value.split('-');

    /* Đo theo đúng bản in từ sheet "THANH TOÁN PHÍ VETC" / "BẢNG KÊ PHÍ VETC" (Times New Roman, A4).
       top = mép trên dòng chữ tính từ đỉnh trang; đường chân chữ = top + 0.891 × cỡ chữ. */
    const AS = 0.891;
    const put = (pg, H, s, x, top, f, z, al) => { s = nfc(s); const w = W(s, f, z); pg.drawText(s, { x: al === 'c' ? x - w / 2 : al === 'r' ? x - w : x, y: H - (top + AS * z), size: z, font: f, color: K }); };

    /* Trang 1 · Giấy đề nghị thanh toán tiền mặt (A4 dọc, in 100%) */
    const H1 = 842.88, X0 = 54, XR = 541.1, CX = 297.75;
    let p = out.addPage([595.92, H1]);
    put(p, H1, 'SAMCO', X0, 56.1, F.b, 12);
    put(p, H1, 'PHÒNG TÀI CHÍNH KẾ TOÁN', X0, 74.5, F.r, 14);
    put(p, H1, 'GIẤY ĐỀ NGHỊ THANH TOÁN TIỀN MẶT', CX, 126.5, F.b, 18, 'c');
    put(p, H1, `Ngày ${pad(+nd[2])} tháng ${pad(+nd[1])} năm ${nd[0]}`, CX, 159.3, F.i, 14, 'c');
    put(p, H1, 'Kính gửi: ' + c.kinhGui, X0, 211.0, F.bi, 14);
    put(p, H1, 'Họ và tên người đề nghị thanh toán: ' + $('#vtNguoi').value.trim(), X0, 247.0, F.r, 14);
    put(p, H1, 'Đơn vị: ' + c.donVi, X0, 267.3, F.r, 14);
    put(p, H1, 'Bộ phận: ' + $('#vtBoPhan').value.trim(), X0, 287.5, F.r, 14);
    put(p, H1, 'Nội dung thanh toán: (Chi tiết theo từng nội dung):', X0, 307.8, F.r, 14);
    const ndl = wrap($('#vtNd').value.trim(), F.b, 14, XR - X0);
    ndl.forEach((l, k) => put(p, H1, l, X0, 328.0 + k * 16.5, F.b, 14));
    const d1 = Math.max(0, ndl.length - 2) * 16.5; // nội dung dài hơn 2 dòng → đẩy phần dưới xuống
    put(p, H1, 'Tổng số tiền:', X0, 380.5 + d1, F.b, 14);
    put(p, H1, fm(tong), 231.0, 380.5 + d1, F.b, 14, 'r'); put(p, H1, 'VNĐ', 236.2, 380.5 + d1, F.b, 14);
    put(p, H1, 'Bằng chữ: ', X0, 400.8 + d1, F.r, 14);
    wrap(bangChu(tong), F.r, 14, XR - 114.7).forEach((l, k) => put(p, H1, l, 114.7, 400.8 + d1 + k * 16.5, F.r, 14));
    const d2 = d1 + (wrap(bangChu(tong), F.r, 14, XR - 114.7).length - 1) * 16.5;
    put(p, H1, 'Kèm theo: Hóa đơn, Bảng kê.', X0, 421.0 + d2, F.r, 14);
    [['Giám đốc', 74.0, 68.9], ['Phó Giám đốc', 152.6, 160.0], ['Kế toán trưởng', 240.2, 251.1], ['Phụ trách bộ phận', 337.4, 357.3], ['Người đề nghị', 455.7, 463.0]].forEach(([t, x, x2]) => {
      put(p, H1, t, x, 472.9 + d2, F.b, 13); put(p, H1, '(Ký, họ tên)', x2, 491.8 + d2, F.b, 12); });
    put(p, H1, 'BS-TC07a', X0, 746.7, F.b, 13);

    /* Trang 2… · Bảng kê phí VETC (A4 ngang, vừa khổ ngang: cỡ chữ sheet × 0,5656) */
    const H2 = 595.92, SC = 0.5656, zT = 18 * SC, zI = 11 * SC, zS = 10 * SC, zD = 12 * SC, RH = 10.17;
    const E = [49.9, 63.5, 101.6, 161.4, 198.8, 234.8, 623.6, 689.1, 790.7]; // mép cột A…H
    const AL = ['c', 'r', 'c', 'r', 'l', 'l', 'r', 'l'];
    const box = (pg, x1, t, x2, b) => { [[x1, t, x2, t], [x1, b, x2, b]].forEach(l => pg.drawLine({ start: { x: l[0], y: H2 - l[1] }, end: { x: l[2], y: H2 - l[3] }, thickness: 0.5, color: K })); };
    const vl = (pg, x, t, b) => pg.drawLine({ start: { x, y: H2 - t }, end: { x, y: H2 - b }, thickness: 0.5, color: K });
    const fit = (s, f, z, w) => { let zz = z; while (zz > 3 && W(nfc(s), f, zz) > w) zz -= 0.1; return zz; };
    const cellTxt = (pg, s, i, top, f, z) => { const w = E[i + 1] - E[i] - 2.4, zz = fit(s, f, z, w);
      put(pg, H2, s, AL[i] === 'c' ? (E[i] + E[i + 1]) / 2 : AL[i] === 'r' ? E[i + 1] - 2.2 : E[i] + 1.1, top, f, zz, AL[i]); };
    const rowLines = (pg, t) => { box(pg, E[0], t, E[8], t + RH); E.forEach(x => vl(pg, x, t, t + RH)); };
    const tu = S.info.tu, den = S.info.den;
    let pg = out.addPage([842.88, H2]);
    put(pg, H2, 'BẢNG KÊ PHÍ VETC', (E[0] + E[8]) / 2, 55.4, F.b, zT, 'c');
    put(pg, H2, 'Mã tài khoản: ' + S.info.tk, 51.7, 69.5, F.r, zI);
    wrap('Tên khách hàng: ' + S.info.ten, F.r, zI, E[8] - 51.7).forEach((l, k) => put(pg, H2, l, 51.7, 79.2 + k * 8, F.r, zI));
    put(pg, H2, 'CMND/TCC/HC: ' + S.info.mst, 51.7, 89.0, F.r, zI);
    [['Từ ngày:', tu.join('/'), 98.8], ['Đến ngày:', den.join('/'), 107.7], ['Trạng thái:', 'Đã thành công', 116.6]].forEach(([k, v, t]) => { put(pg, H2, k, 51.7, t, F.r, zS); put(pg, H2, v, 103.0, t, F.r, zS); });
    let top = 131.8;
    const head = () => { rowLines(pg, top); ['STT', 'SỐ HÓA ĐƠN', 'THỜI GIAN', 'MÃ GD', 'BIỂN SỐ XE', 'NỘI DUNG', 'SỐ TIỀN GỒM VAT', 'TRẠM'].forEach((h, i) => put(pg, H2, h, (E[i] + E[i + 1]) / 2, top + 2.6, F.r, zS, 'c')); top += RH; };
    head();
    R.forEach((r, i) => {
      if (top + RH > H2 - 40) { pg = out.addPage([842.88, H2]); top = 40; head(); }
      rowLines(pg, top);
      put(pg, H2, String(i + 1), (E[0] + E[1]) / 2, top + 1.9, F.r, zS, 'c');
      [r.so, r.tgs, r.gd, r.bienGoc, r.nd, ok(r) ? fm(r.sauThue) : '(' + fm(r.sauThue) + ')', r.tram].forEach((v, k) => cellTxt(pg, v, k + 1, top + 1.2, F.r, zD));
      top += RH;
    });
    if (top + RH > H2 - 40) { pg = out.addPage([842.88, H2]); top = 40; }
    box(pg, E[0], top, E[8], top + RH); vl(pg, E[0], top, top + RH); vl(pg, E[8], top, top + RH);
    put(pg, H2, 'TỔNG CỘNG GỒM VAT', (E[0] + E[6]) / 2, top + 1.3, F.r, zD, 'c');
    put(pg, H2, fm(tong), (E[6] + E[8]) / 2, top + 1.3, F.r, zD, 'c');
    top += RH;
    if (top + 95 > H2 - 30) { pg = out.addPage([842.88, H2]); top = 40; }
    put(pg, H2, 'Người lập báo cáo', (E[6] + E[8]) / 2, top + 10.2, F.r, zD, 'c');
    put(pg, H2, $('#vtNguoi').value.trim(), (E[6] + E[8]) / 2, top + 82.8, F.r, zS, 'c');

    /* Hóa đơn: theo thời gian từ cũ đến mới */
    const src = {};
    for (const r of R.filter(x => x.pdf).sort((a, b) => a.t - b.t)) {
      const f = S.files[r.pdf.fi];
      src[r.pdf.fi] = src[r.pdf.fi] || await PDFDocument.load(f.bytes, { ignoreEncryption: true });
      const [cp] = await out.copyPages(src[r.pdf.fi], [r.pdf.pi]); out.addPage(cp);
    }
    out.setTitle('Thanh toán VETC T' + S.info.thang); out.setAuthor($('#vtNguoi').value.trim()); out.setProducer('Xe Demo SAMCO');
    return { bytes: await out.save(), tong, dung };
  }

  $('#vtMake').onclick = () => {
    const thieu = S.rows.filter(r => !r.pdf).length;
    if (thieu && !confirm('Còn thiếu ' + thieu + ' hóa đơn PDF. Vẫn tạo bộ hồ sơ (không có các hóa đơn đó)?')) return;
    busy($('#vtMake'), 'Đang tạo PDF', async () => {
      try {
        const { bytes, tong } = await build();
        const blob = new Blob([bytes], { type: 'application/pdf' }), name = 'Thanh toán VETC T' + S.info.thang.replace('/', '.') + '.pdf';
        if (S.pdfUrl) URL.revokeObjectURL(S.pdfUrl);
        S.pdfUrl = URL.createObjectURL(blob);
        $('#vtPv').innerHTML = `<iframe src="${S.pdfUrl}#view=FitH" title="Bộ hồ sơ" style="width:100%;height:80vh;border:0;border-radius:8px;background:#fff"></iframe>`;
        $('#vtDl').href = S.pdfUrl; $('#vtDl').download = name; $('#vtDl').hidden = false;
        // lưu sổ + Drive
        let b64 = ''; const u = new Uint8Array(bytes); for (let i = 0; i < u.length; i += 0x8000) b64 += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); b64 = btoa(b64);
        const t = S.info.tu, d = S.info.den;
        const r = await call('vetcSave', PIN, { thang: S.info.thang, tu: t.map(pad).join('/'), den: d.map(pad).join('/'), ngay: $('#vtNgay').value.split('-').reverse().join('/'),
          rows: S.rows.map(x => ({ so: x.so, kyHieu: x.kyHieu, tg: x.tgs, gd: x.gd, bien: x.bien, tram: x.tram, chuaThue: x.chuaThue, thue: x.thue, sauThue: ok(x) ? x.sauThue : 0, coPdf: !!x.pdf })), pdf: b64 });
        S.init.list = r.list; drawList();
        toast('Đã tạo bộ hồ sơ T' + S.info.thang + ' · ' + fm(tong) + ' đ · đã lưu vào Drive');
      } catch (e) { toast(String(e), 1); }
    });
  };
})();
