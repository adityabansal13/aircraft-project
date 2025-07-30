// Simulation variables
let playerAircraft = null;
let enemyAircraft = null;
let simulationSpeed = 1;
let simulationLog = [];
let currentFunctionalityIndex = 0; // Track which functionality is being executed
let functionalityInProgress = false; // Prevent overlapping actions

// Aircraft state tracking
let playerState = {
    hasMissiles: true,
    hasFlares: true,
    hasBombs: true,
    isUnderAttack: false,
    enemyInRange: false,
    lastAttackTime: 0,
    attackCooldown: 2000, // 2 seconds
    defensiveMode: false,
    aggressiveMode: false
};

let enemyState = {
    hasMissiles: true,
    hasFlares: true,
    isUnderAttack: false,
    lastAttackTime: 0,
    attackCooldown: 2500, // 2.5 seconds
    defensiveMode: false
};

// Decision-making rules
const combatRules = {
    // If aircraft doesn't have missiles, deploy flares and use bombs
    noMissilesRule: (aircraft) => {
        if (!aircraft.hasMissiles && aircraft.isUnderAttack) {
            return 'deployflares';
        }
        return null;
    },
    
    // Attack when there's a window of opportunity
    attackWindowRule: (aircraft, enemy) => {
        const distance = Math.sqrt(
            Math.pow(aircraft.position.x - enemy.position.x, 2) +
            Math.pow(aircraft.position.y - enemy.position.y, 2)
        );
        
        if (distance < 30 && !enemy.isUnderAttack && Date.now() - aircraft.lastAttackTime > aircraft.attackCooldown) {
            return aircraft.hasMissiles ? 'missilenavigation' : 'bombdrop';
        }
        return null;
    },
    
    // Defensive maneuver when under attack
    defensiveRule: (aircraft) => {
        if (aircraft.isUnderAttack && aircraft.hasFlares) {
            return 'deployflares';
        }
        return null;
    },
    
    // Target lock when enemy is detected
    targetLockRule: (aircraft, enemy) => {
        const distance = Math.sqrt(
            Math.pow(aircraft.position.x - enemy.position.x, 2) +
            Math.pow(aircraft.position.y - enemy.position.y, 2)
        );
        
        if (distance < 40 && enemy.status === 'active') {
            return 'targetlock';
        }
        return null;
    },
    
    // Enemy detection priority
    detectionRule: (aircraft, enemy) => {
        if (enemy.status === 'active' && !aircraft.enemyInRange) {
            return 'enemydetection';
        }
        return null;
    },
    
    // Navigation when not in combat
    navigationRule: (aircraft, enemy) => {
        const distance = Math.sqrt(
            Math.pow(aircraft.position.x - enemy.position.x, 2) +
            Math.pow(aircraft.position.y - enemy.position.y, 2)
        );
        
        if (distance > 50) {
            return 'navigate';
        }
        return null;
    }
};

// Dynamic behavior tree generation
function generateBehaviorTree(functionalities, isPlayer = true) {
    if (!functionalities || functionalities.length === 0) {
        return { root: { type: 'action', name: 'idle' } };
    }

    const rootNode = {
        type: 'sequence',
        children: functionalities.map(func => ({
            type: 'action',
            name: func.id,
            // Add a condition if you want conditional execution
        })),
    };

    return { root: rootNode };
}

// Execute behavior tree
function executeBehaviorTree(tree, aircraft, enemy, isPlayer = true) {
    return executeNode(tree.root, aircraft, enemy, isPlayer);
}

function executeNode(node, aircraft, enemy, isPlayer) {
    switch (node.type) {
        case "selector":
            for (const child of node.children) {
                const result = executeNode(child, aircraft, enemy, isPlayer);
                if (result) return result;
            }
            return null;
            
        case "sequence":
            for (const child of node.children) {
                const result = executeNode(child, aircraft, enemy, isPlayer);
                if (!result) return null;
            }
            return true;
            
        case "condition":
            return node.condition();
            
        case "action":
            return executeAction(node.name, aircraft, enemy, isPlayer);
            
        default:
            return null;
    }
}

