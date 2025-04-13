// Genera número de orden aleatorio de 6 dígitos
function generateRandomOrderNumber() {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return randomNumber.toString().padStart(6, '0');
}

// Función para mostrar el número de orden
function displayOrderNumber() {
    const orderNumber = generateRandomOrderNumber();
    document.getElementById('orderNumber').textContent = orderNumber;
}

// Función para mostrar la fecha actual
function displayCurrentDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    const formattedDate = now.toLocaleDateString('es-ES', options);
    document.getElementById('currentDate').textContent = formattedDate;
}

// Función para manejar la foto del chasis
function setupChassisPhoto() {
    const chassisPhotoInput = document.getElementById('chassisPhoto');
    if (chassisPhotoInput) {
        chassisPhotoInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('chassisPhotoPreview');
                    preview.innerHTML = `<img src="${e.target.result}" alt="Foto del chasis">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Función para manejar la foto general del vehículo
function setupVehiclePhoto() {
    const vehiclePhotoInput = document.getElementById('vehiclePhoto');
    if (vehiclePhotoInput) {
        vehiclePhotoInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('photoPreview');
                    preview.innerHTML = `<img src="${e.target.result}" alt="Foto del vehículo">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Función para reemplazar textareas con divs para el PDF
function replaceTextareasForPDF() {
    const observationsTextarea = document.getElementById('observations');
    const clientReportTextarea = document.getElementById('clientReport');
    
    if (observationsTextarea && clientReportTextarea) {
        // Crear divs de reemplazo
        const observationsDiv = document.createElement('div');
        observationsDiv.className = 'textarea-replacement';
        observationsDiv.textContent = observationsTextarea.value;
        
        const clientReportDiv = document.createElement('div');
        clientReportDiv.className = 'textarea-replacement';
        clientReportDiv.textContent = clientReportTextarea.value;
        
        // Reemplazar los textareas
        observationsTextarea.parentNode.replaceChild(observationsDiv, observationsTextarea);
        clientReportTextarea.parentNode.replaceChild(clientReportDiv, clientReportTextarea);
        
        return {
            observations: { element: observationsTextarea, replacement: observationsDiv },
            clientReport: { element: clientReportTextarea, replacement: clientReportDiv }
        };
    }
    return null;
}

// Función para restaurar los textareas después de generar el PDF
function restoreTextareas(originalElements) {
    if (originalElements) {
        originalElements.observations.replacement.parentNode.replaceChild(
            originalElements.observations.element, 
            originalElements.observations.replacement
        );
        
        originalElements.clientReport.replacement.parentNode.replaceChild(
            originalElements.clientReport.element, 
            originalElements.clientReport.replacement
        );
        
        // Restaurar los valores
        originalElements.observations.element.value = originalElements.observations.replacement.textContent;
        originalElements.clientReport.element.value = originalElements.clientReport.replacement.textContent;
    }
}

// Función para generar el PDF
function generatePDF() {
    const loading = document.createElement('div');
    loading.style.position = 'fixed';
    loading.style.top = '0';
    loading.style.left = '0';
    loading.style.width = '100%';
    loading.style.height = '100%';
    loading.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loading.style.display = 'flex';
    loading.style.justifyContent = 'center';
    loading.style.alignItems = 'center';
    loading.style.zIndex = '1000';
    loading.innerHTML = '<div style="background: white; padding: 20px; border-radius: 5px;">Generando PDF, por favor espere...</div>';
    document.body.appendChild(loading);

    const element = document.getElementById('formToPrint');
    
    // Reemplazar textareas con divs para el PDF
    const originalElements = replaceTextareasForPDF();
    
    // Ocultar botones temporalmente
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => btn.style.display = 'none');
    
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `formulario_recepcion_${document.getElementById('orderNumber').textContent}.pdf`,
        image: { 
            type: 'jpeg', 
            quality: 1
        },
        html2canvas: { 
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: document.documentElement.scrollWidth,
            windowHeight: document.documentElement.scrollHeight
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Generar PDF
    html2pdf().set(opt).from(element).save().then(() => {
        // Restaurar los textareas originales
        restoreTextareas(originalElements);
        
        // Mostrar botones nuevamente
        buttons.forEach(btn => btn.style.display = '');
        
        // Eliminar mensaje de carga
        document.body.removeChild(loading);
    }).catch(err => {
        console.error('Error al generar PDF:', err);
        document.body.removeChild(loading);
    });
}

// Configurar el botón de descarga PDF
function setupDownloadButton() {
    const downloadBtn = document.getElementById('downloadPdf');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', generatePDF);
    }
}

// Inicializar la aplicación
function init() {
    displayOrderNumber();
    displayCurrentDate();
    setupChassisPhoto();
    setupVehiclePhoto();
    setupDownloadButton();
    
    // Autoajustar altura de textareas mientras se escribe
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
}

// Iniciar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', init);