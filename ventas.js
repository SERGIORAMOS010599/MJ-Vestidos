// --- CONFIGURACIÓN ---
const CLAVE_SECRETA = 'MJ2026';
const SHEET_ID = '18gsvPp2HSMR0DKIfYfZijnwc_PyNV7ULch-UDEVupV0';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwaKJxY7JErnXQUYi_OCTuKmGjyBoxlPe-RRcM_XmSkYrwRic2EK7nYSDN-W8VmmiSN/exec';
const PHOTOS_FOLDER_ID = '1YLrFG-atDTRZdCConiuhAtsNXhax_nqN';
const SHEET_NAME = 'VENTAS';

const SESSION_KEY = 'mj_admin_last_activity';
const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hora

let allSales = [];
let keptImages = [];
let isSelectionMode = false;
let selectedIds = new Set();
let sessionInterval = null;
let lastWriteTime = 0;

// --- REFERENCIAS DOM ---
const authOverlay = document.getElementById('auth-overlay');
const pinInput = document.getElementById('admin-pin');
const btnUnlock = document.getElementById('btn-unlock');
const btnToggleSelect = document.getElementById('btn-toggle-select');
const btnMoveDresses = document.getElementById('btn-move-dresses');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');

// --- SESIÓN COMPARTIDA CON CIERRE POR INACTIVIDAD (1 HORA) ---
function isSessionValid() {
    const last = Number(localStorage.getItem(SESSION_KEY) || 0);
    return last > 0 && (Date.now() - last) < INACTIVITY_LIMIT;
}

function refreshActivity() {
    if (!authOverlay || authOverlay.style.display !== 'none') return;
    const now = Date.now();
    if (now - lastWriteTime > 15000) {
        localStorage.setItem(SESSION_KEY, String(now));
        lastWriteTime = now;
    }
}

function lockSession(byTimeout) {
    localStorage.removeItem(SESSION_KEY);
    if (sessionInterval) {
        clearInterval(sessionInterval);
        sessionInterval = null;
    }
    if (pinInput) pinInput.value = '';
    if (authOverlay) authOverlay.style.display = 'flex';
    if (byTimeout) {
        alert('Tu sesión se cerró automáticamente tras 1 hora de inactividad.');
    }
}

function startSessionMonitor() {
    if (sessionInterval) clearInterval(sessionInterval);
    sessionInterval = setInterval(() => {
        if (!isSessionValid()) {
            lockSession(true);
        }
    }, 30000);
}

function unlockSales() {
    const now = Date.now();
    localStorage.setItem(SESSION_KEY, String(now));
    lastWriteTime = now;
    if (authOverlay) authOverlay.style.display = 'none';
    startSessionMonitor();
    loadSales();
}

['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, refreshActivity, { passive: true });
});

if (btnUnlock) {
    btnUnlock.addEventListener('click', () => {
        if (pinInput && pinInput.value === CLAVE_SECRETA) {
            unlockSales();
        } else {
            alert('Clave incorrecta.');
            if (pinInput) pinInput.value = '';
        }
    });
}

if (pinInput) {
    pinInput.addEventListener('keypress', e => {
        if (e.key === 'Enter' && btnUnlock) btnUnlock.click();
    });
}

// --- UTILIDADES ---
function normalizeText(str) {
    return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getSizeRank(sizeStr) {
    const s = String(sizeStr || '').trim().toUpperCase();
    const order = {
        'XXS': 1, '2XS': 1,
        'XS': 2, 'ECH': 2,
        'S': 3, 'CH': 3, 'CHICA': 3,
        'M': 4, 'MED': 4, 'MEDIANA': 4,
        'L': 5, 'G': 5, 'GRANDE': 5,
        'XL': 6, 'EG': 6, 'XG': 6,
        'XXL': 7, '2XL': 7, 'EEG': 7,
        'XXXL': 8, '3XL': 8,
        '4XL': 9
    };
    if (order[s] !== undefined) return order[s];
    const num = parseFloat(s);
    if (!isNaN(num) && /^\d+(\.\d+)?$/.test(s)) return 100 + num;
    if (s === 'ÚNICA' || s === 'UNICA' || s === 'UNITALLA') return 500;
    return 600;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = err => reject(err);
    });
}

