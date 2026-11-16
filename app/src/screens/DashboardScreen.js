import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  getDailySummary,
  getMeals,
  createMeal,
  deleteMeal,
} from '../services/api';
import {
  MEAL_TYPES,
  QUICK_FOOD_PRESETS,
  GOAL_LABELS,
} from '../utils/nutritionCalculator';

const todayISO = () => new Date().toISOString().split('T')[0];

export default function DashboardScreen({ profile, onGoToProfile }) {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal de registro de comida
  const [modalVisible, setModalVisible] = useState(false);
  const [mealType, setMealType] = useState('Desayuno');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [mealsData, summaryData] = await Promise.all([
        getMeals(selectedDate),
        getDailySummary(selectedDate).catch((err) => {
          if (err.status === 404) {
            return null; // Perfil aún no configurado en backend
          }
          throw err;
        }),
      ]);
      setMeals(Array.isArray(mealsData) ? mealsData : []);
      setSummary(summaryData);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar el resumen diario.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const shiftDate = (daysDelta) => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + daysDelta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const openAddModal = (defaultType = 'Desayuno') => {
    setMealType(defaultType);
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setModalVisible(true);
  };

  const handleApplyPreset = (preset) => {
    setMealType(preset.meal_type);
    setFoodName(preset.food_name);
    setCalories(String(preset.calories));
    setProtein(String(preset.protein));
    setCarbs(String(preset.carbs));
    setFat(String(preset.fat));
  };

  const handleSaveMeal = async () => {
    if (!foodName.trim() || !calories) {
      return;
    }
    setSubmitting(true);
    try {
      await createMeal({
        meal_type: mealType,
        food_name: foodName.trim(),
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
      });
      setModalVisible(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo registrar el alimento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMeal = async (id) => {
    try {
      await deleteMeal(id);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo eliminar el registro.');
    }
  };

  // Totales calculados como respaldo si /summary dio 404 por falta de perfil
  const targetCal = summary?.target_calories ?? profile?.target_calories ?? 2200;
  const consumedCal =
    summary?.consumed_calories ??
    meals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const remainingCal =
    summary?.remaining_calories ?? targetCal - consumedCal;

  const targetP = summary?.target_protein ?? profile?.target_protein ?? 150;
  const consumedP =
    summary?.consumed_protein ??
    meals.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);

  const targetC = summary?.target_carbs ?? profile?.target_carbs ?? 220;
  const consumedC =
    summary?.consumed_carbs ??
    meals.reduce((acc, m) => acc + (Number(m.carbs) || 0), 0);

  const targetF = summary?.target_fat ?? profile?.target_fat ?? 70;
  const consumedF =
    summary?.consumed_fat ??
    meals.reduce((acc, m) => acc + (Number(m.fat) || 0), 0);

  const calPercent = Math.min(100, Math.round((consumedCal / Math.max(1, targetCal)) * 100));
  const goalInfo = GOAL_LABELS[profile?.goal || 'recomposition'] || GOAL_LABELS.recomposition;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Selector de Fecha */}
        <View style={styles.dateBar}>
          <TouchableOpacity
            style={styles.dateNavBtn}
            onPress={() => shiftDate(-1)}
          >
            <Text style={styles.dateNavBtnText}>◀ Anterior</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateCenter}
            onPress={() => setSelectedDate(todayISO())}
          >
            <Text style={styles.dateLabel}>
              📅 {selectedDate === todayISO() ? `Hoy (${selectedDate})` : selectedDate}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateNavBtn}
            onPress={() => shiftDate(1)}
          >
            <Text style={styles.dateNavBtnText}>Siguiente ▶</Text>
          </TouchableOpacity>
        </View>

        {!summary && !loading && (
          <TouchableOpacity
            style={styles.setupNotice}
            onPress={onGoToProfile}
          >
            <Text style={styles.setupNoticeTitle}>
              ⚡ Configura tu Perfil Nutricional
            </Text>
            <Text style={styles.setupNoticeText}>
              Aún no has guardado tus metas en /profile. Toca aquí para calcular
              tus macros personalizados.
            </Text>
          </TouchableOpacity>
        )}

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Tarjeta Principal de Balance Calórico y Macros */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Balance Energético Diario</Text>
              <Text style={styles.summarySubtitle}>{goalInfo.title}</Text>
            </View>
            <View style={[styles.goalChip, { backgroundColor: goalInfo.color + '20' }]}>
              <Text style={[styles.goalChipText, { color: goalInfo.color }]}>
                {goalInfo.badge}
              </Text>
            </View>
          </View>

          <View style={styles.calorieRow}>
            <View style={styles.calorieStat}>
              <Text style={styles.calorieStatValue}>{Math.round(consumedCal)}</Text>
              <Text style={styles.calorieStatLabel}>Consumidas</Text>
            </View>

            <View style={styles.calorieRing}>
              <Text
                style={[
                  styles.remainingValue,
                  remainingCal < 0 && { color: '#EF4444' },
                ]}
              >
                {Math.round(remainingCal)}
              </Text>
              <Text style={styles.remainingLabel}>
                {remainingCal >= 0 ? 'kcal restantes' : 'kcal excedidas'}
              </Text>
              <Text style={styles.percentSub}>{calPercent}% de la meta</Text>
            </View>

            <View style={styles.calorieStat}>
              <Text style={styles.calorieStatValue}>{Math.round(targetCal)}</Text>
              <Text style={styles.calorieStatLabel}>Meta diaria</Text>
            </View>
          </View>

          {/* Barra general de calorías */}
          <View style={styles.mainProgressTrack}>
            <View
              style={[
                styles.mainProgressFill,
                {
                  width: `${calPercent}%`,
                  backgroundColor: remainingCal < 0 ? '#EF4444' : '#0D9488',
                },
              ]}
            />
          </View>

          {/* Barras de Macronutrientes */}
          <View style={styles.macrosGrid}>
            <MacroBar
              label="Proteínas"
              consumed={consumedP}
              target={targetP}
              color="#2563EB"
              unit="g"
            />
            <MacroBar
              label="Carbohidratos"
              consumed={consumedC}
              target={targetC}
              color="#D97706"
              unit="g"
            />
            <MacroBar
              label="Grasas"
              consumed={consumedF}
              target={targetF}
              color="#9333EA"
              unit="g"
            />
          </View>
        </View>

        {/* Encabezado de Comidas del Día */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Registro por Tiempos de Comida</Text>
          <TouchableOpacity
            style={styles.addBtnTop}
            onPress={() => openAddModal('Desayuno')}
          >
            <Text style={styles.addBtnTopText}>+ Registrar Alimento</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0D9488"
            style={{ marginVertical: 24 }}
          />
        ) : (
          MEAL_TYPES.map((type) => {
            const groupMeals = meals.filter(
              (m) => m.meal_type?.toLowerCase() === type.toLowerCase()
            );
            const groupCalories = groupMeals.reduce(
              (acc, m) => acc + (Number(m.calories) || 0),
              0
            );

            return (
              <View key={type} style={styles.mealGroupCard}>
                <View style={styles.mealGroupHeader}>
                  <View style={styles.mealGroupTitleRow}>
                    <Text style={styles.mealEmoji}>{getMealEmoji(type)}</Text>
                    <View>
                      <Text style={styles.mealGroupTitle}>{type}</Text>
                      <Text style={styles.mealGroupSubtotal}>
                        {Math.round(groupCalories)} kcal acumuladas
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.quickAddTypeBtn}
                    onPress={() => openAddModal(type)}
                  >
                    <Text style={styles.quickAddTypeText}>+ Agregar</Text>
                  </TouchableOpacity>
                </View>

                {groupMeals.length === 0 ? (
                  <Text style={styles.emptyMealText}>
                    Sin alimentos registrados en {type.toLowerCase()}.
                  </Text>
                ) : (
                  groupMeals.map((item) => (
                    <View key={item.id} style={styles.mealItemRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.mealFoodName}>{item.food_name}</Text>
                        <Text style={styles.mealMacrosLine}>
                          🔥 {Math.round(item.calories)} kcal · P:{' '}
                          {Math.round(item.protein)}g · C:{' '}
                          {Math.round(item.carbs)}g · G: {Math.round(item.fat)}g
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleRemoveMeal(item.id)}
                      >
                        <Text style={styles.deleteBtnText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal para Agregar Alimento */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Alimento Consumido</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }}>
              <Text style={styles.inputLabel}>Tiempo de comida</Text>
              <View style={styles.typeSelectorRow}>
                {MEAL_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeOption,
                      mealType === t && styles.typeOptionSelected,
                    ]}
                    onPress={() => setMealType(t)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        mealType === t && styles.typeOptionTextSelected,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>
                Selección rápida de alimentos frecuentes:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.presetsScroll}
              >
                {QUICK_FOOD_PRESETS.map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetChip}
                    onPress={() => handleApplyPreset(preset)}
                  >
                    <Text style={styles.presetChipTitle} numberOfLines={1}>
                      {preset.food_name}
                    </Text>
                    <Text style={styles.presetChipSub}>
                      {preset.calories} kcal · {preset.protein}g P
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Nombre del alimento o platillo</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej. Pechuga de pollo con arroz"
                value={foodName}
                onChangeText={setFoodName}
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInputWrap}>
                  <Text style={styles.inputLabel}>Calorías (kcal)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="450"
                    value={calories}
                    onChangeText={setCalories}
                  />
                </View>
                <View style={styles.halfInputWrap}>
                  <Text style={styles.inputLabel}>Proteínas (g)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="35"
                    value={protein}
                    onChangeText={setProtein}
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.halfInputWrap}>
                  <Text style={styles.inputLabel}>Carbohidratos (g)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="45"
                    value={carbs}
                    onChangeText={setCarbs}
                  />
                </View>
                <View style={styles.halfInputWrap}>
                  <Text style={styles.inputLabel}>Grasas (g)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="14"
                    value={fat}
                    onChangeText={setFat}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.saveModalBtn,
                submitting && { opacity: 0.6 },
              ]}
              onPress={handleSaveMeal}
              disabled={submitting}
            >
              <Text style={styles.saveModalBtnText}>
                {submitting ? 'Guardando...' : 'Guardar en Registro Diario'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MacroBar({ label, consumed, target, color, unit }) {
  const pct = Math.min(100, Math.round((consumed / Math.max(1, target)) * 100));
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroNumbers, { color }]}>
        {Math.round(consumed)} / {Math.round(target)}
        {unit}
      </Text>
      <View style={styles.macroTrack}>
        <View
          style={[
            styles.macroFill,
            { width: `${pct}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.macroPct}>{pct}%</Text>
    </View>
  );
}

function getMealEmoji(type) {
  switch (type) {
    case 'Desayuno':
      return '🍳';
    case 'Comida':
      return '🍲';
    case 'Cena':
      return '🥗';
    default:
      return '🍎';
  }
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
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateNavBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  dateNavBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dateCenter: {
    paddingHorizontal: 8,
  },
  dateLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  setupNotice: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  setupNoticeTitle: {
    fontWeight: '700',
    color: '#92400E',
    fontSize: 14,
  },
  setupNoticeText: {
    color: '#B45309',
    fontSize: 12.5,
    marginTop: 4,
  },
  errorBox: {
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  summarySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  goalChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  goalChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  calorieStat: {
    alignItems: 'center',
  },
  calorieStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  calorieStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  calorieRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 7,
    borderColor: '#CCFBF1',
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  remainingValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0D9488',
  },
  remainingLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F766E',
  },
  percentSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  mainProgressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mainProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  macroLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  macroNumbers: {
    fontSize: 13,
    fontWeight: '800',
    marginVertical: 4,
  },
  macroTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroPct: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  addBtnTop: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnTopText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  mealGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mealGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mealGroupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealEmoji: {
    fontSize: 24,
  },
  mealGroupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  mealGroupSubtotal: {
    fontSize: 12,
    color: '#64748B',
  },
  quickAddTypeBtn: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  quickAddTypeText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyMealText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingTop: 10,
  },
  mealItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  mealFoodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  mealMacrosLine: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeModalText: {
    fontSize: 20,
    color: '#64748B',
    paddingHorizontal: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  typeOptionSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },
  presetsScroll: {
    marginBottom: 6,
  },
  presetChip: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
    width: 190,
  },
  presetChipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  presetChipSub: {
    fontSize: 11,
    color: '#115E59',
    marginTop: 2,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInputWrap: {
    flex: 1,
  },
  saveModalBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
