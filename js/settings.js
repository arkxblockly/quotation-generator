/* ========================================
   settings.js — Settings page logic
   ======================================== */

var removedImages = {};

document.addEventListener('DOMContentLoaded', function () {
    loadSettings();

    document.getElementById('settingsForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveSettings();
    });

    // Image upload previews
    bindUpload('logoInput', 'logoPreview', 'logo');
    bindUpload('qrInput', 'qrPreview', 'upiQr');
    bindUpload('signatureInput', 'signaturePreview', 'signature');
});

// ---------- Load ----------
function loadSettings() {
    var s = loadFromStorage('companySettings');
    if (!s) return;

    setValue('companyName', s.companyName);
    setValue('pan', s.pan);
    setValue('mobile', s.mobile);
    setValue('email', s.email);
    setValue('website', s.website);
    setValue('bankName', s.bankName);
    setValue('accountHolder', s.accountHolder);
    setValue('accountNumber', s.accountNumber);
    setValue('ifscCode', s.ifscCode);
    setValue('branch', s.branch);
    setValue('defaultNotes', s.notes);

    if (s.logo) renderPreview('logoPreview', s.logo, 'logo');
    if (s.upiQr) renderPreview('qrPreview', s.upiQr, 'upiQr');
    if (s.signature) renderPreview('signaturePreview', s.signature, 'signature');
}

function setValue(id, val) {
    var el = document.getElementById(id);
    if (el && val) el.value = val;
}

// ---------- Save ----------
async function saveSettings() {
    var s = loadFromStorage('companySettings') || {};

    s.companyName = document.getElementById('companyName').value.trim();
    s.pan = document.getElementById('pan').value.trim();
    s.mobile = document.getElementById('mobile').value.trim();
    s.email = document.getElementById('email').value.trim();
    s.website = document.getElementById('website').value.trim();
    s.bankName = document.getElementById('bankName').value.trim();
    s.accountHolder = document.getElementById('accountHolder').value.trim();
    s.accountNumber = document.getElementById('accountNumber').value.trim();
    s.ifscCode = document.getElementById('ifscCode').value.trim();
    s.branch = document.getElementById('branch').value.trim();
    s.notes = document.getElementById('defaultNotes').value.trim();

    // Handle new uploads
    var logoFile = document.getElementById('logoInput').files[0];
    var qrFile = document.getElementById('qrInput').files[0];
    var sigFile = document.getElementById('signatureInput').files[0];

    if (logoFile) s.logo = await fileToBase64(logoFile);
    if (qrFile) s.upiQr = await fileToBase64(qrFile);
    if (sigFile) s.signature = await fileToBase64(sigFile);

    // Handle removals
    if (removedImages.logo) s.logo = '';
    if (removedImages.upiQr) s.upiQr = '';
    if (removedImages.signature) s.signature = '';

    saveToStorage('companySettings', s);
    removedImages = {};
    showToast('Settings saved successfully!');
}

// ---------- Upload binding ----------
function bindUpload(inputId, previewId, key) {
    var input = document.getElementById(inputId);
    input.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                removedImages[key] = false;
                renderPreview(previewId, e.target.result, key);
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

function renderPreview(previewId, src, key) {
    var el = document.getElementById(previewId);
    el.innerHTML =
        '<div class="d-flex align-items-center gap-2 mt-1">' +
        '  <img src="' + src + '" alt="Preview" class="img-thumbnail" style="max-height:80px;">' +
        '  <button type="button" class="btn btn-sm btn-outline-danger remove-img-btn">Remove</button>' +
        '</div>';

    el.querySelector('.remove-img-btn').addEventListener('click', function () {
        removedImages[key] = true;
        el.innerHTML = '';
        // Clear file input too
        var inputId = key === 'logo' ? 'logoInput' : key === 'upiQr' ? 'qrInput' : 'signatureInput';
        document.getElementById(inputId).value = '';
    });
}
