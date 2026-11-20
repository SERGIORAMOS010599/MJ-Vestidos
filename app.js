class Dress {
    constructor(id, type, name, size, price, deposit, color, images, status, comments) {
        this.id = String(id);
        this.type = String(type || 'Vestido');
        this.name = String(name || 'Sin nombre');
        this.size = String(size || 'Única');
        this.price = Number(price) || 0;
        this.deposit = Number(deposit) || 0;
        this.color = String(color || 'N/A');
        this.images = images;
        this.status = String(status || 'Disponible');
        this.comments = String(comments || '');
    }

    generateCardHTML() {
        const portada = this.images[0] || 'img/proximamente.png';
        return `
            <div class="dress-card" onclick="window.appCatalog.openBookingModal('${this.id}')">
                <img src="${portada}" alt="${this.name}" class="dress-image" loading="lazy">
                <div class="dress-info">
                    <h3>${this.name}</h3>
                    <p><strong>Color:</strong> ${this.color} | <strong>Tallas:</strong> ${this.size}</p>
                    <p style="font-size: 0.85rem; margin: 8px 0; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${this.type}</p>
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
        this.itemsPerPage = 50; // Conservamos 50 por página
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

            this.dresses = [];

            rows.forEach((row) => {
                const firstCell = row && row.c && row.c[0] && row.c[0].v ? String(row.c[0].v).trim() : '';
                // Ignorar fila de encabezados o filas vacías
                if (firstCell && firstCell.toUpperCase() !== 'ID' && firstCell.toUpperCase() !== 'ID ARTICULO') {
                    const id       = firstCell;
                    const type     = row.c[1] && row.c[1].v ? row.c[1].v : 'Vestido';
                    const name     = row.c[2] && row.c[2].v ? row.c[2].v : 'Sin nombre';
                    const size     = row.c[3] && row.c[3].v ? row.c[3].v : 'Única';
                    const price    = row.c[4] && row.c[4].v ? parseFloat(row.c[4].v) : 0;
                    const deposit  = row.c[5] && row.c[5].v ? parseFloat(row.c[5].v) : 0;
                    const color    = row.c[6] && row.c[6].v ? row.c[6].v : 'N/A';
                    const imgStr   = row.c[7] && row.c[7].v ? String(row.c[7].v) : 'img/proximamente.png';
                    const status   = row.c[8] && row.c[8].v ? row.c[8].v : 'Disponible';
                    const comments = row.c[9] && row.c[9].v ? row.c[9].v : '';

                    const images = imgStr.split(',').map(img => img.trim()).filter(Boolean);

                    this.dresses.push(new Dress(id, type, name, size, price, deposit, color, images, status, comments));
                }
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

        // Estado visual
        const statusEl = document.getElementById('modal-status-badge');
        const isRentado = d.status.toLowerCase().includes('rentado');
        statusEl.innerText = isRentado ? 'Actualmente Rentado' : 'Disponible';
        statusEl.style.backgroundColor = isRentado ? '#fdecea' : '#e8f7ee';
        statusEl.style.color = isRentado ? '#b71c1c' : '#1b7a43';
        statusEl.style.border = isRentado ? '1px solid #f5c6cb' : '1px solid #b7e4c7';

        // Tallas como etiquetas limpias
        const sizesContainer = document.getElementById('modal-dress-sizes');
        sizesContainer.innerHTML = '';
        const sizesArray = d.size.split(',').map(s => s.trim()).filter(Boolean);
        (sizesArray.length ? sizesArray : ['Única']).forEach(sz => {
            const chip = document.createElement('span');
            chip.innerText = sz;
            chip.style.padding = '5px 14px';
            chip.style.border = '1px solid #111';
            chip.style.borderRadius = '20px';
            chip.style.fontSize = '0.85rem';
            chip.style.fontWeight = '600';
            chip.style.background = '#111';
            chip.style.color = '#d4af37';
            sizesContainer.appendChild(chip);
        });

        // Comentarios / Extras
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
