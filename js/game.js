/**
 * 1982: Héroes de Malvinas - Game Engine
 * A 2D vertical scrolling arcade shooter inside an HTML5 Canvas.
 * Employs procedural vector drawings for military planes and naval ships,
 * smooth delta-time physics, particle systems, and retro mechanics.
 */

class MalvinasGame {
    constructor(canvas, onGameOver, onVictory) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onGameOver = onGameOver;
        this.onVictory = onVictory;
        
        // Game states
        this.active = false;
        this.score = 0;
        this.selectedPlaneIndex = 0;
        this.gameOverTriggered = false;
        this.victoryTriggered = false;
        
        // Timing
        this.lastTime = 0;
        
        // Screen bounds
        this.width = 600;
        this.height = 800;
        this.scale = 1;
        
        // Playable Argentine aircraft specs
        this.planesConfig = [
            {
                name: 'A-4B SKYHAWK',
                speed: 340,
                maxHp: 100,
                damage: 25,
                fireRate: 150, // ms between shots
                specialName: 'BOMBA DUX',
                specialDesc: 'Limpia la pantalla',
                specialType: 'bomb',
                color: '#6e806c', // Greenish camouflage
                draw: (ctx, x, y, size) => this.drawSkyhawk(ctx, x, y, size)
            },
            {
                name: 'SUPER ÉTENDARD',
                speed: 380,
                maxHp: 80,
                damage: 35,
                fireRate: 200,
                specialName: 'MISIL EXOCET',
                specialDesc: 'Misil teledirigido masivo',
                specialType: 'exocet',
                color: '#495a63', // Steel blue-gray
                draw: (ctx, x, y, size) => this.drawEtendard(ctx, x, y, size)
            },
            {
                name: 'IA-58 PUCARÁ',
                speed: 280,
                maxHp: 150,
                damage: 18,
                fireRate: 90,
                specialName: 'BARRIDO METRALLA',
                specialDesc: 'Cadencia x2 por 4s',
                specialType: 'overdrive',
                color: '#848d79', // Tactical foliage green
                draw: (ctx, x, y, size) => this.drawPucara(ctx, x, y, size)
            }
        ];
        
        // Input state
        this.keys = {};
        
        // Entities
        this.player = null;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.pickups = [];
        this.islands = [];
        this.clouds = [];
        
        // Level/Spawning parameters
        this.spawnTimer = 0;
        this.spawnInterval = 1200; // ms
        this.distanceCovered = 0;
        this.distanceLimit = 3000; // Overwritten by mission
        this.bossSpawned = false;
        
        // Pucará overdrive active state
        this.overdriveTimer = 0;

        // Historical Missions Configuration
        this.missions = [
            {
                id: 1,
                name: "MISIÓN 1: OPERACIÓN ROSARIO",
                date: "02 de Abril de 1982",
                desc: "Establece superioridad aérea sobre Puerto Argentino. Neutraliza patrullas aéreas del enemigo.",
                distanceLimit: 3000,
                weather: "clear",
                cliffs: false,
                bossType: "none",
                wingmanAllowed: false
            },
            {
                id: 2,
                name: "MISIÓN 2: BAUTISMO DE FUEGO",
                date: "01 de Mayo de 1982",
                desc: "Defiende los aeródromos interceptando incursiones de Sea Kings y Harriers pesados.",
                distanceLimit: 4000,
                weather: "overcast",
                cliffs: false,
                bossType: "heavy_squad",
                wingmanAllowed: false
            },
            {
                id: 3,
                name: "MISIÓN 3: ATAQUE AL HMS SHEFFIELD",
                date: "04 de Mayo de 1982",
                desc: "Incursión naval volando al ras del agua. Localiza y destruye al destructor HMS Sheffield.",
                distanceLimit: 4500,
                weather: "foggy",
                cliffs: false,
                bossType: "sheffield",
                wingmanAllowed: false
            },
            {
                id: 4,
                name: "MISIÓN 4: CALLEJÓN DE LAS BOMBAS",
                date: "21-25 de Mayo de 1982",
                desc: "Esquiva artillería y ataca fragatas volando a baja altura en el Estrecho de San Carlos.",
                distanceLimit: 5000,
                weather: "clear",
                cliffs: true,
                bossType: "sheffield_escorted",
                wingmanAllowed: true
            },
            {
                id: 5,
                name: "MISIÓN 5: BAHÍA AGRADABLE",
                date: "08 de Junio de 1982",
                desc: "Ataca buques de desembarco enemigos bajo una tempestad feroz en Pleasant Cove.",
                distanceLimit: 5500,
                weather: "storm",
                cliffs: true,
                bossType: "sir_galahad",
                wingmanAllowed: true
            },
            {
                id: 6,
                name: "MISIÓN 6: PORTAAVIONES HMS INVINCIBLE",
                date: "30 de Mayo de 1982",
                desc: "Asalto final de máxima dificultad. Hunde al portaaviones insignia británico.",
                distanceLimit: 7000,
                weather: "storm",
                cliffs: false,
                bossType: "invincible",
                wingmanAllowed: true
            }
        ];
        this.currentMissionId = 1;

        // Stage Titles (For classic display)
        this.stageTitles = {
            1: "ETAPA 1: OPERACIÓN ROSARIO - PATRULLA EN EL MAR",
            2: "ETAPA 2: ESTRECHO DE SAN CARLOS - INCURSIÓN NAVAL",
            3: "ETAPA 3: BAHÍA AGRADABLE - TEMPESTAD FINAL"
        };

        // Resize & initialize layers
        this.resize();
        this.initBackground();
        
        // Event listeners for game-loop keys
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault(); // Prevent page scroll
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    resize() {
        const parent = this.canvas.parentElement;
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        
        // Maintain vertical retro aspect ratio (3:4 or similar)
        let gameWidth = width;
        let gameHeight = width * (4 / 3);
        
        if (gameHeight > height) {
            gameHeight = height;
            gameWidth = height * (3 / 4);
        }
        
        this.canvas.width = gameWidth;
        this.canvas.height = gameHeight;
        
        this.scale = gameWidth / this.width;
        this.ctx.imageSmoothingEnabled = false;
    }

