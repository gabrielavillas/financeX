// --- CONFIGURACIÓN DE DATOS LOCALES (Sustituye a Firebase) ---
let currentUser = localStorage.getItem('finanx_user');
let financeHistory = [];
let myChart = null;

// Función para apagar el cargador manualmente si algo falla
const hidePreloader = () => {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';
};

// --- LÓGICA DE INICIO DE SESIÓN ---
document.getElementById('login-btn').onclick = () => {
    const name = document.getElementById('user-name').value.trim().toLowerCase();
    const pin = document.getElementById('user-pin').value;

    if (name && pin.length === 4) {
        // Mostrar carga brevemente para efecto visual
        document.getElementById('preloader').style.display = 'flex';
        
        // Base de datos de usuarios en LocalStorage
        const savedUsers = JSON.parse(localStorage.getItem('finanx_registered_users')) || {};

        setTimeout(() => {
            if (savedUsers[name]) {
                if (savedUsers[name] === pin) {
                    loginSuccess(name);
                } else {
                    alert("Security Error: Invalid PIN.");
                    hidePreloader();
                }
            } else {
                // Registro de nuevo usuario
                savedUsers[name] = pin;
                localStorage.setItem('finanx_registered_users', JSON.stringify(savedUsers));
                loginSuccess(name);
            }
        }, 800); // Pequeña demora para que parezca que consulta la nube
    } else {
        alert("Enter Name and 4-digit PIN.");
    }
};

function loginSuccess(name) {
    localStorage.setItem('finanx_user', name);
    currentUser = name;
    
    // Cambiar pantallas
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('welcome-user').innerText = `Hola, ${name.toUpperCase()}`;
    
    loadData();
    hidePreloader();
}

// --- MANEJO DE DATOS ---
function loadData() {
    const allHistory = JSON.parse(localStorage.getItem('finanx_history')) || {};
    financeHistory = allHistory[currentUser] || [];
    
    if (financeHistory.length > 0) {
        const last = financeHistory[financeHistory.length - 1];
        updateCounters(last.income, last.expenses, last.savings);
    } else {
        updateCounters(0, 0, 0);
    }
    refreshVisuals();
}

function runAnalysis() {
    const inc = parseFloat(document.getElementById('income').value) || 0;
    const exp = parseFloat(document.getElementById('gastos').value) || 0;

    if (inc <= 0) {
        alert("Por favor ingresa un ingreso válido.");
        return;
    }

    const entry = {
        date: new Date().toISOString(),
        income: inc,
        expenses: exp,
        savings: inc * 0.20
    };

    const allHistory = JSON.parse(localStorage.getItem('finanx_history')) || {};
    if (!allHistory[currentUser]) allHistory[currentUser] = [];
    
    allHistory[currentUser].push(entry);
    financeHistory = allHistory[currentUser];

    localStorage.setItem('finanx_history', JSON.stringify(allHistory));
    
    updateCounters(inc, exp, entry.savings);
    refreshVisuals();
    alert("Data Secured in Vault.");
}

function updateCounters(i, e, s) {
    document.getElementById('display-income').innerText = `$${i.toLocaleString()}`;
    document.getElementById('display-expenses').innerText = `$${e.toLocaleString()}`;
    document.getElementById('display-savings').innerText = `$${s.toLocaleString()}`;
}

// --- ANÁLISIS Y GRÁFICOS ---
function checkAffordability() {
    const cost = parseFloat(document.getElementById('item-cost').value) || 0;
    if (financeHistory.length === 0) {
        alert("Primero realiza un análisis de ingresos.");
        return;
    }
    
    const last = financeHistory[financeHistory.length - 1];
    const effort = (cost / last.income).toFixed(1);
    const totalSav = financeHistory.reduce((acc, curr) => acc + curr.savings, 0);

    const container = document.getElementById('verdict-container');
    container.style.display = 'block';
    document.getElementById('effort-count').innerHTML = `Labor Cost: <strong>${effort} months</strong> of your life.`;
    document.getElementById('verdict-advice').innerText = totalSav >= cost 
        ? "Purchase is SAFE using your Cloud Reserve." 
        : "UNSAFE: More saving required.";
}

function refreshVisuals() {
    const chartElement = document.getElementById('financeChart');
    if (!chartElement) return;
    
    const ctx = chartElement.getContext('2d');
    if (myChart) myChart.destroy();

    const recent = financeHistory.slice(-6);
    myChart = new Chart(ctx, {
        type: 'bar', // Puedes cambiarlo a 'line'
        data: {
            labels: recent.map(i => new Date(i.date).toLocaleDateString()),
            datasets: [
                { label: 'Gastos', data: recent.map(i => i.expenses), backgroundColor: '#ff4d4d' },
                { label: 'Ahorros', data: recent.map(i => i.savings), backgroundColor: '#D4AF37' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// --- BOTONES Y EVENTOS ---
document.getElementById('calculate-btn').onclick = runAnalysis;
document.getElementById('affordability-btn').onclick = checkAffordability;

document.getElementById('logout-btn').onclick = () => { 
    localStorage.removeItem('finanx_user'); 
    location.reload(); 
};

// Al cargar la página
window.onload = () => { 
    if(currentUser) {
        loginSuccess(currentUser); 
    } else {
        hidePreloader(); 
    }
};