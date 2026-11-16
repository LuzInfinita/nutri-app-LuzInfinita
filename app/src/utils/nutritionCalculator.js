/**
 * Calcula los requerimientos calóricos y macronutrientes diarios recomendados
 * basándose en peso (kg), altura (cm) y objetivo nutricional del usuario.
 *
 * Objetivos soportados en el backend (models.py -> UserProfile.goal):
 * - 'recomposition': Recomposición corporal (mantenimiento ligero + alta proteína)
 * - 'fat_loss': Pérdida de grasa corporal (déficit calórico ~20%)
 * - 'muscle_gain': Ganancia de masa muscular (superávit calórico ~12-15%)
 */
export function calculateRecommendedMacros({
  weight = 75,
  height = 170,
  age = 28,
  activityFactor = 1.45,
  goal = 'recomposition',
}) {
  const w = Number(weight) || 75;
  const h = Number(height) || 170;
  const a = Number(age) || 28;

  // Fórmula Mifflin-St Jeor promedio unisex
  const bmr = 10 * w + 6.25 * h - 5 * a;
  const tdee = bmr * activityFactor;

  let targetCalories = tdee;
  let proteinPerKg = 2.0;
  let fatPerKg = 0.9;

  if (goal === 'fat_loss') {
    targetCalories = tdee * 0.82;
    proteinPerKg = 2.2;
    fatPerKg = 0.85;
  } else if (goal === 'muscle_gain') {
    targetCalories = tdee * 1.12;
    proteinPerKg = 2.0;
    fatPerKg = 1.0;
  } else {
    // recomposition
    targetCalories = tdee * 0.96;
    proteinPerKg = 2.1;
    fatPerKg = 0.9;
  }

  targetCalories = Math.max(1300, Math.round(targetCalories / 10) * 10);

  const proteinGrams = Math.round(w * proteinPerKg);
  const fatGrams = Math.round(w * fatPerKg);

  const caloriesFromProteinAndFat = proteinGrams * 4 + fatGrams * 9;
  const remainingForCarbs = Math.max(200, targetCalories - caloriesFromProteinAndFat);
  const carbsGrams = Math.round(remainingForCarbs / 4);

  return {
    target_calories: targetCalories,
    target_protein: proteinGrams,
    target_carbs: carbsGrams,
    target_fat: fatGrams,
  };
}

export const GOAL_LABELS = {
  recomposition: {
    id: 'recomposition',
    title: 'Recomposición Corporal',
    subtitle: 'Perder grasa y mantener/ganar tono muscular simultáneamente',
    badge: 'Balanceado',
    color: '#0D9488',
  },
  fat_loss: {
    id: 'fat_loss',
    title: 'Pérdida de Grasa',
    subtitle: 'Déficit calórico controlado con alta proteína para saciedad',
    badge: 'Déficit -18%',
    color: '#EA580C',
  },
  muscle_gain: {
    id: 'muscle_gain',
    title: 'Ganar Músculo',
    subtitle: 'Superávit energético limpio para hipertrofia y rendimiento',
    badge: 'Superávit +12%',
    color: '#2563EB',
  },
};

export const MEAL_TYPES = ['Desayuno', 'Comida', 'Cena', 'Colación'];

/**
 * Catálogo de Planes Alimenticios Diarios y Semanales organizados por tiempo de comida
 * según el objetivo seleccionado en el perfil del usuario.
 */
