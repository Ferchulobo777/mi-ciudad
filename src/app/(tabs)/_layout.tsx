import { Tabs } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTema } from "@/hooks/use-tema";
import { useAvisoDeProximidad } from "@/hooks/use-aviso-proximidad";
import { useSincronizacionAlVolverLaConexion } from "@/hooks/use-sincronizacion";

// Cuatro pestañas, las mismas del boceto del PRD y de los mockups: el mapa es
// la pantalla de inicio y el catálogo completo se abre desde su buscador.
export default function LayoutPestanas() {
  const tema = useTema();

  // Viven acá porque este layout queda montado mientras la app está abierta,
  // sin importar en qué pestaña o detalle esté el turista.
  useAvisoDeProximidad();
  useSincronizacionAlVolverLaConexion();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.primario,
        tabBarInactiveTintColor: tema.textoSecundario,
        tabBarStyle: { backgroundColor: tema.superficie, borderTopColor: tema.borde },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recorrido"
        options={{
          title: "Mi recorrido",
          tabBarIcon: ({ color, size }) => <Ionicons name="footsteps-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="yo"
        options={{
          title: "Yo",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
