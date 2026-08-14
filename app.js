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
        const endDateInput = document.getElementById('end-date');

        // Cerrar modal
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

        // Calcular fechas y costo al cambiar seleccionadores
        const calculateRental = () => {
            const startVal = startDateInput.value;
            const endVal = endDateInput.value;

            if (startVal && endVal) {
                const start = new Date(startVal);
                const end = new Date(endVal);

                // Validar que la fecha final sea posterior a la inicial
                const diffTime = end - start;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Incluye el día de inicio

                if (diffDays <= 0) {
                    alert('La fecha del último día debe ser igual o posterior a la fecha de inicio.');
                    endDateInput.value = '';
                    return;
                }

                // Límite de 3 días máximo de uso
                if (diffDays > 3) {
                    alert('El periodo máximo de renta es de 3 días.');
                    endDateInput.value = '';
                    return;
                }

                // Calcular fecha de devolución obligatoria (1 día después del último día de uso)
                const returnDate = new Date(end);
                returnDate.setDate(returnDate.getDate() + 1);
                
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                document.getElementById('return-date-display').innerText = returnDate.toLocaleDateString('es-MX', options);

                // Calcular total
                const totalCost = diffDays * this.selectedDress.price;
                document.getElementById('summary-days').innerText = diffDays;
                document.getElementById('summary-total').innerText = `$${totalCost.toFixed(2)} MXN`;
            }
        };

        startDateInput.addEventListener('change', calculateRental);
        endDateInput.addEventListener('change', calculateRental);

        // Envío del formulario
        document.getElementById('booking-form').onsubmit = (e) => {
            e.preventDefault();
            
            const name = document.getElementById('full-name').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            const size = document.getElementById('size').value;
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
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
                `*Periodo de uso:* Del ${startDate} al ${endDate}%0A` +
                `*Horario de recolección:* ${pickupTime}%0A` +
                `*Devolución obligatoria:* ${returnDateText}%0A` +
                `*Horario de devolución:* ${returnTime}%0A%0A` +
                `*TOTAL CALCULADO:* ${total}`;

            // Abrir WhatsApp con la información lista para enviar a María José
            window.open(`https://wa.me/526623175465?text=${msg}`, '_blank');
        };
    }
}

// Inicialización Global
document.addEventListener('DOMContentLoaded', () => {
    window.appCatalog = new Catalog('dress-container');

    // Modifica los precios reales aquí (reemplaza los ceros cuando gustes)
    window.appCatalog.addDress(new Dress(1, 'Pasión Rubí', 'Vino / Tinto', 0, 'img/vestido1.png', 'Elegante vestido con corpiño de encaje floral, finas transparencias y una falda fluida.'));
    window.appCatalog.addDress(new Dress(2, 'Brillo Dorado', 'Oro', 0, 'img/vestido2.png', 'Deslumbrante diseño de lentejuelas ceñido al cuerpo con delicados tirantes.'));
    window.appCatalog.addDress(new Dress(3, 'Destello Celeste', 'Azul Celeste', 0, 'img/vestido3.png', 'Audaz diseño con corsé estructurado, pedrería lineal y abertura en pierna.'));
    window.appCatalog.addDress(new Dress(4, 'Esmeralda Satín', 'Verde Esmeralda', 0, 'img/vestido4.png', 'Sofisticado vestido de satén con escote en V profundo y falda con vuelo.'));
    window.appCatalog.addDress(new Dress(5, 'Noche Azul Real', 'Azul Marino', 0, 'img/vestido5.png', 'Vestido vaporoso con mangas largas semitransparentes y broche en cintura.'));
    window.appCatalog.addDress(new Dress(6, 'Obsidiana Glamour', 'Negro', 0, 'img/vestido6.png', 'Imponente vestido negro de lentejuelas con corsé y flecos brillantes.'));

    window.appCatalog.render();
});
