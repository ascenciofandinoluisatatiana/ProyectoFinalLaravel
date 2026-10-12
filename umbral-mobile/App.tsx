import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const idiomas = [
  { codigo: 'es', nombre: 'Español', detalle: 'Spanish', bandera: '🇨🇴' },
  { codigo: 'en', nombre: 'English', detalle: 'Inglés', bandera: '🇬🇧' },
  { codigo: 'fr', nombre: 'Français', detalle: 'Francés', bandera: '🇫🇷' },
  { codigo: 'pt', nombre: 'Português', detalle: 'Portugués', bandera: '🇧🇷' },
  { codigo: 'ar', nombre: 'العربية', detalle: 'Árabe', bandera: '🇸🇦' },
];

type Pantalla = 'inicio' | 'idioma' | 'acceso' | 'login' | 'registro' | 'invitado';
type TipoCuenta = 'persona' | 'inmobiliaria';
type TipoDocumento = 'CC' | 'CE' | 'NIT';

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
    back: 'رجوع',
  },
};

export default function App() {
  const [modoOscuro, setModoOscuro] = useState(false);
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState('es');

  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>('persona');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [documento, setDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('CC');
  const [representanteLegal, setRepresentanteLegal] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const t = textos[idiomaSeleccionado as keyof typeof textos];
  const esArabe = idiomaSeleccionado === 'ar';

  const colores = modoOscuro
    ? {
        fondo: '#07102F',
        texto: '#FFFFFF',
        secundario: '#C7C9F8',
        boton: '#27165E',
        borde: '#9874FF',
        tarjeta: '#111B40',
      }
    : {
        fondo: '#F8F7FF',
        texto: '#101542',
        secundario: '#5867B8',
        boton: '#FFFFFF',
        borde: '#BBA0FF',
        tarjeta: '#FFFFFF',
      };

  const alternarModo = () => setModoOscuro((actual) => !actual);

  const irARegistro = (tipo: TipoCuenta) => {
    setTipoCuenta(tipo);
    setTipoDocumento(tipo === 'inmobiliaria' ? 'NIT' : 'CC');
    setPantalla('registro');
  };

  const limpiarFormulario = () => {
    setCorreo('');
    setContrasena('');
    setConfirmarContrasena('');
    setNombre('');
    setTelefono('');
    setDocumento('');
    setRepresentanteLegal('');
    setMostrarContrasena(false);
  };

  const botonModo = (
    <Pressable
      onPress={alternarModo}
      style={styles.botonModo}
      accessibilityRole="button"
      accessibilityLabel={modoOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      <Text style={styles.iconoModo}>{modoOscuro ? '☾' : '☀'}</Text>
    </Pressable>
  );

  const campoEstilo = [
    styles.campoFormulario,
    {
      color: colores.texto,
      backgroundColor: colores.tarjeta,
      borderColor: colores.borde,
      textAlign: esArabe ? 'right' as const : 'left' as const,
    },
  ];

  const etiqueta = (texto: string) => (
    <Text style={[styles.etiquetaCampo, { color: colores.texto, textAlign: esArabe ? 'right' : 'left' }]}>
      {texto}
    </Text>
  );

  const campoTexto = (
    etiquetaTexto: string,
    valor: string,
    cambiarValor: (texto: string) => void,
    opciones: {
      placeholder: string;
      teclado?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
      mayusculas?: 'none' | 'sentences' | 'words' | 'characters';
      ocultar?: boolean;
    }
  ) => (
    <View style={styles.grupoCampo}>
      {etiqueta(etiquetaTexto)}
      <TextInput
        style={campoEstilo}
        placeholder={opciones.placeholder}
        placeholderTextColor={colores.secundario}
        value={valor}
        onChangeText={cambiarValor}
        keyboardType={opciones.teclado ?? 'default'}
        autoCapitalize={opciones.mayusculas ?? 'sentences'}
        secureTextEntry={opciones.ocultar ?? false}
      />
    </View>
  );

  const botonPrincipal = (texto: string, accion: () => void) => (
    <Pressable style={styles.botonConfirmar} onPress={accion} accessibilityRole="button">
      <Text style={styles.textoConfirmar}>{texto}</Text>
    </Pressable>
  );

  const fondoColorido = (
    <View pointerEvents="none" style={styles.decoracionFondo}>
      <View style={[styles.formaDecorativa, styles.formaMorada]} />
      <View style={[styles.formaDecorativa, styles.formaRosa]} />
      <View style={[styles.formaDecorativa, styles.formaDorada]} />
      <View style={[styles.formaDecorativa, styles.formaLavanda]} />
      <View style={[styles.formaDecorativa, styles.formaTurquesa]} />
      <View style={[styles.formaDecorativa, styles.formaPequenaRosa]} />
      <View style={[styles.formaDecorativa, styles.formaDiamante]} />
    </View>
  );

  const registrarVisualmente = () => {
    if (!nombre.trim() || !correo.trim() || !telefono.trim() || !documento.trim()) {
      Alert.alert(t.fillFields, t.fillRequired);
      return;
    }
    if (tipoCuenta === 'inmobiliaria' && !representanteLegal.trim()) {
      Alert.alert(t.missingRep, t.missingRepDesc);
      return;
    }
    if (!correo.includes('@') || !correo.includes('.')) {
      Alert.alert(t.invalidEmail, t.invalidEmailDesc);
      return;
    }
    if (contrasena.length < 8) {
      Alert.alert(t.shortPassword, t.shortPasswordDesc);
      return;
    }
    if (contrasena !== confirmarContrasena) {
      Alert.alert(t.differentPasswords, t.differentPasswordsDesc);
      return;
    }
    Alert.alert(t.formComplete, t.demoRegister, [
      {
        text: t.goLogin,
        onPress: () => {
          setPantalla('login');
          setContrasena('');
          setConfirmarContrasena('');
        },
      },
      { text: t.stayHere, style: 'cancel' },
    ]);
  };

  const mostrarMensajeDemo = () => {
    Alert.alert(t.demoTitle, t.demoLogin);
  };

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      <StatusBar style={modoOscuro ? 'light' : 'dark'} />

      {pantalla === 'inicio' ? (
        <ImageBackground
          source={modoOscuro ? require('./assets/residence-night.png') : require('./assets/residence-dusk.png')}
          style={styles.fondoImagen}
          imageStyle={styles.imagen}
          resizeMode="cover"
        >
          <View style={[styles.capa, { backgroundColor: modoOscuro ? 'rgba(5, 12, 43, 0.24)' : 'rgba(255, 255, 255, 0.10)' }]}>
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
                    style={[styles.tarjetaIdioma, { backgroundColor: seleccionado ? (modoOscuro ? '#28204D' : '#F0E9FF') : colores.tarjeta, borderColor: seleccionado ? '#9874FF' : colores.borde, borderWidth: seleccionado ? 2 : 1 }]}
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
            {botonPrincipal(t.continue, () => setPantalla('acceso'))}
          </ScrollView>
        </View>
      ) : pantalla === 'acceso' ? (
        <View style={[styles.pantallaIdioma, { backgroundColor: colores.fondo }]}>
          {fondoColorido}
          <View style={styles.encabezadoIdioma}>
            <Pressable onPress={() => setPantalla('idioma')} style={styles.botonVolver} accessibilityRole="button" accessibilityLabel={t.back}>
              <Text style={[styles.volverTexto, { color: colores.texto }]}>‹</Text>
            </Pressable>
            {botonModo}
          </View>
          <ScrollView contentContainerStyle={styles.accesoContenido} showsVerticalScrollIndicator={false}>
            <Image source={require('./assets/icono.png')} style={styles.accesoLogo} resizeMode="contain" />
            <Text style={[styles.accesoTitulo, { color: colores.texto }]}>{t.welcome}</Text>
            <Text style={[styles.accesoDescripcion, { color: colores.secundario }]}>{t.chooseProfile}</Text>

            <Pressable style={[styles.tarjetaAcceso, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]} onPress={() => setPantalla('invitado')}>
              <View style={styles.accesoFilaIcono}>
                <View style={styles.accesoIconoFondo}><Text style={styles.accesoIcono}>⌂</Text></View>
                <View style={styles.accesoTextosTarjeta}>
                  <Text style={[styles.accesoTituloTarjeta, { color: colores.texto }]}>{t.guest}</Text>
                  <Text style={[styles.accesoDescripcionTarjeta, { color: colores.secundario }]}>{t.guestDesc}</Text>
                </View>
              </View>
              <View style={styles.accesoAccionFila}>
                <Text style={styles.accesoAccion}>{t.guestAction}</Text>
              </View>
            </Pressable>

            <Pressable style={[styles.tarjetaAcceso, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]} onPress={() => setPantalla('login')}>
              <View style={styles.accesoFilaIcono}>
                <View style={styles.accesoIconoFondo}><Text style={styles.accesoIcono}>♙</Text></View>
                <View style={styles.accesoTextosTarjeta}>
                  <Text style={[styles.accesoTituloTarjeta, { color: colores.texto }]}>{t.staff}</Text>
                  <Text style={[styles.accesoDescripcionTarjeta, { color: colores.secundario }]}>{t.staffDesc}</Text>
                </View>
              </View>
              <View style={styles.accesoAccionFila}>
                <Text style={styles.accesoAccion}>{t.haveAccount}</Text>
              </View>
            </Pressable>

            <Pressable style={styles.enlaceFormulario} onPress={() => irARegistro('persona')}>
              <Text style={[styles.textoEnlace, { color: colores.secundario }]}>{t.noAccount} <Text style={styles.accesoAccion}>{t.createAccount}</Text></Text>
            </Pressable>
            <Text style={[styles.accesoNota, { color: colores.secundario }]}>{t.note}</Text>
          </ScrollView>
        </View>
      ) : pantalla === 'invitado' ? (
        <View style={[styles.pantallaIdioma, { backgroundColor: colores.fondo, flex: 1 }]}>{fondoColorido}
          <View style={styles.encabezadoIdioma}>
            <Pressable onPress={() => setPantalla('acceso')} style={styles.botonVolver} accessibilityRole="button" accessibilityLabel={t.back}>
              <Text style={[styles.volverTexto, { color: colores.texto }]}>‹</Text>
            </Pressable>
            {botonModo}
          </View>
          <ScrollView contentContainerStyle={styles.accesoContenido}>
            <Image source={require('./assets/icono.png')} style={styles.accesoLogo} resizeMode="contain" />
            <Text style={[styles.accesoTitulo, { color: colores.texto }]}>{t.guestTitle}</Text>
            <Text style={[styles.accesoDescripcion, { color: colores.secundario }]}>{t.guestSub}</Text>
            <View style={[styles.tarjetaAcceso, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
              <Text style={[styles.accesoTituloTarjeta, { color: colores.texto }]}>{t.guestSearch}</Text>
              <Text style={[styles.accesoDescripcionTarjeta, { color: colores.secundario, marginTop: 8 }]}>{t.guestDemo}</Text>
              <Pressable style={styles.botonConfirmar} onPress={() => Alert.alert(t.guestSearch, t.guestDemo)}>
                <Text style={styles.textoConfirmar}>{t.guestSearch}</Text>
              </Pressable>
            </View>
            <Pressable style={[styles.tarjetaAcceso, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]} onPress={() => Alert.alert(t.guestMap, t.guestDemo)}>
              <Text style={[styles.accesoTituloTarjeta, { color: colores.texto }]}>{t.guestMap}</Text>
              <Text style={[styles.accesoDescripcionTarjeta, { color: colores.secundario, marginTop: 7 }]}>{t.guestDemo}</Text>
            </Pressable>
            <Pressable style={styles.enlaceFormulario} onPress={() => setPantalla('login')}>
              <Text style={[styles.textoEnlace, { color: colores.secundario }]}>{t.haveAccount} <Text style={styles.accesoAccion}>{t.login}</Text></Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : pantalla === 'login' ? (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.pantallaIdioma, { flex: 1 }]}>
            {fondoColorido}
            <View style={styles.encabezadoIdioma}>
              <Pressable onPress={() => setPantalla('acceso')} style={styles.botonVolver} accessibilityRole="button" accessibilityLabel={t.back}>
                <Text style={[styles.volverTexto, { color: colores.texto }]}>‹</Text>
              </Pressable>
              {botonModo}
            </View>
            <ScrollView contentContainerStyle={styles.formularioContenido} keyboardShouldPersistTaps="handled">
              <Image source={require('./assets/icono.png')} style={styles.accesoLogo} resizeMode="contain" />
              <Text style={[styles.accesoTitulo, { color: colores.texto }]}>{t.login}</Text>
              <Text style={[styles.accesoDescripcion, { color: colores.secundario }]}>{t.loginSub}</Text>
              {campoTexto(t.email, correo, setCorreo, { placeholder: t.emailPlaceholder, teclado: 'email-address', mayusculas: 'none' })}
              <View style={styles.grupoCampo}>
                {etiqueta(t.password)}
                <TextInput style={campoEstilo} placeholder={t.passwordPlaceholder} placeholderTextColor={colores.secundario} value={contrasena} onChangeText={setContrasena} secureTextEntry={!mostrarContrasena} autoCapitalize="none" />
                <Pressable onPress={() => setMostrarContrasena((actual) => !actual)} style={styles.botonMostrar}>
                  <Text style={styles.accesoAccion}>{mostrarContrasena ? t.hidePassword : t.showPassword}</Text>
                </Pressable>
              </View>
              {botonPrincipal(t.enter, mostrarMensajeDemo)}
              <Pressable onPress={() => { limpiarFormulario(); irARegistro('persona'); }} style={styles.enlaceFormulario}>
                <Text style={[styles.textoEnlace, { color: colores.secundario }]}>{t.noAccount} <Text style={styles.accesoAccion}>{t.createAccount}</Text></Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.pantallaIdioma, { flex: 1 }]}>
            {fondoColorido}
            <View style={styles.encabezadoIdioma}>
              <Pressable onPress={() => setPantalla('acceso')} style={styles.botonVolver} accessibilityRole="button" accessibilityLabel={t.back}>
                <Text style={[styles.volverTexto, { color: colores.texto }]}>‹</Text>
              </Pressable>
              {botonModo}
            </View>
            <ScrollView contentContainerStyle={styles.formularioContenido} keyboardShouldPersistTaps="handled">
              <Image source={require('./assets/icono.png')} style={styles.accesoLogo} resizeMode="contain" />
              <Text style={[styles.accesoTitulo, { color: colores.texto }]}>{t.registerTitle}</Text>
              <Text style={[styles.accesoDescripcion, { color: colores.secundario }]}>{t.registerSub}</Text>

              {etiqueta(t.accountType)}
              <View style={styles.opcionesFila}>
                {([{ valor: 'persona', titulo: t.person }, { valor: 'inmobiliaria', titulo: t.agency }] as const).map((opcion) => (
                  <Pressable key={opcion.valor} onPress={() => { setTipoCuenta(opcion.valor); setTipoDocumento(opcion.valor === 'inmobiliaria' ? 'NIT' : 'CC'); }} style={[styles.opcionCuenta, { backgroundColor: tipoCuenta === opcion.valor ? '#7652E8' : colores.tarjeta, borderColor: colores.borde }]}>
                    <Text style={{ color: tipoCuenta === opcion.valor ? '#FFFFFF' : colores.texto, fontWeight: '700' }}>{opcion.titulo}</Text>
                  </Pressable>
                ))}
              </View>

              {campoTexto(tipoCuenta === 'inmobiliaria' ? t.agencyName : t.fullName, nombre, setNombre, { placeholder: t.namePlaceholder, mayusculas: 'words' })}
              {tipoCuenta === 'inmobiliaria' && campoTexto(t.legalRep, representanteLegal, setRepresentanteLegal, { placeholder: t.legalRepPlaceholder, mayusculas: 'words' })}
              {campoTexto(t.email, correo, setCorreo, { placeholder: t.emailPlaceholder, teclado: 'email-address', mayusculas: 'none' })}
              {campoTexto(t.phone, telefono, setTelefono, { placeholder: t.phonePlaceholder, teclado: 'phone-pad' })}

              {etiqueta(t.documentType)}
              <View style={styles.opcionesFila}>
                {(tipoCuenta === 'persona' ? ['CC', 'CE'] as const : ['NIT'] as const).map((tipo) => (
                  <Pressable key={tipo} onPress={() => setTipoDocumento(tipo)} style={[styles.opcionDocumento, { backgroundColor: tipoDocumento === tipo ? '#7652E8' : colores.tarjeta, borderColor: colores.borde }]}>
                    <Text style={{ color: tipoDocumento === tipo ? '#FFFFFF' : colores.texto, fontWeight: '700' }}>{tipo}</Text>
                  </Pressable>
                ))}
              </View>

              {campoTexto(t.documentNumber, documento, setDocumento, { placeholder: t.documentPlaceholder, mayusculas: 'none' })}
              <View style={styles.grupoCampo}>
                {etiqueta(t.password)}
                <TextInput style={campoEstilo} placeholder={t.minPassword} placeholderTextColor={colores.secundario} value={contrasena} onChangeText={setContrasena} secureTextEntry={!mostrarContrasena} autoCapitalize="none" />
              </View>
              <View style={styles.grupoCampo}>
                {etiqueta(t.confirmPassword)}
                <TextInput style={campoEstilo} placeholder={t.confirmPlaceholder} placeholderTextColor={colores.secundario} value={confirmarContrasena} onChangeText={setConfirmarContrasena} secureTextEntry={!mostrarContrasena} autoCapitalize="none" />
                <Pressable onPress={() => setMostrarContrasena((actual) => !actual)} style={styles.botonMostrar}>
                  <Text style={styles.accesoAccion}>{mostrarContrasena ? t.hidePassword : t.showPassword}</Text>
                </Pressable>
              </View>
              {botonPrincipal(t.prepareRegister, registrarVisualmente)}
              <Pressable onPress={() => setPantalla('login')} style={styles.enlaceFormulario}>
                <Text style={[styles.textoEnlace, { color: colores.secundario }]}>{t.alreadyAccount} <Text style={styles.accesoAccion}>{t.login}</Text></Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  fondoImagen: { flex: 1 },
  imagen: { width: '100%', height: '100%' },
  capa: { flex: 1, paddingHorizontal: 25, paddingTop: 20, paddingBottom: 25, justifyContent: 'space-between' },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoImagen: { width: 34, height: 34 },
  logo: { fontSize: 19, fontWeight: '700', letterSpacing: 4 },
  eslogan: { fontSize: 11, fontStyle: 'italic', marginTop: 5 },
  botonModo: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(125, 105, 255, 0.18)', borderWidth: 1, borderColor: 'rgba(137, 101, 255, 0.35)', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  iconoModo: { width: 34, height: 34, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false, lineHeight: 34, fontSize: 27, color: '#9672FF' },
  contenido: { marginTop: 25, marginBottom: 'auto', paddingTop: 60 },
  titulo: { fontSize: 35, lineHeight: 43, fontWeight: '400', fontFamily: 'serif' },
  tituloCursiva: { color: '#8B65FF', fontStyle: 'italic' },
  descripcionPanel: { alignSelf: 'flex-start', maxWidth: 350, backgroundColor: 'rgba(24, 13, 48, 0.76)', borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 13, marginTop: 17, shadowColor: '#160B2B', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  descripcion: { fontSize: 15, lineHeight: 23, fontWeight: '700', maxWidth: 330, textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 3 },
  pie: { alignItems: 'center', gap: 12 },
  flecha: { display: 'none' },
  botonContinuar: { width: '100%', minHeight: 56, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, elevation: 4 },
  textoBoton: { fontSize: 14, fontWeight: '600' },
  pantallaIdioma: { flex: 1, paddingHorizontal: 22, paddingTop: 12 },
  encabezadoIdioma: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  botonVolver: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(137, 101, 255, 0.16)', borderWidth: 1, borderColor: 'rgba(137, 101, 255, 0.28)' },
  volverTexto: { fontSize: 43, lineHeight: 43, fontWeight: '300', marginTop: -3, marginLeft: -3 },
  decoracionFondo: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  formaDecorativa: { position: 'absolute' },
  formaMorada: { width: 260, height: 260, borderRadius: 130, top: 35, right: -115, backgroundColor: 'rgba(137, 101, 255, 0.25)' },
  formaRosa: { width: 190, height: 190, borderRadius: 55, top: 230, left: -105, backgroundColor: 'rgba(239, 120, 190, 0.22)', transform: [{ rotate: '28deg' }] },
  formaDorada: { width: 120, height: 120, borderRadius: 38, top: 410, right: -35, backgroundColor: 'rgba(255, 196, 112, 0.22)', transform: [{ rotate: '35deg' }] },
  formaLavanda: { width: 90, height: 90, borderRadius: 45, top: 155, left: 20, backgroundColor: 'rgba(184, 164, 255, 0.22)' },
  formaTurquesa: { width: 145, height: 145, borderRadius: 48, bottom: 70, left: '48%', backgroundColor: 'rgba(75, 220, 211, 0.15)', transform: [{ rotate: '35deg' }] },
  formaPequenaRosa: { width: 34, height: 34, borderRadius: 17, top: '38%', right: 38, backgroundColor: 'rgba(255, 135, 195, 0.45)' },
  formaDiamante: { width: 48, height: 48, borderRadius: 12, bottom: 170, left: 32, backgroundColor: 'rgba(255, 201, 112, 0.28)', transform: [{ rotate: '45deg' }] },
  contenidoIdioma: { paddingTop: 24, paddingBottom: 36 },
  logoIdiomaMarco: { width: 100, height: 100, borderRadius: 32, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(137, 101, 255, 0.23)', borderWidth: 1, borderColor: 'rgba(137, 101, 255, 0.42)', marginBottom: 13, elevation: 6, shadowColor: '#7652E8', shadowOpacity: 0.20, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  logoIdioma: { width: 72, height: 72 },
  etiquetaIdioma: { color: '#8965FF', textAlign: 'center', fontSize: 10, letterSpacing: 2, fontWeight: '800', marginBottom: 13 },
  simboloIdioma: { color: '#9874FF', fontSize: 37, textAlign: 'center', marginBottom: 12 },
  tituloIdioma: { fontSize: 30, fontFamily: 'serif', textAlign: 'center', fontWeight: '600' },
  descripcionIdioma: { textAlign: 'center', fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: 25 },
  listaIdiomas: { gap: 12 },
  tarjetaIdioma: { minHeight: 76, borderRadius: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, elevation: 3, shadowColor: '#7652E8', shadowOpacity: 0.10, shadowRadius: 9, shadowOffset: { width: 0, height: 4 } },
  bandera: { fontSize: 28 },
  textosIdioma: { flex: 1, gap: 4 },
  nombreIdioma: { fontSize: 16, fontWeight: '600' },
  detalleIdioma: { fontSize: 12 },
  marcaSeleccion: { fontSize: 21, color: '#9874FF' },
  botonConfirmar: { backgroundColor: '#7652E8', borderRadius: 18, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingHorizontal: 15, elevation: 5, shadowColor: '#5C36C9', shadowOpacity: 0.24, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  textoConfirmar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  accesoContenido: { flexGrow: 1, justifyContent: 'center', paddingTop: 18, paddingBottom: 30 },
  accesoLogo: { width: 92, height: 92, alignSelf: 'center', marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(137,101,255,0.28)', elevation: 5, shadowColor: '#7652E8', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  accesoTitulo: { fontSize: 32, lineHeight: 40, fontWeight: '700', fontFamily: 'serif', textAlign: 'center', letterSpacing: 0.2, textShadowColor: 'rgba(137,101,255,0.18)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 3 } },
  accesoDescripcion: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 10, marginBottom: 25, paddingHorizontal: 8 },
  tarjetaAcceso: { borderWidth: 1, borderRadius: 23, padding: 18, marginBottom: 15, elevation: 4, shadowColor: '#7652E8', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  accesoFilaIcono: { flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  accesoIconoFondo: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(137, 101, 255, 0.16)', borderWidth: 1, borderColor: 'rgba(137, 101, 255, 0.20)', alignItems: 'center', justifyContent: 'center' },
  accesoIcono: { color: '#8965FF', fontSize: 29, fontWeight: '600' },
  accesoTextosTarjeta: { flex: 1, gap: 7 },
  accesoTituloTarjeta: { fontSize: 17, fontWeight: '700' },
  accesoDescripcionTarjeta: { fontSize: 13, lineHeight: 19 },
  accesoAccionFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(137, 101, 255, 0.22)', marginTop: 15, paddingTop: 13 },
  accesoAccion: { color: '#8965FF', fontSize: 14, fontWeight: '700' },
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
