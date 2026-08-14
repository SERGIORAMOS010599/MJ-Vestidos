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
        document.getElementById('booking-form').onsubmit = (e) => {
            e.preventDefault();
            
            const name = document.getElementById('full-name').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            const size = document.getElementById('size').value;
            
            // Fechas y Horarios
            const useDateVal = startDateInput.value;
            const deliveryDateText = document.getElementById('delivery-date-display').innerText;
            const returnDateText = document.getElementById('return-date-display').innerText;
            const pickupTime = document.getElementById('pickup-time').value;
            const returnTime = document.getElementById('return-time').value;
            const total = document.getElementById('summary-total').innerText;

            // Construir mensaje estructurado para WhatsApp
            const msg = `*NUEVA SOLICITUD DE RENTA - MJ VESTIDOS*%0A%0A` +
                `*Vestido:* ${this.selectedDress.name}%0A` +
                `*Cliente:* ${name}%0A` +
                `*Teléfono:* ${phone}%0A` +
                `*Dirección:* ${address}%0A` +
                `*Talla:* ${size}%0A%0A` +
                `*--- LOGÍSTICA ---*%0A` +
                `*1. Fecha de Entrega:* ${deliveryDateText}%0A` +
                `   *Horario:* ${pickupTime}%0A` +
                `*2. Fecha de Uso:* ${useDateVal}%0A` +
                `*3. Fecha de Devolución:* ${returnDateText}%0A` +
                `   *Horario:* ${returnTime}%0A%0A` +
                `*TOTAL A PAGAR:* ${total}`;

            // Abrir WhatsApp
            window.open(`https://wa.me/526623175465?text=${msg}`, '_blank');
        };
    }
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