// --- MODO SELECCIÓN PARA MOVER A VESTIDOS ---
function updateMoveDressesButton() {
    if (!btnMoveDresses) return;
    if (isSelectionMode && selectedIds.size > 0) {
        btnMoveDresses.style.display = 'inline-block';
        btnMoveDresses.innerText = `👗 Mover a Vestidos (${selectedIds.size})`;
    } else {
        btnMoveDresses.style.display = 'none';
    }
}

if (btnToggleSelect) {
    btnToggleSelect.addEventListener('click', () => {
        isSelectionMode = !isSelectionMode;
        selectedIds.clear();

        if (isSelectionMode) {
            btnToggleSelect.classList.add('active');
            btnToggleSelect.innerText = '✖️ Cancelar';
        } else {
            btnToggleSelect.classList.remove('active');
            btnToggleSelect.innerText = '☑️ Seleccionar';
        }

        updateMoveDressesButton();
        applySearchFilter();
    });
}

window.toggleSaleSelection = function(id, isChecked) {
    if (isChecked) {
        selectedIds.add(String(id));
    } else {
        selectedIds.delete(String(id));
    }
    updateMoveDressesButton();
    applySearchFilter();
};

if (btnMoveDresses) {
    btnMoveDresses.addEventListener('click', async () => {
        if (selectedIds.size === 0) return;

        const count = selectedIds.size;
        if (!confirm(`¿Mover ${count} artículo(s) de regreso a VESTIDOS?\n\nVolverán a aparecer en el catálogo principal y en el panel de rentas.`)) {
            return;
        }

        btnMoveDresses.disabled = true;
        btnMoveDresses.innerText = 'Moviendo a Vestidos...';

        try {
            const res = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'moveToDresses',
                    ids: Array.from(selectedIds)
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'No se pudieron mover los artículos.');

            alert(`¡${data.moved} artículo(s) movido(s) de regreso a Vestidos!`);

            isSelectionMode = false;
            selectedIds.clear();
            if (btnToggleSelect) {
                btnToggleSelect.classList.remove('active');
                btnToggleSelect.innerText = '☑️ Seleccionar';
            }
            updateMoveDressesButton();
            loadSales();
        } catch (err) {
            console.error(err);
            alert('Error al mover a vestidos: ' + err.message);
        } finally {
            btnMoveDresses.disabled = false;
            updateMoveDressesButton();
        }
    });
}

