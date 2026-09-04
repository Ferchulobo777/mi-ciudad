import { Tabs } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTema } from "@/hooks/use-tema";

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
      <Tabs.Screen name="lugar/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="lugar/[id]/visitar" options={{ href: null }} />
      <Tabs.Screen
        name="mapa"
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
      <Tabs.Screen name="evento/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="recorrido"
        options={{
          title: "Mi recorrido",
          tabBarIcon: ({ color, size }) => <Ionicons name="navigate-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="favoritos" options={{ href: null }} />
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
