import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Visita {
    id: string;
    usuarioId: string;
    lugarId: string;
    fechaHora: string;
    cantidadPersonas: number;
    estado: string;
    sincronizada: boolean;
}

const TURNOS_MOCK: Visita[] = [
    {
    id: 'vis-001',
    usuarioId: 'usr-123',
    lugarId: 'lug-001',
    fechaHora: '2026-11-20T10:30:00-03:00',
    cantidadPersonas: 2,
    estado: 'confirmado',
    sincronizada: true,
    },
    {
    id: 'vis-002',
    usuarioId: 'usr-123',
    lugarId: 'lug-002',
    fechaHora: '2026-11-22T15:00:00-03:00',
    cantidadPersonas: 1,
    estado: 'confirmado',
    sincronizada: true,
    },
];

export default function PantallaTurnos() {
    const [visitas, setVisitas] = useState<Visita[]>(TURNOS_MOCK);

    const handleCancelarTurno = (idVisita: string) => {
    setVisitas((prev) => prev.filter((v) => v.id !== idVisita));
    };

    return (
    <View style={styles.container}>
        <Text style={styles.titulo}>Mis Turnos y Visitas</Text>

        {visitas.length === 0 ? (
        <Text style={styles.textoVacio}>No tenés turnos programados.</Text>
        ) : (
        <FlatList
            data={visitas}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <View style={styles.card}>
                <View style={styles.info}>
                <Text style={styles.cardTitulo}>Reserva en Lugar #{item.lugarId}</Text>
                <Text style={styles.cardDetalle}>
                    📅 {new Date(item.fechaHora).toLocaleDateString('es-AR')} - {new Date(item.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.cardDetalle}>👥 Personas: {item.cantidadPersonas}</Text>
                </View>

                <Pressable
                style={styles.botonCancelar}
                onPress={() => handleCancelarTurno(item.id)}
                >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.textoBoton}>Cancelar</Text>
                </Pressable>
            </View>
            )}
        />
        )}
    </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
    titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, marginTop: 40 },
    textoVacio: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 16 },
    card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    },
    info: { flex: 1 },
    cardTitulo: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
    cardDetalle: { fontSize: 13, color: '#555', marginTop: 2 },
    botonCancelar: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    },
    textoBoton: { color: '#fff', fontWeight: '600', fontSize: 12 },
});