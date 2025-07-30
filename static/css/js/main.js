// Global variables

// Ensure event listeners for Pause and Stop buttons
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('pauseSimulation').addEventListener('click', pauseSimulation);
    document.getElementById('stopSimulation').addEventListener('click', stopSimulation);
});

// Visual effects for functionalities
function showAircraftActions() {
    const playerElement = document.getElementById('playerAircraft');
    const enemyElement = document.getElementById('enemyAircraft');

    // Missile fire
    if (playerAircraft.lastAction === 'missilenavigation') {
        playerElement.classList.add('fire-missile');
        setTimeout(() => playerElement.classList.remove('fire-missile'), 500);
    }
    if (enemyAircraft.lastAction === 'missilenavigation') {
        enemyElement.classList.add('fire-missile');
        setTimeout(() => enemyElement.classList.remove('fire-missile'), 500);
    }
    // Flares
    if (playerAircraft.lastAction === 'deployflares') {
        playerElement.classList.add('deploy-flares');
        setTimeout(() => playerElement.classList.remove('deploy-flares'), 500);
    }
    if (enemyAircraft.lastAction === 'deployflares') {
        enemyElement.classList.add('deploy-flares');
        setTimeout(() => enemyElement.classList.remove('deploy-flares'), 500);
    }
    // Bomb drop
    if (playerAircraft.lastAction === 'bombdrop') {
        playerElement.classList.add('drop-bomb');
        setTimeout(() => playerElement.classList.remove('drop-bomb'), 500);
    }
    if (enemyAircraft.lastAction === 'bombdrop') {
        enemyElement.classList.add('drop-bomb');
        setTimeout(() => enemyElement.classList.remove('drop-bomb'), 500);
    }
}

// Update simulation loop to call showAircraftActions
function updateSimulation() {
    if (!isSimulationRunning) return;
    updateAircraftPositions();
    showAircraftActions();
    // The simulation.js now handles intelligent behavior trees
}

// Set lastAction for each functionality
function executePlayerFunctionalities() {
    selectedFunctionalities.forEach(func => {
        switch(func.id) {
            case 'takeoff':
                if (Math.random() < 0.1) {
                    logMessage('Player aircraft taking off', 'player');
                    playerAircraft.lastAction = 'takeoff';
                }
                break;
            case 'navigate':
                if (Math.random() < 0.2) {
                    logMessage('Player aircraft navigating', 'player');
                    playerAircraft.lastAction = 'navigate';
                }
                break;
            case 'targetlock':
                if (Math.random() < 0.3) {
                    logMessage('Player aircraft locked onto target', 'player');
                    playerAircraft.lastAction = 'targetlock';
                }
                break;
            case 'enemydetection':
                if (Math.random() < 0.25) {
                    logMessage('Player aircraft detected enemy', 'player');
                    playerAircraft.lastAction = 'enemydetection';
                }
                break;
            case 'missilenavigation':
                if (Math.random() < 0.15) {
                    logMessage('Player aircraft firing missile', 'player');
                    enemyAircraft.health -= 10;
                    playerAircraft.lastAction = 'missilenavigation';
                }
                break;
            case 'deployflares':
                if (Math.random() < 0.2) {
                    logMessage('Player aircraft deploying flares', 'player');
                    playerAircraft.lastAction = 'deployflares';
                }
                break;
            case 'bombdrop':
                if (Math.random() < 0.1) {
                    logMessage('Player aircraft dropping bomb', 'player');
                    enemyAircraft.health -= 15;
                    playerAircraft.lastAction = 'bombdrop';
                }
                break;
        }
    });
}

function executeEnemyFunctionalities() {
    if (enemyAircraft.status !== 'active') return;
    const enemyFuncs = enemyAircraft.functionalities || [];
    enemyFuncs.forEach(func => {
        if (func.active) {
            switch(func.id) {
                case 'enemydetection':
                    if (Math.random() < 0.3) {
                        logMessage('Enemy aircraft detected player', 'enemy');
                        enemyAircraft.lastAction = 'enemydetection';
                    }
                    break;
                case 'missilenavigation':
                    if (Math.random() < 0.15) {
                        logMessage('Enemy aircraft firing missile', 'enemy');
                        playerAircraft.health -= 10;
                        enemyAircraft.lastAction = 'missilenavigation';
                    }
                    break;
                case 'deployflares':
                    if (Math.random() < 0.2) {
                        logMessage('Enemy aircraft deploying flares', 'enemy');
                        enemyAircraft.lastAction = 'deployflares';
                    }
                    break;
                case 'bombdrop':
                    if (Math.random() < 0.1) {
                        logMessage('Enemy aircraft dropping bomb', 'enemy');
                        playerAircraft.health -= 15;
                        enemyAircraft.lastAction = 'bombdrop';
                    }
                    break;
            }
        }
    });
}

