import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// --- Config Firebase ---
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

// --- Popup login ---
const loginPopup = document.getElementById('login-popup');
const loginForm = document.getElementById('admin-login-form');
const closePopup = document.getElementById('close-popup');
const logoutBtn = document.getElementById('logout-btn');
const adminContent = document.getElementById('admin-content');

closePopup.addEventListener('click', () => loginPopup.style.display = 'none');

// --- Login admin ---
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;

  try {
    // Déconnexion si un utilisateur est connecté
    if(auth.currentUser) await signOut(auth);
    await signInWithEmailAndPassword(auth, email, password);
    loginPopup.style.display = 'none';
    alert(`Bienvenue, ${email}`);
  } catch(err) {
    console.error(err);
    alert("Email ou mot de passe incorrect !");
  }
});

// --- Vérification connexion ---
onAuthStateChanged(auth, user => {
  if(!user) loginPopup.style.display = 'flex';
  else adminContent.innerHTML = "<p>Sélectionnez une section à gauche pour voir les données.</p>";
});

// --- Navigation dashboard ---
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', async () => {
    const section = btn.dataset.section;
    adminContent.innerHTML = `<p>Chargement ${section}...</p>`;

    if(section === 'orders'){
      // Récupérer toutes les commandes
      const ordersCol = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersCol);
      let html = '';
      ordersSnapshot.forEach(doc => {
        const data = doc.data();
        data.items.forEach(order => {
          html += `<div style="margin-bottom:15px; padding:10px; border-bottom:1px solid #444;">
                     <strong>Date:</strong> ${order.date} ${order.time} | 
                     <strong>Montant:</strong> ${order.amount} | 
                     <strong>Contact:</strong> ${order.contact}
                   </div>`;
        });
      });
      adminContent.innerHTML = html || "<p>Aucune commande trouvée.</p>";
    } else if(section === 'users'){
      // Ici on peut récupérer les avis/messages utilisateurs

      const avisCol = collection(db, 'testimonials');
      const avisSnapshot = await getDocs(avisCol);
      let html = '';
      avisSnapshot.forEach(doc => {
        const data = doc.data();
 data.items.forEach(order => {
          html += `<div style="margin-bottom:15px; padding:10px; border-bottom:1px solid #444;">
                     <strong>Date:</strong> ${order.user}| 
                     <strong>Message:</strong> ${order.message} 
                    
                   </div>`;
        });
      });
      adminContent.innerHTML = html || "<p>Aucun contact trouvé.</p>";
    
 
    } else if(section === 'contacts'){
      // Récupérer contacts/messages
      const contactsCol = collection(db, 'contacts');
      const contactsSnapshot = await getDocs(contactsCol);
      let html = '';
      contactsSnapshot.forEach(doc => {
        const data = doc.data();
        html += `<div style="margin-bottom:15px; padding:10px; border-bottom:1px solid #444;">
                   <strong>${data.name}</strong> (${data.email})<br>
                   <strong>Sujet:</strong> ${data.subject}<br>
                   <strong>Message:</strong> ${data.message}
                 </div>`;
      });
      adminContent.innerHTML = html || "<p>Aucun contact trouvé.</p>";
    }
  });
});

// --- Déconnexion ---
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  alert("Vous êtes déconnecté !");
  loginPopup.style.display = 'flex';
});
