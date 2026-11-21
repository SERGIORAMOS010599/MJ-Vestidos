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

class Dress {
    constructor(id, type, name, sizes, price, deposit, color, images, status, comments) {
        this.id = String(id);
        this.type = String(type || 'Vestido');
        this.name = String(name || 'Sin nombre');
        this.sizes = Array.isArray(sizes) ? sizes : [String(sizes || 'Única')];
        this.price = Number(price) || 0;
        this.deposit = Number(deposit) || 0;
        this.color = String(color || 'N/A');
        this.images = images;
        this.status = String(status || 'Disponible');
        this.comments = String(comments || '');
    }

    generateCardHTML() {
        const portada = this.images[0] || 'img/proximamente.png';
        const spheresHtml = this.sizes
            .map(sz => `<span class="size-sphere">${sz}</span>`)
            .join('');

        return `
            <div class="dress-card" onclick="window.appCatalog.openBookingModal('${this.id}')">
                <img src="${portada}" alt="${this.name}" class="dress-image" loading="lazy">
                <div class="dress-info">
                    <h3>${this.name}</h3>
                    <p><strong>Color:</strong> ${this.color}</p>
                    <div class="size-spheres-container">${spheresHtml}</div>
                    <p style="font-size: 0.8rem; margin: 6px 0; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${this.type}</p>
                    <p class="dress-price">$${this.price.toFixed(2)} MXN / noche</p>
                </div>
            </div>
        `;
    }
}

