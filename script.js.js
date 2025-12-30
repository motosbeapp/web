// Datos globales
const checklistItems = [
    { category: "INSPECCIÓN MECÁNICA & ESTRUCTURAL", items: [
        "COMBUSTIBLE Y TANQUE (TAPA, FIJACIÓN, NIVEL)",
        "MOTOR Y ESCAPE (BASES, NIVEL DE ACEITE, ESCAPE)",
        "TRANSMISIÓN (KIT ARRASTRE, CAMBIOS, PIÑÓN/CORONA)",
        "SUSPENSIÓN (AMORTIGUADORES, BUJES, FUNDAS)",
        "MANUBRIO Y CONTROLES (POSICIÓN, MANILLAS, COMANDOS)",
        "CARROCERÍA Y ASIENTO (TAPAS, GUARDABARROS, PARRILLA, ASIENTO, REPOSAPIÉS)",
        "RUEDAS Y NEUMÁTICOS (LLANTAS, PRESIÓN, ESTADO)"
    ]},
    { category: "SISTEMA ELÉCTRICO", items: [
        "LUCES (DELANTERA ALTA/BAJA, CRUCE, FRENO, TABLERO)",
        "DISPOSITIVOS (CORNETA, ENCENDIDO ELÉCTRICO, SUICHERA)"
    ]},
    { category: "SISTEMA DE FRENOS", items: [
        "COMPONENTES (LÍQUIDO, CALIPER, ARAÑAS, DISCOS/CAMPANAS)",
        "FUNCIONAMIENTO (PALANCA, PEDAL, RESPUESTA)"
    ]},
    { category: "ACCESORIOS Y DOCUMENTACIÓN", items: [
        "HERRAMIENTAS, RETROVISORES Y LLAVEROS",
        "ETIQUETAS (CERTIFICACIÓN, ADVERTENCIA)",
        "DOCUMENTACIÓN (CERTIFICADO DE ORIGEN, TITULO)"
    ]},
    { category: "PRUEBA FUNCIONAL RÁPIDA", items: [
        "ARRANQUE (ELÉCTRICO Y/O PEDAL)",
        "RESPUESTA DE ACELERACIÓN",
        "CAMBIOS DE VELOCIDAD (INCLUYE NEUTRAL)",
        "FRENOS DELANTERO/TRASERO (SENSACIÓN Y RESPUESTA)"
    ]}
];

let orders = JSON.parse(localStorage.getItem('belmotos-orders')) || [];
let currentEditOrderId = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Configurar inputs en mayúsculas
    setupUppercaseInputs();
    
    // Renderizar checklist
    renderChecklist();
    
    // Cargar órdenes desde localStorage
    if (orders.length > 0) {
        renderOrdersList();
    } else {
        document.getElementById('empty-orders-message').classList.remove('hidden');
    }
    
    // Configurar event listeners
    setupEventListeners();
});

// Configurar inputs para mayúsculas automáticas
function setupUppercaseInputs() {
    const uppercaseElements = document.querySelectorAll('.uppercase-input, .uppercase-textarea');
    
    uppercaseElements.forEach(element => {
        if (element.value) {
            element.value = element.value.toUpperCase();
        }
        
        element.addEventListener('input', function(e) {
            const cursorPosition = this.selectionStart;
            this.value = this.value.toUpperCase();
            this.setSelectionRange(cursorPosition, cursorPosition);
        });
        
        element.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text').toUpperCase();
            document.execCommand('insertText', false, pastedText);
        });
    });
}