function executeAction(actionName, aircraft, enemy, isPlayer) {
    const now = Date.now();
    
    switch (actionName) {
        case 'deployflares':
            if (aircraft.hasFlares && aircraft.isUnderAttack) {
                logMessage(`${isPlayer ? 'Player' : 'Enemy'} aircraft deploying flares`, isPlayer ? 'player' : 'enemy');
                aircraft.lastAction = 'deployflares';
                aircraft.isUnderAttack = false;
                return true;
            }
            break;
            
        case 'missilenavigation':
            if (aircraft.hasMissiles && now - aircraft.lastAttackTime > aircraft.attackCooldown) {
                logMessage(`${isPlayer ? 'Player' : 'Enemy'} aircraft firing missile`, isPlayer ? 'player' : 'enemy');
                enemy.health -= 10;
                aircraft.lastAction = 'missilenavigation';
                aircraft.lastAttackTime = now;
                enemy.isUnderAttack = true;
                return true;
            }
            break;
            
        case 'bombdrop':
            if (aircraft.hasBombs && now - aircraft.lastAttackTime > aircraft.attackCooldown) {
                logMessage(`${isPlayer ? 'Player' : 'Enemy'} aircraft dropping bomb`, isPlayer ? 'player' : 'enemy');
                enemy.health -= 15;
                aircraft.lastAction = 'bombdrop';
                aircraft.lastAttackTime = now;
                enemy.isUnderAttack = true;
                return true;
            }
            break;
            
        case 'targetlock':
            logMessage(`${isPlayer ? 'Player' : 'Enemy'} aircraft locked onto target`, isPlayer ? 'player' : 'enemy');
            aircraft.lastAction = 'targetlock';
            return true;
            
        case 'enemydetection':
            logMessage(`${isPlayer ? 'Player' : 'Enemy'} aircraft detected enemy`, isPlayer ? 'player' : 'enemy');
            aircraft.lastAction = 'enemydetection';
            aircraft.enemyInRange = true;
            return true;
            
        case 'navigate':
            logMessage(`${isPlayer ? 'Player' : 'Enemy'} aircraft navigating`, isPlayer ? 'player' : 'enemy');
            aircraft.lastAction = 'navigate';
            return true;
            
        case 'takeoff':
            logMessage(`${isPlayer ? 'Player' : 'Enemy'} aircraft taking off`, isPlayer ? 'player' : 'enemy');
            aircraft.lastAction = 'takeoff';
            return true;
    }
    
    return false;
}

// Update aircraft states based on combat situation
function updateAircraftStates() {
    const distance = Math.sqrt(
        Math.pow(playerAircraft.position.x - enemyAircraft.position.x, 2) +
        Math.pow(playerAircraft.position.y - enemyAircraft.position.y, 2)
    );
    
    // Update player state
    playerState.enemyInRange = distance < 40;
    playerState.isUnderAttack = enemyAircraft.lastAction === 'missilenavigation' || enemyAircraft.lastAction === 'bombdrop';
    
    // Update enemy state
    enemyState.isUnderAttack = playerAircraft.lastAction === 'missilenavigation' || playerAircraft.lastAction === 'bombdrop';
    
    // Dynamic mode switching based on health and situation
    if (playerAircraft.health < 30) {
        playerState.defensiveMode = true;
        playerState.aggressiveMode = false;
    } else if (distance < 20 && playerState.hasMissiles) {
        playerState.aggressiveMode = true;
        playerState.defensiveMode = false;
    } else {
        playerState.defensiveMode = false;
        playerState.aggressiveMode = false;
    }
    
    // Enemy mode switching
    if (enemyAircraft.health < 30) {
        enemyState.defensiveMode = true;
    } else if (distance < 25 && enemyState.hasMissiles) {
        enemyState.defensiveMode = false;
    }
    
    // Simulate weapon depletion (more realistic)
    if (Math.random() < 0.03) { // 3% chance per update
        if (Math.random() < 0.6) {
            if (playerState.hasMissiles) {
                playerState.hasMissiles = false;
                logMessage('Player aircraft out of missiles - switching to bombs', 'system');
            }
        } else {
            if (playerState.hasFlares) {
                playerState.hasFlares = false;
                logMessage('Player aircraft out of flares - vulnerable to attacks', 'system');
            }
        }
    }
    
    if (Math.random() < 0.02) { // 2% chance per update
        if (Math.random() < 0.7) {
            if (enemyState.hasMissiles) {
                enemyState.hasMissiles = false;
                logMessage('Enemy aircraft out of missiles', 'system');
            }
        } else {
            if (enemyState.hasFlares) {
                enemyState.hasFlares = false;
                logMessage('Enemy aircraft out of flares', 'system');
            }
        }
    }
    
    // Log strategic decisions
    if (playerState.defensiveMode && !playerState.defensiveModeLogged) {
        logMessage('Player aircraft switching to defensive mode', 'system');
        playerState.defensiveModeLogged = true;
    } else if (!playerState.defensiveMode && playerState.defensiveModeLogged) {
        logMessage('Player aircraft switching to normal mode', 'system');
        playerState.defensiveModeLogged = false;
    }
    
    if (playerState.aggressiveMode && !playerState.aggressiveModeLogged) {
        logMessage('Player aircraft switching to aggressive mode', 'system');
        playerState.aggressiveModeLogged = true;
    } else if (!playerState.aggressiveMode && playerState.aggressiveModeLogged) {
        logMessage('Player aircraft switching to normal mode', 'system');
        playerState.aggressiveModeLogged = false;
    }
}