class Catalog {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.dresses = [];
        this.selectedDress = null;
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.initModalEvents();
        this.loadFromGoogleSheets();
    }

    async loadFromGoogleSheets() {
        this.container.innerHTML = '<p style="text-align:center; width:100%;">Cargando catálogo de MJ Vestidos...</p>';

        const sheetId = '18gsvPp2HSMR0DKIfYfZijnwc_PyNV7ULch-UDEVupV0';
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&t=${Date.now()}`;

        try {
            const response = await fetch(url);
            const text = await response.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;

            // Agrupar filas del mismo vestido usando el ID base (antes del guion, ej. "V1-XS" -> "V1")
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
                    const status   = row.c[8] && row.c[8].v ? String(row.c[8].v).trim() : 'Disponible';
                    const comments = row.c[9] && row.c[9].v ? String(row.c[9].v).trim() : '';

                    const images = imgStr ? imgStr.split(',').map(img => img.trim()).filter(Boolean) : [];
                    const isAvail = !status.toLowerCase().includes('rentado');

                    if (!groupedMap.has(baseId)) {
                        groupedMap.set(baseId, {
                            id: baseId,
                            type,
                            name,
                            sizesSet: new Set([size]),
                            price,
                            deposit,
                            color,
                            images: images.length ? images : ['img/proximamente.png'],
                            hasAvailable: isAvail,
                            comments
                        });
                    } else {
                        const existing = groupedMap.get(baseId);
                        existing.sizesSet.add(size);
                        if (isAvail) existing.hasAvailable = true;
                        if (existing.images[0] === 'img/proximamente.png' && images.length) {
                            existing.images = images;
                        }
                        if (!existing.comments && comments) {
                            existing.comments = comments;
                        }
                    }
                }
            });

            this.dresses = Array.from(groupedMap.values()).map(item => {
                const sortedSizes = Array.from(item.sizesSet).sort((a, b) => {
                    const diff = getSizeRank(a) - getSizeRank(b);
                    return diff !== 0 ? diff : a.localeCompare(b, 'es');
                });
                const finalStatus = item.hasAvailable ? 'Disponible' : 'Rentado';
                return new Dress(
                    item.id, item.type, item.name, sortedSizes,
                    item.price, item.deposit, item.color,
                    item.images, finalStatus, item.comments
                );
            });

            this.currentPage = 1;
            this.render();
        } catch (error) {
            console.error("Error cargando la base de datos:", error);
            this.container.innerHTML = '<p style="text-align:center; width:100%; color:red;">No se pudo cargar el catálogo. Verifica tu conexión.</p>';
        }
    }

    render() {
        this.container.innerHTML = '';

        const totalPages = Math.max(1, Math.ceil(this.dresses.length / this.itemsPerPage));
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageDresses = this.dresses.slice(startIndex, endIndex);

        pageDresses.forEach(dress => {
            this.container.innerHTML += dress.generateCardHTML();
        });

        this.renderPagination(totalPages);
    }

    renderPagination(totalPages) {
        const paginationContainer = document.getElementById('pagination-controls');
        if (!paginationContainer) return;

        if (this.dresses.length === 0) {
            paginationContainer.innerHTML = '';
            return;
        }

        const disableBack5 = this.currentPage <= 5;
        const disablePrev  = this.currentPage <= 1;
        const disableNext  = this.currentPage >= totalPages;
        const disableNext5 = (this.currentPage + 5) > totalPages;

        paginationContainer.innerHTML = `
            <button class="page-btn" title="Retroceder 5 páginas"
                ${disableBack5 ? 'disabled' : ''}
                onclick="window.appCatalog.changePage(${this.currentPage - 5})">
                &laquo; 5
            </button>
            <button class="page-btn" title="Página anterior"
                ${disablePrev ? 'disabled' : ''}
                onclick="window.appCatalog.changePage(${this.currentPage - 1})">
                &lsaquo;
            </button>

            <span class="page-info">Página ${this.currentPage} de ${totalPages}</span>

            <button class="page-btn" title="Página siguiente"
                ${disableNext ? 'disabled' : ''}
                onclick="window.appCatalog.changePage(${this.currentPage + 1})">
                &rsaquo;
            </button>
            <button class="page-btn" title="Avanzar 5 páginas"
                ${disableNext5 ? 'disabled' : ''}
                onclick="window.appCatalog.changePage(${this.currentPage + 5})">
                5 &raquo;
            </button>
        `;
    }

    changePage(newPage) {
        const totalPages = Math.max(1, Math.ceil(this.dresses.length / this.itemsPerPage));
        if (newPage < 1 || newPage > totalPages) return;

        this.currentPage = newPage;
        this.render();

        const catalogSection = document.getElementById('catalogo');
        if (catalogSection) {
            catalogSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    openBookingModal(dressId) {
        this.selectedDress = this.dresses.find(d => String(d.id) === String(dressId));
        if (!this.selectedDress) return;

        const d = this.selectedDress;

        // 1. Foto principal y miniaturas
        const mainImg = document.getElementById('modal-dress-img');
        mainImg.src = d.images[0] || 'img/proximamente.png';

        const thumbnailsContainer = document.getElementById('modal-thumbnails');
        thumbnailsContainer.innerHTML = '';

        if (d.images.length > 1) {
            d.images.forEach(imgUrl => {
                const thumb = document.createElement('img');
                thumb.src = imgUrl;
                thumb.style.width = '60px';
                thumb.style.height = '80px';
                thumb.style.objectFit = 'cover';
                thumb.style.borderRadius = '4px';
                thumb.style.cursor = 'pointer';
                thumb.style.border = '2px solid transparent';

                thumb.onclick = () => {
                    mainImg.src = imgUrl;
                    Array.from(thumbnailsContainer.children).forEach(c => c.style.border = '2px solid transparent');
                    thumb.style.border = '2px solid #d4af37';
                };

                thumbnailsContainer.appendChild(thumb);
            });
            thumbnailsContainer.firstChild.style.border = '2px solid #d4af37';
        }

        // 2. Información del vestido
        document.getElementById('modal-dress-type').innerText = d.type;
        document.getElementById('modal-dress-name').innerText = d.name;
        document.getElementById('modal-dress-price').innerText = `$${d.price.toFixed(2)} MXN / noche`;
        document.getElementById('modal-dress-deposit').innerText = `Depósito reembolsable: $${d.deposit.toFixed(2)} MXN`;
        document.getElementById('modal-dress-color').innerText = d.color;

        const statusEl = document.getElementById('modal-status-badge');
        const isRentado = d.status.toLowerCase().includes('rentado');
        statusEl.innerText = isRentado ? 'Actualmente Rentado' : 'Disponible';
        statusEl.style.backgroundColor = isRentado ? '#fdecea' : '#e8f7ee';
        statusEl.style.color = isRentado ? '#b71c1c' : '#1b7a43';
        statusEl.style.border = isRentado ? '1px solid #f5c6cb' : '1px solid #b7e4c7';

        // Esferitas de tallas también dentro del modal
        const sizesContainer = document.getElementById('modal-dress-sizes');
        sizesContainer.innerHTML = d.sizes
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

        // 3. Botón de WhatsApp directo
        const waMessage = `Hola, me gustaría agendar una cita para elegir alguno de los vestidos, estoy interesada en el vestido ${d.name}`;
        const waUrl = `https://wa.me/526623175465?text=${encodeURIComponent(waMessage)}`;
        document.getElementById('btn-whatsapp-cita').href = waUrl;

        document.getElementById('booking-modal').style.display = 'block';
    }

    initModalEvents() {
        const modal = document.getElementById('booking-modal');
        const closeBtn = document.querySelector('.close-btn');

        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appCatalog = new Catalog('dress-container');
});
