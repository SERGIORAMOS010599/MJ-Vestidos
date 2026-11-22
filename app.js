const SHEET_ID = '18gsvPp2HSMR0DKIfYfZijnwc_PyNV7ULch-UDEVupV0';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwaKJxY7JErnXQUYi_OCTuKmGjyBoxlPe-RRcM_XmSkYrwRic2EK7nYSDN-W8VmmiSN/exec';
const IS_SALES_CATALOG = window.CATALOG_MODE === 'VENTAS';
const CART_STORAGE_KEY = 'mj_sales_cart';

const TIME_SLOTS_12H = [
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM'
];

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

function normalizeText(str) {
    return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getRowRentalsCount(rawControl) {
    if (!rawControl) return 0;
    try {
        const parsed = JSON.parse(rawControl);
        let total = Number(parsed.historical || 0);
        if (parsed.monthly && typeof parsed.monthly === 'object') {
            Object.values(parsed.monthly).forEach(monthObj => {
                if (monthObj && typeof monthObj === 'object') {
                    Object.values(monthObj).forEach(cnt => {
                        total += Number(cnt || 0);
                    });
                }
            });
        }
        return total;
    } catch (e) {
        return 0;
    }
}

function getBaseColorInfo(rawColor) {
    const c = normalizeText(rawColor);
    const map = [
        { key: 'negro', label: 'Negro', hex: '#1c1c1c' },
        { key: 'blanco', label: 'Blanco', hex: '#ffffff' },
        { key: 'marfil', label: 'Beige', hex: '#e8dcc4' },
        { key: 'beige', label: 'Beige', hex: '#e8dcc4' },
        { key: 'nude', label: 'Beige', hex: '#e8dcc4' },
        { key: 'champagne', label: 'Champagne', hex: '#f3e5ab' },
        { key: 'cafe', label: 'Café', hex: '#7b5333' },
        { key: 'chocolate', label: 'Café', hex: '#7b5333' },
        { key: 'azul', label: 'Azul', hex: '#2874a6' },
        { key: 'celeste', label: 'Azul', hex: '#5dade2' },
        { key: 'turquesa', label: 'Azul', hex: '#1abc9c' },
        { key: 'rojo', label: 'Rojo', hex: '#c0392b' },
        { key: 'vino', label: 'Vino', hex: '#722f37' },
        { key: 'tinto', label: 'Vino', hex: '#722f37' },
        { key: 'rosa', label: 'Rosa', hex: '#e88ca5' },
        { key: 'fucsia', label: 'Rosa', hex: '#d81b60' },
        { key: 'bugambilia', label: 'Bugambilia', hex: '#b51763' },
        { key: 'verde', label: 'Verde', hex: '#2e7d32' },
        { key: 'esmeralda', label: 'Verde', hex: '#1b7a43' },
        { key: 'olivo', label: 'Verde', hex: '#6b7b3c' },
        { key: 'morado', label: 'Morado', hex: '#6c3483' },
        { key: 'lila', label: 'Lila', hex: '#b39ddb' },
        { key: 'amarillo', label: 'Amarillo', hex: '#f1c40f' },
        { key: 'dorado', label: 'Dorado', hex: '#d4af37' },
        { key: 'oro', label: 'Dorado', hex: '#d4af37' },
        { key: 'plateado', label: 'Plateado', hex: '#bdc3c7' },
        { key: 'plata', label: 'Plateado', hex: '#bdc3c7' },
        { key: 'gris', label: 'Gris', hex: '#7f8c8d' },
        { key: 'naranja', label: 'Naranja', hex: '#e67e22' },
        { key: 'coral', label: 'Coral', hex: '#ff6f61' }
    ];
    for (const item of map) {
        if (c.includes(item.key)) return item;
    }
    const clean = String(rawColor || 'Otro').trim();
    const label = clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : 'Otro';
    return { key: normalizeText(label), label, hex: '#d4af37' };
}

function getHermosilloTodayStr() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Hermosillo',
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    return `${y}-${m}-${d}`;
}

