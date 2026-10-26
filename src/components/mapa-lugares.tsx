import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import type { Categoria, Lugar } from "@/tipos";
import type { Posicion } from "@/servicios/ubicacion";
import { distanciaEnMetros, formatearDistancia } from "@/utils/geo";
import { aCoordenada, CENTRO_DE_COLON, ESTILO_MAPA_OSCURO } from "@/utils/mapa";

interface Props {
  lugares: Lugar[];
  categoriaPorId: Map<string, Categoria>;
  posicion: Posicion | null;
  colorPrimario: string;
  esOscuro: boolean;
  /** Solo se muestran los lugares de esa categoría (null: todos). */
  categoriaId?: string | null;
  /** Si viene de "Ver en el mapa" desde un lugar, el encuadre es ese lugar y el turista. */
  lugarDestacadoId?: string;
  /** Línea del camino a pie hasta el lugar destacado. */
  ruta?: Posicion[] | null;
  /** En false es una vista previa quieta (la tarjeta del Inicio). */
  interactivo?: boolean;
  alVerLugar?: (id: string) => void;
  /** Cada vez que este número cambia, el mapa se centra en el turista (botón "mi ubicación"). */
  centrarEnTurista?: number;
}

const MARGEN = { top: 140, right: 50, bottom: 120, left: 50 };
const MARGEN_VISTA_PREVIA = { top: 30, right: 30, bottom: 30, left: 30 };

export function MapaLugares({
  lugares,
  categoriaPorId,
  posicion,
  colorPrimario,
  esOscuro,
  categoriaId = null,
  lugarDestacadoId,
  ruta,
  interactivo = true,
  alVerLugar,
  centrarEnTurista = 0,
}: Props) {
  const mapa = useRef<MapView | null>(null);

  const visibles = useMemo(
    () => lugares.filter((l) => !categoriaId || l.categoriaId === categoriaId || l.id === lugarDestacadoId),
    [lugares, categoriaId, lugarDestacadoId],
  );
  const destacado = lugares.find((l) => l.id === lugarDestacadoId);

  // Encuadre: el lugar destacado y el turista, o todos los lugares (y el
  // turista, si se sabe dónde está). Se recalcula cuando llegan los datos,
  // no en cada movimiento del GPS, para no pelear con el zoom del turista.
  const puntosDelEncuadre = useMemo(() => {
    const base = destacado ? [destacado.coordenadas] : lugares.map((l) => l.coordenadas);
    return (posicion ? [...base, posicion] : base).map(aCoordenada);
  }, [destacado, lugares]); // eslint-disable-line react-hooks/exhaustive-deps

  function encuadrar() {
    if (puntosDelEncuadre.length === 0) return;
    if (puntosDelEncuadre.length === 1) {
      mapa.current?.animateToRegion({ ...puntosDelEncuadre[0], latitudeDelta: 0.012, longitudeDelta: 0.012 }, 0);
      return;
    }
    mapa.current?.fitToCoordinates(puntosDelEncuadre, {
      edgePadding: interactivo ? MARGEN : MARGEN_VISTA_PREVIA,
      animated: false,
    });
  }

  useEffect(encuadrar, [puntosDelEncuadre]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuando llega la ruta, se muestra entera.
  useEffect(() => {
    if (!ruta || ruta.length < 2) return;
    mapa.current?.fitToCoordinates(ruta.map(aCoordenada), { edgePadding: MARGEN, animated: true });
  }, [ruta]);

  useEffect(() => {
    if (centrarEnTurista === 0 || !posicion) return;
    mapa.current?.animateToRegion({ ...aCoordenada(posicion), latitudeDelta: 0.008, longitudeDelta: 0.008 }, 400);
  }, [centrarEnTurista]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MapView
      ref={mapa}
      style={StyleSheet.absoluteFill}
      // En Android Google Maps; en iOS, Apple Maps (no necesita clave).
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      initialRegion={{ ...aCoordenada(CENTRO_DE_COLON), latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      onMapReady={encuadrar}
      customMapStyle={esOscuro ? ESTILO_MAPA_OSCURO : []}
      userInterfaceStyle={esOscuro ? "dark" : "light"}
      showsUserLocation={posicion !== null}
      showsMyLocationButton={false}
      showsPointsOfInterests={false}
      toolbarEnabled={false}
      // La vista previa es un dibujo quieto: así el gesto de la pantalla no
      // compite con el del mapa y cualquier toque abre el mapa completo.
      liteMode={!interactivo}
      scrollEnabled={interactivo}
      zoomEnabled={interactivo}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {visibles.map((lugar) => {
        const categoria = categoriaPorId.get(lugar.categoriaId);
        // El PRD pide que el marcador muestre nombre y distancia.
        const distancia = posicion ? ` · a ${formatearDistancia(distanciaEnMetros(posicion, lugar.coordenadas))}` : "";
        return (
          <Marker
            key={lugar.id}
            identifier={lugar.id}
            coordinate={aCoordenada(lugar.coordenadas)}
            pinColor={categoria?.color ?? colorPrimario}
            title={lugar.nombre}
            description={interactivo ? `${categoria?.nombre ?? "Sin categoría"}${distancia} · Ver detalle` : undefined}
            onCalloutPress={() => alVerLugar?.(lugar.id)}
            tappable={interactivo}
          />
        );
      })}
      {ruta && ruta.length >= 2 && (
        <Polyline coordinates={ruta.map(aCoordenada)} strokeColor={colorPrimario} strokeWidth={5} />
      )}
    </MapView>
  );
}
