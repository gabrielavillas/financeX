// --- CONFIGURACIÓN DE DATOS LOCALES ---
let currentUser = localStorage.getItem('finanx_user');
let financeHistory = JSON.parse(localStorage.getItem('finanx_history')) || {}; 

// Lógica de Inicio de Sesión
document.getElementById('login-btn').onclick = () => {
    const name = document.getElementById('user-name').value.trim().toLowerCase();
    const pin = document.getElementById('user-pin').value;

    if (name && pin.length === 4) {
        document.getElementById('preloader').style.display = 'flex';
        
        // Simulación de base de datos local
        const savedUsers = JSON.parse(localStorage.getItem('finanx_registered_users')) || {};

        if (savedUsers[name]) {
            // Si el usuario existe, verificamos el PIN
            if (savedUsers[name] === pin) {
                loginSuccess(name);
            } else {
                alert("Security Error: Invalid PIN.");
                document.getElementById('preloader').style.display = 'none';
            }
        } else {
            // Registro de nuevo usuario en el navegador
            savedUsers[name] = pin;
            localStorage.setItem('finanx_registered_users', JSON.stringify(savedUsers));
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

// Carga de datos desde LocalStorage
function loadData() {
    const allHistory = JSON.parse(localStorage.getItem('finanx_history')) || {};
    financeHistory = allHistory[currentUser] || [];
    
    if (financeHistory.length > 0) {
        const last = financeHistory[financeHistory.length - 1];
        updateCounters(last.income, last.expenses, last.savings);
    }
    refreshVisuals();
}

async function runAnalysis() {
    const inc = parseFloat(document.getElementById('income').value) || 0;
    const exp = parseFloat(document.getElementById('gastos').value) || 0;
    if (inc <= 0) {
        alert("Please enter a valid income.");
        return;
    }

    const entry = {
        date: new Date().toISOString(),
        income: inc,
        expenses: exp,
        savings: inc * 0.20
    };

    // Obtener historial global y actualizar el del usuario actual
    const allHistory = JSON.parse(localStorage.getItem('finanx_history')) || {};
    if (!allHistory[currentUser]) allHistory[currentUser] = [];
    
    allHistory[currentUser].push(entry);
    financeHistory = allHistory[currentUser];

    // Guardar de nuevo en LocalStorage
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

function checkAffordability() {
    const cost = parseFloat(document.getElementById('item-cost').value) || 0;
    if (financeHistory.length === 0) {
        alert("No data available. Run an analysis first.");
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
    
    const type = document.getElementById('chart-type').value;
    const ctx = chartElement.getContext('2d');
    if (myChart) myChart.destroy();

    const recent = financeHistory.slice(-6);
    myChart = new Chart(ctx, {
        type: type,
        data: {
            labels: recent.map(i => new Date(i.date).toLocaleDateString()),
            datasets: [
                { label: 'Outflow (Expenses)', data: recent.map(i => i.expenses), backgroundColor: '#ff4d4d' },
                { label: 'Reserve (Savings)', data: recent.map(i => i.savings), backgroundColor: '#D4AF37' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Event Listeners
document.getElementById('calculate-btn').onclick = runAnalysis;
document.getElementById('affordability-btn').onclick = checkAffordability;
document.getElementById('logout-btn').onclick = () => { 
    localStorage.removeItem('finanx_user'); 
    location.reload(); 
};

// Auto-login si ya existe sesión
window.addEventListener('load', () => { 
    if(currentUser) {
        loginSuccess(currentUser); 
    } else {
        if(document.getElementById('preloader')) document.getElementById('preloader').style.display='none'; 
    }
});