/**
 * 1982: Héroes de Malvinas - Application Orchestrator
 * Links HTML screen views, user settings, canvas game events,
 * and high score submissions into a unified SPA flow.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Managers
    const leaderboard = window.leaderboardManager;
    const audio = window.audioEngine;
    
    let gameInstance = null;
    let chosenPlaneIndex = 0;
    let pendingHighScore = 0;
    let selectedMissionId = 1;
    let radarSweepAnimFrameId = null;
    
    // Blueprint Hangar & Technical Briefing variables
    const blueprintCanvas = document.getElementById('blueprint-canvas');
    const blueprintHistoryText = document.getElementById('blueprint-history-text');
    let blueprintAnimationFrameId = null;
    let blueprintTick = 0;
    let typewriterTimeout = null;
    
    const historicalBriefings = [
        "Incursiones heroicas del Grupo 5 de Caza el 25 de mayo de 1982, atacando la flota británica a baja altura en condiciones extremas. Equipado con bombas retardadas por paracaídas DUX de 250KG, los pilotos de A-4B Skyhawk hundieron fragatas enemigas, escribiendo páginas eternas de gloria en la historia de la aviación militar argentina.",
        "La 2° Escuadrilla Aeronaval de Caza y Ataque realizó el lanzamiento histórico del misil Exocet AM39 el 4 de mayo de 1982, impactando y hundiendo al destructor HMS Sheffield. Su sigilo volando al ras del mar y precisión tecnológica de vanguardia revolucionaron la guerra aeronaval para siempre.",
        "Aeronave de ataque y apoyo táctico de diseño y fabricación nacional. Con base en Puerto Argentino, Pradera del Ganso y Puerto Calderón, el IA-58 Pucará operó en pistas improvisadas de turba bajo fuego constante, demostrando una altísima rusticidad, poder de fuego y heroismo de sus tripulaciones en combate."
    ];

    const missionsList = [
        { id: 1, name: "MISIÓN 1: OPERACIÓN ROSARIO", date: "02 de Abril", desc: "Establece superioridad aérea sobre Puerto Argentino. Asegura el espacio aéreo neutralizando patrullas británicas de reconocimiento en aguas abiertas.", objective: "Destruir Harriers de patrulla", targetX: 180, targetY: 90 },
        { id: 2, name: "MISIÓN 2: BAUTISMO DE FUEGO", date: "01 de Mayo", desc: "Intercepta las incursiones aéreas británicas que intentan bombardear los aeródromos argentinos en las islas. Prepárate para el asalto de helicópteros pesados.", objective: "Neutralizar Sea Kings y Harriers", targetX: 178, targetY: 92 },
        { id: 3, name: "MISIÓN 3: ATAQUE AL HMS SHEFFIELD", date: "04 de Mayo", desc: "Vuela bajo en sigilo absoluto para evadir los radares enemigos. Localiza al destructor HMS Sheffield y realiza el histórico disparo de un misil AM39 Exocet.", objective: "Hundir Destructor HMS Sheffield", targetX: 220, targetY: 140 },
        { id: 4, name: "MISIÓN 4: CALLEJÓN DE LAS BOMBAS", date: "21-25 de Mayo", desc: "Realiza una incursión de ataque a baja altura cruzando el estrecho paso de San Carlos. Esquiva la artillería británica y da cobertura aérea táctica.", objective: "Atacar fragatas y evadir fuego", targetX: 120, targetY: 90 },
        { id: 5, name: "MISIÓN 5: BAHÍA AGRADABLE", date: "08 de Junio", desc: "Ataca a los buques logísticos de desembarco enemigos RFA Sir Galahad y Sir Tristram en Pleasant Cove bajo condiciones extremas de tempestad y lluvia.", objective: "Hundir Buque RFA Sir Galahad", targetX: 160, targetY: 115 },
        { id: 6, name: "MISIÓN 6: EL HMS INVINCIBLE", date: "30 de Mayo", desc: "Misión final de máxima alerta. Penetra el perímetro de defensa naval británico y realiza un asalto definitivo contra su portaaviones insignia HMS Invincible.", objective: "Hundir Portaaviones HMS Invincible", targetX: 240, targetY: 80 }
    ];
    
    // 2. Select DOM Elements
    const screenMenu = document.getElementById('screen-menu');
    const screenMissions = document.getElementById('screen-missions');
    const screenSelection = document.getElementById('screen-selection');
    const screenGame = document.getElementById('screen-game');
    const screenGameOver = document.getElementById('screen-gameover');
    const screenVictory = document.getElementById('screen-victory');
    
    const canvas = document.getElementById('game-canvas');
    
    // Buttons
    const btnStartMission = document.getElementById('btn-start-mission');
    const btnBackMissions = document.getElementById('btn-back-missions');
    const btnContinuePlane = document.getElementById('btn-continue-plane');
    const btnBackToMenu = document.getElementById('btn-back-menu');
    const btnLaunch = document.getElementById('btn-launch');
    const btnMute = document.getElementById('btn-mute');
    const btnCRT = document.getElementById('btn-crt');
    const btnViewScores = document.getElementById('btn-view-scores');
    const btnCloseScores = document.getElementById('btn-close-scores');
    
    // Score lists & Overlays
    const highScoresModal = document.getElementById('high-scores-modal');
    const scoresTableBody = document.getElementById('scores-table-body');
    const planeCards = document.querySelectorAll('.plane-card');
    
    // Campaign Mission DOM selections
    const missionsGridContainer = document.getElementById('missions-grid-container');
    const missionBriefingTitle = document.getElementById('mission-briefing-title');
    const missionBriefDateVal = document.getElementById('mission-brief-date-val');
    const missionBriefObjectiveVal = document.getElementById('mission-brief-objective-val');
    const missionBriefDescVal = document.getElementById('mission-brief-desc-val');
    const radarTargetIndicator = document.getElementById('radar-target-indicator');
    
    // Forms
    const formGameOver = document.getElementById('form-gameover-record');
    const formVictory = document.getElementById('form-victory-record');
    const finalScoreGameOver = document.getElementById('final-score-gameover');
    const finalScoreVictory = document.getElementById('final-score-victory');
    
    // 3. Render High Scores Table
    function renderLeaderboard() {
        const scores = leaderboard.getScores();
        scoresTableBody.innerHTML = '';
        
        scores.forEach((entry, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${idx + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score.toLocaleString()}</td>
                <td>${entry.plane}</td>
                <td>${entry.difficulty || 'NORMAL'}</td>
                <td>${entry.date}</td>
            `;
            scoresTableBody.appendChild(tr);
        });
    }
    
    // Initial render
    renderLeaderboard();
    
    // 3a. Campaign Mission Selection & Radar Animations
    let radarSweepAngle = 0;
    function animateRadarSweep() {
        const sweepLine = document.getElementById('radar-sweep-line');
        if (sweepLine) {
            radarSweepAngle += 0.035;
            const len = 90;
            const x2 = 150 + Math.cos(radarSweepAngle) * len;
            const y2 = 100 + Math.sin(radarSweepAngle) * len;
            sweepLine.setAttribute('x2', x2);
            sweepLine.setAttribute('y2', y2);
        }
        radarSweepAnimFrameId = requestAnimationFrame(animateRadarSweep);
    }

    function typeBriefingMission(text) {
        if (!missionBriefDescVal) return;
        if (typewriterTimeout) {
            clearTimeout(typewriterTimeout);
        }
        missionBriefDescVal.innerHTML = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                missionBriefDescVal.innerHTML += text.charAt(i);
                i++;
                typewriterTimeout = setTimeout(type, 12);
            }
        }
        type();
    }

    function showMissionBriefing(m) {
        if (!missionBriefingTitle) return;
        missionBriefingTitle.innerText = "MISIÓN: " + m.name.split(":")[1].trim();
        missionBriefDateVal.innerText = m.date.toUpperCase() + " DE 1982";
        missionBriefObjectiveVal.innerText = m.objective.toUpperCase();
        typeBriefingMission(m.desc);
        
        // Move flashing radar SVG target dot to selected coordinates
        if (radarTargetIndicator) {
            radarTargetIndicator.setAttribute('cx', m.targetX);
            radarTargetIndicator.setAttribute('cy', m.targetY);
            radarTargetIndicator.style.display = 'block';
        }
    }

    function renderMissionsList() {
        if (!missionsGridContainer) return;
        
        const unlockedMission = parseInt(localStorage.getItem('malvinas1982_unlocked_mission')) || 1;
        missionsGridContainer.innerHTML = '';
        
        missionsList.forEach((m) => {
            const card = document.createElement('div');
            card.className = 'plane-card';
            card.dataset.id = m.id;
            
            if (m.id > unlockedMission) {
                card.classList.add('locked-node');
            } else if (m.id === selectedMissionId) {
                card.classList.add('selected');
            }
            
            card.innerHTML = `
                <div class="plane-info">
                     <h4 class="plane-name" style="font-size: 11px; letter-spacing: 0.5px;">${m.name}</h4>
                     <p class="plane-role" style="font-size: 8px; margin: 2px 0 0 0;">${m.date.toUpperCase()} DE 1982</p>
                </div>
                <div class="plane-stats" style="margin: 0; width: auto; font-size: 8px; color: var(--amber-tactical); opacity: 0.9; text-shadow: none;">
                     OBJETIVO: ${m.objective.toUpperCase()}
                </div>
            `;
            
            if (m.id <= unlockedMission) {
                card.addEventListener('click', () => {
                    playClickSound();
                    document.querySelectorAll('#missions-grid-container .plane-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    selectedMissionId = m.id;
                    showMissionBriefing(m);
                });
            }
            
            missionsGridContainer.appendChild(card);
        });
        
        const activeMission = missionsList.find(m => m.id === selectedMissionId) || missionsList[0];
        showMissionBriefing(activeMission);
    }
    
    // 3b. Render Aircraft Previews inside selection cards
    function drawPlanePreviews() {
        const previewCanvases = document.querySelectorAll('.plane-preview-canvas');
        if (!window.MalvinasGame) return;
        
        const drawSkyhawk = window.MalvinasGame.prototype.drawSkyhawk;
        const drawEtendard = window.MalvinasGame.prototype.drawEtendard;
        const drawPucara = window.MalvinasGame.prototype.drawPucara;
        
        const drawers = [drawSkyhawk, drawEtendard, drawPucara];
        const mockScope = { player: { specialCharge: 100 } }; // Show Exocet missiles ready on Étendard preview
        
        previewCanvases.forEach((canvas, idx) => {
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            
            ctx.clearRect(0, 0, w, h);
            
            // Draw tactical grid
            ctx.strokeStyle = 'rgba(79, 230, 136, 0.08)';
            ctx.lineWidth = 1;
            for (let x = 0; x < w; x += 15) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }
            for (let y = 0; y < h; y += 15) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            }
            
            // Radar concentric circle
            ctx.strokeStyle = 'rgba(79, 230, 136, 0.12)';
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 28, 0, Math.PI * 2);
            ctx.stroke();
            
            // Crosshairs
            ctx.beginPath();
            ctx.moveTo(w / 2 - 40, h / 2); ctx.lineTo(w / 2 + 40, h / 2);
            ctx.moveTo(w / 2, h / 2 - 30); ctx.lineTo(w / 2, h / 2 + 30);
            ctx.stroke();
            
            // Draw plane vector in center
            ctx.save();
            const drawer = drawers[idx];
            if (drawer) {
                drawer.call(mockScope, ctx, w / 2, h / 2 + 5, 24);
            }
            ctx.restore();
        });
    }

    // Draw card previews
    setTimeout(drawPlanePreviews, 50); // slight timeout to ensure fonts and bindings are fully aligned
    
    // 4. Mute & CRT Settings Toggle
    btnMute.addEventListener('click', () => {
        audio.init();
        const isMuted = audio.toggleMute();
        btnMute.innerHTML = isMuted ? '🔊 AUDIO: MUTE' : '🔊 AUDIO: ACTIVO';
        btnMute.classList.toggle('active', isMuted);
    });
    
    btnCRT.addEventListener('click', () => {
        document.body.classList.toggle('crt-disabled');
        const disabled = document.body.classList.contains('crt-disabled');
        btnCRT.innerHTML = disabled ? '📺 CRT: DESACTIVADO' : '📺 CRT: ACTIVADO';
        btnCRT.classList.toggle('active', disabled);
    });

    // Technical Hangar Typewriter effect
    function typeBriefing(text) {
        if (!blueprintHistoryText) return;
        if (typewriterTimeout) {
            clearTimeout(typewriterTimeout);
        }
        blueprintHistoryText.innerHTML = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                blueprintHistoryText.innerHTML += text.charAt(i);
                i++;
                typewriterTimeout = setTimeout(type, 12);
            }
        }
        type();
    }

    // CAD Pointer labels drawer helper
    function drawPointerLabel(ctx, startX, startY, endX, endY, title, desc, align) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        
        // Draw dotted line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw connection dot
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(startX, startY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw HUD Text labels
        ctx.fillStyle = '#00f0ff';
        ctx.font = '8px "Share Tech Mono", monospace';
        ctx.textAlign = align;
        ctx.fillText(title, endX, endY - 4);
        
        ctx.fillStyle = '#a4b4a6';
        ctx.font = '7px "Share Tech Mono", monospace';
        ctx.fillText(desc, endX, endY + 6);
        ctx.restore();
    }

    // Main Interactive Blueprint Hangar Animation loop
    function animateBlueprint() {
        if (!blueprintCanvas) return;
        const ctx = blueprintCanvas.getContext('2d');
        const w = blueprintCanvas.width;
        const h = blueprintCanvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // 1. Draw CAD Radar fine grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 20;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        
        // 2. Center Crosshair
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(w / 2 - 50, h / 2); ctx.lineTo(w / 2 + 50, h / 2);
        ctx.moveTo(w / 2, h / 2 - 50); ctx.lineTo(w / 2, h / 2 + 50);
        ctx.stroke();
        
        // 3. Concentric radar calibration circles
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 70, 0, Math.PI * 2);
        ctx.stroke();
        
        // 4. Blueprint Border calibration markers
        const borderOffset = 10;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(borderOffset, borderOffset + 15); ctx.lineTo(borderOffset, borderOffset); ctx.lineTo(borderOffset + 15, borderOffset);
        ctx.moveTo(w - borderOffset - 15, borderOffset); ctx.lineTo(w - borderOffset, borderOffset); ctx.lineTo(w - borderOffset, borderOffset + 15);
        ctx.moveTo(borderOffset, h - borderOffset - 15); ctx.lineTo(borderOffset, h - borderOffset); ctx.lineTo(borderOffset + 15, h - borderOffset);
        ctx.moveTo(w - borderOffset - 15, h - borderOffset); ctx.lineTo(w - borderOffset, h - borderOffset); ctx.lineTo(w - borderOffset, h - borderOffset - 15);
        ctx.stroke();
        
        // 5. Render Neon Glowing Plane Blueprint Wireframe
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.5;
        
        const pSize = 52;
        
        if (chosenPlaneIndex === 0) {
            // A-4B Skyhawk CAD wireframe
            ctx.beginPath();
            ctx.moveTo(0, 20);
            ctx.lineTo(-pSize * 0.95, 34);
            ctx.lineTo(-pSize * 0.2, 0);
            ctx.lineTo(0, -38);
            ctx.lineTo(pSize * 0.2, 0);
            ctx.lineTo(pSize * 0.95, 34);
            ctx.closePath();
            ctx.stroke();
            
            ctx.strokeRect(-5, -28, 10, 48);
            
            ctx.beginPath();
            ctx.ellipse(0, -18, 3.5, 9, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(3, -26);
            ctx.lineTo(10, -38);
            ctx.lineTo(10, -44);
            ctx.stroke();
            
            ctx.strokeRect(-pSize * 0.5 - 3, 16, 6, 10);
            ctx.strokeRect(pSize * 0.5 - 3, 16, 6, 10);
            
        } else if (chosenPlaneIndex === 1) {
            // Super Étendard CAD wireframe
            ctx.beginPath();
            ctx.moveTo(0, 14);
            ctx.lineTo(-pSize * 0.9, 18);
            ctx.lineTo(-pSize * 0.75, 6);
            ctx.lineTo(-pSize * 0.2, -8);
            ctx.lineTo(0, -36);
            ctx.lineTo(pSize * 0.2, -8);
            ctx.lineTo(pSize * 0.75, 6);
            ctx.lineTo(pSize * 0.9, 18);
            ctx.closePath();
            ctx.stroke();
            
            ctx.strokeRect(-4.5, -38, 9, 56);
            
            ctx.beginPath();
            ctx.ellipse(0, -22, 3, 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.save();
            ctx.strokeStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.strokeRect(pSize * 0.45 - 2, 6, 4, 16);
            ctx.beginPath();
            ctx.moveTo(pSize * 0.45 - 2, 18); ctx.lineTo(pSize * 0.45 - 5, 21);
            ctx.moveTo(pSize * 0.45 + 2, 18); ctx.lineTo(pSize * 0.45 + 5, 21);
            ctx.stroke();
            ctx.restore();
            
        } else if (chosenPlaneIndex === 2) {
            // IA-58 Pucará CAD wireframe
            ctx.beginPath();
            ctx.moveTo(0, 8);
            ctx.lineTo(-pSize * 1.15, 10);
            ctx.lineTo(-pSize * 1.15, -4);
            ctx.lineTo(0, -30);
            ctx.lineTo(pSize * 1.15, -4);
            ctx.lineTo(pSize * 1.15, 10);
            ctx.closePath();
            ctx.stroke();
            
            ctx.strokeRect(-pSize * 0.5 - 5, -14, 10, 22);
            ctx.strokeRect(pSize * 0.5 - 5, -14, 10, 22);
            
            ctx.save();
            ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.beginPath();
            ctx.ellipse(-pSize * 0.5, -15, 15, 3, 0, 0, Math.PI * 2);
            ctx.ellipse(pSize * 0.5, -15, 15, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            
            ctx.strokeRect(-5, -34, 10, 54);
            
            ctx.beginPath();
            ctx.ellipse(0, -16, 3.5, 14, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // 6. Draw Pointer Labels and specs
        const centerX = w / 2;
        const centerY = h / 2;
        
        if (chosenPlaneIndex === 0) {
            drawPointerLabel(ctx, centerX + 10, centerY - 40, centerX + 90, centerY - 65, "SONDA DE REABASTECIMIENTO", "REABASTECIMIENTO EN VUELO", "left");
            drawPointerLabel(ctx, centerX - pSize * 0.5, centerY + 20, centerX - 100, centerY + 45, "BOMBAS TÁCTICAS DUX", "RETARDADAS POR PARACAÍDAS", "right");
            drawPointerLabel(ctx, centerX, centerY - 18, centerX - 85, centerY - 55, "CABINA MONOPLAZA", "ASIENTO MARTIN BAKER", "right");
            drawPointerLabel(ctx, centerX, centerY + 20, centerX + 95, centerY + 55, "PRATT & WHITNEY J52-P-8A", "EMPUJE MAXIMO: 4100 KGF", "left");
            drawPointerLabel(ctx, centerX - pSize * 0.8, centerY + 15, centerX - 110, centerY - 5, "ALA DELTA", "SUPERFICIE: 23 M²", "right");
            
        } else if (chosenPlaneIndex === 1) {
            drawPointerLabel(ctx, centerX, centerY - 22, centerX - 85, centerY - 55, "RADAR AGAVE", "TECNOLOGÍA DE SEGUIMIENTO", "right");
            drawPointerLabel(ctx, centerX + pSize * 0.45, centerY + 12, centerX + 90, centerY + 45, "MISIL EXOCET AM39", "PESO: 670 KG // RANGO: 70 KM", "left");
            drawPointerLabel(ctx, centerX - pSize * 0.8, centerY + 10, centerX - 110, centerY - 10, "ALAS PLEGABLES", "ALMACENAMIENTO HANGAR", "right");
            drawPointerLabel(ctx, centerX, centerY + 18, centerX + 95, centerY - 15, "TURBORREACTOR ATAR 8K50", "EMPUJE MAX: 5000 KGF", "left");
            drawPointerLabel(ctx, centerX, centerY + 5, centerX - 85, centerY + 70, "CAÑONES DEFA 30MM", "125 PROYECTILES C/U", "right");
            
        } else if (chosenPlaneIndex === 2) {
            drawPointerLabel(ctx, centerX, centerY - 16, centerX - 85, centerY - 55, "CABINA BIPLAZA TÁNDEM", "EYECCIÓN DE EMERGENCIA CERO-CERO", "right");
            drawPointerLabel(ctx, centerX - pSize * 0.5, centerY - 12, centerX - 115, centerY + 20, "MOTOR ASTAZOU XVI-G", "PROPULSIÓN TURBOEJE 1021 HP", "right");
            drawPointerLabel(ctx, centerX - pSize * 0.5, centerY - 15, centerX - 85, centerY - 80, "HÉLICES RATIER-FOREST", "PASO VARIABLE TRIPALAS // Ø2.59 M", "right");
            drawPointerLabel(ctx, centerX, centerY - 30, centerX + 90, centerY - 55, "SISTEMA DE ARMAMENTO TÁCTICO", "2x20 MM HS804 & 4x7.62 MM FN", "left");
            drawPointerLabel(ctx, centerX, centerY + 20, centerX + 95, centerY + 55, "DISEÑO DE COLA EN T", "FUSELAJE ANTI-IMPACTO METÁLICO", "left");
        }
        
        // 7. Draw Sweeping Scanline
        blueprintTick++;
        const scanSpeed = 1.5;
        let scanY = (blueprintTick * scanSpeed) % (h + 40) - 20;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        
        ctx.beginPath();
        ctx.moveTo(10, scanY);
        ctx.lineTo(w - 10, scanY);
        ctx.stroke();
        
        const grad = ctx.createLinearGradient(0, scanY - 25, 0, scanY);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0.06)');
        ctx.fillStyle = grad;
        ctx.fillRect(10, scanY - 25, w - 20, 25);
        ctx.restore();
        
        blueprintAnimationFrameId = requestAnimationFrame(animateBlueprint);
    }

    // 5. Screen Transitions
    function showScreen(screen) {
        if (blueprintAnimationFrameId) {
            cancelAnimationFrame(blueprintAnimationFrameId);
            blueprintAnimationFrameId = null;
        }
        if (radarSweepAnimFrameId) {
            cancelAnimationFrame(radarSweepAnimFrameId);
            radarSweepAnimFrameId = null;
        }
        if (typewriterTimeout) {
            clearTimeout(typewriterTimeout);
        }

        // Hide all screens
        [screenMenu, screenMissions, screenSelection, screenGame, screenGameOver, screenVictory].forEach(s => {
            if (s) s.classList.add('hidden');
        });
        // Show target screen
        screen.classList.remove('hidden');

        // Start CAD Blueprint scan if inside Selection
        if (screen === screenSelection) {
            blueprintTick = 0;
            animateBlueprint();
            typeBriefing(historicalBriefings[chosenPlaneIndex]);
            
            // Update active mission banner in Hangar
            const activeMission = missionsList.find(m => m.id === selectedMissionId) || missionsList[0];
            const hangarActiveMission = document.getElementById('hangar-active-mission');
            if (hangarActiveMission) {
                hangarActiveMission.innerText = activeMission.name;
            }
        }
        
        // Start SVG Radar sweep if inside Missions Select
        if (screen === screenMissions) {
            renderMissionsList();
            radarSweepAngle = 0;
            animateRadarSweep();
        }
    }

    // Play button sound on any interactive press
    function playClickSound() {
        if (audio) {
            audio.init();
            audio.playCoin();
        }
    }

    // Go to Missions Selection Screen
    btnStartMission.addEventListener('click', () => {
        playClickSound();
        showScreen(screenMissions);
    });

    btnBackMissions.addEventListener('click', () => {
        playClickSound();
        showScreen(screenMenu);
    });

    btnContinuePlane.addEventListener('click', () => {
        playClickSound();
        showScreen(screenSelection);
    });

    btnBackToMenu.addEventListener('click', () => {
        playClickSound();
        showScreen(screenMissions); // Back goes to mission planning selection list
    });

    // Handle Plane selection card highlight
    planeCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            playClickSound();
            planeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            chosenPlaneIndex = index;
            typeBriefing(historicalBriefings[index]);
        });
    });

    // Handle Difficulty selection options highlight
    const diffOptions = document.querySelectorAll('.difficulty-option');
    diffOptions.forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) {
            radio.addEventListener('change', () => {
                diffOptions.forEach(o => o.classList.remove('active-option'));
                opt.classList.add('active-option');
            });
        }
    });

    // High Scores Modal toggle
    btnViewScores.addEventListener('click', () => {
        playClickSound();
        renderLeaderboard();
        highScoresModal.classList.remove('hidden');
    });

    btnCloseScores.addEventListener('click', () => {
        playClickSound();
        highScoresModal.classList.add('hidden');
    });

    // 6. Launch the Game Misión
    btnLaunch.addEventListener('click', () => {
        if (audio) {
            audio.init();
            audio.resume();
        }
        
        showScreen(screenGame);
        
        // Spawn/Restart Game Instance
        if (!gameInstance) {
            gameInstance = new window.MalvinasGame(canvas, onGameOver, onVictory);
            // Resize handler
            window.addEventListener('resize', () => {
                if (gameInstance) gameInstance.resize();
            });
        }
        
        // Grab difficulty selection input
        const selectedDiffInput = document.querySelector('input[name="difficulty-level"]:checked');
        const selectedDifficulty = selectedDiffInput ? selectedDiffInput.value : 'normal';
        
        gameInstance.resize();
        gameInstance.start(chosenPlaneIndex, selectedDifficulty, selectedMissionId);
    });

    // 7. Game State Callbacks
    function onGameOver(score) {
        pendingHighScore = score;
        finalScoreGameOver.innerText = score.toLocaleString();
        
        // Check if score qualifies for record input
        const recordFormSection = document.getElementById('record-form-gameover-container');
        if (leaderboard.qualifies(score)) {
            recordFormSection.classList.remove('hidden');
        } else {
            recordFormSection.classList.add('hidden');
        }
        
        showScreen(screenGameOver);
    }

    function onVictory(score) {
        pendingHighScore = score;
        finalScoreVictory.innerText = score.toLocaleString();
        
        const recordFormSection = document.getElementById('record-form-victory-container');
        if (leaderboard.qualifies(score)) {
            recordFormSection.classList.remove('hidden');
        } else {
            recordFormSection.classList.add('hidden');
        }
        
        showScreen(screenVictory);
    }

    const diffLabelsMap = {
        'easy': 'FÁCIL',
        'normal': 'NORMAL',
        'hard': 'DIFÍCIL'
    };

    // 8. Submit high score forms
    formGameOver.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputName = document.getElementById('pilot-name-gameover').value;
        const planeName = gameInstance.planesConfig[chosenPlaneIndex].name;
        const gameDifficulty = diffLabelsMap[gameInstance.difficulty] || 'NORMAL';
        
        leaderboard.addScore(inputName, pendingHighScore, planeName, gameDifficulty);
        renderLeaderboard();
        
        // Reset and back to main menu
        document.getElementById('pilot-name-gameover').value = '';
        playClickSound();
        showScreen(screenMenu);
    });

    formVictory.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputName = document.getElementById('pilot-name-victory').value;
        const planeName = gameInstance.planesConfig[chosenPlaneIndex].name;
        const gameDifficulty = diffLabelsMap[gameInstance.difficulty] || 'NORMAL';
        
        leaderboard.addScore(inputName, pendingHighScore, planeName, gameDifficulty);
        renderLeaderboard();
        
        // Reset and back to main menu
        document.getElementById('pilot-name-victory').value = '';
        playClickSound();
        showScreen(screenMenu);
    });

    // Play again triggers
    document.querySelectorAll('.btn-retry').forEach(btn => {
        btn.addEventListener('click', () => {
            playClickSound();
            showScreen(screenSelection);
        });
    });

    document.querySelectorAll('.btn-home').forEach(btn => {
        btn.addEventListener('click', () => {
            playClickSound();
            showScreen(screenMenu);
        });
    });
});
