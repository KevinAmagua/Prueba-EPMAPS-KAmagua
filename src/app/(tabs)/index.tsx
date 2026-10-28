import { Colors } from '@/constants/Colors';
import { api } from '@/services/api';
import { Medidor } from '@/types/medidor';
import { validateMeterCode } from '@/utils/validators';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

/** Pantalla para buscar un medidor por código y abrir su formulario de lectura. */
export default function MeterSearchScreen() {
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [medidorEncontrado, setMedidorEncontrado] = useState<Medidor | null>(null);
  const [mensajeResultado, setMensajeResultado] = useState<string | null>(null);

  /**
   * Valida el código antes de consultar la API y actualiza el estado de
   * resultado, error o carga que presenta la pantalla.
   */
  const handleSearch = async () => {
    setErrorValidacion(null);
    setMedidorEncontrado(null);
    setMensajeResultado(null);

    const codigoLimpio = codigoBusqueda.trim().toUpperCase();

    // Validación estricta con Regex antes de cualquier petición HTTP (R2)
    if (!validateMeterCode(codigoLimpio)) {
      setErrorValidacion('Formato inválido. El código debe tener el formato MED-XXXXXX (ej. MED-001001).');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<Medidor[]>('/medidores', {
        params: { codigo: codigoLimpio },
      });

      const resultados = response.data;
      if (resultados && resultados.length > 0) {
        setMedidorEncontrado(resultados[0]);
      } else {
        setMensajeResultado('No se encontró ningún medidor registrado con el código ingresado.');
      }
    } catch (error) {
      console.error('[Search] Error al consultar medidor:', error);
      setMensajeResultado('Error de conexión o servidor al buscar el medidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Búsqueda de Medidor</Text>
        <Text style={styles.subtitle}>Ingrese el código asignado en campo (MED-XXXXXX)</Text>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.label}>Código de Medidor</Text>
        <TextInput
          style={[styles.input, errorValidacion ? styles.inputError : null]}
          placeholder="MED-000000"
          placeholderTextColor="#8C9BA5"
          value={codigoBusqueda}
          onChangeText={(text) => {
            setCodigoBusqueda(text);
            if (errorValidacion) setErrorValidacion(null);
          }}
          autoCapitalize="characters"
          maxLength={10}
        />

        {errorValidacion && <Text style={styles.errorText}>{errorValidacion}</Text>}

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.searchButtonText}>Buscar Medidor</Text>
          )}
        </TouchableOpacity>
      </View>

      {mensajeResultado && (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>{mensajeResultado}</Text>
        </View>
      )}

      {medidorEncontrado && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Medidor Encontrado</Text>
          <Text style={styles.resultText}><Text style={styles.bold}>Código:</Text> {medidorEncontrado.codigo}</Text>
          <Text style={styles.resultText}><Text style={styles.bold}>Cuenta:</Text> {medidorEncontrado.cuentaContrato}</Text>
          <Text style={styles.resultText}><Text style={styles.bold}>Titular:</Text> {medidorEncontrado.titular}</Text>
          <Text style={styles.resultText}><Text style={styles.bold}>Dirección:</Text> {medidorEncontrado.direccion} ({medidorEncontrado.parroquia})</Text>
          <Text style={styles.resultText}><Text style={styles.bold}>Lectura Anterior:</Text> {medidorEncontrado.lecturaAnterior} m³</Text>
          <Text style={styles.resultText}><Text style={styles.bold}>Fecha Última Lectura:</Text> {medidorEncontrado.fechaLecturaAnterior ? new Date(medidorEncontrado.fechaLecturaAnterior).toLocaleDateString() : 'No registrada'}</Text>

          <TouchableOpacity
            style={styles.captureActionButton}
            onPress={() => router.push(`/capture/${medidorEncontrado.codigo}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.captureActionText}>Registrar Lectura de Campo</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  headerCard: {
    marginBottom: 14,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 7,
    lineHeight: 21,
  },
  searchCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#1A2530',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  input: {
    height: 58,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  searchButton: {
    minHeight: 56,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFF9E5',
    borderWidth: 1,
    borderColor: '#E8D891',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  infoText: {
    color: Colors.textPrimary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1A2530',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 23,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
  },
  captureActionButton: {
    minHeight: 56,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 16,
    elevation: 2,
  },
  captureActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
