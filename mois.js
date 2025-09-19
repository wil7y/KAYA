// Import Firebase
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

// Config Firebase
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

// Fonction pour sauvegarder le panier dans Firestore
async function saveCartToFirestore(cart) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const ref = doc(db, "carts", user.uid);
    await setDoc(ref, { items: cart });
    console.log("Panier sauvegardé dans Firestore !");
  } catch (err) {
    console.error("Erreur Firestore:", err);
  }
}

// Gestion du panier
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Créer le pop-up
function showPopup(productName) {
  // Supprimer un ancien popup si présent
  const existing = document.querySelector('.cart-popup');
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.className = "cart-popup";
  popup.innerHTML = `
    <p>✅ "${productName}" a été ajouté au panier !</p>
    <button id="go-cart">Aller au panier</button>
    <button id="continue-shop">Continuer vos achats</button>
  `;
  document.body.appendChild(popup);

  // Animation
  popup.style.opacity = 0;
  popup.style.transition = "0.3s ease";
  setTimeout(() => popup.style.opacity = 1, 10);

  document.getElementById("go-cart").addEventListener("click", () => {
    window.location.href = "panier.html";
  });
  document.getElementById("continue-shop").addEventListener("click", () => {
    popup.style.opacity = 0;
    setTimeout(() => popup.remove(), 300);
  });
}

// Événement click sur "Commander"
document.querySelectorAll(".btn-order").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const card = btn.closest(".card");

    const name = card.querySelector("h2")?.textContent || "Produit";
    const image = card.querySelector("img")?.src || "placeholder.jpg";
    const priceEl = card.querySelector(".price") || card.querySelector(".current-price");
    const price = priceEl ? priceEl.textContent.trim() : "0 FCFA";

    const product = {
      name,
      image,
      price,
      quantity: 1
    };

    // Ajouter au panier
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));

    // Sauvegarder dans Firestore si connecté
    await saveCartToFirestore(cart);

    // Afficher le pop-up
    showPopup(product.name);
  });
});

// Vérification connexion
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Utilisateur connecté:", user.email);
  } else {
    console.log("Utilisateur non connecté");
  }
});
