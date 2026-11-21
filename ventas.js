// --- CONFIGURACIÓN ---
const CLAVE_SECRETA = 'MJ2026';
const SHEET_ID = '18gsvPp2HSMR0DKIfYfZijnwc_PyNV7ULch-UDEVupV0';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwaKJxY7JErnXQUYi_OCTuKmGjyBoxlPe-RRcM_XmSkYrwRic2EK7nYSDN-W8VmmiSN/exec';
const PHOTOS_FOLDER_ID = '1YLrFG-atDTRZdCConiuhAtsNXhax_nqN';
const SHEET_NAME = 'VENTAS';

const SESSION_KEY = 'mj_admin_last_activity';
const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hora

let allSales = [];
let keptImages = [];
let isSelectionMode = false;
let selectedIds = new Set();

// --- SESIÓN COMPARTIDA CON CIERRE POR INACTIVIDAD (1 HORA) ---
const authOverlay = document.getElementById('auth-overlay');
const pinInput = document.getElementById('admin-pin');
const btnUnlock = document.getElementById('btn-unlock');

let sessionInterval = null;
let lastWriteTime = 0;

function isSessionValid() {
    const last = Number(localStorage.getItem(SESSION_KEY) || 0);
    return last > 0 && (Date.now() - last) < INACTIVITY_LIMIT;
}

function refreshActivity() {
    if (authOverlay.style.display !== 'none') return;
    const now = Date.now();
    if (now - lastWriteTime > 15000) {
        localStorage.setItem(SESSION_KEY, String(now));
        lastWriteTime = now;
    }
}

function lockSession(byTimeout) {
    localStorage.removeItem(SESSION_KEY);
    if (sessionInterval) {
        clearInterval(sessionInterval);
        sessionInterval = null;
    }
    pinInput.value = '';
    authOverlay.style.display = 'flex';
    if (byTimeout) {
        alert('Tu sesión se cerró automáticamente tras 1 hora de inactividad.');
    }
}

function startSessionMonitor() {
    if (sessionInterval) clearInterval(sessionInterval);
    sessionInterval = setInterval(() => {
        if (!isSessionValid()) {
            lockSession(true);
        }
    }, 30000);
}

function unlockSales() {
    const now = Date.now();
    localStorage.setItem(SESSION_KEY, String(now));
    lastWriteTime = now;
    authOverlay.style.display = 'none';
    startSessionMonitor();
    loadSales();
}

['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(
