class Dress {
    constructor(id, name, color, price, imageUrl, description) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.price = price;
        this.imageUrl = imageUrl;
        this.description = description;
    }

    generateCardHTML() {
        return `
            <div class="dress-card" onclick="window.appCatalog.openBookingModal(${this.id})">
                <img src="${this.imageUrl}" alt="${this.name}" class="dress-image">
                <div class="dress-info">
                    <h3>${this.name}</h3>
                    <p><strong>Color:</strong> ${this.color}</p>
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
    }

    addDress(dress) {
        this.dresses.push(dress);
    }

    render() {
        this.container.innerHTML = ''; 
        this.dresses.forEach(dress => {
            this.container.innerHTML += dress.generateCardHTML();
        });
    }

    openBookingModal(dressId) {
        this.selectedDress = this.dresses.find(d => d.id === dressId);
        if (!this.selectedDress) return;

        // Llenar datos de la cabecera del modal
        document.getElementById('modal-dress-img').src = this.selectedDress.imageUrl;
        document.getElementById('modal-dress-name').innerText = this.selectedDress.name;
        document.getElementById('modal-dress-price').innerText = `$${this.selectedDress.price.toFixed(2)} MXN / noche`;

        // Limpiar fechas y totales
        document.getElementById('booking-form').reset();
        document.getElementById('summary-days').innerText = '0';
        document.getElementById('summary-total').innerText = '$0.00 MXN';
        document.getElementById('return-date-display').innerText = 'Selecciona primero las fechas de renta';

        // Mostrar Modal
        document.getElementById('booking-modal').style.display = 'block';
    }

initModalEvents() {
        const modal = document.getElementById('booking-modal');
        const closeBtn = document.querySelector('.close-btn');
        const startDateInput = document.getElementById('start-date');

        // Cerrar modal
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

        // Calcular fechas de entrega, devolución y costo al cambiar la "Fecha de Uso"
        const calculateRental = () => {
            const startVal = startDateInput.value;

            if (startVal) {
                // Parseamos la fecha evitando problemas de zona horaria
                const [year, month, day] = startVal.split('-');
                const useDate = new Date(year, month - 1, day);

                // Calcular 1 día antes (Entrega)
                const deliveryDate = new Date(useDate);
                deliveryDate.setDate(useDate.getDate() - 1);

                // Calcular 1 día después (Devolución)
                const returnDate = new Date(useDate);
                returnDate.setDate(useDate.getDate() + 1);
                
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                
                // Mostrar en los recuadros bloqueados
                document.getElementById('delivery-date-display').innerText = deliveryDate.toLocaleDateString('es-MX', options);
                document.getElementById('return-date-display').innerText = returnDate.toLocaleDateString('es-MX', options);

                // Calcular total (Es renta por el evento)
                const totalCost = this.selectedDress.price;
                document.getElementById('summary-days').innerText = '1 Evento';
                document.getElementById('summary-total').innerText = `$${totalCost.toFixed(2)} MXN`;
            }
        };

        startDateInput.addEventListener('change', calculateRental);

        // Envío del formulario
// Envío del formulario conectando con Google Drive
        document.getElementById('booking-form').onsubmit = async (e) => {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const fileInput = document.getElementById('ine-image');
            const file = fileInput.files[0];

            if (!file) {
                alert("Por favor, adjunta la foto de tu INE.");
                return;
            }

            // Cambiar estado del botón para que el usuario espere
            submitBtn.innerText = "Guardando INE de forma segura...";
            submitBtn.disabled = true;
            submitBtn.style.backgroundColor = "#666";

            try {
                // Función interna para convertir la imagen a formato Base64
                const getBase64 = (file) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = error => reject(error);
                    });
                };

                // Procesar archivo y crear un nombre limpio basado en el cliente
                const base64Data = await getBase64(file);
                const clientName = document.getElementById('full-name').value;
                const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
                const fileName = `INE_${safeName}_${Date.now()}.${file.name.split('.').pop()}`;

                // Preparar paquete de datos
                const payload = {
                    base64: base64Data,
                    filename: fileName,
                    mimeType: file.type
                };

                // URL de tu Google Apps Script
                const scriptUrl = 'https://script.google.com/macros/s/AKfycbx6iX_qUnAipUhzQNhexvSRiXCP8kgpe8zWAYBtcwN5RkNHhZxsNnbTxGm2ocj2pl8/exec';

                // Enviar a tu Google Drive
                const response = await fetch(scriptUrl, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || "No se pudo guardar la imagen en Drive.");
                }

                // Obtener el link generado en tu Drive
                const ineUrl = data.url;

                // Recopilar el resto de los datos del formulario
                const phone = document.getElementById('phone').value;
                const address = document.getElementById('address').value;
                const size = document.getElementById('size').value;
                
                const useDateVal = startDateInput.value;
                const deliveryDateText = document.getElementById('delivery-date-display').innerText;
                const returnDateText = document.getElementById('return-date-display').innerText;
                const pickupTime = document.getElementById('pickup-time').value;
                const returnTime = document.getElementById('return-time').value;
                
                const total = document.getElementById('summary-total').innerText;

                // Construir mensaje para WhatsApp con el link de tu propio Drive
                const msg = `*NUEVA SOLICITUD DE RENTA - MJ VESTIDOS*%0A%0A` +
                    `*Vestido:* ${this.selectedDress.name}%0A` +
                    `*Cliente:* ${clientName}%0A` +
                    `*Teléfono:* ${phone}%0A` +
                    `*Dirección:* ${address}%0A` +
                    `*Talla:* ${size}%0A%0A` +
                    `*--- LOGÍSTICA ---*%0A` +
                    `*1. Fecha de Entrega:* ${deliveryDateText} (${pickupTime})%0A` +
                    `*2. Fecha de Uso:* ${useDateVal}%0A` +
                    `*3. Devolución Obligatoria:* ${returnDateText} (${returnTime})%0A%0A` +
                    `*TOTAL A PAGAR:* ${total} (Incluye depósito)%0A%0A` +
                    `*📎 LINK DE INE:* ${ineUrl}`;

                // Abrir WhatsApp con todos los datos listos
                window.open(`https://wa.me/526623175465?text=${msg}`, '_blank');

                // Restaurar modal y botón
                submitBtn.innerText = "Confirmar Solicitud por WhatsApp";
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = "";
                modal.style.display = 'none';

            } catch (error) {
                alert("Hubo un error de conexión al subir la imagen. Intenta nuevamente.");
                console.error(error);
                submitBtn.innerText = "Confirmar Solicitud por WhatsApp";
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = "";
            }
        };
}

