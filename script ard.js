const modal1 = document.getElementById('loginModal');
const closeBtn1 = document.getElementById('closeModal');

window.onload = function() {
    modal1.style.display = 'flex';
}

closeBtn1.onclick = function() {
    modal1.style.display = 'none';
}

window.onclick = function(e) {
    if (e.target == modal1) modal1.style.display = 'none';
}

const burger = document.getElementById('burger');
const sidebar = document.querySelector('.sidebar');

burger.addEventListener('click', () => {
    if ( sidebar.style.display === 'block') {
        sidebar.style.display = 'none';
    } else {
        sidebar.style.display = 'block';
    }
});

