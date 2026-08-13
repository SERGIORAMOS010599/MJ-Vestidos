// Clase que representa un Vestido
class Dress {
    constructor(id, name, color, price, imageUrl) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.price = price;
        // Si no hay imagen, usamos un gris de reserva temporal
        this.imageUrl = imageUrl || 'https://via.placeholder.com/300x400/eeeeee/999999?text=Imagen+del+Vestido'; 
    }

    // Método para generar el HTML de la tarjeta del vestido
    generateCardHTML() {
        return `
            <div class="dress-card" id="dress-${this.id}">
                <img src="${this.imageUrl}" alt="${this.name}" class="dress-image">
                <div class="dress-info">
                    <h3>${this.name}</h3>
                    <p>Color: ${this.color}</p>
                    <p class="dress-price">$${this.price.toFixed(2)} MXN / noche</p>
                </div>
            </div>
        `;
    }
}

// Clase para gestionar el Catálogo completo
class Catalog {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.dresses = [];
    }

    // Agregar un vestido al inventario
    addDress(dress) {
        this.dresses.push(dress);
    }

    // Renderizar todos los vestidos en el DOM
    render() {
        this.container.innerHTML = ''; // Limpiar contenedor
        this.dresses.forEach(dress => {
            this.container.innerHTML += dress.generateCardHTML();
        });
    }
}

// --- INICIALIZACIÓN DE LA PÁGINA ---

document.addEventListener('DOMContentLoaded', () => {
    // Instanciar el catálogo
    const miCatalogo = new Catalog('dress-container');

    // Crear vestidos de prueba (Puedes modificar estos datos después)
    const vestido1 = new Dress(1, 'Vestido Noche Estrellada', 'Azul Marino', 850);
    const vestido2 = new Dress(2, 'Corte Sirena Elegance', 'Rojo Carmesí', 950);
    const vestido3 = new Dress(3, 'Vestido Esmeralda Classic', 'Verde Esmeralda', 700);

    // Agregarlos al catálogo
    miCatalogo.addDress(vestido1);
    miCatalogo.addDress(vestido2);
    miCatalogo.addDress(vestido3);

    // Mostrar en pantalla
    miCatalogo.render();
});