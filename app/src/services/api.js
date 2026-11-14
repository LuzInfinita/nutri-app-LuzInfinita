import { Platform } from 'react-native';

// URL por defecto:
// - En emulador Android de Android Studio: 10.0.2.2 apunta al localhost de la PC
// - En Web / iOS Simulator: localhost:8000
const DEFAULT_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000'
    : 'http://localhost:8000';

let baseUrl = DEFAULT_BASE_URL;
let authToken = null;
let demoMode = false;

// Estado local en memoria para Modo Demo (cuando el backend no está levantado o faltan endpoints)
let mockProfile = {
  id: 1,
  user_id: 1,
  weight: 78.5,
  height: 175,
  goal: 'recomposition',
  target_calories: 2250,
  target_protein: 165,
  target_carbs: 225,
  target_fat: 75,
};

const todayStr = () => new Date().toISOString().split('T')[0];

let mockMeals = [
  {
    id: 101,
    user_id: 1,
    meal_type: 'Desayuno',
    food_name: 'Huevos revueltos con espinaca y avena',
    calories: 480,
    protein: 32,
    carbs: 45,
    fat: 18,
    logged_at: `${todayStr()}T08:30:00`,
  },
  {
    id: 102,
    user_id: 1,
    meal_type: 'Comida',
    food_name: 'Pechuga de pollo a la plancha con arroz y aguacate',
    calories: 690,
    protein: 54,
    carbs: 68,
    fat: 21,
    logged_at: `${todayStr()}T14:15:00`,
  },
  {
    id: 103,
    user_id: 1,
    meal_type: 'Colación',
    food_name: 'Yogurt griego natural con almendras y fresas',
    calories: 260,
    protein: 22,
    carbs: 18,
    fat: 11,
    logged_at: `${todayStr()}T17:30:00`,
  },
];

let mockWeightLogs = [
  { id: 1, user_id: 1, weight: 81.2, logged_at: '2026-10-14T08:00:00' },
  { id: 2, user_id: 1, weight: 80.5, logged_at: '2026-10-21T08:00:00' },
  { id: 3, user_id: 1, weight: 79.8, logged_at: '2026-10-28T08:00:00' },
  { id: 4, user_id: 1, weight: 79.1, logged_at: '2026-11-04T08:00:00' },
  { id: 5, user_id: 1, weight: 78.5, logged_at: `${todayStr()}T08:00:00` },
];

export const setApiBaseUrl = (url) => {
  if (url && url.trim()) {
    baseUrl = url.trim().replace(/\/+$/, '');
  }
};

export const getApiBaseUrl = () => baseUrl;

export const setAuthToken = (token) => {
  authToken = token;
};

export const setDemoMode = (enabled) => {
  demoMode = enabled;
};

export const isDemoMode = () => demoMode;

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (data && (data.detail || data.message)) ||
        `Error HTTP ${response.status}`;
      const error = new Error(
        typeof message === 'string' ? message : JSON.stringify(message)
      );
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error(
        `Tiempo de espera agotado al conectar con ${baseUrl}. Verifica que el servidor FastAPI esté en ejecución o activa el Modo Demo.`
      );
    }
    throw err;
  }
}

// ==========================================
// 1. AUTENTICACIÓN (/register y /login)
// ==========================================