// --- CARGAR ARTÍCULOS DE LA PESTAÑA "VENTAS" ---
async function loadSales() {
    const listEl = document.getElementById('sales-list');
    listEl.innerHTML = '<p class="status-msg">Actualizando lista de ventas...</p>';

    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&tqx=out:json&t=${Date.now()}`;
        const res = await fetch(url);
        const text = await res.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        const rows = (json.table && json.table.rows) ? json.table.rows : [];

        allSales = [];
        rows.forEach(row => {
            const firstCell = row && row.c && row.c[0] && row.c[0].v ? String(row.c[0].v).trim() : '';
            if (firstCell && firstCell.toUpperCase() !== 'ID' && firstCell.toUpperCase() !== 'ID ARTICULO') {
                const imgStr = row.c[7] && row.c[7].v ? String(row.c[7].v) : '';
                allSales.push({
                    id: firstCell,
                    type: row.c[1] && row.c[1].v ? String(row.c[1].v) : 'Vestido',
                    name: row.c[2] && row.c[2].v ? String(row.c[2].v) : 'Sin nombre',
                    size: row.c[3] && row.c[3].v ? String(row.c[3].v) : 'Única',
                    price: row.c[4] && row.c[4].v ? Number(row.c[4].v) : 0,
                    deposit: row.c[5] && row.c[5].v ? Number(row.c[5].v) : 0,
                    color: row.c[6] && row.c[6].v ? String(row.c[6].v) : '',
                    images: imgStr ? imgStr.split(',').map(i => i.trim()).filter(Boolean) : [],
                    status: row.c[8] && row.c[8].v ? String(row.c[8].v) : 'En Venta',
                    comments: row.c[9] && row.c[9].v ? String(row.c[9].v) : ''
                });
            }
        });

        allSales.sort((a, b) => {
            const rankDiff = getSizeRank(a.size) - getSizeRank(b.size);
            if (rankDiff !== 0) return rankDiff;
            return a.name.localeCompare(b.name, 'es');
        });

        applySearchFilter();
    } catch (err) {
        console.error(err);
        listEl.innerHTML = '<p class="status-msg error">Error al cargar la hoja VENTAS. Verifica que el nombre de la pestaña sea exactamente VENTAS.</p>';
    }
}

// --- BUSCADOR ---
function applySearchFilter() {
    const rawQuery = searchInput ? searchInput.value.trim() : '';
    if (clearSearchBtn) clearSearchBtn.style.display = rawQuery ? 'block' : 'none';

    if (!rawQuery) {
        renderSales(allSales, false);
        return;
    }

    const terms = normalizeText(rawQuery).split(/\s+/).filter(Boolean);
    const filtered = allSales.filter(d => {
        const searchable = normalizeText(
            `${d.id} ${d.type} ${d.name} ${d.color} ${d.size} ${d.price} $${d.price} ${d.deposit} ${d.status} ${d.comments}`
        );
        return terms.every(term => searchable.includes(term));
    });

    renderSales(filtered, true);
}

if (searchInput) {
    searchInput.addEventListener('input', applySearchFilter);
}
if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        applySearchFilter();
        searchInput.focus();
    });
}

// --- RENDERIZAR LISTA ---
function renderSales(list, isFiltered) {
    const listEl = document.getElementById('sales-list');
    const countEl = document.getElementById('count-sales');

    countEl.innerText = isFiltered ? `${list.length} de ${allSales.length}` : allSales.length;

    if (list.length === 0) {
        listEl.innerHTML = isFiltered
            ? '<p class="status-msg">No se encontraron artículos que coincidan con tu búsqueda.</p>'
            : '<p class="status-msg">Aún no hay artículos en la sección de Ventas.</p>';
        return;
    }

    listEl.innerHTML = list.map(d => {
        const thumb = d.images[0] || 'img/proximamente.png';
        const safeName = d.name.replace(/'/g, "\\'");

        const isSelected = selectedIds.has(String(d.id));
        const disabledAttr = isSelectionMode ? 'disabled' : '';
        const checkboxHtml = isSelectionMode
            ? `<input type="checkbox" class="dress-select-check" ${isSelected ? 'checked' : ''} onchange="toggleSaleSelection('${d.id}', this.checked)">`
            : '';

        const stLow = d.status.toLowerCase();
        let badgeClass = 'status-venta';
        if (stLow.includes('vendido')) badgeClass = 'status-vendido';
        else if (stLow.includes('apartado')) badgeClass = 'status-apartado';

        return `
            <div class="dress-row ${isSelected ? 'selected-row' : ''}">
                ${checkboxHtml}
                <img src="${thumb}" alt="${d.name}" loading="lazy">
                <div class="dress-meta">
                    <h3>${d.name} <span class="dress-id">(ID: ${d.id})</span></h3>
                    <p>
                        <strong>Tipo:</strong> ${d.type} |
                        <strong>Estado:</strong> <span class="status-badge ${badgeClass}">${d.status}</span>
                    </p>
                    <p><strong>Color:</strong> ${d.color} | <strong>Talla:</strong> ${d.size}</p>
                    <p><strong>Precio:</strong> $${d.price} | <strong>Depósito/Anticipo:</strong> $${d.deposit} | <strong>Fotos:</strong> ${d.images.length}</p>
                    ${d.comments ? `<p><strong>Notas:</strong> ${d.comments}</p>` : ''}
                </div>
                <div class="dress-actions">
                    <button class="btn btn-edit" ${disabledAttr} onclick="startEdit('${d.id}')">✏️ Editar</button>
                    <button class="btn btn-delete" ${disabledAttr} onclick="deleteSale('${d.id}', '${safeName}')">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}
