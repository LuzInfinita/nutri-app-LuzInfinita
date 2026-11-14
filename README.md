# 🥗 Nutri-App Mobile (mHealth & Asistente Nutricional)

Aplicación móvil multiplataforma enfocada en **mHealth (salud móvil)** que calcula automáticamente los requerimientos de **macronutrientes y calorías** adecuados para cada usuario, ofreciendo planes alimenticios estructurados por tiempos de comida, conteo calórico diario interactivo, seguimiento histórico de peso corporal y un **Agente Asesor Nutricional con Inteligencia Artificial (IA / MCP)**.

---

## 🎯 Objetivo del Proyecto

El crecimiento exponencial en el uso de teléfonos inteligentes ha impulsado las aplicaciones de **mHealth** para gestionar la salud de forma práctica. **Nutri-App** permite un cálculo rápido, científico y accesible de los valores nutricionales diarios del usuario, conectando sus métricas corporales y evolución de peso con planes alimenticios personalizados.

---

## ✨ Características Principales (Features)

1. **📊 Registro y Conteo Calórico Diario (`DashboardScreen`)**
   - Panel interactivo con anillo de balance calórico (`Calorías Consumidas`, `Meta Diaria` y `Calorías Restantes`).
   - Barras de progreso en tiempo real para **Proteínas (g)**, **Carbohidratos (g)** y **Grasas (g)**.
   - Registro y eliminación de alimentos organizados por tiempos de comida (**Desayuno, Comida, Cena y Colación**) con selector de fecha y catálogo de alimentos frecuentes.

2. **🥗 Módulo de Consulta de Dietas (`DietPlansScreen`)**
   - Visualización detallada de planes alimenticios diarios y semanales organizados por tiempos de comida según el objetivo del usuario (**Recomposición Corporal**, **Pérdida de Grasa** o **Ganancia Muscular**).
   - Botón de acción rápida **"+ Registrar hoy"** en cada platillo para enviarlo directamente al conteo calórico diario.

3. **⚖️ Seguimiento Histórico de Peso (`WeightScreen`)**
   - Registro periódico del peso corporal en kilogramos con marcas de tiempo automáticas.
   - Gráfica visual de evolución temporal e indicadores de peso inicial, peso actual y diferencia acumulada.

4. **🤖 Asistente Nutricional Inteligente (IA / Agentes / MCP)**
   - Agente asesor integrado en la vista de dietas para resolver dudas nutricionales en tiempo real, sugerir **sustituciones equivalentes de alimentos** y recomendar ajustes en las porciones de macronutrientes según la evolución semanal del peso.

5. **🎯 Calculadora de Perfil y Macronutrientes (`ProfileScreen`)**
   - Configuración de métricas físicas (`weight`, `height`, `goal`) con cálculo automático de calorías y macronutrientes basado en la fórmula **Mifflin-St Jeor**, permitiendo también ajustes manuales.

---

## 🏗️ Arquitectura del Sistema

```
nutri-app/
├── app/                                # Frontend Móvil (React Native / Expo SDK 57)
│   ├── App.js                          # Navegación principal, sesión y layout seguro Android/Web
│   ├── app.json                        # Configuración de Expo / Android APK & AAB
│   └── src/
│       ├── services/
│       │   └── api.js                  # Cliente HTTP REST + JWT Bearer + Modo Demo offline
│       ├── screens/
│       │   ├── AuthScreen.js           # Login, Registro y configuración de IP del Backend
│       │   ├── DashboardScreen.js      # Resumen calórico diario (/summary) y comidas (/meals)
│       │   ├── DietPlansScreen.js      # Planes alimenticios por objetivo y Asistente IA
│       │   ├── WeightScreen.js         # Gráfica y bitácora de evolución de peso (/weight-logs)
│       │   └── ProfileScreen.js        # Perfil físico y calculadora de macros (/profile)
│       └── utils/
│           └── nutritionCalculator.js  # Fórmulas nutricionales y catálogos de dietas
├── backend/                            # Backend API RESTful (Python + FastAPI + SQLAlchemy)
│   ├── main.py                         # Endpoints REST protegidos con JWT y bcrypt
│   ├── models.py                       # Modelos ORM SQLite (User, UserProfile, MealLog, WeightLog)
│   ├── schemas.py                      # Esquemas de validación Pydantic
│   └── database.py                     # Configuración de conexión a SQLite (nutri_app.db)
└── docs/                               # Documentación y especificaciones del proyecto
```

