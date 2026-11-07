import { FontAwesome6 } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as BarraNativa,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PanelInvitado from './Invitado';
const idiomas = [
  { codigo: 'es', nombre: 'Español', detalle: 'Spanish', bandera: '🇨🇴' },
  { codigo: 'en', nombre: 'English', detalle: 'Inglés', bandera: '🇬🇧' },
  { codigo: 'fr', nombre: 'Français', detalle: 'Francés', bandera: '🇫🇷' },
  { codigo: 'pt', nombre: 'Português', detalle: 'Portugués', bandera: '🇧🇷' },
  { codigo: 'ar', nombre: 'العربية', detalle: 'Árabe', bandera: '🇸🇦' },
];

type Pantalla = 'inicio' | 'idioma' | 'propiedades';

const textos = {
  es: {
    slogan: 'El paso hacia un nuevo hogar.',
    headline: 'Más que propiedades,',
    headline2: 'nuevos comienzos.',
    intro: 'Casas, apartamentos y fincas seleccionadas en toda Colombia, de Bogotá a Cartagena.',
    continueExplore: 'Continuar explorando',
    chooseLanguage: 'Elige tu idioma',
    chooseLanguageSub: 'Choose your language',
    continue: 'Continuar',
    welcome: 'Bienvenido a UMBRAL',
    chooseProfile: 'Elige cómo deseas continuar.',
    guest: 'Explorar propiedades',
    guestDesc: 'Conoce casas, apartamentos, apartaestudios y propiedades en venta o arriendo. No necesitas una cuenta.',
    guestAction: 'Continuar como invitado',
    staff: 'Acceso al personal',
    staffDesc: 'Para personal de la inmobiliaria y vendedores autorizados que ya tienen una cuenta.',
    haveAccount: 'Ya tengo una cuenta',
    note: 'Encuentra el lugar donde comienza tu próxima historia.',
    login: 'Iniciar sesión',
    loginSub: 'Nos alegra tenerte de vuelta.',
    email: 'Correo electrónico',
    emailPlaceholder: 'ejemplo@correo.com',
    password: 'Contraseña',
    passwordPlaceholder: 'Escribe tu contraseña',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    enter: 'Ingresar',
    noAccount: '¿No tienes cuenta?',
    createAccount: 'Crear cuenta',
    registerTitle: 'Crear una cuenta',
    registerSub: 'Completa tus datos para preparar tu registro.',
    accountType: 'Tipo de cuenta',
    person: 'Persona',
    agency: 'Inmobiliaria',
    fullName: 'Nombre completo',
    agencyName: 'Nombre de la inmobiliaria',
    namePlaceholder: 'Escribe tu nombre',
    legalRep: 'Representante legal',
    legalRepPlaceholder: 'Nombre del representante',
    phone: 'Número de teléfono',
    phonePlaceholder: '3001234567',
    documentType: 'Tipo de documento',
    documentNumber: 'Número de documento',
    documentPlaceholder: 'Escribe el número',
    confirmPassword: 'Confirmar contraseña',
    confirmPlaceholder: 'Escribe de nuevo la contraseña',
    minPassword: 'Mínimo 8 caracteres',
    prepareRegister: 'Preparar registro',
    alreadyAccount: '¿Ya tienes cuenta?',
    fillFields: 'Campos pendientes',
    fillRequired: 'Completa los campos obligatorios.',
    invalidEmail: 'Correo inválido',
    invalidEmailDesc: 'Escribe un correo electrónico válido.',
    shortPassword: 'Contraseña corta',
    shortPasswordDesc: 'La contraseña debe tener al menos 8 caracteres.',
    differentPasswords: 'Contraseñas diferentes',
    differentPasswordsDesc: 'Las contraseñas no coinciden.',
    missingRep: 'Campo pendiente',
    missingRepDesc: 'Escribe el nombre del representante legal.',
    formComplete: 'Formulario completado',
    demoRegister: 'Los campos están completos. Este registro es solo una demostración: todavía no se ha creado una cuenta.',
    goLogin: 'Ir al inicio de sesión',
    stayHere: 'Seguir aquí',
    demoTitle: 'UMBRAL',
    demoLogin: 'Esta pantalla es una demostración visual. El inicio de sesión todavía no está conectado al servidor.',
    guestTitle: 'Explora UMBRAL',
    guestSub: 'Encuentra un lugar para tu próxima historia.',
    guestSearch: 'Buscar propiedades',
    guestMap: 'Ver ubicaciones',
    guestDemo: 'La exploración de propiedades se conectará más adelante. Por ahora esta es una vista de demostración.',
    guestWelcomeTitle: 'Vive tu experiencia como invitado',
    guestWelcomeSub: 'Explora y visualiza casas, apartamentos y propiedades en venta o arriendo, sin necesidad de una cuenta. Tu próxima historia empieza aquí.',
    back: 'Volver',
  },
  en: {
    slogan: 'The step toward a new home.',
    headline: 'More than properties,',
    headline2: 'new beginnings.',
    intro: 'Selected houses, apartments and country homes across Colombia, from Bogotá to Cartagena.',
    continueExplore: 'Continue exploring',
    chooseLanguage: 'Choose your language',
    chooseLanguageSub: 'Choose your language',
    continue: 'Continue',
    welcome: 'Welcome to UMBRAL',
    chooseProfile: 'Choose how you would like to continue.',
    guest: 'Explore properties',
    guestDesc: 'Discover houses, apartments, studios and properties for sale or rent. No account needed.',
    guestAction: 'Continue as guest',
    staff: 'Staff access',
    staffDesc: 'For real estate staff and authorized sellers who already have an account.',
    haveAccount: 'I already have an account',
    note: 'Find the place where your next story begins.',
    login: 'Sign in',
    loginSub: 'It is good to have you back.',
    email: 'Email address',
    emailPlaceholder: 'example@email.com',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    enter: 'Sign in',
    noAccount: "Don't have an account?",
    createAccount: 'Create account',
    registerTitle: 'Create an account',
    registerSub: 'Fill in your details to prepare your registration.',
    accountType: 'Account type',
    person: 'Individual',
    agency: 'Real estate agency',
    fullName: 'Full name',
    agencyName: 'Agency name',
    namePlaceholder: 'Enter your name',
    legalRep: 'Legal representative',
    legalRepPlaceholder: 'Representative name',
    phone: 'Phone number',
    phonePlaceholder: '3001234567',
    documentType: 'Document type',
    documentNumber: 'Document number',
    documentPlaceholder: 'Enter the number',
    confirmPassword: 'Confirm password',
    confirmPlaceholder: 'Enter your password again',
    minPassword: 'At least 8 characters',
    prepareRegister: 'Prepare registration',
    alreadyAccount: 'Already have an account?',
    fillFields: 'Missing fields',
    fillRequired: 'Complete all required fields.',
    invalidEmail: 'Invalid email',
    invalidEmailDesc: 'Enter a valid email address.',
    shortPassword: 'Password too short',
    shortPasswordDesc: 'Password must contain at least 8 characters.',
    differentPasswords: 'Passwords do not match',
    differentPasswordsDesc: 'The passwords do not match.',
    missingRep: 'Missing field',
    missingRepDesc: 'Enter the legal representative name.',
    formComplete: 'Form completed',
    demoRegister: 'The fields are complete. This is only a demo; no account has been created.',
    goLogin: 'Go to sign in',
    stayHere: 'Stay here',
    demoTitle: 'UMBRAL',
    demoLogin: 'This is a visual demo. Sign-in is not connected to the server yet.',
    guestTitle: 'Explore UMBRAL',
    guestSub: 'Find a place for your next story.',
    guestSearch: 'Search properties',
    guestMap: 'View locations',
    guestDemo: 'Property browsing will be connected later. This is a demo screen for now.',
    guestWelcomeTitle: 'Live your experience as a guest',
    guestWelcomeSub: 'Explore and view houses, apartments and properties for sale or rent, no account needed. Your next story starts here.',
    back: 'Back',
  },
  fr: {
    slogan: 'Le chemin vers un nouveau chez-soi.',
    headline: 'Plus que des biens,',
    headline2: 'de nouveaux départs.',
    intro: 'Maisons, appartements et propriétés sélectionnés en Colombie, de Bogotá à Carthagène.',
    continueExplore: 'Continuer à explorer',
    chooseLanguage: 'Choisissez votre langue',
    chooseLanguageSub: 'Choose your language',
    continue: 'Continuer',
    welcome: 'Bienvenue chez UMBRAL',
    chooseProfile: 'Choisissez comment continuer.',
    guest: 'Explorer les propriétés',
    guestDesc: 'Découvrez des maisons, appartements et biens à vendre ou à louer. Aucun compte requis.',
    guestAction: 'Continuer comme invité',
    staff: 'Accès du personnel',
    staffDesc: 'Pour le personnel immobilier et les vendeurs autorisés disposant déjà d’un compte.',
    haveAccount: 'J’ai déjà un compte',
    note: 'Trouvez le lieu où commence votre prochaine histoire.',
    login: 'Se connecter',
    loginSub: 'Heureux de vous revoir.',
    email: 'Adresse e-mail',
    emailPlaceholder: 'exemple@courriel.com',
    password: 'Mot de passe',
    passwordPlaceholder: 'Saisissez votre mot de passe',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    enter: 'Se connecter',
    noAccount: 'Vous n’avez pas de compte ?',
    createAccount: 'Créer un compte',
    registerTitle: 'Créer un compte',
    registerSub: 'Remplissez vos informations pour préparer votre inscription.',
    accountType: 'Type de compte',
    person: 'Particulier',
    agency: 'Agence immobilière',
    fullName: 'Nom complet',
    agencyName: 'Nom de l’agence',
    namePlaceholder: 'Saisissez votre nom',
    legalRep: 'Représentant légal',
    legalRepPlaceholder: 'Nom du représentant',
    phone: 'Téléphone',
    phonePlaceholder: '3001234567',
    documentType: 'Type de document',
    documentNumber: 'Numéro du document',
    documentPlaceholder: 'Saisissez le numéro',
    confirmPassword: 'Confirmer le mot de passe',
    confirmPlaceholder: 'Saisissez à nouveau le mot de passe',
    minPassword: '8 caractères minimum',
    prepareRegister: 'Préparer l’inscription',
    alreadyAccount: 'Vous avez déjà un compte ?',
    fillFields: 'Champs manquants',
    fillRequired: 'Remplissez les champs obligatoires.',
    invalidEmail: 'E-mail invalide',
    invalidEmailDesc: 'Saisissez une adresse e-mail valide.',
    shortPassword: 'Mot de passe trop court',
    shortPasswordDesc: 'Le mot de passe doit contenir au moins 8 caractères.',
    differentPasswords: 'Mots de passe différents',
    differentPasswordsDesc: 'Les mots de passe ne correspondent pas.',
    missingRep: 'Champ manquant',
    missingRepDesc: 'Saisissez le nom du représentant légal.',
    formComplete: 'Formulaire terminé',
    demoRegister: 'Les champs sont remplis. Ceci est une démonstration ; aucun compte n’a été créé.',
    goLogin: 'Aller à la connexion',
    stayHere: 'Rester ici',
    demoTitle: 'UMBRAL',
    demoLogin: 'Ceci est une démonstration visuelle. La connexion n’est pas encore reliée au serveur.',
    guestTitle: 'Explorez UMBRAL',
    guestSub: 'Trouvez le lieu de votre prochaine histoire.',
    guestSearch: 'Rechercher des biens',
    guestMap: 'Voir les emplacements',
    guestDemo: 'La recherche de propriétés sera connectée plus tard. Voici une démonstration.',
    guestWelcomeTitle: 'Vivez votre expérience en invité',
    guestWelcomeSub: 'Explorez et visualisez maisons, appartements et biens à vendre ou à louer, sans compte. Votre prochaine histoire commence ici.',
    back: 'Retour',
  },
  pt: {
    slogan: 'O caminho para um novo lar.',
    headline: 'Mais que imóveis,',
    headline2: 'novos começos.',
    intro: 'Casas, apartamentos e sítios selecionados na Colômbia, de Bogotá a Cartagena.',
    continueExplore: 'Continuar explorando',
    chooseLanguage: 'Escolha seu idioma',
    chooseLanguageSub: 'Choose your language',
    continue: 'Continuar',
    welcome: 'Bem-vindo à UMBRAL',
    chooseProfile: 'Escolha como deseja continuar.',
    guest: 'Explorar imóveis',
    guestDesc: 'Conheça casas, apartamentos e imóveis à venda ou para alugar. Não precisa de conta.',
    guestAction: 'Continuar como visitante',
    staff: 'Acesso da equipe',
    staffDesc: 'Para funcionários imobiliários e vendedores autorizados que já possuem uma conta.',
    haveAccount: 'Já tenho uma conta',
    note: 'Encontre o lugar onde começa sua próxima história.',
    login: 'Entrar',
    loginSub: 'Que bom ter você de volta.',
    email: 'E-mail',
    emailPlaceholder: 'exemplo@email.com',
    password: 'Senha',
    passwordPlaceholder: 'Digite sua senha',
    showPassword: 'Mostrar senha',
    hidePassword: 'Ocultar senha',
    enter: 'Entrar',
    noAccount: 'Não tem uma conta?',
    createAccount: 'Criar conta',
    registerTitle: 'Criar uma conta',
    registerSub: 'Preencha seus dados para preparar seu cadastro.',
    accountType: 'Tipo de conta',
    person: 'Pessoa',
    agency: 'Imobiliária',
    fullName: 'Nome completo',
    agencyName: 'Nome da imobiliária',
    namePlaceholder: 'Digite seu nome',
    legalRep: 'Representante legal',
    legalRepPlaceholder: 'Nome do representante',
    phone: 'Telefone',
    phonePlaceholder: '3001234567',
    documentType: 'Tipo de documento',
    documentNumber: 'Número do documento',
    documentPlaceholder: 'Digite o número',
    confirmPassword: 'Confirmar senha',
    confirmPlaceholder: 'Digite a senha novamente',
    minPassword: 'Mínimo de 8 caracteres',
    prepareRegister: 'Preparar cadastro',
    alreadyAccount: 'Já tem uma conta?',
    fillFields: 'Campos pendentes',
    fillRequired: 'Preencha os campos obrigatórios.',
    invalidEmail: 'E-mail inválido',
    invalidEmailDesc: 'Digite um endereço de e-mail válido.',
    shortPassword: 'Senha muito curta',
    shortPasswordDesc: 'A senha deve ter pelo menos 8 caracteres.',
    differentPasswords: 'Senhas diferentes',
    differentPasswordsDesc: 'As senhas não coincidem.',
    missingRep: 'Campo pendente',
    missingRepDesc: 'Digite o nome do representante legal.',
    formComplete: 'Formulário concluído',
    demoRegister: 'Os campos estão preenchidos. Esta é apenas uma demonstração; nenhuma conta foi criada.',
    goLogin: 'Ir para entrar',
    stayHere: 'Continuar aqui',
    demoTitle: 'UMBRAL',
    demoLogin: 'Esta tela é uma demonstração visual. O login ainda não está conectado ao servidor.',
    guestTitle: 'Explore a UMBRAL',
    guestSub: 'Encontre o lugar da sua próxima história.',
    guestSearch: 'Buscar imóveis',
    guestMap: 'Ver localizações',
    guestDemo: 'A busca de imóveis será conectada mais tarde. Esta é uma tela de demonstração.',
    guestWelcomeTitle: 'Viva sua experiência como visitante',
    guestWelcomeSub: 'Explore e visualize casas, apartamentos e imóveis à venda ou para alugar, sem precisar de conta. Sua próxima história começa aqui.',
    back: 'Voltar',
  },
  ar: {
    slogan: 'الخطوة نحو منزل جديد.',
    headline: 'أكثر من مجرد عقارات،',
    headline2: 'بدايات جديدة.',
    intro: 'منازل وشقق وعقارات مختارة في كولومبيا، من بوغوتا إلى قرطاجنة.',
    continueExplore: 'متابعة الاستكشاف',
    chooseLanguage: 'اختر لغتك',
    chooseLanguageSub: 'اختر لغتك',
    continue: 'متابعة',
    welcome: 'مرحبًا بك في UMBRAL',
    chooseProfile: 'اختر كيف تريد المتابعة.',
    guest: 'استكشاف العقارات',
    guestDesc: 'اكتشف المنازل والشقق والعقارات للبيع أو للإيجار. لا تحتاج إلى حساب.',
    guestAction: 'المتابعة كزائر',
    staff: 'دخول الموظفين',
    staffDesc: 'لموظفي العقارات والبائعين المعتمدين الذين لديهم حساب بالفعل.',
    haveAccount: 'لدي حساب بالفعل',
    note: 'اعثر على المكان الذي تبدأ فيه قصتك القادمة.',
    login: 'تسجيل الدخول',
    loginSub: 'يسعدنا عودتك.',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'example@email.com',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    enter: 'دخول',
    noAccount: 'ليس لديك حساب؟',
    createAccount: 'إنشاء حساب',
    registerTitle: 'إنشاء حساب',
    registerSub: 'أدخل بياناتك لإعداد التسجيل.',
    accountType: 'نوع الحساب',
    person: 'فرد',
    agency: 'شركة عقارية',
    fullName: 'الاسم الكامل',
    agencyName: 'اسم الشركة العقارية',
    namePlaceholder: 'أدخل اسمك',
    legalRep: 'الممثل القانوني',
    legalRepPlaceholder: 'اسم الممثل',
    phone: 'رقم الهاتف',
    phonePlaceholder: '3001234567',
    documentType: 'نوع الوثيقة',
    documentNumber: 'رقم الوثيقة',
    documentPlaceholder: 'أدخل الرقم',
    confirmPassword: 'تأكيد كلمة المرور',
    confirmPlaceholder: 'أدخل كلمة المرور مرة أخرى',
    minPassword: '8 أحرف على الأقل',
    prepareRegister: 'إعداد التسجيل',
    alreadyAccount: 'لديك حساب بالفعل؟',
    fillFields: 'حقول ناقصة',
    fillRequired: 'أكمل الحقول المطلوبة.',
    invalidEmail: 'بريد إلكتروني غير صالح',
    invalidEmailDesc: 'أدخل عنوان بريد إلكتروني صالحًا.',
    shortPassword: 'كلمة المرور قصيرة',
    shortPasswordDesc: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.',
    differentPasswords: 'كلمتا المرور غير متطابقتين',
    differentPasswordsDesc: 'كلمتا المرور غير متطابقتين.',
    missingRep: 'حقل مطلوب',
    missingRepDesc: 'أدخل اسم الممثل القانوني.',
    formComplete: 'اكتمل النموذج',
    demoRegister: 'اكتملت الحقول. هذا عرض تجريبي فقط؛ لم يتم إنشاء حساب.',
    goLogin: 'الانتقال إلى تسجيل الدخول',
    stayHere: 'البقاء هنا',
    demoTitle: 'UMBRAL',
    demoLogin: 'هذه شاشة تجريبية. تسجيل الدخول غير متصل بالخادم بعد.',
    guestTitle: 'استكشف UMBRAL',
    guestSub: 'اعثر على مكان قصتك القادمة.',
    guestSearch: 'البحث عن العقارات',
    guestMap: 'عرض المواقع',
    guestDemo: 'سيتم ربط استكشاف العقارات لاحقًا. هذه شاشة تجريبية الآن.',
    guestWelcomeTitle: 'عِش تجربتك كزائر',
    guestWelcomeSub: 'استكشف وشاهد المنازل والشقق والعقارات للبيع أو للإيجار دون الحاجة إلى حساب. قصتك القادمة تبدأ هنا.',
    back: 'رجوع',
  },
};

