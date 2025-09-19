// -------------------- 🔥 Firebase --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc,  updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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

// -------------------- Slider --------------------
const slider = document.querySelector('.categories-slider');
let isScrolling = false;
let ScrollSpeed = 10;
let delayAfeterInteraction = 2000;

let autoScroll = setInterval(() => {
    if (!isScrolling) {
        slider.scrollLeft += ScrollSpeed;
        if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth) slider.scrollLeft = 0;
        if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth) slider.scrollTo({left: 0, behavior: "smooth"});
    }
}, 20);

slider.addEventListener('mousedown', () => { isScrolling = true; });
slider.addEventListener('touchstart', () => { isScrolling = true; });
slider.addEventListener('mouseup', () => { setTimeout(() => { isScrolling = false; }, delayAfeterInteraction); });
slider.addEventListener('touchend', () => { setTimeout(() => { isScrolling = false; }, delayAfeterInteraction); });

// -------------------- Témoignages --------------------
const testimonials = document.querySelectorAll(".testimonial");
let index = 0;
function showTestimonial() {
    testimonials.forEach(t => t.style.opacity = 0);
    testimonials[index].style.opacity = 1;
    index = (index + 1) % testimonials.length;
}
showTestimonial();
setInterval(showTestimonial, 3000);

// -------------------- FAQ --------------------
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener("click", () => {
        const faqItem = button.parentElement;
        faqItem.classList.toggle("active");
        const answer = faqItem.querySelector(".faq-answer");
        answer.style.maxHeight = faqItem.classList.contains("active") ? answer.scrollHeight + "px" : null;
    });
});

// -------------------- Auth modal --------------------
const modal = document.getElementById("authModal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const userDisplay = document.getElementById("userDisplay");
const logoutBtn = document.getElementById("logoutBtn");

openBtn.addEventListener("click", (e) => { e.preventDefault(); modal.style.display = "flex"; });
closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

loginTab.addEventListener("click", () => {
    loginTab.classList.add("active"); registerTab.classList.remove("active");
    loginForm.classList.add("active"); registerForm.classList.remove("active");
});
registerTab.addEventListener("click", () => {
    registerTab.classList.add("active"); loginTab.classList.remove("active");
    registerForm.classList.add("active"); loginForm.classList.remove("active");
});

// -------------------- Firebase Auth Users --------------------
async function saveUserProfile(uid, name, email) {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { name, email, createdAt: new Date() });
}

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPass").value;
    const confirmPass = document.getElementById("regConfirm").value;

    if (!name || !email || !password || !confirmPass) return alert("Veuillez remplir tous les champs !");
    if (password !== confirmPass) return alert("Les mots de passe ne correspondent pas !");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserProfile(userCredential.user.uid, name, email);
        alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        registerForm.reset();
        loginTab.click();
    } catch (error) {
        alert(error.message);
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value;

    if (!email || !password) return alert("Veuillez remplir tous les champs !");
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert(`Bienvenue ${userCredential.user.email} !`);
        modal.style.display = "none";
        loginForm.reset();
    } catch (error) {
        alert(error.message);
    }
});

logoutBtn?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        alert("Déconnecté avec succès !");
        updateUserDisplay(null);
    } catch (error) {
        alert(error.message);
    }
});

onAuthStateChanged(auth, (user) => {
    updateUserDisplay(user);
    updateCartIndicator(user ? user.uid : null);
});

function updateUserDisplay(user) {
    if (!userDisplay) return;
    userDisplay.textContent = user ? `Connecté : ${user.email}` : '';
}

// -------------------- Recherche Produits --------------------
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-bar button');
const productCards = document.querySelectorAll('.product-card');

function filterProducts() {
    const query = searchInput.value.toLowerCase();
    productCards.forEach(card => {
        const productName = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = productName.includes(query) ? 'block' : 'none';
    });
}
searchInput.addEventListener('input', filterProducts);
searchButton.addEventListener('click', filterProducts);

// -------------------- Panier (Firestore) --------------------
async function getCart(uid) {
    if (!uid) return [];
    const cartRef = doc(db, "carts", uid);
    const snap = await getDoc(cartRef);
    return snap.exists() ? snap.data().items : [];
}

async function saveCart(uid, items) {
    if (!uid) return;
    const cartRef = doc(db, "carts", uid);
    await setDoc(cartRef, { items });
}

function showConfirmation(message) {
    let popup = document.createElement('div');
    popup.classList.add('popup-confirmation');
    popup.innerText = message;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('fade-out'), 1500);
    popup.addEventListener('transitionend', () => popup.remove());
}

document.querySelectorAll('.buy-btn, .product-card button').forEach(button => {
    button.addEventListener('click', async (e) => {
        const productCard = e.target.closest('.product-card');
        if (!productCard) return;
        const name = productCard.querySelector('h3')?.innerText;
        const priceEl = productCard.querySelector('.current-price') || productCard.querySelector('.price');
        const price = priceEl ? priceEl.innerText.trim() : '';
        if (!name || !price) return;

        const user = auth.currentUser;
        if (!user) return alert("Vous devez être connecté pour ajouter au panier !");

        let cart = await getCart(user.uid);
        cart.push({ name, price });
        await saveCart(user.uid, cart);

        updateCartIndicator(user.uid);
        showConfirmation(`${name} a été ajouté au panier !`);
    });
});

async function updateCartIndicator(uid) {
    const panierLink = document.querySelector('a[href="panier.html"]');
    if (!panierLink) return;
    if (!uid) {
        const point = panierLink.querySelector('.cart-indicator');
        if (point) point.remove();
        return;
    }
    const cart = await getCart(uid);
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

let currentUserUID = null;
let currentUserName = null;

// --- Suivi connexion utilisateur ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUID = user.uid;
        currentUserName = user.displayName || user.email;
    } else {
        currentUserUID = null;
        currentUserName = null;
    }
});

// --- Formulaire avis ---
const testimonialForm = document.querySelector('.testimonial-form');
testimonialForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUserUID) {
        alert("Vous devez être connecté pour poster un avis !");
        return;
    }

    const input = testimonialForm.querySelector('input');
    const message = input.value.trim();
    if (!message) return;

    const testimonial = {
        user: currentUserName,
        uid: currentUserUID,
        message,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    };

    try {
        const ref = doc(db, "testimonials", "all"); // un document central pour tous les avis
        await updateDoc(ref, { items: arrayUnion(testimonial) })
            .catch(async (err) => {
                if (err.code === 'not-found') {
                    await setDoc(ref, { items: [testimonial] });
                } else {
                    throw err;
                }
            });

        alert("Merci pour votre avis !");
        input.value = ""; // reset input
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'avis:", error);
        alert("Impossible d'envoyer votre avis, réessayez plus tard.");
    }
});


