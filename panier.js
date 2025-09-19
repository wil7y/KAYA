import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// --- Initialisation Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyBZEdkns9h6f7cDTo5E_7xdsGKGkoFmN9w",
  authDomain: "ecommerce-5ced7.firebaseapp.com",
  projectId: "ecommerce-5ced7",
  storageBucket: "ecommerce-5ced7.appspot.com",
  messagingSenderId: "527505769374",
  appId: "1:527505769374:web:274a9c3184a313d8778c8f",
  measurementId: "G-WKNBS4S6LK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserUID = null;
let currentUserName = null;

// ---------------- PANIER ----------------

// Récupérer le panier depuis Firestore
async function getCart(uid) {
    const ref = doc(db, "carts", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().items || [] : [];
}

// Sauvegarder le panier dans Firestore + localStorage
async function saveCart(uid, cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    const ref = doc(db, "carts", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        await updateDoc(ref, { items: cart });
    } else {
        await setDoc(ref, { items: cart });
    }
}

// Ajouter un produit au panier
async function addToCart(product) {
    if (!currentUserUID) return alert("Connectez-vous !");
    const cart = await getCart(currentUserUID);
    cart.push(product);
    await saveCart(currentUserUID, cart);
    await displayCart(currentUserUID);
    await updateCartIndicator(currentUserUID);
}

// Supprimer un produit du panier
async function removeFromCart(productName) {
    if (!currentUserUID) return;
    const cart = await getCart(currentUserUID);
    const newCart = cart.filter(item => item.name !== productName);
    await saveCart(currentUserUID, newCart);
    await displayCart(currentUserUID);
    await updateCartIndicator(currentUserUID);
}

// Afficher le panier
async function displayCart(uid) {
    const container = document.querySelector('.cart-container');
    const summary = document.querySelector('.cart-summary h2');
    if (!container || !summary) return;

    container.innerHTML = "";
    const cart = await getCart(uid);

    if (cart.length === 0) {
        summary.innerText = "Total: 0 FCFA";
        container.innerHTML = "<p>Votre panier est vide.</p>";
        return;
    }

    let total = 0;
cart.forEach(item => {
    const priceNumber = item.price ? parseInt(item.price.replace(/\D/g,'')) || 0 : 0;
    total += priceNumber;

    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
        <div class="item-image">
            <img src="${item.image || 'load.webp'}" alt="${item.name}">
        </div>
        <div class="item-details">
            <h2>${item.name}</h2>
            <p>Quantité: ${item.quantity}</p>
            <p>Prix: ${item.price}</p>
        </div>
        <div class="item-remove">
            <button data-name="${item.name}">Supprimer</button>
        </div>
    `;
    container.appendChild(div);
});


    summary.innerText = `Total: ${total} FCFA`;

    // Ajouter événements suppression
    document.querySelectorAll('.item-remove button').forEach(btn => {
        btn.addEventListener('click', e => {
            const name = e.target.dataset.name;
            removeFromCart(name);
        });
    });
}

// Indicateur panier (icône avec point)
async function updateCartIndicator(uid) {
    const cart = await getCart(uid);
    const panierLink = document.querySelector('a[href="panier.html"]');
    if (!panierLink) return;

    let point = panierLink.querySelector('.cart-indicator');
    if (cart.length > 0) {
        if (!point) {
            point = document.createElement('span');
            point.classList.add('cart-indicator');
            panierLink.appendChild(point);
        }
    } else {
        if (point) point.remove();
    }
}

// Checkout / passer commande
function requestContact() {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.classList.add('popup-overlay');
        const popup = document.createElement('div');
        popup.classList.add('popup-contact');
        popup.innerHTML = `
            <h2>Finaliser votre livraison</h2>
            <p>Indiquez votre WhatsApp ou Email :</p>
            <input type="text" id="contactInput" placeholder="WhatsApp ou Email">
            <div class="popup-actions">
                <button id="popupCancel">Annuler</button>
                <button id="popupConfirm">Confirmer</button>
            </div>
        `;
        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        document.getElementById('popupCancel').addEventListener('click', () => { overlay.remove(); resolve(null); });
        document.getElementById('popupConfirm').addEventListener('click', () => {
            const contact = document.getElementById('contactInput').value.trim();
            if (!contact) { alert("Veuillez entrer un contact !"); return; }
            overlay.remove();
            resolve(contact);
        });
    });
}

async function checkout() {
    if (!currentUserUID) return alert("Connectez-vous !");
    const cart = await getCart(currentUserUID);
    if (cart.length === 0) return alert("Votre panier est vide !");

    const contact = await requestContact();
    if (!contact) return;

    let total = 0;
    cart.forEach(item => total += parseInt(item.price.replace(/\D/g,'')) || 0);

    const orderData = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        amount: total + " FCFA",
        status: "En attente",
        contact,
        products: cart
    };

    const ordersRef = doc(db, "orders", currentUserUID);
    const ordersSnap = await getDoc(ordersRef);
    if (ordersSnap.exists()) {
        await updateDoc(ordersRef, { items: arrayUnion(orderData) });
    } else {
        await setDoc(ordersRef, { items: [orderData] });
    }

    await saveCart(currentUserUID, []);
    await displayCart(currentUserUID);
    await updateCartIndicator(currentUserUID);

    alert("Commande passée avec succès !");
}

// ---------------- INIT ----------------
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("⚠️ Vous devez vous connecter !");
            window.location.href = "index.html";
            return;
        }

        currentUserUID = user.uid;
        currentUserName = user.displayName || user.email;

        await displayCart(currentUserUID);
        await updateCartIndicator(currentUserUID);

        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);

        // Boutons Ajouter au panier
        document.querySelectorAll('.buy-btn, .product-card button').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.product-card');
                if (!card) return;
                const name = card.querySelector('h3')?.innerText;
                const priceEl = card.querySelector('.current-price') || card.querySelector('.price');
                const price = priceEl ? priceEl.innerText.trim() : '';
                if (!name || !price) return;

                addToCart({ name, price });
            });
        });
    });
});
