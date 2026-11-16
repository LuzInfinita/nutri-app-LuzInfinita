import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {
  saveUserProfile,
  getApiBaseUrl,
  isDemoMode,
} from '../services/api';
import {
  calculateRecommendedMacros,
  GOAL_LABELS,
} from '../utils/nutritionCalculator';

export default function ProfileScreen({
  user,
  profile,
  onProfileSaved,
  onLogout,
}) {
  const [weight, setWeight] = useState(String(profile?.weight ?? 78.5));
  const [height, setHeight] = useState(String(profile?.height ?? 175));
  const [goal, setGoal] = useState(profile?.goal ?? 'recomposition');

  const [targetCalories, setTargetCalories] = useState(
    String(profile?.target_calories ?? 2250)
  );
  const [targetProtein, setTargetProtein] = useState(
    String(profile?.target_protein ?? 165)
  );
  const [targetCarbs, setTargetCarbs] = useState(
    String(profile?.target_carbs ?? 225)
  );
  const [targetFat, setTargetFat] = useState(
    String(profile?.target_fat ?? 75)
  );

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAutoCalculate = (customGoal) => {
    const chosenGoal = customGoal || goal;
    const rec = calculateRecommendedMacros({
      weight: parseFloat(weight) || 75,
      height: parseFloat(height) || 170,
      goal: chosenGoal,
    });
    setTargetCalories(String(rec.target_calories));
    setTargetProtein(String(rec.target_protein));
    setTargetCarbs(String(rec.target_carbs));
    setTargetFat(String(rec.target_fat));
    setStatusMsg(
      '✨ Macros recalculados automáticamente según tu peso, estatura y objetivo.'
    );
  };

  const handleSave = async () => {
    setErrorMsg('');
    setStatusMsg('');
    setSaving(true);
    try {
      const saved = await saveUserProfile({
        weight: parseFloat(weight) || 75,
        height: parseFloat(height) || 170,
        goal,
        target_calories: parseInt(targetCalories, 10) || 2000,
        target_protein: parseFloat(targetProtein) || 150,
        target_carbs: parseFloat(targetCarbs) || 200,
        target_fat: parseFloat(targetFat) || 65,
      });
      setStatusMsg('✅ Perfil y metas guardados correctamente en /profile.');
      if (onProfileSaved) {
        onProfileSaved(saved);
      }
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Tarjeta de Usuario y Estado de Conexión */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(user?.username || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.usernameText}>@{user?.username || 'usuario'}</Text>
          <Text style={styles.connStatus}>
            {isDemoMode()
              ? '🟢 Modo Demo Local Activo'
              : `🔗 Conectado a ${getApiBaseUrl()}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Sección 1: Métricas Físicas y Objetivo */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Métricas Corporales y Objetivo</Text>
        <Text style={styles.cardSub}>
          Ingresa tu peso y estatura actual para calcular los macronutrientes
          adecuados para tu plan alimenticio.
        </Text>

        <View style={styles.rowInputs}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Peso actual (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Estatura (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>
        </View>

        <Text style={styles.label}>Selecciona tu objetivo nutricional</Text>
        {Object.values(GOAL_LABELS).map((item) => {
          const selected = goal === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.goalOptionCard,
                selected && {
                  borderColor: item.color,
                  backgroundColor: item.color + '10',
                },
              ]}
              onPress={() => {
                setGoal(item.id);
                handleAutoCalculate(item.id);
              }}
            >
              <View style={styles.goalOptionHeader}>
                <Text
                  style={[
                    styles.goalOptionTitle,
                    selected && { color: item.color },
                  ]}
                >
                  {selected ? '◉ ' : '○ '}
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.goalBadge,
                    { color: item.color },
                  ]}
                >
                  {item.badge}
                </Text>
              </View>
              <Text style={styles.goalOptionSub}>{item.subtitle}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.calcButton}
          onPress={() => handleAutoCalculate(goal)}
        >
          <Text style={styles.calcButtonText}>
            🧮 Recalcular Macros Recomendados Automáticamente
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sección 2: Metas de Calorías y Macronutrientes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          2. Metas Diarias de Calorías y Macros
        </Text>
        <Text style={styles.cardSub}>
          Puedes usar los valores calculados automáticamente o ajustarlos de
          forma manual antes de sincronizar con el backend (`POST /profile`).
        </Text>

        {statusMsg ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>{statusMsg}</Text>
          </View>
        ) : null}

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.rowInputs}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Meta de Calorías (kcal)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetCalories}
              onChangeText={setTargetCalories}
            />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Proteínas (g / día)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetProtein}
              onChangeText={setTargetProtein}
            />
          </View>
        </View>

        <View style={styles.rowInputs}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Carbohidratos (g / día)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetCarbs}
              onChangeText={setTargetCarbs}
            />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Grasas (g / día)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetFat}
              onChangeText={setTargetFat}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving
              ? 'Guardando en /profile...'
              : '💾 Guardar Perfil y Metas Nutricionales'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  connStatus: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 18,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  halfCol: {
    flex: 1,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  goalOptionCard: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  goalOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  goalBadge: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  goalOptionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  calcButton: {
    backgroundColor: '#F0FDFA',
    borderColor: '#5EEAD4',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  calcButtonText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 13,
  },
  statusBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  statusBannerText: {
    color: '#166534',
    fontSize: 12.5,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 12.5,
  },
  saveBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
