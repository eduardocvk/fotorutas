# Fotorutas 🚴⛰️📸

Aplicación moderna para Android y Web que permite **sobreimpresionar tracks GPS (.fit y .gpx) sobre tus fotos** para crear publicaciones e historias atractivas en redes sociales (Instagram, TikTok, Strava, WhatsApp).

---

## ✨ Características

- 🗺️ **Soporte de Tracks GPX y FIT**:
  - Lectura directa de archivos `.gpx` y `.fit` (Garmin, Wahoo, Strava, Wikiloc, etc.).
  - Cálculo preciso de distancia total, tiempo en movimiento, desnivel acumulado positivo (+D) y negativo (-D), altitud mínima y máxima, y velocidad media.
- 🎨 **Plantillas Visuales Integradas**:
  - **Deportiva / Strava Pro**: HUD atlético, acentos en naranja/neón, badges de datos destacados y track con resplandor.
  - **Minimalista Clean**: Estética sobria, tipografía limpia, líneas finas y tarjetas traslúcidas estilo cristal (*glassmorphism*).
  - **Póster Aventura**: Marco cinematográfico, estética editorial de revista/expedición y tipografía elegante con serifa.
  - **Historia Redes (9:16)**: Optimizada para pantalla completa en Stories de Instagram y Reels.
- 📐 **Formatos para Redes Sociales**:
  - `9:16` Historias / Reels / TikTok (enfoque principal).
  - `4:5` Retrato para feed de Instagram.
  - `1:1` Cuadrado clásico.
  - `16:9` Panorámica / Paisaje.
  - Formato original de la foto.
- ⛰️ **Altimetría y Perfil de Ruta**:
  - Gráfico de perfil de altitud con degradado personalizable y etiquetas de cotas mínima y máxima.
  - Trazado de ruta con proyección real, suavizado, puntos de Salida y Meta diferenciados.
- 🎛️ **Totalmente Configurable**:
  - Colores de acento y trazado (paleta de neones, blanco y selector hexadecimal libre).
  - Ajustes de foto: Filtros (Cine, Contraste, Vívido, B&N, Cálido), brillo, contraste y viñeta para maximizar legibilidad.
  - Selección de métricas visibles (Distancia, Tiempo, Desnivel+, Velocidad Media, Altitud Máx, Ritmo).
  - Título, subtítulo de ubicación y fecha editables.
  - Marca de agua o firma personalizada.
- 🚀 **Exportación de Alta Resolución y Compartición Nativa**:
  - Renderizado en Canvas 2D a resolución completa (Ultra HD) sin pixelación.
  - Integración con Web Share API (en Android abre la hoja de compartir nativa de Instagram/WhatsApp/etc.).
  - Descarga directa en formato PNG.

---

## 🛠️ Tecnologías

- **Framework**: React 19 + TypeScript + Vite
- **Estilos**: Tailwind CSS v4 + Glassmorphism
- **Iconografía**: Lucide React
- **Parsers GPS**: `fit-file-parser` (binario FIT de Garmin) + DOMParser XML (GPX)
- **Motor Gráfico**: HTML5 Canvas 2D
- **Plataforma Móvil**: Capacitor 7 (Android)

---

## 🚀 Cómo ejecutar en desarrollo

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

3. Compilar para producción:
   ```bash
   npm run build
   ```

---

## 📱 Compilar para Android (APK)

1. Compila la app web:
   ```bash
   npm run build
   ```

2. Añadir la plataforma Android (requiere Android Studio y Java SDK):
   ```bash
   npx cap add android
   npx cap sync
   ```

3. Abrir en Android Studio para generar el APK o publicar en Google Play:
   ```bash
   npx cap open android
   ```