// ...rest of your simulation.js code...

let selectedFunctionalities = [];
let isSimulationRunning = false;
let simulationInterval;
let playerAircraftObj = null; // Add this to reference the Aircraft class
window.playerAircraftObj = null; // Expose globally for simulation.js

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DRDO Aircraft System - Initializing...');
    initializeEventListeners();
    loadAircraftList();
    // Create Aircraft object for player
    const playerElement = document.getElementById('playerAircraft');
    playerAircraftObj = new Aircraft(playerElement, selectedFunctionalities);
    window.playerAircraftObj = playerAircraftObj;
    logBehaviorTreeUpdate('New aircraft created with default behavior tree.');

    // Event listener for creating a new aircraft
    document.getElementById('create-new-aircraft').addEventListener('click', async () => {
        const playerElement = document.getElementById('player-aircraft');
        if (!playerElement) {
            console.error('Player aircraft element not found.');
            return;
        }

        try {
            // Create a new aircraft instance with default functionalities
        } catch (error) {
            console.error('Error creating new aircraft:', error);
        }
    });
});

function initializeEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Functionality selection - This is the key fix
    const functionalityItems = document.querySelectorAll('.functionality-item');
    console.log('Found functionality items:', functionalityItems.length);
    
    functionalityItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('Functionality clicked:', item.dataset.func);
            toggleFunctionality(item);
        });
    });
    
    // Control buttons
    const saveBtn = document.getElementById('saveAircraft');
    const loadBtn = document.getElementById('loadAircraft');
    const fileInput = document.getElementById('loadAircraftFileInput');
    const simulationBtn = document.getElementById('startSimulation');
    const clearBtn = document.getElementById('clearAll');
    
    if (saveBtn) saveBtn.addEventListener('click', saveAircraft);
    if (loadBtn && fileInput) {
        loadBtn.addEventListener('click', function() {
            fileInput.value = '';
            fileInput.click();
        });
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = JSON.parse(evt.target.result);
                    if (Array.isArray(data.functionalities)) {
                        selectedFunctionalities = data.functionalities;
                        // Update UI
                        updateSelectedFunctionalities();
                        updateAircraftDisplay();
                        // Mark selected in toolbox
                        const functionalityItems = document.querySelectorAll('.functionality-item');
                        functionalityItems.forEach(item => {
                            const funcId = item.dataset.func;
                            if (selectedFunctionalities.some(f => f.id === funcId)) {
                                item.classList.add('selected');
                            } else {
                                item.classList.remove('selected');
                            }
                        });
                        alert('Aircraft configuration loaded!');
                    } else {
                        alert('Invalid file format.');
                    }
                } catch (err) {
                    alert('Error reading file: ' + err.message);
                }
            };
            reader.readAsText(file);
        });
    }
    if (simulationBtn) simulationBtn.addEventListener('click', startSimulation);
    if (clearBtn) clearBtn.addEventListener('click', clearAllFunctionalities);
    
    console.log('Event listeners initialized successfully');
}

function toggleFunctionality(item) {
    const funcId = item.dataset.func;
    const funcName = item.querySelector('span').textContent;
    const icon = item.querySelector('i').className;
    
    console.log('Toggling functionality:', funcId, funcName);
    
    if (item.classList.contains('selected')) {
        // Remove functionality
        item.classList.remove('selected');
        selectedFunctionalities = selectedFunctionalities.filter(f => f.id !== funcId);
        console.log('Removed functionality:', funcId);
    } else {
        // Add functionality
        item.classList.add('selected');
        selectedFunctionalities.push({
            id: funcId,
            name: funcName,
            icon: icon
        });
        console.log('Added functionality:', funcId);
    }
    
    // Update displays
    updateSelectedFunctionalities();
    updateAircraftDisplay();
    
    console.log('Current functionalities:', selectedFunctionalities);
}

function updateSelectedFunctionalities() {
    const selectedList = document.getElementById('selectedFunctionalities');
    if (!selectedList) {
        console.error('selectedFunctionalities element not found');
        return;
    }
    
    selectedList.innerHTML = '';
    
    selectedFunctionalities.forEach(func => {
        const item = document.createElement('div');
        item.className = 'selected-item';
        item.innerHTML = `
            <i class="${func.icon}"></i>
            <span>${func.name}</span>
        `;
        selectedList.appendChild(item);
    });
    
    console.log('Updated selected functionalities list');
}