export const DIET_PLANS_BY_GOAL = {
  recomposition: [
    {
      meal_type: 'Desayuno',
      time: '08:00 AM',
      food_name: 'Omelette de claras y huevo entero con espinaca + avena con canela',
      portion: '3 claras + 1 huevo, 1 taza espinaca, 45g avena en hojuelas',
      calories: 460,
      protein: 34,
      carbs: 44,
      fat: 14,
      tags: ['Alto en proteína', 'Energía sostenida'],
    },
    {
      meal_type: 'Comida',
      time: '02:00 PM',
      food_name: 'Pechuga de pollo asada con quinoa, brócoli al vapor y aguacate',
      portion: '160g pollo, 120g quinoa cocida, 1 taza brócoli, 1/3 aguacate',
      calories: 640,
      protein: 52,
      carbs: 58,
      fat: 20,
      tags: ['Comida completa', 'Fibra y micronutrientes'],
    },
    {
      meal_type: 'Colación',
      time: '05:30 PM',
      food_name: 'Yogurt griego sin azúcar con frutos rojos y nueces',
      portion: '180g yogurt griego, 60g fresas/moras, 15g nueces',
      calories: 270,
      protein: 22,
      carbs: 17,
      fat: 12,
      tags: ['Snack saciante', 'Probióticos'],
    },
    {
      meal_type: 'Cena',
      time: '08:30 PM',
      food_name: 'Filete de salmón o atún a la plancha con ensalada mediterránea y camote',
      portion: '150g pescado, 100g camote horneado, mix de hojas verdes y aceite de oliva',
      calories: 560,
      protein: 42,
      carbs: 40,
      fat: 24,
      tags: ['Omega-3', 'Recuperación nocturna'],
    },
  ],
  fat_loss: [
    {
      meal_type: 'Desayuno',
      time: '08:00 AM',
      food_name: 'Huevos revueltos a la mexicana con nopal asado y 1 tortilla de maíz',
      portion: '2 huevos + 2 claras, 1 taza nopales con pico de gallo, 1 tortilla',
      calories: 350,
      protein: 28,
      carbs: 22,
      fat: 15,
      tags: ['Bajo índice glucémico', 'Alta saciedad'],
    },
    {
      meal_type: 'Comida',
      time: '02:00 PM',
      food_name: 'Fajitas de pechuga de pavo o pollo con pimientos, calabacita y arroz integral',
      portion: '150g pechuga, 1.5 tazas vegetales salteados, 80g arroz integral',
      calories: 510,
      protein: 46,
      carbs: 45,
      fat: 14,
      tags: ['Volumen alto', 'Bajas calorías'],
    },
    {
      meal_type: 'Colación',
      time: '05:30 PM',
      food_name: 'Queso cottage bajo en grasa con manzana verde y semillas de chía',
      portion: '150g queso cottage, 1 manzana mediana, 1 cdta chía',
      calories: 230,
      protein: 21,
      carbs: 22,
      fat: 6,
      tags: ['Control de apetito', 'Rico en fibra'],
    },
    {
      meal_type: 'Cena',
      time: '08:30 PM',
      food_name: 'Ensalada tibia de atún o pescado blanco con aguacate y espárragos',
      portion: '140g filete blanco/atún, espárragos al grill, 1/4 aguacate',
      calories: 390,
      protein: 38,
      carbs: 14,
      fat: 18,
      tags: ['Cena ligera', 'Keto-friendly'],
    },
  ],
  muscle_gain: [
    {
      meal_type: 'Desayuno',
      time: '07:30 AM',
      food_name: 'Hotcakes de avena con proteína, plátano y crema de cacahuate natural',
      portion: '70g avena, 3 huevos, 1 plátano entero, 1 cda crema de cacahuate',
      calories: 680,
      protein: 38,
      carbs: 78,
      fat: 22,
      tags: ['Pre-entreno ideal', 'Alta densidad energética'],
    },
    {
      meal_type: 'Comida',
      time: '02:00 PM',
      food_name: 'Bowl de carne magra de res (sirloin) con arroz jazmín, frijoles y aguacate',
      portion: '180g res magra, 160g arroz cocido, 1/2 taza frijoles, 1/3 aguacate',
      calories: 820,
      protein: 56,
      carbs: 84,
      fat: 26,
      tags: ['Hierro y Creatina natural', 'Hipertrofia'],
    },
    {
      meal_type: 'Colación',
      time: '05:30 PM',
      food_name: 'Smoothie post-entreno de leche, proteína de suero, avena y frutos rojos',
      portion: '300ml leche semidescremada, 1 scoop proteína, 40g avena, 1/2 taza frutos rojos',
      calories: 440,
      protein: 36,
      carbs: 52,
      fat: 9,
      tags: ['Recuperación rápida', 'Síntesis proteica'],
    },
    {
      meal_type: 'Cena',
      time: '09:00 PM',
      food_name: 'Pasta integral con pechuga de pollo al pesto ligero y queso parmesano',
      portion: '150g pollo, 120g pasta cocida, salsa pesto con aceite de oliva',
      calories: 650,
      protein: 48,
      carbs: 64,
      fat: 21,
      tags: ['Recarga de glucógeno', 'Aminoácidos completos'],
    },
  ],
};

/**
 * Alimentos frecuentes para selección rápida en el módulo de registro diario
 */
export const QUICK_FOOD_PRESETS = [
  { meal_type: 'Desayuno', food_name: '2 Huevos revueltos con jamón de pavo', calories: 240, protein: 21, carbs: 3, fat: 16 },
  { meal_type: 'Desayuno', food_name: 'Tazón de avena con leche y plátano', calories: 340, protein: 12, carbs: 58, fat: 6 },
  { meal_type: 'Comida', food_name: 'Pechuga de pollo asada (150g) con arroz', calories: 430, protein: 46, carbs: 42, fat: 7 },
  { meal_type: 'Comida', food_name: 'Tacos de bistec de res en tortilla de maíz (3 pzas)', calories: 490, protein: 35, carbs: 45, fat: 18 },
  { meal_type: 'Cena', food_name: 'Ensalada de atún con aguacate y galletas horneadas', calories: 360, protein: 32, carbs: 24, fat: 15 },
  { meal_type: 'Colación', food_name: 'Batido de proteína Whey en agua + almendras', calories: 220, protein: 27, carbs: 5, fat: 10 },
];