// Configurar todos los event listeners
function setupEventListeners() {
    // Navegación
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const viewId = this.getAttribute('data-view');
            switchView(viewId);
        });
    });
    
    // Botón para ir a recepción desde órdenes vacías
    document.getElementById('go-to-reception').addEventListener('click', function() {
        switchView('reception');
    });
    
    // Menú móvil
    document.getElementById('mobile-menu-btn').addEventListener('click', function() {
        document.getElementById('mobile-menu').classList.remove('hidden');
    });
    
    document.getElementById('close-mobile-menu').addEventListener('click', function() {
        document.getElementById('mobile-menu').classList.add('hidden');
    });
    
    // Cerrar modal de edición
    document.getElementById('close-edit-modal').addEventListener('click', function() {
        document.getElementById('edit-order-modal').classList.add('hidden');
    });
    
    // Cambiar pestañas en modal
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchModalTab(tabId);
        });
    });
    
    // Filtros de órdenes
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-emerald-600', 'text-white');
                b.classList.add('bg-slate-200', 'text-slate-700', 'bg-amber-100', 'text-amber-800', 'bg-emerald-100', 'text-emerald-800');
            });
            
            this.classList.add('bg-emerald-600', 'text-white');
            this.classList.remove('bg-slate-200', 'text-slate-700', 'bg-amber-100', 'text-amber-800', 'bg-emerald-100', 'text-emerald-800');
            
            const status = this.getAttribute('data-status');
            const searchTerm = document.getElementById('search-orders').value;
            renderOrdersList(status, searchTerm);
        });
    });
    
    // Búsqueda de órdenes
    document.getElementById('search-orders').addEventListener('input', function() {
        const activeFilter = document.querySelector('.filter-btn.bg-emerald-600');
        const status = activeFilter ? activeFilter.getAttribute('data-status') : 'all';
        renderOrdersList(status, this.value);
    });
    
    // Subida de fotos en recepción
    document.getElementById('general-photo').addEventListener('change', function(e) {
        handlePhotoUpload(e, 'general-photo-img', 'general-photo-preview');
    });
    
    document.getElementById('chassis-photo').addEventListener('change', function(e) {
        handlePhotoUpload(e, 'chassis-photo-img', 'chassis-photo-preview');
    });
    
    // Subida de fotos de reparación
    document.getElementById('repair-photos').addEventListener('change', function(e) {
        const files = e.target.files;
        const order = orders.find(o => o.id === currentEditOrderId);
        if (!order) return;
        
        if (!order.progress.repairPhotos) {
            order.progress.repairPhotos = [];
        }
        
        for (let i = 0; i < Math.min(files.length, 5 - order.progress.repairPhotos.length); i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = function(event) {
                order.progress.repairPhotos.push(event.target.result);
                loadOrderProgressTab(order);
            };
            reader.readAsDataURL(file);
        }
        
        if (files.length > 5 - order.progress.repairPhotos.length) {
            showNotification('Solo se pueden agregar un máximo de 5 fotos de reparación.', 'warning');
        }
    });
    
    // Agregar costo de parte
    document.getElementById('add-part-cost').addEventListener('click', function() {
        const partsContainer = document.getElementById('parts-costs');
        const partIndex = partsContainer.children.length;
        
        const partElement = document.createElement('div');
        partElement.className = 'flex items-center gap-3';
        partElement.innerHTML = `
            <div class="flex-1">
                <input type="text" 
                       class="part-name w-full p-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase-input" placeholder="Nombre de la parte">
            </div>
            <div class="w-32">
                <input type="number" min="0" step="0.01" 
                       class="part-cost w-full p-2 border border-slate-300 rounded-xl text-right focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Costo">
            </div>
            <button class="remove-part-btn w-10 h-10 rounded-xl hover:bg-red-50 text-red-600 flex items-center justify-center" data-index="${partIndex}">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        `;
        partsContainer.appendChild(partElement);
        
        // Configurar input en mayúsculas
        const nameInput = partElement.querySelector('.uppercase-input');
        if (nameInput) {
            nameInput.addEventListener('input', function(e) {
                const cursorPosition = this.selectionStart;
                this.value = this.value.toUpperCase();
                this.setSelectionRange(cursorPosition, cursorPosition);
            });
        }
        
        // Agregar evento al botón de eliminar
        partElement.querySelector('.remove-part-btn').addEventListener('click', function() {
            partElement.remove();
            updateTotalCost();
        });
        
        // Agregar eventos a los inputs para actualizar costos
        partElement.querySelector('.part-cost').addEventListener('input', updateTotalCost);
        partElement.querySelector('.part-name').addEventListener('input', updateTotalCost);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
    
    // Eliminar parte (evento delegado)
    document.getElementById('parts-costs').addEventListener('click', function(e) {
        if (e.target.closest('.remove-part-btn')) {
            const btn = e.target.closest('.remove-part-btn');
            const partElement = btn.closest('.flex.items-center');
            partElement.remove();
            updateTotalCost();
        }
    });
    
    // Actualizar costos cuando cambian los inputs
    document.getElementById('actual-hours').addEventListener('input', updateTotalCost);
    document.getElementById('other-costs').addEventListener('input', updateTotalCost);
    
    // Cambiar estado de orden
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.status-btn').forEach(b => {
                b.classList.remove('bg-emerald-600', 'text-white');
                b.classList.add('bg-slate-200', 'text-slate-700', 'bg-amber-100', 'text-amber-800', 'bg-emerald-100', 'text-emerald-800');
            });
            
            this.classList.add('bg-emerald-600', 'text-white');
            this.classList.remove('bg-slate-200', 'text-slate-700', 'bg-amber-100', 'text-amber-800', 'bg-emerald-100', 'text-emerald-800');
            
            updateTotalCost();
        });
    });
    
    // Guardar cambios en orden
    document.getElementById('save-order-changes').addEventListener('click', saveOrderChanges);
    
    // Generar informe técnico desde modal
    document.getElementById('generate-technical-report').addEventListener('click', function() {
        if (currentEditOrderId) {
            generateTechnicalReport(currentEditOrderId);
        }
    });
    
    // Formulario de recepción
    document.getElementById('reception-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveReceptionOrder(new FormData(this));
    });
    
    // Configuración de toggles
    document.querySelectorAll('input[type="checkbox"][id$="toggle"]').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const label = this.nextElementSibling;
            const dot = label.nextElementSibling;
            
            if (this.checked) {
                dot.style.transform = 'translateX(1.5rem)';
                label.style.backgroundColor = '#059669';
            } else {
                dot.style.transform = 'translateX(0)';
                label.style.backgroundColor = '#d1d5db';
            }
        });
    });
    
    // Limpiar todos los datos
    document.getElementById('clear-data').addEventListener('click', function() {
        if (confirm('¿Está seguro de que desea eliminar todos los datos? Esta acción no se puede deshacer.')) {
            localStorage.removeItem('belmotos-orders');
            orders = [];
            renderOrdersList();
            showNotification('Todos los datos han sido eliminados.', 'info');
        }
    });
    
    // Exportar datos
    document.getElementById('export-data').addEventListener('click', function() {
        const dataStr = JSON.stringify(orders, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `belmotos_datos_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Datos exportados exitosamente.', 'success');
    });
    
    // Inicializar toggles de configuración
    document.querySelectorAll('input[type="checkbox"][id$="toggle"]').forEach(toggle => {
        toggle.dispatchEvent(new Event('change'));
    });
    
    // Cerrar modal haciendo clic fuera de él
    document.getElementById('edit-order-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
        }
    });
}

// Manejar subida de fotos
function handlePhotoUpload(e, imgId, previewId) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.getElementById(imgId);
            if (img) {
                img.src = event.target.result;
                document.getElementById(previewId).classList.remove('hidden');
            }
        };
        reader.readAsDataURL(file);
    }
}

// Generar ID de orden de 6 dígitos
function generateOrderId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notificationId = 'notification-' + Date.now();
    
    const colors = {
        success: 'bg-emerald-100 border-emerald-300 text-emerald-800',
        error: 'bg-red-100 border-red-300 text-red-800',
        warning: 'bg-amber-100 border-amber-300 text-amber-800',
        info: 'bg-sky-100 border-sky-300 text-sky-800'
    };
    
    const icons = {
        success: 'check-circle',
        error: 'alert-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `mb-4 p-4 rounded-2xl border ${colors[type]} bounce-in flex items-center shadow-lg`;
    notification.innerHTML = `
        <i data-lucide="${icons[type]}" class="mr-3 flex-shrink-0"></i>
        <div class="flex-1">${message}</div>
        <button class="ml-3 text-slate-500 hover:text-slate-700">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Botón para cerrar notificación
    notification.querySelector('button').addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 600);
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        if (document.getElementById(notificationId)) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 600);
        }
    }, 5000);
}

