import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  getWeightLogs,
  createWeightLog,
  deleteWeightLog,
} from '../services/api';

export default function WeightScreen({ profile, onWeightUpdated }) {
  const [logs, setLogs] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadWeights = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getWeightLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cargar el historial de peso.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeights();
  }, [loadWeights]);

  const handleAddWeight = async () => {
    const val = parseFloat(newWeight);
    if (!val || val < 25 || val > 350) {
      setErrorMsg('Ingresa un peso válido en kg (ej. 78.4).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await createWeightLog(val);
      setNewWeight('');
      await loadWeights();
      if (onWeightUpdated) {
        onWeightUpdated(val);
      }
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo guardar el registro de peso.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWeight = async (id) => {
    try {
      await deleteWeightLog(id);
      await loadWeights();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo eliminar el registro.');
    }
  };

  // Orden cronológico para la gráfica (más antiguo a más reciente)
  const chronological = [...logs].reverse();
  const latestWeight = logs[0]?.weight ?? profile?.weight ?? 0;
  const oldestWeight =
    chronological[0]?.weight ?? latestWeight;
  const weightDelta = latestWeight - oldestWeight;

  const minW =
    chronological.length > 0
      ? Math.min(...chronological.map((l) => l.weight)) - 1
      : 60;
  const maxW =
    chronological.length > 0
      ? Math.max(...chronological.map((l) => l.weight)) + 1
      : 90;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.pageTitle}>Seguimiento Histórico de Peso</Text>
      <Text style={styles.pageSub}>
        Monitorea tu evolución corporal semanal y analiza la tendencia de tu
        plan nutricional.
      </Text>

      {errorMsg ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
        </View>
      ) : null}

      {/* Tarjetas de Estadísticas de Peso */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Peso Inicial</Text>
          <Text style={styles.statValue}>
            {oldestWeight ? `${oldestWeight.toFixed(1)} kg` : '--'}
          </Text>
        </View>
        <View style={[styles.statCard, styles.statCardHighlight]}>
          <Text style={[styles.statLabel, { color: '#0F766E' }]}>
            Peso Actual
          </Text>
          <Text style={[styles.statValue, { color: '#0D9488' }]}>
            {latestWeight ? `${latestWeight.toFixed(1)} kg` : '--'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cambio Total</Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  weightDelta <= 0 ? '#16A34A' : '#2563EB',
              },
            ]}
          >
            {weightDelta > 0 ? `+${weightDelta.toFixed(1)}` : weightDelta.toFixed(1)} kg
          </Text>
        </View>
      </View>

      {/* Formulario de Nuevo Registro */}
      <View style={styles.inputCard}>
        <Text style={styles.cardTitle}>Registrar Pesaje de Hoy</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.weightInput}
            keyboardType="numeric"
            placeholder="Ej. 78.2 (kg)"
            placeholderTextColor="#94A3B8"
            value={newWeight}
            onChangeText={setNewWeight}
          />
          <TouchableOpacity
            style={[
              styles.addWeightBtn,
              submitting && { opacity: 0.6 },
            ]}
            onPress={handleAddWeight}
            disabled={submitting}
          >
            <Text style={styles.addWeightBtnText}>
              {submitting ? '...' : '+ Guardar Peso'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gráfica Visual de Evolución */}
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Gráfica de Evolución Corporal</Text>
        <Text style={styles.chartSub}>
          Últimos registros con marca de tiempo
        </Text>

        {loading ? (
          <ActivityIndicator color="#0D9488" style={{ marginVertical: 20 }} />
        ) : chronological.length === 0 ? (
          <Text style={styles.emptyText}>
            Aún no hay pesajes registrados. Agrega tu primer registro arriba.
          </Text>
        ) : (
          <View style={styles.chartArea}>
            {chronological.slice(-7).map((entry) => {
              const ratio =
                (entry.weight - minW) / Math.max(1, maxW - minW);
              const barHeight = Math.max(28, Math.round(ratio * 120));
              const shortDate = formatShortDate(entry.logged_at);

              return (
                <View key={entry.id} style={styles.barColumn}>
                  <Text style={styles.barValueText}>
                    {entry.weight.toFixed(1)}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: barHeight },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDateText}>{shortDate}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Listado Histórico con opción de borrado */}
      <View style={styles.historyCard}>
        <Text style={styles.cardTitle}>Bitácora de Registros (/weight-logs)</Text>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>Sin registros en la bitácora.</Text>
        ) : (
          logs.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View>
                <Text style={styles.historyWeight}>
                  ⚖️ {Number(item.weight).toFixed(1)} kg
                </Text>
                <Text style={styles.historyDate}>
                  {formatFullDate(item.logged_at)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteWeightBtn}
                onPress={() => handleDeleteWeight(item.id)}
              >
                <Text style={styles.deleteWeightText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function formatShortDate(isoStr) {
  if (!isoStr) return '--';
  const parts = isoStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return isoStr.slice(0, 5);
}

function formatFullDate(isoStr) {
  if (!isoStr) return '';
  const [datePart, timePart] = isoStr.split('T');
  const hhmm = timePart ? timePart.slice(0, 5) : '';
  return `${datePart} ${hhmm ? `· ${hhmm} hrs` : ''}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCardHighlight: {
    backgroundColor: '#F0FDFA',
    borderColor: '#5EEAD4',
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14.5,
    color: '#0F172A',
  },
  addWeightBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWeightBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 175,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    marginBottom: 4,
  },
  barTrack: {
    width: 24,
    height: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 8,
  },
  barDateText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  historyWeight: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deleteWeightBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteWeightText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
});
