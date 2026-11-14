import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  loginUser,
  registerUser,
  getApiBaseUrl,
  setApiBaseUrl,
  setDemoMode,
} from '../services/api';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [showServerConfig, setShowServerConfig] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    if (mode === 'register' && !email.trim()) {
      setErrorMsg('El correo electrónico es obligatorio para registrarte.');
      return;
    }

    setApiBaseUrl(serverUrl);
    setDemoMode(false);
    setLoading(true);

    try {
      if (mode === 'register') {
        await registerUser({
          username: username.trim(),
          email: email.trim(),
          password,
        });
        setSuccessMsg(
          '¡Usuario registrado con éxito! Iniciando sesión automáticamente...'
        );
      }

      const tokenData = await loginUser({
        username: username.trim(),
        password,
      });

      onAuthenticated({
        username: username.trim(),
        user_id: tokenData.user_id,
        token: tokenData.access_token,
        isDemo: false,
      });
    } catch (err) {
      setErrorMsg(
        err.message ||
          'No se pudo conectar con el servidor. Puedes usar el Modo Demo interactivo mientras el backend está offline.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDemo = async () => {
    setErrorMsg('');
    setDemoMode(true);
    const demoUser = username.trim() || 'demo_nutri';
    const tokenData = await loginUser({
      username: demoUser,
      password: 'demo_password',
    });
    onAuthenticated({
      username: demoUser,
      user_id: tokenData.user_id,
      token: tokenData.access_token,
      isDemo: true,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Encabezado de Marca */}
        <View style={styles.heroCard}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🥗</Text>
          </View>
          <Text style={styles.brandTitle}>Nutri-App Mobile</Text>
          <Text style={styles.brandSubtitle}>
            Cálculo inteligente de macronutrientes, planes alimenticios,
            monitoreo de peso y asistente nutricional con IA.
          </Text>
        </View>

        {/* Tarjeta Principal de Login / Registro */}
        <View style={styles.formCard}>
          <View style={styles.tabSwitch}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                mode === 'login' && styles.tabButtonActive,
              ]}
              onPress={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  mode === 'login' && styles.tabButtonTextActive,
                ]}
              >
                Iniciar Sesión
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                mode === 'register' && styles.tabButtonActive,
              ]}
              onPress={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  mode === 'register' && styles.tabButtonTextActive,
                ]}
              >
                Crear Cuenta
              </Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>✅ {successMsg}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nombre de usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. carlos_fit"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          {mode === 'register' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="usuario@correo.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'login'
                  ? 'Conectar con Backend FastAPI'
                  : 'Registrar en Backend FastAPI'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o explora sin servidor</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleEnterDemo}
          >
            <Text style={styles.demoButtonTitle}>
              🚀 Entrar en Modo Demo Interactivo
            </Text>
            <Text style={styles.demoButtonSub}>
              Simula todos los endpoints del backend (/summary, /meals,
              /profile, /weight-logs) localmente
            </Text>
          </TouchableOpacity>

          {/* Configuración de URL de Backend */}
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <Text style={styles.configToggleText}>
              ⚙️ {showServerConfig ? 'Ocultar' : 'Configurar'} URL del Backend (
              {serverUrl})
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.serverConfigBox}>
              <Text style={styles.serverConfigHelp}>
                Si ejecutas FastAPI en tu PC y pruebas en un teléfono Android
                físico, escribe la IP local de tu PC (ej.
                http://192.168.1.50:8000).
              </Text>
              <TextInput
                style={styles.input}
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                placeholder="http://10.0.2.2:8000"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0D9488',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  logoEmoji: {
    fontSize: 34,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 340,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
  },
  successBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  successBannerText: {
    color: '#15803D',
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#5EEAD4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  demoButtonTitle: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '700',
  },
  demoButtonSub: {
    color: '#115E59',
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 3,
  },
  configToggle: {
    marginTop: 16,
    alignItems: 'center',
  },
  configToggleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  serverConfigBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  serverConfigHelp: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 16,
  },
});