// Cambiar vista
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    document.getElementById(`${viewId}-view`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active', 'bg-emerald-700');
    });
    
    document.querySelectorAll(`[data-view="${viewId}"]`).forEach(link => {
        link.classList.add('active', 'bg-emerald-700');
    });
    
    document.getElementById('mobile-menu').classList.add('hidden');
    
    if (viewId === 'orders') {
        renderOrdersList();
    } else if (viewId === 'reports') {
        renderReportsList();
    }
}

// Renderizar checklist en el formulario de recepción
function renderChecklist() {
    const container = document.getElementById('checklist-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    checklistItems.forEach(categoryData => {
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'col-span-full mb-3 mt-4 first:mt-0';
        categoryHeader.innerHTML = `
            <h4 class="font-bold text-emerald-800 text-sm uppercase tracking-wider">${categoryData.category}</h4>
            <div class="h-px w-full bg-gradient-to-r from-emerald-400 to-transparent mt-1"></div>
        `;
        container.appendChild(categoryHeader);
        
        categoryData.items.forEach(item => {
            const itemId = `check-${item.replace(/\s+/g, '-').toLowerCase()}`;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'checklist-item';
            itemElement.innerHTML = `
                <label for="${itemId}" 
                       class="checklist-label block p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-200 cursor-pointer group">
                    <div class="flex items-start">
                        <input type="checkbox" 
                               id="${itemId}" 
                               class="checklist-checkbox mt-1 mr-3 w-4 h-4 accent-emerald-600 cursor-pointer">
                        <span class="text-xs font-bold uppercase text-gray-700 group-hover:text-emerald-800 tracking-tight leading-tight">
                            ${item}
                        </span>
                    </div>
                </label>
            `;
            
            container.appendChild(itemElement);
            
            const label = itemElement.querySelector('.checklist-label');
            const checkbox = itemElement.querySelector('.checklist-checkbox');
            
            label.addEventListener('click', function(e) {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
            
            checkbox.addEventListener('change', function() {
                const label = this.closest('.checklist-label');
                if (this.checked) {
                    label.classList.add('bg-emerald-100', 'border-emerald-300');
                    label.classList.remove('bg-gray-50', 'border-gray-200', 'hover:bg-emerald-50', 'hover:border-emerald-100');
                } else {
                    label.classList.remove('bg-emerald-100', 'border-emerald-300');
                    label.classList.add('bg-gray-50', 'border-gray-200', 'hover:bg-emerald-50', 'hover:border-emerald-100');
                }
            });
        });
    });
}

// Guardar nueva orden de recepción
function saveReceptionOrder(formData) {
    const orderId = generateOrderId();
    const now = new Date();
    
    const checklistStatus = {};
    checklistItems.forEach(categoryData => {
        categoryData.items.forEach(item => {
            const checkboxId = `check-${item.replace(/\s+/g, '-').toLowerCase()}`;
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checklistStatus[item] = checkbox.checked;
            }
        });
    });
    
    const newOrder = {
        id: orderId,
        date: now.toISOString(),
        owner: {
            name: document.getElementById('owner-name').value || 'NO ESPECIFICADO',
            id: document.getElementById('owner-id').value || 'NO ESPECIFICADO',
            phone: document.getElementById('owner-phone').value || 'NO ESPECIFICADO',
            email: document.getElementById('owner-email').value || 'NO ESPECIFICADO'
        },
        motorcycle: {
            plate: document.getElementById('motorcycle-plate').value || 'NO ESPECIFICADO',
            model: document.getElementById('motorcycle-model').value || 'NO ESPECIFICADO',
            km: document.getElementById('motorcycle-km').value || 'NO ESPECIFICADO',
            year: document.getElementById('motorcycle-year').value || 'NO ESPECIFICADO',
            chassis: document.getElementById('motorcycle-chassis').value || 'NO ESPECIFICADO',
            engine: document.getElementById('motorcycle-engine').value || 'NO ESPECIFICADO'
        },
        checklist: checklistStatus,
        clientReport: document.getElementById('client-report').value || "EL CLIENTE NO ESPECIFICÓ PROBLEMAS.",
        technicalObservations: document.getElementById('technical-observations').value || "SIN OBSERVACIONES TÉCNICAS INICIALES.",
        photos: {
            general: document.getElementById('general-photo-img')?.src || '',
            chassis: document.getElementById('chassis-photo-img')?.src || ''
        },
        status: 'pending',
        progress: {
            notes: '',
            estimatedHours: 0,
            actualHours: 0,
            technician: '',
            repairPhotos: []
        },
        costs: {
            labor: 0,
            parts: [],
            other: 0,
            total: 0
        },
        termsAccepted: true
    };
    
    const requiredFields = [
        { id: 'owner-name', label: 'Nombre del propietario' },
        { id: 'owner-id', label: 'Identificación del propietario' },
        { id: 'owner-phone', label: 'Teléfono del propietario' },
        { id: 'motorcycle-plate', label: 'Placa de la moto' },
        { id: 'motorcycle-model', label: 'Modelo de la moto' },
        { id: 'motorcycle-year', label: 'Año de la moto' },
        { id: 'client-report', label: 'Reporte del cliente' }
    ];
    
    const missingFields = [];
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            missingFields.push(field.label);
        }
    });
    
    if (missingFields.length > 0) {
        showNotification(`Complete los siguientes campos requeridos: ${missingFields.join(', ')}`, 'error');
        return;
    }
    
    if (!document.getElementById('accept-terms').checked) {
        showNotification('Debe aceptar los términos del servicio para continuar.', 'error');
        return;
    }
    
    orders.unshift(newOrder);
    localStorage.setItem('belmotos-orders', JSON.stringify(orders));
    
    showNotification(`Orden #${orderId} creada exitosamente. Se ha generado el PDF de recepción.`, 'success');
    
    generateReceptionPDF(newOrder);
    
    // Limpiar formulario
    document.getElementById('reception-form').reset();
    document.getElementById('general-photo-preview').classList.add('hidden');
    document.getElementById('chassis-photo-preview').classList.add('hidden');
    document.getElementById('client-report').value = '';
    document.getElementById('technical-observations').value = '';
    
    document.querySelectorAll('.checklist-checkbox').forEach(checkbox => {
        checkbox.checked = false;
        const label = checkbox.closest('.checklist-label');
        if (label) {
            label.classList.remove('bg-emerald-100', 'border-emerald-300');
            label.classList.add('bg-gray-50', 'border-gray-200', 'hover:bg-emerald-50', 'hover:border-emerald-100');
        }
    });
    
    setupUppercaseInputs();
    switchView('orders');
}

