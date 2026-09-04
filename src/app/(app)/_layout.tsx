import { Tabs } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTema } from "@/hooks/use-tema";

// Mapa y Mi recorrido se suman cuando esas pantallas existan, siguiendo la
// barra de cuatro tabs que ya está maquetada en Mockups-Propuestas (Mapa,
// Agenda, Mi recorrido, Yo). Por ahora "Catálogo" hace las veces de Mapa.
export default function LayoutApp() {
  const tema = useTema();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.primario,
        tabBarInactiveTintColor: tema.textoSecundario,
        tabBarStyle: { backgroundColor: tema.superficie, borderTopColor: tema.borde },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Catálogo",
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lugar/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="evento/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="yo"
        options={{
          title: "Yo",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