### Tecnologías Utilizadas
- **Frontend (Cliente Móvil):** React Native (`0.86.3`) + Expo (`~57.0.30`), optimizado para Android y Web.
- **Backend (Servidor y Lógica de Negocio):** Python 3 + FastAPI + SQLAlchemy + Autenticación JWT (`python-jose`, `bcrypt`).
- **Base de Datos:** SQLite (`nutri_app.db`) para almacenamiento estructurado de usuarios, perfiles, comidas y pesajes.
- **Capa de IA / Agentes:** Asistente nutricional contextual para equivalencias de alimentos y ajuste dinámico de macros.

---

## 🔌 Compatibilidad de Endpoints (Frontend ↔ Backend)

El cliente [`app/src/services/api.js`](app/src/services/api.js) está 100% alineado con los esquemas Pydantic definidos en [`backend/schemas.py`](backend/schemas.py) y las rutas de [`backend/main.py`](backend/main.py):

| Método | Ruta Backend | Esquema / Payload | Pantalla Frontend |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | `UserCreate` (`username`, `email`, `password`) | `AuthScreen.js` |
| `POST` | `/login` | `LoginRequest` (`username`, `password`) → `TokenResponse` (JWT) | `AuthScreen.js` |
| `POST` | `/profile` | `UserProfileCreate` (`weight`, `height`, `goal`, `target_*`) | `ProfileScreen.js` |
| `GET` | `/summary?date=YYYY-MM-DD` | `DailySummaryResponse` (calorías y macros consumidos vs. meta) | `DashboardScreen.js` |
| `GET` | `/meals?date=YYYY-MM-DD` | `list[MealLogResponse]` | `DashboardScreen.js` |
| `POST` | `/meals` | `MealLogCreate` (`meal_type`, `food_name`, `calories`, `protein`, `carbs`, `fat`) | `DashboardScreen.js` / `DietPlansScreen.js` |
| `DELETE` | `/meals/{meal_id}` | `204 No Content` | `DashboardScreen.js` |
| `GET` | `/weight-logs` | `list[WeightLogResponse]` | `WeightScreen.js` |
| `POST` | `/weight-logs` | `WeightLogCreate` (`weight`) | `WeightScreen.js` |
| `DELETE` | `/weight-logs/{weight_id}` | `204 No Content` | `WeightScreen.js` |

> 💡 **Modo Demo Interactivo Incluido:** Si el servidor backend aún no está en ejecución, la pantalla de inicio de sesión incluye el botón **"🚀 Entrar en Modo Demo Interactivo"**, que simula en memoria todos los endpoints del backend para poder probar y navegar por todas las pantallas de la interfaz inmediatamente.

---

## 🚀 Instalación y Ejecución

### 1. Ejecutar el Frontend Móvil (Expo / React Native)

```bash
cd app
npm install
npx expo start
```

- Presiona **`a`** para abrir en Emulador Android.
- Presiona **`w`** para abrir en el navegador Web.
- Escanea el código QR con **Expo Go** en tu dispositivo físico Android.
  - *Nota:* Desde la pantalla de Login puedes pulsar en **⚙️ Configurar URL del Backend** para colocar la dirección IP local de la computadora que ejecute FastAPI (por ejemplo `http://192.168.1.50:8000`).

### 2. Ejecutar el Backend (FastAPI)

```bash
cd backend
pip install fastapi uvicorn sqlalchemy pydantic[email] python-jose[cryptography] bcrypt python-dotenv
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Documentación interactiva Swagger UI disponible en: `http://localhost:8000/docs`

---

## 📚 Referencias

- [Apps y nutrición: ¿Qué tenemos para nuestros pacientes? - Revista Diabetes](https://www.revistadiabetes.org/tecnologia/apps-y-nutricion-que-tenemos-para-nuestros-pacientes/)
- [Nutrition Apps - Healthify NZ](https://healthify.nz/apps/n/nutrition-apps)
