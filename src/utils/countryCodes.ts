export interface CountryInfo {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const ALL_COUNTRIES: CountryInfo[] = [
  // América Latina y el Caribe (Popular y completo)
  { name: 'Honduras', code: 'HN', dialCode: '+504', flag: '🇭🇳' },
  { name: 'México', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷' },
  { name: 'España', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Estados Unidos / Canadá', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Guatemala', code: 'GT', dialCode: '+502', flag: '🇬🇹' },
  { name: 'El Salvador', code: 'SV', dialCode: '+503', flag: '🇸🇻' },
  { name: 'Nicaragua', code: 'NI', dialCode: '+505', flag: '🇳🇮' },
  { name: 'Costa Rica', code: 'CR', dialCode: '+506', flag: '🇨🇷' },
  { name: 'Panamá', code: 'PA', dialCode: '+507', flag: '🇵🇦' },
  { name: 'Perú', code: 'PE', dialCode: '+51', flag: '🇵🇪' },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱' },
  { name: 'Ecuador', code: 'EC', dialCode: '+593', flag: '🇪🇨' },
  { name: 'Venezuela', code: 'VE', dialCode: '+58', flag: '🇻🇪' },
  { name: 'Bolivia', code: 'BO', dialCode: '+591', flag: '🇧🇴' },
  { name: 'Paraguay', code: 'PY', dialCode: '+595', flag: '🇵🇾' },
  { name: 'Uruguay', code: 'UY', dialCode: '+598', flag: '🇺🇾' },
  { name: 'República Dominicana', code: 'DO', dialCode: '+1', flag: '🇩🇴' },
  { name: 'Puerto Rico', code: 'PR', dialCode: '+1', flag: '🇵🇷' },
  { name: 'Cuba', code: 'CU', dialCode: '+53', flag: '🇨🇺' },
  { name: 'Brasil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Haití', code: 'HT', dialCode: '+509', flag: '🇭🇹' },
  { name: 'Belice', code: 'BZ', dialCode: '+501', flag: '🇧🇿' },
  { name: 'Jamaica', code: 'JM', dialCode: '+1', flag: '🇯🇲' },
  { name: 'Bahamas', code: 'BS', dialCode: '+1', flag: '🇧🇸' },
  { name: 'Barbados', code: 'BB', dialCode: '+1', flag: '🇧🇧' },
  { name: 'Trinidad y Tobago', code: 'TT', dialCode: '+1', flag: '🇹🇹' },
  { name: 'Guyana', code: 'GY', dialCode: '+592', flag: '🇬🇾' },
  { name: 'Surinam', code: 'SR', dialCode: '+597', flag: '🇸🇷' },

  // Europa
  { name: 'Alemania', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'Francia', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Italia', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Reino Unido', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { name: 'Países Bajos (Holanda)', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'Bélgica', code: 'BE', dialCode: '+32', flag: '🇧🇪' },
  { name: 'Suiza', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹' },
  { name: 'Suecia', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { name: 'Noruega', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { name: 'Dinamarca', code: 'DK', dialCode: '+45', flag: '🇩🇰' },
  { name: 'Finlandia', code: 'FI', dialCode: '+358', flag: '🇫🇮' },
  { name: 'Irlanda', code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { name: 'Polonia', code: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { name: 'Rumania', code: 'RO', dialCode: '+40', flag: '🇷🇴' },
  { name: 'Grecia', code: 'GR', dialCode: '+30', flag: '🇬🇷' },
  { name: 'República Checa', code: 'CZ', dialCode: '+420', flag: '🇨🇿' },
  { name: 'Hungría', code: 'HU', dialCode: '+36', flag: '🇭🇺' },
  { name: 'Ucrania', code: 'UA', dialCode: '+380', flag: '🇺🇦' },
  { name: 'Rusia', code: 'RU', dialCode: '+7', flag: '🇷🇺' },
  { name: 'Turquía', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'Croacia', code: 'HR', dialCode: '+385', flag: '🇭🇷' },
  { name: 'Bulgaria', code: 'BG', dialCode: '+359', flag: '🇧🇬' },
  { name: 'Eslovaquia', code: 'SK', dialCode: '+421', flag: '🇸🇰' },
  { name: 'Eslovenia', code: 'SI', dialCode: '+386', flag: '🇸🇮' },
  { name: 'Serbia', code: 'RS', dialCode: '+381', flag: '🇷🇸' },
  { name: 'Bosnia y Herzegovina', code: 'BA', dialCode: '+387', flag: '🇧🇦' },
  { name: 'Albania', code: 'AL', dialCode: '+355', flag: '🇦🇱' },
  { name: 'Macedonia del Norte', code: 'MK', dialCode: '+389', flag: '🇲🇰' },
  { name: 'Montenegro', code: 'ME', dialCode: '+382', flag: '🇲🇪' },
  { name: 'Islandia', code: 'IS', dialCode: '+354', flag: '🇮🇸' },
  { name: 'Luxemburgo', code: 'LU', dialCode: '+352', flag: '🇱🇺' },
  { name: 'Malta', code: 'MT', dialCode: '+356', flag: '🇲🇹' },
  { name: 'Chipre', code: 'CY', dialCode: '+357', flag: '🇨🇾' },
  { name: 'Estonia', code: 'EE', dialCode: '+372', flag: '🇪🇪' },
  { name: 'Letonia', code: 'LV', dialCode: '+371', flag: '🇱🇻' },
  { name: 'Lituania', code: 'LT', dialCode: '+370', flag: '🇱🇹' },
  { name: 'Bielorrusia', code: 'BY', dialCode: '+375', flag: '🇧🇾' },
  { name: 'Moldavia', code: 'MD', dialCode: '+373', flag: '🇲🇩' },
  { name: 'Andorra', code: 'AD', dialCode: '+376', flag: '🇦🇩' },
  { name: 'Mónaco', code: 'MC', dialCode: '+377', flag: '🇲🇨' },
  { name: 'San Marino', code: 'SM', dialCode: '+378', flag: '🇸🇲' },
  { name: 'Ciudad del Vaticano', code: 'VA', dialCode: '+39', flag: '🇻🇦' },
  { name: 'Liechtenstein', code: 'LI', dialCode: '+423', flag: '🇱🇮' },
  { name: 'Gibraltar', code: 'GI', dialCode: '+350', flag: '🇬🇮' },

  // Asia y Medio Oriente
  { name: 'Japón', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Corea del Sur', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Filipinas', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { name: 'Tailandia', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Malasia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Singapur', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Taiwán', code: 'TW', dialCode: '+886', flag: '🇹🇼' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852', flag: '🇭🇰' },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱' },
  { name: 'Emiratos Árabes Unidos', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Arabia Saudita', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Omán', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Bahréin', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'Jordania', code: 'JO', dialCode: '+962', flag: '🇯🇴' },
  { name: 'Líbano', code: 'LB', dialCode: '+961', flag: '🇱🇧' },
  { name: 'Irak', code: 'IQ', dialCode: '+964', flag: '🇮🇶' },
  { name: 'Irán', code: 'IR', dialCode: '+98', flag: '🇮🇷' },
  { name: 'Pakistán', code: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵' },
  { name: 'Kazajistán', code: 'KZ', dialCode: '+7', flag: '🇰🇿' },
  { name: 'Uzbekistán', code: 'UZ', dialCode: '+998', flag: '🇺🇿' },
  { name: 'Azerbaiyán', code: 'AZ', dialCode: '+994', flag: '🇦🇿' },
  { name: 'Georgia', code: 'GE', dialCode: '+995', flag: '🇬🇪' },
  { name: 'Armenia', code: 'AM', dialCode: '+374', flag: '🇦🇲' },
  { name: 'Mongolia', code: 'MN', dialCode: '+976', flag: '🇲🇳' },
  { name: 'Camboya', code: 'KH', dialCode: '+855', flag: '🇰🇭' },
  { name: 'Laos', code: 'LA', dialCode: '+856', flag: '🇱🇦' },
  { name: 'Myanmar (Birmania)', code: 'MM', dialCode: '+95', flag: '🇲🇲' },
  { name: 'Maldivas', code: 'MV', dialCode: '+960', flag: '🇲🇻' },
  { name: 'Afganistán', code: 'AF', dialCode: '+93', flag: '🇦🇫' },
  { name: 'Palestina', code: 'PS', dialCode: '+970', flag: '🇵🇸' },
  { name: 'Yemen', code: 'YE', dialCode: '+967', flag: '🇾🇪' },
  { name: 'Siria', code: 'SY', dialCode: '+963', flag: '🇸🇾' },

  // África
  { name: 'Sudáfrica', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Egipto', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Kenia', code: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { name: 'Marruecos', code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { name: 'Argelia', code: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { name: 'Túnez', code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { name: 'Ghana', code: 'GH', dialCode: '+233', flag: '🇬🇭' },
  { name: 'Etiopía', code: 'ET', dialCode: '+251', flag: '🇪🇹' },
  { name: 'Senegal', code: 'SN', dialCode: '+221', flag: '🇸🇳' },
  { name: 'Costa de Marfil', code: 'CI', dialCode: '+225', flag: '🇨🇮' },
  { name: 'Camerún', code: 'CM', dialCode: '+237', flag: '🇨🇲' },
  { name: 'Angola', code: 'AO', dialCode: '+244', flag: '🇦🇴' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255', flag: '🇹🇿' },
  { name: 'Uganda', code: 'UG', dialCode: '+256', flag: '🇺🇬' },
  { name: 'Mozambique', code: 'MZ', dialCode: '+258', flag: '🇲🇿' },
  { name: 'Madagascar', code: 'MG', dialCode: '+261', flag: '🇲🇬' },
  { name: 'Zimbabue', code: 'ZW', dialCode: '+263', flag: '🇿🇼' },
  { name: 'Zambia', code: 'ZM', dialCode: '+260', flag: '🇿🇲' },
  { name: 'Ruanda', code: 'RW', dialCode: '+250', flag: '🇷🇼' },
  { name: 'Mauricio', code: 'MU', dialCode: '+230', flag: '🇲🇺' },
  { name: 'Namibia', code: 'NA', dialCode: '+264', flag: '🇳🇦' },
  { name: 'Botsuana', code: 'BW', dialCode: '+267', flag: '🇧🇼' },
  { name: 'Cabo Verde', code: 'CV', dialCode: '+238', flag: '🇨🇻' },
  { name: 'Guinea Ecuatorial', code: 'GQ', dialCode: '+240', flag: '🇬🇶' },

  // Oceanía
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Nueva Zelanda', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'Fiyi', code: 'FJ', dialCode: '+679', flag: '🇫🇯' },
  { name: 'Papúa Nueva Guinea', code: 'PG', dialCode: '+675', flag: '🇵🇬' },
  { name: 'Samoa', code: 'WS', dialCode: '+685', flag: '🇼🇸' },
  { name: 'Guam', code: 'GU', dialCode: '+1', flag: '🇬🇺' },
];

export function findCountryByDialCode(dialCode: string): CountryInfo {
  const match = ALL_COUNTRIES.find(c => c.dialCode === dialCode);
  return match || ALL_COUNTRIES[0];
}

export function detectDeviceCountry(): CountryInfo {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
    
    if (tz.includes('tegucigalpa') || tz.includes('honduras')) {
      return ALL_COUNTRIES.find(c => c.code === 'HN') || ALL_COUNTRIES[0];
    }
    if (tz.includes('mexico') || tz.includes('cancun') || tz.includes('tijuana') || tz.includes('monterrey')) {
      return ALL_COUNTRIES.find(c => c.code === 'MX') || ALL_COUNTRIES[1];
    }
    if (tz.includes('guatemala')) {
      return ALL_COUNTRIES.find(c => c.code === 'GT') || ALL_COUNTRIES[6];
    }
    if (tz.includes('salvador')) {
      return ALL_COUNTRIES.find(c => c.code === 'SV') || ALL_COUNTRIES[7];
    }
    if (tz.includes('managua') || tz.includes('nicaragua')) {
      return ALL_COUNTRIES.find(c => c.code === 'NI') || ALL_COUNTRIES[8];
    }
    if (tz.includes('costa_rica')) {
      return ALL_COUNTRIES.find(c => c.code === 'CR') || ALL_COUNTRIES[9];
    }
    if (tz.includes('panama')) {
      return ALL_COUNTRIES.find(c => c.code === 'PA') || ALL_COUNTRIES[10];
    }
    if (tz.includes('bogota') || tz.includes('colombia')) {
      return ALL_COUNTRIES.find(c => c.code === 'CO') || ALL_COUNTRIES[2];
    }
    if (tz.includes('lima') || tz.includes('peru')) {
      return ALL_COUNTRIES.find(c => c.code === 'PE') || ALL_COUNTRIES[11];
    }
    if (tz.includes('santiago') || tz.includes('chile')) {
      return ALL_COUNTRIES.find(c => c.code === 'CL') || ALL_COUNTRIES[12];
    }
    if (tz.includes('buenos_aires') || tz.includes('argentina') || tz.includes('cordoba')) {
      return ALL_COUNTRIES.find(c => c.code === 'AR') || ALL_COUNTRIES[3];
    }
    if (tz.includes('madrid') || tz.includes('spain') || tz.includes('canary')) {
      return ALL_COUNTRIES.find(c => c.code === 'ES') || ALL_COUNTRIES[4];
    }
    if (tz.includes('santo_domingo')) {
      return ALL_COUNTRIES.find(c => c.code === 'DO') || ALL_COUNTRIES[18];
    }
    if (tz.includes('guayaquil') || tz.includes('ecuador')) {
      return ALL_COUNTRIES.find(c => c.code === 'EC') || ALL_COUNTRIES[13];
    }
    if (tz.includes('caracas') || tz.includes('venezuela')) {
      return ALL_COUNTRIES.find(c => c.code === 'VE') || ALL_COUNTRIES[14];
    }
  } catch {
    // fallback
  }

  // Check navigator language
  try {
    const lang = (navigator.language || '').toLowerCase();
    if (lang.includes('hn')) return ALL_COUNTRIES.find(c => c.code === 'HN') || ALL_COUNTRIES[0];
    if (lang.includes('mx')) return ALL_COUNTRIES.find(c => c.code === 'MX') || ALL_COUNTRIES[1];
    if (lang.includes('es')) return ALL_COUNTRIES.find(c => c.code === 'ES') || ALL_COUNTRIES[4];
    if (lang.includes('co')) return ALL_COUNTRIES.find(c => c.code === 'CO') || ALL_COUNTRIES[2];
    if (lang.includes('ar')) return ALL_COUNTRIES.find(c => c.code === 'AR') || ALL_COUNTRIES[3];
  } catch {
    // fallback
  }

  return ALL_COUNTRIES[0]; // Default Honduras / First in Latin America list
}

export function getDefaultCarrierForCountry(code: string): string {
  switch (code) {
    case 'HN': return 'Tigo / Claro 4G LTE';
    case 'MX': return 'Telcel / AT&T 5G';
    case 'ES': return 'Movistar / Vodafone 5G';
    case 'CO': return 'Claro / Tigo 4G';
    case 'AR': return 'Personal / Claro 4G';
    case 'GT': return 'Tigo / Claro 4G';
    case 'SV': return 'Tigo / Claro 4G';
    case 'US': return 'AT&T / Verizon 5G';
    default: return 'Red Móvil 4G/5G';
  }
}
