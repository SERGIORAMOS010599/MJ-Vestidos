// Clase que representa un Vestido
class Dress {
    // Se agregó el parámetro "description" al constructor
    constructor(id, name, color, price, imageUrl, description) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.price = price;
        this.imageUrl = imageUrl || 'https://via.placeholder.com/300x400/eeeeee/999999?text=Imagen+del+Vestido'; 
        this.description = description;
    }

    // Método para generar el HTML de la tarjeta del vestido
    generateCardHTML() {
        return `
            <div class="dress-card" id="dress-${this.id}">
                <img src="${this.imageUrl}" alt="${this.name}" class="dress-image">
                <div class="dress-info">
                    <h3>${this.name}</h3>
                    <p><strong>Color:</strong> ${this.color}</p>
                    <p style="font-size: 0.9rem; margin: 10px 0; color: #555; line-height: 1.4;">${this.description}</p>
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

    addDress(dress) {
        this.dresses.push(dress);
    }

    render() {
        this.container.innerHTML = ''; 
        this.dresses.forEach(dress => {
            this.container.innerHTML += dress.generateCardHTML();
        });
    }
}

// --- INICIALIZACIÓN DE LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    const miCatalogo = new Catalog('dress-container');

    // Catálogo Oficial MJ Vestidos (Precios en 0 por el momento)
    const vestido1 = new Dress(1, 'Pasión Rubí', 'Vino / Tinto', 0, 'img/vestido1.png', 'Elegante vestido con corpiño de encaje floral, finas transparencias y una falda fluida de gran caída.');
    const vestido2 = new Dress(2, 'Brillo Dorado', 'Oro', 0, 'img/vestido2.png', 'Deslumbrante diseño de lentejuelas ceñido al cuerpo, con delicados tirantes y un sofisticado escote en la espalda.');
    const vestido3 = new Dress(3, 'Destello Celeste', 'Azul Celeste', 0, 'img/vestido3.png', 'Audaz y elegante diseño con corsé estructurado de transparencias, pedrería lineal y una sensual abertura en la pierna.');
    const vestido4 = new Dress(4, 'Esmeralda Satín', 'Verde Esmeralda', 0, 'img/vestido4.png', 'Sofisticado vestido de satén con escote en V profundo, cintura enmarcada, falda con vuelo y abertura lateral.');
    const vestido5 = new Dress(5, 'Noche Azul Real', 'Azul Marino', 0, 'img/vestido5.png', 'Vestido vaporoso con mangas largas semitransparentes, escote en V y un hermoso broche de pedrería en la cintura.');
    const vestido6 = new Dress(6, 'Obsidiana Glamour', 'Negro', 0, 'img/vestido6.png', 'Imponente vestido negro de lentejuelas con corsé, hombros descubiertos con flecos brillantes y abertura pronunciada.');

    // Agregarlos al catálogo
    miCatalogo.addDress(vestido1);
    miCatalogo.addDress(vestido2);
    miCatalogo.addDress(vestido3);
    miCatalogo.addDress(vestido4);
    miCatalogo.addDress(vestido5);
    miCatalogo.addDress(vestido6);

    // Mostrar en pantalla
    miCatalogo.render();
});