// Inicialización Global
document.addEventListener('DOMContentLoaded', () => {
    window.appCatalog = new Catalog('dress-container');

    // Modifica los precios reales aquí (reemplaza los ceros cuando gustes)
    window.appCatalog.addDress(new Dress(1, 'Pasión Rubí', 'Vino / Tinto', 550, 'img/vestido1.png', 'Elegante vestido con corpiño de encaje floral, finas transparencias y una falda fluida.'));
    window.appCatalog.addDress(new Dress(2, 'Brillo Dorado', 'Oro', 550, 'img/vestido2.png', 'Deslumbrante diseño de lentejuelas ceñido al cuerpo con delicados tirantes.'));
    window.appCatalog.addDress(new Dress(3, 'Destello Celeste', 'Azul Celeste', 550, 'img/vestido3.png', 'Audaz diseño con corsé estructurado, pedrería lineal y abertura en pierna.'));
    window.appCatalog.addDress(new Dress(4, 'Esmeralda Satín', 'Verde Esmeralda', 550, 'img/vestido4.png', 'Sofisticado vestido de satén con escote en V profundo y falda con vuelo.'));
    window.appCatalog.addDress(new Dress(5, 'Noche Azul Real', 'Azul Marino', 550, 'img/vestido5.png', 'Vestido vaporoso con mangas largas semitransparentes y broche en cintura.'));
    window.appCatalog.addDress(new Dress(6, 'Obsidiana Glamour', 'Negro', 550, 'img/vestido6.png', 'Imponente vestido negro de lentejuelas con corsé y flecos brillantes.'));

    window.appCatalog.render();
});