function parseSheetDateCell(cell) {
    if (!cell) return '';
    const raw = cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : '';
    const dateMatch = raw.match(/^Date\((\d+),(\d+),(\d+)/);
    if (dateMatch) {
        const y = dateMatch[1];
        const m = String(Number(dateMatch[2]) + 1).padStart(2, '0');
        const d = String(Number(dateMatch[3])).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return raw.replace(/^'/, '').trim();
}

function parseSheetTimeCell(cell) {
    if (!cell) return '';
    const raw = cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : '';
    const dtMatch = raw.match(/^Date\(\d+,\d+,\d+,(\d+),(\d+)/);
    if (dtMatch) {
        let h = Number(dtMatch[1]);
        const m = String(Number(dtMatch[2])).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}:${m} ${ampm}`;
    }
    const str = (cell.f ? String(cell.f) : raw).replace(/^'/, '').trim().toUpperCase();
    const ampmMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/);
    if (ampmMatch) {
        return `${Number(ampmMatch[1])}:${ampmMatch[2]} ${ampmMatch[3]}`;
    }
    const h24Match = str.match(/^(\d{1,2}):(\d{2})/);
    if (h24Match) {
        let h = Number(h24Match[1]);
        const m = h24Match[2];
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}:${m} ${ampm}`;
    }
    return str;
}

class Dress {
    constructor(id, type, name, sizes, price, deposit, color, images, status, comments, totalRentals = 0) {
        this.id = String(id);
        this.type = String(type || 'Vestido');
        this.name = String(name || 'Sin nombre');
        this.sizes = Array.isArray(sizes) ? sizes : [String(sizes || 'Única')];
        this.price = Number(price) || 0;
        this.deposit = Number(deposit) || 0;
        this.color = String(color || 'N/A');
        this.baseColor = getBaseColorInfo(this.color);
        this.images = images;
        this.status = String(status || (IS_SALES_CATALOG ? 'En Venta' : 'Disponible'));
        this.comments = String(comments || '');
        this.totalRentals = Number(totalRentals) || 0;
    }

    generateCardHTML(rankNumber = null) {
        const portada = this.images[0] || 'img/proximamente.png';
        const spheresHtml = this.sizes
            .map(sz => `<span class="size-sphere">${sz}</span>`)
            .join('');
        const priceSuffix = IS_SALES_CATALOG ? 'MXN' : 'MXN / noche';
        const rankBadgeHtml = rankNumber ? `<span class="rank-badge">#${rankNumber}</span>` : '';

        return `
            <div class="dress-card" onclick="window.appCatalog.openBookingModal('${this.id}')">
                ${rankBadgeHtml}
                <img src="${portada}" alt="${this.name}" class="dress-image" loading="lazy">
                <div class="dress-info">
                    <h3>${this.name}</h3>
                    <p><strong>Color:</strong> ${this.color}</p>
                    <div class="size-spheres-container">${spheresHtml}</div>
                    <p style="font-size: 0.8rem; margin: 6px 0; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${this.type}</p>
                    <p class="dress-price">$${this.price.toFixed(2)} ${priceSuffix}</p>
                </div>
            </div>
        `;
    }
}

class Catalog {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.allDresses = [];
        this.filteredDresses = [];
        this.topRentedDresses = [];
        this.hasActiveFiltersFlag = false;
        this.selectedDress = null;
        this.selectedModalSize = '';
        this.citaMode = 'single'; // 'single' | 'general' | 'cart'
        this.citaDressName = '';
        this.currentPage = 1;
        this.itemsPerPage = 50;

        // Carrito de compras (solo en página de Ventas)
        this.cart = this.loadCart();

        this.filterState = {
            sort: '', // '' | 'popular' | 'asc' | 'desc'
            sizes: new Set(),
            colors: new Set(),
            minPrice: 0,
            maxPrice: 5000,
            absMinPrice: 0,
            absMaxPrice: 5000
        };

        this.bookedSlots = {};
        const todayStr = getHermosilloTodayStr();
        const [ty, tm] = todayStr.split('-').map(Number);
        this.calYear = ty;
        this.calMonth = tm - 1;
        this.selectedDate = todayStr;
        this.selectedTime = '';

        this.initModalEvents();
        this.initFilterEvents();
        this.initCartEvents();
        this.initCitaEvents();
        this.loadFromGoogleSheets();
    }

    async loadFromGoogleSheets() {
        const loadingMsg = IS_SALES_CATALOG
            ? 'Cargando vestidos en venta...'
            : 'Cargando catálogo de MJ Vestidos...';
        this.container.innerHTML = `<p style="text-align:center; width:100%;">${loadingMsg}</p>`;

        const sheetParam = IS_SALES_CATALOG ? 'sheet=VENTAS&' : '';
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${sheetParam}tqx=out:json&t=${Date.now()}`;

        try {
            const response = await fetch(url);
            const text = await response.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = (json.table && json.table.rows) ? json.table.rows : [];

            const groupedMap = new Map();

            rows.forEach((row) => {
                const firstCell = row && row.c && row.c[0] && row.c[0].v ? String(row.c[0].v).trim() : '';
                if (firstCell && firstCell.toUpperCase() !== 'ID' && firstCell.toUpperCase() !== 'ID ARTICULO') {
                    const baseId   = firstCell.split('-')[0].trim().toUpperCase();
                    const type     = row.c[1] && row.c[1].v ? String(row.c[1].v).trim() : 'Vestido';
                    const name     = row.c[2] && row.c[2].v ? String(row.c[2].v).trim() : 'Sin nombre';
                    const size     = row.c[3] && row.c[3].v ? String(row.c[3].v).trim() : 'Única';
                    const price    = row.c[4] && row.c[4].v ? parseFloat(row.c[4].v) : 0;
                    const deposit  = row.c[5] && row.c[5].v ? parseFloat(row.c[5].v) : 0;
                    const color    = row.c[6] && row.c[6].v ? String(row.c[6].v).trim() : 'N/A';
                    const imgStr   = row.c[7] && row.c[7].v ? String(row.c[7].v) : '';
                    const status   = row.c[8] && row.c[8].v ? String(row.c[8].v).trim() : (IS_SALES_CATALOG ? 'En Venta' : 'Disponible');
                    if (IS_SALES_CATALOG && status.toLowerCase().includes('vendido')) {
                        return;
                    }
                    const comments = row.c[9] && row.c[9].v ? String(row.c[9].v).trim() : '';
                    const rawCtrl  = row.c[10] && row.c[10].v ? String(row.c[10].v) : '';
                    const rowRentals = getRowRentalsCount(rawCtrl);

                    const images = imgStr ? imgStr.split(',').map(img => img.trim()).filter(Boolean) : [];
                    const isAvail = IS_SALES_CATALOG
                        ? !status.toLowerCase().includes('vendido')
                        : !status.toLowerCase().includes('rentado');

                    if (!groupedMap.has(baseId)) {
                        groupedMap.set(baseId, {
                            id: baseId, type, name,
                            sizesSet: new Set([size]),
                            price, deposit, color,
                            images: images.length ? images : ['img/proximamente.png'],
                            hasAvailable: isAvail,
                            statusLabel: status,
                            comments,
                            totalRentals: rowRentals
                        });
                    } else {
                        const existing = groupedMap.get(baseId);
                        existing.sizesSet.add(size);
                        existing.totalRentals += rowRentals;
                        if (isAvail) existing.hasAvailable = true;
                        if (existing.images[0] === 'img/proximamente.png' && images.length) existing.images = images;
                        if (!existing.comments && comments) existing.comments = comments;
                    }
                }
            });

            this.allDresses = Array.from(groupedMap.values()).map(item => {
                const sortedSizes = Array.from(item.sizesSet).sort((a, b) => {
                    const diff = getSizeRank(a) - getSizeRank(b);
                    return diff !== 0 ? diff : a.localeCompare(b, 'es');
                });
                const finalStatus = IS_SALES_CATALOG
                    ? (item.hasAvailable ? item.statusLabel : 'Vendido')
                    : (item.hasAvailable ? 'Disponible' : 'Rentado');

                return new Dress(
                    item.id, item.type, item.name, sortedSizes,
                    item.price, item.deposit, item.color,
                    item.images, finalStatus, item.comments, item.totalRentals
                );
            });

            this.topRentedDresses = !IS_SALES_CATALOG
                ? [...this.allDresses]
                    .filter(d => d.totalRentals > 0)
                    .sort((a, b) => b.totalRentals - a.totalRentals)
                    .slice(0, 20)
                : [];

            this.buildFilterOptions();
            this.applyFilters(false);
            this.initHeroRunway();
        } catch (error) {
            console.error("Error cargando la base de datos:", error);
            this.container.innerHTML = '<p style="text-align:center; width:100%; color:red;">No se pudo cargar el catálogo. Verifica tu conexión.</p>';
        }
    }

    // =========================================
    // --- CARRITO DE COMPRAS (VENTAS) ---
    // =========================================
    loadCart() {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cart));
        } catch (e) {
            console.warn('No se pudo guardar el carrito:', e);
        }
    }

    initCartEvents() {
        if (!IS_SALES_CATALOG) return;

        const overlay = document.getElementById('cart-overlay');
        const drawer = document.getElementById('cart-drawer');
        const btnOpen = document.getElementById('btn-open-cart');
        const btnClose = document.getElementById('btn-close-cart');
        const btnCheckout = document.getElementById('btn-checkout-cart');
        const btnAdd = document.getElementById('btn-add-to-cart');

        this.openCartDrawer = () => {
            this.renderCart();
            if (overlay) overlay.classList.add('open');
            if (drawer) drawer.classList.add('open');
        };
        this.closeCartDrawer = () => {
            if (overlay) overlay.classList.remove('open');
            if (drawer) drawer.classList.remove('open');
        };

        if (btnOpen) btnOpen.addEventListener('click', this.openCartDrawer);
        if (btnClose) btnClose.addEventListener('click', this.closeCartDrawer);
        if (overlay) overlay.addEventListener('click', this.closeCartDrawer);

        if (btnAdd) {
            btnAdd.addEventListener('click', () => this.addToCart());
        }

        if (btnCheckout) {
            btnCheckout.addEventListener('click', () => {
                if (this.cart.length === 0) return;
                this.closeCartDrawer();
                this.openCitaModal('cart');
            });
        }

        this.renderCart();
    }

    addToCart() {
        if (!this.selectedDress) return;
        const d = this.selectedDress;

        if (d.status.toLowerCase().includes('vendido')) {
            alert('Este artículo ya fue vendido.');
            return;
        }

        if (!this.selectedModalSize) {
            alert('Por favor selecciona una talla antes de agregar al carrito.');
            return;
        }

        const itemKey = `${d.id}__${this.selectedModalSize}`;
        const exists = this.cart.some(item => item.key === itemKey);
        if (exists) {
            alert(`"${d.name}" en talla ${this.selectedModalSize} ya está en tu carrito.`);
            document.getElementById('booking-modal').style.display = 'none';
            if (this.openCartDrawer) this.openCartDrawer();
            return;
        }

        this.cart.push({
            key: itemKey,
            id: d.id,
            name: d.name,
            size: this.selectedModalSize,
            color: d.color,
            price: d.price,
            image: d.images[0] || 'img/proximamente.png'
        });

        this.saveCart();
        this.renderCart();
        document.getElementById('booking-modal').style.display = 'none';
        if (this.openCartDrawer) this.openCartDrawer();
    }

    removeFromCart(itemKey) {
        this.cart = this.cart.filter(item => item.key !== itemKey);
        this.saveCart();
        this.renderCart();
    }

    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
    }

    renderCart() {
        const badge = document.getElementById('cart-count-badge');
        const listEl = document.getElementById('cart-items-list');
        const totalEl = document.getElementById('cart-total-amount');
        const btnCheckout = document.getElementById('btn-checkout-cart');

        if (badge) {
            if (this.cart.length > 0) {
                badge.style.display = 'inline-flex';
                badge.innerText = this.cart.length;
            } else {
                badge.style.display = 'none';
            }
        }

        if (!listEl) return;

        const total = this.getCartTotal();
        if (totalEl) totalEl.innerText = `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
        if (btnCheckout) btnCheckout.disabled = this.cart.length === 0;

        if (this.cart.length === 0) {
            listEl.innerHTML = '<p class="cart-empty-msg">Tu carrito está vacío.<br>Selecciona los vestidos que te gusten y elige su talla para agregarlos aquí.</p>';
            return;
        }

        listEl.innerHTML = this.cart.map(item => `
            <div class="cart-item-card">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span><strong>Talla:</strong> ${item.size}</span>
                    <span><strong>Color:</strong> ${item.color}</span>
                    <span class="cart-item-price">$${Number(item.price).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                </div>
                <button type="button" class="cart-remove-btn" title="Quitar del carrito" onclick="window.appCatalog.removeFromCart('${item.key}')">&times;</button>
            </div>
        `).join('');
    }

    // =========================================
    // --- PASARELA CINEMATOGRÁFICA DE PORTADA ---
    // =========================================
    initHeroRunway() {
        const track = document.getElementById('hero-runway-track');
        if (!track) return;

        const realPhotos = this.allDresses
            .map(d => d.images[0])
            .filter(url => url && !url.toLowerCase().includes('proximamente.png'));

        if (realPhotos.length === 0) return;

        const shuffled = [...realPhotos];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        let selected = shuffled.slice(0, 18);
        while (selected.length < 8) {
            selected = selected.concat(shuffled);
        }

        const loopList = [...selected, ...selected];
        track.style.animationDuration = `${selected.length * 4}s`;
        track.innerHTML = loopList
            .map(url => `<div class="hero-runway-slide"><img src="${url}" alt="Colección MJ Vestidos"></div>`)
            .join('');
    }

    // =========================================
    // --- SISTEMA DE FILTROS ---
    // =========================================
    initFilterEvents() {
        const overlay = document.getElementById('filter-overlay');
        const drawer = document.getElementById('filter-drawer');
        const btnOpen = document.getElementById('btn-open-filter');
        const btnClose = document.getElementById('btn-close-filter');
        const btnApply = document.getElementById('btn-apply-filters');
        const btnClear = document.getElementById('btn-clear-filters');
        const minRange = document.getElementById('price-min-range');
        const maxRange = document.getElementById('price-max-range');

        const openDrawer = () => {
            if (overlay) overlay.classList.add('open');
            if (drawer) drawer.classList.add('open');
        };
        const closeDrawer = () => {
            if (overlay) overlay.classList.remove('open');
            if (drawer) drawer.classList.remove('open');
        };

        if (btnOpen) btnOpen.addEventListener('click', openDrawer);
        if (btnClose) btnClose.addEventListener('click', closeDrawer);
        if (overlay) overlay.addEventListener('click', closeDrawer);
        if (btnApply) btnApply.addEventListener('click', () => {
            this.applyFilters(true);
            closeDrawer();
            const cat = document.getElementById('catalogo');
            if (cat) cat.scrollIntoView({ behavior: 'smooth' });
        });

        document.querySelectorAll('[data-sort]').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.sort;
                if (this.filterState.sort === val) {
                    this.filterState.sort = '';
                    btn.classList.remove('active');
                } else {
                    document.querySelectorAll('[data-sort]').forEach(b => b.classList.remove('active'));
                    this.filterState.sort = val;
                    btn.classList.add('active');
                }
                this.applyFilters(false);
            });
        });

        const handlePriceChange = () => {
            let minVal = Number(minRange.value);
            let maxVal = Number(maxRange.value);
            if (minVal > maxVal) [minVal, maxVal] = [maxVal, minVal];
            this.filterState.minPrice = minVal;
            this.filterState.maxPrice = maxVal;
            this.updatePriceSliderUI();
            this.applyFilters(false);
        };

        if (minRange) minRange.addEventListener('input', handlePriceChange);
        if (maxRange) maxRange.addEventListener('input', handlePriceChange);

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                this.filterState.sort = '';
                this.filterState.sizes.clear();
                this.filterState.colors.clear();
                this.filterState.minPrice = this.filterState.absMinPrice;
                this.filterState.maxPrice = this.filterState.absMaxPrice;

                document.querySelectorAll('.filter-chip.active').forEach(b => b.classList.remove('active'));
                if (minRange) minRange.value = this.filterState.absMinPrice;
                if (maxRange) maxRange.value = this.filterState.absMaxPrice;
                this.updatePriceSliderUI();
                this.applyFilters(false);
            });
        }
    }

    buildFilterOptions() {
        const sizesSet = new Set();
        const colorsMap = new Map();
        let minP = Infinity;
        let maxP = 0;

        this.allDresses.forEach(d => {
            d.sizes.forEach(sz => sizesSet.add(sz));
            if (!colorsMap.has(d.baseColor.label)) {
                colorsMap.set(d.baseColor.label, d.baseColor.hex);
            }
            if (d.price < minP) minP = d.price;
            if (d.price > maxP) maxP = d.price;
        });

        const sortedSizes = Array.from(sizesSet).sort((a, b) => {
            const diff = getSizeRank(a) - getSizeRank(b);
            return diff !== 0 ? diff : a.localeCompare(b, 'es');
        });

        const sizesEl = document.getElementById('filter-sizes-list');
        if (sizesEl) {
            sizesEl.innerHTML = '';
            sortedSizes.forEach(sz => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'filter-chip';
                btn.innerText = sz;
                btn.onclick = () => {
                    if (this.filterState.sizes.has(sz)) {
                        this.filterState.sizes.delete(sz);
                        btn.classList.remove('active');
                    } else {
                        this.filterState.sizes.add(sz);
                        btn.classList.add('active');
                    }
                    this.applyFilters(false);
                };
                sizesEl.appendChild(btn);
            });
        }

        const colorsEl = document.getElementById('filter-colors-list');
        if (colorsEl) {
            colorsEl.innerHTML = '';
            Array.from(colorsMap.entries())
                .sort((a, b) => a[0].localeCompare(b[0], 'es'))
                .forEach(([label, hex]) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'filter-chip';
                    btn.innerHTML = `<span class="color-swatch" style="background:${hex};"></span>${label}`;
                    btn.onclick = () => {
                        if (this.filterState.colors.has(label)) {
                            this.filterState.colors.delete(label);
                            btn.classList.remove('active');
                        } else {
                            this.filterState.colors.add(label);
                            btn.classList.add('active');
                        }
                        this.applyFilters(false);
                    };
                    colorsEl.appendChild(btn);
                });
        }

        if (!isFinite(minP)) minP = 0;
        if (maxP <= minP) maxP = minP + 500;
        this.filterState.absMinPrice = minP;
        this.filterState.absMaxPrice = maxP;
        this.filterState.minPrice = minP;
        this.filterState.maxPrice = maxP;

        const minRange = document.getElementById('price-min-range');
        const maxRange = document.getElementById('price-max-range');
        if (minRange && maxRange) {
            minRange.min = minP; minRange.max = maxP; minRange.value = minP;
            maxRange.min = minP; maxRange.max = maxP; maxRange.value = maxP;
        }
        this.updatePriceSliderUI();
    }

    updatePriceSliderUI() {
        const { minPrice, maxPrice, absMinPrice, absMaxPrice } = this.filterState;
        const labelEl = document.getElementById('filter-price-label');
        if (labelEl) {
            labelEl.innerText = `$${minPrice.toLocaleString('es-MX')} — $${maxPrice.toLocaleString('es-MX')}`;
        }

        const fill = document.getElementById('price-range-fill');
        if (fill) {
            const span = Math.max(1, absMaxPrice - absMinPrice);
            const leftPct = ((minPrice - absMinPrice) / span) * 100;
            const rightPct = ((maxPrice - absMinPrice) / span) * 100;
            fill.style.left = `${leftPct}%`;
            fill.style.width = `${Math.max(0, rightPct - leftPct)}%`;
        }
    }

    applyFilters(resetPage = true) {
        const { sort, sizes, colors, minPrice, maxPrice, absMinPrice, absMaxPrice } = this.filterState;

        let result = this.allDresses.filter(d => {
            if (d.price < minPrice || d.price > maxPrice) return false;
            if (sizes.size > 0 && !d.sizes.some(sz => sizes.has(sz))) return false;
            if (colors.size > 0 && !colors.has(d.baseColor.label)) return false;
            return true;
        });

        if (sort === 'popular') result.sort((a, b) => b.totalRentals - a.totalRentals);
        else if (sort === 'asc') result.sort((a, b) => a.price - b.price);
        else if (sort === 'desc') result.sort((a, b) => b.price - a.price);

        this.filteredDresses = result;

        const btnApply = document.getElementById('btn-apply-filters');
        if (btnApply) btnApply.innerText = `Ver ${result.length} artículos`;

        const hasActive = Boolean(sort || sizes.size > 0 || colors.size > 0 || minPrice > absMinPrice || maxPrice < absMaxPrice);
        this.hasActiveFiltersFlag = hasActive;
        const dot = document.getElementById('filter-active-dot');
        if (dot) dot.style.display = hasActive ? 'block' : 'none';

        if (resetPage) this.currentPage = 1;
        this.render();
    }

    // =========================================
    // --- PAGINACIÓN (20 TOP + 30 EN PÁG 1, 50 EN PÁG 2+) ---
    // =========================================
    getPaginationState() {
        const isSplitView = !IS_SALES_CATALOG && !this.hasActiveFiltersFlag && this.topRentedDresses.length > 0;
        if (!isSplitView) {
            const totalPages = Math.max(1, Math.ceil(this.filteredDresses.length / this.itemsPerPage));
            return {
                isSplitView: false,
                totalPages,
                regularDresses: this.filteredDresses,
                page1RegularLimit: this.itemsPerPage
            };
        }

        const topIds = new Set(this.topRentedDresses.map(d => d.id));
        const regularDresses = this.filteredDresses.filter(d => !topIds.has(d.id));
        const page1RegularLimit = Math.max(0, this.itemsPerPage - this.topRentedDresses.length);
        const remaining = Math.max(0, regularDresses.length - page1RegularLimit);
        const totalPages = 1 + Math.ceil(remaining / this.itemsPerPage);

        return { isSplitView: true, totalPages, regularDresses, page1RegularLimit };
    }

    render() {
        this.container.innerHTML = '';

        const { isSplitView, totalPages, regularDresses, page1RegularLimit } = this.getPaginationState();
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const topSection = document.getElementById('mas-rentados');
        const topContainer = document.getElementById('top-rented-container');
        if (topSection && topContainer) {
            if (isSplitView && this.currentPage === 1) {
                topSection.style.display = 'block';
                topContainer.innerHTML = this.topRentedDresses
                    .map((dress, idx) => dress.generateCardHTML(idx + 1))
                    .join('');
            } else {
                topSection.style.display = 'none';
            }
        }

        if (this.filteredDresses.length === 0) {
            const emptyMsg = IS_SALES_CATALOG && this.allDresses.length === 0
                ? 'Próximamente agregaremos vestidos en venta.'
                : 'No se encontraron vestidos con los filtros seleccionados.';
            this.container.innerHTML = `<p style="text-align:center; width:100%; padding:30px 0; color:#666;">${emptyMsg}</p>`;
            this.renderPagination(1);
            return;
        }

        let pageDresses = [];
        if (isSplitView) {
            if (this.currentPage === 1) {
                pageDresses = regularDresses.slice(0, page1RegularLimit);
            } else {
                const startIndex = page1RegularLimit + (this.currentPage - 2) * this.itemsPerPage;
                pageDresses = regularDresses.slice(startIndex, startIndex + this.itemsPerPage);
            }
        } else {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            pageDresses = this.filteredDresses.slice(startIndex, startIndex + this.itemsPerPage);
        }

        pageDresses.forEach(dress => {
            this.container.innerHTML += dress.generateCardHTML();
        });

        this.renderPagination(totalPages);
    }

    renderPagination(totalPages) {
        const paginationContainer = document.getElementById('pagination-controls');
        if (!paginationContainer) return;

        if (this.filteredDresses.length === 0) {
            paginationContainer.innerHTML = '';
            return;
        }

        const disableBack5 = this.currentPage <= 5;
        const disablePrev  = this.currentPage <= 1;
        const disableNext  = this.currentPage >= totalPages;
        const disableNext5 = (this.currentPage + 5) > totalPages;

        paginationContainer.innerHTML = `
            <button class="page-btn" title="Retroceder 5 páginas" ${disableBack5 ? 'disabled' : ''} onclick="window.appCatalog.changePage(${this.currentPage - 5})">&laquo; 5</button>
            <button class="page-btn" title="Página anterior" ${disablePrev ? 'disabled' : ''} onclick="window.appCatalog.changePage(${this.currentPage - 1})">&lsaquo;</button>
            <span class="page-info">Página ${this.currentPage} de ${totalPages}</span>
            <button class="page-btn" title="Página siguiente" ${disableNext ? 'disabled' : ''} onclick="window.appCatalog.changePage(${this.currentPage + 1})">&rsaquo;</button>
            <button class="page-btn" title="Avanzar 5 páginas" ${disableNext5 ? 'disabled' : ''} onclick="window.appCatalog.changePage(${this.currentPage + 5})">5 &raquo;</button>
        `;
    }

    changePage(newPage) {
        const { isSplitView, totalPages } = this.getPaginationState();
        if (newPage < 1 || newPage > totalPages) return;
        this.currentPage = newPage;
        this.render();

        const targetSection = (isSplitView && this.currentPage === 1)
            ? document.getElementById('mas-rentados')
            : document.getElementById('catalogo');
        if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth' });
    }

    // =========================================
    // --- MODAL DE DETALLE DEL VESTIDO ---
    // =========================================
    openBookingModal(dressId) {
        this.selectedDress = this.allDresses.find(d => String(d.id) === String(dressId));
        if (!this.selectedDress) return;
        const d = this.selectedDress;

        const mainImg = document.getElementById('modal-dress-img');
        mainImg.src = d.images[0] || 'img/proximamente.png';

        const thumbnailsContainer = document.getElementById('modal-thumbnails');
        thumbnailsContainer.innerHTML = '';

        if (d.images.length > 1) {
            d.images.forEach(imgUrl => {
                const thumb = document.createElement('img');
                thumb.src = imgUrl;
                thumb.style.cssText = 'width:60px;height:80px;object-fit:cover;border-radius:4px;cursor:pointer;border:2px solid transparent;';
                thumb.onclick = () => {
                    mainImg.src = imgUrl;
                    Array.from(thumbnailsContainer.children).forEach(c => c.style.border = '2px solid transparent');
                    thumb.style.border = '2px solid #d4af37';
                };
                thumbnailsContainer.appendChild(thumb);
            });
            thumbnailsContainer.firstChild.style.border = '2px solid #d4af37';
        }

        document.getElementById('modal-dress-type').innerText = d.type;
        document.getElementById('modal-dress-name').innerText = d.name;

        const priceEl = document.getElementById('modal-dress-price');
        const depositEl = document.getElementById('modal-dress-deposit');

        if (IS_SALES_CATALOG) {
            priceEl.innerText = `Precio de venta: $${d.price.toFixed(2)} MXN`;
            depositEl.style.display = d.deposit > 0 ? 'block' : 'none';
            depositEl.innerText = `Apartado / Anticipo: $${d.deposit.toFixed(2)} MXN`;
        } else {
            priceEl.innerText = `$${d.price.toFixed(2)} MXN / noche`;
            depositEl.style.display = 'block';
            depositEl.innerText = `Depósito reembolsable: $${d.deposit.toFixed(2)} MXN`;
        }

        document.getElementById('modal-dress-color').innerText = d.color;

        const statusEl = document.getElementById('modal-status-badge');
        const stLow = d.status.toLowerCase();
        const isUnavailable = stLow.includes('rentado') || stLow.includes('vendido');
        statusEl.innerText = IS_SALES_CATALOG
            ? d.status
            : (isUnavailable ? 'Actualmente Rentado' : 'Disponible');
        statusEl.style.backgroundColor = isUnavailable ? '#fdecea' : '#e8f7ee';
        statusEl.style.color = isUnavailable ? '#b71c1c' : '#1b7a43';
        statusEl.style.border = isUnavailable ? '1px solid #f5c6cb' : '1px solid #b7e4c7';

        const sizesContainer = document.getElementById('modal-dress-sizes');
        sizesContainer.innerHTML = '';

        if (IS_SALES_CATALOG) {
            // En Ventas las esferitas son seleccionables antes de agregar al carrito
            this.selectedModalSize = d.sizes.length === 1 ? d.sizes[0] : '';
            d.sizes.forEach(sz => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'size-sphere selectable' + (sz === this.selectedModalSize ? ' selected-size' : '');
                btn.innerText = sz;
                btn.onclick = () => {
                    this.selectedModalSize = sz;
                    sizesContainer.querySelectorAll('.size-sphere').forEach(b => b.classList.remove('selected-size'));
                    btn.classList.add('selected-size');
                };
                sizesContainer.appendChild(btn);
            });

            const btnAdd = document.getElementById('btn-add-to-cart');
            if (btnAdd) {
                btnAdd.disabled = isUnavailable;
                btnAdd.style.opacity = isUnavailable ? '0.5' : '1';
                btnAdd.style.cursor = isUnavailable ? 'not-allowed' : 'pointer';
                btnAdd.innerText = isUnavailable ? 'Artículo Vendido' : '🛒 Agregar al carrito';
            }
        } else {
            sizesContainer.innerHTML = d.sizes
                .map(sz => `<span class="size-sphere">${sz}</span>`)
                .join('');
        }

        const commentsWrap = document.getElementById('modal-dress-comments-wrap');
        const commentsEl = document.getElementById('modal-dress-comments');
        if (d.comments.trim()) {
            commentsEl.innerText = d.comments;
            commentsWrap.style.display = 'block';
        } else {
            commentsWrap.style.display = 'none';
        }

        document.getElementById('booking-modal').style.display = 'block';
    }

    initModalEvents() {
        const modal = document.getElementById('booking-modal');
        const closeBtn = modal ? modal.querySelector('.close-btn') : null;
        if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        const btnOpenCita = document.getElementById('btn-open-cita');
        if (btnOpenCita) {
            btnOpenCita.addEventListener('click', () => {
                modal.style.display = 'none';
                this.openCitaModal('single');
            });
        }

        const navCitaBtn = document.getElementById('nav-agenda-cita');
        if (navCitaBtn) {
            navCitaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCitaModal('general');
            });
        }
    }

    // =========================================
    // --- MODAL DE AGENDAR CITA (HERMOSILLO 12H) ---
    // =========================================
    initCitaEvents() {
        const citaModal = document.getElementById('cita-modal');
        const btnClose = document.getElementById('btn-close-cita');
        const btnPrev = document.getElementById('cal-prev-month');
        const btnNext = document.getElementById('cal-next-month');
        const form = document.getElementById('cita-confirm-form');

        if (btnClose) btnClose.onclick = () => citaModal.style.display = 'none';
        window.addEventListener('click', (e) => {
            if (e.target === citaModal) citaModal.style.display = 'none';
        });

        if (btnPrev) {
            btnPrev.onclick = () => {
                this.calMonth--;
                if (this.calMonth < 0) { this.calMonth = 11; this.calYear--; }
                this.renderCalendar();
            };
        }
        if (btnNext) {
            btnNext.onclick = () => {
                this.calMonth++;
                if (this.calMonth > 11) { this.calMonth = 0; this.calYear++; }
                this.renderCalendar();
            };
        }

        const updateClock = () => {
            const el = document.getElementById('hermosillo-clock');
            if (!el) return;
            el.innerText = new Date().toLocaleTimeString('es-MX', {
                timeZone: 'America/Hermosillo',
                hour: 'numeric', minute: '2-digit', hour12: true
            });
        };
        updateClock();
        setInterval(updateClock, 30000);

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!this.selectedDate || !this.selectedTime) {
                    alert('Por favor selecciona una fecha y un horario disponible.');
                    return;
                }

                const clientName = document.getElementById('cita-client-name').value.trim();
                const clientPhone = document.getElementById('cita-client-phone').value.trim();
                const isCartOrder = this.citaMode === 'cart' && this.cart.length > 0;
                const appointmentType = (IS_SALES_CATALOG || isCartOrder) ? 'Cita de Venta' : 'Cita de Renta';

                let dressPayload = this.citaDressName || 'Consulta general';
                let cartSnapshot = [];
                let cartTotal = 0;

                if (isCartOrder) {
                    cartSnapshot = [...this.cart];
                    cartTotal = this.getCartTotal();
                    const summaryList = cartSnapshot
                        .map(it => `${it.name} (Talla: ${it.size}, Color: ${it.color}, $${Number(it.price).toFixed(2)})`)
                        .join(' | ');
                    dressPayload = `Pedido (${cartSnapshot.length}): ${summaryList} — Total: $${cartTotal.toFixed(2)} MXN`;
                }

                const btn = document.getElementById('btn-confirm-cita');
                btn.disabled = true;
                btn.innerText = 'Confirmando cita...';

                try {
                    const res = await fetch(SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'addAppointment',
                            date: this.selectedDate,
                            time: this.selectedTime,
                            client: clientName,
                            phone: clientPhone,
                            dress: dressPayload,
                            appointmentType: appointmentType
                        })
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error || 'No se pudo agendar la cita.');

                    const [y, m, d] = this.selectedDate.split('-').map(Number);
                    const prettyDate = new Date(y, m - 1, d).toLocaleDateString('es-MX', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    });

                    let waMsg = '';
                    let detailHtml = '';

                    if (isCartOrder) {
                        const itemsLines = cartSnapshot
                            .map(it => `- ${it.name} | Talla: ${it.size} | Color: ${it.color} | $${Number(it.price).toFixed(2)} MXN`)
                            .join('\n');
                        waMsg = `Hola, me interesa comprar los siguientes artículos:\n${itemsLines}\n\nTotal del pedido: $${cartTotal.toFixed(2)} MXN.\nAgendé cita para el día ${prettyDate} a la hora de ${this.selectedTime} a nombre de ${clientName}.`;
                        detailHtml = `<br>Pedido de <strong>${cartSnapshot.length} artículo(s)</strong> — Total: <strong>$${cartTotal.toFixed(2)} MXN</strong>`;

                        // Vaciar carrito al confirmar la cita del pedido
                        this.cart = [];
                        this.saveCart();
                        this.renderCart();
                    } else {
                        const motivoTexto = IS_SALES_CATALOG ? 'una cita de compra/venta' : 'una cita de renta';
                        waMsg = this.citaDressName
                            ? `Hola, acabo de agendar ${motivoTexto} en MJ Vestidos para el ${prettyDate} a las ${this.selectedTime}. Estoy interesada en ${this.citaDressName}. Mi nombre es ${clientName}.`
                            : `Hola, acabo de agendar ${motivoTexto} en MJ Vestidos para el ${prettyDate} a las ${this.selectedTime}. Me gustaría conocer sus vestidos disponibles. Mi nombre es ${clientName}.`;
                        detailHtml = this.citaDressName ? `<br>Vestido de interés: <strong>${this.citaDressName}</strong>` : '';
                    }

                    const waUrl = `https://wa.me/526623175465?text=${encodeURIComponent(waMsg)}`;

                    document.getElementById('cita-body').style.display = 'none';
                    const successBox = document.getElementById('cita-success-box');
                    successBox.style.display = 'block';
                    successBox.innerHTML = `
                        <h3>¡Cita Confirmada! ✅</h3>
                        <p>
                            Te esperamos el <strong>${prettyDate}</strong> a las <strong>${this.selectedTime}</strong> (hora de Hermosillo).
                            ${detailHtml}
                        </p>
                        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 26px;background:#25d366;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;margin-bottom:10px;">
                            📲 Enviar pedido y confirmar por WhatsApp
                        </a>
                    `;

                    this.loadBookedSlots();
                } catch (err) {
                    alert(err.message);
                } finally {
                    btn.disabled = false;
                    btn.innerText = 'Confirmar Cita';
                }
            });
        }
    }

    async loadBookedSlots() {
        this.bookedSlots = {};
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=CITAS&tqx=out:json&t=${Date.now()}`;
            const res = await fetch(url);
            const text = await res.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = (json.table && json.table.rows) ? json.table.rows : [];

            rows.forEach(row => {
                const dateVal = row && row.c ? parseSheetDateCell(row.c[1]) : '';
                const timeVal = row && row.c ? parseSheetTimeCell(row.c[2]) : '';
                const statusVal = row && row.c && row.c[6] && row.c[6].v ? String(row.c[6].v).toLowerCase() : '';
                if (dateVal && timeVal && dateVal.toUpperCase() !== 'FECHA' && statusVal !== 'cancelada') {
                    if (!this.bookedSlots[dateVal]) this.bookedSlots[dateVal] = new Set();
                    this.bookedSlots[dateVal].add(timeVal);
                }
            });
        } catch (err) {
            console.warn('No se pudieron cargar citas previas:', err);
        }
    }

    async openCitaModal(mode = 'single') {
        if (mode === true) mode = 'general';
        if (mode === false) mode = 'single';
        this.citaMode = mode;

        if (mode === 'cart' && this.cart.length > 0) {
            const total = this.getCartTotal();
            this.citaDressName = '';
            document.getElementById('cita-dress-subtitle').innerText =
                `Pedido de ${this.cart.length} artículo(s) — Total: $${total.toFixed(2)} MXN`;
        } else if (mode === 'general' || !this.selectedDress) {
            this.citaMode = 'general';
            this.citaDressName = '';
            document.getElementById('cita-dress-subtitle').innerText = 'Agenda tu cita en MJ Vestidos';
        } else {
            this.citaDressName = IS_SALES_CATALOG
                ? `${this.selectedDress.name} (En Venta)`
                : this.selectedDress.name;
            document.getElementById('cita-dress-subtitle').innerText = `Interés en: ${this.selectedDress.name}`;
        }

        document.getElementById('cita-confirm-form').reset();
        document.getElementById('cita-body').style.display = 'grid';
        document.getElementById('cita-success-box').style.display = 'none';

        this.selectedDate = getHermosilloTodayStr();
        this.selectedTime = '';
        const [ty, tm] = this.selectedDate.split('-').map(Number);
        this.calYear = ty;
        this.calMonth = tm - 1;

        document.getElementById('cita-modal').style.display = 'block';
        await this.loadBookedSlots();
        this.renderCalendar();
        this.renderTimeSlots();
    }

    renderCalendar() {
        const monthDate = new Date(this.calYear, this.calMonth, 1);
        document.getElementById('cal-month-label').innerText = monthDate.toLocaleDateString('es-MX', {
            month: 'long', year: 'numeric'
        });

        const grid = document.getElementById('cal-days-grid');
        grid.innerHTML = '';

        let startDay = monthDate.getDay() - 1;
        if (startDay < 0) startDay = 6;
        for (let i = 0; i < startDay; i++) {
            grid.appendChild(document.createElement('span'));
        }

        const daysInMonth = new Date(this.calYear, this.calMonth + 1, 0).getDate();
        const todayStr = getHermosilloTodayStr();

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.calYear}-${String(this.calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cal-day-btn' + (dateStr === this.selectedDate ? ' selected' : '');
            btn.innerText = day;

            if (dateStr < todayStr) {
                btn.disabled = true;
            } else {
                btn.onclick = () => {
                    this.selectedDate = dateStr;
                    this.selectedTime = '';
                    this.renderCalendar();
                    this.renderTimeSlots();
                };
            }
            grid.appendChild(btn);
        }
    }

    renderTimeSlots() {
        const [y, m, d] = this.selectedDate.split('-').map(Number);
        const prettyDate = new Date(y, m - 1, d).toLocaleDateString('es-MX', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
        document.getElementById('cita-selected-date-label').innerText = prettyDate;

        const container = document.getElementById('cita-slots-list');
        container.innerHTML = '';

        const occupied = this.bookedSlots[this.selectedDate] || new Set();

        TIME_SLOTS_12H.forEach(slot => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cita-slot-btn' + (slot === this.selectedTime ? ' selected' : '');
            btn.innerText = slot;

            if (occupied.has(slot)) {
                btn.disabled = true;
                btn.title = 'Horario ya reservado';
            } else {
                btn.onclick = () => {
                    this.selectedTime = slot;
                    this.renderTimeSlots();
                };
            }
            container.appendChild(btn);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appCatalog = new Catalog('dress-container');
});
