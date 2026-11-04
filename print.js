/* Xe Demo · mẫu in A4 · v1.0
   Đúng theo mẫu gốc: Lệnh điều xe đi công tác, Phiếu yêu cầu lái thử, Giấy cam kết lái thử (MỚI 30-5),
   Phiếu kiểm tra tình trạng xe lái thử, Sổ nhật trình xe lái thử (A4 ngang), Phiếu đề nghị dịch vụ, Báo cáo tháng.
   Dùng: XP.print([XP.trang1(p), ...]) hoặc XP.preview(el, pages). base = đường dẫn tới logo-vinfast.jpg. */
(function () {
  const CSS = `
  #xpPrint{display:none}
  @page{size:A4;margin:0}
  @page land{size:A4 landscape;margin:0}
  @media print{
    body>*:not(#xpPrint){display:none!important}
    #xpPrint{display:block!important}
    .xp-page{break-after:page;box-shadow:none!important;margin:0!important}
    .xp-page:last-child{break-after:auto}
    .xp-page.land{page:land}
  }
  .xp-page{box-sizing:border-box;width:210mm;height:297mm;padding:11mm 15mm 11mm;background:#fff;color:#111;overflow:hidden;display:flex;flex-direction:column;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;line-height:1.4;text-align:left;letter-spacing:0}
  .xp-page.land{width:297mm;height:210mm;padding:8mm 10mm}
  .xp-page .tnr,.xp-page.tnr{font-family:"Times New Roman",Tinos,"Liberation Serif",serif}
  .xp-page .ar{font-family:Arial,Arimo,Helvetica,sans-serif}
  .xp-f{display:grid;align-items:end;gap:0}
  .xp-v{border-bottom:1px dotted #111;font-weight:700;padding-left:6px;min-height:1.3em;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
  .xp-box{width:14px;height:14px;border:1px solid #111;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;vertical-align:middle}
  .xp-page table{border-collapse:collapse;width:100%;font-size:12px}
  .xp-page th,.xp-page td{border:1px solid #111;color:#111;padding:4px 5px;text-align:center;vertical-align:middle;white-space:normal;background:none;font-family:inherit;letter-spacing:0;text-transform:none}
  .xp-page th{font-size:11.5px;font-weight:700;background:#f1f1f1}
  .xp-stamp{border:2px solid #1f4e8c;color:#1f4e8c;border-radius:8px;padding:4px 9px;font-family:Arial,Arimo,sans-serif;font-size:11px;font-weight:700;display:inline-block;line-height:1.35;transform:rotate(-3deg);text-align:center}
  .xp-stamp.paper{border-color:#147a44;color:#147a44}
  .xp-pv{display:flex;flex-direction:column;gap:12px;align-items:center}
  .xp-pv .xp-hold{position:relative;box-shadow:0 2px 10px rgba(0,0,0,.18);flex:none}
  .xp-pv .xp-page{position:absolute;top:0;left:0;transform-origin:top left}
  `;
  let base = '';
  function init(o) {
    base = (o && o.base) || '';
    if (!document.getElementById('xpCss')) { const s = document.createElement('style'); s.id = 'xpCss'; s.textContent = CSS; document.head.appendChild(s); }
  }
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const val = s => `<span class="xp-v">${s ? e(s) : '&nbsp;'}</span>`;
  const logo = w => `<img src="${base}logo-vinfast.jpg" alt="VinFast" style="width:${w}px">`;
  const vn = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/); return m ? { d: m[3] + '/' + m[2] + '/' + m[1], h: m[4] ? m[4] + ':' + m[5] : '', dd: m[3], mm: m[2], yy: m[1] } : {}; };
  const chucVu = p => /^sale$/i.test(p.vaiTro || '') ? 'Nhân viên bán hàng' : (p.vaiTro || 'Nhân viên');
  const viTri = bp => !bp ? '' : /^(Phòng|Ban|Bộ phận)/.test(bp) ? bp : bp === 'XMĐ' ? 'Bộ phận XMĐ' : 'Phòng ' + bp;
  const page = (inner, cls, style) => `<div class="xp-page ${cls || ''}"${style ? ' style="' + style + '"' : ''}>${inner}</div>`;

  /* ---------- Lệnh điều xe đi công tác ----------
     p: {id, bien, loai, nguoi, vaiTro, boPhan, muc, kh, loTrinh, xa, diDk, veDk, duyet, cachDuyet, nguoiDuyet, capDuyet, duyetLuc} */
  function lenh(p) {
    const di = vn(p.diDk), ve = vn(p.veDk);
    const ok = p.duyet === 'Đã duyệt';
    const giay = ok && p.cachDuyet === 'Giấy';
    const thay = ok && p.cachDuyet === 'Quản lý duyệt thay';
    const stamp = !ok ? '' : giay
      ? `<span class="xp-stamp paper">ĐÃ CÓ CHỮ KÝ GIẤY<br>Xác nhận: ${e(String(p.duyetLuc || '').slice(6) || '')}</span>`
      : `<span class="xp-stamp">ĐÃ DUYỆT ĐIỆN TỬ<br>${e(thay ? 'Quản lý duyệt thay' : p.nguoiDuyet)}<br>${e(p.duyetLuc)}</span>`;
    const tenDuyet = ok ? (p.nguoiDuyet || '') : '';
    const muc = p.muc === 'Khách lái thử' ? 'Khách lái thử' + (p.kh ? ' · ' + p.kh : '') : (p.muc || 'Công tác');
    return `<div class="tnr" style="display:flex;flex-direction:column;gap:9px;font-size:14px">
      <div style="display:grid;grid-template-columns:1fr 1fr;text-align:center;font-size:12.5px"><span>NHÀ MÁY Ô TÔ THƯƠNG MẠI SAMCO<br><b>SAMCO BÌNH TÂN</b></span><span><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc Lập – Tự Do – Hạnh Phúc</b></span></div>
      <div style="text-align:center;font-size:21px;font-weight:700;padding-top:4px">LỆNH ĐIỀU XE ĐI CÔNG TÁC</div>
      <div class="xp-f" style="grid-template-columns:1fr auto;width:62%;margin:0 auto">${val(p.loai)}<span>(Biển số: <b>${e(p.bien)}</b>)</span></div>
      <div style="text-align:center;font-weight:700;font-style:italic;padding:8px 0 4px">Kính gửi: Ban Giám Đốc Nhà máy ô tô Thương mại SAMCO</div>
      <div class="xp-f" style="grid-template-columns:auto 1fr"><span>Họ tên người đề nghị:</span>${val(p.nguoi)}</div>
      <div class="xp-f" style="grid-template-columns:auto 1fr"><span>Chức vụ:</span>${val(chucVu(p))}</div>
      <div class="xp-f" style="grid-template-columns:auto 1fr"><span>Vị trí công tác:</span>${val(viTri(p.boPhan))}</div>
      <div class="xp-f" style="grid-template-columns:auto 1fr"><span>Mục đích chuyến đi công tác:</span>${val(muc)}</div>
      <div class="xp-f" style="grid-template-columns:1fr">${val((p.loTrinh || '') + (p.xa ? ' (ngoại thành / trên 100 km)' : ''))}</div>
      <div class="xp-f" style="grid-template-columns:auto 1fr auto 1fr"><span>Thời gian đi:</span>${val(di.d ? di.h + ' ' + di.d : '')}<span style="padding-left:6px">Thời gian về:</span>${val(ve.d ? ve.h + ' ' + ve.d : '')}</div>
      <div style="text-align:right">TP.HCM, ngày ${di.dd || '....'} tháng ${di.mm || '....'} năm ${di.yy || '........'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr"><span>DUYỆT</span><span style="text-align:center">PHỤ TRÁCH BỘ PHẬN</span><span style="text-align:right;padding-right:14px">NGƯỜI ĐỀ NGHỊ</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;min-height:78px;align-items:center"><span></span><span style="text-align:center">${stamp}</span><span></span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr"><span></span><span style="text-align:center">${e(tenDuyet)}</span><span style="text-align:right;padding-right:14px">${e(p.nguoi)}</span></div></div>`;
  }

  /* ---------- Phiếu yêu cầu lái thử ---------- */
  function phieu(p) {
    const di = vn(p.diDk), ve = vn(p.veDk), cell = 'border-right:1px solid #111';
    return `<div class="ar" style="border:1.5px solid #111;display:flex;flex-direction:column;font-size:12px">
      <div style="display:flex;flex-direction:column;gap:7px;padding:6px 6px 8px">
        <div style="display:grid;grid-template-columns:80px 1fr 80px;align-items:start">${logo(56)}<div style="text-align:center;font-size:16px;font-weight:700;padding-top:6px">PHIẾU YÊU CẦU LÁI THỬ</div><div></div></div>
        <div style="display:flex;justify-content:space-between;font-weight:700;font-style:italic"><span>Tên showroom: VinFast SAMCO Bình Tân</span><span style="padding-right:30px">Số phiếu: ${e(p.id)}</span></div>
        <div class="xp-f" style="grid-template-columns:118px 1fr 112px 1fr;gap:7px 0"><span>Ngày thử xe:</span>${val(di.d ? di.dd + ' / ' + di.mm + ' / ' + di.yy : '')}<span style="padding-left:6px">Loại xe:</span>${val((p.loai || '') + ' · ' + (p.bien || ''))}<span>Thời gian khởi hành:</span>${val(di.h)}<span style="padding-left:6px">Thời gian trở về:</span>${val(ve.h)}</div>
        <div class="xp-f" style="grid-template-columns:118px 1fr"><span>Lộ trình:</span>${val(p.loTrinh)}</div></div>
      <div style="border-top:1px solid #111;display:flex;flex-direction:column;gap:8px;padding:6px">
        <div class="xp-f" style="grid-template-columns:118px 1fr 112px 1fr"><span>Tên khách hàng:</span>${val(p.kh)}<span style="padding-left:6px">Điện thoại:</span>${val(p.sdt)}</div>
        <div class="xp-f" style="grid-template-columns:118px 1fr"><span>Địa chỉ hiện tại:</span>${val(p.diaChi)}</div>
        <div style="display:grid;grid-template-columns:1fr 120px 120px;align-items:center;padding-top:6px"><span>Khách hàng muốn tự lái thử xe:</span><span>Có &nbsp;<span class="xp-box">${p.tuLai ? 'X' : ''}</span></span><span>Không &nbsp;<span class="xp-box">${p.tuLai ? '' : 'X'}</span></span></div>
        <div class="xp-f" style="grid-template-columns:200px 1fr"><span>Đặc điểm khách hàng quan tâm:</span>${val('')}</div>
        <div class="xp-f" style="grid-template-columns:215px 1fr 120px 90px"><span>Giấy phép lái xe của khách hàng số:</span>${val(p.gplx)}<span style="padding-left:6px">Hiệu lực đến ngày:</span>${val(p.hanGplx)}</div>
        <div style="font-style:italic">(TVBH phô tô và lưu lại 01 bản bằng lái xe của khách hàng)</div></div>
      <div style="border-top:1px solid #111;display:grid;grid-template-columns:repeat(3,1fr);text-align:center;font-weight:700">
        <div style="${cell};padding:5px 4px">Người đề nghị<br><span style="font-weight:400">Khách hàng ký tên</span></div><div style="${cell};padding:5px 4px">Người lập phiếu</div><div style="padding:5px 4px">Người phê duyệt</div></div>
      <div style="border-top:1px solid #111;display:grid;grid-template-columns:repeat(3,1fr);text-align:center;min-height:96px">
        <div style="${cell};display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px">${e(p.kh)}</div><div style="${cell};display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px">${e(p.nguoi)}</div><div></div></div></div>`;
  }

  /* ---------- Giấy cam kết (CCCD chỉ in, không lưu) ---------- */
  const CAM_KET = [
    'Bằng Giấy Cam Kết này, tôi tự nguyện đăng ký tham gia lái thử xe ô tô VinFast do Công ty tổ chức tại <b>VinFast SAMCO Bình Tân</b> và cam kết tuân thủ theo những điều khoản sau:',
    '1. Cung cấp đầy đủ và chịu hoàn toàn mọi trách nhiệm pháp lý về các thông tin, giấy tờ cá nhân theo yêu cầu của Công ty và các bên liên quan trong thời gian tham gia chương trình.',
    '2. Tuyệt đối tuân thủ các điều lệ, nguyên tắc của Luật giao thông đường bộ và xe cơ giới. Đồng thời tuân thủ theo các hướng dẫn của nhân viên hướng dẫn lái thử xe trong khi tham gia lái thử xe, cũng như không được thực hiện bất kỳ hoạt động nào khác không nằm trong chương trình.',
    '3.Tôi đảm bảo rằng quyết định tham gia của mình trong việc tham gia lái thử xe này được đưa ra sau khi tôi đã xem xét, cân nhắc kỹ lưỡng. Tôi hiểu rằng việc lái thử xe ô tô này có thể bao gồm nguy cơ xảy ra những thương tích, tai nạn hoặc thương vong (những nguy cơ này có thể xảy ra do bất kỳ lý do gì, bao gồm nhưng không giới hạn do sự hỏng hóc, sự cố, hoặc lỗi kỹ thuật của xe, những hành động cố tình hoặc vô ý của tôi hoặc của những thành viên tham gia chương trình, v.v…). Tuy nhiên, tôi tình nguyện tham lái thử xe như vậy và chấp nhận những nguy cơ có thể xảy ra nêu trên trong suốt quá trình lái thử xe ... Đồng thời, tôi xin chịu trách nhiệm về các tổn thất, hư hỏng cho xe cũng như mọi tổn thất về người hoặc về tài sản do tôi gây ra cho người thứ ba trong quá trình lái thử xe.',
    '4. Tôi đồng ý và cam kết miễn truy cứu trách nhiệm, cũng như miễn việc yêu cầu Công ty, chi nhánh, các công ty liên quan và nhân viên trực thuộc các Công ty bồi thường thiệt hại xảy ra (nếu có) trong mọi trường hợp trong quá trình hoặc có liên quan đến việc chay thử xe này và dù vì bất kỳ nguyên nhân nào. Tôi thừa nhận rằng Công ty và các đơn vị và cá nhân nêu trên không có nghĩa vụ bồi thường nào liên quan đến bất kỳ trách nhiệm, nguyên nhân gây thiệt hại anào (bao gồm nhưng không giới hạn, thiệt hại trực tiếp và thực tế) trong mọi trường hợp trong quá trình hoặc có liên quan đến việc chay thử xe này. Tôi cam kết và từ bỏ mọi quyền yêu cầu bồi thường, khiếu nại, kiện tụng (bao gồm nhưng không giới hạn, thương tích cá nhân, tai nạn về thương vong, thiệt hại về tài sản hoặc các vấn đề tương tự cho người và tài sản của tôi hoặc của bất kỳ bên thứ ba nào khác) có thể phát sinh trực tiếp hoặc gián tiếp từ việc tham gia lái thử xe này, kể cả phát sinh trong các trường hợp bất khả kháng (bao gồm nhưng không giới hạn: thiên tai, hỏa hoạn, lũ lụt, khủng bố hay chiến tranh ...) đối với Công ty, chi nhánh, các công ty liên quan và nhân viên trực thuộc các Công ty trong mọi trường hợp và dù vì bất kỳ nguyên nhân nào..',
    '5. Tôi đồng ý và ủng hộ hoàn toàn việc Công ty thu thập, sử dụng miễn phí các thông tin cá nhân, hình ảnh, video về tôi và/ hoặc do tôi tạo ra và/ hoặc được tạo ra từ trong chương trình lái thử xe này để sử dụng nội bộ và/ hoặc quảng cáo, đăng tải trên các phương tiện thông tin đại chúng. Bên cạnh đó, Công ty được phép gửi các thông tin cá nhân, tư liệu, hình ảnh, video nêu trên cho công ty mình và các công ty khác cung cấp dịch vụ quảng cáo cho Công ty tại Việt Nam hoặc trên thế giới.',
    '6. Giấy Cam Kết này chịu sự điều chỉnh của Pháp luật Việt Nam. Trong trường hợp có bất kì vần đề, tranh chấp nảy sinh thì tranh chấp đó sẽ được đưa ra giải quyết tại cơ quan Tòa án có thẩm quyền tại Việt Nam.',
    '7. Giấy Cam Kết này sẽ có hiệu lực ràng buộc với bất kỳ bên thứ ba nào là người thừa kế và/ hoặc người được ủy quyền từ tôi.'
  ];
  function camket(p, x) {
    x = x || {};
    const di = vn(p.diDk);
    return page(`<div class="tnr" style="display:flex;flex-direction:column;gap:7px;font-size:12.5px;line-height:1.36">
      <div style="text-align:center">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc<br>---------------------------</div>
      <div style="text-align:center;font-size:17px;font-weight:700;padding-top:4px">GIẤY CAM KẾT</div>
      <div style="text-align:center;font-weight:700"><i><u>Kính gửi</u></i>: NHÀ MÁY Ô TÔ THƯƠNG MẠI SAMCO (SAMCO BÌNH TÂN)</div>
      <div class="xp-f" style="grid-template-columns:72px 1fr"><span>Tôi tên là:</span>${val(p.kh)}</div>
      <div class="xp-f" style="grid-template-columns:72px 1fr"><span>Địa chỉ:</span>${val(p.diaChi)}</div>
      <div class="xp-f" style="grid-template-columns:86px 1.3fr 30px 1fr 70px 1fr"><span>CMND/CCCD:</span>${val(x.cccd)}<span style="padding-left:4px">Do:</span>${val(x.noiCap)}<span style="padding-left:4px">Cấp ngày :</span>${val(x.capNgay)}</div>
      <div class="xp-f" style="grid-template-columns:108px 1fr 92px 1fr"><span>Giấy phép lái xe:</span>${val(p.gplx)}<span style="padding-left:8px">Hiệu lực đến:</span>${val(p.hanGplx)}</div>
      ${CAM_KET.map((t, i) => `<div style="text-align:justify;${i === 0 ? 'padding-top:6px' : ''}">${t}</div>`).join('')}
      <div style="padding-top:6px">TÔI ĐÃ ĐỌC VÀ HIỂU RÕ MỌI NỘI DUNG NÊU TRÊN CỦA "GIẤY CAM KẾT" VÀ TỰ NGUYỆN ĐỒNG Ý VỚI NHỮNG CAM KẾT NÊU TRÊN.</div>
      <div style="align-self:flex-end;width:250px;text-align:center;display:flex;flex-direction:column;gap:4px"><span>TP.HCM, ngày ${di.d || '....../....../......'}</span><span>Ký và ghi rõ họ tên</span><span style="padding-top:60px;font-weight:700">${e(p.kh)}</span></div></div>`, '', 'padding:13mm 17mm 12mm');
  }

  /* ---------- Trang 1: Lái thử = Lệnh + Phiếu yêu cầu; Công tác = 2 lệnh như mẫu gốc ---------- */
  function trang1(p) {
    const sep = '<div style="border-top:1px dashed #9aa1ab;margin:4mm 0"></div>';
    return page(`<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">${lenh(p)}${sep}${p.muc === 'Khách lái thử' ? phieu(p) : lenh(p)}</div>`);
  }
  /** Hồ sơ nhân viên in: lái thử = trang 1 + cam kết; công tác = trang 1. */
  function hoSo(p, x) { return p.muc === 'Khách lái thử' ? [trang1(p), camket(p, x)] : [trang1(p)]; }

  /* ---------- Phiếu kiểm tra tình trạng xe lái thử (từ dữ liệu trả xe) ---------- */
  const KT = [
    ['ngoai', 'Ngoại thất', 'Hàng ngày', '- Được vệ sinh sạch sẽ<br>- Không bị hư hại: móp, méo, bạc màu sơn, mất chi tiết…'],
    ['noi', 'Nội thất', 'Hàng ngày', '- Được vệ sinh sạch sẽ<br>- Không bị hư hại: xước, rách, mất chi tiết…'],
    ['nhienLieu', 'Nhiên liệu', 'Hàng ngày', 'Tối thiểu ở mức 1/2 dung tích bình theo đồng hồ hiển thị mức nhiên liệu.'],
    ['dauNhot', 'Dầu, nhớt động cơ', 'Định kỳ', '- Đầy đủ (nằm giữa vạch High và Low)<br>- Không bị biến chất (chuyển sang màu đen)'],
    ['nuoc', 'Nước và dung dịch khác', 'Định kỳ', 'Đầy đủ (nằm giữa vạch Full và Low) bao gồm:<br>- Dầu phanh (màu vàng)<br>- Nước làm mát (màu hồng hoặc xanh)<br>- Nước rửa kính'],
    ['dien', 'Hệ thống điện', 'Định kỳ', '- Không nổi đèn báo lỗi trên bảng đồng hồ táp lô<br>- Các hệ thống điện hoạt động bình thường: đèn, còi, gạt mưa, âm thanh, điều hòa…'],
    ['lop', 'Lốp', 'Định kỳ', '- Không bị hư hại: thủng, rách, quá mòn…<br>- Áp xuất lốp không quá non']
  ];
  function kiemtra(p) {
    const tt = p.tt || {};
    const first = KT.findIndex(k => tt[k[0]] === 'Không đạt');
    return page(`<div class="tnr" style="display:flex;flex-direction:column;gap:10px;font-size:13px">
      <div style="display:grid;grid-template-columns:120px 1fr 120px;align-items:start">${logo(62)}<div style="text-align:center;font-weight:700;line-height:1.4">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc<br><span style="font-weight:400">--oOo—</span></div><div></div></div>
      <div style="text-align:center;font-size:16px;font-weight:700;padding:10px 0 6px">PHIẾU KIỂM TRA TÌNH TRẠNG XE LÁI THỬ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr"><span>Loại xe: <b>${e(p.loai)}</b></span><span>Biển số: <b>${e(p.bien)}</b> &nbsp;·&nbsp; Ngày: <b>${e(p.ngayVe || p.ngayFull)}</b></span></div>
      <table><thead><tr><th rowspan="2" style="width:6%">STT</th><th rowspan="2" style="width:19%">Hạng mục kiểm tra</th><th rowspan="2" style="width:10%">Tần suất kiểm tra</th><th rowspan="2">Yêu cầu</th><th colspan="2">Đánh giá (tích V)</th><th rowspan="2" style="width:22%">Ghi chú chi tiết lỗi</th></tr><tr><th style="width:7%">ĐẠT</th><th style="width:8%">KHÔNG ĐẠT</th></tr></thead>
        <tbody>${KT.map((k, i) => `<tr><td>${i + 1}</td><td style="text-align:left">${k[1]}</td><td>${k[2]}</td><td style="text-align:left;font-size:11.5px">${k[3]}</td><td style="font-weight:700">${tt[k[0]] === 'Đạt' ? 'V' : ''}</td><td style="font-weight:700">${tt[k[0]] === 'Không đạt' ? 'V' : ''}</td><td style="text-align:left;font-size:11.5px">${i === first ? e(p.ttGhi) : ''}</td></tr>`).join('')}</tbody></table>
      ${first < 0 && p.ttGhi ? `<div style="font-size:12px">Ghi chú: ${e(p.ttGhi)}</div>` : ''}
      <div style="padding:18px 0 0 90px;text-align:center;width:330px;line-height:1.5">Người kiểm tra<br><i>(Ký, ghi rõ họ tên)</i><br>${p.xacNhan ? `<span class="xp-stamp" style="margin:10px 0 6px">ĐÃ XÁC NHẬN ĐIỆN TỬ<br>${e(p.nguoi)} · ${e(p.xacNhan)}</span>` : '<div style="height:60px"></div>'}<br><b>${e(p.nguoi)}</b></div></div>`);
  }

  /* ---------- Sổ nhật trình (A4 ngang). xe: {bien, loai, rows:[{nguoi, muc, ngay, ra, vao, odoDi, odoVe, tt}]} ---------- */
  function so(xe, tu, den) {
    const d = s => s ? String(s).split('-').reverse().join('/') : '…';
    const PER = 19, rows = xe.rows.slice();
    const pages = [];
    for (let i = 0; i === 0 || i < rows.length; i += PER) pages.push(rows.slice(i, i + PER));
    return pages.map((chunk, pi) => {
      const fill = chunk.concat(Array.from({ length: PER - chunk.length }, () => null));
      return page(`<div class="tnr" style="display:flex;flex-direction:column;gap:6px;font-size:12px">
        <div style="display:grid;grid-template-columns:110px 1fr 110px;align-items:center">${logo(58)}<div style="text-align:center;font-size:17px;font-weight:700">SỔ NHẬT TRÌNH XE LÁI THỬ</div><div style="text-align:right;font-size:11px">${pages.length > 1 ? 'Trang ' + (pi + 1) + '/' + pages.length : ''}</div></div>
        <div style="text-align:center">Xe ${e(xe.loai)} · Biển số ${e(xe.bien)} · Từ ngày ${d(tu)} đến ngày ${d(den)}</div>
        <table><thead><tr><th rowspan="2" style="width:4%">STT</th><th rowspan="2" style="width:8%">Loại Xe</th><th rowspan="2" style="width:9%">Biển Số</th><th rowspan="2" style="width:14%">Người sử dụng</th><th rowspan="2" style="width:12%">Mục đích sử dụng</th><th rowspan="2" style="width:8%">Ngày sử dụng</th><th colspan="2">Thời gian ra - vào cổng</th><th colspan="2">Số Km (ODO)</th><th rowspan="2" style="width:8%">Tình trạng xe trước lái thử</th><th colspan="2">Ký xác nhận</th></tr>
          <tr><th style="width:6%">Ra</th><th style="width:7%">Vào</th><th style="width:6%">Số cũ</th><th style="width:6%">Số mới</th><th style="width:9%">Người sử dụng</th><th style="width:10%">Lễ Tân/ HCBH/ Bảo Vệ</th></tr></thead>
          <tbody>${fill.map((r, i) => `<tr style="height:26px">${r ? `<td>${pi * PER + i + 1}</td><td>${e(xe.loai)}</td><td>${e(xe.bien)}</td><td style="text-align:left">${e(r.nguoi)}</td><td style="text-align:left">${e(r.muc)}</td><td>${e(r.ngay)}</td><td>${e(r.ra)}</td><td>${e(r.vao)}</td><td>${e(r.odoDi)}</td><td>${e(r.odoVe)}</td><td>${e(r.tt)}</td><td></td><td></td>` : '<td></td>'.repeat(13)}</tr>`).join('')}</tbody></table></div>`, 'land');
    });
  }

  /* ---------- Phiếu đề nghị dịch vụ sửa chữa nội bộ. d: {xe:[{loai,bien,ghiChu}], congViec, giao, nhanDk (yyyy-mm-dd), chiPhi, ghiChu, nguoi} ---------- */
  function lenhDv(d) {
    const g = vn(d.giao), n = vn(d.nhanDk), yy = g.yy || new Date().getFullYear();
    return page(`<div class="tnr" style="display:flex;flex-direction:column;gap:10px;font-size:14px">
      <div class="ar" style="font-size:11px;font-weight:700;line-height:1.4">NHÀ MÁY Ô TÔ THƯƠNG MẠI SAMCO<br><span style="padding-left:22px">VINFAST – SAMCO BÌNH TÂN</span></div>
      <div class="ar" style="font-size:11px;padding-left:44px"><u>PHÒNG BÁN HÀNG</u></div>
      <div style="text-align:center;font-size:17px;font-weight:700;padding-top:4px">PHIẾU ĐỀ NGHỊ DỊCH VỤ SỬA CHỮA NỘI BỘ</div>
      <div><b><u>Kính gửi:</u> - Phòng Dịch vụ VINFAST SAMCO BÌNH TÂN</b></div>
      <div>Phòng bán hàng đề nghị được hỗ trợ phần dịch vụ cho những xe lái thử sau:</div>
      <table style="font-size:14px"><thead><tr><th style="width:25%;font-size:14px">Loại xe</th><th style="width:29%;font-size:14px">Biển số</th><th style="font-size:14px">Ghi chú</th></tr></thead>
        <tbody>${d.xe.map(x => `<tr><td>${e(x.loai)}</td><td>${e(x.bien)}</td><td>${e(x.ghiChu)}</td></tr>`).join('')}</tbody></table>
      <div><b>Công việc cụ thể:</b> ${e(d.congViec)}</div>
      <div><b>Thời gian giao xe cho phòng dịch vụ:</b> ${g.d ? +g.dd + '/' + +g.mm + '/' + g.yy : '.../.../' + yy}</div>
      <div><b>Thời gian nhận lại xe hoàn chỉnh:</b> ${n.d ? +n.dd + '/' + +n.mm + '/' + n.yy : '.../.../' + yy}</div>
      <div><b>Chi phí trên được tính cho:</b> ${e(d.chiPhi)}</div>
      ${d.ghiChu ? `<div>Ghi chú: ${e(d.ghiChu)}</div>` : ''}
      <div style="text-align:right;font-style:italic">TP.HCM, ngày ${g.dd ? +g.dd : '...'} tháng ${g.mm ? +g.mm : '...'} năm ${yy}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center"><b>Xác nhận P.Dịch Vụ</b><span>Xác nhận P.Bán Hàng</span><span>Nhân viên đề nghị</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;padding-top:70px"><span></span><span></span><span>${e(d.nguoi || 'Nguyễn Viết Trường Giang')}</span></div></div>`, '', 'padding:12mm 18mm');
  }

  /* ---------- Báo cáo tháng (gọn) ---------- */
  function bao(b) {
    const t = b.tong, pc = x => x.n ? x.c + ' / ' + x.n + ' (' + Math.round(x.c / x.n * 100) + '%)' : '0 / 0';
    const L = 'text-align:left';
    return page(`<div class="ar" style="display:flex;flex-direction:column;gap:12px;font-size:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">${logo(56)}<div style="text-align:right;color:#555">VinFast SAMCO Bình Tân<br>Cập nhật ${e(b.capNhat)}</div></div>
      <div style="font-size:18px;font-weight:700">BÁO CÁO XE LÁI THỬ · THÁNG ${e(b.thang)}</div>
      <table><thead><tr><th>Chuyến</th><th>Km</th><th>Lái thử khách</th><th>Công tác</th><th>Đã duyệt</th><th>Ký giấy</th><th>Không duyệt</th><th>Duyệt trễ &gt; ${e(b.tre)}h</th><th>Lệch ODO</th><th>Xe trả có lỗi</th></tr></thead>
        <tbody><tr><td><b>${t.chuyen}</b></td><td><b>${Number(t.km).toLocaleString('vi-VN')}</b></td><td>${t.lt}</td><td>${t.ct}</td><td>${t.daDuyet} / ${t.canDuyet}</td><td>${t.giay}</td><td>${t.khong}</td><td>${t.tre}</td><td>${t.lech}</td><td>${t.ttKhong}</td></tr></tbody></table>
      <table><thead><tr><th style="${L}">Xe</th><th>Chuyến</th><th>Km</th><th>Pin TB khi lấy</th><th>Ngày không dùng</th><th>Lệnh dịch vụ</th></tr></thead>
        <tbody>${b.xe.map(x => `<tr><td style="${L}">${e(x.loai)} ${e(x.bien)}${x.ngung ? ' <i>(' + e(x.ngung) + ')</i>' : ''}</td><td>${x.chuyen}</td><td>${Number(x.km).toLocaleString('vi-VN')}</td><td>${x.pinTb === '' ? '—' : x.pinTb + '%'}</td><td>${x.khongDung}</td><td>${x.dv}</td></tr>`).join('')}</tbody></table>
      <table><thead><tr><th style="${L}">Bộ phận</th><th>Chuyến</th><th>Km</th></tr></thead>
        <tbody>${b.boPhan.length ? b.boPhan.map(x => `<tr><td style="${L}">${e(x.ten)}</td><td>${x.chuyen}</td><td>${Number(x.km).toLocaleString('vi-VN')}</td></tr>`).join('') : '<tr><td colspan="3">Chưa có chuyến</td></tr>'}</tbody></table>
      <div><b>Đối chiếu KSCL</b> (lượt khách lái thử đã trả xe)</div>
      <table><thead><tr><th style="${L}">Tiêu chí</th><th>Kết quả tháng</th></tr></thead><tbody>
        <tr><td style="${L}">C18-6 · Pin trên 80% khi cho khách lái</td><td>${pc(b.kscl.c186)}</td></tr>
        <tr><td style="${L}">C19-1 · Hồ sơ lái thử đủ thông tin (họ tên, số GPLX, hạn GPLX)</td><td>${pc(b.kscl.c191)}</td></tr>
        <tr><td style="${L}">C19-2 · Có GPLX + ảnh bằng lái (khách đồng ý lưu)</td><td>${pc(b.kscl.c192)}</td></tr>
        <tr><td style="${L}">C19-3 · Khách ký Phiếu yêu cầu + Giấy cam kết</td><td>${pc(b.kscl.c193)}</td></tr></tbody></table></div>`);
  }

  /* ---------- In / xem trước ---------- */
  function print(pages) {
    init({ base });
    let pr = document.getElementById('xpPrint');
    if (!pr) { pr = document.createElement('div'); pr.id = 'xpPrint'; document.body.appendChild(pr); }
    pr.innerHTML = pages.flat().join('');
    const imgs = Array.from(pr.querySelectorAll('img')).filter(i => !i.complete);
    let left = imgs.length;
    const go = () => setTimeout(() => window.print(), 150);
    if (!left) return go();
    imgs.forEach(i => { i.onload = i.onerror = () => { if (--left === 0) go(); }; });
  }
  /** Xem trước thu nhỏ trong el (vừa chiều rộng). */
  function preview(el, pages) {
    el.innerHTML = `<div class="xp-pv">${pages.flat().map(h => `<div class="xp-hold">${h}</div>`).join('')}</div>`;
    fit(el);
  }
  function fit(el) {
    const W = el.clientWidth || 360;
    el.querySelectorAll('.xp-hold').forEach(h => {
      const pg = h.firstElementChild, land = pg.classList.contains('land');
      const w = land ? 1123 : 794, hh = land ? 794 : 1123, s = Math.min(1, (W - 4) / w);
      h.style.width = w * s + 'px'; h.style.height = hh * s + 'px'; pg.style.transform = 'scale(' + s + ')';
    });
  }

  window.XP = { init, lenh, phieu, camket, trang1, hoSo, kiemtra, so, lenhDv, bao, print, preview, fit };
})();