// Renderizar lista de órdenes
function renderOrdersList(filter = 'all', searchTerm = '') {
    const container = document.getElementById('orders-list');
    const emptyMessage = document.getElementById('empty-orders-message');
    
    if (!container) return;
    
    let filteredOrders = orders;
    
    if (filter !== 'all') {
        filteredOrders = orders.filter(order => order.status === filter);
    }
    
    if (searchTerm) {
        const term = searchTerm.toUpperCase();
        filteredOrders = filteredOrders.filter(order => 
            order.motorcycle.plate.toUpperCase().includes(term) ||
            order.id.includes(term) ||
            order.owner.name.toUpperCase().includes(term) ||
            order.owner.id.toUpperCase().includes(term)
        );
    }
    
    if (filteredOrders.length === 0) {
        container.innerHTML = '';
        if (emptyMessage) emptyMessage.classList.remove('hidden');
        return;
    }
    
    if (emptyMessage) emptyMessage.classList.add('hidden');
    
    const statusConfig = {
        pending: { bg: 'bg-slate-200', text: 'text-slate-800', label: 'Pendiente' },
        'in-progress': { bg: 'bg-amber-100', text: 'text-amber-800', label: 'En Proceso' },
        completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Completada' }
    };
    
    container.innerHTML = filteredOrders.map(order => {
        const status = statusConfig[order.status];
        const date = new Date(order.date);
        const formattedDate = date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        
        return `
            <div class="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="px-4 py-1.5 ${status.bg} ${status.text} rounded-2xl text-sm font-medium">${status.label}</span>
                            <h3 class="text-xl font-bold text-slate-800 mt-2">Orden #${order.id}</h3>
                        </div>
                        <button class="edit-order-btn w-10 h-10 rounded-2xl hover:bg-slate-100 flex items-center justify-center transition-all" data-order-id="${order.id}">
                            <i data-lucide="edit-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-3 mb-6">
                        <div class="flex items-center">
                            <i data-lucide="user" class="w-4 h-4 text-slate-400 mr-3"></i>
                            <span class="text-slate-700">${order.owner.name}</span>
                        </div>
                        <div class="flex items-center">
                            <i data-lucide="bike" class="w-4 h-4 text-slate-400 mr-3"></i>
                            <span class="text-slate-700">${order.motorcycle.plate} - ${order.motorcycle.model}</span>
                        </div>
                        <div class="flex items-center">
                            <i data-lucide="calendar" class="w-4 h-4 text-slate-400 mr-3"></i>
                            <span class="text-slate-700">${formattedDate}</span>
                        </div>
                    </div>
                    
                    <div class="pt-4 border-t border-slate-200">
                        <div class="flex justify-between items-center">
                            <button class="view-details-btn px-4 py-2 text-emerald-700 hover:bg-emerald-50 rounded-2xl font-medium transition-all" data-order-id="${order.id}">
                                Ver detalles
                            </button>
                            ${order.status === 'completed' ? `
                                <button class="generate-report-btn px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-medium transition-all flex items-center" data-order-id="${order.id}">
                                    <i data-lucide="file-text" class="w-4 h-4 mr-2"></i>
                                    Informe
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.querySelectorAll('.edit-order-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            openEditModal(orderId);
        });
    });
    
    container.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            openEditModal(orderId);
        });
    });
    
    container.querySelectorAll('.generate-report-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            generateTechnicalReport(orderId);
        });
    });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Renderizar lista de informes
function renderReportsList() {
    const container = document.getElementById('reports-list');
    if (!container) return;
    
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    if (completedOrders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="file-x" class="w-8 h-8 text-slate-400"></i>
                </div>
                <p class="text-slate-600">No hay órdenes completadas para generar informes.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = completedOrders.map(order => {
        const date = new Date(order.date);
        const formattedDate = date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
        
        return `
            <div class="bg-slate-50 rounded-2xl p-5 flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-slate-800">Orden #${order.id}</h4>
                    <p class="text-slate-600 text-sm mt-1">${order.motorcycle.plate} - ${order.motorcycle.model}</p>
                    <p class="text-slate-500 text-sm">${formattedDate}</p>
                </div>
                <button class="generate-report-btn px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg font-medium flex items-center" data-order-id="${order.id}">
                    <i data-lucide="download" class="mr-2"></i>
                    Generar PDF
                </button>
            </div>
        `;
    }).join('');
    
    container.querySelectorAll('.generate-report-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            generateTechnicalReport(orderId);
        });
    });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Abrir modal de edición
function openEditModal(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    currentEditOrderId = orderId;
    
    document.getElementById('modal-order-id').textContent = order.id;
    document.getElementById('modal-order-plate').textContent = order.motorcycle.plate;
    document.getElementById('modal-order-client').textContent = order.owner.name;
    
    loadOrderInfoTab(order);
    loadOrderProgressTab(order);
    loadOrderManagementTab(order);
    
    document.getElementById('edit-order-modal').classList.remove('hidden');
    switchModalTab('info');
    setupUppercaseInputs();
}

