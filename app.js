const SHEET_ID = '18gsvPp2HSMR0DKIfYfZijnwc_PyNV7ULch-UDEVupV0';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwaKJxY7JErnXQUYi_OCTuKmGjyBoxlPe-RRcM_XmSkYrwRic2EK7nYSDN-W8VmmiSN/exec';
const IS_SALES_CATALOG = window.CATALOG_MODE === 'VENTAS';

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
        this.filteredDresses = [];
        this.allDresses = [];
        this.filteredDresses = [];
        this.topRentedDresses = [];
        this.hasActiveFiltersFlag = false;
        this.selectedDress = null;
        this.citaDressName = '';
        this.currentPage = 1;
        this.itemsPerPage = 50;

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

            this.buildFilterOptions();
            this.renderTopRented();
            this.applyFilters(false);
            this.initHeroRunway();
        } catch (error) {
            console.error("Error cargando la base de datos:", error);
            this.container.innerHTML = '<p style="text-align:center; width:100%; color:red;">No se pudo cargar el catálogo. Verifica tu conexión.</p>';
        }
    }

    // =========================================
    // --- SECCIÓN: LOS MÁS RENTADOS (TOP 20) ---
    // =========================================
    renderTopRented() {
        const section = document.getElementById('mas-rentados');
        const track = document.getElementById('top-rented-container');
        if (!section || !track || IS_SALES_CATALOG) return;

        const top20 = [...this.allDresses]
            .filter(d => d.totalRentals > 0)
            .sort((a, b) => b.totalRentals - a.totalRentals)
            .slice(0, 20);

        if (top20.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        track.innerHTML = top20
            .map((dress, idx) => dress.generateCardHTML(idx + 1))
            .join('');
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
            overlay.classList.add('open');
            drawer.classList.add('open');
        };
        const closeDrawer = () => {
            overlay.classList.remove('open');
            drawer.classList.remove('open');
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
                minRange.value = this.filterState.absMinPrice;
                maxRange.value = this.filterState.absMaxPrice;
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

        const colorsEl = document.getElementById('filter-colors-list');
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

        if (!isFinite(minP)) minP = 0;
        if (maxP <= minP) maxP = minP + 500;
        this.filterState.absMinPrice = minP;
        this.filterState.absMaxPrice = maxP;
        this.filterState.minPrice = minP;
        this.filterState.maxPrice = maxP;

        const minRange = document.getElementById('price-min-range');
        const maxRange = document.getElementById('price-max-range');
        minRange.min = minP; minRange.max = maxP; minRange.value = minP;
        maxRange.min = minP; maxRange.max = maxP; maxRange.value = maxP;
        this.updatePriceSliderUI();
    }

    updatePriceSliderUI() {
        const { minPrice, maxPrice, absMinPrice, absMaxPrice } = this.filterState;
        document.getElementById('filter-price-label').innerText =
            `$${minPrice.toLocaleString('es-MX')} — $${maxPrice.toLocaleString('es-MX')}`;

        const fill = document.getElementById('price-range-fill');
        const span = Math.max(1, absMaxPrice - absMinPrice);
        const leftPct = ((minPrice - absMinPrice) / span) * 100;
        const rightPct = ((maxPrice - absMinPrice) / span) * 100;
        fill.style.left = `${leftPct}%`;
        fill.style.width = `${Math.max(0, rightPct - leftPct)}%`;
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
        const dot = document.getElementById('filter-active-dot');
        if (dot) dot.style.display = hasActive ? 'block' : 'none';

        if (resetPage) this.currentPage = 1;
        this.render();
    }

    // =========================================
    // --- RENDER Y PAGINACIÓN ---
    // =========================================
    render() {
        this.container.innerHTML = '';

        if (this.filteredDresses.length === 0) {
            const emptyMsg = IS_SALES_CATALOG && this.allDresses.length === 0
                ? 'Próximamente agregaremos vestidos en venta.'
                : 'No se encontraron vestidos con los filtros seleccionados.';
            this.container.innerHTML = `<p style="text-align:center; width:100%; padding:30px 0; color:#666;">${emptyMsg}</p>`;
            this.renderPagination(1);
            return;
        }

        const totalPages = Math.max(1, Math.ceil(this.filteredDresses.length / this.itemsPerPage));
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const pageDresses = this.filteredDresses.slice(startIndex, startIndex + this.itemsPerPage);

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
        const totalPages = Math.max(1, Math.ceil(this.filteredDresses.length / this.itemsPerPage));
        if (newPage < 1 || newPage > totalPages) return;
        this.currentPage = newPage;
        this.render();
        const catalogSection = document.getElementById('catalogo');
        if (catalogSection) catalogSection.scrollIntoView({ behavior: 'smooth' });
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

        document.getElementById('modal-dress-sizes').innerHTML = d.sizes
            .map(sz => `<span class="size-sphere">${sz}</span>`)
            .join('');

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
                this.openCitaModal(false);
            });
        }

        // Botón "Agenda tu Cita" en la barra de navegación (sin vestido específico)
        const navCitaBtn = document.getElementById('nav-agenda-cita');
        if (navCitaBtn) {
            navCitaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCitaModal(true);
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
                const dressName = this.citaDressName;

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
                            dress: dressName || 'Consulta general'
                        })
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error || 'No se pudo agendar la cita.');

                    const [y, m, d] = this.selectedDate.split('-').map(Number);
                    const prettyDate = new Date(y, m - 1, d).toLocaleDateString('es-MX', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    });

                    // Si viene del menú superior no menciona ningún vestido
                    const waMsg = dressName
                        ? `Hola, acabo de agendar una cita en MJ Vestidos para el ${prettyDate} a las ${this.selectedTime}. Estoy interesada en el vestido ${dressName}. Mi nombre es ${clientName}.`
                        : `Hola, acabo de agendar una cita en MJ Vestidos para el ${prettyDate} a las ${this.selectedTime}. Me gustaría conocer sus vestidos disponibles. Mi nombre es ${clientName}.`;
                    const waUrl = `https://wa.me/526623175465?text=${encodeURIComponent(waMsg)}`;

                    document.getElementById('cita-body').style.display = 'none';
                    const successBox = document.getElementById('cita-success-box');
                    successBox.style.display = 'block';
                    successBox.innerHTML = `
                        <h3>¡Cita Confirmada! ✅</h3>
                        <p>
                            Te esperamos el <strong>${prettyDate}</strong> a las <strong>${this.selectedTime}</strong> (hora de Hermosillo).
                            ${dressName ? `<br>Vestido de interés: <strong>${dressName}</strong>` : ''}
                        </p>
                        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 26px;background:#25d366;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;margin-bottom:10px;">
                            📲 Confirmar también por WhatsApp
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
                const dateVal = row && row.c && row.c[1] && row.c[1].v ? String(row.c[1].v).trim() : '';
                const timeVal = row && row.c && row.c[2] && row.c[2].v ? String(row.c[2].v).trim() : '';
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

    async openCitaModal(isGeneral = false) {
        if (isGeneral || !this.selectedDress) {
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
