# 1982: Héroes de Malvinas - Arcade Simulator

**1982: Héroes de Malvinas** es un videojuego de disparos vertical interactivo en 2D al estilo clásico de *1942*, desarrollado como un homenaje histórico a los valientes pilotos de la Fuerza Aérea Argentina y la Armada Argentina que combatieron en el conflicto del Atlántico Sur en 1982.

El proyecto está diseñado como una aplicación web de una sola página (SPA) moderna, con estética militar de radar y gráficos vectoriales procedimentales nítidos a 60 FPS, complementado con un sintetizador de audio retro por software.

---

## 🕹️ Características del Juego

### 🎩️ Campaña de Tres Etapas Históricas
El juego cuenta con un sistema de progresión de campaña lineal automática que simula momentos cruciales de la guerra de 1982:
1.  **Etapa 1: Operación Rosario (Mar Abierto e Islas):** Despeje de patrullas británicas en aguas abiertas del Atlántico Sur bajo clima despejado.
2.  **Etapa 2: Estrecho de San Carlos (Acantilados Costeros y Escolta Aliada):** Incursión naval en canales estrechos entre coastlines escarpados. Cuenta con el despliegue automático del **caza aliado de apoyo (Wingman)** por 10 segundos para cobertura táctica.
3.  **Etapa 3: Bahía Agradable (Tempestad Final e HMS Invincible):** Combate final bajo una intensa tempestad del Atlántico Sur con lluvia racheada inclinada (efecto de viento cruzado) e iluminación dinámica de relámpagos con ruidos de truenos. Enfrenta al portaaviones insignia británico como jefe final.

### 🛡️ Nuevas Mecánicas de Combate y Pickups
*   **Escudo de Energía Cian (`S`):** Pickup especial que genera un orbe protector cian brillante alrededor del avión. Absorbe por completo un impacto directo de bala o choque contra enemigos, disipándose en partículas de protección sin dañar el fuselaje.
*   **Escolta Táctica (Wingman):** Caza Pucará de apoyo que aparece de forma automática a mitad de la Etapa 2 para escoltar tu ala izquierda y disparar ráfagas dobles.
*   **Misiles Teledirigidos e IA Destructora:** Los destructores enemigos disparan misiles autoguiados de búsqueda por calor que persiguen la posición de tu avión. ¡Son vulnerables y pueden ser destruidos si disparas sobre ellos antes de que te impacten!
*   **Daño Crítico de Motores:** Tanto tu avión como los barcos pesados enemigos generarán estelas densas de humo gris y partículas de fuego cuando su integridad del fuselaje caiga por debajo del **40% de vida**, añadiendo drama visual a los combates.
*   **Sombras y Accidentes Geográficos:** Nubes altas proyectan sombras dinámicas sobre el mar, y márgenes costeros en scroll vertical a ambos lados reducen visualmente el espacio aéreo, aumentando la tensión en las etapas 2 y 3.

### 🎩️ Aeronaves Argentinas Seleccionables
*   **A-4B Skyhawk (Fuerza Aérea):** Caza equilibrado. Habilidad especial: `BOMBA EXPLO DUX` que genera un destello táctico y desintegra los proyectiles y cazas comunes en pantalla.
*   **Super Étendard (Armada):** Caza rápido y letal. Habilidad especial: `MISIL EXOCET AM39` que despliega dos potentes proyectiles teledirigidos de búsqueda automática.
*   **IA-58 Pucará (Fabricación Nacional):** Caza bimotor de alta resistencia blindada. Habilidad especial: `SOBRE-IMPULSO FUEGO` que duplica la cadencia de ametralladoras pesadas durante 4 segundos.

### ⚖️ Selector de Dificultad de la Simulación
Antes de despegar, puedes seleccionar tres niveles de simulación táctica:
*   **FÁCIL:** Ajusta tu salud al 150%, reduce la velocidad de los proyectiles enemigos al 70%, acelera la carga especial un 150%, y espacia las oleadas enemigas.
*   **NORMAL:** Parámetros equilibrados estándar de combate.
*   **DIFÍCIL:** Reduce tu blindaje de fuselaje al 75%, incrementa la velocidad de balas británicas al 135%, reduce la carga especial a un 65%, y acelera la cadencia de fuego y apariciones enemigas.
*   *Nota: Cuando logras ingresar al Top 10 del Historial de Combate, tu registro guardará y mostrará la dificultad en la que obtuviste tu hazaña.*

