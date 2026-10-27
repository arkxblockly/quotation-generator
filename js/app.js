/* ========================================
   app.js — Create quotation page logic
   ======================================== */

var itemCounter = 0;

document.addEventListener('DOMContentLoaded', function () {
    // Check settings
    var settings = loadFromStorage('companySettings');
    if (!settings || !settings.companyName) {
        document.getElementById('settingsWarning').style.display = 'flex';
    }

    // Default dates
    document.getElementById('quotationDate').value = getTodayDate();
    document.getElementById('validityDate').value = getTodayDate();
    document.getElementById('documentType').addEventListener('change', updateDocumentType);
    updateDocumentType();

    // Default notes from settings
    if (settings && settings.notes) {
        document.getElementById('notes').value = settings.notes;
    }

    // Add first empty row
    addItemRow();

    // Buttons
    document.getElementById('addItemBtn').addEventListener('click', addItemRow);
    document.getElementById('previewBtn').addEventListener('click', previewQuotation);
    document.getElementById('clearBtn').addEventListener('click', clearForm);
});

// ---------- Add item row ----------
function addItemRow() {
    itemCounter++;
    var tbody = document.getElementById('itemsBody');
    var idx = tbody.children.length + 1;

    var tr = document.createElement('tr');
    tr.setAttribute('data-id', itemCounter);
    tr.innerHTML =
        '<td class="text-center fw-medium">' + idx + '</td>' +
        '<td>' +
        '  <input type="text" class="form-control form-control-sm item-name" placeholder="Product or service name" required>' +
        '  <textarea class="form-control form-control-sm mt-1 item-desc" placeholder="Specifications / details (optional)" rows="2"></textarea>' +
        '</td>' +
        '<td><input type="number" class="form-control form-control-sm item-mrp" placeholder="0.00" step="0.01" min="0" required></td>' +
        '<td><select class="form-select form-select-sm item-disc-type" aria-label="Discount type">' +
        '  <option value="percent">Percentage</option><option value="amount">Amount</option>' +
        '</select><input type="number" class="form-control form-control-sm item-disc mt-1" placeholder="0%" step="0.01" min="0" value="0"></td>' +
        '<td class="item-sp text-end">0.00</td>' +
        '<td>' +
        '  <div class="input-group input-group-sm">' +
        '    <input type="number" class="form-control item-qty" min="1" value="1" required>' +
        '    <select class="form-select item-unit" style="max-width:68px">' +
        '      <option value="UNT">UNT</option><option value="PCS">PCS</option>' +
        '      <option value="NOS">NOS</option><option value="SET">SET</option>' +
        '    </select>' +
        '  </div>' +
        '</td>' +
        '<td class="item-amt text-end fw-medium">0.00</td>' +
        '<td class="text-center">' +
        '  <button type="button" class="btn btn-sm btn-outline-danger remove-item" title="Remove"><i class="bi bi-trash3"></i></button>' +
        '</td>';

    tbody.appendChild(tr);

    // Auto-calc listeners
    var mrp = tr.querySelector('.item-mrp');
    var disc = tr.querySelector('.item-disc');
    var discType = tr.querySelector('.item-disc-type');
    var qty = tr.querySelector('.item-qty');
    [mrp, disc, discType, qty].forEach(function (inp) {
        inp.addEventListener('input', function () { calcRow(tr); });
        inp.addEventListener('change', function () { calcRow(tr); });
    });
    discType.addEventListener('change', function () {
        var isPercent = discType.value === 'percent';
        disc.placeholder = isPercent ? '0%' : '0.00';
        disc.max = isPercent ? '100' : '';
        calcRow(tr);
    });

    // Remove listener
    tr.querySelector('.remove-item').addEventListener('click', function () {
        tr.remove();
        reindex();
        calcTotals();
    });
}

// ---------- Calculate row ----------
function calcRow(tr) {
    var mrp = parseFloat(tr.querySelector('.item-mrp').value) || 0;
    var disc = parseFloat(tr.querySelector('.item-disc').value) || 0;
    var discType = tr.querySelector('.item-disc-type').value;
    var qty = parseInt(tr.querySelector('.item-qty').value) || 1;

    var discAmt = discType === 'percent' ? mrp * (disc / 100) : Math.min(disc, mrp);
    var sp = mrp - discAmt;
    var amt = sp * qty;

    tr.querySelector('.item-sp').textContent = formatNumber(sp);
    tr.querySelector('.item-amt').textContent = formatNumber(amt);

    calcTotals();
}

