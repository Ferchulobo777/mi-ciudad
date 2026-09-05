import type { Categoria, Lugar } from "@/tipos";
import type { Posicion } from "@/servicios/ubicacion";

// El mapa se arma como una página HTML embebida en un WebView, con Leaflet +
// tiles de OpenStreetMap: a diferencia de react-native-maps con el proveedor
// de Google, no exige una API key ni una cuenta de facturación, así que no
// depende de que el turista (ni el equipo, para probar la app) tenga una
// tarjeta apta para Google Cloud.
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
}

// Tiles oscuros de CartoDB (gratuitos, sin key) para que el mapa respete el
// tema de la app en vez de quedar siempre claro sobre una pantalla oscura.
const TILES_CLARO = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILES_OSCURO = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export function construirHtmlMapa({
  lugares,
  categoriaPorId,
  posicion,
  colorPrimario,
  esOscuro,
  lugarDestacadoId,
}: DatosMapa): string {
  const marcadores = lugares.map((lugar) => ({
    id: lugar.id,
    nombre: lugar.nombre,
    lat: lugar.coordenadas.latitud,
    lon: lugar.coordenadas.longitud,
    color: categoriaPorId.get(lugar.categoriaId)?.color ?? colorPrimario,
    categoria: categoriaPorId.get(lugar.categoriaId)?.nombre ?? "Sin categoría",
  }));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #mapa { height: 100%; margin: 0; padding: 0; }
    .pin { border-radius: 50% 50% 50% 0; border: 2px solid white; width: 22px; height: 22px; transform: rotate(-45deg); box-shadow: 0 1px 4px rgba(0,0,0,0.4); }
    .pin-usuario { border-radius: 50%; border: 3px solid white; width: 16px; height: 16px; background: #0B6E8C; box-shadow: 0 0 0 4px rgba(11,110,140,0.3); }
    .leaflet-popup-content { font-family: -apple-system, Roboto, sans-serif; }
    .popup-titulo { font-weight: 800; font-size: 14px; margin-bottom: 2px; }
    .popup-subtitulo { font-size: 12px; color: #5C6B6E; margin-bottom: 6px; }
    .popup-accion { font-size: 12px; font-weight: 700; color: ${colorPrimario}; }
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

    const mapa = L.map("mapa", { zoomControl: false, attributionControl: true });
    L.tileLayer(${JSON.stringify(esOscuro ? TILES_OSCURO : TILES_CLARO)}, {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(mapa);

    // El nombre, la categoría y el color van a venir de la API real de la
    // cátedra más adelante, no solo de los datos simulados de hoy: se escapan
    // antes de insertarlos como HTML para no abrir paso a una inyección si
    // ese contenido llega a estar comprometido.
    function escaparHtml(texto) {
      const div = document.createElement("div");
      div.textContent = texto;
      return div.innerHTML;
    }

    function iconoLugar(color) {
      return L.divIcon({
        className: "",
        html: '<div class="pin" style="background:' + escaparHtml(color) + '"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 22],
        popupAnchor: [0, -22],
      });
    }
    const iconoUsuario = L.divIcon({ className: "", html: '<div class="pin-usuario"></div>', iconSize: [16, 16] });

    const grupo = L.featureGroup().addTo(mapa);
    marcadores.forEach((m) => {
      const marcador = L.marker([m.lat, m.lon], { icon: iconoLugar(m.color) }).addTo(grupo);
      marcador.bindPopup(
        '<div class="popup-titulo">' + escaparHtml(m.nombre) + '</div>' +
        '<div class="popup-subtitulo">' + escaparHtml(m.categoria) + '</div>' +
        '<div class="popup-accion">Ver detalle</div>'
      );
      marcador.on("click", () => marcador.openPopup());
      marcador.on("popupopen", () => {
        const boton = document.querySelector(".popup-accion");
        if (boton) boton.onclick = () => enviarMensaje({ tipo: "ver-lugar", id: m.id });
      });
    });

    let marcadorUsuario = null;
    function centrarEnPosicion(lat, lon) {
      if (marcadorUsuario) marcadorUsuario.setLatLng([lat, lon]);
      else marcadorUsuario = L.marker([lat, lon], { icon: iconoUsuario }).addTo(mapa);
      mapa.setView([lat, lon], 16, { animate: true });
    }

    if (posicionInicial) {
      marcadorUsuario = L.marker([posicionInicial.latitud, posicionInicial.longitud], { icon: iconoUsuario }).addTo(mapa);
    }

    const lugarDestacado = lugarDestacadoId ? marcadores.find((m) => m.id === lugarDestacadoId) : null;
    if (lugarDestacado && posicionInicial) {
      // Viene de "Ver en el mapa" desde un lugar puntual: el encuadre se
      // ajusta a ese lugar y a la posición del turista, no a todo el catálogo.
      mapa.fitBounds(
        L.latLngBounds([lugarDestacado.lat, lugarDestacado.lon], [posicionInicial.latitud, posicionInicial.longitud]).pad(0.25),
      );
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

    function enviarMensaje(datos) {
      const texto = JSON.stringify(datos);
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(texto);
    }

    // react-native-webview entrega los mensajes nativos por "message" en
    // Android y por "message" en iOS también, pero atado a document en
    // algunas versiones de Android: se escuchan los dos por las dudas.
    function manejarMensajeNativo(evento) {
      try {
        const datos = JSON.parse(evento.data);
        if (datos.tipo === "centrar" && typeof datos.lat === "number") {
          centrarEnPosicion(datos.lat, datos.lon);
        } else if (datos.tipo === "ruta" && Array.isArray(datos.puntos)) {
          trazarRuta(datos.puntos);
        }
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