// Cargar información general en el modal
function loadOrderInfoTab(order) {
    const container = document.getElementById('tab-info');
    if (!container) return;
    
    const date = new Date(order.date);
    const formattedDate = date.toLocaleDateString('es-ES', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const totalItems = Object.keys(order.checklist || {}).length;
    const completedItems = totalItems > 0 ? Object.values(order.checklist).filter(val => val).length : 0;
    
    container.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-slate-50 rounded-2xl p-6">
                    <h4 class="text-lg font-bold text-slate-800 mb-4">Información del Cliente</h4>
                    <div class="space-y-3">
                        <div>
                            <p class="text-sm text-slate-500">Nombre completo</p>
                            <p class="font-medium text-slate-800">${order.owner.name || 'NO ESPECIFICADO'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-slate-500">Identificación</p>
                            <p class="font-medium text-slate-800">${order.owner.id || 'NO ESPECIFICADO'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-slate-500">Teléfono</p>
                            <p class="font-medium text-slate-800">${order.owner.phone || 'NO ESPECIFICADO'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-slate-500">Correo electrónico</p>
                            <p class="font-medium text-slate-800">${order.owner.email || 'NO ESPECIFICADO'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-slate-50 rounded-2xl p-6">
                    <h4 class="text-lg font-bold text-slate-800 mb-4">Información de la Moto</h4>
                    <div class="space-y-3">
                        <div>
                            <p class="text-sm text-slate-500">Placa</p>
                            <p class="font-medium text-slate-800">${order.motorcycle.plate || 'NO ESPECIFICADO'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-slate-500">Modelo</p>
                            <p class="font-medium text-slate-800">${order.motorcycle.model || 'NO ESPECIFICADO'}</p>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm text-slate-500">Año</p>
                                <p class="font-medium text-slate-800">${order.motorcycle.year || 'NO ESPECIFICADO'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-slate-500">Kilometraje</p>
                                <p class="font-medium text-slate-800">${order.motorcycle.km ? order.motorcycle.km + ' KM' : 'NO ESPECIFICADO'}</p>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm text-slate-500">Serial del Chasis</p>
                            <p class="font-medium text-slate-800">${order.motorcycle.chassis || 'NO ESPECIFICADO'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-slate-500">Serial del Motor</p>
                            <p class="font-medium text-slate-800">${order.motorcycle.engine || 'NO ESPECIFICADO'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-slate-50 rounded-2xl p-6">
                <h4 class="text-lg font-bold text-slate-800 mb-4">Checklist de Inspección</h4>
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-slate-700">Progreso de inspección</span>
                        <span class="font-medium text-emerald-700">${completedItems}/${totalItems}</span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-3">
                        <div class="bg-emerald-600 h-3 rounded-full" style="width: ${totalItems > 0 ? (completedItems/totalItems)*100 : 0}%"></div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${order.checklist && Object.entries(order.checklist).map(([item, checked]) => `
                        <div class="flex items-center">
                            <div class="w-5 h-5 rounded-lg ${checked ? 'bg-emerald-100 border border-emerald-300' : 'bg-slate-100 border border-slate-300'} flex items-center justify-center mr-3 flex-shrink-0">
                                ${checked ? '<i data-lucide="check" class="w-3 h-3 text-emerald-700"></i>' : ''}
                            </div>
                            <span class="text-slate-700 ${checked ? '' : 'opacity-70'}">${item}</span>
                        </div>
                    `).join('') || '<p class="text-slate-500">No hay checklist registrado</p>'}
                </div>
            </div>
            
            <div class="bg-slate-50 rounded-2xl p-6">
                <h4 class="text-lg font-bold text-slate-800 mb-4">Detalles de la Orden</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p class="text-sm text-slate-500">Fecha de recepción</p>
                        <p class="font-medium text-slate-800">${formattedDate}</p>
                    </div>
                    <div>
                        <p class="text-sm text-slate-500">ID de orden</p>
                        <p class="font-medium text-slate-800">${order.id}</p>
                    </div>
                    <div>
                        <p class="text-sm text-slate-500">Estado actual</p>
                        <p class="font-medium">
                            <span class="px-3 py-1 rounded-2xl ${order.status === 'pending' ? 'bg-slate-200 text-slate-800' : order.status === 'in-progress' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
                                ${order.status === 'pending' ? 'Pendiente' : order.status === 'in-progress' ? 'En Proceso' : 'Completada'}
                            </span>
                        </p>
                    </div>
                    <div>
                        <p class="text-sm text-slate-500">Aceptó términos</p>
                        <p class="font-medium text-slate-800">${order.termsAccepted ? 'Sí' : 'No'}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-slate-50 rounded-2xl p-6">
                <h4 class="text-lg font-bold text-slate-800 mb-4">Reportes y Observaciones</h4>
                <div class="space-y-4">
                    <div>
                        <p class="text-sm text-slate-500 font-medium">Reporte del Cliente</p>
                        <p class="text-slate-700 mt-1">${order.clientReport || 'SIN REPORTE DEL CLIENTE'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-slate-500 font-medium">Observaciones Técnicas Iniciales</p>
                        <p class="text-slate-700 mt-1">${order.technicalObservations || 'SIN OBSERVACIONES TÉCNICAS'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Cargar progreso en el modal
function loadOrderProgressTab(order) {
    const technicalNotes = document.getElementById('technical-notes');
    const estimatedHours = document.getElementById('estimated-hours');
    const actualHours = document.getElementById('actual-hours');
    const assignedTechnician = document.getElementById('assigned-technician');
    const container = document.getElementById('repair-photos-preview');
    
    if (technicalNotes) technicalNotes.value = order.progress.notes || '';
    if (estimatedHours) estimatedHours.value = order.progress.estimatedHours || '';
    if (actualHours) actualHours.value = order.progress.actualHours || '';
    if (assignedTechnician) assignedTechnician.value = order.progress.technician || '';
    
    if (container) {
        container.innerHTML = '';
        
        if (order.progress.repairPhotos && order.progress.repairPhotos.length > 0) {
            order.progress.repairPhotos.forEach((photo, index) => {
                const photoElement = document.createElement('div');
                photoElement.className = 'relative';
                photoElement.innerHTML = `
                    <div class="rounded-xl overflow-hidden h-32 bg-slate-200">
                        <img src="${photo}" alt="Reparación ${index + 1}" class="w-full h-full object-cover">
                    </div>
                    <button class="remove-photo-btn absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" data-index="${index}">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                `;
                container.appendChild(photoElement);
            });
        }
        
        container.querySelectorAll('.remove-photo-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeRepairPhoto(index);
            });
        });
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Cargar gestión en el modal
function loadOrderManagementTab(order) {
    const partsContainer = document.getElementById('parts-costs');
    if (!partsContainer) return;
    
    partsContainer.innerHTML = '';
    
    if (order.costs.parts && order.costs.parts.length > 0) {
        order.costs.parts.forEach((part, index) => {
            const partElement = document.createElement('div');
            partElement.className = 'flex items-center gap-3';
            partElement.innerHTML = `
                <div class="flex-1">
                    <input type="text" value="${part.name}" 
                           class="part-name w-full p-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase-input" placeholder="Nombre de la parte">
                </div>
                <div class="w-32">
                    <input type="number" value="${part.cost}" min="0" step="0.01" 
                           class="part-cost w-full p-2 border border-slate-300 rounded-xl text-right focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Costo">
                </div>
                <button class="remove-part-btn w-10 h-10 rounded-xl hover:bg-red-50 text-red-600 flex items-center justify-center" data-index="${index}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;
            partsContainer.appendChild(partElement);
        });
    }
    
    const laborCost = document.getElementById('labor-cost');
    const otherCosts = document.getElementById('other-costs');
    const totalCost = document.getElementById('total-cost');
    
    if (laborCost) laborCost.textContent = `$${order.costs.labor.toFixed(2)}`;
    if (otherCosts) otherCosts.value = order.costs.other;
    updateTotalCost();
    
    document.querySelectorAll('.status-btn').forEach(btn => {
        if (btn.getAttribute('data-status') === order.status) {
            btn.classList.add('bg-emerald-600', 'text-white');
            btn.classList.remove('bg-slate-200', 'text-slate-700', 'bg-amber-100', 'text-amber-800', 'bg-emerald-100', 'text-emerald-800');
        } else {
            btn.classList.remove('bg-emerald-600', 'text-white');
        }
    });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Cambiar pestaña en el modal
function switchModalTab(tabId) {
    document.querySelectorAll('.modal-tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.classList.remove('border-emerald-600', 'text-emerald-700');
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('border-emerald-600', 'text-emerald-700');
        }
    });
}

// Actualizar costo total
function updateTotalCost() {
    const order = orders.find(o => o.id === currentEditOrderId);
    if (!order) return;
    
    let partsTotal = 0;
    document.querySelectorAll('.part-cost').forEach(input => {
        partsTotal += parseFloat(input.value) || 0;
    });
    
    const otherCosts = parseFloat(document.getElementById('other-costs').value) || 0;
    const laborRate = 20;
    const actualHours = parseFloat(document.getElementById('actual-hours').value) || 0;
    const laborCost = actualHours * laborRate;
    const totalCost = partsTotal + otherCosts + laborCost;
    
    const partsTotalElement = document.getElementById('parts-total');
    const laborCostElement = document.getElementById('labor-cost');
    const totalCostElement = document.getElementById('total-cost');
    
    if (partsTotalElement) partsTotalElement.textContent = `$${partsTotal.toFixed(2)}`;
    if (laborCostElement) laborCostElement.textContent = `$${laborCost.toFixed(2)}`;
    if (totalCostElement) totalCostElement.textContent = `$${totalCost.toFixed(2)}`;
    
    order.costs.labor = laborCost;
    order.costs.other = otherCosts;
    order.costs.total = totalCost;
    
    order.costs.parts = [];
    document.querySelectorAll('.part-name').forEach((nameInput, index) => {
        const costInput = document.querySelectorAll('.part-cost')[index];
        if (nameInput && costInput) {
            order.costs.parts.push({
                name: nameInput.value,
                cost: parseFloat(costInput.value) || 0
            });
        }
    });
}

// Eliminar foto de reparación
function removeRepairPhoto(index) {
    const order = orders.find(o => o.id === currentEditOrderId);
    if (!order || !order.progress.repairPhotos) return;
    
    order.progress.repairPhotos.splice(index, 1);
    loadOrderProgressTab(order);
}

// Guardar cambios en la orden
function saveOrderChanges() {
    const order = orders.find(o => o.id === currentEditOrderId);
    if (!order) return;
    
    const technicalNotes = document.getElementById('technical-notes');
    const estimatedHours = document.getElementById('estimated-hours');
    const actualHours = document.getElementById('actual-hours');
    const assignedTechnician = document.getElementById('assigned-technician');
    
    if (technicalNotes) order.progress.notes = technicalNotes.value.toUpperCase();
    if (estimatedHours) order.progress.estimatedHours = parseFloat(estimatedHours.value) || 0;
    if (actualHours) order.progress.actualHours = parseFloat(actualHours.value) || 0;
    if (assignedTechnician) order.progress.technician = assignedTechnician.value.toUpperCase();
    
    const activeStatusBtn = document.querySelector('.status-btn.bg-emerald-600');
    if (activeStatusBtn) {
        order.status = activeStatusBtn.getAttribute('data-status');
    }
    
    localStorage.setItem('belmotos-orders', JSON.stringify(orders));
    document.getElementById('edit-order-modal').classList.add('hidden');
    showNotification(`Orden #${order.id} actualizada exitosamente.`, 'success');
    renderOrdersList();
}

// Generar PDF de recepción
function generateReceptionPDF(order) {
    try {
        if (typeof jsPDF === 'undefined') {
            showNotification('Error: jsPDF no está disponible. Recargue la página.', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const marginLeft = 15;
        const marginRight = 15;
        const pageWidth = 210;
        const contentWidth = pageWidth - marginLeft - marginRight;
        
        // Encabezado
        doc.setFillColor(5, 150, 105);
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text("BELMOTOS - TALLER", marginLeft, 20);
        
        doc.setFontSize(16);
        const orderText = `ORDEN #${order.id}`;
        const orderTextWidth = doc.getStringUnitWidth(orderText) * 16 / doc.internal.scaleFactor;
        const orderX = pageWidth - marginRight - orderTextWidth;
        doc.text(orderText, orderX, 20);
        
        // Fecha
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const date = new Date(order.date);
        const formattedDate = date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(`Fecha: ${formattedDate}`, marginLeft, 40);
        
        // Datos en dos columnas
        const columnWidth = contentWidth / 2 - 5;
        let yPos = 50;
        
        // Datos del Propietario
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("DATOS DEL PROPIETARIO", marginLeft, yPos);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        yPos += 7;
        doc.text(`Nombre: ${order.owner.name || 'NO ESPECIFICADO'}`, marginLeft, yPos);
        yPos += 5;
        doc.text(`C.I./RIF: ${order.owner.id || 'NO ESPECIFICADO'}`, marginLeft, yPos);
        yPos += 5;
        doc.text(`Teléfono: ${order.owner.phone || 'NO ESPECIFICADO'}`, marginLeft, yPos);
        yPos += 5;
        doc.text(`Email: ${order.owner.email || 'NO ESPECIFICADO'}`, marginLeft, yPos);
        
        // Datos de la Moto
        yPos = 50;
        const rightColumnX = marginLeft + columnWidth + 10;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("DATOS DE LA MOTO", rightColumnX, yPos);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        yPos += 7;
        doc.text(`Placa: ${order.motorcycle.plate || 'NO ESPECIFICADO'}`, rightColumnX, yPos);
        yPos += 5;
        doc.text(`Modelo: ${order.motorcycle.model || 'NO ESPECIFICADO'}`, rightColumnX, yPos);
        yPos += 5;
        doc.text(`KM: ${order.motorcycle.km || 'NO ESPECIFICADO'}`, rightColumnX, yPos);
        yPos += 5;
        doc.text(`Año: ${order.motorcycle.year || 'NO ESPECIFICADO'}`, rightColumnX, yPos);
        yPos += 5;
        doc.text(`Serial Chasis: ${order.motorcycle.chassis || 'NO ESPECIFICADO'}`, rightColumnX, yPos);
        yPos += 5;
        doc.text(`Serial Motor: ${order.motorcycle.engine || 'NO ESPECIFICADO'}`, rightColumnX, yPos);
        
        // Reporte del Cliente
        yPos += 10;
        
        if (yPos > 150) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("REPORTE DEL CLIENTE", marginLeft, yPos);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        yPos += 7;
        
        const clientReport = order.clientReport || "EL CLIENTE NO ESPECIFICÓ PROBLEMAS.";
        const splitClientReport = doc.splitTextToSize(clientReport, contentWidth);
        splitClientReport.forEach((line, index) => {
            doc.text(line, marginLeft, yPos + (index * 4));
        });
        
        yPos += (splitClientReport.length * 4) + 10;
        
        // Observaciones Técnicas
        if (yPos > 150) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("OBSERVACIONES TÉCNICAS", marginLeft, yPos);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        yPos += 7;
        
        const observations = order.technicalObservations || "SIN OBSERVACIONES TÉCNICAS INICIALES.";
        const splitObservations = doc.splitTextToSize(observations, contentWidth);
        splitObservations.forEach((line, index) => {
            doc.text(line, marginLeft, yPos + (index * 4));
        });
        
        yPos += (splitObservations.length * 4) + 10;
        
        // Inventario Físico - 3 columnas
        if (yPos > 100) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("INVENTARIO FÍSICO", pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 10;
        
        const gridCols = 3;
        const gridColWidth = contentWidth / gridCols;
        const colSpacing = 5;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        
        const categorizedItems = {};
        if (order.checklist) {
            Object.entries(order.checklist).forEach(([item, checked]) => {
                let category = 'GENERAL';
                checklistItems.forEach(cat => {
                    if (cat.items.includes(item)) {
                        category = cat.category;
                    }
                });
                
                if (!categorizedItems[category]) {
                    categorizedItems[category] = [];
                }
                categorizedItems[category].push({ item, checked });
            });
        }
        
        let currentCol = 0;
        let currentY = yPos;
        let maxY = yPos;
        
        Object.entries(categorizedItems).forEach(([category, items]) => {
            const colX = marginLeft + (currentCol * (gridColWidth + colSpacing));
            
            if (currentY > 250 && currentCol < gridCols - 1) {
                currentCol++;
                currentY = yPos;
                maxY = Math.max(maxY, currentY);
            } else if (currentY > 250 && currentCol === gridCols - 1) {
                doc.addPage();
                currentCol = 0;
                currentY = 20;
                maxY = currentY;
            }
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.text(category.toUpperCase(), colX, currentY);
            currentY += 4;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            
            items.forEach(({ item, checked }) => {
                const marker = checked ? '[X]' : '[ ]';
                const itemText = `${marker} ${item}`;
                
                const splitText = doc.splitTextToSize(itemText, gridColWidth - 5);
                
                if (currentY + (splitText.length * 3) > 280) {
                    if (currentCol < gridCols - 1) {
                        currentCol++;
                        currentY = yPos;
                        maxY = Math.max(maxY, currentY);
                    } else {
                        doc.addPage();
                        currentCol = 0;
                        currentY = 20;
                        maxY = currentY;
                    }
                }
                
                const currentColX = marginLeft + (currentCol * (gridColWidth + colSpacing));
                
                splitText.forEach((line, index) => {
                    doc.text(line, currentColX, currentY + (index * 3));
                });
                
                currentY += (splitText.length * 3) + 1;
                maxY = Math.max(maxY, currentY);
            });
            
            currentY += 2;
        });
        
        yPos = maxY + 10;
        
        // Evidencia Fotográfica
        if (order.photos && (order.photos.general || order.photos.chassis)) {
            if (yPos > 150) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("EVIDENCIA FOTOGRÁFICA:", marginLeft, yPos);
            
            yPos += 8;
            
            const photoWidth = 85;
            const photoHeight = 50;
            const photoSpacing = 10;
            
            if (order.photos.general) {
                try {
                    doc.addImage(order.photos.general, 'JPEG', marginLeft, yPos, photoWidth, photoHeight);
                    doc.setFontSize(8);
                    doc.text("FOTO GENERAL", marginLeft + photoWidth/2, yPos + photoHeight + 5, { align: 'center' });
                } catch (e) {
                    console.error("Error cargando foto general:", e);
                }
            }
            
            if (order.photos.chassis) {
                try {
                    const chassisX = marginLeft + photoWidth + photoSpacing;
                    doc.addImage(order.photos.chassis, 'JPEG', chassisX, yPos, photoWidth, photoHeight);
                    doc.text("SERIAL DEL CHASIS", chassisX + photoWidth/2, yPos + photoHeight + 5, { align: 'center' });
                } catch (e) {
                    console.error("Error cargando foto del chasis:", e);
                }
            }
            
            yPos += photoHeight + 15;
        }
        
        // Pie de página legal
        if (yPos > 200) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6);
        
        const legalText = `Cláusulas de responsabilidad: BELMOTOS no se hace responsable por objetos de valor dejados dentro del vehículo. 
        El taller mantendrá el vehículo bajo custodia, pero no será responsable por daños por causas mayores o fuerza mayor. 
        El cliente autoriza las reparaciones necesarias y acepta que el costo final puede variar según piezas requeridas. 
        Para retirar el vehículo debe presentar documento de identificación y esta orden de servicio. 
        El vehículo debe ser retirado dentro de los 15 días hábiles posteriores a la notificación de culminación.`;
        
        const splitLegalText = doc.splitTextToSize(legalText, contentWidth);
        splitLegalText.forEach((line, index) => {
            doc.text(line, marginLeft, yPos + (index * 3));
        });
        
        yPos += (splitLegalText.length * 3) + 10;
        
        // Firmas
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        
        doc.text("_________________________", marginLeft, yPos);
        doc.text("RECIBIDO (TALLER)", marginLeft, yPos + 5);
        
        const clientSignatureX = pageWidth - marginRight - 50;
        doc.text("_________________________", clientSignatureX, yPos);
        doc.text("CONFORMIDAD (CLIENTE)", clientSignatureX, yPos + 5);
        
        // Guardar PDF
        doc.save(`BELMOTOS_Recepcion_${order.id}_${order.motorcycle.plate}.pdf`);
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        showNotification('Error al generar el PDF de recepción.', 'error');
    }
}

// Generar informe técnico
function generateTechnicalReport(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
        if (typeof jsPDF === 'undefined') {
            showNotification('Error: jsPDF no está disponible. Recargue la página.', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const marginLeft = 15;
        const marginRight = 15;
        const pageWidth = 210;
        const contentWidth = pageWidth - marginLeft - marginRight;
        
        // Encabezado
        doc.setFillColor(5, 150, 105);
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text("INFORME TÉCNICO", marginLeft, 20);
        
        doc.setFontSize(16);
        const orderText = `ORDEN #${order.id}`;
        const orderTextWidth = doc.getStringUnitWidth(orderText) * 16 / doc.internal.scaleFactor;
        const orderX = pageWidth - marginRight - orderTextWidth;
        doc.text(orderText, orderX, 20);
        
        // Información básica
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        let yPos = 40;
        
        const date = new Date(order.date);
        const formattedDate = date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric'
        });
        doc.text(`Fecha de recepción: ${formattedDate}`, marginLeft, yPos);
        doc.text(`Moto: ${order.motorcycle.plate || 'NO ESPECIFICADO'} - ${order.motorcycle.model || 'NO ESPECIFICADO'}`, marginLeft + 80, yPos);
        
        yPos += 7;
        doc.text(`Cliente: ${order.owner.name || 'NO ESPECIFICADO'}`, marginLeft, yPos);
        doc.text(`Teléfono: ${order.owner.phone || 'NO ESPECIFICADO'}`, marginLeft + 80, yPos);
        
        yPos += 10;
        
        // Diagnóstico y reparaciones
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("DIAGNÓSTICO Y REPARACIONES REALIZADAS", marginLeft, yPos);
        
        yPos += 7;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        const diagnosis = order.progress.notes || "SIN DIAGNÓSTICO ESPECÍFICO REGISTRADO.";
        const splitDiagnosis = doc.splitTextToSize(diagnosis, contentWidth);
        splitDiagnosis.forEach((line, index) => {
            doc.text(line, marginLeft, yPos + (index * 5));
        });
        
        yPos += (splitDiagnosis.length * 5) + 10;
        
        // Detalle del trabajo
        if (yPos > 180) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("DETALLE DEL TRABAJO", marginLeft, yPos);
        
        yPos += 7;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        const technician = order.progress.technician || "NO ASIGNADO";
        const estimatedHours = order.progress.estimatedHours || 0;
        const actualHours = order.progress.actualHours || 0;
        
        doc.text(`Técnico responsable: ${technician}`, marginLeft, yPos);
        yPos += 5;
        doc.text(`Horas estimadas: ${estimatedHours}h`, marginLeft, yPos);
        doc.text(`Horas reales: ${actualHours}h`, marginLeft + 70, yPos);
        yPos += 10;
        
        // Costos detallados
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("DETALLE DE COSTOS", marginLeft, yPos);
        
        yPos += 7;
        
        doc.setFillColor(240, 240, 240);
        doc.rect(marginLeft, yPos, contentWidth, 8, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("DESCRIPCIÓN", marginLeft + 2, yPos + 5);
        doc.text("COSTO", marginLeft + contentWidth - 20, yPos + 5, { align: 'right' });
        
        yPos += 10;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Mano de obra", marginLeft + 2, yPos);
        doc.text(`$${order.costs.labor.toFixed(2)}`, marginLeft + contentWidth - 20, yPos, { align: 'right' });
        yPos += 6;
        
        if (order.costs.parts && order.costs.parts.length > 0) {
            order.costs.parts.forEach(part => {
                doc.text(part.name, marginLeft + 2, yPos);
                doc.text(`$${part.cost.toFixed(2)}`, marginLeft + contentWidth - 20, yPos, { align: 'right' });
                yPos += 6;
            });
        }
        
        doc.text("Otros gastos", marginLeft + 2, yPos);
        doc.text(`$${order.costs.other.toFixed(2)}`, marginLeft + contentWidth - 20, yPos, { align: 'right' });
        yPos += 8;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("TOTAL", marginLeft + 2, yPos);
        doc.text(`$${order.costs.total.toFixed(2)}`, marginLeft + contentWidth - 20, yPos, { align: 'right' });
        
        yPos += 15;
        
        // Firmas
        if (yPos > 200) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.text("_________________________", marginLeft, yPos);
        doc.text("TÉCNICO RESPONSABLE", marginLeft, yPos + 5);
        
        const clientSignatureX = pageWidth - marginRight - 50;
        doc.text("_________________________", clientSignatureX, yPos);
        doc.text("CONFORMIDAD DEL CLIENTE", clientSignatureX, yPos + 5);
        
        doc.setFontSize(8);
        const deliveryDate = new Date().toLocaleDateString('es-ES');
        doc.text(`Fecha de entrega: ${deliveryDate}`, pageWidth / 2, yPos + 15, { align: 'center' });
        
        // Guardar PDF
        doc.save(`BELMOTOS_Informe_Tecnico_${order.id}_${order.motorcycle.plate}.pdf`);
        
        showNotification(`Informe técnico #${order.id} generado exitosamente.`, 'success');
        
    } catch (error) {
        console.error('Error generando informe técnico:', error);
        showNotification('Error al generar el informe técnico.', 'error');
    }
}