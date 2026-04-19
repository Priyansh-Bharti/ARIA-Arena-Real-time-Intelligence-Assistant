/**
 * ARIA — Internationalization Module
 * Manages runtime locale switching and string translations.
 * Supports: English (en), Hindi (hi), Spanish (es), French (fr), Arabic (ar), Chinese (zh).
 * @module i18n
 */

export const i18n = {
  /**
   * Retrieves current language from <html> lang attribute.
   * @returns {string} locale code
   */
  get currentLang() { return document.documentElement.lang || 'en'; },

  /**
   * Updates page language and text direction attributes.
   * @param {string} lang - locale code (e.g., 'hi')
   */
  set currentLang(lang) {
    document.documentElement.lang = lang;
    // Support for RTL languages (planned for V2 expansion)
    document.documentElement.dir = (lang === 'ar' || lang === 'ur') ? 'rtl' : 'ltr';
  },

  /* ── Translation Registry ──────────────────────────────────────── */

  translations: {
    en: {
      welcome_title: "Welcome to the Arena",
      welcome_subtitle: "Register your location for personalized intelligence.",
      section: "SECTION", row: "ROW", seat: "SEAT",
      enter_arena: "ENTER ARENA",
      aria_welcome_text: "Welcome! How can I assist you today?",
      assistant_title: "SEC", location_label: "YOUR LOCATION",
      pro_tip_label: "PRO TIP", aria_intelligence: "ARIA INTELLIGENCE",
      view_map: "VIEW FULL MAP", view_route: "VIEW ROUTE ON MAP",
      dismiss: "DISMISS", back: "BACK",
      food_drinks: "Food & Drinks", restrooms: "Restrooms",
      exit_route: "Exit Route", emergency: "Emergency",
      wayfinding: "WAYFINDING",
      offline_title: "Are you still in the stands?",
      offline_body: "We've lost connection to the arena's intelligence feed.",
      retry: "RETRY CONNECTION"
    },
    hi: {
      welcome_title: "अखाड़े में आपका स्वागत है",
      welcome_subtitle: "व्यक्तिगत बुद्धिमत्ता के लिए अपना स्थान पंजीकृत करें।",
      section: "अनुभाग", row: "पंक्ति", seat: "सीट",
      enter_arena: "अखाड़े में प्रवेश करें",
      aria_welcome_text: "स्वागत है! मैं आज आपकी किस प्रकार सहायता कर सकता हूँ?",
      assistant_title: "अनुभाग", location_label: "आपका स्थान",
      pro_tip_label: "प्रो टिप", aria_intelligence: "आरिया इंटेलिजेंस",
      view_map: "पूरा नक्शा देखें", view_route: "नक्शे पर मार्ग देखें",
      dismiss: "खारिज करें", back: "पीछे",
      food_drinks: "खाना और पीना", restrooms: "शौचालय",
      exit_route: "निकास मार्ग", emergency: "आपातकालीन",
      wayfinding: "मार्ग खोजना",
      offline_title: "क्या आप अभी भी स्टैंड में हैं?",
      offline_body: "हमने अखाड़े की इंटेलिजेंस फीड से कनेक्शन खो दिया है।",
      retry: "कनेक्शन पुनः प्रयास करें"
    },
    es: {
      welcome_title: "Bienvenido a la Arena",
      welcome_subtitle: "Registra tu ubicación para inteligencia personalizada.",
      section: "SECCIÓN", row: "FILA", seat: "ASIENTO",
      enter_arena: "ENTRAR A LA ARENA",
      aria_welcome_text: "¡Bienvenido! ¿Cómo puedo ayudarte hoy?",
      assistant_title: "SEC", location_label: "TU UBICACIÓN",
      pro_tip_label: "CONSEJO PRO", aria_intelligence: "INTELIGENCIA ARIA",
      view_map: "VER MAPA COMPLETO", view_route: "VER RUTA EN MAPA",
      dismiss: "DESCARTAR", back: "VOLVER",
      food_drinks: "Comida y Bebida", restrooms: "Baños",
      exit_route: "Ruta de Salida", emergency: "Emergencia",
      wayfinding: "SEÑALIZACIÓN",
      offline_title: "¿Sigues en las gradas?",
      offline_body: "Hemos perdido la conexión con el canal de inteligencia.",
      retry: "REINTENTAR CONEXIÓN"
    },
    fr: {
      welcome_title: "Bienvenue à l'Aréna",
      welcome_subtitle: "Enregistrez votre position pour une intelligence personnalisée.",
      section: "SECTION", row: "RANGÉE", seat: "SIÈGE",
      enter_arena: "ENTRER DANS L'ARÉNA",
      aria_welcome_text: "Bienvenue ! Comment puis-je vous aider aujourd'hui ?",
      assistant_title: "SEC", location_label: "VOTRE POSITION",
      pro_tip_label: "CONSEIL PRO", aria_intelligence: "INTELLIGENCE ARIA",
      view_map: "VOIR LA CARTE COMPLÈTE", view_route: "VOIR L'ITINÉRAIRE",
      dismiss: "IGNORER", back: "RETOUR",
      food_drinks: "Nourriture & Boissons", restrooms: "Toilettes",
      exit_route: "Itinéraire de Sortie", emergency: "Urgence",
      wayfinding: "ORIENTATION",
      offline_title: "Êtes-vous toujours dans les gradins ?",
      offline_body: "Nous avons perdu la connexion avec le flux d'intelligence.",
      retry: "RÉESSAYER LA CONNEXION"
    },
    ar: {
      welcome_title: "مرحباً بك في الساحة",
      welcome_subtitle: "سجّل موقعك للحصول على معلومات شخصية.",
      section: "القسم", row: "الصف", seat: "المقعد",
      enter_arena: "ادخل الساحة",
      aria_welcome_text: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
      assistant_title: "قسم", location_label: "موقعك",
      pro_tip_label: "نصيحة احترافية", aria_intelligence: "ذكاء ARIA",
      view_map: "عرض الخريطة الكاملة", view_route: "عرض المسار على الخريطة",
      dismiss: "تجاهل", back: "رجوع",
      food_drinks: "طعام وشراب", restrooms: "دورات المياه",
      exit_route: "مسار الخروج", emergency: "طوارئ",
      wayfinding: "الإرشاد",
      offline_title: "هل لا تزال في المدرجات؟",
      offline_body: "فقدنا الاتصال بتغذية الذكاء الاصطناعي.",
      retry: "إعادة الاتصال"
    },
    zh: {
      welcome_title: "欢迎来到球场",
      welcome_subtitle: "注册您的位置以获取个性化信息。",
      section: "区域", row: "排", seat: "座位",
      enter_arena: "进入球场",
      aria_welcome_text: "欢迎！我今天能帮您什么？",
      assistant_title: "区", location_label: "您的位置",
      pro_tip_label: "专业提示", aria_intelligence: "ARIA 智能",
      view_map: "查看完整地图", view_route: "在地图上查看路线",
      dismiss: "忽略", back: "返回",
      food_drinks: "餐饮", restrooms: "洗手间",
      exit_route: "出口路线", emergency: "紧急情况",
      wayfinding: "导航",
      offline_title: "您还在看台上吗？",
      offline_body: "我们已断开与球场智能系统的连接。",
      retry: "重新连接"
    }
  },

  /**
   * Translates a key based on the current system language.
   * @param {string} key - Dictionary key
   * @returns {string} Translated value or key if not found
   */
  t(key) { return this.translations[this.currentLang]?.[key] || key; }
};