export async function registerUser({ username, email, password }) {
  if (demoMode) {
    return { id: 1, username, email };
  }
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function loginUser({ username, password }) {
  if (demoMode) {
    const fakeToken = 'demo_jwt_token_nutri_app';
    setAuthToken(fakeToken);
    return {
      access_token: fakeToken,
      token_type: 'bearer',
      user_id: 1,
    };
  }
  const data = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (data?.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

// ==========================================
// 2. PERFIL Y METAS NUTRICIONALES (/profile)
// ==========================================

export async function saveUserProfile(profileData) {
  const payload = {
    weight: Number(profileData.weight),
    height: Number(profileData.height),
    goal: profileData.goal || 'recomposition',
    target_calories: Math.round(Number(profileData.target_calories)),
    target_protein: Number(profileData.target_protein),
    target_carbs: Number(profileData.target_carbs),
    target_fat: Number(profileData.target_fat),
  };

  if (demoMode) {
    mockProfile = { ...mockProfile, ...payload };
    return mockProfile;
  }

  const saved = await request('/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  mockProfile = saved;
  return saved;
}

export async function fetchUserProfile() {
  if (demoMode) {
    return mockProfile;
  }
  // Como el backend actual solo tiene POST /profile y GET /summary,
  // intentamos obtener los targets desde GET /summary o fallback local
  try {
    const summary = await request('/summary');
    return {
      ...mockProfile,
      target_calories: summary.target_calories,
      target_protein: summary.target_protein,
      target_carbs: summary.target_carbs,
      target_fat: summary.target_fat,
    };
  } catch (err) {
    if (err.status === 404) {
      return null; // Perfil aún no configurado en el backend
    }
    throw err;
  }
}

// ==========================================
// 3. REGISTRO Y CONSULTA DE COMIDAS (/meals)
// ==========================================

export async function getMeals(dateStr = todayStr()) {
  if (demoMode) {
    return mockMeals.filter((m) => m.logged_at.startsWith(dateStr));
  }
  const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
  return request(`/meals${query}`);
}

export async function createMeal(mealData) {
  const payload = {
    meal_type: mealData.meal_type,
    food_name: mealData.food_name,
    calories: Number(mealData.calories),
    protein: Number(mealData.protein),
    carbs: Number(mealData.carbs),
    fat: Number(mealData.fat),
  };

  if (demoMode) {
    const newMeal = {
      id: Date.now(),
      user_id: 1,
      ...payload,
      logged_at: new Date().toISOString(),
    };
    mockMeals = [newMeal, ...mockMeals];
    return newMeal;
  }

  return request('/meals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteMeal(mealId) {
  if (demoMode) {
    mockMeals = mockMeals.filter((m) => m.id !== mealId);
    return null;
  }
  return request(`/meals/${mealId}`, {
    method: 'DELETE',
  });
}

// ==========================================
// 4. RESUMEN NUTRICIONAL DIARIO (/summary)
// ==========================================

export async function getDailySummary(dateStr = todayStr()) {
  if (demoMode) {
    const dayMeals = mockMeals.filter((m) => m.logged_at.startsWith(dateStr));
    const consumed_calories = dayMeals.reduce((acc, m) => acc + m.calories, 0);
    const consumed_protein = dayMeals.reduce((acc, m) => acc + m.protein, 0);
    const consumed_carbs = dayMeals.reduce((acc, m) => acc + m.carbs, 0);
    const consumed_fat = dayMeals.reduce((acc, m) => acc + m.fat, 0);
    return {
      target_calories: mockProfile.target_calories,
      consumed_calories,
      target_protein: mockProfile.target_protein,
      consumed_protein,
      target_carbs: mockProfile.target_carbs,
      consumed_carbs,
      target_fat: mockProfile.target_fat,
      consumed_fat,
      remaining_calories: mockProfile.target_calories - consumed_calories,
    };
  }

  const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
  return request(`/summary${query}`);
}

// ==========================================
// 5. HISTORIAL DE PESO (/weight-logs)
// ==========================================

export async function getWeightLogs() {
  if (demoMode) {
    return [...mockWeightLogs].sort(
      (a, b) => new Date(b.logged_at) - new Date(a.logged_at)
    );
  }
  return request('/weight-logs');
}

export async function createWeightLog(weightValue) {
  const payload = { weight: Number(weightValue) };

  if (demoMode) {
    const newEntry = {
      id: Date.now(),
      user_id: 1,
      weight: payload.weight,
      logged_at: new Date().toISOString(),
    };
    mockWeightLogs = [newEntry, ...mockWeightLogs];
    mockProfile.weight = payload.weight;
    return newEntry;
  }

  return request('/weight-logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteWeightLog(weightId) {
  if (demoMode) {
    mockWeightLogs = mockWeightLogs.filter((w) => w.id !== weightId);
    return null;
  }
  return request(`/weight-logs/${weightId}`, {
    method: 'DELETE',
  });
}
