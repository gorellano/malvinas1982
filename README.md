# 1982: Héroes de Malvinas - Arcade Simulator

**1982: Héroes de Malvinas** es un videojuego de disparos vertical en 2D al estilo clásico de *1942*, desarrollado como un homenaje histórico a los valientes pilotos de la Fuerza Aérea Argentina y la Armada Argentina que combatieron en el conflicto del Atlántico Sur en 1982.

El proyecto está diseñado como una aplicación web de una sola página (SPA) moderna, con estética militar de radar, gráficos vectoriales procedimentales nítidos a 60 FPS, y un sintetizador de audio retro por software.

---

## 🕹️ Características Destacadas del Juego

### 🗺️ Campaña Histórica de 6 Misiones Independientes
El simulador incorpora un sistema de campaña con un selector de operaciones históricas que guardan y persisten tu progreso en `localStorage` (bajo la clave `malvinas1982_unlocked_mission`):
1.  **Misión 1: Operación Rosario (02 de Abril):** Establece la superioridad aérea sobre Puerto Argentino neutralizando las primeras patrullas británicas Sea Harrier.
2.  **Misión 2: Bautismo de Fuego (01 de Mayo):** Defiende los aeródromos argentinos interceptando las incursiones británicas de bombarderos Harriers y helicópteros pesados Sea King.
3.  **Misión 3: Ataque al HMS Sheffield (04 de Mayo):** Incursión naval a ras del agua en sigilo de radares. Localiza y hunde mediante el disparo del histórico misil AM39 Exocet al destructor británico Clase 42 HMS Sheffield.
4.  **Misión 4: Callejón de las Bombas (21-25 de Mayo):** Incursión de ataque a baja altura cruzando los acantilados costeros del Estrecho de San Carlos. Cuenta con el soporte táctico automático de un **caza aliado (Wingman)** de escolta por 10 segundos.
5.  **Misión 5: Bahía Agradable (08 de Junio):** Vuela bajo condiciones climáticas extremas de tempestad, relámpagos e intensa lluvia para localizar y hundir al buque de desembarco logístico enemigo **RFA Sir Galahad**.
6.  **Misión 6: El HMS Invincible (30 de Mayo):** Incursión definitiva y asalto de máxima dificultad. Penetra la defensa de la flota británica y bombardea al portaaviones insignia **HMS Invincible** escoltado por múltiples fragatas.

### 📡 Selector Táctico con Radar SVG
*   **Rejilla de Operaciones:** Permite navegar e iniciar las misiones desbloqueadas en orden histórico.
*   **Radar de Atlántico Sur:** Visualizador interactivo procedimental mediante SVG que muestra los contornos geográficos de Isla Soledad y Gran Malvina, un barrido circular continuo de radar y una baliza intermitente de alta prioridad sobre el objetivo de la misión activa.
*   **Bitácora Histórica:** Panel de control táctico con efecto de máquina de escribir que detalla la fecha, objetivo estratégico y una narración histórica real de cada operación militar de 1982.

### ⚔️ Arsenal Temporal Multidireccional (Estilo *1942*)
Al destruir escuadrones enemigos especiales, obtendrás ráfagas mejoradas multidireccionales con un temporizador dinámico de **15 segundos** visible en la barra HUD superior:
*   **Disparo Dual (2X):** Ametralladoras paralelas a ambos extremos de las alas del avión.
*   **Disparo en V / Spread (3X):** 3 proyectiles lanzados en abanico (uno frontal, y dos en ángulo de -15° y +15°).
*   **Disparo Lateral / Flanco (◀▶):** Cobertura táctica de 3 vías (frontal y dos ráfagas horizontales en los laterales).
*   **Disparo Trasero / Rear (▲▼):** 2 proyectiles disparados al frente y atrás para limpiar amenazas en la retaguardia.

### 🛡️ Pickups con Sprites Procedimentales Animados
Los viejos bloques planos de colores fueron reemplazados por modelos vectoriales detallados dibujados directamente en el Canvas:
*   **Reparación (`repair`):** Caja médica circular intermitente con cruz de salud verde fluorescente.
*   **Escudo de Energía (`shield`):** Esfera protectora de plasma cian brillante con dos órbitas elípticas cruzadas en rotación giroscópica continua.
*   **Cajas de Arsenal (`weapon`):** Hexágonos dorados giratorios con detalles mecánicos y símbolos identificativos del tipo de disparo (`2X`, `3X`, `◀▶`, `▲▼`).

