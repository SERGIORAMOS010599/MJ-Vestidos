class Dress {
    // Aquí está el parámetro 'deposit' incluido
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
        
        // Inicializar los montos incluyendo el depósito
        document.getElementById('summary-rent').innerText = '$0.00 MXN';
        document.getElementById('summary-deposit').innerText = '$0.00 MXN';
        document.getElementById('summary-total').innerText = '$0.00 MXN';
        document.getElementById('return-date-display').innerText = 'Selecciona primero las fechas de renta';
        document.getElementById('delivery-date-display').innerText = 'Selecciona la fecha de uso';

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

                // Calcular totales sumando el depósito
                const rentCost = this.selectedDress.price;
                const depositCost = this.selectedDress.deposit;
                const totalCost = rentCost + depositCost;

                document.getElementById('summary-rent').innerText = `$${rentCost.toFixed(2)} MXN`;
                document.getElementById('summary-deposit').innerText = `$${depositCost.toFixed(2)} MXN`;
                document.getElementById('summary-total').innerText = `$${totalCost.toFixed(2)} MXN`;
            }
        };

        startDateInput.addEventListener('change', calculateRental);

        // Envío del formulario conectando con Google Drive
// Envío del formulario conectando con Google Drive y WhatsApp
        document.getElementById('booking-form').onsubmit = async (e) => {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const fileInput = document.getElementById('ine-image');
            const file = fileInput.files[0];

            if (!file) {
                alert("Por favor, adjunta la foto de tu INE.");
                return;
            }

            // 1. TRUCO ANTI-BLOQUEADOR: Abre la pestaña inmediatamente para que el navegador no la bloquee
            const ventanaEspera = window.open('', '_blank');
            ventanaEspera.document.write('<h2 style="font-family:sans-serif; text-align:center; margin-top:20%; color:#333;">Procesando solicitud...<br>Redirigiendo a WhatsApp en unos segundos. 👗✨</h2>');

            submitBtn.innerText = "Guardando INE de forma segura...";
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

                const scriptUrl = 'https://script.google.com/macros/s/AKfycbx6iX_qUnAipUhzQNhexvSRiXCP8kgpe8zWAYBtcwN5RkNHhZxsNnbTxGm2ocj2pl8/exec';

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
                const size = document.getElementById('size').value;
                
                const useDateVal = startDateInput.value;
                const deliveryDateText = document.getElementById('delivery-date-display').innerText;
                const returnDateText = document.getElementById('return-date-display').innerText;
                const pickupTime = document.getElementById('pickup-time').value;
                const returnTime = document.getElementById('return-time').value;
                
                const total = document.getElementById('summary-total').innerText;

                // Crear URL de Contrato
                const baseUrl = window.location.href.split('index.html')[0].replace(/\/$/, "");
                const params = new URLSearchParams({
                    vestido: this.selectedDress.name,
                    cliente: clientName,
                    telefono: phone,
                    direccion: address,
                    uso: useDateVal,
                    entrega: `${deliveryDateText} (${pickupTime})`,
                    devolucion: `${returnDateText} (${returnTime})`,
                    total: total
                }).toString();
                const contratoLink = `${baseUrl}/contrato.html?${params}`;

                const msg = `*NUEVA SOLICITUD DE RENTA - MJ VESTIDOS*\n\n` +
                    `*Vestido:* ${this.selectedDress.name}\n` +
                    `*Cliente:* ${clientName}\n` +
                    `*Teléfono:* ${phone}\n` +
                    `*Dirección:* ${address}\n` +
                    `*Talla:* ${size}\n\n` +
                    `*--- LOGÍSTICA ---*\n` +
                    `*1. Fecha de Entrega:* ${deliveryDateText} (${pickupTime})\n` +
                    `*2. Fecha de Uso:* ${useDateVal}\n` +
                    `*3. Devolución Obligatoria:* ${returnDateText} (${returnTime})\n\n` +
                    `*TOTAL A PAGAR:* ${total} (Incluye depósito)\n\n` +
                    `*📎 LINK DE INE:* ${ineUrl}\n` +
                    `*📝 LINK DE CONTRATO:* ${contratoLink}`;

                const encodedMsg = encodeURIComponent(msg);
                
                // Usamos la API oficial (api.whatsapp.com) en lugar de wa.me para que sea 100% estable
                const whatsappUrl = `https://api.whatsapp.com/send?phone=526623175465&text=${encodedMsg}`;

                // 2. TRUCO ANTI-BLOQUEADOR: Apuntamos la pestaña que estaba esperando hacia WhatsApp
                ventanaEspera.location.href = whatsappUrl;

                submitBtn.innerText = "Confirmar Solicitud por WhatsApp";
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = "";
                modal.style.display = 'none';

            } catch (error) {
                // Si ocurre un error, cerramos la pestaña de espera
                ventanaEspera.close();
                alert("Hubo un error de conexión al subir la imagen. Intenta nuevamente.");
                console.error(error);
                submitBtn.innerText = "Confirmar Solicitud por WhatsApp";
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = "";
            }
        };
    }
} // ¡Esta es la llave que faltaba para cerrar la clase Catalog!

// Inicialización Global
document.addEventListener('DOMContentLoaded', () => {
    window.appCatalog = new Catalog('dress-container');

    // Aquí están configurados con: Precio 550, Depósito 300
    window.appCatalog.addDress(new Dress(1, 'Pasión Rubí', 'Vino / Tinto', 550, 300, 'img/vestido1.png', 'Elegante vestido con corpiño de encaje floral, finas transparencias y una falda fluida.'));
    window.appCatalog.addDress(new Dress(2, 'Brillo Dorado', 'Oro', 550, 300, 'img/vestido2.png', 'Deslumbrante diseño de lentejuelas ceñido al cuerpo con delicados tirantes.'));
    window.appCatalog.addDress(new Dress(3, 'Destello Celeste', 'Azul Celeste', 550, 300, 'img/vestido3.png', 'Audaz diseño con corsé estructurado, pedrería lineal y abertura en pierna.'));
    window.appCatalog.addDress(new Dress(4, 'Esmeralda Satín', 'Verde Esmeralda', 550, 300, 'img/vestido4.png', 'Sofisticado vestido de satén con escote en V profundo y falda con vuelo.'));
    window.appCatalog.addDress(new Dress(5, 'Noche Azul Real', 'Azul Marino', 550, 300, 'img/vestido5.png', 'Vestido vaporoso con mangas largas semitransparentes y broche en cintura.'));
    window.appCatalog.addDress(new Dress(6, 'Obsidiana Glamour', 'Negro', 550, 300, 'img/vestido6.png', 'Imponente vestido negro de lentejuelas con corsé y flecos brillantes.'));

    window.appCatalog.render();
});