### ⚓ Fuerzas Enemigas Británicas
*   **Sea Harrier FRS.1:** Caza de combate interceptor ágil que realiza patrones sinusoidales.
*   **Westland Sea King:** Helicóptero pesado bimotor que dispara ráfagas en abanico.
*   **HMS Sheffield (Miniboss Naval):** Destructor Clase 42 en el agua que dispara fuego de artillería pesada y lanza misiles homing teledirigidos.
*   **HMS Invincible (Jefe Final):** Portaaviones insignia que despliega ráfagas concéntricas y cazas de escolta.

### 📺 Pantalla y Filtro CRT Analógico
El juego incluye un filtro visual que simula las pantallas de fósforo y tubos de rayos catódicos (CRT) de los terminales militares de los 80, incluyendo líneas de escaneo analógicas (*scanlines*), parpadeo sutil y aberración cromática. Se puede activar y desactivar con el botón `📺 CRT` en el panel superior.

---

## ⌨️ Controles de Cabina

*   **Movimiento:** Teclas `W`, `A`, `S`, `D` o las flechas del teclado `◀`, `▲`, `▶`, `▼`.
*   **Ametralladoras:** Mantener presionada la tecla **`ESPACIO`**.
*   **Armamento Especial (100% Energía):** Presionar la tecla **`E`** o **`SHIFT`**.
*   **Controles en Pantalla (Móviles):** Soporte adaptativo táctico.

---

## 🛠️ Tecnologías Utilizadas

Para garantizar la máxima ligereza, compatibilidad y latencia cero, el juego está desarrollado con tecnologías web estándar puras sin frameworks ni librerías externas:

1.  **HTML5 Canvas (2D):** Motor de física, colisiones y renderizado gráfico vectorial procedural. Las aeronaves, barcos, islas y partículas son dibujados mediante código en tiempo real, garantizando máxima definición en cualquier resolución.
2.  **Web Audio API (Síntesis de Sonido):** Todo el sonido es sintetizado digitalmente por software en tiempo real. No requiere archivos de audio `.mp3` ni `.wav`. Incluye:
    *   Ondas de pulso cuadradas para disparos.
    *   Generador de ruido blanco con filtrado pasabajos exponencial para las explosiones.
    *   Secuenciador de música chiptune militar de 8 bits en bucle.
3.  **Vanilla CSS3 (Design System):** Estructura del panel táctico militar con variables HSL, efectos de glassmorphism, glows de neón ámbar/verde y las animaciones del radar.
4.  **LocalStorage (Tabla de Clasificación):** Persistencia local del Top 10 de pilotos de combate. Viene pre-cargado con nombres de héroes históricos reales del conflicto de 1982.

---

## 🚀 Despliegue y Ejecución Local

Dado que utiliza módulos y carga local estándar, se recomienda ejecutar el proyecto bajo un servidor web simple para evitar restricciones de políticas de origen del navegador.

### Opción A: Con Python 3 (Recomendado)
1. Abra su terminal en la carpeta del proyecto:
   ```bash
   cd /Users/gonzaloorellano/Documents/workspace/1982Malvinas
   ```
2. Inicie el servidor:
   ```bash
   python3 -m http.server 8000
   ```
3. Abra su navegador en: **[http://localhost:8000](http://localhost:8000)**

### Opción B: Con Node.js / npm
1. En la carpeta del proyecto, ejecute:
   ```bash
   npx -y serve
   ```
2. Abra la dirección que se le indique en la terminal (por defecto, **http://localhost:3000**).

---

## 🇦🇷 Memoria Histórica
*Este simulador es un homenaje respetuoso a la memoria de los combatientes caídos y veteranos de la Guerra de las Malvinas de 1982.*
**¡Las Malvinas son y serán argentinas!**