// --- SELECTOR DE TALLAS CON BOTONES ---
const sSizeButtons = Array.from(document.querySelectorAll('#s-size-selector .form-size-btn'));
const sSizeCustom = document.getElementById('s-size-custom');
const sSizeHidden = document.getElementById('s-size');

function syncSalesSizes() {
    const selected = sSizeButtons
        .filter(btn => btn.classList.contains('active'))
        .map(btn => btn.dataset.size);
    const customVal = sSizeCustom ? sSizeCustom.value.trim() : '';
    if (customVal) {
        customVal.split(/[,\-]+/).map(s => s.trim()).filter(Boolean).forEach(s => {
            if (!selected.includes(s)) selected.push(s);
        });
    }
    if (sSizeHidden) sSizeHidden.value = selected.join(', ');
}

function setSalesFormSizes(sizeStr) {
    sSizeButtons.forEach(b => b.classList.remove('active'));
    if (sSizeCustom) sSizeCustom.value = '';
    const customs = [];

    String(sizeStr || '').split(/[,\-]+/).map(s => s.trim()).filter(Boolean).forEach(sz => {
        const match = sSizeButtons.find(b => b.dataset.size.toUpperCase() === sz.toUpperCase());
        if (match) match.classList.add('active');
        else customs.push(sz);
    });

    if (sSizeCustom) sSizeCustom.value = customs.join(', ');
    syncSalesSizes();
}

sSizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const isEditing = Boolean(document.getElementById('edit-id').value);
        if (isEditing) {
            sSizeButtons.forEach(b => b.classList.remove('active'));
            if (sSizeCustom) sSizeCustom.value = '';
            btn.classList.add('active');
        } else {
            btn.classList.toggle('active');
        }
        syncSalesSizes();
    });
});