function updateAircraftDisplay() {
    const indicators = document.getElementById('functionalityIndicators');
    if (!indicators) {
        console.error('functionalityIndicators element not found');
        return;
    }
    // Clear existing indicators
    indicators.innerHTML = '';
    // Add new indicators for each selected functionality
    selectedFunctionalities.forEach((func, index) => {
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        indicator.style.animationDelay = `${index * 0.1}s`; // Stagger animations
        indicator.innerHTML = `
            <i class="${func.icon}"></i>
            <span>${func.name}</span>
        `;
        indicators.appendChild(indicator);
    });
    // Update aircraft SVG overlay icons
    updateAircraftFunctionalityIcons();
    console.log('Updated aircraft display with', selectedFunctionalities.length, 'indicators');
}

function updateAircraftFunctionalityIcons() {
    const iconMap = {
        'takeoff': { icon: 'fas fa-plane-departure', class: 'aircraft-icon-takeoff' },
        'navigate': { icon: 'fas fa-route', class: 'aircraft-icon-engine' },
        'targetlock': { icon: 'fas fa-crosshairs', class: 'aircraft-icon-target' },
        'deployflares': { icon: 'fas fa-fire', class: 'aircraft-icon-flare' },
        'bombdrop': { icon: 'fas fa-bomb', class: 'aircraft-icon-bomb' },
        'enemydetection': { icon: 'fas fa-radar', class: 'aircraft-icon-radar' },
        'missilenavigation': { icon: 'fas fa-rocket', class: 'aircraft-icon-missile' }
    };
    const container = document.getElementById('aircraftFunctionalityIcons');
    if (!container) return;
    container.innerHTML = '';
    selectedFunctionalities.forEach(f => {
        const map = iconMap[f.id];
        if (map) {
            const el = document.createElement('i');
            el.className = `${map.icon} aircraft-functionality-icon ${map.class}`;
            el.title = f.name;
            container.appendChild(el);
        }
    });
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const functionalityItems = document.querySelectorAll('.functionality-item');
    
    functionalityItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function clearAllFunctionalities() {
    selectedFunctionalities = [];
    
    // Remove selected class from all items
    const functionalityItems = document.querySelectorAll('.functionality-item');
    functionalityItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    updateSelectedFunctionalities();
    updateAircraftDisplay();
    console.log('All functionalities cleared');
}

// Rest of your existing functions...
async function saveAircraft() {
    if (selectedFunctionalities.length === 0) {
        alert('Please select at least one functionality before saving.');
        return;
    }
    
    const aircraftName = prompt('Enter aircraft name:') || `Aircraft_${Date.now()}`;
    
    try {
        const response = await fetch('/api/save_aircraft', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: aircraftName,
                functionalities: selectedFunctionalities
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Aircraft saved successfully! ID: ${result.aircraft_id}`);
            loadAircraftList();
        } else {
            alert('Error saving aircraft: ' + result.error);
        }
    } catch (error) {
        console.error('Error saving aircraft:', error);
        alert('Error saving aircraft. Please try again.');
    }
}

async function loadAircraftList() {
    try {
        const response = await fetch('/api/list_aircraft');
        const result = await response.json();
        
        if (result.success && result.aircraft) {
            console.log('Aircraft list loaded:', result.aircraft);
        }
    } catch (error) {
        console.error('Error loading aircraft list:', error);
    }
}

function showLoadModal() {
    const modal = document.getElementById('loadModal');
    if (modal) {
        modal.style.display = 'block';
        loadAircraftList();
    }
}

// When starting simulation, update playerAircraftObj functionalities
function startSimulation() {
    if (selectedFunctionalities.length === 0) {
        alert('Please configure your aircraft before starting simulation.');
        return;
    }
    
    isSimulationRunning = true;
    document.getElementById('simulationPanel').classList.add('active');
    document.getElementById('simulationPanel').style.display = 'block';
    
    initializeSimulation(selectedFunctionalities).then(() => {
        if (simulationInterval) clearInterval(simulationInterval);
        simulationInterval = setInterval(updateSimulation, 1000 / simulationSpeed);
        logMessage('Simulation started', 'system');
    });
}

function updateHealthBars() {
    const playerBar = document.getElementById('playerHealthBar');
    const enemyBar = document.getElementById('enemyHealthBar');
    if (playerBar && window.playerAircraftObj) {
        const percent = Math.max(0, Math.min(100, window.playerAircraftObj.health));
        playerBar.style.width = percent + '%';
    }
    if (enemyBar && window.enemyAircraftObj) {
        const percent = Math.max(0, Math.min(100, window.enemyAircraftObj.health));
        enemyBar.style.width = percent + '%';
    }
}
function updateStatusLabels() {
    const playerStatus = document.getElementById('playerStatus');
    const enemyStatus = document.getElementById('enemyStatus');
    if (playerStatus && window.playerAircraftObj) {
        playerStatus.textContent = 'Status: ' + (window.playerAircraftObj.status || 'Active');
    }
    if (enemyStatus && window.enemyAircraftObj) {
        enemyStatus.textContent = 'Status: ' + (window.enemyAircraftObj.status || 'Active');
    }
}
function showMissionBanner(text, success) {
    const banner = document.getElementById('missionBanner');
    if (!banner) return;
    banner.textContent = text;
    banner.style.display = 'block';
    banner.style.background = success ? 'rgba(39, 174, 96, 0.95)' : 'rgba(231, 76, 60, 0.95)';
    setTimeout(() => { banner.style.display = 'none'; }, 3500);
}
function addBattlefieldEffect(type) {
    const effects = document.getElementById('battlefieldEffects');
    if (!effects) return;
    let el = document.createElement('div');
    if (type === 'missile') {
        el.className = 'effect-missile';
        el.style = 'position:absolute;left:120px;top:120px;width:40px;height:8px;background:#e67e22;border-radius:4px;box-shadow:0 0 16px #e67e22;animation: missile-fly 0.7s linear;';
    } else if (type === 'bomb') {
        el.className = 'effect-bomb';
        el.style = 'position:absolute;left:160px;top:160px;width:18px;height:18px;background:#333;border-radius:50%;box-shadow:0 0 16px #333;animation: bomb-drop 1s linear;';
    } else if (type === 'explosion') {
        el.className = 'effect-explosion';
        el.style = 'position:absolute;left:170px;top:120px;width:40px;height:40px;background:radial-gradient(circle,#f1c40f 0%,#e67e22 60%,#e74c3c 100%);border-radius:50%;opacity:0.8;animation: explosion-pop 0.7s linear;';
    }
    effects.appendChild(el);
    setTimeout(() => { el.remove(); }, 900);
}
// Add keyframes for effects
const effectStyles = document.createElement('style');
effectStyles.textContent = `
@keyframes missile-fly { 0%{left:120px;} 100%{left:320px;} }
@keyframes bomb-drop { 0%{top:160px;} 100%{top:320px;} }
@keyframes explosion-pop { 0%{transform:scale(0.5);} 100%{transform:scale(1.2);opacity:0;} }
`;
document.head.appendChild(effectStyles);
// Manual controls
function setupManualControls() {
    const missileBtn = document.getElementById('manualMissile');
    const bombBtn = document.getElementById('manualBomb');
    const flaresBtn = document.getElementById('manualFlares');
    const radarBtn = document.getElementById('manualRadar');
    const replayBtn = document.getElementById('manualReplay');
    if (missileBtn) missileBtn.onclick = () => {
        addBattlefieldEffect('missile');
        logMessage('Manual: Fired missile!', 'player');
        if (window.enemyAircraftObj) {
            window.enemyAircraftObj.health = Math.max(0, window.enemyAircraftObj.health - 40);
            updateHealthBars();
            if (window.enemyAircraftObj.health === 0) {
                window.enemyAircraftObj.status = 'destroyed';
                updateStatusLabels();
                showMissionBanner('Enemy aircraft destroyed - Mission Success', true);
            }
        }
    };
    if (bombBtn) bombBtn.onclick = () => {
        addBattlefieldEffect('bomb');
        logMessage('Manual: Dropped bomb!', 'player');
        if (window.enemyAircraftObj) {
            window.enemyAircraftObj.health = Math.max(0, window.enemyAircraftObj.health - 50);
            updateHealthBars();
            if (window.enemyAircraftObj.health === 0) {
                window.enemyAircraftObj.status = 'destroyed';
                updateStatusLabels();
                showMissionBanner('Enemy aircraft destroyed - Mission Success', true);
            }
        }
    };
    if (flaresBtn) flaresBtn.onclick = () => { addBattlefieldEffect('explosion'); logMessage('Manual: Deployed flares!', 'player'); };
    if (radarBtn) radarBtn.onclick = () => { logMessage('Manual: Radar scan!', 'player'); };
    if (replayBtn) replayBtn.onclick = () => { showMissionBanner('Replay not implemented yet!', false); };
}
document.addEventListener('DOMContentLoaded', setupManualControls);
// Update health/status after each simulation step
setInterval(() => { updateHealthBars(); updateStatusLabels(); }, 400);
// Show mission banner on win/lose
window.showMissionBanner = showMissionBanner;

