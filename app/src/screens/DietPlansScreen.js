import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { createMeal } from '../services/api';
import {
  DIET_PLANS_BY_GOAL,
  GOAL_LABELS,
} from '../utils/nutritionCalculator';

const WEEK_DAYS = [
  { key: 'lun', label: 'Lun' },
  { key: 'mar', label: 'Mar' },
  { key: 'mie', label: 'Mié' },
  { key: 'jue', label: 'Jue' },
  { key: 'vie', label: 'Vie' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

export default function DietPlansScreen({ profile, onMealLogged }) {
  const [selectedGoal, setSelectedGoal] = useState(
    profile?.goal || 'recomposition'
  );
  const [selectedDay, setSelectedDay] = useState('lun');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Estado del Asistente Nutricional IA (Agente / MCP)
  const [userQuestion, setUserQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      text: `¡Hola! Soy tu Agente Asesor Nutricional IA conectado al contexto de tu plan (${
        GOAL_LABELS[profile?.goal || 'recomposition']?.title ||
        'Recomposición Corporal'
      }). Puedes preguntarme por sustituciones de alimentos, ajustes de porciones según tu evolución de peso o equivalencias de macronutrientes.`,
    },
  ]);

  const currentPlan =
    DIET_PLANS_BY_GOAL[selectedGoal] || DIET_PLANS_BY_GOAL.recomposition;

  const totalPlanCalories = currentPlan.reduce((acc, m) => acc + m.calories, 0);
  const totalPlanProtein = currentPlan.reduce((acc, m) => acc + m.protein, 0);
  const totalPlanCarbs = currentPlan.reduce((acc, m) => acc + m.carbs, 0);
  const totalPlanFat = currentPlan.reduce((acc, m) => acc + m.fat, 0);

  const handleLogPlanMeal = async (mealItem) => {
    try {
      await createMeal({
        meal_type: mealItem.meal_type,
        food_name: mealItem.food_name,
        calories: mealItem.calories,
        protein: mealItem.protein,
        carbs: mealItem.carbs,
        fat: mealItem.fat,
      });
      setFeedbackMsg(
        `✅ "${mealItem.food_name}" agregado a tu registro de ${mealItem.meal_type}.`
      );
      if (onMealLogged) {
        onMealLogged();
      }
      setTimeout(() => setFeedbackMsg(''), 3500);
    } catch (err) {
      setFeedbackMsg(`⚠️ Error al registrar: ${err.message}`);
    }
  };

  const handleAskAgent = (customPrompt) => {
    const query = (customPrompt || userQuestion).trim();
    if (!query) return;

    const reply = generateSmartAdvisorReply(query, selectedGoal, profile);
    setChatHistory((prev) => [
      ...prev,
      { role: 'user', text: query },
      { role: 'assistant', text: reply },
    ]);
    if (!customPrompt) {
      setUserQuestion('');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Selector de Plan por Objetivo */}
      <Text style={styles.sectionHeaderTitle}>
        Planes Alimenticios por Objetivo
      </Text>
      <Text style={styles.sectionHeaderSub}>
        Visualiza tu dieta diaria y semanal organizada por tiempos de comida y
        envía cualquier platillo directo a tu conteo diario.
      </Text>

      <View style={styles.goalTabsRow}>
        {Object.values(GOAL_LABELS).map((g) => {
          const active = selectedGoal === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.goalTabBtn,
                active && { backgroundColor: g.color, borderColor: g.color },
              ]}
              onPress={() => setSelectedGoal(g.id)}
            >
              <Text
                style={[styles.goalTabText, active && { color: '#FFFFFF' }]}
              >
                {g.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selector de Día de la Semana */}
      <View style={styles.weekStrip}>
        {WEEK_DAYS.map((day) => {
          const isSelected = selectedDay === day.key;
          return (
            <TouchableOpacity
              key={day.key}
              style={[
                styles.dayPill,
                isSelected && styles.dayPillActive,
              ]}
              onPress={() => setSelectedDay(day.key)}
            >
              <Text
                style={[
                  styles.dayPillText,
                  isSelected && styles.dayPillTextActive,
                ]}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Resumen de Macros del Plan Sugerido */}
      <View style={styles.planSummaryBanner}>
        <View>
          <Text style={styles.planBannerTitle}>
            Aporte Total del Plan Diario
          </Text>
          <Text style={styles.planBannerSub}>
            4 tiempos de comida estructurados
          </Text>
        </View>
        <View style={styles.planMacrosRight}>
          <Text style={styles.planTotalKcal}>{totalPlanCalories} kcal</Text>
          <Text style={styles.planMacrosDetail}>
            P: {totalPlanProtein}g · C: {totalPlanCarbs}g · G: {totalPlanFat}g
          </Text>
        </View>
      </View>

      {feedbackMsg ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedbackMsg}</Text>
        </View>
      ) : null}

      {/* Tarjetas de Tiempos de Comida del Plan */}
      {currentPlan.map((item, idx) => (
        <View key={idx} style={styles.planCard}>
          <View style={styles.planCardTop}>
            <View style={styles.mealTypeBadge}>
              <Text style={styles.mealTypeBadgeText}>{item.meal_type}</Text>
            </View>
            <Text style={styles.mealTimeText}>🕒 {item.time}</Text>
          </View>

          <Text style={styles.foodTitle}>{item.food_name}</Text>
          <Text style={styles.portionText}>📏 Porción: {item.portion}</Text>

          <View style={styles.tagRow}>
            {item.tags.map((tag, tIdx) => (
              <View key={tIdx} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.planCardFooter}>
            <Text style={styles.planCardMacros}>
              🔥 {item.calories} kcal · P: {item.protein}g · C: {item.carbs}g ·
              G: {item.fat}g
            </Text>
            <TouchableOpacity
              style={styles.logMealBtn}
              onPress={() => handleLogPlanMeal(item)}
            >
              <Text style={styles.logMealBtnText}>+ Registrar hoy</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Módulo de Agente Asesor Nutricional IA / MCP */}
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiIcon}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>
              Agente Asesor Nutricional (IA / MCP)
            </Text>
            <Text style={styles.aiSubtitle}>
              Sustitución inteligente de alimentos y ajuste de porciones según
              tus objetivos y progreso semanal.
            </Text>
          </View>
        </View>

        {/* Sugerencias rápidas de consulta */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickPromptsRow}
        >
          {[
            '¿Por qué puedo sustituir el pollo o salmón?',
            '¿Cómo ajusto mis macros si mi peso se estancó?',
            '¿Qué colación alta en proteína me recomiendas?',
            'Sustituto de avena o arroz en mi plan',
          ].map((q, i) => (
            <TouchableOpacity
              key={i}
              style={styles.promptChip}
              onPress={() => handleAskAgent(q)}
            >
              <Text style={styles.promptChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Historial de conversación */}
        <View style={styles.chatBox}>
          {chatHistory.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.chatBubble,
                msg.role === 'user'
                  ? styles.chatBubbleUser
                  : styles.chatBubbleBot,
              ]}
            >
              <Text
                style={[
                  styles.chatBubbleText,
                  msg.role === 'user' && { color: '#FFFFFF' },
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Pregunta sobre equivalencias o ajustes..."
            placeholderTextColor="#94A3B8"
            value={userQuestion}
            onChangeText={setUserQuestion}
          />
          <TouchableOpacity
            style={styles.chatSendBtn}
            onPress={() => handleAskAgent()}
          >
            <Text style={styles.chatSendBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function generateSmartAdvisorReply(query, goal, profile) {
  const q = query.toLowerCase();
  const targetP = profile?.target_protein || 160;
  const targetCal = profile?.target_calories || 2200;

  if (q.includes('pollo') || q.includes('salmón') || q.includes('proteína') || q.includes('sustitu')) {
    return `Para mantener tus ${targetP}g de proteína diarios sin alterar tus calorías (${targetCal} kcal), puedes intercambiar 150g de pechuga de pollo por:\n• 160g de filete de pescado blanco o atún fresco\n• 150g de pavo magro\n• 200g de tofu firme + 2 claras de huevo\n• 140g de carne de res magra (sirloin).`;
  }
  if (q.includes('estanc') || q.includes('peso') || q.includes('ajust')) {
    if (goal === 'fat_loss') {
      return `Si tu registro histórico de peso muestra la misma cifra por más de 2 semanas en Pérdida de Grasa, te sugiero reducir 150 kcal provenientes de carbohidratos (-35g de carbohidratos) manteniendo intacta tu proteína en ${targetP}g para proteger la masa muscular.`;
    }
    if (goal === 'muscle_gain') {
      return `Si tu peso no ha subido al menos 0.25 kg por semana en Ganancia Muscular, incrementa tu ingesta en +200 kcal agregando 40g de avena o 1 cucharada extra de crema de cacahuate en tu desayuno o colación.`;
    }
    return `En Recomposición Corporal es normal que el peso en báscula varíe poco mientras pierdes grasa y ganas músculo. Mantén tus ${targetCal} kcal y asegúrate de cubrir al menos ${targetP}g de proteína todos los días.`;
  }
  if (q.includes('avena') || q.includes('arroz') || q.includes('carbo')) {
    return `Equivalencias para 45g de avena o 120g de arroz cocido (~30g de carbohidratos complejos):\n• 130g de camote o papa al horno\n• 2 tortillas de maíz + 1/2 taza de frijoles\n• 110g de quinoa cocida\n• 2 rebanadas de pan Ezequiel o integral.`;
  }
  return `Basado en tu perfil (${targetCal} kcal | P: ${targetP}g), te recomiendo priorizar alimentos de un solo ingrediente en tus 4 tiempos de comida. Puedes pulsar "+ Registrar hoy" en cualquiera de las tarjetas de arriba para añadir la comida directamente a tu balance diario en el backend.`;
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
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeaderSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  goalTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  goalTabBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: '#0F172A',
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  dayPillTextActive: {
    color: '#FFFFFF',
  },
  planSummaryBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  planBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  planBannerSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  planMacrosRight: {
    alignItems: 'flex-end',
  },
  planTotalKcal: {
    color: '#5EEAD4',
    fontSize: 18,
    fontWeight: '800',
  },
  planMacrosDetail: {
    color: '#CBD5E1',
    fontSize: 11.5,
    marginTop: 2,
  },
  feedbackBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  feedbackText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeBadge: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealTypeBadgeText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 12,
  },
  mealTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  foodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  portionText: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  planCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  planCardMacros: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  logMealBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },
  logMealBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  aiIcon: {
    fontSize: 32,
  },
  aiTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  quickPromptsRow: {
    marginBottom: 12,
  },
  promptChip: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#5EEAD4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  promptChipText: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '600',
  },
  chatBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  chatBubble: {
    padding: 10,
    borderRadius: 12,
    maxWidth: '92%',
  },
  chatBubbleBot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  chatBubbleUser: {
    backgroundColor: '#0D9488',
    alignSelf: 'flex-end',
  },
  chatBubbleText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
  },
  chatSendBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
