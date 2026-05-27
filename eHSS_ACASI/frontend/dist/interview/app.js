const questions = [
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
    id: "sti",
    text: "Have you had genital sores, discharge, pain, or burning when urinating?",
    help: "These symptoms may need clinical assessment.",
    options: [
      { label: "No", score: 0 },
      { label: "Yes", score: 3, flag: "Possible STI symptoms" },
      { label: "I am not sure", score: 1 },
      { label: "Prefer not to answer", score: 0 }
    ]
  },
  {
    id: "prep",
    text: "Would you like information about PrEP for HIV prevention?",
    help: "PrEP is one prevention option for people with ongoing HIV risk.",
    options: [
      { label: "Yes", score: 1, flag: "Interested in PrEP" },
      { label: "No", score: 0 },
      { label: "I am already on PrEP", score: 0, flag: "PrEP follow-up" },
      { label: "I need counselling first", score: 1, flag: "PrEP counselling" }
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
  },
  {
    id: "alcohol",
    text: "Does alcohol or drug use make it harder for you to make safer sex choices?",
    help: "This can help identify counselling topics.",
    options: [
      { label: "No", score: 0 },
      { label: "Sometimes", score: 1, flag: "Alcohol or drug counselling" },
      { label: "Often", score: 2, flag: "Alcohol or drug counselling" },
      { label: "Prefer not to answer", score: 0 }
    ]
  },
  {
    id: "population",
    text: "Do you identify with any group that may need focused HIV prevention support?",
    help: "Examples include fisher folk, sex workers, MSM, PWID, AGYW, PBFW, and mobile populations.",
    options: [
      { label: "Yes", score: 2, flag: "People at higher risk for HIV" },
      { label: "No", score: 0 },
      { label: "I am not sure", score: 1 },
      { label: "Prefer not to answer", score: 0 }
    ]
  }
];

const responses = {};
let currentIndex = 0;

const screens = {
  start: document.querySelector('[data-screen="start"]'),
  interview: document.querySelector('[data-screen="interview"]'),
  report: document.querySelector('[data-screen="report"]')
};

const showScreen = (screen) => {
  Object.values(screens).forEach((element) => element.classList.add("hidden"));
  screens[screen].classList.remove("hidden");
};

const speak = (text) => {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
};

const renderQuestion = () => {
  const question = questions[currentIndex];
  document.getElementById("questionCounter").textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  document.getElementById("questionText").textContent = question.text;
  document.getElementById("questionHelp").textContent = question.help;
  document.getElementById("progressBar").style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
  document.getElementById("previousButton").disabled = currentIndex === 0;
  document.getElementById("nextButton").textContent = currentIndex === questions.length - 1 ? "Generate report" : "Next";

  const grid = document.getElementById("optionsGrid");
  grid.innerHTML = "";
  question.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option.label;
    if (responses[question.id] === optionIndex) button.classList.add("selected");
    button.addEventListener("click", () => {
      responses[question.id] = optionIndex;
      renderQuestion();
    });
    grid.appendChild(button);
  });
};

const selectedOptions = () =>
  questions
    .map((question) => {
      const selectedIndex = responses[question.id];
      if (selectedIndex === undefined) return null;
      return { question, option: question.options[selectedIndex] };
    })
    .filter(Boolean);

const buildReport = () => {
  const selected = selectedOptions();
  const score = selected.reduce((sum, item) => sum + item.option.score, 0);
  const flags = [...new Set(selected.map((item) => item.option.flag).filter(Boolean))];
  const high = score >= 9 || flags.includes("Needs post-violence care") || flags.includes("Urgent support requested");
  const moderate = !high && score >= 4;
  const level = high ? "High" : moderate ? "Moderate" : "Lower";
  const riskClass = high ? "high" : moderate ? "moderate" : "";

  const services = [
    "HIV testing and result counselling",
    ...(flags.includes("Interested in PrEP") || flags.includes("PrEP counselling") ? ["PrEP eligibility counselling"] : []),
    ...(flags.includes("Possible STI symptoms") ? ["STI screening and treatment"] : []),
    ...(flags.includes("Needs post-violence care") || flags.includes("Urgent support requested") ? ["Post-violence care and urgent psychosocial support"] : []),
    ...(flags.includes("No condom use") || flags.includes("Inconsistent condom use") ? ["Condoms, lubricants, and safer sex counselling"] : []),
    "Referral to a trained health worker for confidential support"
  ];

  const videos = [
    "Understanding HIV risk and testing options",
    ...(flags.includes("Interested in PrEP") || flags.includes("PrEP counselling") ? ["How PrEP works and when to use it"] : []),
    ...(flags.includes("No condom use") || flags.includes("Inconsistent condom use") ? ["Correct condom and lubricant use"] : []),
    ...(flags.includes("Alcohol or drug counselling") ? ["Alcohol, drug use, and safer decision making"] : []),
    ...(flags.includes("Needs post-violence care") || flags.includes("Urgent support requested") ? ["Getting help after sexual violence"] : [])
  ];

  document.getElementById("riskTitle").textContent = `${level} risk signal`;
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

  fillList("serviceList", [...new Set(services)]);
  fillList("videoList", [...new Set(videos)]);
  fillList("flagList", flags.length ? flags : ["No major risk flags selected"]);
};

document.getElementById("startButton").addEventListener("click", () => {
  showScreen("interview");
  renderQuestion();
});

document.getElementById("audioButton").addEventListener("click", () => {
  const question = questions[currentIndex];
  const played = speak(`${question.text}. ${question.help}`);
  document.getElementById("audioStatus").textContent = played ? "Playing question audio" : "Audio is not available in this browser";
});

document.getElementById("previousButton").addEventListener("click", () => {
  currentIndex = Math.max(currentIndex - 1, 0);
  renderQuestion();
});

document.getElementById("nextButton").addEventListener("click", () => {
  const question = questions[currentIndex];
  if (responses[question.id] === undefined) {
    speak("Please choose one answer before continuing.");
    return;
  }
  if (currentIndex === questions.length - 1) {
    buildReport();
    showScreen("report");
    return;
  }
  currentIndex += 1;
  renderQuestion();
});

document.getElementById("restartButton").addEventListener("click", () => {
  Object.keys(responses).forEach((key) => delete responses[key]);
  currentIndex = 0;
  renderQuestion();
});

document.getElementById("editButton").addEventListener("click", () => {
  showScreen("interview");
  renderQuestion();
});

document.getElementById("printButton").addEventListener("click", () => window.print());

document.getElementById("newInterviewButton").addEventListener("click", () => {
  Object.keys(responses).forEach((key) => delete responses[key]);
  currentIndex = 0;
  showScreen("start");
});