### 💥 Jefes Navales Procedimentales
*   **RFA Sir Galahad (Jefe Misión 5):** Buque logístico auxiliar británico renderizado procedimentalmente con keels de óxido, chimeneas duales con estelas de humo negro animado por partículas y dos torretas automáticas defensivas en las bandas que disparan fuego de artillería al jugador.
*   **HMS Invincible (Jefe Misión 6):** Portaaviones insignia británico que despliega ráfagas concéntricas de balas y cazas Harriers de escolta.
*   **HMS Sheffield (Miniboss Misión 3 y 4):** Destructor Clase 42 que lanza misiles térmicos guiados (*homing*) destructibles por el jugador.

### ⏱️ Pacing de Combate Clásico
*   **Calibración de Distancia:** Fiel al ritmo y la tensión de las cabinas de arcade clásicas, la velocidad de progresión de la distancia de las misiones fue ajustada a **25 unidades/segundo**, logrando niveles inmersivos de **2 a 4.6 minutos** de duración de combate continuo antes del arribo del jefe de zona.
*   **Wingman Inteligente:** El caza wingman aliado en la etapa de acantilados costeros ahora aparece de forma dinámica al completarse el **70% de la distancia de la misión**, garantizando soporte estratégico previo al jefe final.

### 📺 Pantalla CRT e Incremento de Visibilidad
*   **Visibilidad Optimizada:** La caja del canvas se rediseñó para aprovechar dinámicamente todo el alto útil de la pantalla (`height: calc(100% - 35px)`) escalándose proporcionalmente hasta una dimensión máxima de **`660x880px`** (relación retro 3:4). Se eliminaron los márgenes muertos innecesivos.
*   **Hangar con Misión Activa:** Se integró un banner informativo en la pantalla de selección de aeronaves para indicar de forma persistente qué operación militar táctica se va a despegar.
*   **Filtro CRT:** Emulador analógico que reproduce la curvatura de tubos catódicos, scanlines y aberración cromática clásica. Desactivable libremente mediante el botón `📺 CRT` en el panel superior.

---

## ⌨️ Controles de Cabina

*   **Movimiento:** Teclas `W`, `A`, `S`, `D` o las flechas del teclado `◀`, `▲`, `▶`, `▼`.
*   **Ametralladoras:** Mantener presionada la tecla **`ESPACIO`**.
*   **Armamento Especial (100% Energía):** Presionar la tecla **`E` o `SHIFT`**.

---

## 🛠️ Tecnologías y Optimización

1.  **HTML5 Canvas (2D):** Renderizado gráfico procedural nítido a 60 FPS, con estelas de humo de daños críticos por debajo del **40% de salud**.
2.  **Web Audio API (Sintetizador por Software):** Sin dependencias de archivos `.mp3` ni `.wav`. Síntesis en tiempo real de explosiones, disparos y música militar chiptune.
3.  **Vanilla CSS3:** Estilo militar de radar con colores neón HSL y efectos de glassmorphism.
4.  **LocalStorage:** Almacenamiento local del ranking Top 10 con nombres de aviadores históricos y persistencia del progreso de campaña.

---

## 🚀 Despliegue y Ejecución Local

Para evitar restricciones de políticas de origen de archivos del navegador (CORS) en los scripts modularizados, se recomienda ejecutar el proyecto bajo un servidor web simple.

### Opción A: Con Python 3
1. Abre tu terminal en la carpeta del proyecto:
   ```bash
   cd ruta/de/tu/proyecto
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   python3 -m http.server 8000
   ```
3. Abre tu navegador en: **[http://localhost:8000](http://localhost:8000)**

### Opción B: Con Node.js
1. En la carpeta del proyecto, ejecuta:
   ```bash
   npx -y serve
   ```
2. Abre la dirección indicada en la terminal (por defecto, **http://localhost:3000**).

---

## 🇦🇷 Memoria Histórica
*Este simulador es un homenaje respetuoso a la memoria de los combatientes caídos y veteranos de la Guerra de las Malvinas de 1982.*
**¡Las Malvinas son y serán argentinas!**
