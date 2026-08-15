class Dress {
    constructor(id, name, color, price, deposit, imageUrl, description) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.price = price;
        this.deposit = deposit;
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

        document.getElementById('modal-dress-img').src = this.selectedDress.imageUrl;
        document.getElementById('modal-dress-name').innerText = this.selectedDress.name;
        document.getElementById('modal-dress-price').innerText = `$${this.selectedDress.price.toFixed(2)} MXN / noche`;

        document.getElementById('booking-form').reset();
        
        document.getElementById('summary-rent').innerText = '$0.00 MXN';
        document.getElementById('summary-deposit').innerText = '$0.00 MXN';
        document.getElementById('summary-total').innerText = '$0.00 MXN';
        document.getElementById('return-date-display').innerText = 'Selecciona primero las fechas de renta';
        document.getElementById('delivery-date-display').innerText = 'Selecciona la fecha de uso';

        // --- RESTAURAR EL FORMULARIO (Quitar botón de WhatsApp si se abrió antes) ---
        const submitBtn = document.querySelector('#booking-form button[type="submit"]');
        submitBtn.style.display = 'block';
        submitBtn.innerText = "Confirmar Solicitud";
        submitBtn.disabled = false;
        submitBtn.style.backgroundColor = "";

        const successDiv = document.getElementById('success-wa-div');
        if (successDiv) successDiv.remove();
        // ----------------------------------------------------------------------------

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
                    folderId: '1ttKQlN2py9UUBKcGhDsnjZULQDuDpU9S' // ID de la carpeta de INEs
                };

                const scriptUrl = 'https://script.google.com/macros/s/AKfycbxURQoAuyUbBNQvPFlLus-pPhXE3hkerrtibkiXy-PstzjD9dwxUnQxrz8A2fz6IS98/exec';

                const response = await fetch(scriptUrl, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || "No se pudo guardar la imagen en Drive.");
                }

                // (Este código va justo debajo de: const ineUrl = data.url; )

                const phone = document.getElementById('phone').value;
                const address = document.getElementById('address').value;
                const size = document.getElementById('size').value;
                const payment = document.getElementById('payment').value; // <-- CAPTURAMOS EL PAGO
                
                const useDateVal = startDateInput.value;
                const deliveryDateText = document.getElementById('delivery-date-display').innerText;
                const returnDateText = document.getElementById('return-date-display').innerText;
                const pickupTime = document.getElementById('pickup-time').value;
                const returnTime = document.getElementById('return-time').value;
                
                const total = document.getElementById('summary-total').innerText;

                // Crear URL de Contrato
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
                    pago: payment // <-- ENVIAMOS EL PAGO AL CONTRATO
                }).toString();
                const contratoLink = `${baseUrl}/contrato.html?${params}`;

                const msg = `*NUEVA SOLICITUD DE RENTA - MJ VESTIDOS*\n\n` +
                    `*Vestido:* ${this.selectedDress.name}\n` +
                    `*Cliente:* ${clientName}\n` +
                    `*Teléfono:* ${phone}\n` +
                    `*Dirección:* ${address}\n` +
                    `*Talla:* ${size}\n` +
                    `*Método de Pago:* ${payment}\n\n` + // <-- SE AGREGA AL WHATSAPP
                    `*--- LOGÍSTICA ---*\n` +
                    `*1. Fecha de Entrega:* ${deliveryDateText} (${pickupTime})\n` +
                    `*2. Fecha de Uso:* ${useDateVal}\n` +
                    `*3. Devolución Obligatoria:* ${returnDateText} (${returnTime})\n\n` +
                    `*TOTAL A PAGAR:* ${total} (Incluye depósito)\n\n` +
                    `*📎 LINK DE INE:* ${ineUrl}\n` +
                    `*📝 LINK DE CONTRATO:* ${contratoLink}`;

                const encodedMsg = encodeURIComponent(msg);
                const whatsappUrl = `https://wa.me/526623175465?text=${encodedMsg}`;

                // --- BOTÓN INFALIBLE DE WHATSAPP ---
                submitBtn.style.display = 'none'; // Ocultamos el botón original

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
                // --------------------------------------

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

// Inicialización Global
document.addEventListener('DOMContentLoaded', () => {
    window.appCatalog = new Catalog('dress-container');

    window.appCatalog.addDress(new Dress(1, 'Pasión Rubí', 'Vino / Tinto', 550, 300, 'img/vestido1.png', 'Elegante vestido con corpiño de encaje floral, finas transparencias y una falda fluida.'));
    window.appCatalog.addDress(new Dress(2, 'Brillo Dorado', 'Oro', 550, 300, 'img/vestido2.png', 'Deslumbrante diseño de lentejuelas ceñido al cuerpo con delicados tirantes.'));
    window.appCatalog.addDress(new Dress(3, 'Destello Celeste', 'Azul Celeste', 550, 300, 'img/vestido3.png', 'Audaz diseño con corsé estructurado, pedrería lineal y abertura en pierna.'));
    window.appCatalog.addDress(new Dress(4, 'Esmeralda Satín', 'Verde Esmeralda', 550, 300, 'img/vestido4.png', 'Sofisticado vestido de satén con escote en V profundo y falda con vuelo.'));
    window.appCatalog.addDress(new Dress(5, 'Noche Azul Real', 'Azul Marino', 550, 300, 'img/vestido5.png', 'Vestido vaporoso con mangas largas semitransparentes y broche en cintura.'));
    window.appCatalog.addDress(new Dress(6, 'Obsidiana Glamour', 'Negro', 550, 300, 'img/vestido6.png', 'Imponente vestido negro de lentejuelas con corsé y flecos brillantes.'));

    window.appCatalog.render();
});