export default function App() {
  const [modoOscuro, setModoOscuro] = useState(true);

  // Se cargan las fuentes de los íconos mientras la persona ve las pantallas de bienvenida.
  useEffect(() => { Font.loadAsync(FontAwesome6.font).catch(() => undefined); }, []);
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');

  // Transición suave al cambiar de pantalla (inicio, idioma y panel): aparece con un leve deslizamiento.
  // Corre en el hilo nativo, así que no frena la app.
  const aparecer = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    aparecer.setValue(0);
    Animated.timing(aparecer, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [pantalla, aparecer]);
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState('es');


  const t = textos[idiomaSeleccionado as keyof typeof textos];
  const esArabe = idiomaSeleccionado === 'ar';

  const colores = modoOscuro
    ? {
        fondo: '#140826',
        texto: '#F5F5F7',
        secundario: '#C9C3D8',
        boton: '#1B1B20',
        borde: '#E3C985',
        tarjeta: '#141418',
      }
    : {
        fondo: '#F8F7FF',
        texto: '#1B1035',
        secundario: '#6B5F8A',
        boton: '#FFFFFF',
        borde: '#C9B2FF',
        tarjeta: '#FFFFFF',
      };

  const alternarModo = () => setModoOscuro((actual) => !actual);

  const botonModo = (
    <Pressable
      onPress={alternarModo}
      style={styles.botonModo}
      accessibilityRole="button"
      accessibilityLabel={modoOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {modoOscuro ? (
        <Text style={styles.iconoModo}>☾</Text>
      ) : (
        <View style={styles.sol}>
          <View style={styles.solRayo} />
          <View style={[styles.solRayo, { transform: [{ rotate: '45deg' }] }]} />
          <View style={styles.solCirculo} />
        </View>
      )}
    </Pressable>
  );

  const botonPrincipal = (texto: string, accion: () => void) => (
    <Pressable style={styles.botonConfirmar} onPress={accion} accessibilityRole="button">
      <Text style={styles.textoConfirmar}>{texto}</Text>
    </Pressable>
  );

  const fondoColorido = (
    <View pointerEvents="none" style={styles.decoracionFondo}>
    </View>
  );

  const barraSuperior = Platform.OS === 'android' ? BarraNativa.currentHeight ?? 24 : 44;

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo, paddingTop: pantalla === 'propiedades' ? 0 : barraSuperior }]}>
      <StatusBar style={modoOscuro ? 'light' : 'dark'} />

      <Animated.View style={{ flex: 1, opacity: aparecer, transform: [{ translateY: aparecer.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
      {pantalla === 'inicio' ? (
        <ImageBackground
          source={modoOscuro ? require('./assets/residence-night.png') : require('./assets/residence-dusk.png')}
          style={styles.fondoImagen}
          imageStyle={styles.imagen}
          resizeMode="cover"
        >
          <View style={[styles.capa, { backgroundColor: modoOscuro ? 'rgba(9, 9, 11, 0.38)' : 'rgba(255, 255, 255, 0.10)' }]}>
            <View style={styles.encabezado}>
              <View>
                <View style={styles.marca}>
                  <Image source={require('./assets/icono.png')} style={styles.logoImagen} resizeMode="contain" />
                  <Text style={[styles.logo, { color: colores.texto }]}>UMBRAL</Text>
                </View>
                <Text style={[styles.eslogan, { color: colores.secundario }]}>{t.slogan}</Text>
              </View>
              {botonModo}
            </View>
            <View style={styles.contenido}>
              <Text style={[styles.titulo, { color: colores.texto, textAlign: esArabe ? 'right' : 'left' }]}>
                {t.headline}{' '}
                <Text style={styles.tituloCursiva}>{t.headline2}</Text>
              </Text>
              <View style={styles.descripcionPanel}><Text style={[styles.descripcion, { color: '#FFFFFF', textAlign: esArabe ? 'right' : 'left' }]}>{t.intro}</Text></View>
            </View>
            <View style={styles.pie}>
              <Pressable style={[styles.botonContinuar, { backgroundColor: colores.boton, borderColor: colores.borde }]} onPress={() => setPantalla('idioma')}>
                <Text style={[styles.textoBoton, { color: colores.texto }]}>{t.continueExplore}</Text>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      ) : pantalla === 'idioma' ? (
        <View style={[styles.pantallaIdioma, { backgroundColor: colores.fondo }]}>{fondoColorido}
          <View style={styles.encabezadoIdioma}>
            <Pressable onPress={() => setPantalla('inicio')} style={styles.botonVolver} accessibilityRole="button" accessibilityLabel={t.back}>
              <Text style={[styles.volverTexto, { color: colores.texto }]}>‹</Text>
            </Pressable>
            {botonModo}
          </View>
          <ScrollView contentContainerStyle={styles.contenidoIdioma} showsVerticalScrollIndicator={false}>
            <View style={styles.logoIdiomaMarco}>
              <Image source={require('./assets/icono.png')} style={styles.logoIdioma} resizeMode="contain" />
            </View>
            <Text style={styles.etiquetaIdioma}>UMBRAL · TU PRÓXIMO HOGAR</Text>
            <Text style={[styles.tituloIdioma, { color: colores.texto }]}>{t.chooseLanguage}</Text>
            <Text style={[styles.descripcionIdioma, { color: colores.secundario }]}>{t.chooseLanguageSub}</Text>
            <View style={styles.listaIdiomas}>
              {idiomas.map((idioma) => {
                const seleccionado = idiomaSeleccionado === idioma.codigo;
                return (
                  <Pressable
                    key={idioma.codigo}
                    onPress={() => setIdiomaSeleccionado(idioma.codigo)}
                    style={[styles.tarjetaIdioma, { backgroundColor: seleccionado ? (modoOscuro ? '#2A2414' : '#F0E9FF') : colores.tarjeta, borderColor: seleccionado ? '#E3C985' : colores.borde, borderWidth: seleccionado ? 2 : 1 }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: seleccionado }}
                  >
                    <Text style={styles.bandera}>{idioma.bandera}</Text>
                    <View style={styles.textosIdioma}>
                      <Text style={[styles.nombreIdioma, { color: colores.texto }]}>{idioma.nombre}</Text>
                      <Text style={[styles.detalleIdioma, { color: colores.secundario }]}>{idioma.detalle}</Text>
                    </View>
                    <Text style={styles.marcaSeleccion}>{seleccionado ? '●' : '○'}</Text>
                  </Pressable>
                );
              })}
            </View>
            {botonPrincipal(t.continue, () => setPantalla('propiedades'))}
          </ScrollView>
        </View>
      ) : (
        <PanelInvitado
          idioma={idiomaSeleccionado}
          alCambiarIdioma={setIdiomaSeleccionado}
          alVolver={() => setPantalla('idioma')}
          oscuroInicial={modoOscuro}
        />
      )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  tituloLista: { fontSize: 22, fontFamily: 'serif', fontWeight: '600', color: '#101542' },
  centroLista: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 14 },
  mensajeLista: { textAlign: 'center', fontSize: 14, lineHeight: 21 },
  contenidoLista: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30, gap: 16 },
  tarjetaProp: { borderRadius: 22, borderWidth: 1, overflow: 'hidden', elevation: 3, shadowColor: '#E3C985', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  fotoProp: { width: '100%', height: 180 },
  sinFotoProp: { backgroundColor: 'rgba(227, 201, 133, 0.18)', alignItems: 'center', justifyContent: 'center' },
  sinFotoLogo: { width: 64, height: 64, opacity: 0.8 },
  etiquetaOperacion: { position: 'absolute', top: 12, left: 12, backgroundColor: '#E3C985', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  etiquetaOperacionDetalle: { alignSelf: 'flex-start', backgroundColor: '#E3C985', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, marginTop: 14 },
  textoEtiquetaOperacion: { color: '#14110A', fontSize: 12, fontWeight: '700' },
  cuerpoProp: { padding: 14, gap: 6 },
  precioProp: { fontSize: 20, fontWeight: '700' },
  tipoProp: { fontSize: 13, lineHeight: 19 },
  datosProp: { flexDirection: 'row', gap: 16, marginTop: 4 },
  datoProp: { fontSize: 13, fontWeight: '600' },
  contenidoDetalle: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24 },
  fotoDetalle: { width: '100%', height: 240, borderRadius: 22 },
  precioDetalle: { fontSize: 26, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  datosDetalle: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  datoDetalle: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, fontWeight: '600', overflow: 'hidden' },
  subtituloDetalle: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  textoDetalle: { fontSize: 14, lineHeight: 22 },
  listaCaracteristicas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  caracteristica: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, overflow: 'hidden' },
  pieDetalle: { paddingHorizontal: 22, paddingBottom: 20, paddingTop: 8 },
  fondoImagen: { flex: 1 },
  imagen: { width: '100%', height: '100%' },
  capa: { flex: 1, paddingHorizontal: 25, paddingTop: 20, paddingBottom: 25, justifyContent: 'space-between' },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoImagen: { width: 34, height: 34 },
  logo: { fontSize: 19, fontWeight: '700', letterSpacing: 4 },
  eslogan: { fontSize: 11, fontStyle: 'italic', marginTop: 5 },
  botonModo: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(227, 201, 133, 0.18)', borderWidth: 1, borderColor: 'rgba(227, 201, 133, 0.35)', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  sol: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  solRayo: { position: 'absolute', width: 20, height: 20, borderRadius: 4, backgroundColor: '#E3C985', opacity: 0.55 },
  solCirculo: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#E3C985' },
  iconoModo: { width: 34, height: 34, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false, lineHeight: 34, fontSize: 27, color: '#E3C985' },
  contenido: { marginTop: 25, marginBottom: 'auto', paddingTop: 60 },
  titulo: { fontSize: 35, lineHeight: 43, fontWeight: '400', fontFamily: 'serif' },
  tituloCursiva: { color: '#E3C985', fontStyle: 'italic' },
  descripcionPanel: { alignSelf: 'flex-start', maxWidth: 350, backgroundColor: 'rgba(9, 9, 11, 0.72)', borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 13, marginTop: 17, shadowColor: '#160B2B', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  descripcion: { fontSize: 15, lineHeight: 23, fontWeight: '700', maxWidth: 330, textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 3 },
  pie: { alignItems: 'center', gap: 12 },
  flecha: { display: 'none' },
  botonContinuar: { width: '100%', minHeight: 56, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, elevation: 4 },
  textoBoton: { fontSize: 14, fontWeight: '600' },
  pantallaIdioma: { flex: 1, paddingHorizontal: 22, paddingTop: 12 },
  encabezadoIdioma: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  botonVolver: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(227, 201, 133, 0.16)', borderWidth: 1, borderColor: 'rgba(227, 201, 133, 0.28)' },
  volverTexto: { fontSize: 43, lineHeight: 43, fontWeight: '300', marginTop: -3, marginLeft: -3 },
  decoracionFondo: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  contenidoIdioma: { paddingTop: 24, paddingBottom: 36 },
  logoIdiomaMarco: { width: 100, height: 100, borderRadius: 32, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(227, 201, 133, 0.23)', borderWidth: 1, borderColor: 'rgba(227, 201, 133, 0.42)', marginBottom: 13 },
  logoIdioma: { width: 72, height: 72 },
  etiquetaIdioma: { color: '#E3C985', textAlign: 'center', fontSize: 10, letterSpacing: 2, fontWeight: '800', marginBottom: 13 },
  simboloIdioma: { color: '#E3C985', fontSize: 37, textAlign: 'center', marginBottom: 12 },
  tituloIdioma: { fontSize: 30, fontFamily: 'serif', textAlign: 'center', fontWeight: '600' },
  descripcionIdioma: { textAlign: 'center', fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: 25 },
  listaIdiomas: { gap: 12 },
  tarjetaIdioma: { minHeight: 76, borderRadius: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, elevation: 3, shadowColor: '#E3C985', shadowOpacity: 0.10, shadowRadius: 9, shadowOffset: { width: 0, height: 4 } },
  bandera: { fontSize: 28 },
  textosIdioma: { flex: 1, gap: 4 },
  nombreIdioma: { fontSize: 16, fontWeight: '600' },
  detalleIdioma: { fontSize: 12 },
  marcaSeleccion: { fontSize: 21, color: '#E3C985' },
  botonConfirmar: { backgroundColor: '#E3C985', borderRadius: 18, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingHorizontal: 15, elevation: 5, shadowColor: '#E3C985', shadowOpacity: 0.24, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  textoConfirmar: { color: '#14110A', fontWeight: '700', fontSize: 15 },
  accesoContenido: { flexGrow: 1, justifyContent: 'center', paddingTop: 18, paddingBottom: 30 },
  accesoLogo: { width: 92, height: 92, alignSelf: 'center', marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(227,201,133,0.28)', elevation: 5, shadowColor: '#E3C985', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  accesoTitulo: { fontSize: 32, lineHeight: 40, fontWeight: '700', fontFamily: 'serif', textAlign: 'center', letterSpacing: 0.2, textShadowColor: 'rgba(227,201,133,0.18)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 3 } },
  accesoDescripcion: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 10, marginBottom: 25, paddingHorizontal: 8 },
  tarjetaAcceso: { borderWidth: 1, borderRadius: 23, padding: 18, marginBottom: 15, elevation: 4, shadowColor: '#E3C985', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  accesoFilaIcono: { flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  accesoIconoFondo: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(227, 201, 133, 0.16)', borderWidth: 1, borderColor: 'rgba(227, 201, 133, 0.20)', alignItems: 'center', justifyContent: 'center' },
  accesoIcono: { color: '#E3C985', fontSize: 29, fontWeight: '600' },
  accesoTextosTarjeta: { flex: 1, gap: 7 },
  accesoTituloTarjeta: { fontSize: 17, fontWeight: '700' },
  accesoDescripcionTarjeta: { fontSize: 13, lineHeight: 19 },
  accesoAccionFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(227, 201, 133, 0.22)', marginTop: 15, paddingTop: 13 },
  accesoAccion: { color: '#E3C985', fontSize: 14, fontWeight: '700' },
  accesoFlecha: { display: 'none' },
  accesoNota: { fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 9 },
  formularioContenido: { flexGrow: 1, paddingTop: 20, paddingBottom: 40, paddingHorizontal: 3 },
  grupoCampo: { marginBottom: 15 },
  etiquetaCampo: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  campoFormulario: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, fontSize: 15 },
  botonMostrar: { alignSelf: 'flex-end', paddingTop: 10 },
  enlaceFormulario: { alignItems: 'center', marginTop: 23, marginBottom: 12 },
  textoEnlace: { fontSize: 14, textAlign: 'center' },
  opcionesFila: { flexDirection: 'row', gap: 10, marginBottom: 17 },
  opcionCuenta: { flex: 1, minHeight: 50, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, elevation: 1 },
  opcionDocumento: { minWidth: 75, minHeight: 44, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
});