    initBackground() {
        this.islands = [];
        this.clouds = [];
        
        // Pre-generate static jagged procedural islands
        for (let i = 0; i < 5; i++) {
            const size = 35 + Math.random() * 55;
            const numVertices = 12 + Math.floor(Math.random() * 6);
            const vertices = [];
            const mountainVertices = [];
            
            // 1. Generate irregular coastline outline
            for (let j = 0; j < numVertices; j++) {
                const angle = (j / numVertices) * Math.PI * 2;
                // Add noise for a natural island coastline shape
                const r = size * (0.8 + Math.random() * 0.4);
                vertices.push({
                    ox: Math.cos(angle) * r,
                    oy: Math.sin(angle) * r
                });
            }
            
            // 2. Generate a mountain ridge scaling down the base contour
            vertices.forEach(v => {
                mountainVertices.push({
                    ox: v.ox * (0.35 + Math.random() * 0.15),
                    oy: v.oy * (0.35 + Math.random() * 0.15)
                });
            });
            
            // 3. Pre-seed green forest clusters
            const forestPoints = [];
            const numForests = 4 + Math.floor(Math.random() * 6);
            for (let f = 0; f < numForests; f++) {
                const angle = Math.random() * Math.PI * 2;
                const r = size * (0.2 + Math.random() * 0.5); // stays inside vegetation boundaries
                forestPoints.push({
                    ox: Math.cos(angle) * r,
                    oy: Math.sin(angle) * r,
                    size: 3 + Math.random() * 4
                });
            }

            this.islands.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: size,
                speed: 40 + Math.random() * 20,
                vertices: vertices,
                mountainVertices: mountainVertices,
                forestPoints: forestPoints,
                beachColor: '#c2b280', // Sandy gold beach
                landColor: '#45533c',  // Turf grass green
                mountainColor: '#545b56' // Rocky mountain grey
            });
        }
        
        // Pre-generate high clouds
        for (let i = 0; i < 4; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height - 200,
                width: 100 + Math.random() * 150,
                height: 50 + Math.random() * 50,
                speed: 70 + Math.random() * 40
            });
        }
    }

    start(planeIndex, difficulty = 'normal', missionId = 1) {
        this.selectedPlaneIndex = planeIndex;
        this.difficulty = difficulty;
        this.currentMissionId = parseInt(missionId) || 1;
        const config = this.planesConfig[planeIndex];
        
        // Grab current mission details
        const mission = this.missions.find(m => m.id === this.currentMissionId) || this.missions[0];
        
        // Define difficulty multipliers
        this.diffMult = {
            hp: 1.0,
            enemyBulletSpeed: 1.0,
            specialChargeRate: 1.0,
            spawnInterval: 1.0,
            enemyShootRate: 1.0
        };
        
        if (difficulty === 'easy') {
            this.diffMult.hp = 1.5;
            this.diffMult.enemyBulletSpeed = 0.7;
            this.diffMult.specialChargeRate = 1.5;
            this.diffMult.spawnInterval = 1.4;
            this.diffMult.enemyShootRate = 0.7;
        } else if (difficulty === 'hard') {
            this.diffMult.hp = 0.75;
            this.diffMult.enemyBulletSpeed = 1.35;
            this.diffMult.specialChargeRate = 0.65;
            this.diffMult.spawnInterval = 0.75;
            this.diffMult.enemyShootRate = 1.4;
        }
        
        this.score = 0;
        this.distanceCovered = 0;
        this.distanceLimit = mission.distanceLimit;
        this.bossSpawned = false;
        this.gameOverTriggered = false;
        this.victoryTriggered = false;
        
        // Stage Progression variables (statically assigned by mission)
        this.currentStage = 1;
        if (mission.cliffs) this.currentStage = 2;
        if (mission.weather === 'storm') this.currentStage = 3;
        
        this.stageTransitionTimer = 0;
        this.wingmanActive = false;
        this.wingmanSpawnedThisRun = false;
        this.wingman = null;
        this.lightningFlash = 0;
        this.rainParticles = [];
        this.coastlineTime = 0;
        this.lightningTimer = 4000; // interval in ms for random lightning in Stage 3
        
        // Setup Player with difficulty HP adjustment
        this.player = {
            x: this.width / 2,
            y: this.height - 120,
            hp: Math.round(config.maxHp * this.diffMult.hp),
            maxHp: Math.round(config.maxHp * this.diffMult.hp),
            speed: config.speed,
            specialCharge: 0, // 0 to 100
            shootCooldown: 0,
            weaponUpgrade: 1, // 1: Single, 2: Dual
            activeWeapon: 'standard', // 'standard', 'dual', 'spread', 'side', 'rear'
            weaponTimer: 0, // milliseconds remaining
            size: 32,
            invulnerable: 90, // frames at start
            shield: 0, // 1 when active, 0 when off
            active: true
        };
        
        // Reset lists
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.pickups = [];
        this.overdriveTimer = 0;
        
        this.active = true;
        this.lastTime = performance.now();
        
        if (window.audioEngine) {
            window.audioEngine.startBGM();
        }
        
        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.active = false;
        if (window.audioEngine) {
            window.audioEngine.stopBGM();
        }
    }

    loop(timestamp) {
        if (!this.active) return;
        
        // Calculate dt (seconds)
        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        // Cap dt to prevent huge jumps in lag spikes
        if (dt > 0.1) dt = 0.1;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // 1. If stage transition is freezing gameplay, only handle rain particles and timers
        if (this.stageTransitionTimer > 0) {
            this.stageTransitionTimer--;
            
            // Still update rain particles in background
            if (this.currentStage === 3) {
                this.rainParticles.forEach(p => {
                    p.y += p.speed * dt;
                    p.x -= 150 * dt;
                    if (p.y > this.height) {
                        p.y = -20;
                        p.x = Math.random() * (this.width + 100);
                    }
                });
            }
            return;
        }

        // Decrease player invulnerability
        if (this.player.invulnerable > 0) {
            this.player.invulnerable--;
        }
        
        // Update active weapon timer
        if (this.player.weaponTimer > 0) {
            this.player.weaponTimer -= dt * 1000;
            if (this.player.weaponTimer <= 0) {
                this.player.activeWeapon = 'standard';
            }
        }
        
        // Update overdrive time
        if (this.overdriveTimer > 0) {
            this.overdriveTimer -= dt * 1000;
        }

        // 2. Background movements (Water Parallax)
        // Adjust background speed/style depending on stage weather
        const waterSpeedMultiplier = this.currentStage === 3 ? 1.4 : 1.0;
        
        this.islands.forEach(island => {
            island.y += island.speed * waterSpeedMultiplier * dt;
            if (island.y - island.size > this.height) {
                island.y = -island.size - 50;
                island.x = Math.random() * this.width;
            }
        });
        
        this.clouds.forEach(cloud => {
            cloud.y += cloud.speed * waterSpeedMultiplier * dt;
            if (cloud.y - cloud.height > this.height) {
                cloud.y = -cloud.height - 100;
                cloud.x = Math.random() * this.width;
            }
        });

        // Coastline floating time
        this.coastlineTime += dt;

        // Stage 3 South Atlantic Storm Weather loops
        if (this.currentStage === 3) {
            // Initialize rain particles once
            if (this.rainParticles.length === 0) {
                for (let i = 0; i < 40; i++) {
                    this.rainParticles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        speed: 700 + Math.random() * 200,
                        length: 12 + Math.random() * 10
                    });
                }
            }
            
            // Update rain
            this.rainParticles.forEach(p => {
                p.y += p.speed * dt;
                p.x -= 150 * dt; // slanted to the left due to wind drift
                if (p.y > this.height) {
                    p.y = -20;
                    p.x = Math.random() * (this.width + 100);
                }
            });
            
            // Lightning trigger
            this.lightningTimer -= dt * 1000;
            if (this.lightningTimer <= 0) {
                this.lightningTimer = 3500 + Math.random() * 5500;
                this.lightningFlash = 8; // flash white for 8 frames
                if (window.audioEngine) {
                    window.audioEngine.playExplosion(true); // thunder sound
                }
            }
            if (this.lightningFlash > 0) this.lightningFlash--;
        }

        // 3. Player movements
        if (this.player.active) {
            let dx = 0;
            let dy = 0;
            
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx = -1;
            if (this.keys['ArrowRight'] || this.keys['KeyD']) dx = 1;
            if (this.keys['ArrowUp'] || this.keys['KeyW']) dy = -1;
            if (this.keys['ArrowDown'] || this.keys['KeyS']) dy = 1;
            
            // Normalize vector
            if (dx !== 0 && dy !== 0) {
                dx *= 0.7071;
                dy *= 0.7071;
            }
            
            this.player.x += dx * this.player.speed * dt;
            this.player.y += dy * this.player.speed * dt;
            
            // Constrain to screen
            this.player.x = Math.max(this.player.size, Math.min(this.width - this.player.size, this.player.x));
            this.player.y = Math.max(this.player.size, Math.min(this.height - this.player.size, this.player.y));
            
            // Shooting logic
            if (this.player.shootCooldown > 0) {
                this.player.shootCooldown -= dt * 1000;
            }
            
            if (this.keys['Space'] && this.player.shootCooldown <= 0) {
                this.firePlayerWeapon();
            }
            
            // Special weapon execution
            if ((this.keys['KeyE'] || this.keys['ShiftLeft']) && this.player.specialCharge >= 100) {
                this.triggerSpecialWeapon();
            }
            
            // Engine flame particles
            if (Math.random() < 0.3) {
                this.spawnEngineParticle(this.player.x, this.player.y + 15);
            }
            
            // Engine damage smoke trails (<40% health)
            if (this.player.hp < this.player.maxHp * 0.4) {
                if (Math.random() < 0.25) {
                    this.particles.push({
                        x: this.player.x + (Math.random() - 0.5) * 8,
                        y: this.player.y + 12,
                        vx: (Math.random() - 0.5) * 30,
                        vy: Math.random() * 60 + 20,
                        r: 3 + Math.random() * 3,
                        life: 0.5,
                        maxLife: 0.5,
                        color: Math.random() < 0.3 ? '#ff8400' : '#444'
                    });
                }
            }
            
            // Add distance (25 units per second for classic 1942 level duration)
            if (!this.bossSpawned) {
                this.distanceCovered += dt * 25;
                if (this.distanceCovered >= this.distanceLimit) {
                    this.spawnFinalBoss();
                }
            }
        }

        // 4. Allied Wingman support mechanics (Spawn at 70% of level distance)
        if (this.currentStage === 2 && this.distanceCovered >= this.distanceLimit * 0.7 && !this.wingmanSpawnedThisRun) {
            this.wingmanActive = true;
            this.wingmanSpawnedThisRun = true;
            this.wingman = {
                x: -60,
                y: this.height + 100,
                shootTimer: 0,
                lifeTimer: 10000 // 10 seconds support
            };
            if (window.audioEngine) window.audioEngine.playSpecialReady();
        }

        if (this.wingmanActive && this.wingman) {
            // Escorts player on the left wing
            const targetX = this.player.x - 55;
            const targetY = this.player.y + 15;
            
            this.wingman.x += (targetX - this.wingman.x) * 4 * dt;
            this.wingman.y += (targetY - this.wingman.y) * 4 * dt;
            
            // Shoot automatically
            this.wingman.shootTimer += dt * 1000;
            if (this.wingman.shootTimer >= 180) {
                this.wingman.shootTimer = 0;
                this.bullets.push({
                    x: this.wingman.x,
                    y: this.wingman.y - 12,
                    vx: 0,
                    vy: -600,
                    damage: 15,
                    type: 'standard'
                });
                if (window.audioEngine) window.audioEngine.playLaser();
            }
            
            // Engine particles
            if (Math.random() < 0.3) {
                this.spawnEngineParticle(this.wingman.x, this.wingman.y + 15);
            }
            
            // Expiry timer
            this.wingman.lifeTimer -= dt * 1000;
            if (this.wingman.lifeTimer <= 0) {
                // Fly off-screen downwards
                this.wingmanActive = false;
                this.wingman = null;
            }
        }

        // 5. Enemy Spawning (Adjusted for difficulty multiplier)
        if (!this.bossSpawned) {
            this.spawnTimer += dt * 1000;
            if (this.spawnTimer >= this.spawnInterval * this.diffMult.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnEnemySquad();
            }
        }

        // 6. Update Bullets
        this.bullets.forEach((b, idx) => {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            
            // Special exocet homing behavior
            if (b.type === 'exocet') {
                const target = this.findExocetTarget();
                if (target) {
                    const angle = Math.atan2(target.y - b.y, target.x - b.x);
                    b.vx = Math.cos(angle) * 500;
                    b.vy = Math.sin(angle) * 500;
                }
                
                // Exocet smoke trail
                if (Math.random() < 0.4) {
                    this.particles.push({
                        x: b.x,
                        y: b.y + 10,
                        vx: (Math.random() - 0.5) * 30,
                        vy: Math.random() * 40 + 20,
                        r: 3 + Math.random() * 4,
                        life: 0.3,
                        maxLife: 0.3,
                        color: 'rgba(200, 200, 200, 0.7)'
                    });
                }
            }
        });
        
        // Filter out off-screen bullets
        this.bullets = this.bullets.filter(b => b.x > 0 && b.x < this.width && b.y > 0 && b.y < this.height);

        // Update Enemy Bullets (Difficulty speed multiplier applied)
        this.enemyBullets.forEach(b => {
            b.x += b.vx * this.diffMult.enemyBulletSpeed * dt;
            b.y += b.vy * this.diffMult.enemyBulletSpeed * dt;
        });
        this.enemyBullets = this.enemyBullets.filter(b => b.x > 0 && b.x < this.width && b.y > 0 && b.y < this.height);

        // 7. Update Enemies
        this.enemies.forEach(e => {
            e.age += dt;
            
            // Engine damage smoke trails for heavy units (<40% health)
            if ((e.isBoss || e.isMiniboss) && e.hp < e.maxHp * 0.4) {
                if (Math.random() < 0.3) {
                    this.particles.push({
                        x: e.x + (Math.random() - 0.5) * (e.width * 0.4),
                        y: e.y + (e.height * 0.1),
                        vx: (Math.random() - 0.5) * 40,
                        vy: Math.random() * 50 + 20,
                        r: 4 + Math.random() * 5,
                        life: 0.8,
                        maxLife: 0.8,
                        color: Math.random() < 0.2 ? '#ff4000' : '#222'
                    });
                }
            }
            
            if (e.isBoss) {
                // Boss complex movement
                if (e.y < 120) {
                    e.y += 40 * dt; // Descend slowly
                } else {
                    // Slide horizontally
                    e.x += e.vx * dt;
                    if (e.x < 120 || e.x > this.width - 120) {
                        e.vx *= -1;
                    }
                }
                
                // Boss attack pattern scheduling
                e.shootTimer += dt * 1000;
                if (e.shootTimer >= e.shootInterval * this.diffMult.enemyShootRate) {
                    e.shootTimer = 0;
                    this.fireBossWeapons(e);
                }
            } else if (e.isMiniboss) {
                // Destroyer slow sweep at the bottom sea level
                e.x += e.vx * dt;
                if (e.x < 100 || e.x > this.width - 100) e.vx *= -1;
                
                e.shootTimer += dt * 1000;
                if (e.shootTimer >= e.shootInterval * this.diffMult.enemyShootRate) {
                    e.shootTimer = 0;
                    this.fireMinibossMissile(e);
                }
            } else if (e.isMissile) {
                // Homing missile tracking
                const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                const targetVx = Math.cos(angle) * e.speed;
                const targetVy = Math.sin(angle) * e.speed;
                
                e.vx = e.vx || 0;
                e.vy = e.vy || 0;
                
                // Easing steering vector
                e.vx += (targetVx - e.vx) * 3 * dt;
                e.vy += (targetVy - e.vy) * 3 * dt;
                
                e.x += e.vx * dt;
                e.y += e.vy * dt;
                
                // Smoke trail
                if (Math.random() < 0.35) {
                    this.particles.push({
                        x: e.x,
                        y: e.y + 6,
                        vx: (Math.random() - 0.5) * 15,
                        vy: Math.random() * 30 + 10,
                        r: 2 + Math.random() * 2,
                        life: 0.3,
                        maxLife: 0.3,
                        color: 'rgba(230, 230, 230, 0.6)'
                    });
                }
            } else {
                // Regular plane IA
                if (e.pattern === 'sine') {
                    e.y += e.speed * dt;
                    e.x = e.startX + Math.sin(e.age * 4) * 80;
                } else {
                    e.y += e.speed * dt;
                }
                
                // Regular shoot triggers
                e.shootTimer += dt * 1000;
                if (e.shootTimer >= e.shootInterval * this.diffMult.enemyShootRate) {
                    e.shootTimer = 0;
                    this.fireEnemyWeapon(e);
                }
            }
            
            // Flash cooldown
            if (e.flashTime > 0) e.flashTime -= dt;
        });
        
        // Remove dead or off-screen enemies
        this.enemies = this.enemies.filter(e => {
            if (e.hp <= 0) {
                this.explodeEntity(e);
                this.addScoreValue(e.points);
                
                // Apply difficulty multiplier to special charge rates
                this.chargePlayerSpecial(e.specialReward * this.diffMult.specialChargeRate);
                this.spawnPickupCheck(e);
                return false;
            }
            // regular enemies leave from bottom
            if (!e.isBoss && !e.isMiniboss && e.y - e.size > this.height) return false;
            return true;
        });

        // 6. Update Pickups
        this.pickups.forEach(p => {
            p.y += 100 * dt;
            // Float sines
            p.x += Math.sin(performance.now() / 150) * 1.5;
        });
        this.pickups = this.pickups.filter(p => p.y < this.height);

        // 7. Collision Detections
        this.detectCollisions();

        // 8. Update Particles
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);
        
        // 1. Draw Ocean Background
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#0f1f2d'); // Dark deep blue
        grad.addColorStop(1, '#08121a');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 1a. Draw Stage 3 Storm Rain Particles
        if (this.currentStage === 3 && this.rainParticles.length > 0) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(160, 200, 255, 0.35)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.rainParticles.forEach(p => {
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(p.x - 4, p.y + p.length); // slanted wind slant
            });
            this.ctx.stroke();
            this.ctx.restore();
        }

        // 1b. Draw Stage 3 Lightning Flashes
        if (this.currentStage === 3 && this.lightningFlash > 0) {
            this.ctx.save();
            this.ctx.fillStyle = `rgba(255, 255, 255, ${(this.lightningFlash / 8) * 0.4})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
        }
        
        // 2. Draw Islands
        this.islands.forEach(island => {
            if (island.vertices && island.vertices.length > 0) {
                // 2.1 Shore foam breaking on beach (translucent white pulsating border)
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.15 + Math.sin(performance.now() / 150) * 0.08) + ')';
                this.ctx.lineWidth = 4 + Math.sin(performance.now() / 150) * 2;
                this.ctx.beginPath();
                this.ctx.moveTo(island.x + island.vertices[0].ox, island.y + island.vertices[0].oy);
                for (let j = 1; j < island.vertices.length; j++) {
                    this.ctx.lineTo(island.x + island.vertices[j].ox, island.y + island.vertices[j].oy);
                }
                this.ctx.closePath();
                this.ctx.stroke();
                this.ctx.restore();

                // 2.2 Golden Sandy Beach
                this.ctx.fillStyle = island.beachColor;
                this.ctx.beginPath();
                this.ctx.moveTo(island.x + island.vertices[0].ox, island.y + island.vertices[0].oy);
                for (let j = 1; j < island.vertices.length; j++) {
                    this.ctx.lineTo(island.x + island.vertices[j].ox, island.y + island.vertices[j].oy);
                }
                this.ctx.closePath();
                this.ctx.fill();

                // 2.3 Turf Vegetation Interior Land
                this.ctx.fillStyle = island.landColor;
                this.ctx.beginPath();
                this.ctx.moveTo(island.x + island.vertices[0].ox * 0.9, island.y + island.vertices[0].oy * 0.9);
                for (let j = 1; j < island.vertices.length; j++) {
                    this.ctx.lineTo(island.x + island.vertices[j].ox * 0.9, island.y + island.vertices[j].oy * 0.9);
                }
                this.ctx.closePath();
                this.ctx.fill();

                // 2.4 Rocky Mountain Ridge Elevations
                if (island.mountainVertices && island.mountainVertices.length > 0) {
                    this.ctx.fillStyle = island.mountainColor;
                    this.ctx.strokeStyle = '#3a3f3b';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(island.x + island.mountainVertices[0].ox, island.y + island.mountainVertices[0].oy);
                    for (let j = 1; j < island.mountainVertices.length; j++) {
                        this.ctx.lineTo(island.x + island.mountainVertices[j].ox, island.y + island.mountainVertices[j].oy);
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();

                    // Draw inner peak ridge lines for volumetric rocky feel
                    this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                    this.ctx.beginPath();
                    for (let j = 0; j < island.mountainVertices.length; j += 2) {
                        this.ctx.moveTo(island.x + island.mountainVertices[j].ox * 0.2, island.y + island.mountainVertices[j].oy * 0.2);
                        this.ctx.lineTo(island.x + island.mountainVertices[j].ox, island.y + island.mountainVertices[j].oy);
                    }
                    this.ctx.stroke();
                }

                // 2.5 Forest Trees/Turberas clusters
                if (island.forestPoints && island.forestPoints.length > 0) {
                    this.ctx.fillStyle = '#212b1c'; // Dense green
                    this.ctx.strokeStyle = '#151c12';
                    this.ctx.lineWidth = 0.8;
                    island.forestPoints.forEach(fp => {
                        this.ctx.beginPath();
                        this.ctx.arc(island.x + fp.ox, island.y + fp.oy, fp.size, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.stroke();
                    });
                }
            }
        });

        // 2b. Draw Coastal Land Strips (Stage 2 and 3)
        if (this.currentStage >= 2) {
            this.ctx.save();
            
            const time = this.coastlineTime;
            const yOffset = (time * 120) % 200; // loop-scrolling coastline
            
            // Fill color and stroke color
            this.ctx.fillStyle = '#4c553d'; // Green-brown soil
            this.ctx.strokeStyle = '#8b7c5b'; // Sandy coast outline
            this.ctx.lineWidth = 3;
            
            // Left Coastline path
            this.ctx.beginPath();
            this.ctx.moveTo(0, -100);
            for (let y = -100; y <= this.height + 100; y += 50) {
                const relativeY = y - yOffset;
                const x = 30 + Math.sin(relativeY * 0.015) * 18 + Math.cos(relativeY * 0.05) * 8;
                this.ctx.lineTo(x, y);
            }
            this.ctx.lineTo(0, this.height + 100);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            // Right Coastline path
            this.ctx.beginPath();
            this.ctx.moveTo(this.width, -100);
            for (let y = -100; y <= this.height + 100; y += 50) {
                const relativeY = y - yOffset;
                const x = this.width - (30 + Math.sin(relativeY * 0.012 + 2) * 18 + Math.cos(relativeY * 0.04) * 8);
                this.ctx.lineTo(x, y);
            }
            this.ctx.lineTo(this.width, this.height + 100);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.restore();
        }

        // 3. Draw Ships (Miniboss / Destroyer class on water level under clouds)
        this.enemies.forEach(e => {
            if (e.isMiniboss || (e.isBoss && e.type === 'sheffield')) {
                this.drawDestroyer(this.ctx, e);
            }
            if (e.isBoss && e.type === 'sir_galahad') {
                this.drawLandingShip(this.ctx, e);
            }
            if (e.isBoss && e.type === 'invincible') {
                this.drawCarrier(this.ctx, e);
            }
        });

        // Draw Pickups
        this.pickups.forEach(p => {
            if (p.type === 'repair') {
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(performance.now() / 250);
                
                // Glowing circular ring
                this.ctx.strokeStyle = '#4fe688';
                this.ctx.shadowColor = '#4fe688';
                this.ctx.shadowBlur = 8;
                this.ctx.lineWidth = 2.5;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 11, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Glowing medical cross
                this.ctx.fillStyle = '#4fe688';
                this.ctx.fillRect(-3, -8, 6, 16);
                this.ctx.fillRect(-8, -3, 16, 6);
                this.ctx.restore();
            } else if (p.type === 'shield') {
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                
                this.ctx.shadowColor = '#00f0ff';
                this.ctx.shadowBlur = 10;
                
                // Central plasma core
                this.ctx.fillStyle = '#00f0ff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Orbiting gyroscopic rings
                this.ctx.strokeStyle = '#00f0ff';
                this.ctx.lineWidth = 1.5;
                
                this.ctx.save();
                this.ctx.rotate(performance.now() / 150);
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
                
                this.ctx.save();
                this.ctx.rotate(-performance.now() / 200 + Math.PI / 4);
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
                
                this.ctx.restore();
            } else if (p.type.startsWith('weapon_') || p.type === 'upgrade') {
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(performance.now() / 300);
                
                // Golden glowing tactical hexagon
                this.ctx.strokeStyle = '#e6be4f';
                this.ctx.shadowColor = '#e6be4f';
                this.ctx.shadowBlur = 8;
                this.ctx.lineWidth = 2;
                
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const hx = Math.cos(angle) * 12;
                    const hy = Math.sin(angle) * 12;
                    if (i === 0) this.ctx.moveTo(hx, hy);
                    else this.ctx.lineTo(hx, hy);
                }
                this.ctx.closePath();
                this.ctx.stroke();
                this.ctx.restore();
                
                // Draw text symbol inside (static to remain readable)
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 9px "Share Tech Mono", monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                const wName = p.type.startsWith('weapon_') ? p.type.split('_')[1] : 'dual';
                let sym = '2X';
                if (wName === 'spread') sym = '3X';
                if (wName === 'side') sym = '◀▶';
                if (wName === 'rear') sym = '▲▼';
                
                this.ctx.fillText(sym, 0, 0);
                this.ctx.restore();
            }
        });

        // 4. Draw Player
        if (this.player.active) {
            this.ctx.save();
            // Blinking when invulnerable
            if (this.player.invulnerable === 0 || Math.floor(this.player.invulnerable / 4) % 2 === 0) {
                const config = this.planesConfig[this.selectedPlaneIndex];
                config.draw(this.ctx, this.player.x, this.player.y, this.player.size);
            }
            this.ctx.restore();
        }

        // 4b. Draw Player Shield protection
        if (this.player.active && this.player.shield > 0) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = '#00f0ff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.size * 0.88, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // 4c. Draw Allied Wingman Escort
        if (this.wingmanActive && this.wingman) {
            this.ctx.save();
            this.drawPucara(this.ctx, this.wingman.x, this.wingman.y, 20);
            this.ctx.restore();
        }

        // 5. Draw Enemies (Planes)
        this.enemies.forEach(e => {
            if (!e.isMiniboss && !e.isBoss) {
                this.ctx.save();
                if (e.flashTime > 0) {
                    this.ctx.filter = 'brightness(2.5) contrast(1.5)';
                }
                
                if (e.type === 'harrier') {
                    this.drawHarrier(this.ctx, e.x, e.y, e.size);
                } else if (e.type === 'seaking') {
                    this.drawSeaKing(this.ctx, e.x, e.y, e.size);
                } else if (e.type === 'missile') {
                    this.drawHomingMissile(this.ctx, e);
                }
                
                this.ctx.restore();
            }
        });

        // 6. Draw Bullets (Player & Enemy)
        this.bullets.forEach(b => {
            this.ctx.save();
            if (b.type === 'exocet') {
                // Draw Exocet missile body
                this.ctx.fillStyle = '#eee';
                this.ctx.strokeStyle = '#222';
                this.ctx.lineWidth = 1;
                
                this.ctx.translate(b.x, b.y);
                const angle = Math.atan2(b.vy, b.vx);
                this.ctx.rotate(angle);
                
                this.ctx.fillRect(-15, -3, 20, 6);
                this.ctx.strokeRect(-15, -3, 20, 6);
                
                // Orange flames at rear
                this.ctx.fillStyle = '#ff7700';
                this.ctx.fillRect(-20, -2, 5, 4);
            } else {
                // Dual glowing green lasers
                this.ctx.fillStyle = '#00ff66';
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = '#00ff66';
                this.ctx.fillRect(b.x - 2, b.y - 10, 4, 15);
            }
            this.ctx.restore();
        });

        this.enemyBullets.forEach(b => {
            this.ctx.fillStyle = '#ff4422';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.size || 4, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 7. Draw Particles
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // 8. Draw Clouds (Highest layer with transparency)
        this.clouds.forEach(cloud => {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.beginPath();
            this.ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 9. Draw HUD / UI Panel
        this.drawHUD(this.ctx);

        // 10. Stage Transition Briefing Banner Overlay
        if (this.stageTransitionTimer > 0) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Tactical grid overlay lines
            this.ctx.strokeStyle = 'rgba(79, 230, 136, 0.15)';
            this.ctx.lineWidth = 1;
            for (let x = 0; x < this.width; x += 40) {
                this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.height); this.ctx.stroke();
            }
            for (let y = 0; y < this.height; y += 40) {
                this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.width, y); this.ctx.stroke();
            }
            
            // Green glowing tactical frame
            this.ctx.strokeStyle = '#4fe688';
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#4fe688';
            this.ctx.strokeRect(40, this.height / 2 - 80, this.width - 80, 160);
            
            // Translucent green banner body
            this.ctx.fillStyle = 'rgba(10, 30, 15, 0.85)';
            this.ctx.fillRect(40, this.height / 2 - 80, this.width - 80, 160);
            
            // Text drawing
            this.ctx.shadowBlur = 0; // reset shadow for text
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Header text
            this.ctx.fillStyle = '#ffde3b'; // Amber yellow
            this.ctx.font = 'bold 16px "Share Tech Mono", monospace';
            this.ctx.fillText('NUEVA ORDEN DE OPERACIONES', this.width / 2, this.height / 2 - 40);
            
            // Stage Title
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px "Share Tech Mono", monospace';
            const titleText = this.stageTitles[this.currentStage] || '';
            const parts = titleText.split(' - ');
            if (parts.length > 1) {
                this.ctx.fillText(parts[0], this.width / 2, this.height / 2 - 10);
                this.ctx.fillStyle = '#4fe688';
                this.ctx.font = 'bold 16px "Share Tech Mono", monospace';
                this.ctx.fillText(parts[1], this.width / 2, this.height / 2 + 15);
            } else {
                this.ctx.fillText(titleText, this.width / 2, this.height / 2);
            }
            
            // Animated blinking transmission prompt
            if (Math.floor(performance.now() / 250) % 2 === 0) {
                this.ctx.fillStyle = '#ff4400';
                this.ctx.font = 'bold 11px "Press Start 2P", cursive';
                this.ctx.fillText('TRANSMITIENDO DATOS...', this.width / 2, this.height / 2 + 50);
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }

    /**
     * Procedural Drawing: A-4B Skyhawk
     */
    drawSkyhawk(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        
        // Shadow offset for height
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(-size, 25);
        ctx.lineTo(-size * 0.3, 10);
        ctx.lineTo(0, -30);
        ctx.lineTo(size * 0.3, 10);
        ctx.lineTo(size, 25);
        ctx.closePath();
        ctx.fill();

        // Main body paint (Green camo + light grey belly highlights)
        ctx.fillStyle = '#4e5b4a';
        ctx.strokeStyle = '#1b2219';
        ctx.lineWidth = 2;
        
        // Wings (Delta design)
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(-size * 0.95, 18);
        ctx.lineTo(-size * 0.2, 0);
        ctx.lineTo(0, -25);
        ctx.lineTo(size * 0.2, 0);
        ctx.lineTo(size * 0.95, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Camouflage details (Yellowish khaki patches)
        ctx.fillStyle = '#7a7a5c';
        ctx.beginPath();
        ctx.arc(-size * 0.35, 10, 6, 0, Math.PI * 2);
        ctx.arc(size * 0.45, 12, 5, 0, Math.PI * 2);
        ctx.arc(0, -10, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Fuselage pod
        ctx.fillStyle = '#5c6c58';
        ctx.fillRect(-4, -20, 8, 30);
        ctx.strokeRect(-4, -20, 8, 30);
        
        // Cockpit (glowing glass tint)
        ctx.fillStyle = '#3bcbf2';
        ctx.beginPath();
        ctx.ellipse(0, -12, 3, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Yellow and sky blue Argentine cockade (roundel) on wings
        ctx.fillStyle = '#7cd8ff'; // Sky blue
        ctx.beginPath(); ctx.arc(-size * 0.6, 12, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(size * 0.6, 12, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; // White
        ctx.beginPath(); ctx.arc(-size * 0.6, 12, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(size * 0.6, 12, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffde3b'; // Yellow center
        ctx.beginPath(); ctx.arc(-size * 0.6, 12, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(size * 0.6, 12, 1.5, 0, Math.PI * 2); ctx.fill();
        
        ctx.restore();
    }

    /**
     * Procedural Drawing: Super Étendard
     */
    drawEtendard(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(-size * 0.9, 12);
        ctx.lineTo(0, -28);
        ctx.lineTo(size * 0.9, 12);
        ctx.closePath();
        ctx.fill();

        // Steel Blue-Gray navy design
        ctx.fillStyle = '#394851';
        ctx.strokeStyle = '#182025';
        ctx.lineWidth = 2;
        
        // Wings (Sweep back)
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(-size * 0.9, 10);
        ctx.lineTo(-size * 0.75, 4);
        ctx.lineTo(-size * 0.2, -5);
        ctx.lineTo(0, -22);
        ctx.lineTo(size * 0.2, -5);
        ctx.lineTo(size * 0.75, 4);
        ctx.lineTo(size * 0.9, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Fuselage
        ctx.fillStyle = '#4c5f6b';
        ctx.fillRect(-3, -25, 6, 38);
        ctx.strokeRect(-3, -25, 6, 38);
        
        // Canopy Glass
        ctx.fillStyle = '#fce23a'; // Amber tinted canopy
        ctx.beginPath();
        ctx.ellipse(0, -14, 2.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Argentine Navy anchor / shield markings on wings
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-size * 0.55 - 2, 7, 4, 4);
        ctx.fillRect(size * 0.55 - 2, 7, 4, 4);
        
        // Special Exocet missile visual indicator hanging under wing
        if (this.player && this.player.specialCharge >= 100) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(-size * 0.45, 4, 3, 10); // Exocet mock
            ctx.fillRect(size * 0.45, 4, 3, 10);
        }

        ctx.restore();
    }

    /**
     * Procedural Drawing: IA-58 Pucará
     */
    drawPucara(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(-size * 1.05, 12);
        ctx.lineTo(0, -22);
        ctx.lineTo(size * 1.05, 12);
        ctx.closePath();
        ctx.fill();

        // Camouflage Green
        ctx.fillStyle = '#5c6553';
        ctx.strokeStyle = '#22251e';
        ctx.lineWidth = 2;
        
        // Straight Wings
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(-size * 1.15, 6);
        ctx.lineTo(-size * 1.15, -2);
        ctx.lineTo(0, -18);
        ctx.lineTo(size * 1.15, -2);
        ctx.lineTo(size * 1.15, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Twin Turboprop Engines (Spanned on wings)
        ctx.fillStyle = '#4b5243';
        ctx.fillRect(-size * 0.5 - 4, -8, 8, 16);
        ctx.fillRect(size * 0.5 - 4, -8, 8, 16);
        ctx.strokeRect(-size * 0.5 - 4, -8, 8, 16);
        ctx.strokeRect(size * 0.5 - 4, -8, 8, 16);
        
        // Propellers (Spinning blurs)
        ctx.fillStyle = 'rgba(230, 230, 230, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-size * 0.5, -9, 12, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(size * 0.5, -9, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fuselage
        ctx.fillStyle = '#6d7762';
        ctx.fillRect(-4, -22, 8, 38);
        ctx.strokeRect(-4, -22, 8, 38);
        
        // Long Cockpit (Pucará tandem seating)
        ctx.fillStyle = '#3bcbf2';
        ctx.beginPath();
        ctx.ellipse(0, -10, 2.5, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Procedural Drawing: Sea Harrier (FRS.1)
     * High-detail vector rendition with camo patches, air intakes, outrigger gear,
     * bubble canopy, Sidewinder missiles, and British roundels.
     */
    drawHarrier(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, -1); // Faces down
        
        // 1. Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(-size * 0.85, 8);
        ctx.lineTo(0, -22);
        ctx.lineTo(size * 0.85, 8);
        ctx.closePath();
        ctx.fill();

        // Outer stroke specs
        ctx.strokeStyle = '#10161a';
        ctx.lineWidth = 1.5;
        
        // 2. Wings & Outriggers (Anhedral/Down-sloped wings)
        ctx.fillStyle = '#424f59'; // Dark Sea Grey
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(-size * 0.85, 8);
        ctx.lineTo(-size * 0.85, 12); // Outrigger pod
        ctx.lineTo(-size * 0.25, 1);
        ctx.lineTo(0, -18);
        ctx.lineTo(size * 0.25, 1);
        ctx.lineTo(size * 0.85, 12);
        ctx.lineTo(size * 0.85, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Outrigger gear struts (vertical tiny wheels at tips)
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-size * 0.85, 10); ctx.lineTo(-size * 0.85, 15);
        ctx.moveTo(size * 0.85, 10); ctx.lineTo(size * 0.85, 15);
        ctx.stroke();
        
        // 3. Main Fuselage with camouflage pattern
        ctx.fillStyle = '#4f5e6a'; // Medium Slate Grey
        ctx.strokeStyle = '#10161a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -22); // Tail
        ctx.lineTo(-3.5, -18);
        ctx.lineTo(-3.5, 15); // Nose intake start
        ctx.lineTo(-5.5, 17); // Left side air intake
        ctx.lineTo(-5.5, 23);
        ctx.lineTo(-2, 26);
        ctx.lineTo(0, 32); // Pointy nose probe
        ctx.lineTo(2, 26);
        ctx.lineTo(5.5, 23); // Right side air intake
        ctx.lineTo(5.5, 17);
        ctx.lineTo(3.5, 15);
        ctx.lineTo(3.5, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Slate Grey Camouflage Patches
        ctx.fillStyle = '#303940'; // Darker camo patch
        ctx.beginPath();
        ctx.moveTo(-3.5, 0);
        ctx.quadraticCurveTo(-size * 0.4, 5, -size * 0.5, 8);
        ctx.lineTo(-size * 0.3, 10);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();

        // 4. Weapons: AIM-9 Sidewinder underwing missiles (white with red tips)
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 0.8;
        // Left Missile
        ctx.fillRect(-size * 0.5 - 2, -2, 3, 12);
        ctx.strokeRect(-size * 0.5 - 2, -2, 3, 12);
        ctx.fillStyle = '#ff3300'; // Red tip
        ctx.fillRect(-size * 0.5 - 2, 10, 3, 2);
        
        // Right Missile
        ctx.fillStyle = '#fff';
        ctx.fillRect(size * 0.5 - 1, -2, 3, 12);
        ctx.strokeRect(size * 0.5 - 1, -2, 3, 12);
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(size * 0.5 - 1, 10, 3, 2);

        // 5. Cockpit bubble canopy
        const canopyGrad = ctx.createLinearGradient(0, 10, 0, 20);
        canopyGrad.addColorStop(0, '#111');
        canopyGrad.addColorStop(0.5, '#4c8ba8');
        canopyGrad.addColorStop(1, '#9ee5ff');
        ctx.fillStyle = canopyGrad;
        ctx.strokeStyle = '#10161a';
        ctx.beginPath();
        ctx.ellipse(0, 15, 2.5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 6. British Royal Navy Wing Roundels
        ctx.fillStyle = '#0f2c59'; // RAF Blue
        ctx.beginPath(); ctx.arc(-size * 0.45, 4, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(size * 0.45, 4, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; // White ring
        ctx.beginPath(); ctx.arc(-size * 0.45, 4, 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(size * 0.45, 4, 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c91414'; // Red center
        ctx.beginPath(); ctx.arc(-size * 0.45, 4, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(size * 0.45, 4, 1.2, 0, Math.PI * 2); ctx.fill();
        
        ctx.restore();
    }

    /**
     * Procedural Drawing: Westland Sea King Helicopter
     * Enhanced with authentic long boat-hull contour, black radar snout,
     * detailed landing sponsons, spinning tail rotor, and cockpit window glazing.
     */
    drawSeaKing(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        
        // 1. Tail rotor blades spinning on the side (drawn under main body shadow)
        ctx.save();
        ctx.translate(0, -size * 0.85);
        ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
        ctx.beginPath();
        ctx.arc(6, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Solid tail blades
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1;
        const tailAngle = performance.now() / 20;
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(tailAngle + (i * Math.PI * 2 / 3));
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 9); ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        // 2. Heavy Fuselage (Dark olive drab/naval grey)
        ctx.fillStyle = '#34473c';
        ctx.strokeStyle = '#18241e';
        ctx.lineWidth = 1.5;
        
        // Elongated boat hull contour
        ctx.beginPath();
        ctx.moveTo(0, size * 0.6); // Nose snout
        ctx.bezierCurveTo(size * 0.4, size * 0.5, size * 0.45, -size * 0.1, size * 0.18, -size * 0.35); // Right side
        ctx.lineTo(3.5, -size * 0.85); // Tail joint
        ctx.lineTo(-3.5, -size * 0.85);
        ctx.lineTo(-size * 0.18, -size * 0.35); // Left side
        ctx.bezierCurveTo(-size * 0.4, size * 0.5, -size * 0.45, -size * 0.1, -size * 0.6, size * 0.5); 
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Characteristic black nose radome block (radar snout on fore nose)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.52, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Detailed Sponsons (Side landing gear pods)
        ctx.fillStyle = '#223028';
        ctx.fillRect(-size * 0.6, -3, 6, 15);
        ctx.fillRect(size * 0.6 - 6, -3, 6, 15);
        ctx.strokeRect(-size * 0.6, -3, 6, 15);
        ctx.strokeRect(size * 0.6 - 6, -3, 6, 15);
        
        // Wheels protruding from sponsons
        ctx.fillStyle = '#000';
        ctx.fillRect(-size * 0.63, 10, 4, 5);
        ctx.fillRect(size * 0.6 - 1, 10, 4, 5);

        // 5. Cockpit glass glazing & cabin windows
        ctx.fillStyle = '#4fcbeb'; // Shiny reflective cyan
        ctx.beginPath();
        ctx.ellipse(-4, size * 0.35, 4, 3.5, 0.2, 0, Math.PI * 2);
        ctx.ellipse(4, size * 0.35, 4, 3.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Side small circular cabin windows
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(-8, 5, 2.5, 0, Math.PI * 2);
        ctx.arc(8, 5, 2.5, 0, Math.PI * 2);
        ctx.arc(-7, -8, 2.5, 0, Math.PI * 2);
        ctx.arc(7, -8, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Side rescue hoist winch arm (yellow hook node)
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, 0); ctx.lineTo(12, 0); ctx.lineTo(12, 4);
        ctx.stroke();

        // 6. Main 5-blade rotor hub (Blended rotor blur + detailed blades)
        ctx.fillStyle = 'rgba(230, 230, 230, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotor blades
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.2;
        const mainAngle = performance.now() / 45;
        for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.rotate(mainAngle + (i * Math.PI * 2 / 5));
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, size * 1.22);
            ctx.stroke();
            
            // Red and yellow tips of Sea King rotor blades
            ctx.fillStyle = '#ffd200';
            ctx.fillRect(-1.5, size * 1.15, 3, 4);
            ctx.fillStyle = '#ff1100';
            ctx.fillRect(-1.5, size * 1.19, 3, 3);
            ctx.restore();
        }
        
        // Main rotor center dome cap
        ctx.fillStyle = '#6e8071';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * Procedural Drawing: Homing Missile
     */
    drawHomingMissile(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);
        
        // Calculate angle of travel facing downwards default
        const angle = Math.atan2(e.vy || 1, e.vx || 0);
        ctx.rotate(angle - Math.PI / 2);
        
        // Missile body shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-3, 8, 6, 20);
        
        // Red fins
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.moveTo(-3, 10);
        ctx.lineTo(-8, 14);
        ctx.lineTo(-3, 14);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(3, 10);
        ctx.lineTo(8, 14);
        ctx.lineTo(3, 14);
        ctx.closePath();
        ctx.fill();
        
        // White body
        ctx.fillStyle = '#f0f0f0';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(3, -4);
        ctx.lineTo(3, 12);
        ctx.lineTo(-3, 12);
        ctx.lineTo(-3, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Nose tip red paint
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(3, -4);
        ctx.lineTo(-3, -4);
        ctx.closePath();
        ctx.fill();
        
        // Orange/yellow fire at rear
        ctx.fillStyle = Math.random() < 0.5 ? '#ff7700' : '#ffcc00';
        ctx.fillRect(-1.5, 12, 3, 6);
        
        ctx.restore();
    }

    /**
     * Procedural Drawing: HMS Sheffield Destroyer (Miniboss)
     * High-fidelity naval rendering including angled decks, Sea Dart missile launcher,
     * forward 4.5-inch gun mount, radar mast, portholes, and water foam wake displacement.
     */
    drawDestroyer(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);
        
        if (e.flashTime > 0) {
            ctx.filter = 'brightness(2.2)';
        }

        // 1. Dynamic Water Foam Wake (Splashes at bow and sides)
        ctx.fillStyle = 'rgba(240, 250, 255, 0.35)';
        const wakeTime = performance.now() / 80;
        
        // Bow spray (top pointy wave bubbles)
        for (let i = 0; i < 4; i++) {
            const r = 8 + Math.sin(wakeTime + i) * 4;
            const ox = (i % 2 === 0 ? 1 : -1) * (14 + Math.sin(wakeTime) * 6);
            ctx.beginPath();
            ctx.arc(ox, -e.height * 0.58 + i * 15, r, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Stern foam wake
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, e.height * 0.58, 22 + Math.sin(wakeTime) * 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Hull Shadow in the ocean water
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-e.width * 0.5 - 5, -e.height * 0.5 + 8, e.width + 10, e.height);
        
        // 3. Ship Main Hull (Military blue-grey paint with 3D Bevel)
        ctx.fillStyle = '#8392a0';
        ctx.strokeStyle = '#272e35';
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        // Pointy bow at the top
        ctx.moveTo(0, -e.height * 0.6);
        // Right hull profile
        ctx.lineTo(e.width * 0.5, -e.height * 0.28);
        ctx.lineTo(e.width * 0.42, e.height * 0.52);
        // Stern
        ctx.lineTo(-e.width * 0.42, e.height * 0.52);
        // Left hull profile
        ctx.lineTo(-e.width * 0.5, -e.height * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3.1 3D bevel shading on the right side of the hull
        ctx.fillStyle = 'rgba(30, 40, 50, 0.18)';
        ctx.beginPath();
        ctx.moveTo(0, -e.height * 0.6);
        ctx.lineTo(e.width * 0.5, -e.height * 0.28);
        ctx.lineTo(e.width * 0.42, e.height * 0.52);
        ctx.lineTo(0, e.height * 0.52);
        ctx.closePath();
        ctx.fill();

        // 3.2 Fine panel stripes on deck
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let yOffset = -e.height * 0.3; yOffset <= e.height * 0.4; yOffset += 20) {
            ctx.moveTo(-e.width * 0.2, yOffset);
            ctx.lineTo(e.width * 0.2, yOffset);
        }
        ctx.stroke();

        // 3.3 Anchor Chains at bow (proa)
        ctx.strokeStyle = '#1a2024';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -e.height * 0.44);
        ctx.quadraticCurveTo(-6, -e.height * 0.46, -8, -e.height * 0.49);
        ctx.moveTo(0, -e.height * 0.44);
        ctx.quadraticCurveTo(6, -e.height * 0.46, 8, -e.height * 0.49);
        ctx.stroke();
        
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-8, -e.height * 0.49, 2.5, 0, Math.PI * 2);
        ctx.arc(8, -e.height * 0.49, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Glowing blue-cyan portholes along the side hull plates
        ctx.fillStyle = 'rgba(60, 200, 255, 0.7)';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(-e.width * 0.32, -e.height * 0.15 + i * 20, 1.8, 0, Math.PI * 2);
            ctx.arc(e.width * 0.32, -e.height * 0.15 + i * 20, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 4. Deck Superstructures (Angled levels)
        ctx.fillStyle = '#657482';
        
        // Foredeck breakwater triangle
        ctx.strokeStyle = '#272e35';
        ctx.beginPath();
        ctx.moveTo(0, -e.height * 0.45);
        ctx.lineTo(e.width * 0.32, -e.height * 0.32);
        ctx.lineTo(-e.width * 0.32, -e.height * 0.32);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Main cabin bridge block
        ctx.fillRect(-e.width * 0.28, -e.height * 0.18, e.width * 0.56, e.height * 0.38);
        ctx.strokeRect(-e.width * 0.28, -e.height * 0.18, e.width * 0.56, e.height * 0.38);

        // Lifeboats (orange capsules) on bridge sides
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(-e.width * 0.33, -e.height * 0.05, 5, 12);
        ctx.fillRect(e.width * 0.33 - 5, -e.height * 0.05, 5, 12);
        ctx.strokeStyle = '#181b1e';
        ctx.lineWidth = 1;
        ctx.strokeRect(-e.width * 0.33, -e.height * 0.05, 5, 12);
        ctx.strokeRect(e.width * 0.33 - 5, -e.height * 0.05, 5, 12);
        
        // Bridge windows (black bars)
        ctx.fillStyle = '#1c242b';
        ctx.fillRect(-e.width * 0.2, -e.height * 0.14, e.width * 0.4, 4);

        // 5. Foredeck Weaponry
        // A. 4.5-inch Naval Gun Turret (Single angled barrel pointing fore)
        ctx.fillStyle = '#515e6b';
        ctx.beginPath();
        ctx.arc(0, -e.height * 0.33, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Gun barrel
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -e.height * 0.33);
        ctx.lineTo(0, -e.height * 0.42);
        ctx.stroke();

        // B. Sea Dart Missile Launcher (Foredeck bridge launcher with two miniature missiles loaded!)
        ctx.fillStyle = '#404a54';
        ctx.fillRect(-6, -e.height * 0.24, 12, 6);
        ctx.strokeRect(-6, -e.height * 0.24, 12, 6);
        
        // Dual white missiles with red tips
        ctx.fillStyle = '#fff';
        ctx.fillRect(-5, -e.height * 0.27, 2.5, 6);
        ctx.fillRect(2.5, -e.height * 0.27, 2.5, 6);
        ctx.fillStyle = '#ff0033';
        ctx.fillRect(-5, -e.height * 0.29, 2.5, 2);
        ctx.fillRect(2.5, -e.height * 0.29, 2.5, 2);

        // 6. Masts, Radome Domes and Rigging
        // White spherical radomes (Fore and Aft Type 909 tracking systems)
        ctx.fillStyle = '#f0f4f8';
        ctx.beginPath(); ctx.arc(0, -e.height * 0.08, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, e.height * 0.22, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        
        // Radar Mast (Lattice frames + rotating dish)
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Lattice crossbar struts
        ctx.moveTo(-10, e.height * 0.04); ctx.lineTo(10, e.height * 0.04);
        ctx.moveTo(-7, e.height * 0.08); ctx.lineTo(7, e.height * 0.08);
        ctx.moveTo(0, e.height * 0.02); ctx.lineTo(0, e.height * 0.12);
        ctx.stroke();
        
        // Rotating search radar dish (glowing orange blip)
        ctx.fillStyle = 'rgba(79, 230, 136, 0.9)';
        ctx.beginPath();
        const radarAngle = performance.now() / 150;
        ctx.ellipse(0, e.height * 0.02, Math.abs(10 * Math.sin(radarAngle)), 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 7. Funnel Exhaust Stacks & Exhaust smoke
        ctx.fillStyle = '#222';
        ctx.fillRect(-5, e.height * 0.14, 10, 8);
        if (Math.random() < 0.25) {
            this.particles.push({
                x: e.x + (Math.random() - 0.5) * 6,
                y: e.y + e.height * 0.14,
                vx: -40 - Math.random() * 30,
                vy: (Math.random() - 0.5) * 15,
                r: 4 + Math.random() * 7,
                life: 0.9,
                maxLife: 0.9,
                color: 'rgba(60, 60, 60, 0.45)'
            });
        }

        // 7.2 Stern mast with waving British military flag (ensign)
        ctx.strokeStyle = '#1b2024';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, e.height * 0.44);
        ctx.lineTo(0, e.height * 0.52);
        ctx.stroke();
        
        ctx.save();
        ctx.translate(0, e.height * 0.48);
        const wave = Math.sin(performance.now() / 80) * 1.5;
        ctx.fillStyle = '#ffffff'; // base flag
        ctx.beginPath();
        ctx.moveTo(0, -3.5);
        ctx.quadraticCurveTo(5, -3.5 + wave, 10, -3.5);
        ctx.lineTo(10, 3.5);
        ctx.quadraticCurveTo(5, 3.5 + wave, 0, 3.5);
        ctx.closePath();
        ctx.fill();
        
        // Red cross overlay
        ctx.fillStyle = '#c91414';
        ctx.fillRect(0, -0.8, 10, 1.6);
        ctx.fillRect(3.5, -3.5, 1.6, 7);
        ctx.restore();
        
        // 8. Healthbar for miniboss
        const hpPercent = e.hp / e.maxHp;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(-35, -e.height * 0.72, 70, 6);
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(-35, -e.height * 0.72, 70 * hpPercent, 6);

        ctx.restore();
    }

    drawLandingShip(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);
        
        if (e.flashTime > 0) {
            ctx.filter = 'brightness(2.2)';
        }

        // 1. Water foam wake breaking around ship
        ctx.fillStyle = 'rgba(230, 245, 255, 0.4)';
        const waveOffset = Math.sin(performance.now() / 80) * 4;
        ctx.beginPath();
        ctx.ellipse(0, -e.height * 0.45, 30 + waveOffset, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(-25, e.height * 0.35, 12, 35, Math.PI / 16, 0, Math.PI * 2);
        ctx.ellipse(25, e.height * 0.35, 12, 35, -Math.PI / 16, 0, Math.PI * 2);
        ctx.fill();

        // 2. Main Hull outline (Auxiliary Landing Ship)
        // Red underwater keel
        ctx.fillStyle = '#9b3c3c';
        ctx.beginPath();
        ctx.moveTo(-e.width * 0.48, e.height * 0.3);
        ctx.lineTo(-e.width * 0.44, -e.height * 0.4);
        ctx.quadraticCurveTo(0, -e.height * 0.52, e.width * 0.44, -e.height * 0.4);
        ctx.lineTo(e.width * 0.48, e.height * 0.3);
        ctx.quadraticCurveTo(0, e.height * 0.46, -e.width * 0.48, e.height * 0.3);
        ctx.fill();

        // Main superstructure steel-gray hull
        ctx.fillStyle = '#57626e';
        ctx.beginPath();
        ctx.moveTo(-e.width * 0.46, e.height * 0.28);
        ctx.lineTo(-e.width * 0.42, -e.height * 0.38);
        ctx.quadraticCurveTo(0, -e.height * 0.5, e.width * 0.42, -e.height * 0.38);
        ctx.lineTo(e.width * 0.46, e.height * 0.28);
        ctx.quadraticCurveTo(0, e.height * 0.44, -e.width * 0.46, e.height * 0.28);
        ctx.fill();

        // Shadow hull overlay for 3D feel
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.moveTo(0, -e.height * 0.5);
        ctx.lineTo(e.width * 0.42, -e.height * 0.38);
        ctx.lineTo(e.width * 0.46, e.height * 0.28);
        ctx.quadraticCurveTo(0, e.height * 0.44, 0, e.height * 0.28);
        ctx.closePath();
        ctx.fill();

        // 3. Wooden-Grey cargo deck
        ctx.fillStyle = '#6e6a64';
        ctx.beginPath();
        ctx.moveTo(-e.width * 0.38, e.height * 0.25);
        ctx.lineTo(-e.width * 0.34, -e.height * 0.34);
        ctx.quadraticCurveTo(0, -e.height * 0.45, e.width * 0.34, -e.height * 0.34);
        ctx.lineTo(e.width * 0.38, e.height * 0.25);
        ctx.quadraticCurveTo(0, e.height * 0.38, -e.width * 0.38, e.height * 0.25);
        ctx.fill();

        // 4. Cargo Hatches and yellow guidelines
        ctx.strokeStyle = '#cda136';
        ctx.lineWidth = 1;
        ctx.strokeRect(-18, -e.height * 0.22, 36, e.height * 0.4);

        ctx.fillStyle = '#3a3f47'; // Cargo hatches
        ctx.fillRect(-12, -e.height * 0.15, 24, 30);
        ctx.fillRect(-12, e.height * 0.05, 24, 30);

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(-12, -e.height * 0.15, 24, 30);
        ctx.strokeRect(-12, e.height * 0.05, 24, 30);

        // 5. Foredeck Crane
        ctx.fillStyle = '#7a8793';
        ctx.fillRect(-4, -e.height * 0.3, 8, 8);
        ctx.strokeStyle = '#2b3238';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -e.height * 0.28);
        ctx.lineTo(15, -e.height * 0.32);
        ctx.stroke();

        // 6. Aft Superstructure (Bridge & Cabins)
        ctx.fillStyle = '#414952';
        ctx.beginPath();
        ctx.moveTo(-e.width * 0.38, e.height * 0.15);
        ctx.lineTo(-e.width * 0.38, e.height * 0.32);
        ctx.quadraticCurveTo(0, e.height * 0.42, e.width * 0.38, e.height * 0.32);
        ctx.lineTo(e.width * 0.38, e.height * 0.15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#7e8a96';
        ctx.fillRect(-22, e.height * 0.18, 44, 18);
        ctx.fillStyle = '#545f6b';
        ctx.fillRect(-15, e.height * 0.23, 30, 10);

        // Glass windows on bridge
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-18, e.height * 0.19, 6, 4);
        ctx.fillRect(-8, e.height * 0.19, 6, 4);
        ctx.fillRect(2, e.height * 0.19, 6, 4);
        ctx.fillRect(12, e.height * 0.19, 6, 4);

        // Twin funnels on superstructure emitting smoke particles
        ctx.fillStyle = '#222';
        ctx.fillRect(-12, e.height * 0.28, 6, 12);
        ctx.fillRect(6, e.height * 0.28, 6, 12);
        
        // Spawn black smoke
        if (Math.random() < 0.25) {
            this.particles.push({
                x: e.x - 9,
                y: e.y + e.height * 0.28,
                vx: -20 + Math.random() * 10,
                vy: 40 + Math.random() * 20,
                r: 4 + Math.random() * 6,
                life: 1.0,
                maxLife: 1.0,
                color: 'rgba(50, 50, 50, 0.4)'
            });
            this.particles.push({
                x: e.x + 9,
                y: e.y + e.height * 0.28,
                vx: 20 - Math.random() * 10,
                vy: 40 + Math.random() * 20,
                r: 4 + Math.random() * 6,
                life: 1.0,
                maxLife: 1.0,
                color: 'rgba(50, 50, 50, 0.4)'
            });
        }

        // 7. Gun Turrets (Anti-aircraft bofors)
        ctx.fillStyle = '#222';
        ctx.save();
        ctx.translate(-e.width * 0.32, -e.height * 0.05);
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-12, -4); ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(e.width * 0.32, -e.height * 0.05);
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(12, -4); ctx.stroke();
        ctx.restore();

        // 8. Health Bar overlay
        const hpPercent = e.hp / e.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-35, -e.height * 0.58, 70, 7);
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(-34, -e.height * 0.57, 68 * hpPercent, 5);

        ctx.restore();
    }

    /**
     * Procedural Drawing: HMS Invincible Aircraft Carrier (Main Boss)
     * High-fidelity flagship deck with angled runway stripes, hazard ski-jump bow,
     * radar island superstructure, parked Sea Harrier details, and water splashes.
     */
    drawCarrier(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);
        
        if (e.flashTime > 0) {
            ctx.filter = 'brightness(2.2)';
        }

        // 1. Massive Water Displacement Splashes (Foamy wakes)
        ctx.fillStyle = 'rgba(230, 245, 255, 0.45)';
        const wakeTime = performance.now() / 90;
        
        // Massive Bow wave spray
        for (let i = 0; i < 6; i++) {
            const r = 14 + Math.sin(wakeTime + i) * 6;
            ctx.beginPath();
            ctx.arc(-e.width * 0.4 - i * 5, -e.height * 0.48 + i * 20, r, 0, Math.PI * 2);
            ctx.arc(e.width * 0.4 + i * 5, -e.height * 0.48 + i * 20, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Displacement shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(-e.width * 0.56, -e.height * 0.52 + 10, e.width * 1.12, e.height * 1.04);
        
        // 3. Carrier Deck Hull (Iron clad grey paint)
        ctx.fillStyle = '#5c656e';
        ctx.strokeStyle = '#22262a';
        ctx.lineWidth = 3.5;
        
        ctx.beginPath();
        // Ski-jump ramp bow (Angled ski ramp characteristic of Royal Navy carriers)
        ctx.moveTo(-e.width * 0.38, -e.height * 0.5);
        ctx.lineTo(e.width * 0.32, -e.height * 0.46);
        ctx.lineTo(e.width * 0.45, e.height * 0.45);
        ctx.lineTo(-e.width * 0.46, e.height * 0.48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3.1 3D hull shadow shading on right side
        ctx.fillStyle = 'rgba(30, 40, 50, 0.22)';
        ctx.beginPath();
        ctx.moveTo(e.width * 0.32, -e.height * 0.46);
        ctx.lineTo(e.width * 0.45, e.height * 0.45);
        ctx.lineTo(e.width * 0.4, e.height * 0.45);
        ctx.lineTo(e.width * 0.28, -e.height * 0.46);
        ctx.closePath();
        ctx.fill();

        // 3.2 Fine panel stripes on deck
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let xOffset = -e.width * 0.3; xOffset <= e.width * 0.1; xOffset += 25) {
            ctx.moveTo(xOffset, -e.height * 0.4);
            ctx.lineTo(xOffset + 15, e.height * 0.4);
        }
        ctx.stroke();

        // 3.3 Edge safety nets (steel wire bars along port profile)
        ctx.strokeStyle = '#3a444d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let yOffset = -e.height * 0.45; yOffset <= e.height * 0.45; yOffset += 15) {
            ctx.moveTo(-e.width * 0.42, yOffset);
            ctx.lineTo(-e.width * 0.45, yOffset);
        }
        ctx.stroke();
        
        // Ski-jump deck border hazard warning stripes (yellow/black diagonal bars)
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = '#e8a91c'; // Golden yellow
        ctx.beginPath();
        ctx.moveTo(-e.width * 0.38, -e.height * 0.5);
        ctx.lineTo(e.width * 0.32, -e.height * 0.46);
        ctx.lineTo(e.width * 0.32, -e.height * 0.44);
        ctx.lineTo(-e.width * 0.38, -e.height * 0.48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw diagonal hash stripes inside hazard zone
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.2;
        ctx.save();
        ctx.clip();
        for (let x = -e.width * 0.5; x < e.width * 0.5; x += 15) {
            ctx.beginPath();
            ctx.moveTo(x, -e.height * 0.6);
            ctx.lineTo(x + 20, -e.height * 0.3);
            ctx.stroke();
        }
        ctx.restore();

        // 4. Landing Runway Strip Lane Markings
        // Angled deck flight path border (yellow stripes)
        ctx.strokeStyle = '#ffd800';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-e.width * 0.28, -e.height * 0.38);
        ctx.lineTo(-e.width * 0.1, e.height * 0.4);
        ctx.stroke();
        
        // Center runway landing dashes (white)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        ctx.moveTo(-e.width * 0.06, -e.height * 0.32);
        ctx.lineTo(e.width * 0.14, e.height * 0.42);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // "R05" painted deck letters (identifies HMS Invincible)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = 'bold 22px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.translate(e.width * 0.08, -e.height * 0.34);
        ctx.rotate(0.12);
        ctx.fillText('R05', 0, 0);
        ctx.restore();
        
        // Arresting gear steel wires
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-e.width * 0.18 + i * 8, e.height * 0.18 + i * 20);
            ctx.lineTo(e.width * 0.12 + i * 8, e.height * 0.22 + i * 20);
            ctx.stroke();
        }
        
        // Helicopter landing spot circle fore (glowing amber)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(-e.width * 0.12, -e.height * 0.15, 15, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ff7c00';
        ctx.font = 'bold 12px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', -e.width * 0.12, -e.height * 0.15);

        // 5. Parked Sea Harriers details on the port side of the deck!
        // Draws 3 tiny planes parked with wings folded, which looks extremely realistic
        const drawParkedHarrier = (ctx, px, py) => {
            ctx.save();
            ctx.translate(px, py);
            ctx.fillStyle = '#424f59';
            ctx.strokeStyle = '#1c242a';
            ctx.lineWidth = 1;
            // folded wings
            ctx.beginPath();
            ctx.moveTo(0, 3); 
            ctx.lineTo(-8, 4); // smaller wing spread
            ctx.lineTo(-3, 0); 
            ctx.lineTo(0, -10);
            ctx.lineTo(3, 0); 
            ctx.lineTo(8, 4); 
            ctx.closePath(); 
            ctx.fill(); 
            ctx.stroke();
            // fuselage
            ctx.fillStyle = '#54636e';
            ctx.fillRect(-2, -10, 4, 15);
            ctx.strokeRect(-2, -10, 4, 15);
            // tiny red roundel
            ctx.fillStyle = '#c91414';
            ctx.beginPath(); ctx.arc(-4, 2, 1.2, 0, Math.PI * 2); ctx.arc(4, 2, 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        };
        drawParkedHarrier(ctx, -e.width * 0.32, -e.height * 0.1);
        drawParkedHarrier(ctx, -e.width * 0.34, e.height * 0.02);
        drawParkedHarrier(ctx, -e.width * 0.36, e.height * 0.14);

        // Parked support helicopter
        const drawParkedHeli = (ctx, px, py) => {
            ctx.save();
            ctx.translate(px, py);
            ctx.fillStyle = '#2d3b32';
            ctx.strokeStyle = '#151c17';
            ctx.lineWidth = 1;
            ctx.fillRect(-3, -8, 6, 16);
            ctx.strokeRect(-3, -8, 6, 16);
            
            ctx.fillStyle = '#555';
            ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(0,0); ctx.lineTo(-2, -10);
            ctx.moveTo(0,0); ctx.lineTo(2, 10);
            ctx.stroke();
            ctx.restore();
        };
        drawParkedHeli(ctx, -e.width * 0.28, -e.height * 0.2);

        // 6. Massive Command Island (Starboard side of deck)
        ctx.fillStyle = '#7a8690';
        ctx.strokeStyle = '#22262a';
        ctx.lineWidth = 2.5;
        // Multi-level island structure
        ctx.fillRect(e.width * 0.18, -e.height * 0.22, e.width * 0.22, e.height * 0.44);
        ctx.strokeRect(e.width * 0.18, -e.height * 0.22, e.width * 0.22, e.height * 0.44);
        
        // Exhaust smokestack
        ctx.fillStyle = '#222';
        ctx.fillRect(e.width * 0.25, e.height * 0.12, 16, 12);

        // Mobile deck crane
        ctx.fillStyle = '#ccaa00'; // yellow crane body
        ctx.fillRect(e.width * 0.15, -e.height * 0.04, 8, 16);
        ctx.strokeStyle = '#111';
        ctx.strokeRect(e.width * 0.15, -e.height * 0.04, 8, 16);
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(e.width * 0.19, -e.height * 0.02);
        ctx.lineTo(e.width * 0.06, -e.height * 0.06);
        ctx.stroke();
        
        // Smoke particles scheduling from boss smokestack BGM BGM
        if (Math.random() < 0.3) {
            this.particles.push({
                x: e.x + e.width * 0.28,
                y: e.y + e.height * 0.14,
                vx: -60 - Math.random() * 40,
                vy: (Math.random() - 0.5) * 15,
                r: 8 + Math.random() * 10,
                life: 1.5,
                maxLife: 1.5,
                color: 'rgba(40, 40, 40, 0.5)'
            });
        }
        
        // Multi-level bridge windows
        ctx.fillStyle = '#111';
        ctx.fillRect(e.width * 0.2, -e.height * 0.18, e.width * 0.12, 4);
        ctx.fillRect(e.width * 0.2, -e.height * 0.1, e.width * 0.12, 4);
        
        // Heavy communication radars & antennas
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.width * 0.29, -e.height * 0.22); ctx.lineTo(e.width * 0.29, -e.height * 0.32); // Main mast
        ctx.moveTo(e.width * 0.23, -e.height * 0.22); ctx.lineTo(e.width * 0.23, -e.height * 0.29);
        ctx.stroke();

        // Rigging mast lines
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(e.width * 0.29, -e.height * 0.28);
        ctx.lineTo(e.width * 0.2, -e.height * 0.18);
        ctx.lineTo(e.width * 0.38, -e.height * 0.18);
        ctx.stroke();

        // British flag waving on Command Island
        ctx.save();
        ctx.translate(e.width * 0.29, -e.height * 0.3);
        const islandWave = Math.sin(performance.now() / 90) * 1.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.quadraticCurveTo(4, -3 + islandWave, 8, -3);
        ctx.lineTo(8, 3);
        ctx.quadraticCurveTo(4, 3 + islandWave, 0, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c91414';
        ctx.fillRect(0, -0.6, 8, 1.2);
        ctx.fillRect(3, -3, 1.2, 6);
        ctx.restore();
        
        // Large search radar dish rotating (glowing neon-green)
        ctx.fillStyle = 'rgba(79, 230, 136, 0.9)';
        ctx.beginPath();
        const mainRadarAngle = performance.now() / 100;
        ctx.ellipse(e.width * 0.29, -e.height * 0.32, Math.abs(12 * Math.sin(mainRadarAngle)), 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 7. Defensive Weapons (Phalanx CIWS domes and launcher pods on side sponsons)
        // White "R2-D2" Phalanx dome on left sponson
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-e.width * 0.44, -e.height * 0.25, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillRect(-e.width * 0.44 - 2, -e.height * 0.25, 4, 6);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-e.width * 0.44, -e.height * 0.22); ctx.lineTo(-e.width * 0.44 - 3, -e.height * 0.22); ctx.stroke(); // mini gun barrel
        
        // White Phalanx dome on right sponson aft
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(e.width * 0.44, e.height * 0.3, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillRect(e.width * 0.44 - 2, e.height * 0.3, 4, 6);
        
        // 8. Large Boss Healthbar
        const hpPercent = e.hp / e.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(-e.width * 0.4, -e.height * 0.58, e.width * 0.8, 8);
        ctx.fillStyle = '#ff1100';
        ctx.fillRect(-e.width * 0.4, -e.height * 0.58, e.width * 0.8 * hpPercent, 8);
        
        ctx.restore();
    }

    /**
     * Weapon System: Spawns player ammunition
     */
    firePlayerWeapon() {
        const config = this.planesConfig[this.selectedPlaneIndex];
        this.player.shootCooldown = config.fireRate;
        
        // Reduce fire cooldown when Pucará overdrive is active
        if (this.selectedPlaneIndex === 2 && this.overdriveTimer > 0) {
            this.player.shootCooldown = config.fireRate / 1.8;
        }

        if (window.audioEngine) {
            window.audioEngine.playLaser();
        }

        const weapon = this.player.activeWeapon || 'standard';
        const damage = config.damage;

        if (weapon === 'standard') {
            // Single bullet
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - 18,
                vx: 0,
                vy: -600,
                damage: damage,
                type: 'standard'
            });
        } else if (weapon === 'dual') {
            // Dual bullets
            this.bullets.push({
                x: this.player.x - 10,
                y: this.player.y - 12,
                vx: 0,
                vy: -600,
                damage: damage,
                type: 'standard'
            });
            this.bullets.push({
                x: this.player.x + 10,
                y: this.player.y - 12,
                vx: 0,
                vy: -600,
                damage: damage,
                type: 'standard'
            });
        } else if (weapon === 'spread') {
            // Spread: 3 bullets (Front and 15-degree diagonals)
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - 18,
                vx: 0,
                vy: -600,
                damage: damage,
                type: 'standard'
            });
            // -15 deg
            this.bullets.push({
                x: this.player.x - 8,
                y: this.player.y - 14,
                vx: -150,
                vy: -580,
                damage: damage * 0.9,
                type: 'standard'
            });
            // +15 deg
            this.bullets.push({
                x: this.player.x + 8,
                y: this.player.y - 14,
                vx: 150,
                vy: -580,
                damage: damage * 0.9,
                type: 'standard'
            });
        } else if (weapon === 'side') {
            // Front + Left + Right
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - 18,
                vx: 0,
                vy: -600,
                damage: damage,
                type: 'standard'
            });
            // Horizontal Left
            this.bullets.push({
                x: this.player.x - 18,
                y: this.player.y,
                vx: -500,
                vy: 0,
                damage: damage * 0.8,
                type: 'standard'
            });
            // Horizontal Right
            this.bullets.push({
                x: this.player.x + 18,
                y: this.player.y,
                vx: 500,
                vy: 0,
                damage: damage * 0.8,
                type: 'standard'
            });
        } else if (weapon === 'rear') {
            // Front + Rear
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - 18,
                vx: 0,
                vy: -600,
                damage: damage,
                type: 'standard'
            });
            // Straight Backwards
            this.bullets.push({
                x: this.player.x,
                y: this.player.y + 18,
                vx: 0,
                vy: 600,
                damage: damage,
                type: 'standard'
            });
        }
    }

    /**
     * Triggers Selectable Plane Special Attack
     */
    triggerSpecialWeapon() {
        this.player.specialCharge = 0;
        const config = this.planesConfig[this.selectedPlaneIndex];
        
        if (config.specialType === 'bomb') {
            // Bomb falls, flashes screen, and wipes out common enemies/bullets
            if (window.audioEngine) {
                window.audioEngine.playBombDrop();
            }
            
            // Screen flash overlay trigger
            this.screenFlash = 30; // frames
            
            // Wipe standard enemies, hurt bosses heavily
            this.enemies.forEach(e => {
                if (e.isBoss || e.isMiniboss) {
                    e.hp -= 250;
                    e.flashTime = 0.5;
                } else {
                    e.hp = 0; // Destroyed
                }
            });
            
            // Clear enemy bullets
            this.enemyBullets = [];
        } 
        else if (config.specialType === 'exocet') {
            // Launches powerful heat-seeking Exocet missiles
            if (window.audioEngine) {
                window.audioEngine.playExocet();
            }
            
            this.bullets.push({
                x: this.player.x - 20,
                y: this.player.y,
                vx: -150,
                vy: -300,
                damage: 350,
                type: 'exocet'
            });
            this.bullets.push({
                x: this.player.x + 20,
                y: this.player.y,
                vx: 150,
                vy: -300,
                damage: 350,
                type: 'exocet'
            });
        } 
        else if (config.specialType === 'overdrive') {
            // IA-58 Pucará: Rapid overdrive bullet storm
            if (window.audioEngine) {
                window.audioEngine.playSpecialReady();
            }
            this.overdriveTimer = 4000; // 4 seconds overdrive
            
            // Visual particles showing fire shield
            for (let i = 0; i < 30; i++) {
                this.particles.push({
                    x: this.player.x + (Math.random() - 0.5) * 40,
                    y: this.player.y + (Math.random() - 0.5) * 40,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    r: 2 + Math.random() * 3,
                    life: 0.8,
                    maxLife: 0.8,
                    color: '#ffde3b'
                });
            }
        }
    }

    /**
     * Target locator for homing Exocet missile
     */
    findExocetTarget() {
        if (this.enemies.length === 0) return null;
        
        // Prioritize carriers or destroyers, then closest plane
        const primary = this.enemies.find(e => e.isBoss || e.isMiniboss);
        if (primary) return primary;
        
        // Closest plane
        let closest = this.enemies[0];
        let minDist = 99999;
        this.enemies.forEach(e => {
            const d = Math.abs(e.y - this.player.y);
            if (d < minDist) {
                minDist = d;
                closest = e;
            }
        });
        return closest;
    }

    /**
     * Spawns squadrons of Sea Harriers or Sea Kings
     */
    spawnEnemySquad() {
        const squadType = Math.random() < 0.7 ? 'harrier' : 'seaking';
        const startX = 60 + Math.random() * (this.width - 120);
        
        if (squadType === 'harrier') {
            // Harrier wave squad (V formation)
            const size = 3;
            for (let i = 0; i < size; i++) {
                const offsetX = (i - 1) * 45;
                const offsetY = -i * 40;
                this.enemies.push({
                    type: 'harrier',
                    x: startX + offsetX,
                    y: -60 + offsetY,
                    startX: startX + offsetX,
                    size: 24,
                    hp: 30,
                    maxHp: 30,
                    speed: 210,
                    pattern: 'sine',
                    age: 0,
                    shootTimer: Math.random() * 800,
                    shootInterval: 1400,
                    points: 150,
                    specialReward: 6,
                    flashTime: 0
                });
            }
        } else {
            // Heavy Sea King helicopter
            this.enemies.push({
                type: 'seaking',
                x: 80 + Math.random() * (this.width - 160),
                y: -80,
                size: 32,
                hp: 120,
                maxHp: 120,
                speed: 100,
                pattern: 'straight',
                age: 0,
                shootTimer: 0,
                shootInterval: 1200,
                points: 400,
                specialReward: 12,
                flashTime: 0
            });
        }

        // Spawn a Sea Destroyer (HMS Sheffield) miniboss scrolling on water at random intervals
        if (!this.bossSpawned && Math.random() < 0.15 && !this.enemies.some(e => e.isMiniboss)) {
            this.enemies.push({
                type: 'sheffield',
                isMiniboss: true,
                x: Math.random() < 0.5 ? 80 : this.width - 80,
                y: this.height - 180, // Stays in lower water scrolling horizontally
                width: 65,
                height: 120,
                size: 50,
                vx: 50, // slow speed horizontal
                hp: 550,
                maxHp: 550,
                shootTimer: 0,
                shootInterval: 2200,
                points: 2500,
                specialReward: 25,
                flashTime: 0
            });
        }
    }

    fireEnemyWeapon(e) {
        if (!this.player.active) return;
        
        if (window.audioEngine) {
            window.audioEngine.playEnemyLaser();
        }

        if (e.type === 'harrier') {
            // Direct shot towards player
            const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
            this.enemyBullets.push({
                x: e.x,
                y: e.y + 12,
                vx: Math.cos(angle) * 280,
                vy: Math.sin(angle) * 280,
                size: 4
            });
        } else if (e.type === 'seaking') {
            // Fan shot (3 directions)
            const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
            const spread = 0.25; // radians
            
            [-1, 0, 1].forEach(dir => {
                this.enemyBullets.push({
                    x: e.x,
                    y: e.y + 16,
                    vx: Math.cos(angle + dir * spread) * 240,
                    vy: Math.sin(angle + dir * spread) * 240,
                    size: 5
                });
            });
        }
    }

    fireMinibossMissile(e) {
        if (!this.player.active) return;
        
        if (window.audioEngine) {
            window.audioEngine.playEnemyLaser();
        }

        // Spawn a homing targetable missile in enemies list
        this.enemies.push({
            type: 'missile',
            x: e.x,
            y: e.y - 40,
            size: 14,
            hp: 1,
            maxHp: 1,
            speed: 220,
            isMissile: true,
            vx: 0,
            vy: -50,
            age: 0,
            shootTimer: 0,
            shootInterval: 99999,
            points: 150,
            specialReward: 2,
            flashTime: 0
        });
    }

    spawnFinalBoss() {
        const mission = this.missions.find(m => m.id === this.currentMissionId) || this.missions[0];
        this.bossSpawned = true;
        
        // Remove common enemies
        this.enemies = this.enemies.filter(e => e.isMiniboss);
        
        if (mission.bossType === 'none') {
            this.bullets = [];
            this.enemyBullets = [];
            setTimeout(() => {
                this.triggerVictory();
            }, 1000);
            return;
        }

        if (mission.bossType === 'heavy_squad') {
            // Spawn 3 Heavy Sea Kings at top as boss squadron
            for (let i = 0; i < 3; i++) {
                this.enemies.push({
                    type: 'seaking',
                    isBoss: true,
                    x: this.width / 4 * (i + 1),
                    y: -100,
                    size: 40,
                    hp: 400,
                    maxHp: 400,
                    speed: 80,
                    vx: 40 * (i - 1),
                    age: 0,
                    shootTimer: 0,
                    shootInterval: 1400,
                    points: 2000,
                    specialReward: 0,
                    flashTime: 0
                });
            }
            return;
        }

        if (mission.bossType === 'sheffield') {
            // Spawn Destroyer HMS Sheffield as main boss descending from top
            this.enemies.push({
                type: 'sheffield',
                isBoss: true,
                x: this.width / 2,
                y: -150,
                width: 75,
                height: 140,
                size: 60,
                vx: 30,
                hp: 1200,
                maxHp: 1200,
                shootTimer: 0,
                shootInterval: 2000,
                points: 5000,
                specialReward: 0,
                flashTime: 0
            });
            return;
        }

        if (mission.bossType === 'sheffield_escorted') {
            // HMS Sheffield with 2 escort Harriers
            this.enemies.push({
                type: 'sheffield',
                isBoss: true,
                x: this.width / 2,
                y: -150,
                width: 75,
                height: 140,
                size: 60,
                vx: 35,
                hp: 1500,
                maxHp: 1500,
                shootTimer: 0,
                shootInterval: 1800,
                points: 7500,
                specialReward: 0,
                flashTime: 0
            });
            for (let i = 0; i < 2; i++) {
                this.enemies.push({
                    type: 'harrier',
                    x: this.width / 3 * (i + 1),
                    y: -50,
                    startX: this.width / 3 * (i + 1),
                    size: 24,
                    hp: 80,
                    maxHp: 80,
                    speed: 150,
                    pattern: 'sine',
                    age: 0,
                    shootTimer: 0,
                    shootInterval: 1200,
                    points: 300,
                    specialReward: 0,
                    flashTime: 0
                });
            }
            return;
        }

        if (mission.bossType === 'sir_galahad') {
            // Spawn Sir Galahad Landing Ship
            this.enemies.push({
                type: 'sir_galahad',
                isBoss: true,
                x: this.width / 2,
                y: -180,
                width: 110,
                height: 200,
                size: 90,
                vx: 25,
                hp: 1800,
                maxHp: 1800,
                shootTimer: 0,
                shootInterval: 2400,
                points: 10000,
                specialReward: 0,
                flashTime: 0
            });
            return;
        }

        if (mission.bossType === 'invincible') {
            // Spawn HMS Invincible Carrier
            this.enemies.push({
                type: 'invincible',
                isBoss: true,
                x: this.width / 2,
                y: -150,
                width: 140,
                height: 230,
                size: 110,
                vx: 30,
                hp: 2500,
                maxHp: 2500,
                shootTimer: 0,
                shootInterval: 2800,
                points: 15000,
                specialReward: 0,
                flashTime: 0
            });
            return;
        }
    }

    fireBossWeapons(boss) {
        if (!this.player.active) return;
        
        if (window.audioEngine) {
            window.audioEngine.playExplosion(false);
        }

        // Heavy Bullet Hell Pattern: 12-direction ring
        const count = 16;
        const speed = 200;
        for (let i = 0; i < count; i++) {
            const angle = (i * Math.PI * 2) / count + (performance.now() / 1000);
            this.enemyBullets.push({
                x: boss.x,
                y: boss.y + 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5
            });
        }
        
        // Spawn supporting Sea Harrier
        if (this.enemies.length < 4) {
            this.enemies.push({
                type: 'harrier',
                x: boss.x + (Math.random() - 0.5) * 100,
                y: boss.y + 60,
                startX: boss.x,
                size: 24,
                hp: 30,
                maxHp: 30,
                speed: 180,
                pattern: 'sine',
                age: 0,
                shootTimer: 0,
                shootInterval: 1500,
                points: 100,
                specialReward: 0,
                flashTime: 0
            });
        }
    }

    /**
     * Detections and collisions loop
     */
    detectCollisions() {
        if (!this.player.active) return;
        
        const playerRadius = this.player.size * 0.55;

        // 1. Player Bullets hitting Enemies
        this.bullets.forEach(b => {
            this.enemies.forEach(e => {
                if (e.hp <= 0) return;
                
                // Ship boundary box or plane circle collision check
                let hit = false;
                if (e.isBoss || e.isMiniboss) {
                    // Box check
                    const bx = e.x - e.width * 0.5;
                    const by = e.y - e.height * 0.5;
                    if (b.x > bx && b.x < bx + e.width && b.y > by && b.y < by + e.height) {
                        hit = true;
                    }
                } else {
                    // Distance check
                    const dist = Math.hypot(b.x - e.x, b.y - e.y);
                    if (dist < e.size * 0.75 + 4) {
                        hit = true;
                    }
                }
                
                if (hit) {
                    e.hp -= b.damage;
                    e.flashTime = 0.1; // Flash effect
                    b.y = -999; // Destroy bullet
                    
                    // Small impact particles
                    for (let i = 0; i < 3; i++) {
                        this.particles.push({
                            x: b.x,
                            y: b.y,
                            vx: (Math.random() - 0.5) * 100,
                            vy: (Math.random() - 0.5) * 100,
                            r: 1.5 + Math.random() * 2,
                            life: 0.2,
                            maxLife: 0.2,
                            color: '#ffde3b'
                        });
                    }
                }
            });
        });

        // 1.5. Player Bullets hitting Enemy Bullets (destroying them like in 1942)
        this.bullets.forEach(b => {
            if (b.y <= -100) return; // already destroyed
            
            this.enemyBullets.forEach(eb => {
                if (eb.y >= 9999) return; // already destroyed
                
                const dist = Math.hypot(b.x - eb.x, b.y - eb.y);
                const collDist = (eb.size || 5) + 6; 
                if (dist < collDist) {
                    b.y = -999;
                    eb.y = 9999;
                    
                    // Cute tiny spark particles for bullet collision
                    for (let i = 0; i < 3; i++) {
                        this.particles.push({
                            x: eb.x,
                            y: eb.y,
                            vx: (Math.random() - 0.5) * 80,
                            vy: (Math.random() - 0.5) * 80,
                            r: 1.0 + Math.random() * 1.5,
                            life: 0.15,
                            maxLife: 0.15,
                            color: '#ff9421' // bright orange sparks
                        });
                    }
                }
            });
        });
        
        // Clean processed bullets and enemy bullets immediately
        this.bullets = this.bullets.filter(b => b.y > -100);
        this.enemyBullets = this.enemyBullets.filter(eb => eb.y < 9999);

        // 2. Enemy Bullets hitting Player (only if not invulnerable)
        if (this.player.invulnerable <= 0) {
            this.enemyBullets.forEach(eb => {
                const dist = Math.hypot(eb.x - this.player.x, eb.y - this.player.y);
                if (dist < playerRadius + eb.size) {
                    this.damagePlayer(15);
                    eb.y = 9999; // destroy bullet
                }
            });
            this.enemyBullets = this.enemyBullets.filter(eb => eb.y < this.height);
        }

        // 3. Enemy Plane crash into Player
        if (this.player.invulnerable <= 0) {
            this.enemies.forEach(e => {
                if (e.isBoss || e.isMiniboss || e.hp <= 0) return;
                const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
                if (dist < playerRadius + e.size * 0.55) {
                    this.damagePlayer(35);
                    e.hp = 0; // Instantly kills common enemy
                }
            });
        }

        // 4. Player collides with Pickups
        this.pickups.forEach((p, idx) => {
            const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
            if (dist < playerRadius + 12) {
                let sparkColor = '#e6be4f';
                
                if (p.type === 'repair') {
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
                    sparkColor = '#4fe688';
                    if (window.audioEngine) window.audioEngine.playSpecialReady();
                } else if (p.type === 'shield') {
                    this.player.shield = 1;
                    sparkColor = '#00f0ff';
                    if (window.audioEngine) window.audioEngine.playSpecialReady();
                } else if (p.type.startsWith('weapon_')) {
                    const wType = p.type.split('_')[1];
                    this.player.activeWeapon = wType;
                    this.player.weaponTimer = 15000; // 15 seconds duration
                    sparkColor = '#e6be4f';
                    if (window.audioEngine) window.audioEngine.playCoin();
                } else if (p.type === 'upgrade') { // fallback
                    this.player.activeWeapon = 'dual';
                    this.player.weaponTimer = 15000;
                    sparkColor = '#e6be4f';
                    if (window.audioEngine) window.audioEngine.playCoin();
                }
                
                // Spawn float indicator sparks
                for (let i = 0; i < 15; i++) {
                    this.particles.push({
                        x: p.x,
                        y: p.y,
                        vx: (Math.random() - 0.5) * 150,
                        vy: (Math.random() - 0.5) * 150,
                        r: 2 + Math.random() * 3,
                        life: 0.5,
                        maxLife: 0.5,
                        color: sparkColor
                    });
                }
                
                this.pickups.splice(idx, 1);
            }
        });
    }

    damagePlayer(amount) {
        if (this.player.shield > 0) {
            this.player.shield = 0;
            this.player.invulnerable = 45; // brief protection
            if (window.audioEngine) {
                window.audioEngine.playPlayerHit();
            }
            // Cyan shield spark explosion particles
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 100 + Math.random() * 150;
                this.particles.push({
                    x: this.player.x,
                    y: this.player.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    r: 2 + Math.random() * 3,
                    life: 0.4,
                    maxLife: 0.4,
                    color: '#00f0ff'
                });
            }
            return;
        }
        
        this.player.hp -= amount;
        this.player.invulnerable = 45; // brief protection
        
        if (window.audioEngine) {
            window.audioEngine.playPlayerHit();
        }

        // Spark explosion
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                r: 2 + Math.random() * 3,
                life: 0.4,
                maxLife: 0.4,
                color: '#ff4400'
            });
        }

        if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.player.active = false;
            this.explodeEntity(this.player);
            
            setTimeout(() => {
                this.triggerGameOver();
            }, 1200);
        }
    }

    explodeEntity(e) {
        const isBig = e.isBoss || e.isMiniboss || e === this.player;
        
        if (window.audioEngine) {
            window.audioEngine.playExplosion(isBig);
        }

        // Spark explosion
        const count = isBig ? 60 : 15;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * (isBig ? 300 : 150);
            this.particles.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: 2 + Math.random() * (isBig ? 6 : 3),
                life: 0.5 + Math.random() * (isBig ? 0.8 : 0.3),
                maxLife: 1.0,
                color: Math.random() < 0.4 ? '#ff3300' : (Math.random() < 0.5 ? '#ffb700' : '#495a63')
            });
        }
        
        // Spawn wreckage chunks
        if (isBig) {
            const chunkCount = 5 + Math.random() * 5;
            for (let i = 0; i < chunkCount; i++) {
                this.particles.push({
                    x: e.x,
                    y: e.y,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80,
                    r: 4 + Math.random() * 5,
                    life: 1.2,
                    maxLife: 1.2,
                    color: '#323a41' // steel wreckage debris
                });
            }
        }

        // Trigger Victory if all bosses are down
        if (e.isBoss) {
            const otherBosses = this.enemies.filter(other => other.isBoss && other !== e && other.hp > 0);
            if (otherBosses.length === 0) {
                setTimeout(() => {
                    this.triggerVictory();
                }, 1500);
            }
        }
    }

    spawnPickupCheck(e) {
        let chance = 0.08;
        if (e.isMiniboss || e.isBoss) chance = 1.0; // Always spawns from large targets
        
        if (Math.random() < chance) {
            const r = Math.random();
            let type;
            if (e.isMiniboss || e.isBoss) {
                const roll = Math.random();
                if (roll < 0.25) type = 'repair';
                else if (roll < 0.45) type = 'shield';
                else {
                    const weapons = ['weapon_dual', 'weapon_spread', 'weapon_side', 'weapon_rear'];
                    type = weapons[Math.floor(Math.random() * weapons.length)];
                }
            } else {
                const roll = Math.random();
                if (roll < 0.4) type = 'repair';
                else if (roll < 0.55) type = 'shield';
                else {
                    const weapons = ['weapon_dual', 'weapon_spread', 'weapon_side', 'weapon_rear'];
                    type = weapons[Math.floor(Math.random() * weapons.length)];
                }
            }
            this.pickups.push({
                x: e.x,
                y: e.y,
                type: type
            });
        }
    }

    addScoreValue(val) {
        this.score += val;
    }

    chargePlayerSpecial(val) {
        if (!this.player.active) return;
        const prev = this.player.specialCharge;
        this.player.specialCharge = Math.min(100, this.player.specialCharge + val);
        
        // Play chime if ready triggers
        if (prev < 100 && this.player.specialCharge === 100) {
            if (window.audioEngine) {
                window.audioEngine.playSpecialReady();
            }
        }
    }

    spawnEngineParticle(x, y) {
        this.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 20,
            vy: Math.random() * 60 + 30, // Blow backwards
            r: 1.5 + Math.random() * 2,
            life: 0.3,
            maxLife: 0.3,
            color: 'rgba(255, 110, 0, 0.7)' // Fiery flame trail
        });
    }

    triggerGameOver() {
        if (this.gameOverTriggered) return;
        this.gameOverTriggered = true;
        this.stop();
        this.onGameOver(this.score);
    }

    triggerVictory() {
        if (this.victoryTriggered) return;
        this.victoryTriggered = true;
        
        // Save campaign progression
        try {
            const currentUnlocked = parseInt(localStorage.getItem('malvinas1982_unlocked_mission')) || 1;
            if (this.currentMissionId >= currentUnlocked && this.currentMissionId < 6) {
                localStorage.setItem('malvinas1982_unlocked_mission', this.currentMissionId + 1);
            }
        } catch (err) {
            console.error("No se pudo guardar el progreso de campaña:", err);
        }
        
        this.stop();
        this.onVictory(this.score);
    }

    /**
     * HUD Overlay: Draw high-tech amber radar overlay and status bars
     */
    drawHUD(ctx) {
        // Overlay screen borders
        ctx.strokeStyle = 'rgba(79, 230, 136, 0.3)'; // Neon tactical green
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, this.width - 10, this.height - 10);
        
        // 1. Top Panel: Scores & Distance
        ctx.fillStyle = '#4fe688';
        ctx.font = '16px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`PUNTOS: ${String(this.score).padStart(6, '0')}`, 20, 20);
        
        ctx.textAlign = 'right';
        const progress = Math.min(100, Math.floor((this.distanceCovered / this.distanceLimit) * 100));
        ctx.fillText(`DISTANCIA: ${progress}%`, this.width - 20, 20);
        
        // 2. Bottom status bar
        if (this.player.active) {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            
            // Health badge
            ctx.fillStyle = '#4fe688';
            ctx.fillText(`FUSELAJE`, 20, this.height - 50);
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(20, this.height - 40, 150, 15);
            ctx.strokeStyle = '#4fe688';
            ctx.strokeRect(20, this.height - 40, 150, 15);
            
            const hpPercent = this.player.hp / this.player.maxHp;
            ctx.fillStyle = hpPercent > 0.35 ? '#4fe688' : '#ff4400';
            ctx.fillRect(21, this.height - 39, 148 * hpPercent, 13);
            
            // Special weapon meter (amber yellow)
            ctx.textAlign = 'right';
            ctx.fillStyle = '#e6be4f';
            const specName = this.planesConfig[this.selectedPlaneIndex].specialName;
            ctx.fillText(this.player.specialCharge >= 100 ? `${specName} [LISTO]` : `ESPECIAL`, this.width - 20, this.height - 50);
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.width - 170, this.height - 40, 150, 15);
            ctx.strokeStyle = '#e6be4f';
            ctx.strokeRect(this.width - 170, this.height - 40, 150, 15);
            
            const specPercent = this.player.specialCharge / 100;
            ctx.fillStyle = this.player.specialCharge >= 100 ? '#ffde3b' : '#c89d2b';
            ctx.fillRect(this.width - 169, this.height - 39, 148 * specPercent, 13);
            
            // Draw special active timers if Pucará overdrive is running
            if (this.selectedPlaneIndex === 2 && this.overdriveTimer > 0) {
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.font = 'bold 18px "Share Tech Mono", monospace';
                ctx.fillText(`¡METRALLA DESATADA! ${Math.ceil(this.overdriveTimer / 1000)}s`, this.width / 2, this.height - 70);
            }

            // Draw active weapon timers
            if (this.player.activeWeapon && this.player.activeWeapon !== 'standard' && this.player.weaponTimer > 0) {
                const wNames = {
                    'dual': 'AMETRALLADORAS DUALES',
                    'spread': 'FUEGO EN ABANICO (3 VÍAS)',
                    'side': 'COBERTURA FLANCOS',
                    'rear': 'COBERTURA RETAGUARDIA'
                };
                const wName = wNames[this.player.activeWeapon] || 'ARMA MEJORADA';
                ctx.fillStyle = '#ffde3b';
                ctx.textAlign = 'center';
                ctx.font = 'bold 11px "Share Tech Mono", monospace';
                ctx.fillText(`${wName}: ${Math.ceil(this.player.weaponTimer / 1000)}s`, this.width / 2, this.height - 35);
                
                // Draw small golden blinking timeline countdown under it
                ctx.strokeStyle = 'rgba(255, 222, 59, 0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.width / 2 - 60, this.height - 26);
                ctx.lineTo(this.width / 2 - 60 + 120 * (this.player.weaponTimer / 15000), this.height - 26);
                ctx.stroke();
            }
        }
        
        // Bomb Drop Flash Draw (If active)
        if (this.screenFlash > 0) {
            ctx.fillStyle = `rgba(255,255,255, ${this.screenFlash / 30})`;
            ctx.fillRect(0,0, this.width, this.height);
            this.screenFlash--;
        }
    }
}
window.MalvinasGame = MalvinasGame;
