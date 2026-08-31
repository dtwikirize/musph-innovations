const generateClientNumber = () => {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ACASI-${stamp}-${suffix}`;
};

const questions = [
  {
    id: "sex",
    text: "What is your sex?",
    help: "This helps the system provide the right screening summary.",
    options: [
      { label: "Female", score: 0, value: "Female" },
      { label: "Male", score: 0, value: "Male" }
    ]
  },
  {
    id: "age",
    text: "What is your age group?",
    help: "Choose the age group that fits you best.",
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
    help: "This helps identify people who may benefit from focused HIV prevention support.",
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
    help: "Your answer is private and helps recommend confidential services.",
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
    help: "Choose the answer that best describes your situation.",
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
    help: "This helps recommend harm reduction and HIV prevention services.",
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
    help: "Choose the answer that best describes your situation.",
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
    help: "This helps recommend prevention services.",
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
    help: "Recent testing helps you know your current status.",
    options: [
      { label: "Yes, and I know my result", score: 0 },
      { label: "No", score: 2, flag: "Needs HIV testing" },
      { label: "I tested, but do not know the result", score: 1, flag: "Needs result follow-up" },
      { label: "Prefer not to answer", score: 0 }
    ]
  },
  {
    id: "violence",
    text: "Have you experienced forced sex or sexual violence recently?",
    help: "You can choose not to answer. Support services are available.",
    options: [
      { label: "No", score: 0 },
      { label: "Yes", score: 4, flag: "Needs post-violence care" },
      { label: "Prefer not to answer", score: 0 },
      { label: "I need help now", score: 4, flag: "Urgent support requested" }
    ]
  }
];

const responses = {};
let currentIndex = 0;
let clientNumber = generateClientNumber();
let speechRun = 0;
let speechTimer = null;
let preferredVoice = null;
let landingImageIndex = 0;

const screens = {
  start: document.querySelector('[data-screen="start"]'),
  interview: document.querySelector('[data-screen="interview"]'),
  report: document.querySelector('[data-screen="report"]')
};

const showScreen = (screen) => {
  Object.values(screens).forEach((element) => element.classList.add("hidden"));
  screens[screen].classList.remove("hidden");
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
  const question = questions[currentIndex];
  const run = ++speechRun;
  stopAudio();
  speechRun = run;
  document.getElementById("audioStatus").textContent = "Playing question and options";

  const queue = [
    { text: `${question.text}. ${question.help}` },
    ...question.options.map((option, index) => ({ text: option.label, optionIndex: index }))
  ];

  const playNext = (index = 0) => {
    if (run !== speechRun) return;
    clearOptionSpeech();
    const item = queue[index];
    if (!item) {
      document.getElementById("audioStatus").textContent = "Audio complete";
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
      document.getElementById("audioStatus").textContent = "Audio is not available in this browser";
    }
  };

  playNext();
};

const setNextButtonLabel = () => {
  const label = currentIndex === questions.length - 1 ? "Generate report" : "Next";
  document.getElementById("nextButton").innerHTML = `${label}
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13m-5-5 5 5-5 5" />
    </svg>`;
};

const renderQuestion = ({ autoPlay = false } = {}) => {
  stopAudio();
  const question = questions[currentIndex];
  document.getElementById("clientNumberLabel").textContent = `Client ${clientNumber}`;
  document.getElementById("questionCounter").textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  document.getElementById("questionText").textContent = question.text;
  document.getElementById("questionHelp").textContent = question.help;
  document.getElementById("progressBar").style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
  document.getElementById("previousButton").disabled = currentIndex === 0;
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
      renderQuestion();
    });
    grid.appendChild(button);
  });

  document.getElementById("audioStatus").textContent = "Audio will play automatically";
  if (autoPlay) speechTimer = window.setTimeout(playQuestionAudio, 350);
};

const selectedOptions = () =>
  questions
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

  const services = [
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
    "Understanding HIV risk and testing options",
    ...(isHighRisk ? ["Services for people at higher risk for HIV"] : []),
    ...(groups.includes("PWID") ? ["Reducing HIV risk from injecting drug use"] : []),
    ...(groups.includes("SW") || groups.includes("Client of sex worker") ? ["Safer sex, condoms, and STI prevention"] : []),
    ...(flags.includes("No condom use") || flags.includes("Inconsistent condom use") ? ["Correct condom and lubricant use"] : []),
    ...(flags.includes("Needs post-violence care") || flags.includes("Urgent support requested") ? ["Getting help after sexual violence"] : [])
  ];

  document.getElementById("riskTitle").textContent = isHighRisk ? "High Risk Group identified" : "No risk at all";
  document.getElementById("riskDetail").textContent =
    "This is not a diagnosis. It is a private screening summary to help you choose HIV prevention, testing, counselling, and referral services.";
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
    `Sex: ${profileValue("sex")}`,
    `Age group: ${profileValue("age")}`,
    `Occupation/community: ${profileValue("occupation")}`
  ]);
  fillList("riskGroupList", [groupLabel]);
  fillList("serviceList", [...new Set(services)]);
  fillList("videoList", [...new Set(videos)]);
  fillList("flagList", flags.length ? flags : ["No major risk flags selected"]);
};

const resetInterview = () => {
  stopAudio();
  Object.keys(responses).forEach((key) => delete responses[key]);
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
  showScreen("interview");
  renderQuestion({ autoPlay: true });
});

document.getElementById("audioButton").addEventListener("click", playQuestionAudio);

document.getElementById("previousButton").addEventListener("click", () => {
  currentIndex = Math.max(currentIndex - 1, 0);
  renderQuestion({ autoPlay: true });
});

document.getElementById("nextButton").addEventListener("click", () => {
  const question = questions[currentIndex];
  if (responses[question.id] === undefined) {
    stopAudio();
    speakSegment("Please choose one answer before continuing.");
    return;
  }
  if (currentIndex === questions.length - 1) {
    buildReport();
    showScreen("report");
    return;
  }
  currentIndex += 1;
  renderQuestion({ autoPlay: true });
});

document.getElementById("restartButton").addEventListener("click", () => {
  resetInterview();
  renderQuestion({ autoPlay: true });
});

document.getElementById("editButton").addEventListener("click", () => {
  showScreen("interview");
  renderQuestion({ autoPlay: true });
});

document.getElementById("printButton").addEventListener("click", () => window.print());

document.getElementById("newInterviewButton").addEventListener("click", () => {
  resetInterview();
  showScreen("start");
});

initializeVoices();
rotateLandingImages();