async function initializeSimulation(functionalities) {
    try {
        // Get enemy aircraft data
        const response = await fetch('/api/get_enemy_aircraft');
        const result = await response.json();
        
        if (result.success) {
            enemyAircraft = {
                ...result.enemy,
                position: { x: 80, y: 10 },
                health: 100,
                status: 'active',
                lastAction: null
            };
            window.enemyAircraftObj = enemyAircraft;
        }
        
        // Initialize player aircraft
        playerAircraft = {
            functionalities: functionalities,
            position: { x: 10, y: 80 },
            health: 100,
            status: 'active',
            lastAction: null
        };
        window.playerAircraftObj = playerAircraft;
        
        // Initialize aircraft states
        Object.assign(playerState, {
            hasMissiles: true,
            hasFlares: true,
            hasBombs: true,
            isUnderAttack: false,
            enemyInRange: false,
            lastAttackTime: 0,
            defensiveMode: false,
            aggressiveMode: false
        });
        
        Object.assign(enemyState, {
            hasMissiles: true,
            hasFlares: true,
            isUnderAttack: false,
            lastAttackTime: 0,
            defensiveMode: false
        });
        
        // Clear simulation log
        document.getElementById('simulationLog').innerHTML = '';
        simulationLog = [];
        
        logMessage('Player aircraft initialized with intelligent behavior tree', 'player');
        logMessage('Enemy aircraft detected', 'enemy');
        
    } catch (error) {
        console.error('Error initializing simulation:', error);
        logMessage('Error initializing simulation', 'system');
    }
}

function updateSimulation() {
    if (!isSimulationRunning) return;
    
    // Update aircraft positions
    updateAircraftPositions();
    
    // Update aircraft states based on combat situation
    updateAircraftStates();
    
    // Check for combat scenarios
    checkCombatScenarios();
    
    // Execute intelligent behavior trees
    executePlayerBehaviorTree();
    executeEnemyBehaviorTree();
    
    // Check win/lose conditions
    checkSimulationEnd();
}

function updateAircraftPositions() {
    const playerElement = document.getElementById('playerAircraft');
    const enemyElement = document.getElementById('enemyAircraft');
    
    // Simple movement towards each other
    if (playerAircraft.status === 'active' && enemyAircraft.status === 'active') {
        const dx = enemyAircraft.position.x - playerAircraft.position.x;
        const dy = enemyAircraft.position.y - playerAircraft.position.y;
        
        // Move player aircraft
        if (Math.abs(dx) > 5) {
            playerAircraft.position.x += dx > 0 ? 1 : -1;
        }
        if (Math.abs(dy) > 5) {
            playerAircraft.position.y += dy > 0 ? 1 : -1;
        }
        
        // Move enemy aircraft
        enemyAircraft.position.x += dx > 0 ? -0.5 : 0.5;
        enemyAircraft.position.y += dy > 0 ? 0.5 : -0.5;
    }
    
    // Update visual positions
    playerElement.style.left = playerAircraft.position.x + '%';
    playerElement.style.bottom = (100 - playerAircraft.position.y) + '%';
    
    enemyElement.style.right = (100 - enemyAircraft.position.x) + '%';
    enemyElement.style.top = enemyAircraft.position.y + '%';
}

