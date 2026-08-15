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
    
    // Método de pago agregado
    const cPagoElement = document.getElementById('c-pago');
    if (cPagoElement) cPagoElement.innerText = urlParams.get('pago') || 'No especificado';
    
    document.getElementById('firma-nombre').innerText = cliente;

    // 3. Configurar el lienzo de firma (Signature Pad)
    const canvas = document.getElementById('signature-pad');
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)' 
    });

    function resizeCanvas() {
        const ratio =  Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear(); 
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

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

        // --- TRUCO PARA QUE LA FIRMA SÍ SALGA EN EL PDF ---
        const canvasElement = document.getElementById('signature-pad');
        const imgElement = document.getElementById('signature-img');
        
        imgElement.src = signaturePad.toDataURL('image/png');
        canvasElement.style.display = 'none';
        imgElement.style.display = 'block';

        await new Promise(resolve => setTimeout(resolve, 100));
        // --------------------------------------------------

        const element = document.getElementById('pdf-content');
        const nombreLimpio = cliente ? cliente.replace(/[^a-zA-Z0-9]/g, '_') : 'Cliente';

        // Opciones del PDF
        const opt = {
            margin:       [5, 10, 5, 10], // Redujimos los márgenes (Arriba, Derecha, Abajo, Izquierda)
            filename:     `Contrato_${nombreLimpio}_${Date.now()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                scrollY: 0, // ¡EL TRUCO! Ignora si hiciste scroll y quita el espacio blanco superior
                windowWidth: document.documentElement.offsetWidth 
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            const pdfWorker = html2pdf().set(opt).from(element);
            const base64Pdf = await pdfWorker.output('datauristring');
            
            const payload = {
                base64: base64Pdf,
                filename: opt.filename,
                mimeType: 'application/pdf',
                folderId: '14MRtoYDZJ36Qd2d_fd2K206RdhKsI0KD' // ID de la carpeta de Contratos
            };

            // --- AQUÍ ESTÁ TU NUEVA URL DE GOOGLE SCRIPT ---
            const scriptUrl = 'https://script.google.com/macros/s/AKfycbwaKJxY7JErnXQUYi_OCTuKmGjyBoxlPe-RRcM_XmSkYrwRic2EK7nYSDN-W8VmmiSN/exec';

            const response = await fetch(scriptUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!data.success) throw new Error("Error guardando en Drive");

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
            
            canvasElement.style.display = 'block';
            imgElement.style.display = 'none';
        }
    });
});
