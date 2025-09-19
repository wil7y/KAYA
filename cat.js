import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// ⚡ Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBZEdkns9h6f7cDTo5E_7xdsGKGkoFmN9w",
  authDomain: "ecommerce-5ced7.firebaseapp.com",
  projectId: "ecommerce-5ced7",
  storageBucket: "ecommerce-5ced7.appspot.com",
  messagingSenderId: "527505769374",
  appId: "1:527505769374:web:274a9c3184a313d8778c8f",
  measurementId: "G-WKNBS4S6LK"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

let currentUserUID = null;

// --- Produits manuels ---
const products = [
    {name: "Arduino Uno", category: "Electronique", price: "8000 FCFA", oldPrice: "10500 FCFA", imageUrl: "arduino.jpg"},
    {name: "Arduino Mega", category: "Electronique", price: "10000 FCFA", oldPrice: "12500 FCFA", imageUrl: "arduino.jpg"},
    {name: "Maison Gadget", category: "Maison", price: "5000 FCFA", oldPrice: "6500 FCFA", imageUrl: "arduino.jpg"},
    {name: "Jouet Robot", category: "Jouets", price: "7000 FCFA", oldPrice: "9000 FCFA", imageUrl: "arduino.jpg"},
];

// --- Récupérer catégorie depuis URL ---
const urlParams = new URLSearchParams(window.location.search);
let category = urlParams.get('cat') || "Tous les produits";
document.getElementById('category-title').textContent = category;

// --- Conteneur produits ---
const container = document.querySelector('.products-container');
let filteredProducts = products.filter(p => p.category === category || category === "Tous les produits");

// --- Affichage produits ---
function displayProducts(list) {
    container.innerHTML = "";
    list.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">
                <span class="current-price">${product.price}</span> 
                ${product.oldPrice ? `<span class="old-price">${product.oldPrice}</span>` : ""}
            </p>
            <button class="buy-btn">Ajouter au panier</button>
        `;
        container.appendChild(card);
    });
    attachBuyEvents();
}

// --- Firestore Panier ---
async function saveCartToFirestore(cart) {
    if (!currentUserUID) return;
    const ref = doc(db, "carts", currentUserUID);
    await setDoc(ref, { items: cart });
}

async function getCartFromFirestore() {
    if (!currentUserUID) return [];
    const ref = doc(db, "carts", currentUserUID);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().items || [] : [];
}

// --- Panier localStorage + Firestore ---
async function getCart() {
    const local = JSON.parse(localStorage.getItem('cart') || '[]');
    const remote = await getCartFromFirestore();
    const combined = [...remote, ...local.filter(l => !remote.find(r => r.name === l.name))];
    localStorage.setItem('cart', JSON.stringify(combined));
    return combined;
}

async function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    await saveCartToFirestore(cart);
}

// --- Ajouter au panier ---
async function addToCart(product) {
    if (!currentUserUID) return alert("Connectez-vous pour ajouter au panier !");
    const cart = await getCart();
    cart.push(product);
    await saveCart(cart);
    updateCartIndicator();
}

// --- Indicateur panier ---
async function updateCartIndicator() {
    const cart = await getCart();
    const panierLink = document.querySelector('a[href="panier.html"]');
    if (!panierLink) return;
    let point = panierLink.querySelector('.cart-indicator');
    if (cart.length > 0) {
        if (!point) {
            point = document.createElement('span');
            point.classList.add('cart-indicator');
            panierLink.appendChild(point);
        }
    } else if (point) point.remove();
}

// --- Popup ajout panier ---
function showAddPopup(productName) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.classList.add('popup-overlay');
        const popup = document.createElement('div');
        popup.classList.add('popup-contact');
        popup.innerHTML = `
            <h2>${productName} ajouté au panier !</h2>
            <p>Que souhaitez-vous faire ?</p>
            <div class="popup-actions">
                <button id="continueBtn">Continuer vos achats</button>
                <button id="goCartBtn">Commander</button>
            </div>
        `;
        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        document.getElementById('continueBtn').addEventListener('click', () => { overlay.remove(); resolve('continue'); });
        document.getElementById('goCartBtn').addEventListener('click', () => { overlay.remove(); resolve('cart'); });
    });
}

// --- Boutons produits ---
function attachBuyEvents() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            const card = e.target.closest('.product-card');
            const name = card.querySelector('h3').innerText;
            const price = card.querySelector('.current-price').innerText;
            const image = card.querySelector('img').src;
            await addToCart({ name, price, image });

            const action = await showAddPopup(name);
            if (action === 'cart') window.location.href = 'panier.html';
        });
    });
}

// --- Filtrage barre de recherche ---
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-bar button');
function filterProducts() {
    const query = searchInput.value.toLowerCase();
    const filtered = filteredProducts.filter(p => p.name.toLowerCase().includes(query));
    displayProducts(filtered);
}
searchInput.addEventListener('input', filterProducts);
searchButton.addEventListener('click', filterProducts);

// --- Initialisation ---
document.addEventListener('DOMContentLoaded', () => {
    displayProducts(filteredProducts);

    onAuthStateChanged(auth, user => {
        if (user) {
            currentUserUID = user.uid;
            getCart().then(updateCartIndicator);
        } else {
            alert("Connectez-vous pour utiliser le panier !");
        }
    });
});
