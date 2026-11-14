import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';

import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DietPlansScreen from './src/screens/DietPlansScreen';
import WeightScreen from './src/screens/WeightScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import {
  fetchUserProfile,
  setAuthToken,
  isDemoMode,
} from './src/services/api';

const NAV_TABS = [
  { key: 'dashboard', label: 'Resumen', icon: '📊' },
  { key: 'diets', label: 'Dietas & IA', icon: '🥗' },
  { key: 'weight', label: 'Peso', icon: '⚖️' },
  { key: 'profile', label: 'Macros', icon: '🎯' },
];

export default function App() {
  const [userSession, setUserSession] = useState(null);
  const [profile, setProfile] = useState({
    weight: 78.5,
    height: 175,
    goal: 'recomposition',
    target_calories: 2250,
    target_protein: 165,
    target_carbs: 225,
    target_fat: 75,
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!userSession) return;
    fetchUserProfile()
      .then((remoteProfile) => {
        if (remoteProfile) {
          setProfile((prev) => ({ ...prev, ...remoteProfile }));
        } else {
          // Si el usuario es nuevo en el backend y no tiene perfil, llevarlo a configurar sus macros
          setActiveTab('profile');
        }
      })
      .catch(() => {
        // Conservar valores por defecto si aún no responde
      });
  }, [userSession]);

  const handleLogout = () => {
    setAuthToken(null);
    setUserSession(null);
    setActiveTab('dashboard');
  };

  if (!userSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AuthScreen
          onAuthenticated={(session) => {
            setUserSession(session);
            setActiveTab('dashboard');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Barra Superior de la Aplicación */}
      <View style={styles.topHeader}>
        <View style={styles.headerBrandRow}>
          <View style={styles.brandIconSmall}>
            <Text style={{ fontSize: 16 }}>🥗</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Nutri-App</Text>
            <Text style={styles.headerSubtitle}>
              Hola, {userSession.username}{' '}
              {isDemoMode() ? '(Modo Demo)' : '(API Conectada)'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileQuickPill}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={styles.profileQuickText}>
            🔥 {profile.target_calories} kcal
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido Dinámico de la Pestaña Activa */}
      <View style={styles.mainContent}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            profile={profile}
            onGoToProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'diets' && (
          <DietPlansScreen
            profile={profile}
            onMealLogged={() => {
              // Permite que el usuario sepa que su comida ya fue enviada al conteo diario
            }}
          />
        )}

        {activeTab === 'weight' && (
          <WeightScreen
            profile={profile}
            onWeightUpdated={(newW) =>
              setProfile((prev) => ({ ...prev, weight: newW }))
            }
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            user={userSession}
            profile={profile}
            onProfileSaved={(updatedProfile) => {
              setProfile((prev) => ({ ...prev, ...updatedProfile }));
            }}
            onLogout={handleLogout}
          />
        )}
      </View>

      {/* Barra de Navegación Inferior (Bottom Tab Bar) */}
      <View style={styles.bottomTabBar}>
        {NAV_TABS.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                isSelected && styles.tabItemSelected,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  isSelected && styles.tabLabelSelected,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 28 : 0,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
  },
  profileQuickPill: {
    backgroundColor: '#F0FDFA',
    borderColor: '#5EEAD4',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileQuickText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabItemSelected: {
    backgroundColor: '#F0FDFA',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelSelected: {
    color: '#0D9488',
    fontWeight: '800',
  },
});
