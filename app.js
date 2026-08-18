class Dress {
    constructor(id, name, color, size, price, deposit, images, description) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.size = size;
        this.price = price;
        this.deposit = deposit;
        this.images = images; 
        this.description = description;
    }

    generateCardHTML() {
        const portada = this.images[0] || 'img/proximamente.png';
        return `
            <div class="dress-card" onclick="window.appCatalog.openBookingModal('${this.id}')">
                <img src="${portada}" alt="${this.name}" class="dress-image">
                <div class="dress-info">
                    <h3>${this.name}</h3>
                    <p><strong>Color:</strong> ${this.color} | <strong>Tallas:</strong> ${this.size}</p>
                    <p style="font-size: 0.85rem; margin: 8px 0; color: #555;">${this.description}</p>
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
        this.initModalEvents();
        this.loadFromGoogleSheets(); 
    }

    async loadFromGoogleSheets() {
        this.container.innerHTML = '<p style="text-align:center; width:100%;">Cargando catálogo de MJ Vestidos...</p>';
        
        const sheetId = '18gsvPp2HSMR0DKIfYfZijnwc_PyNV7ULch-UDEVupV0';
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

        try {
            const response = await fetch(url);
            const text = await response.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;

            this.dresses = []; 

            rows.forEach((row, index) => {
                if (row && row.c && row.c[0] && row.c[0].v !== 'ID') { 
                    const id = row.c[0].v;
                    const name = row.c[1] ? row.c[1].v : 'Sin nombre';
                    const color = row.c[2] ? row.c[2].v : 'N/A';
                    const size = row.c[3] ? row.c[3].v : 'Única';
                    const price = row.c[4] ? parseFloat(row.c[4].v) : 0;
                    const deposit = row.c[5] ? parseFloat(row.c[5].v) : 0;
                    const description = row.c[6] ? row.c[6].v : '';
                    
                    const imagesStr = row.c[7] ? row.c[7].v : 'img/proximamente.png';
                    const images = imagesStr.split(',').map(img => img.trim());

                    this.dresses.push(new Dress(id, name, color, size, price, deposit, images, description));
                }
            });

            this.render();
        } catch (error) {
            console.error("Error cargando la base de datos:", error);
            this.container.innerHTML = '<p style="text-align:center; width:100%; color:red;">No se pudo cargar el catálogo. Verifica tu conexión.</p>';
        }
    }

    render() {
        this.container.innerHTML = ''; 
        this.dresses.forEach(dress => {
            this.container.innerHTML += dress.generateCardHTML();
        });
    }

    openBookingModal(dressId) {
        this.selectedDress = this.dresses.find(d => String(d.id) === String(dressId));
        if (!this.selectedDress) return;

        // -- 1. Ajuste Dinámico de la Imagen Principal --
        const mainImg = document.getElementById('modal-dress-img');
        mainImg.src = this.selectedDress.images[0] || 'img/proximamente.png';
        mainImg.style.width = '100%';
        mainImg.style.maxHeight = '60vh'; // Nunca pasará del 60% del alto de la pantalla
        mainImg.style.objectFit = 'contain'; // La foto no se estira, se contiene
        
        document.getElementById('modal-dress-name').innerText = this.selectedDress.name;
        document.getElementById('modal-dress-price').innerText = `$${this.selectedDress.price.toFixed(2)} MXN / noche`;

        // -- 2. Mini Galería --
        const thumbnailsContainer = document.getElementById('modal-thumbnails');
        thumbnailsContainer.innerHTML = ''; 

        if (this.selectedDress.images.length > 1) {
            this.selectedDress.images.forEach(imgUrl => {
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

        // -- 3. Botones Elegantes de Tallas --
        const sizeContainer = document.getElementById('dynamic-size-container');
        const hiddenSizeInput = document.getElementById('selected-size');
        sizeContainer.innerHTML = ''; 
        hiddenSizeInput.value = '';

        // Separar las tallas por comas y limpiarlas
        const sizesArray = this.selectedDress.size.split(',').map(s => s.trim()).filter(s => s !== '');

        if (sizesArray.length === 0) {
            sizesArray.push('Única'); // Si viene vacío, por defecto es Única
        }

        sizesArray.forEach((sz, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerText = sz;
            
            // Estilos elegantes
            btn.style.padding = '8px 18px';
            btn.style.border = '1px solid #111';
            btn.style.borderRadius = '20px';
            btn.style.background = 'transparent';
            btn.style.color = '#111';
            btn.style.cursor = 'pointer';
            btn.style.fontWeight = 'bold';
            btn.style.transition = 'all 0.3s ease';

            // Comportamiento al darle clic
            btn.onclick = () => {
                Array.from(sizeContainer.children).forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = '#111';
                });
                btn.style.background = '#111';
                btn.style.color = '#fff';
                hiddenSizeInput.value = sz;
            };

            // Pre-seleccionar automáticamente la primera talla
            if (index === 0) {
                btn.style.background = '#111';
                btn.style.color = '#fff';
                hiddenSizeInput.value = sz;
            }

            sizeContainer.appendChild(btn);
        });

        // -- 4. Restaurar el resto del formulario --
        document.getElementById('booking-form').reset();
        document.getElementById('summary-rent').innerText = '$0.00 MXN';
        document.getElementById('summary-deposit').innerText = '$0.00 MXN';
        document.getElementById('summary-total').innerText = '$0.00 MXN';
        document.getElementById('return-date-display').innerText = 'Selecciona primero las fechas de renta';
        document.getElementById('delivery-date-display').innerText = 'Selecciona la fecha de uso';

// -- 4. Restaurar el resto del formulario --
        // ... (código de los summary-rent) ...

        const submitBtn = document.querySelector('#booking-form button[type="submit"]');
        submitBtn.style.display = 'block';
        submitBtn.innerText = "Agendar cita"; // <-- Nuevo texto
        submitBtn.disabled = false;
        submitBtn.style.backgroundColor = "#111"; // <-- Mantiene el color negro elegante
        submitBtn.style.color = "#d4af37"; // <-- Letras doradas

        const successDiv = document.getElementById('success-wa-div');
        if (successDiv) successDiv.remove();

        document.getElementById('booking-modal').style.display = 'block';
    }

    initModalEvents() {
        const modal = document.getElementById('booking-modal');
        const closeBtn = document.querySelector('.close-btn');
        const startDateInput = document.getElementById('start-date');

        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

        const calculateRental = () => {
            const startVal = startDateInput.value;

            if (startVal) {
                const [year, month, day] = startVal.split('-');
                const useDate = new Date(year, month - 1, day);

                const deliveryDate = new Date(useDate);
                deliveryDate.setDate(useDate.getDate() - 1);

                const returnDate = new Date(useDate);
                returnDate.setDate(useDate.getDate() + 1);
                
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                
                document.getElementById('delivery-date-display').innerText = deliveryDate.toLocaleDateString('es-MX', options);
                document.getElementById('return-date-display').innerText = returnDate.toLocaleDateString('es-MX', options);

                const rentCost = this.selectedDress.price;
                const depositCost = this.selectedDress.deposit;
                const totalCost = rentCost + depositCost;

                document.getElementById('summary-rent').innerText = `$${rentCost.toFixed(2)} MXN`;
                document.getElementById('summary-deposit').innerText = `$${depositCost.toFixed(2)} MXN`;
                document.getElementById('summary-total').innerText = `$${totalCost.toFixed(2)} MXN`;
            }
        };

        startDateInput.addEventListener('change', calculateRental);

        document.getElementById('booking-form').onsubmit = async (e) => {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const fileInput = document.getElementById('ine-image');
            const file = fileInput.files[0];

            if (!file) {
                alert("Por favor, adjunta la foto de tu INE.");
                return;
            }

            // Validar que sí haya una talla seleccionada internamente
            const selectedSizeValue = document.getElementById('selected-size').value;
            if (!selectedSizeValue) {
                alert("Por favor, asegúrate de tener una talla seleccionada.");
                return;
            }

            submitBtn.innerText = "Generando informacion (Espera unos segundos)...";
            submitBtn.disabled = true;
            submitBtn.style.backgroundColor = "#666";

            try {
                const getBase64 = (file) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = error => reject(error);
                    });
                };

                const base64Data = await getBase64(file);
                const clientName = document.getElementById('full-name').value;
                const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
                const fileName = `INE_${safeName}_${Date.now()}.${file.name.split('.').pop()}`;

                const payload = {
                    base64: base64Data,
                    filename: fileName,
                    mimeType: file.type,
                    folderId: '1ttKQlN2py9UUBKcGhDsnjZULQDuDpU9S' 
                };

                const scriptUrl = 'https://script.google.com/macros/s/AKfycbwaKJxY7JErnXQUYi_OCTuKmGjyBoxlPe-RRcM_XmSkYrwRic2EK7nYSDN-W8VmmiSN/exec';

                const response = await fetch(scriptUrl, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || "No se pudo guardar la imagen en Drive.");
                }

                const ineUrl = data.url;

                const phone = document.getElementById('phone').value;
                const address = document.getElementById('address').value;
                const paymentElement = document.getElementById('payment');
                const payment = paymentElement ? paymentElement.value : 'No especificado';
                
                const useDateVal = startDateInput.value;
                const deliveryDateText = document.getElementById('delivery-date-display').innerText;
                const returnDateText = document.getElementById('return-date-display').innerText;
                const pickupTime = document.getElementById('pickup-time').value;
                const returnTime = document.getElementById('return-time').value;
                const total = document.getElementById('summary-total').innerText;

                const baseUrl = window.location.origin + window.location.pathname.replace(/index\.html$/, "").replace(/\/$/, "");
                const params = new URLSearchParams({
                    vestido: this.selectedDress.name,
                    cliente: clientName,
                    telefono: phone,
                    direccion: address,
                    uso: useDateVal,
                    entrega: `${deliveryDateText} (${pickupTime})`,
                    devolucion: `${returnDateText} (${returnTime})`,
                    total: total,
                    pago: payment
                }).toString();
                const contratoLink = `${baseUrl}/contrato.html?${params}`;

                // Se envía la talla SELECCIONADA al WhatsApp
                const msg = `*NUEVA SOLICITUD DE RENTA - MJ VESTIDOS*\n\n` +
                    `*Vestido:* ${this.selectedDress.name}\n` +
                    `*Cliente:* ${clientName}\n` +
                    `*Teléfono:* ${phone}\n` +
                    `*Dirección:* ${address}\n` +
                    `*Talla Elegida:* ${selectedSizeValue}\n` +
                    `*Método de Pago:* ${payment}\n\n` +
                    `*--- LOGÍSTICA ---*\n` +
                    `*1. Fecha de Entrega:* ${deliveryDateText} (${pickupTime})\n` +
                    `*2. Fecha de Uso:* ${useDateVal}\n` +
                    `*3. Devolución Obligatoria:* ${returnDateText} (${returnTime})\n\n` +
                    `*TOTAL A PAGAR:* ${total} (Incluye depósito)\n\n` +
                    `*📎 LINK DE INE:* ${ineUrl}\n` +
                    `*📝 LINK DE CONTRATO:* ${contratoLink}`;

                const encodedMsg = encodeURIComponent(msg);
                const whatsappUrl = `https://wa.me/526623175465?text=${encodedMsg}`;

                submitBtn.style.display = 'none'; 

                const formElement = document.getElementById('booking-form');
                let successDiv = document.createElement('div');
                successDiv.id = 'success-wa-div';
                successDiv.style.textAlign = 'center';
                successDiv.style.marginTop = '20px';
                successDiv.style.padding = '15px';
                successDiv.style.backgroundColor = '#f0fff4';
                successDiv.style.border = '1px solid #25d366';
                successDiv.style.borderRadius = '8px';
                
                successDiv.innerHTML = `
                    <h3 style="color: #25d366; margin-bottom: 10px; font-size: 1.2rem;">¡Informacion Guardada! ✅</h3>
                    <p style="margin-bottom: 15px; font-size: 0.9rem; color: #333;">Todo listo. Haz clic en el botón verde para enviar tu solicitud.</p>
                    <a href="${whatsappUrl}" target="_blank" style="background-color: #25d366; color: white; display: block; text-decoration: none; padding: 15px; border-radius: 5px; font-weight: bold; font-size: 1.1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        📲 Enviar a WhatsApp
                    </a>
                `;
                
                formElement.appendChild(successDiv);

            } catch (error) {
                alert("Hubo un error de conexión al subir la imagen. Intenta nuevamente.");
                console.error(error);
                submitBtn.innerText = "Confirmar Solicitud";
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = "";
            }
        };
    }
} 

document.addEventListener('DOMContentLoaded', () => {
    window.appCatalog = new Catalog('dress-container');
});
