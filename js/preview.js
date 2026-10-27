/* ========================================
   preview.js — Render quotation for print
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    var settings = loadFromStorage('companySettings');
    var q = loadFromStorage('currentQuotation');

    if (!q) {
        document.getElementById('quotationPaper').innerHTML =
            '<p style="padding:2rem;text-align:center;color:#666;">No quotation data found. Please create a quotation first.</p>';
        return;
    }

    render(settings || {}, q);

    document.getElementById('printBtn').addEventListener('click', function () { window.print(); });
});

function render(s, q) {
    // -- Document header --
    setText('docType', q.docType || 'QUOTATION');
    setText('docLabel', q.docLabel || 'ORIGINAL FOR RECIPIENT');

    // -- Company --
    setText('companyName', s.companyName || '');
    setText('companyPan', s.pan ? 'PAN ' + s.pan : '');
    setText('companyMobile', s.mobile ? 'Mobile ' + s.mobile : '');
    setText('companyEmail', s.email ? 'Email ' + s.email : '');
    setText('companyWebsite', s.website ? 'Website ' + s.website : '');

    if (s.logo) {
        var logo = document.getElementById('companyLogo');
        logo.src = s.logo;
        logo.style.display = 'block';
    }

    // -- Meta --
    setText('quotationNumber', q.quotationNumber);
    setText('footerQuotationNumber', 'Quotation #' + q.quotationNumber);
    setText('quotationDate', formatDate(q.quotationDate));
    setText('validityDate', formatDate(q.validityDate));

    // -- Customer --
    var cust = q.customerName;
    if (q.customerCompany) cust += ' (' + q.customerCompany + ')';
    setText('customerName', cust);

    // -- Items --
    var tbody = document.getElementById('itemsBody');
    var totalMRP = 0, totalAmt = 0;

    q.items.forEach(function (item) {
        totalMRP += item.mrp * item.qty;
        totalAmt += item.amount;

        var discCell = '-';
        if (item.discountAmount > 0) {
            discCell = formatNumber(item.discountAmount) +
                (item.discountType === 'amount'
                    ? '<br>(fixed per unit)'
                    : '<br>(' + (item.discountPercent || 0).toFixed(2) + '%)');
        }

        var descHtml = '';
        if (item.description) {
            descHtml = '<div class="desc-text">' + escapeHtml(item.description).replace(/\n/g, '<br>') + '</div>';
        }

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td style="text-align:center">' + item.serial + '</td>' +
            '<td><strong>' + escapeHtml(item.name) + '</strong>' + descHtml + '</td>' +
            '<td style="text-align:right">' + formatNumber(item.mrp) + '</td>' +
            '<td style="text-align:center">' + discCell + '</td>' +
            '<td style="text-align:right">' + formatNumber(item.sellingPrice) + '</td>' +
            '<td style="text-align:center">' + item.qty + ' ' + item.unit + '</td>' +
            '<td style="text-align:right">' + formatNumber(item.amount) + '</td>';
        tbody.appendChild(tr);
    });

    var totalDiscount = totalMRP - totalAmt;

    setText('totalMRP', formatCurrency(totalMRP));
    setText('totalDiscount', formatCurrency(totalDiscount));
    setText('grandTotal', formatCurrency(totalAmt));
    var totalQty = q.totalQty || q.items.reduce(function (sum, item) { return sum + (Number(item.qty) || 0); }, 0);
    setText('itemCount', 'Items: ' + q.items.length + '  |  Total quantity: ' + totalQty);
    setText('amountWords', 'Amount in words: ' + numberToWords(totalAmt));

    // -- Footer: Bank --
    if (s.bankName || s.accountHolder || s.accountNumber || s.ifscCode || s.branch) {
        setText('bankName', s.bankName);
        setText('accountHolder', s.accountHolder);
        setText('accountNumber', s.accountNumber);
        setText('ifscCode', s.ifscCode);
        setText('branchName', s.branch);
    }

    // -- UPI QR --
    if (s.upiQr) {
        document.getElementById('upiSection').style.display = 'block';
        document.getElementById('upiQr').src = s.upiQr;
    }

    // -- Signature --
    if (s.signature) {
        var sigImg = document.getElementById('signatureImg');
        sigImg.src = s.signature;
        sigImg.style.display = 'inline-block';
    }
    if (s.logo) {
        var stampImg = document.getElementById('stampImg');
        stampImg.src = s.logo;
        stampImg.style.display = 'inline-block';
    }
    setText('sigCompany', s.companyName ? 'For ' + s.companyName : '');

    // -- Notes --
    if (q.notes) {
        document.getElementById('notesSection').style.display = 'block';
        document.getElementById('notesContent').innerHTML = escapeHtml(q.notes).replace(/\n/g, '<br>');
    }
}

// ---------- Helpers ----------
function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