// ---------- Recalculate totals ----------
function calcTotals() {
    var rows = document.querySelectorAll('#itemsBody tr');
    var totalMRP = 0, totalAmt = 0, totalQty = 0;

    rows.forEach(function (tr) {
        var mrp = parseFloat(tr.querySelector('.item-mrp').value) || 0;
        var qty = parseInt(tr.querySelector('.item-qty').value) || 1;
        var amt = parseFloat(tr.querySelector('.item-amt').textContent.replace(/,/g, '')) || 0;

        totalMRP += mrp * qty;
        totalAmt += amt;
        totalQty += qty;
    });

    document.getElementById('totalMRP').textContent = formatCurrency(totalMRP);
    document.getElementById('totalDiscount').textContent = formatCurrency(totalMRP - totalAmt);
    document.getElementById('grandTotal').textContent = formatCurrency(totalAmt);
    document.getElementById('itemCount').textContent = 'Total Items: ' + rows.length + ' / Qty: ' + totalQty;
}

// ---------- Re-index serial numbers ----------
function reindex() {
    var rows = document.querySelectorAll('#itemsBody tr');
    rows.forEach(function (tr, i) {
        tr.cells[0].textContent = i + 1;
    });
}

// ---------- Document type ----------
function updateDocumentType() {
    var type = document.getElementById('documentType').value;
    var isInvoice = type === 'INVOICE';
    document.getElementById('documentNumberLabel').textContent = (isInvoice ? 'Invoice' : 'Quotation') + ' ID *';
    document.getElementById('quotationNumber').placeholder = isInvoice ? 'e.g. INV-2026-001' : 'e.g. QT-2026-001';
    document.getElementById('pageDocumentTitle').textContent = 'New ' + (isInvoice ? 'Invoice' : 'Quotation');
    document.title = 'Create ' + (isInvoice ? 'Invoice' : 'Quotation') + ' - Invoice Generator';
}

// ---------- Preview ----------
function previewQuotation() {
    var documentType = document.getElementById('documentType').value;
    var qNum = document.getElementById('quotationNumber').value.trim();
    var cName = document.getElementById('customerName').value.trim();

    if (!qNum) { showToast('Please enter a ' + (documentType === 'INVOICE' ? 'invoice' : 'quotation') + ' ID.', 'danger'); return; }
    if (!cName) { showToast('Please enter the customer name.', 'danger'); return; }

    var rows = document.querySelectorAll('#itemsBody tr');
    if (rows.length === 0) { showToast('Add at least one item.', 'danger'); return; }

    // Check first item has a name
    var firstName = rows[0].querySelector('.item-name').value.trim();
    if (!firstName) { showToast('First item name is required.', 'danger'); return; }

    var data = {
        quotationNumber: qNum,
        quotationDate: document.getElementById('quotationDate').value,
        validityDate: document.getElementById('validityDate').value,
        docType: documentType,
        docLabel: 'ORIGINAL FOR RECIPIENT',
        customerName: cName,
        customerCompany: document.getElementById('customerCompany').value.trim(),
        notes: document.getElementById('notes').value.trim(),
        items: []
    };

    var totalQty = 0;
    rows.forEach(function (tr, i) {
        var mrp = parseFloat(tr.querySelector('.item-mrp').value) || 0;
        var disc = parseFloat(tr.querySelector('.item-disc').value) || 0;
        var discType = tr.querySelector('.item-disc-type').value;
        var qty = parseInt(tr.querySelector('.item-qty').value) || 1;
        var discAmt = discType === 'percent' ? mrp * (disc / 100) : Math.min(disc, mrp);
        var sp = mrp - discAmt;

        totalQty += qty;

        data.items.push({
            serial: i + 1,
            name: tr.querySelector('.item-name').value.trim(),
            description: tr.querySelector('.item-desc').value.trim(),
            mrp: mrp,
            discountPercent: disc,
            discountAmount: discAmt,
            discountType: discType,
            sellingPrice: sp,
            qty: qty,
            unit: tr.querySelector('.item-unit').value,
            amount: sp * qty
        });
    });

    data.totalQty = totalQty;

    saveToStorage('currentQuotation', data);
    window.open('preview.html', '_blank');
}

// ---------- Clear form ----------
function clearForm() {
    if (!confirm('Clear all fields?')) return;

    document.getElementById('quotationNumber').value = '';
    document.getElementById('quotationDate').value = getTodayDate();
    document.getElementById('validityDate').value = getTodayDate();
    document.getElementById('documentType').value = 'QUOTATION';
    updateDocumentType();
    document.getElementById('customerName').value = '';
    document.getElementById('customerCompany').value = '';
    document.getElementById('notes').value = '';

    document.getElementById('itemsBody').innerHTML = '';
    itemCounter = 0;
    addItemRow();
    calcTotals();
}