function executePlayerFunctionalities() {
    selectedFunctionalities.forEach(func => {
        switch(func.id) {
            case 'takeoff':
                if (Math.random() < 0.1) {
                    logMessage('Player aircraft taking off', 'player');
                }
                break;
            case 'navigate':
                if (Math.random() < 0.2) {
                    logMessage('Player aircraft navigating', 'player');
                }
                break;
            case 'targetlock':
                if (Math.random() < 0.3) {
                    logMessage('Player aircraft locked onto target', 'player');
                }
                break;
            case 'enemydetection':
                if (Math.random() < 0.25) {
                    logMessage('Player aircraft detected enemy', 'player');
                }
                break;
            case 'missilenavigation':
                if (Math.random() < 0.15) {
                    logMessage('Player aircraft firing missile', 'player');
                    enemyAircraft.health -= 10;
                }
                break;
            case 'deployflares':
                if (Math.random() < 0.2) {
                    logMessage('Player aircraft deploying flares', 'player');
                }
                break;
            case 'bombdrop':
                if (Math.random() < 0.1) {
                    logMessage('Player aircraft dropping bomb', 'player');
                    enemyAircraft.health -= 15;
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
                    }
                    break;
                case 'missilenavigation':
                    if (Math.random() < 0.2) {
                        logMessage('Enemy aircraft firing missile', 'enemy');
                        playerAircraft.health -= 8;
                    }
                    break;
                case 'deployflares':
                    if (Math.random() < 0.25) {
                        logMessage('Enemy aircraft deploying flares', 'enemy');
                    }
                    break;
            }
        }
    });
}

function checkCombatScenarios() {
    const distance = Math.sqrt(
        Math.pow(playerAircraft.position.x - enemyAircraft.position.x, 2) +
        Math.pow(playerAircraft.position.y - enemyAircraft.position.y, 2)
    );
    
    if (distance < 20) {
        if (Math.random() < 0.1) {
            logMessage('Aircraft engaged in close combat', 'system');
        }
    }
}

function checkSimulationEnd() {
    if (playerAircraft.health <= 0) {
        playerAircraft.status = 'destroyed';
        logMessage('Player aircraft destroyed - Mission Failed', 'system');
        stopSimulation();
    } else if (enemyAircraft.health <= 0) {
        enemyAircraft.status = 'destroyed';
        logMessage('Enemy aircraft destroyed - Mission Success', 'system');
        stopSimulation();
    }
}

function logMessage(message, type) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    const logContainer = document.getElementById('simulationLog');
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    simulationLog.push({
        timestamp,
        message,
        type
    });
    
    // Update behavior tree status display
    updateBehaviorTreeStatus();
}