if (sSizeCustom) {
    sSizeCustom.addEventListener('input', () => {
        const isEditing = Boolean(document.getElementById('edit-id').value);
        if (isEditing && sSizeCustom.value.trim()) {
            sSizeButtons.forEach(b => b.classList.remove('active'));
        }
        syncSalesSizes();
    });
}
// --- EDITAR ARTÍCULO EN VENTAS ---
window.startEdit = function(id) {
    const d = allSales.find(item => String(item.id) === String(id));
    if (!d) return;

    document.getElementById('form-title').innerText = `Editando en Ventas: ${d.name} (${d.id})`;
    document.getElementById('edit-id').value = d.id;
    document.getElementById('s-type').value = d.type;
    document.getElementById('s-name').value = d.name;
    document.getElementById('s-color').value = d.color;
    setSalesFormSizes(d.size);
    document.getElementById('s-price').value = d.price;
    document.getElementById('s-deposit').value = d.deposit;

    const statusSelect = document.getElementById('s-status');
    if (d.status.toLowerCase().includes('vendido')) statusSelect.value = 'Vendido';
    else if (d.status.toLowerCase().includes('apartado')) statusSelect.value = 'Apartado';
    else statusSelect.value = 'En Venta';

    document.getElementById('s-comments').value = d.comments;
    document.getElementById('s-photos').value = '';

    keptImages = [...d.images];
    renderKeptImages();

    document.getElementById('btn-save').innerText = 'Actualizar en Ventas';
    document.getElementById('btn-cancel').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function renderKeptImages() {
    const block = document.getElementById('existing-images-block');
    const container = document.getElementById('current-images-container');
    if (keptImages.length === 0) {
        block.style.display = 'none';
        container.innerHTML = '';
        return;
    }
    block.style.display = 'block';
    container.innerHTML = keptImages.map((url, idx) => `
        <div class="img-chip">
            <img src="${url}">
            <button type="button" onclick="removeKeptImage(${idx})">&times;</button>
        </div>
    `).join('');
}

window.removeKeptImage = function(idx) {
    keptImages.splice(idx, 1);
    renderKeptImages();
};

function resetForm() {
    document.getElementById('sales-form').reset();
    setSalesFormSizes('');
    document.getElementById('edit-id').value = '';
    document.getElementById('s-type').value = 'Vestido';
    document.getElementById('s-deposit').value = '0';
    document.getElementById('s-status').value = 'En Venta';
    document.getElementById('form-title').innerText = 'Agregar Artículo a Ventas';
    document.getElementById('btn-save').innerText = 'Guardar en Ventas';
    document.getElementById('btn-cancel').style.display = 'none';
    keptImages = [];
    renderKeptImages();
}

const btnCancel = document.getElementById('btn-cancel');
if (btnCancel) btnCancel.addEventListener('click', resetForm);

// --- GUARDAR / ACTUALIZAR EN HOJA "VENTAS" ---
document.getElementById('sales-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const editId = document.getElementById('edit-id').value;
    const type = document.getElementById('s-type').value.trim();
    const name = document.getElementById('s-name').value.trim();
    const color = document.getElementById('s-color').value.trim();
    syncSalesSizes();
    const size = document.getElementById('s-size').value.trim();
    if (!size) {
        alert('Por favor, selecciona al menos una talla.');
        return;
    }
    const price = document.getElementById('s-price').value;
    const deposit = document.getElementById('s-deposit').value || 0;
    const status = document.getElementById('s-status').value;
    const comments = document.getElementById('s-comments').value.trim();
    const files = document.getElementById('s-photos').files;

    const btnSave = document.getElementById('btn-save');
    btnSave.disabled = true;

    try {
        const uploadedUrls = [];
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');

        for (let i = 0; i < files.length; i++) {
            btnSave.innerText = `Subiendo foto ${i + 1} de ${files.length}...`;
            const base64 = await fileToBase64(files[i]);
            const ext = files[i].name.split('.').pop();

            const uploadRes = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'uploadFile',
                    base64: base64,
                    filename: `Venta_${safeName}_${Date.now()}_${i}.${ext}`,
                    mimeType: files[i].type,
                    folderId: PHOTOS_FOLDER_ID
                })
            });
            const uploadData = await uploadRes.json();
            if (!uploadData.success) throw new Error(uploadData.error || 'Error subiendo foto');
            uploadedUrls.push(uploadData.directUrl);
        }

        const finalImages = [...keptImages, ...uploadedUrls].join(', ');
        btnSave.innerText = editId ? 'Actualizando en Ventas...' : 'Guardando en Ventas...';

        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: editId ? 'editDress' : 'addDress',
                sheetName: SHEET_NAME,
                id: editId,
                type, name, size, price, deposit, color,
                images: finalImages,
                status, comments
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error al guardar en VENTAS');

        alert(editId ? '¡Artículo actualizado en Ventas!' : '¡Artículo agregado a Ventas!');
        resetForm();
        loadSales();

    } catch (err) {
        console.error(err);
        alert('Ocurrió un error: ' + err.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerText = document.getElementById('edit-id').value ? 'Actualizar en Ventas' : 'Guardar en Ventas';
    }
});

// --- ELIMINAR DE HOJA "VENTAS" ---
window.deleteSale = async function(id, name) {
    if (!confirm(`¿Seguro que deseas eliminar "${name}" (ID: ${id}) de Ventas? Esta acción no se puede deshacer.`)) return;

    try {
        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'deleteDress',
                sheetName: SHEET_NAME,
                id: id
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'No se pudo eliminar');

        alert('Artículo eliminado de Ventas.');
        loadSales();
    } catch (err) {
        console.error(err);
        alert('Error al eliminar: ' + err.message);
    }
};

// --- INICIAR SI YA HAY SESIÓN ACTIVA ---
if (isSessionValid()) {
    unlockSales();
}
