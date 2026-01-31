// CONFIGURACIÓN FIREBASE (Reemplaza con tus datos de Firebase Console)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    databaseURL: "https://TU_PROYECTO.firebaseio.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = localStorage.getItem('finanx_user');
let financeHistory = [];
let myChart = null;

// Lógica de Inicio de Sesión
document.getElementById('login-btn').onclick = async () => {
    const name = document.getElementById('user-name').value.trim().toLowerCase();
    const pin = document.getElementById('user-pin').value;

    if (name && pin.length === 4) {
        document.getElementById('preloader').style.display = 'flex';
        
        // Verificamos o creamos usuario en Firebase
        const userRef = db.ref('users/' + name);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        if (userData) {
            if (userData.pin === pin) {
                loginSuccess(name);
            } else {
                alert("Security Error: Invalid PIN.");
                location.reload();
            }
        } else {
            // Registro de nuevo usuario
            await userRef.set({ pin: pin, history: [] });
            loginSuccess(name);
        }
    } else {
        alert("Enter Name and 4-digit PIN.");
    }
};

function loginSuccess(name) {
    localStorage.setItem('finanx_user', name);
    currentUser = name;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('welcome-user').innerText = `Hola, ${name.toUpperCase()}`;
    loadData();
    document.getElementById('preloader').style.display = 'none';
}

// Carga de datos desde el Servidor
async function loadData() {
    db.ref('users/' + currentUser + '/history').on('value', (snapshot) => {
        financeHistory = snapshot.val() || [];
        if (financeHistory.length > 0) {
            const last = financeHistory[financeHistory.length - 1];
            updateCounters(last.income, last.expenses, last.savings);
        }
        refreshVisuals();
    });
}

async function runAnalysis() {
    const inc = parseFloat(document.getElementById('income').value) || 0;
    const exp = parseFloat(document.getElementById('gastos').value) || 0;
    if (inc <= 0) return;

    const entry = {
        date: new Date().toISOString(),
        income: inc,
        expenses: exp,
        savings: inc * 0.20
    };

    financeHistory.push(entry);
    // Guardado Seguro en el Servidor
    await db.ref('users/' + currentUser + '/history').set(financeHistory);
    updateCounters(inc, exp, entry.savings);
}

function updateCounters(i, e, s) {
    document.getElementById('display-income').innerText = `$${i.toLocaleString()}`;
    document.getElementById('display-expenses').innerText = `$${e.toLocaleString()}`;
    document.getElementById('display-savings').innerText = `$${s.toLocaleString()}`;
}

function checkAffordability() {
    const cost = parseFloat(document.getElementById('item-cost').value) || 0;
    const last = financeHistory[financeHistory.length - 1];
    if (!last) return;

    const effort = (cost / last.income).toFixed(1);
    const totalSav = financeHistory.reduce((acc, curr) => acc + curr.savings, 0);

    const container = document.getElementById('verdict-container');
    container.style.display = 'block';
    document.getElementById('effort-count').innerHTML = `Labor Cost: <strong>${effort} months</strong> of your life.`;
    document.getElementById('verdict-advice').innerText = totalSav >= cost 
        ? "Purchase is SAFE using your Cloud Reserve." 
        : "UNSAFE: More saving required.";
}

// Gráficos y UI
function refreshVisuals() {
    const type = document.getElementById('chart-type').value;
    const ctx = document.getElementById('financeChart').getContext('2d');
    if (myChart) myChart.destroy();

    const recent = financeHistory.slice(-6);
    myChart = new Chart(ctx, {
        type: type,
        data: {
            labels: recent.map(i => new Date(i.date).toLocaleDateString()),
            datasets: [{ label: 'Outflow', data: recent.map(i => i.expenses), backgroundColor: '#ff4d4d' },
                       { label: 'Reserve', data: recent.map(i => i.savings), backgroundColor: '#D4AF37' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Handlers
document.getElementById('calculate-btn').onclick = runAnalysis;
document.getElementById('affordability-btn').onclick = checkAffordability;
document.getElementById('logout-btn').onclick = () => { localStorage.clear(); location.reload(); };
window.addEventListener('load', () => { if(currentUser) loginSuccess(currentUser); else document.getElementById('preloader').style.display='none'; });