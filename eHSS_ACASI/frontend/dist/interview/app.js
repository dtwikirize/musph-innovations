const generateClientNumber = () => {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ACASI-${stamp}-${suffix}`;
};

const TRANSLATIONS = {
  sw: {
    langCode: "sw-KE",
    sex:        { text: "Je, wewe ni wa jinsia gani?", help: "", opts: ["Mwanamke", "Mwanaume"] },
    age:        { text: "Uko katika kundi gani la umri?", help: "", opts: ["Miaka 15 hadi 19", "Miaka 20 hadi 24", "Miaka 25 hadi 34", "Miaka 35 na zaidi"] },
    occupation: { text: "Kazi au jamii ipi inakuelezea zaidi?", help: "", opts: ["Dereva wa lori", "Huduma za sare", "Mfanyabiashara", "Kufanya kazi katika jamii ya wavuvi", "Mfanyakazi wa ngono", "Mfanyakazi wa baa, hoteli, au burudani", "Mwanafunzi", "Nyingine"] },
    sellSex:    { text: "Katika miezi 12 iliyopita, umewahi kuuza ngono kwa pesa, zawadi, au msaada?", help: "", opts: ["Hapana", "Ndiyo", "Napendelea kutotojibu", "Sijui"] },
    buySex:     { text: "Katika miezi 12 iliyopita, umewahi kununua ngono au kubadilishana pesa kwa ngono?", help: "", opts: ["Hapana", "Ndiyo", "Napendelea kutotojibu", "Sijui"] },
    injectDrugs:{ text: "Je, umewahi kujidunga dawa za kulevya au kushiriki sindano?", help: "", opts: ["Hapana", "Ndiyo", "Napendelea kutotojibu", "Sijui"] },
    partners:   { text: "Katika miezi 12 iliyopita, ulikuwa na washirika zaidi ya mmoja wa ngono?", help: "", opts: ["Hapana", "Ndiyo", "Napendelea kutotojibu", "Sijui"] },
    condom:     { text: "Mara ngapi unatumia kondomu wakati wa ngono?", help: "", opts: ["Kila wakati", "Wakati mwingine", "Kamwe", "Sijishughulishi kimapenzi"] },
    testing:    { text: "Je, umejipima VVU katika miezi 3 iliyopita?", help: "", opts: ["Ndiyo, na najua matokeo yangu", "Hapana", "Nilijipima, lakini sijui matokeo", "Napendelea kutotojibu"] },
    testResult: { text: "Matokeo ya kipimo chako cha VVU yalikuwa yapi?", help: "", opts: ["Hasi", "Chanya"] },
    violence:   { text: "Je, umepata ngono ya kulazimishwa au unyanyasaji wa kijinsia hivi karibuni?", help: "", opts: ["Hapana", "Ndiyo", "Napendelea kutotojibu", "Ninahitaji msaada sasa"] }
  },
  nyn: {
    langCode: "en-UG",
    sex:        { text: "Orikuha omukazi oba omushaija?", help: "", opts: ["Omukazi", "Omushaija"] },
    age:        { text: "Emiaka emingahi oyorereire?", help: "", opts: ["Emiaka 15 okutuuka 19", "Emiaka 20 okutuuka 24", "Emiaka 25 okutuuka 34", "Emiaka 35 n'obusingye"] },
    occupation: { text: "Omulimu oba eishangiro erihe erikugyenderaho?", help: "", opts: ["Omushofero w'etaaka", "Emirimo gy'omuteekateeka", "Omuhiiriizi", "Okukolera mu ishangiro ry'abasiiga", "Omukora w'obushaguku", "Omukora w'omubaara, omuhoteli, oba oburinganye", "Omweshongora", "Ekindi"] },
    sellSex:    { text: "Mu myezi 12 eyahirire, waagiira obushaguku n'ensimbi, ebitabo, oba obuyambi?", help: "", opts: ["Nedda", "Yego", "Nkunda obutagyira", "Ntimanyi"] },
    buySex:     { text: "Mu myezi 12 eyahirire, waguura obushaguku oba wagiizaho ensimbi?", help: "", opts: ["Nedda", "Yego", "Nkunda obutagyira", "Ntimanyi"] },
    injectDrugs:{ text: "Wariijomba emishumo oba wagaana emimwa oba ebishaho by'omwijomba?", help: "", opts: ["Nedda", "Yego", "Nkunda obutagyira", "Ntimanyi"] },
    partners:   { text: "Mu myezi 12 eyahirire, wali nawe n'ababashagukani abasingye omu?", help: "", opts: ["Nedda", "Yego", "Nkunda obutagyira", "Ntimanyi"] },
    condom:     { text: "Omara emirundi emingahi okuziisha kondomu mu kukora obushaguku?", help: "", opts: ["Buri muanya", "Emirundi emika", "Naatyo", "Ndikora obunyabo obu"] },
    testing:    { text: "Waziirwa HIV mu myezi 3 eyahirire?", help: "", opts: ["Yego, nzi ebiija byangye", "Nedda", "Naaziirwa, naye ntimanyi ebiija", "Nkunda obutagyira"] },
    testResult: { text: "Ebiija by'okuzirwa kwawe kwa HIV byali bihi?", help: "", opts: ["Negative", "Positive"] },
    violence:   { text: "Wabonaho okugaya kw'obushaguku oba okubuzaanya kw'obushaguku obu kuhiire?", help: "", opts: ["Nedda", "Yego", "Nkunda obutagyira", "Nkunda obuyambi obu"] }
  },
  ttj: {
    langCode: "en-UG",
    sex:        { text: "Orikuha omukazi oba omushaija?", help: "", opts: ["Omukazi", "Omushaija"] },
    age:        { text: "Emiaka emingahi oyorereire?", help: "", opts: ["Emiaka 15 okutuuka 19", "Emiaka 20 okutuuka 24", "Emiaka 25 okutuuka 34", "Emiaka 35 n'obusingye"] },
    occupation: { text: "Omulimu oba eishangiro erihe erikugyenderaho?", help: "", opts: ["Omushofero w'etaaka", "Emirimo gy'omuteekateeka", "Omuhiiriizi", "Okukolera mu ishangiro ry'abasiiga", "Omukora w'obushaguku", "Omukora w'omubaara, omuhoteli, oba oburinganye", "Omweshongora", "Ekindi"] },
    sellSex:    { text: "Mu myezi 12 eyahirire, waagiira obushaguku n'ensimbi, ebitabo, oba obuyambi?", help: "", opts: ["Nedda", "Yego", "Nkunda obutagyira", "Ntimanyi"] },
    buySex:     { text: "Mu myezi 12 eyahirire, waguura obushaguku oba wagiizaho ensimbi?", help: "", opts: ["Nedda", "Yego", "Nkunda obutagyira", "Ntimanyi"] },
    injectDrugs:{ text: "Wariijomba emishumo oba wagaana emimwa oba ebishaho by'omwijomba?", help: "", opts: ["Nedda", "Yego", "Nkunda obutagyira", "Ntimanyi"] },
    partners:   { text: "Mu myezi 12 eyahirire, wali nawe n'ababashagukani abasingye omu?", help: "", opts: ["Nedda", "Yego", "Nkunda obutagyira", "Ntimanyi"] },
    condom:     { text: "Omara emirundi emingahi okuziisha kondomu mu kukora obushaguku?", help: "", opts: ["Buri muanya", "Emirundi emika", "Naatyo", "Ndikora obunyabo obu"] },
    testing:    { text: "Waziirwa HIV mu myezi 3 eyahirire?", help: "", opts: ["Yego, nzi ebiija byangye", "Nedda", "Naaziirwa, naye ntimanyi ebiija", "Nkunda obutagyira"] },
    testResult: { text: "Ebiija by'okuzirwa kwawe kwa HIV byali bihi?", help: "", opts: ["Negative", "Positive"] },
    violence:   { text: "Wabonaho okugaya kw'obushaguku oba okubuzaanya kw'obushaguku obu kuhiire?", help: "", opts: ["Nedda", "Yego", "Nkunda obutagyira", "Nkunda obuyambi obu"] }
  },
  ach: {
    langCode: "en-UG",
    sex:        { text: "In dako onyo laco?", help: "", opts: ["Dako", "Laco"] },
    age:        { text: "I iye diro pa mwaka?", help: "", opts: ["Mwaka 15 nio 19", "Mwaka 20 nio 24", "Mwaka 25 nio 34", "Mwaka 35 ki malo"] },
    occupation: { text: "Tic onyo doggola mene aye ma kwacu?", help: "", opts: ["Lapit gwere", "Tic me mony", "Lacan", "Tic i doggola pa lutur rec", "Ladit pa okuto", "Tic i baa, hote, onyo timme me yweya", "Lapeny", "Mukene"] },
    sellSex:    { text: "I kare me dwe 12 ma okato, ibedo ka yero okuto pi lim, mot, onyo kony?", help: "", opts: ["Pe", "Ee", "Amito pe lagam", "Aŋeyo pe"] },
    buySex:     { text: "I kare me dwe 12 ma okato, igulo okuto onyo ibiyo lim pi okuto?", help: "", opts: ["Pe", "Ee", "Amito pe lagam", "Aŋeyo pe"] },
    injectDrugs:{ text: "Igoyo iye yat i kome onyo iyabo kim me goyo?", help: "", opts: ["Pe", "Ee", "Amito pe lagam", "Aŋeyo pe"] },
    partners:   { text: "I kare me dwe 12 ma okato, ibedo ki luwot me okuto pa mene makato achel?", help: "", opts: ["Pe", "Ee", "Amito pe lagam", "Aŋeyo pe"] },
    condom:     { text: "Itiyo ki kondom kopac mene i kare me okuto?", help: "", opts: ["Jwijwi", "Kare mukene", "Pe kiny", "Atimo okuto pe"] },
    testing:    { text: "Ikwanyo kit pi HIV i kare me dwe 3 ma okato?", help: "", opts: ["Ee, aŋeyo yot pa kwanyo", "Pe", "Akwanyo, ento aŋeyo pe yot", "Amito pe lagam"] },
    testResult: { text: "Yot pa kwanyo HIV ni obedo ngo?", help: "", opts: ["Negative", "Positive"] },
    violence:   { text: "Inoŋo okuto me lony onyo nek me okuto kombedi?", help: "", opts: ["Pe", "Ee", "Amito pe lagam", "Amito kony kombedi"] }
  },
  laj: {
    langCode: "en-UG",
    sex:        { text: "In dako onyo laco?", help: "", opts: ["Dako", "Laco"] },
    age:        { text: "I iye diro pa mwaka?", help: "", opts: ["Mwaka 15 nio 19", "Mwaka 20 nio 24", "Mwaka 25 nio 34", "Mwaka 35 ki malo"] },
    occupation: { text: "Tic onyo doggola mene aye ma kwacuni?", help: "", opts: ["Lapit gwere", "Tic me mony", "Lacan", "Tic i doggola pa lutur rec", "Ladit pa okuto", "Tic i baa, hote, onyo timme me yweya", "Lapeny", "Mukene"] },
    sellSex:    { text: "I kare me dwe 12 ma okato, ibedo ka yero okuto pi lim, mot, onyo kony?", help: "", opts: ["Daŋ", "Ee", "Amito pe lagam", "Aŋeyo pe"] },
    buySex:     { text: "I kare me dwe 12 ma okato, igulo okuto onyo ibiyo lim pi okuto?", help: "", opts: ["Daŋ", "Ee", "Amito pe lagam", "Aŋeyo pe"] },
    injectDrugs:{ text: "Igoyo iye yat i kome onyo iyabo kim me goyo?", help: "", opts: ["Daŋ", "Ee", "Amito pe lagam", "Aŋeyo pe"] },
    partners:   { text: "I kare me dwe 12 ma okato, ibedo ki luwot me okuto pa mene makato achel?", help: "", opts: ["Daŋ", "Ee", "Amito pe lagam", "Aŋeyo pe"] },
    condom:     { text: "Itiyo ki kondom kopac mene i kare me okuto?", help: "", opts: ["Jwijwi", "Kare mukene", "Pe kiny", "Atimo okuto pe"] },
    testing:    { text: "Ikwanyo kit pi HIV i kare me dwe 3 ma okato?", help: "", opts: ["Ee, aŋeyo yot pa kwanyo", "Daŋ", "Akwanyo, ento aŋeyo pe yot", "Amito pe lagam"] },
    testResult: { text: "Yot pa kwanyo HIV ni obedo ngo?", help: "", opts: ["Negative", "Positive"] },
    violence:   { text: "Inoŋo okuto me lony onyo nek me okuto kombedi?", help: "", opts: ["Daŋ", "Ee", "Amito pe lagam", "Amito kony kombedi"] }
  },
  luo: {
    langCode: "en-UG",
    sex:        { text: "In dhako kata dichuo?", help: "", opts: ["Dhako", "Dichuo"] },
    age:        { text: "In e odi mar higni mage?", help: "", opts: ["Higni 15 nyaka 19", "Higni 20 nyaka 24", "Higni 25 nyaka 34", "Higni 35 kata malo"] },
    occupation: { text: "Tich kata oganda mane e ma neno-ni?", help: "", opts: ["Jatend gari maduong", "Tich mar mony", "Japuonj ohala", "Tich e oganda mar lupo rech", "Jatich mar hera", "Jatich mar bar, hote, kata miel", "Japuonj", "Mamoko"] },
    sellSex:    { text: "E dwe 12 ma osekalo, ne iulo hera pi pesa, mich, kata kony?", help: "", opts: ["Ooyo", "Ee", "Adwaro ok adwok", "Ok aŋeyo"] },
    buySex:     { text: "E dwe 12 ma osekalo, ne igulo hera kata ichangoo pesa gi hera?", help: "", opts: ["Ooyo", "Ee", "Adwaro ok adwok", "Ok aŋeyo"] },
    injectDrugs:{ text: "Ne isunju yath e ringri kata ipogno sindano?", help: "", opts: ["Ooyo", "Ee", "Adwaro ok adwok", "Ok aŋeyo"] },
    partners:   { text: "E dwe 12 ma osekalo, ne in gi jopith hera mang'eny moloyo achiel?", help: "", opts: ["Ooyo", "Ee", "Adwaro ok adwok", "Ok aŋeyo"] },
    condom:     { text: "Itiyo gi kondom manger nade e kindeni mar hera?", help: "", opts: ["Kinde duto", "Kinde moko", "Ok kinde moro", "Ok atimo hera"] },
    testing:    { text: "Ne ikwayo HIV e dwe 3 ma osekalo?", help: "", opts: ["Ee, aŋeyo donge mar kwayo", "Ooyo", "Ne akwayo, to ok aŋeyo donge", "Adwaro ok adwok"] },
    testResult: { text: "Donge mar kwayo HIV ni ne en mane?", help: "", opts: ["Negative", "Positive"] },
    violence:   { text: "Ne in gi hera ma opimo kata mirima mar hera nd'uchieni?", help: "", opts: ["Ooyo", "Ee", "Adwaro ok adwok", "Adwaro kony sani"] }
  },
  nkz: {
    langCode: "en-UG",
    sex:        { text: "Ng'o omukali oba omusaija?", help: "", opts: ["Omukali", "Omusaija"] },
    age:        { text: "Emyaka emingahi oyithireho?", help: "", opts: ["Emyaka 15 okutuuka 19", "Emyaka 20 okutuuka 24", "Emyaka 25 okutuuka 34", "Emyaka 35 n'obusingye"] },
    occupation: { text: "Omulimu oba empande nyande erikugyenderaho?", help: "", opts: ["Omushofero w'etaaka", "Emirimo gy'omuteekateeka", "Omuhiiriizi", "Okukolera mu mpande y'abasiiga", "Omukora w'obushaguku", "Omukora w'omubaara oba omuhoteli", "Omweshongora", "Ekindi"] },
    sellSex:    { text: "Mu myezi 12 eyahirire, wagiira obushaguku n'ensimbi, ebitabo, oba obuyambi?", help: "", opts: ["Ehe", "Ye", "Nkunda obutagyira", "Ntimanyi"] },
    buySex:     { text: "Mu myezi 12 eyahirire, waguura obushaguku oba wagiizaho ensimbi?", help: "", opts: ["Ehe", "Ye", "Nkunda obutagyira", "Ntimanyi"] },
    injectDrugs:{ text: "Wariijomba emishumo oba wagaana emimwa eby'omwijomba?", help: "", opts: ["Ehe", "Ye", "Nkunda obutagyira", "Ntimanyi"] },
    partners:   { text: "Mu myezi 12 eyahirire, wali nawe n'ababashagukani abasingye omu?", help: "", opts: ["Ehe", "Ye", "Nkunda obutagyira", "Ntimanyi"] },
    condom:     { text: "Omara emirundi emingahi okuziisha kondomu mu kukora obushaguku?", help: "", opts: ["Buri muanya", "Emirundi emika", "Naatyo", "Ndikora obunyabo obu"] },
    testing:    { text: "Waziirwa HIV mu myezi 3 eyahirire?", help: "", opts: ["Ye, nzi ebiija byangye", "Ehe", "Naaziirwa, naye ntimanyi ebiija", "Nkunda obutagyira"] },
    testResult: { text: "Ebiija by'okuzirwa kwawe kwa HIV byali bihi?", help: "", opts: ["Negative", "Positive"] },
    violence:   { text: "Wabonaho okugaya kw'obushaguku oba okubuzaanya kw'obushaguku obu kuhiire?", help: "", opts: ["Ehe", "Ye", "Nkunda obutagyira", "Nkunda obuyambi obu"] }
  },
  xog: {
    langCode: "en-UG",
    sex:        { text: "Oli omukazi oba omusajja?", help: "", opts: ["Omukazi", "Omusajja"] },
    age:        { text: "Emyaka emingahi olina?", help: "", opts: ["Emyaka 15 okutuuka 19", "Emyaka 20 okutuuka 24", "Emyaka 25 okutuuka 34", "Emyaka 35 n'okusingako"] },
    occupation: { text: "Mulimu oba ekibiina ki ekikutegeeza obutuufu?", help: "", opts: ["Musomesa wa lori", "Emirimo gy'omuteekateeka", "Musuubuzi", "Okukolera mu kibiina ky'abaŋonge", "Mukola w'obusajjagazi", "Mukola wa baa, hooteli, oba obusesenye", "Musoomi", "Ekirala"] },
    sellSex:    { text: "Mu myezi 12 egiyise, wayita obusajjagazi olw'ensimbi, ebirabo, oba obuyambi?", help: "", opts: ["Nedda", "Yee", "Njagala obutaddamu", "Simanyi"] },
    buySex:     { text: "Mu myezi 12 egiyise, wagula obusajjagazi oba wagiizaako ensimbi?", help: "", opts: ["Nedda", "Yee", "Njagala obutaddamu", "Simanyi"] },
    injectDrugs:{ text: "Wagoba ebirowoozo oba wasaasaana empiso oba ebikozesebwa?", help: "", opts: ["Nedda", "Yee", "Njagala obutaddamu", "Simanyi"] },
    partners:   { text: "Mu myezi 12 egiyise, waabanga n'abasajjagazi abasinga omu?", help: "", opts: ["Nedda", "Yee", "Njagala obutaddamu", "Simanyi"] },
    condom:     { text: "Okozesa kondomu emirundi emingahi mu kufuba obusajjagazi?", help: "", opts: ["Buli kiseera", "Emirundi emika", "Nedda na kiseera", "Sikolagana obusajjagazi"] },
    testing:    { text: "Wakkebwa HIV mu myezi 3 egiyise?", help: "", opts: ["Yee, nManyi ebivaamu byange", "Nedda", "Naakkebwa, naye simanyi ebivaamu", "Njagala obutaddamu"] },
    testResult: { text: "Ebivaamu by'okukkebwa kwo kwa HIV byali biki?", help: "", opts: ["Negative", "Positive"] },
    violence:   { text: "Walobera obusajjagazi obw'omukodo oba okukaabirwa kw'obusajjagazi bukyali?", help: "", opts: ["Nedda", "Yee", "Njagala obutaddamu", "Njagala obuyambi kati"] }
  },
  lg: {
    langCode: "en-UG",
    sex:        { text: "Oli mukazi oba musajja?", help: "", opts: ["Mukazi", "Musajja"] },
    age:        { text: "Olina emyaka emeka?", help: "", opts: ["Emyaka 15 okutuuka 19", "Emyaka 20 okutuuka 24", "Emyaka 25 okutuuka 34", "Emyaka 35 n'okusingawo"] },
    occupation: { text: "Mulimu ki oba kitundu ki ekikutuukirako?", help: "", opts: ["Omugoba wa loole", "Emirimu gy'obwesimbu", "Omusuubuzi", "Okukolera mu kitundu ky'abavubi", "Omukozi w'okwegatta", "Omukozi wa baa, wooteeri, oba amasanyu", "Omuyizi", "Ekirala"] },
    sellSex:    { text: "Mu myezi 12 egiyise, watunda okwegatta olw'ensimbi, ebirabo, oba obuyambi?", help: "", opts: ["Nedda", "Yee", "Njagala obutaddamu", "Simanyi"] },
    buySex:     { text: "Mu myezi 12 egiyise, wagula okwegatta oba wawanyisiganya ensimbi olw'okwegatta?", help: "", opts: ["Nedda", "Yee", "Njagala obutaddamu", "Simanyi"] },
    injectDrugs:{ text: "Weefumbise eddagala oba wakozesa empiso z'abalala?", help: "", opts: ["Nedda", "Yee", "Njagala obutaddamu", "Simanyi"] },
    partners:   { text: "Mu myezi 12 egiyise, wabeera n'abeegattira nabo abasukka omu?", help: "", opts: ["Nedda", "Yee", "Njagala obutaddamu", "Simanyi"] },
    condom:     { text: "Okozesa kondomu emirundi emeka nga weegatta?", help: "", opts: ["Buli kiseera", "Oluusi", "Nedda n'omulundi gumu", "Siyingira mu kwegatta"] },
    testing:    { text: "Wakebera HIV mu myezi 3 egiyise?", help: "", opts: ["Yee, era mmanyi ebyavuddemu", "Nedda", "Nakebera, naye simanyi ebyavuddemu", "Njagala obutaddamu"] },
    testResult: { text: "Ebyavuddemu mu kukebera kwo kwa HIV byali biki?", help: "", opts: ["Negative", "Positive"] },
    violence:   { text: "Wakakibwa okwegatta oba wayisibwa obubi mu kwegatta mu biseera bino?", help: "", opts: ["Nedda", "Yee", "Njagala obutaddamu", "Njagala obuyambi kati"] }
  }
};

let currentLang = "en";

const getTranslatedQuestions = (lang) => {
  const t = TRANSLATIONS[lang];
  if (!t) return BASE_QUESTIONS;
  return BASE_QUESTIONS.map((q) => {
    const qt = t[q.id];
    if (!qt) return q;
    return {
      ...q,
      text: qt.text,
      help: qt.help !== undefined ? qt.help : q.help,
      options: q.options.map((opt, i) => ({ ...opt, label: qt.opts[i] !== undefined ? qt.opts[i] : opt.label }))
    };
  });
};

const BASE_QUESTIONS = [
  {
    id: "sex",
    text: "What is your sex?",
    help: "",
    options: [
      { label: "Female", score: 0, value: "Female" },
      { label: "Male", score: 0, value: "Male" }
    ]
  },
  {
    id: "age",
    text: "What is your age group?",
    help: "",
    options: [
      { label: "15 to 19 years", score: 0, value: "15-19 years" },
      { label: "20 to 24 years", score: 0, value: "20-24 years" },
      { label: "25 to 34 years", score: 0, value: "25-34 years" },
      { label: "35 years and above", score: 0, value: "35+ years" }
    ]
  },
  {
    id: "occupation",
    text: "Which occupation or community best describes you?",
    help: "",
    options: [
      { label: "Truck driver", score: 2, group: "Truck drivers", flag: "Mobile occupation" },
      { label: "Uniformed services", score: 2, group: "Uniformed services", flag: "Uniformed services" },
      { label: "Business person", score: 1, group: "Business community", flag: "Business community" },
      { label: "Working in fishing community", score: 2, group: "Fisher folk", flag: "Fishing community" },
      { label: "Sex worker", score: 4, group: "SW", flag: "Sex worker" },
      { label: "Bar, lodge, or entertainment worker", score: 2, group: "Entertainment workers", flag: "Entertainment work" },
      { label: "Student", score: 0 },
      { label: "Other", score: 0 }
    ]
  },
  {
    id: "sellSex",
    text: "In the last 12 months, have you sold sex for money, gifts, or support?",
    help: "",
    options: [
      { label: "No", score: 0 },
      { label: "Yes", score: 4, group: "SW", flag: "Sold sex" },
      { label: "Prefer not to answer", score: 0 },
      { label: "I am not sure", score: 1 }
    ]
  },
  {
    id: "buySex",
    text: "In the last 12 months, have you bought sex or exchanged money or gifts for sex?",
    help: "",
    options: [
      { label: "No", score: 0 },
      { label: "Yes", score: 3, group: "Client of sex worker", flag: "Bought sex" },
      { label: "Prefer not to answer", score: 0 },
      { label: "I am not sure", score: 1 }
    ]
  },
  {
    id: "injectDrugs",
    text: "Have you injected drugs or shared needles or injecting equipment?",
    help: "",
    options: [
      { label: "No", score: 0 },
      { label: "Yes", score: 4, group: "PWID", flag: "Injected drugs" },
      { label: "Prefer not to answer", score: 0 },
      { label: "I am not sure", score: 1 }
    ]
  },
  {
    id: "partners",
    text: "In the last 12 months, have you had more than one sexual partner?",
    help: "",
    options: [
      { label: "No", score: 0 },
      { label: "Yes", score: 2, flag: "Multiple sexual partners" },
      { label: "Prefer not to answer", score: 0 },
      { label: "I am not sure", score: 1 }
    ]
  },
  {
    id: "condom",
    text: "How often do you use condoms during sex?",
    help: "",
    options: [
      { label: "Always", score: 0 },
      { label: "Sometimes", score: 2, flag: "Inconsistent condom use" },
      { label: "Never", score: 3, flag: "No condom use" },
      { label: "Not sexually active", score: 0 }
    ]
  },
  {
    id: "testing",
    text: "Have you tested for HIV in the last 3 months?",
    help: "",
    options: [
      { label: "Yes, and I know my result", score: 0 },
      { label: "No", score: 2, flag: "Needs HIV testing" },
      { label: "I tested, but do not know the result", score: 1, flag: "Needs result follow-up" },
      { label: "Prefer not to answer", score: 0 }
    ]
  },
  {
    id: "testResult",
    text: "What was your HIV test result?",
    help: "",
    showIf: (answers) => answers.testing === 0,
    options: [
      { label: "Negative", score: 0, value: "Negative", flag: "Recent negative test" },
      { label: "Positive", score: 0, value: "Positive", flag: "Known HIV positive" }
    ]
  },
  {
    id: "violence",
    text: "Have you experienced forced sex or sexual violence recently?",
    help: "",
    options: [
      { label: "No", score: 0 },
      { label: "Yes", score: 4, flag: "Needs post-violence care" },
      { label: "Prefer not to answer", score: 0 },
      { label: "I need help now", score: 4, flag: "Urgent support requested" }
    ]
  }
];

let questions = BASE_QUESTIONS;

const responses = {};
let currentIndex = 0;
let clientNumber = generateClientNumber();
let speechRun = 0;
let speechTimer = null;
let preferredVoice = null;
let landingImageIndex = 0;

const LANGUAGE_NAMES = {
  en: "English",
  nyn: "Runyankole",
  ttj: "Rutooro",
  ach: "Acholi",
  laj: "Langi",
  sw: "Swahili",
  luo: "Luo",
  nkz: "Rukonjo",
  xog: "Lusoga",
  lg: "Luganda"
};

const screens = {
  start: document.querySelector('[data-screen="start"]'),
  register: document.querySelector('[data-screen="register"]'),
  language: document.querySelector('[data-screen="language"]'),
  interview: document.querySelector('[data-screen="interview"]'),
  video: document.querySelector('[data-screen="video"]'),
  report: document.querySelector('[data-screen="report"]')
};

const registration = { age: null, finger: "Index", left: false, right: false, entryPoint: null };

// Queue numbers run in sequence for the session, starting at Q-001.
let queueCounter = 0;
let queueNumber = "";
const nextQueueNumber = () => {
  queueCounter += 1;
  return `Q-${String(queueCounter).padStart(3, "0")}`;
};

const prefilledIds = new Set();

// A question is relevant when its showIf branch condition passes.
const isRelevant = (question) => !question.showIf || question.showIf(responses);

// Questions actually put to the client: relevant, and not already captured
// at registration.
const activeQuestions = () =>
  questions.filter((question) => !prefilledIds.has(question.id) && isRelevant(question));

// Drop answers to questions that a later edit made irrelevant, so a stale
// answer cannot leak into the report.
const purgeHiddenResponses = () => {
  questions.forEach((question) => {
    if (!isRelevant(question)) delete responses[question.id];
  });
};

const ageGroupFor = (age) => {
  if (age >= 15 && age <= 19) return "15-19 years";
  if (age >= 20 && age <= 24) return "20-24 years";
  if (age >= 25 && age <= 34) return "25-34 years";
  if (age >= 35) return "35+ years";
  return null;
};

const updateRegistrationState = () => {
  const group = registration.age === null ? null : ageGroupFor(registration.age);
  document.getElementById("ageDerivedGroup").textContent = group
    ? `Age group: ${group}`
    : registration.age === null
      ? "Age group will show here"
      : "Age must be 15 or above";

  const captured = (registration.left ? 1 : 0) + (registration.right ? 1 : 0);
  const counter = document.getElementById("captureCounter");
  counter.querySelector(".capture-count").textContent = `${captured} of 2`;
  counter.querySelector(".capture-label").textContent =
    captured === 2
      ? `fingerprints captured successfully`
      : captured === 1
        ? `fingerprint captured successfully`
        : "fingerprints captured";
  counter.classList.toggle("is-partial", captured === 1);
  counter.classList.toggle("is-complete", captured === 2);

  document.getElementById("entryPointHint").textContent = registration.entryPoint
    ? `Entry point: ${registration.entryPoint}`
    : "No entry point selected";

  const missing = [];
  if (!group) missing.push("a valid age");
  if (!registration.entryPoint) missing.push("entry point");
  if (!registration.left) missing.push("left hand scan");
  if (!registration.right) missing.push("right hand scan");

  const ready = missing.length === 0;
  document.getElementById("beginInterviewButton").disabled = !ready;
  document.getElementById("registerValidation").textContent = ready
    ? `Ready — ${queueNumber}, ${registration.entryPoint}, ${registration.finger} finger on both hands`
    : `Still needed: ${missing.join(", ")}`;
};

const runScan = (pad, hand) => {
  if (pad.classList.contains("scanning")) return;
  const status = pad.querySelector(".scan-status");
  pad.classList.remove("captured");
  pad.classList.add("scanning");
  status.textContent = "Scanning…";

  window.setTimeout(() => {
    pad.classList.remove("scanning");
    pad.classList.add("captured");
    status.textContent = `${registration.finger} captured`;
    registration[hand.toLowerCase()] = true;
    updateRegistrationState();
  }, 1600);
};

const resetRegistration = () => {
  registration.age = null;
  registration.left = false;
  registration.right = false;
  registration.entryPoint = null;
  clientNumber = generateClientNumber();
  queueNumber = nextQueueNumber();
  document.getElementById("registerClientId").textContent = clientNumber;
  document.getElementById("registerQueue").textContent = queueNumber;
  document.getElementById("registerAge").value = "";
  document.querySelectorAll(".entry-option").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".scan-pad").forEach((pad) => {
    pad.classList.remove("scanning", "captured");
    pad.querySelector(".scan-status").textContent = "Tap to scan";
  });
  updateRegistrationState();
};

const VIDEO_LIBRARY = {
  "Understanding HIV risk and testing options": {
    duration: "4 min",
    detail: "How HIV is passed on, what raises or lowers your risk, and the testing choices available to you today.",
    points: [
      "HIV is passed through blood, semen, vaginal fluids, and breast milk",
      "Testing is free, confidential, and takes about 20 minutes",
      "Knowing your status early keeps treatment simple and effective"
    ]
  },
  "Services for people at higher risk for HIV": {
    duration: "5 min",
    detail: "Focused prevention services available to people whose answers suggest a higher chance of HIV exposure.",
    points: [
      "PrEP is a daily pill that prevents HIV before exposure",
      "PEP can still protect you within 72 hours after exposure",
      "Regular testing every 3 months is recommended for you"
    ]
  },
  "Reducing HIV risk from injecting drug use": {
    duration: "6 min",
    detail: "Harm reduction steps that lower your risk of HIV and hepatitis when injecting.",
    points: [
      "Never share needles, syringes, or any injecting equipment",
      "Free sterile equipment is available at harm reduction sites",
      "Ask about opioid substitution therapy and support groups"
    ]
  },
  "Safer sex, condoms, and STI prevention": {
    duration: "5 min",
    detail: "Practical protection for people who sell or buy sex, including negotiating condom use safely.",
    points: [
      "Condoms used correctly every time prevent HIV and most STIs",
      "Carry your own condoms and lubricant so you are never without",
      "Screen for STIs regularly, even when you feel well"
    ]
  },
  "Correct condom and lubricant use": {
    duration: "3 min",
    detail: "A step-by-step demonstration of putting on a condom and choosing the right lubricant.",
    points: [
      "Check the expiry date and open the pack carefully",
      "Use only water-based or silicone lubricant, never oil",
      "Put the condom on before any contact and hold the base when withdrawing"
    ]
  },
  "Living well with HIV: treatment and adherence": {
    duration: "6 min",
    detail: "Starting and staying on treatment, and what an undetectable viral load means for your health.",
    points: [
      "Treatment started early keeps you healthy and living normally",
      "Taking ART every day makes the virus undetectable",
      "An undetectable viral load means you cannot pass HIV to partners"
    ]
  },
  "Getting help after sexual violence": {
    duration: "5 min",
    detail: "What support is available after forced sex, and why acting quickly matters.",
    points: [
      "PEP can prevent HIV if started within 72 hours",
      "Emergency contraception and injury care are available free",
      "Counsellors and legal support can help you at your own pace"
    ]
  }
};

let videoPlaylist = [];
let videoIndex = 0;

// Counselling videos live in ./videos/. ENDSES is the default fallback
// used for any topic that has no video of its own.
const DEMO_VIDEO = "./videos/ENDSES.mp4";

const VIDEO_SOURCES = {
  "Understanding HIV risk and testing options": "./videos/SXTXGEN.mp4",
  "Services for people at higher risk for HIV": "./videos/MULPAT.mp4",
  "Reducing HIV risk from injecting drug use": "./videos/DRGUS.mp4",
  "Safer sex, condoms, and STI prevention": "./videos/SXSELL.mp4",
  "Correct condom and lubricant use": "./videos/SXCOND.mp4",
  "Getting help after sexual violence": "./videos/SXRAPE.mp4"
};

const loadVideoFor = (topic) => {
  const player = document.getElementById("videoPlayer");
  const placeholder = document.getElementById("videoPlaceholder");
  const src = VIDEO_SOURCES[topic] || DEMO_VIDEO;

  player.pause();

  if (!src) {
    player.removeAttribute("src");
    player.classList.add("hidden");
    placeholder.classList.remove("hidden");
    return;
  }

  // Show the player only once the file is confirmed to load.
  player.onloadeddata = () => {
    player.classList.remove("hidden");
    placeholder.classList.add("hidden");
    // The client has already tapped through the interview, so autoplay with
    // sound is normally allowed. If the browser still blocks it, the controls
    // are there to start it manually.
    player.play().catch(() => {});
  };
  player.onerror = () => {
    player.classList.add("hidden");
    placeholder.classList.remove("hidden");
  };

  player.src = src;
  player.load();
};

const renderVideoScreen = () => {
  const total = videoPlaylist.length;
  const topic = videoPlaylist[videoIndex];
  const meta = VIDEO_LIBRARY[topic] || { duration: "4 min", detail: "", points: [] };

  document.getElementById("videoClientNumber").textContent = `Client ${clientNumber}`;
  document.getElementById("videoProgressLabel").textContent = `Topic ${videoIndex + 1} of ${total}`;
  document.getElementById("videoProgressBar").style.width = `${((videoIndex + 1) / total) * 100}%`;
  document.getElementById("videoTitle").textContent = topic;
  document.getElementById("videoDuration").textContent = meta.duration;
  loadVideoFor(topic);

  const playlist = document.getElementById("videoPlaylist");
  playlist.innerHTML = "";
  videoPlaylist.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "playlist-item";
    if (index === videoIndex) button.classList.add("active");
    if (index < videoIndex) button.classList.add("watched");
    button.innerHTML = `<span>${index + 1}</span><strong>${item}</strong><small>${(VIDEO_LIBRARY[item] || {}).duration || ""}</small>`;
    button.addEventListener("click", () => {
      videoIndex = index;
      renderVideoScreen();
    });
    playlist.appendChild(button);
  });

  // Always enabled: from the first topic Previous steps back to the interview.
  document.getElementById("videoPreviousButton").disabled = false;
  document.getElementById("videoNextButton").innerHTML =
    videoIndex === total - 1
      ? `View my report
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13m-5-5 5 5-5 5" />
    </svg>`
      : `Next topic
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13m-5-5 5 5-5 5" />
    </svg>`;
};

const showScreen = (screen) => {
  Object.values(screens).forEach((element) => element.classList.add("hidden"));
  screens[screen].classList.remove("hidden");
  if (screen !== "video") {
    const player = document.getElementById("videoPlayer");
    if (player) player.pause();
  }
};

const choosePreferredVoice = () => {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferredPatterns = [
    /natural/i,
    /online/i,
    /jenny/i,
    /aria/i,
    /zira/i,
    /susan/i,
    /samantha/i,
    /google uk english female/i,
    /google us english/i,
    /microsoft/i
  ];
  preferredVoice =
    voices.find((voice) => /^en/i.test(voice.lang) && preferredPatterns.some((pattern) => pattern.test(voice.name))) ||
    voices.find((voice) => /^en/i.test(voice.lang)) ||
    voices[0];
  return preferredVoice;
};

const initializeVoices = () => {
  choosePreferredVoice();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = choosePreferredVoice;
  }
};

const selectedOptionFor = (questionId) => {
  const question = questions.find((item) => item.id === questionId);
  const selectedIndex = responses[questionId];
  return selectedIndex === undefined ? null : question.options[selectedIndex];
};

const profileValue = (questionId, fallback = "Not answered") =>
  selectedOptionFor(questionId)?.value || selectedOptionFor(questionId)?.label || fallback;

// The audio status row is no longer rendered; keep these calls harmless so
// the speech flow does not need to know about the UI.
const setAudioStatus = (text) => {
  const el = document.getElementById("audioStatus");
  if (el) el.textContent = text;
};

const clearOptionSpeech = () => {
  document.querySelectorAll(".option-button.speaking").forEach((button) => button.classList.remove("speaking"));
};

const stopAudio = () => {
  speechRun += 1;
  window.clearTimeout(speechTimer);
  clearOptionSpeech();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
};

const speakSegment = (text, { onStart, onEnd } = {}) => {
  if (!("speechSynthesis" in window)) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = preferredVoice || choosePreferredVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || "en-US";
  }
  utterance.rate = 0.84;
  utterance.pitch = 0.96;
  utterance.volume = 1;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
};

const playQuestionAudio = () => {
  const question = activeQuestions()[currentIndex];
  const run = ++speechRun;
  stopAudio();
  speechRun = run;
  setAudioStatus("Playing question and options");

  const queue = [
    { text: question.text },
    ...question.options.map((option, index) => ({ text: option.label, optionIndex: index }))
  ];

  const playNext = (index = 0) => {
    if (run !== speechRun) return;
    clearOptionSpeech();
    const item = queue[index];
    if (!item) {
      setAudioStatus("Audio complete");
      return;
    }
    const played = speakSegment(item.text, {
      onStart: () => {
        if (item.optionIndex !== undefined) {
          document.querySelector(`[data-option-index="${item.optionIndex}"]`)?.classList.add("speaking");
        }
      },
      onEnd: () => {
        clearOptionSpeech();
        speechTimer = window.setTimeout(() => playNext(index + 1), 220);
      }
    });
    if (!played) {
      setAudioStatus("Audio is not available in this browser");
    }
  };

  playNext();
};

const setNextButtonLabel = () => {
  const label = currentIndex === activeQuestions().length - 1 ? "Continue to videos" : "Next";
  document.getElementById("nextButton").innerHTML = `${label}
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13m-5-5 5 5-5 5" />
    </svg>`;
};

const renderQuestion = ({ autoPlay = false } = {}) => {
  stopAudio();
  const asked = activeQuestions();
  const question = asked[currentIndex];
  document.getElementById("clientNumberLabel").textContent = `Client ${clientNumber}`;
  document.getElementById("questionCounter").textContent = `Question ${currentIndex + 1} of ${asked.length}`;
  document.getElementById("questionText").textContent = question.text;
  document.getElementById("progressBar").style.width = `${((currentIndex + 1) / asked.length) * 100}%`;
  // Always enabled: from the first question Previous steps back to the
  // language screen rather than dead-ending.
  document.getElementById("previousButton").disabled = false;
  setNextButtonLabel();

  const grid = document.getElementById("optionsGrid");
  grid.innerHTML = "";
  grid.classList.toggle("many-options", question.options.length > 4);
  question.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.dataset.optionIndex = String(optionIndex);
    button.textContent = option.label;
    if (responses[question.id] === optionIndex) button.classList.add("selected");
    button.addEventListener("click", () => {
      responses[question.id] = optionIndex;
      purgeHiddenResponses();
      renderQuestion();
    });
    grid.appendChild(button);
  });

  setAudioStatus("Audio will play automatically");
  if (autoPlay) speechTimer = window.setTimeout(playQuestionAudio, 350);
};

const selectedOptions = () =>
  questions
    .filter(isRelevant)
    .map((question) => {
      const selectedIndex = responses[question.id];
      if (selectedIndex === undefined) return null;
      return { question, option: question.options[selectedIndex] };
    })
    .filter(Boolean);

const derivedHighRiskGroups = (selected, score) => {
  const groups = new Set(selected.map((item) => item.option.group).filter(Boolean));
  const sex = profileValue("sex");
  const age = profileValue("age");

  if (/female/i.test(sex) && /15-19|20-24/.test(age)) {
    groups.add("AGYW");
  }

  if (!groups.size && score >= 4) {
    groups.add("People at higher risk for HIV");
  }

  return [...groups];
};

const buildReport = () => {
  stopAudio();
  const selected = selectedOptions();
  const score = selected.reduce((sum, item) => sum + item.option.score, 0);
  const flags = [...new Set(selected.map((item) => item.option.flag).filter(Boolean))];
  const groups = derivedHighRiskGroups(selected, score);
  const isHighRisk = groups.length > 0;
  const high = score >= 8 || flags.includes("Needs post-violence care") || flags.includes("Urgent support requested");
  const moderate = !high && score >= 4;
  const level = high ? "High" : moderate ? "Moderate" : isHighRisk ? "Focused" : "No risk";
  const riskClass = high ? "high" : moderate || isHighRisk ? "moderate" : "";
  const groupLabel = isHighRisk ? groups.join(", ") : "No risk at all";

  const knownPositive = flags.includes("Known HIV positive");

  const services = knownPositive
    ? [
        "Linkage to HIV treatment and care",
        "Antiretroviral therapy initiation or adherence support",
        "Viral load monitoring",
        "Partner testing and disclosure support",
        ...(groups.includes("PWID") ? ["Harm reduction counselling and safe injecting support"] : []),
        ...(flags.includes("Needs post-violence care") || flags.includes("Urgent support requested") ? ["Post-violence care and urgent psychosocial support"] : []),
        ...(flags.includes("No condom use") || flags.includes("Inconsistent condom use") ? ["Condoms, lubricants, and safer sex counselling"] : []),
        "Referral to a trained health worker for confidential support"
      ]
    : [
    ...(isHighRisk ? ["Focused HIV prevention counselling"] : ["General HIV prevention information"]),
    "HIV testing and result counselling",
    ...(flags.includes("Needs HIV testing") || flags.includes("Needs result follow-up") ? ["Same-day HIV testing or result follow-up"] : []),
    ...(groups.includes("PWID") ? ["Harm reduction counselling and safe injecting support"] : []),
    ...(groups.includes("SW") || groups.includes("Client of sex worker") ? ["Sexual health counselling and STI screening"] : []),
    ...(flags.includes("Needs post-violence care") || flags.includes("Urgent support requested") ? ["Post-violence care and urgent psychosocial support"] : []),
    ...(flags.includes("No condom use") || flags.includes("Inconsistent condom use") ? ["Condoms, lubricants, and safer sex counselling"] : []),
    "Referral to a trained health worker for confidential support"
  ];

  const videos = [
    ...(knownPositive ? ["Living well with HIV: treatment and adherence"] : ["Understanding HIV risk and testing options"]),
    ...(isHighRisk && !knownPositive ? ["Services for people at higher risk for HIV"] : []),
    ...(groups.includes("PWID") ? ["Reducing HIV risk from injecting drug use"] : []),
    ...(groups.includes("SW") || groups.includes("Client of sex worker") ? ["Safer sex, condoms, and STI prevention"] : []),
    ...(flags.includes("No condom use") || flags.includes("Inconsistent condom use") ? ["Correct condom and lubricant use"] : []),
    ...(flags.includes("Needs post-violence care") || flags.includes("Urgent support requested") ? ["Getting help after sexual violence"] : [])
  ];

  document.getElementById("riskTitle").textContent = knownPositive
    ? "Already living with HIV"
    : isHighRisk
      ? "High Risk Group identified"
      : "No risk at all";
  document.getElementById("riskDetail").textContent = knownPositive
    ? "You told us you have tested positive. This summary focuses on treatment, care, and staying healthy rather than prevention."
    : "This is not a diagnosis. It is a private screening summary to help you choose HIV prevention, testing, counselling, and referral services.";
  const meter = document.getElementById("riskMeter");
  meter.textContent = level;
  meter.className = `risk-meter ${riskClass}`;

  const fillList = (id, items) => {
    const list = document.getElementById(id);
    list.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  };

  document.getElementById("reportClientNumber").textContent = `Client ${clientNumber}`;
  fillList("profileList", [
    `Client number: ${clientNumber}`,
    `Queue number: ${queueNumber || "Not assigned"}`,
    `Entry point: ${registration.entryPoint || "Not recorded"}`,
    `Sex: ${profileValue("sex")}`,
    `Age group: ${profileValue("age")}`,
    `Occupation/community: ${profileValue("occupation")}`
  ]);
  fillList("riskGroupList", [groupLabel]);
  document.getElementById("riskGroupList").closest("article").classList.toggle("has-risk", isHighRisk);
  fillList("serviceList", [...new Set(services)]);
  fillList("videoList", [...new Set(videos)]);
  fillList("flagList", flags.length ? flags : ["No major risk flags selected"]);

  videoPlaylist = [...new Set(videos)];
  videoIndex = 0;
};

const resetInterview = () => {
  stopAudio();
  Object.keys(responses).forEach((key) => delete responses[key]);
  prefilledIds.clear();
  clientNumber = generateClientNumber();
  currentIndex = 0;
};

const rotateLandingImages = () => {
  const images = [...document.querySelectorAll(".start-media img")];
  if (images.length < 2) return;
  window.setInterval(() => {
    images[landingImageIndex]?.classList.remove("is-active");
    landingImageIndex = (landingImageIndex + 1) % images.length;
    images[landingImageIndex]?.classList.add("is-active");
  }, 5200);
};

document.getElementById("startButton").addEventListener("click", () => {
  initializeVoices();
  resetRegistration();
  showScreen("register");
});

document.getElementById("regenerateIdButton").addEventListener("click", () => {
  clientNumber = generateClientNumber();
  document.getElementById("registerClientId").textContent = clientNumber;
});

document.getElementById("registerAge").addEventListener("input", (e) => {
  const value = parseInt(e.target.value, 10);
  registration.age = Number.isNaN(value) ? null : value;
  updateRegistrationState();
});

document.querySelectorAll(".entry-option").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".entry-option").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    registration.entryPoint = button.dataset.entry;
    updateRegistrationState();
  });
});

document.querySelectorAll(".finger-option").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".finger-option").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    registration.finger = button.dataset.finger;
    document.querySelectorAll(".scan-pad").forEach((pad) => {
      pad.classList.remove("scanning", "captured");
      pad.querySelector(".scan-status").textContent = "Tap to scan";
    });
    registration.left = false;
    registration.right = false;
    updateRegistrationState();
  });
});

document.querySelectorAll(".scan-pad").forEach((pad) => {
  pad.addEventListener("click", () => runScan(pad, pad.dataset.hand));
});

document.getElementById("registerCancelButton").addEventListener("click", () => showScreen("start"));

document.getElementById("beginInterviewButton").addEventListener("click", () => {
  const group = ageGroupFor(registration.age);
  const ageIndex = BASE_QUESTIONS.find((q) => q.id === "age").options.findIndex((o) => o.value === group);
  if (ageIndex >= 0) {
    responses.age = ageIndex;
    prefilledIds.add("age");
  }
  currentIndex = 0;
  document.getElementById("languageClientNumber").textContent = `Client ${clientNumber}`;
  showScreen("language");
});

document.querySelectorAll(".language-option").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".language-option").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    currentLang = button.dataset.lang;
    questions = getTranslatedQuestions(currentLang);
    document.getElementById("languageSelected").textContent = `Selected: ${LANGUAGE_NAMES[currentLang]}`;
  });
});

document.getElementById("languageBackButton").addEventListener("click", () => showScreen("register"));

document.getElementById("languageContinueButton").addEventListener("click", () => {
  currentIndex = 0;
  showScreen("interview");
  renderQuestion({ autoPlay: true });
});

document.getElementById("previousButton").addEventListener("click", () => {
  if (currentIndex === 0) {
    stopAudio();
    showScreen("language");
    return;
  }
  currentIndex -= 1;
  renderQuestion({ autoPlay: true });
});

document.getElementById("nextButton").addEventListener("click", () => {
  const question = activeQuestions()[currentIndex];
  if (responses[question.id] === undefined) {
    stopAudio();
    speakSegment("Please choose one answer before continuing.");
    return;
  }
  if (currentIndex === activeQuestions().length - 1) {
    buildReport();
    showScreen("video");
    renderVideoScreen();
    return;
  }
  currentIndex += 1;
  renderQuestion({ autoPlay: true });
});

document.getElementById("restartButton").addEventListener("click", () => {
  resetInterview();
  resetRegistration();
  showScreen("register");
});

document.getElementById("editButton").addEventListener("click", () => {
  showScreen("interview");
  renderQuestion({ autoPlay: true });
});

document.getElementById("videoPreviousButton").addEventListener("click", () => {
  if (videoIndex === 0) {
    // Step back into the interview at its last question.
    currentIndex = Math.max(activeQuestions().length - 1, 0);
    showScreen("interview");
    renderQuestion({ autoPlay: false });
    return;
  }
  videoIndex -= 1;
  renderVideoScreen();
});

document.getElementById("videoNextButton").addEventListener("click", () => {
  if (videoIndex === videoPlaylist.length - 1) {
    showScreen("report");
    return;
  }
  videoIndex += 1;
  renderVideoScreen();
});

document.getElementById("skipVideosButton").addEventListener("click", () => showScreen("report"));

document.getElementById("printButton").addEventListener("click", () => window.print());

document.getElementById("newInterviewButton").addEventListener("click", () => {
  resetInterview();
  showScreen("start");
});

initializeVoices();
rotateLandingImages();
