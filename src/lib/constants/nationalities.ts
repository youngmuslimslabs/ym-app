/**
 * Shared nationality (demonym) list — single source of truth.
 *
 * Replaces the ethnicity lists previously duplicated verbatim in
 * `onboarding/step1-personal-info.tsx` and `profile/PersonalInfoSection.tsx`.
 * Presented as a *soft suggestion*: the field is a searchable combobox with
 * free-text entry allowed (`allowCustom`), and the backing column stays TEXT.
 *
 * Nationalities/demonyms only — stateless/pan-ethnic self-identifiers
 * (Kurdish, Bosniak, Amazigh, Uyghur, …) are intentionally omitted as too niche
 * (owner decision, Ali Ilyas feedback 2026-07-08). "Other" is the final entry.
 */
export const NATIONALITIES: string[] = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Antiguan',
  'Argentine', 'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahamian',
  'Bahraini', 'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean',
  'Beninese', 'Bhutanese', 'Bolivian', 'Bosnian', 'Botswanan', 'Brazilian',
  'British', 'Bruneian', 'Bulgarian', 'Burkinabé', 'Burmese', 'Burundian',
  'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean', 'Central African',
  'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comoran', 'Congolese',
  'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech', 'Danish', 'Djiboutian',
  'Dominican', 'Dutch', 'East Timorese', 'Ecuadorian', 'Egyptian', 'Emirati',
  'Equatorial Guinean', 'Eritrean', 'Estonian', 'Ethiopian', 'Fijian', 'Filipino',
  'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian',
  'Greek', 'Grenadian', 'Guatemalan', 'Guinean', 'Guinea-Bissauan', 'Guyanese',
  'Haitian', 'Honduran', 'Hungarian', 'Icelandic', 'Indian', 'Indonesian',
  'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican',
  'Japanese', 'Jordanian', 'Kazakh', 'Kenyan', 'I-Kiribati', 'Kosovar', 'Kuwaiti',
  'Kyrgyz', 'Laotian', 'Latvian', 'Lebanese', 'Basotho', 'Liberian', 'Libyan',
  'Liechtensteiner', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy',
  'Malawian', 'Malaysian', 'Maldivian', 'Malian', 'Maltese', 'Marshallese',
  'Mauritanian', 'Mauritian', 'Mexican', 'Micronesian', 'Moldovan', 'Monégasque',
  'Mongolian', 'Montenegrin', 'Moroccan', 'Mozambican', 'Namibian', 'Nauruan',
  'Nepali', 'New Zealander', 'Nicaraguan', 'Nigerien', 'Nigerian', 'North Korean',
  'Norwegian', 'Omani', 'Pakistani', 'Palauan', 'Palestinian', 'Panamanian',
  'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Polish', 'Portuguese', 'Qatari',
  'Romanian', 'Russian', 'Rwandan', 'Saint Lucian', 'Salvadoran', 'Samoan',
  'San Marinese', 'São Toméan', 'Saudi', 'Senegalese', 'Serbian', 'Seychellois',
  'Sierra Leonean', 'Singaporean', 'Slovak', 'Slovenian', 'Solomon Islander',
  'Somali', 'South African', 'South Korean', 'South Sudanese', 'Spanish',
  'Sri Lankan', 'Sudanese', 'Surinamese', 'Swazi', 'Swedish', 'Swiss', 'Syrian',
  'Taiwanese', 'Tajik', 'Tanzanian', 'Thai', 'Togolese', 'Tongan', 'Trinidadian',
  'Tunisian', 'Turkish', 'Turkmen', 'Tuvaluan', 'Ugandan', 'Ukrainian',
  'Uruguayan', 'Uzbek', 'Vanuatuan', 'Venezuelan', 'Vietnamese', 'Yemeni',
  'Zambian', 'Zimbabwean', 'Other',
]

/** `{ value, label }` options for `SearchableCombobox` / `SelectStep`. */
export const NATIONALITY_OPTIONS: { value: string; label: string }[] = NATIONALITIES.map(
  (n) => ({ value: n, label: n }),
)
