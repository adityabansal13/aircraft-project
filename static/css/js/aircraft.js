// Aircraft behavior and animation logic
class Aircraft {
    constructor(element, functionalities) {
        this.element = element;
        this.functionalities = functionalities || [];
        this.position = { x: 0, y: 0 };
        this.health = 100;
        this.status = 'active';
        this.animations = new Map();
        
        this.initializeAnimations();
    }
    
    initializeAnimations() {
        // Create animation effects for different functionalities
        this.animations.set('takeoff', () => this.animateTakeoff());
        this.animations.set('navigate', () => this.animateNavigation());
        this.animations.set('targetlock', () => this.animateTargetLock());
        this.animations.set('missilenavigation', () => this.animateMissile());
        this.animations.set('deployflares', () => this.animateFlares());
        this.animations.set('bombdrop', () => this.animateBombDrop());
        this.animations.set('enemydetection', () => this.animateRadar());
    }
    
    animateTakeoff() {
        this.element.style.transform = 'translateY(-10px) scale(1.1)';
        setTimeout(() => {
            this.element.style.transform = 'translateY(0) scale(1)';
        }, 500);
    }
    
    animateNavigation() {
        this.element.style.transform = 'rotate(5deg)';
        setTimeout(() => {
            this.element.style.transform = 'rotate(-5deg)';
        }, 250);
        setTimeout(() => {
            this.element.style.transform = 'rotate(0deg)';
        }, 500);
    }
    
    animateTargetLock() {
        this.element.style.boxShadow = '0 0 20px #ff0000';
        setTimeout(() => {
            this.element.style.boxShadow = 'none';
        }, 1000);
    }
    
    animateMissile() {
        // Find enemy aircraft element
        const enemyElement = document.getElementById('enemyAircraft');
        if (!enemyElement) return;
        // Get bounding rectangles
        const playerRect = this.element.getBoundingClientRect();
        const enemyRect = enemyElement.getBoundingClientRect();
        // Calculate relative position
        const dx = enemyRect.left - playerRect.left;
        const dy = enemyRect.top - playerRect.top;
        // Create missile
        const missile = document.createElement('div');
        missile.className = 'missile';
        missile.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            width: 4px;
            height: 20px;
            background: #ff4444;
            border-radius: 2px;
            transform: translate(-50%, -50%);
            transition: all 0.7s linear;
            z-index: 20;
        `;
        this.element.appendChild(missile);
        setTimeout(() => {
            missile.style.transform = `translate(${dx}px, ${dy}px)`;
            missile.style.opacity = '0';
        }, 50);
        setTimeout(() => {
            missile.remove();
        }, 800);
    }
    
    animateFlares() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const flare = document.createElement('div');
                flare.className = 'flare';
                flare.style.cssText = `
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: #ffaa00;
                    border-radius: 50%;
                    animation: flarefall 1s linear forwards;
                `;
                
                this.element.appendChild(flare);
                
                setTimeout(() => {
                    flare.remove();
                }, 1000);
            }, i * 100);
        }
    }
    
    animateBombDrop() {
        // Find enemy aircraft element
        const enemyElement = document.getElementById('enemyAircraft');
        if (!enemyElement) return;
        // Get bounding rectangles
        const playerRect = this.element.getBoundingClientRect();
        const enemyRect = enemyElement.getBoundingClientRect();
        // Calculate relative position (drop vertically to enemy)
        const dx = enemyRect.left - playerRect.left;
        const dy = enemyRect.top - playerRect.top;
        // Create bomb
        const bomb = document.createElement('div');
        bomb.className = 'bomb';
        bomb.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            width: 10px;
            height: 10px;
            background: #333;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: all 1s cubic-bezier(0.4, 1.5, 0.5, 1);
            z-index: 20;
        `;
        this.element.appendChild(bomb);
        setTimeout(() => {
            bomb.style.transform = `translate(${dx}px, ${dy}px)`;
            bomb.style.opacity = '0';
        }, 50);
        setTimeout(() => {
            bomb.remove();
        }, 1100);
    }
    
    animateRadar() {
        const radar = document.createElement('div');
        radar.className = 'radar';
        radar.style.cssText = `
            position: absolute;
            width: 50px;
            height: 50px;
            border: 2px solid #00ff00;
            border-radius: 50%;
            animation: radarsweep 2s linear infinite;
            top: -25px;
            left: -25px;
        `;
        
        this.element.appendChild(radar);
        
        setTimeout(() => {
            radar.remove();
        }, 2000);
    }
    
    executeFunctionality(funcId) {
        const animation = this.animations.get(funcId);
        if (animation) {
            animation();
        }
        // Add realistic movement for takeoff and navigation
        if (funcId === 'takeoff') {
            // Move up visually
            this.updatePosition(this.position.x, this.position.y + 10);
        } else if (funcId === 'navigate') {
            // Move toward enemy (for demo, move right)
            this.updatePosition(this.position.x + 20, this.position.y);
        }
    }
    
    updatePosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.element.style.left = x + '%';
        this.element.style.bottom = y + '%';
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.status = 'destroyed';
            this.element.style.opacity = '0.3';
            this.element.style.transform = 'rotate(45deg)';
        }
    }
}

// CSS animations for aircraft effects
const aircraftAnimations = `
    @keyframes flarefall {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(50px); opacity: 0; }
    }
    
    @keyframes radarsweep {
        0% { transform: rotate(0deg) scale(1); opacity: 1; }
        100% { transform: rotate(360deg) scale(1.5); opacity: 0; }
    }
    
    @keyframes missile-trail {
        0% { transform: translateX(0); opacity: 1; }
        100% { transform: translateX(200px); opacity: 0; }
    }
    
    .aircraft-container {
        position: relative;
        overflow: visible;
    }
    
    .missile, .flare, .bomb {
        z-index: 10;
        pointer-events: none;
    }
    
    .radar {
        z-index: 5;
        pointer-events: none;
    }
`;

// Add animations to page
const style = document.createElement('style');
style.textContent = aircraftAnimations;
document.head.appendChild(style);

// Export Aircraft class
window.Aircraft = Aircraft;
