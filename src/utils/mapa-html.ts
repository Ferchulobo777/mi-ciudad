import type { Categoria, Lugar } from "@/tipos";
import type { Posicion } from "@/servicios/ubicacion";
import { distanciaEnMetros, formatearDistancia } from "@/utils/geo";

// El mapa se arma como una página HTML embebida en un WebView, con Leaflet +
// tiles de OpenStreetMap: a diferencia de react-native-maps con el proveedor
// de Google, no exige una API key ni una cuenta de facturación, y la build de
// release muestra el mapa igual que Expo Go.
interface DatosMapa {
  lugares: Lugar[];
  categoriaPorId: Map<string, Categoria>;
  posicion: Posicion | null;
  colorPrimario: string;
  esOscuro: boolean;
  /** Si viene de "Ver en el mapa" desde un lugar puntual, el encuadre inicial
   * se ajusta a ese lugar + la posición del turista, en vez de a todos los
   * lugares del catálogo. */
  lugarDestacadoId?: string;
  /** En false es una vista previa quieta (la tarjeta del Inicio): sin
   * arrastre ni zoom, para que no compita con el gesto de la pantalla. */
  interactivo?: boolean;
}

// Un solo proveedor de tiles (OpenStreetMap estándar) en los dos temas: se
// había probado un servidor de tiles oscuros de CartoDB, pero pasó a exigir
// autenticación en su capa gratuita. El modo oscuro se logra con un filtro
// CSS sobre las mismas tiles de siempre.
const TILES_OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export function construirHtmlMapa({
  lugares,
  categoriaPorId,
  posicion,
  colorPrimario,
  esOscuro,
  lugarDestacadoId,
  interactivo = true,
}: DatosMapa): string {
  const marcadores = lugares.map((lugar) => ({
    id: lugar.id,
    nombre: lugar.nombre,
    lat: lugar.coordenadas.latitud,
    lon: lugar.coordenadas.longitud,
    categoriaId: lugar.categoriaId,
    color: categoriaPorId.get(lugar.categoriaId)?.color ?? colorPrimario,
    categoria: categoriaPorId.get(lugar.categoriaId)?.nombre ?? "Sin categoría",
    // El PRD pide que el marcador muestre nombre y distancia: se calcula de
    // este lado, con la misma función que usa el resto de la app.
    distancia: posicion ? formatearDistancia(distanciaEnMetros(posicion, lugar.coordenadas)) : null,
  }));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #mapa { height: 100%; margin: 0; padding: 0; background: ${esOscuro ? "#10181A" : "#E8E4DA"}; }
    ${esOscuro ? ".leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9); }" : ""}
    .pin { border-radius: 50% 50% 50% 0; border: 2px solid white; width: 22px; height: 22px; transform: rotate(-45deg); box-shadow: 0 1px 4px rgba(0,0,0,0.4); }
    .pin-destacado { width: 30px; height: 30px; border-width: 3px; }
    .pin-usuario { border-radius: 50%; border: 3px solid white; width: 16px; height: 16px; background: ${colorPrimario}; box-shadow: 0 0 0 5px rgba(11,110,140,0.3); }
    .leaflet-popup-content { font-family: -apple-system, Roboto, sans-serif; }
    .popup-titulo { font-weight: 800; font-size: 15px; margin-bottom: 2px; }
    .popup-subtitulo { font-size: 13px; color: #5C6B6E; margin-bottom: 8px; }
    .popup-accion { font-size: 14px; font-weight: 700; color: ${colorPrimario}; padding: 4px 0; }
    .linea-ruta { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
  </style>
</head>
<body>
  <div id="mapa"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const marcadores = ${JSON.stringify(marcadores)};
    const posicionInicial = ${posicion ? JSON.stringify(posicion) : "null"};
    const lugarDestacadoId = ${lugarDestacadoId ? JSON.stringify(lugarDestacadoId) : "null"};
    const interactivo = ${interactivo ? "true" : "false"};

    const mapa = L.map("mapa", {
      zoomControl: false,
      attributionControl: true,
      dragging: interactivo,
      touchZoom: interactivo,
      doubleClickZoom: interactivo,
      scrollWheelZoom: interactivo,
      boxZoom: interactivo,
      keyboard: interactivo,
    });
    L.tileLayer(${JSON.stringify(TILES_OSM)}, { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(mapa);

    // El nombre y la categoría van a venir de la API real de la cátedra: se
    // escapan antes de insertarlos como HTML para no abrir paso a una
    // inyección si ese contenido llega a estar comprometido.
    function escaparHtml(texto) {
      const div = document.createElement("div");
      div.textContent = texto;
      return div.innerHTML;
    }

    function enviarMensaje(datos) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(datos));
    }

    function iconoLugar(m) {
      const destacado = m.id === lugarDestacadoId;
      const tamaño = destacado ? 30 : 22;
      return L.divIcon({
        className: "",
        html: '<div class="pin' + (destacado ? " pin-destacado" : "") + '" style="background:' + escaparHtml(m.color) + '"></div>',
        iconSize: [tamaño, tamaño],
        iconAnchor: [tamaño / 2, tamaño],
        popupAnchor: [0, -tamaño],
      });
    }
    const iconoUsuario = L.divIcon({ className: "", html: '<div class="pin-usuario"></div>', iconSize: [16, 16] });

    const grupo = L.featureGroup().addTo(mapa);
    const capas = [];
    marcadores.forEach((m) => {
      const marcador = L.marker([m.lat, m.lon], { icon: iconoLugar(m), interactive: interactivo });
      marcador.addTo(grupo);
      capas.push({ m, marcador });
      if (!interactivo) return;
      const subtitulo = escaparHtml(m.categoria) + (m.distancia ? " · a " + escaparHtml(m.distancia) : "");
      marcador.bindPopup(
        '<div class="popup-titulo">' + escaparHtml(m.nombre) + '</div>' +
        '<div class="popup-subtitulo">' + subtitulo + '</div>' +
        '<div class="popup-accion">Ver detalle ›</div>'
      );
      marcador.on("popupopen", (e) => {
        const boton = e.popup.getElement().querySelector(".popup-accion");
        if (boton) boton.onclick = () => enviarMensaje({ tipo: "ver-lugar", id: m.id });
      });
    });

    // Filtro por categoría: se sacan y se vuelven a poner los marcadores en
    // vez de regenerar la página, así no se pierde el zoom del turista.
    function filtrar(categoriaId) {
      capas.forEach(({ m, marcador }) => {
        const visible = !categoriaId || m.categoriaId === categoriaId || m.id === lugarDestacadoId;
        if (visible && !grupo.hasLayer(marcador)) grupo.addLayer(marcador);
        if (!visible && grupo.hasLayer(marcador)) grupo.removeLayer(marcador);
      });
    }

    let marcadorUsuario = null;
    function ubicarUsuario(lat, lon, centrar) {
      if (marcadorUsuario) marcadorUsuario.setLatLng([lat, lon]);
      else marcadorUsuario = L.marker([lat, lon], { icon: iconoUsuario, interactive: false }).addTo(mapa);
      if (centrar) mapa.setView([lat, lon], 16, { animate: true });
    }

    if (posicionInicial) ubicarUsuario(posicionInicial.latitud, posicionInicial.longitud, false);

    const lugarDestacado = lugarDestacadoId ? marcadores.find((m) => m.id === lugarDestacadoId) : null;
    if (lugarDestacado && posicionInicial) {
      mapa.fitBounds(
        L.latLngBounds([lugarDestacado.lat, lugarDestacado.lon], [posicionInicial.latitud, posicionInicial.longitud]).pad(0.25),
      );
    } else if (lugarDestacado) {
      mapa.setView([lugarDestacado.lat, lugarDestacado.lon], 15);
    } else if (marcadores.length > 0) {
      const limites = posicionInicial
        ? grupo.getBounds().extend([posicionInicial.latitud, posicionInicial.longitud])
        : grupo.getBounds();
      mapa.fitBounds(limites.pad(0.2));
    } else if (posicionInicial) {
      mapa.setView([posicionInicial.latitud, posicionInicial.longitud], 14);
    } else {
      mapa.setView([-32.2246, -58.1489], 14);
    }

    let lineaRuta = null;
    function trazarRuta(puntos) {
      if (lineaRuta) mapa.removeLayer(lineaRuta);
      const latlngs = puntos.map((p) => [p.latitud, p.longitud]);
      lineaRuta = L.polyline(latlngs, { color: ${JSON.stringify(colorPrimario)}, weight: 5, opacity: 0.85, className: "linea-ruta" }).addTo(mapa);
      mapa.fitBounds(lineaRuta.getBounds().pad(0.15));
    }

    // react-native-webview entrega los mensajes por "message" en window en
    // iOS y en document en algunas versiones de Android: se escuchan los dos.
    function manejarMensajeNativo(evento) {
      try {
        const datos = JSON.parse(evento.data);
        if (datos.tipo === "ubicar" && typeof datos.lat === "number") ubicarUsuario(datos.lat, datos.lon, datos.centrar === true);
        else if (datos.tipo === "ruta" && Array.isArray(datos.puntos)) trazarRuta(datos.puntos);
        else if (datos.tipo === "filtrar") filtrar(datos.categoriaId || null);
      } catch {
        // Se ignoran mensajes que no sean JSON válido.
      }
    }
    document.addEventListener("message", manejarMensajeNativo);
    window.addEventListener("message", manejarMensajeNativo);
  </script>
</body>
</html>`;
}
