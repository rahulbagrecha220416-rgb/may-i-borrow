// Open a print-friendly item label in a new window and trigger the browser's
// print dialog. The user can "Save as PDF" from there on all major platforms.
// No extra deps — this is simpler and lighter than pdfkit/jsPDF for a single
// label page. (The `pdfkit` dep in package.json is unused; see DATABASE_MIGRATIONS.)

const escapeHtml = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);

export function printItemLabel(item) {
    if (!item) return;

    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`mayiborrow://item/${item.id}`)}`;

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(item.name)} — May We Borrow</title>
<style>
  @page { size: A6; margin: 10mm; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #2d3a33; margin: 0; padding: 24px; }
  .label { border: 2px dashed #6b7c73; border-radius: 12px; padding: 18px; text-align: center; }
  .brand { font-size: 11px; letter-spacing: 2px; color: #B89645; text-transform: uppercase; margin-bottom: 8px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .cat { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #726A60; margin-bottom: 12px; }
  .qr { margin: 8px auto; }
  .field { font-size: 11px; margin-top: 6px; color: #433D36; text-align: left; }
  .field b { color: #2d3a33; }
  .footer { font-size: 9px; color: #9CA3AF; margin-top: 12px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="label">
    <div class="brand">May We Borrow</div>
    <h1>${escapeHtml(item.name)}</h1>
    <div class="cat">${escapeHtml(item.category || 'General')}</div>
    <img class="qr" src="${qrSrc}" alt="QR code" width="180" height="180" />
    ${item.pickupAddress ? `<div class="field"><b>Pickup:</b> ${escapeHtml(item.pickupAddress)}</div>` : ''}
    ${item.pickupTime ? `<div class="field"><b>Best time:</b> ${escapeHtml(item.pickupTime)}</div>` : ''}
    ${item.pickupContact ? `<div class="field"><b>Contact:</b> ${escapeHtml(item.pickupContact)}</div>` : ''}
    ${item.maintenanceAmount ? `<div class="field"><b>Contribution:</b> ₹${escapeHtml(item.maintenanceAmount)}${item.maintenanceReason ? ` (${escapeHtml(item.maintenanceReason)})` : ''}</div>` : ''}
    <div class="footer">Scan to open in the app · id: ${escapeHtml(item.id)}</div>
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.print(); }, 300);
    });
  </script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=420,height=600');
    if (!w) {
        alert('Please allow pop-ups to print an item label.');
        return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
}
