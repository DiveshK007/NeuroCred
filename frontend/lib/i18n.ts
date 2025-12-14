/**
 * Internationalization configuration
 * Using a simple i18n solution for now (can be upgraded to next-intl later)
 */

export type Locale = 'en' | 'es' | 'fr' | 'zh';

export const defaultLocale: Locale = 'en';
export const supportedLocales: Locale[] = ['en', 'es', 'fr', 'zh'];

export interface Translations {
  [key: string]: string | Translations;
}

// Translation keys
export const translations: Record<Locale, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
    },
    wallet: {
      connect: 'Connect Wallet',
      disconnect: 'Disconnect',
      connected: 'Connected',
      notConnected: 'Not Connected',
    },
    score: {
      generate: 'Generate Credit Score',
      generating: 'Generating Score...',
      score: 'Credit Score',
      riskBand: 'Risk Band',
      explanation: 'Explanation',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome to NeuroCred',
    },
  },
  es: {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
    },
    wallet: {
      connect: 'Conectar Billetera',
      disconnect: 'Desconectar',
      connected: 'Conectado',
      notConnected: 'No Conectado',
    },
    score: {
      generate: 'Generar Puntuación de Crédito',
      generating: 'Generando Puntuación...',
      score: 'Puntuación de Crédito',
      riskBand: 'Banda de Riesgo',
      explanation: 'Explicación',
    },
    dashboard: {
      title: 'Panel de Control',
      welcome: 'Bienvenido a NeuroCred',
    },
  },
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      retry: 'Réessayer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
    },
    wallet: {
      connect: 'Connecter le Portefeuille',
      disconnect: 'Déconnecter',
      connected: 'Connecté',
      notConnected: 'Non Connecté',
    },
    score: {
      generate: 'Générer le Score de Crédit',
      generating: 'Génération du Score...',
      score: 'Score de Crédit',
      riskBand: 'Bande de Risque',
      explanation: 'Explication',
    },
    dashboard: {
      title: 'Tableau de Bord',
      welcome: 'Bienvenue sur NeuroCred',
    },
  },
  zh: {
    common: {
      loading: '加载中...',
      error: '错误',
      retry: '重试',
      cancel: '取消',
      confirm: '确认',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      close: '关闭',
    },
    wallet: {
      connect: '连接钱包',
      disconnect: '断开连接',
      connected: '已连接',
      notConnected: '未连接',
    },
    score: {
      generate: '生成信用评分',
      generating: '正在生成评分...',
      score: '信用评分',
      riskBand: '风险等级',
      explanation: '说明',
    },
    dashboard: {
      title: '仪表板',
      welcome: '欢迎使用 NeuroCred',
    },
  },
};

/**
 * Get translation for a key
 */
export function t(key: string, locale: Locale = defaultLocale): string {
  const keys = key.split('.');
  let value: any = translations[locale];
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to English
      value = translations[defaultLocale];
      for (const k2 of keys) {
        value = value?.[k2];
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Get current locale from localStorage or browser
 */
export function getLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }
  
  const stored = localStorage.getItem('locale') as Locale;
  if (stored && supportedLocales.includes(stored)) {
    return stored;
  }
  
  // Try to detect from browser
  const browserLang = navigator.language.split('-')[0];
  if (supportedLocales.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }
  
  return defaultLocale;
}

/**
 * Set locale
 */
export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  if (supportedLocales.includes(locale)) {
    localStorage.setItem('locale', locale);
    window.dispatchEvent(new Event('localechange'));
  }
}

