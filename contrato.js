document.addEventListener("DOMContentLoaded", () => {
    // --- SISTEMA DE BLOQUEO (CERRADURA DIGITAL) ---
    const authOverlay = document.getElementById('auth-overlay');
    const pinInput = document.getElementById('admin-pin');
    const btnUnlock = document.getElementById('btn-unlock');

    // Cambia 'MJ2026' por la contraseña que quieras que use María José
    const CLAVE_SECRETA = 'Majo-2026';

    btnUnlock.addEventListener('click', () => {
        if (pinInput.value === CLAVE_SECRETA) {
            authOverlay.style.display = 'none'; // Desbloquea la pantalla
        } else {
            alert('Clave incorrecta. Acceso denegado.');
            pinInput.value = ''; // Limpia el recuadro
        }
    });

    // Permitir desbloquear presionando "Enter"
    pinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnUnlock.click();
        }
    });
    // ----------------------------------------------
    // 1. Obtener los datos de la URL
    const urlParams = new URLSearchParams(window.location.search);
    
    const cliente = urlParams.get('cliente') || '';
    
    // 2. Llenar los datos en el HTML
    document.getElementById('c-cliente').innerText = cliente;
    document.getElementById('c-telefono').innerText = urlParams.get('telefono') || '';
    document.getElementById('c-vestido').innerText = urlParams.get('vestido') || '';
    document.getElementById('c-direccion').innerText = urlParams.get('direccion') || '';
    document.getElementById('c-uso').innerText = urlParams.get('uso') || '';
    document.getElementById('c-total').innerText = urlParams.get('total') || '';
    document.getElementById('c-entrega').innerText = urlParams.get('entrega') || '';
    document.getElementById('c-devolucion').innerText = urlParams.get('devolucion') || '';
    
    document.getElementById('firma-nombre').innerText = cliente;

    // 3. Configurar el lienzo de firma (Signature Pad)
    const canvas = document.getElementById('signature-pad');
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)' // Fondo blanco necesario para el PDF
    });

    // Ajustar resolución del canvas para dispositivos móviles
    function resizeCanvas() {
        const ratio =  Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear(); // Limpiar al cambiar de tamaño
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Botón Limpiar
    document.getElementById('clear-signature').addEventListener('click', () => {
        signaturePad.clear();
    });

    // 4. Generar PDF y subir a Drive
    document.getElementById('save-pdf').addEventListener('click', async (e) => {
        if (signaturePad.isEmpty()) {
            alert("El cliente debe firmar el contrato antes de guardar.");
            return;
        }

        const btn = e.target;
        btn.innerText = "Generando PDF y subiendo a Drive...";
        btn.disabled = true;
        btn.style.backgroundColor = "#666";
        document.getElementById('clear-signature').style.display = 'none';

        // Elemento a convertir en PDF (todo el contrato)
        const element = document.getElementById('pdf-content');

        // Opciones del PDF
        const opt = {
            margin:       10,
            filename:     `Contrato_${cliente.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // 1. Iniciar la creación del PDF usando html2pdf
            const pdfWorker = html2pdf().set(opt).from(element);
            
            // 2. Obtener el PDF en formato Base64 para mandarlo a Drive
            const base64Pdf = await pdfWorker.output('datauristring');
            
            // 3. Preparar el envío al MISMO Script de Google
           // 3. Preparar el envío al MISMO Script de Google
            const payload = {
                base64: base64Pdf,
                filename: opt.filename,
                mimeType: 'application/pdf',
                // PON AQUÍ EL ID DE TU NUEVA CARPETA DE CONTRATOS
                folderId: '14MRtoYDZJ36Qd2d_fd2K206RdhKsI0KD' 
            };

            const scriptUrl = 'https://script.google.com/macros/s/AKfycbx6iX_qUnAipUhzQNhexvSRiXCP8kgpe8zWAYBtcwN5RkNHhZxsNnbTxGm2ocj2pl8/exec';

            const response = await fetch(scriptUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!data.success) throw new Error("Error guardando en Drive");

            // 4. Descargar el archivo localmente a la computadora/celular de María José
            await pdfWorker.save();

            btn.innerText = "¡Contrato Guardado Exitosamente!";
            btn.style.backgroundColor = "green";
            alert("El contrato se descargó en tu dispositivo y se guardó en Google Drive.");

        } catch (error) {
            console.error(error);
            alert("Hubo un error al procesar el contrato.");
            btn.innerText = "Intentar Guardar Nuevamente";
            btn.disabled = false;
            btn.style.backgroundColor = "#111";
            document.getElementById('clear-signature').style.display = 'block';
        }
    });
});