function updateBehaviorTreeStatus() {
    const statusContainer = document.getElementById('behaviorTreeStatus');
    if (!statusContainer) return;
    
    const distance = Math.sqrt(
        Math.pow(playerAircraft.position.x - enemyAircraft.position.x, 2) +
        Math.pow(playerAircraft.position.y - enemyAircraft.position.y, 2)
    );
    
    const playerStatus = `
        <div class="status-section">
            <h4>Player Aircraft Status:</h4>
            <p>Missiles: ${playerState.hasMissiles ? 'Available' : 'Depleted'}</p>
            <p>Flares: ${playerState.hasFlares ? 'Available' : 'Depleted'}</p>
            <p>Bombs: ${playerState.hasBombs ? 'Available' : 'Depleted'}</p>
            <p>Under Attack: ${playerState.isUnderAttack ? 'Yes' : 'No'}</p>
            <p>Enemy in Range: ${playerState.enemyInRange ? 'Yes' : 'No'}</p>
            <p>Mode: ${playerState.defensiveMode ? 'Defensive' : playerState.aggressiveMode ? 'Aggressive' : 'Normal'}</p>
            <p>Distance to Enemy: ${Math.round(distance)} units</p>
            <p>Health: ${playerAircraft.health}%</p>
        </div>
    `;
    
    const enemyStatus = `
        <div class="status-section">
            <h4>Enemy Aircraft Status:</h4>
            <p>Missiles: ${enemyState.hasMissiles ? 'Available' : 'Depleted'}</p>
            <p>Flares: ${enemyState.hasFlares ? 'Available' : 'Depleted'}</p>
            <p>Under Attack: ${enemyState.isUnderAttack ? 'Yes' : 'No'}</p>
            <p>Mode: ${enemyState.defensiveMode ? 'Defensive' : 'Normal'}</p>
            <p>Health: ${enemyAircraft.health}%</p>
        </div>
    `;
    
    const decisionMaking = `
        <div class="status-section">
            <h4>Intelligent Decision Making:</h4>
            <p>Behavior Tree: Active</p>
            <p>Priority System: ${getCurrentPriority()}</p>
            <p>Last Decision: ${getLastDecision()}</p>
            <p>Next Action: ${getNextAction()}</p>
        </div>
    `;
    
    statusContainer.innerHTML = playerStatus + enemyStatus + decisionMaking;
}

function logBehaviorTreeUpdate(message) {
    logMessage(message, 'system');
}

function getCurrentPriority() {
    if (playerAircraft.health < 20) return "Emergency Defense";
    if (playerState.isUnderAttack && playerState.hasFlares) return "Defensive Maneuver";
    if (playerState.aggressiveMode && playerState.hasMissiles) return "Aggressive Attack";
    if (playerState.enemyInRange && Date.now() - playerState.lastAttackTime > playerState.attackCooldown) return "Attack Window";
    if (playerState.enemyInRange) return "Target Acquisition";
    if (enemyAircraft.status === 'active') return "Enemy Detection";
    return "Navigation";
}

function getLastDecision() {
    if (playerAircraft.lastAction) {
        return playerAircraft.lastAction.charAt(0).toUpperCase() + playerAircraft.lastAction.slice(1);
    }
    return "None";
}

function getNextAction() {
    const distance = Math.sqrt(
        Math.pow(playerAircraft.position.x - enemyAircraft.position.x, 2) +
        Math.pow(playerAircraft.position.y - enemyAircraft.position.y, 2)
    );
    
    if (playerAircraft.health < 20) return "Deploy Flares (Emergency)";
    if (playerState.isUnderAttack && playerState.hasFlares) return "Deploy Flares (Defense)";
    if (playerState.aggressiveMode && distance < 25 && playerState.hasMissiles) return "Fire Missile (Aggressive)";
    if (distance < 30 && Date.now() - playerState.lastAttackTime > playerState.attackCooldown) {
        return playerState.hasMissiles ? "Fire Missile" : "Drop Bomb";
    }
    if (distance < 40) return "Target Lock";
    if (enemyAircraft.status === 'active') return "Enemy Detection";
    if (distance > 50) return "Navigate";
    return "Takeoff";
}

function executePlayerBehaviorTree() {
    if (functionalityInProgress) return;
    
    // Generate behavior tree based on current situation
    const behaviorTree = generateBehaviorTree(playerAircraft.functionalities, true);
    
    // Execute the behavior tree
    const actionExecuted = executeBehaviorTree(behaviorTree, playerState, enemyAircraft, true);
    
    if (actionExecuted) {
        functionalityInProgress = true;
        setTimeout(() => {
            functionalityInProgress = false;
        }, 1000);
    }
}

function executeEnemyBehaviorTree() {
    if (enemyAircraft.status !== 'active') return;
    
    // Generate behavior tree for enemy
    const behaviorTree = generateBehaviorTree(enemyAircraft.functionalities, false);
    
    // Execute the behavior tree
    executeBehaviorTree(behaviorTree, enemyState, playerAircraft, false);
}
