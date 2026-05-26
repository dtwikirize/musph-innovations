const LOCAL_CSV = "/data/training-data.csv";
const LIVE_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1AW3386YCAvkvU-DYobpaoWWfnNLTbIWthl9Oyc057QdlkinMxlert2sjTcJ8Zr2qewd8Ufio7lqh/pub?gid=328536026&single=true&output=csv";
const ELEARNING_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1AW3386YCAvkvU-DYobpaoWWfnNLTbIWthl9Oyc057QdlkinMxlert2sjTcJ8Zr2qewd8Ufio7lqh/pub?gid=1859402851&single=true&output=csv";
const CRANE_POWER_BI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiNDgyZWM2YTEtOTcwMC00ZjMyLTk4NDAtZWY3YTU5ZGVmYjZmIiwidCI6ImE3ZmQyYTY4LTAxYzgtNDMzMy1hOTgzLTlmMzdkZTJjZWJkYyJ9";
const HOME_HERO_IMAGES = [
  "/images/portal-hero.webp",
  "/images/home-hero-digital-1.webp",
  "/images/home-hero-digital-2.webp",
  "/images/home-hero-digital-3.webp",
];

const palette = {
  navy: "#14345c",
  teal: "#22aaa1",
  coral: "#e66c61",
  gold: "#e4a900",
  green: "#2f9f6b",
  violet: "#7445c6",
  blue: "#2f58bf",
  muted: "#657188",
};

const premiumSelects = new Map();
const portalHeader = document.querySelector(".portal-header");
const portalView = document.querySelector("#portalView");
const portalMain = document.querySelector("#mainContent");
const portalFooter = document.querySelector("#portalFooter");
const primaryNav = document.querySelector("#primaryNav");
const menuToggle = document.querySelector("#menuToggle");
const innovationMenu = document.querySelector("#innovationMenu");
const trainingLanding = document.querySelector("#trainingLanding");
const dashboardStage = document.querySelector("#dashboardStage");
const landingSlides = [...document.querySelectorAll(".landing-slide")];
const landingDots = [...document.querySelectorAll(".landing-dots button")];
const enterDashboard = document.querySelector("#enterDashboard");
const metaDescription = document.querySelector('meta[name="description"]');
const canonicalLink = document.querySelector('link[rel="canonical"]');
const ogTitle = document.querySelector('meta[property="og:title"]');
const ogDescription = document.querySelector('meta[property="og:description"]');
const ogUrl = document.querySelector('meta[property="og:url"]');

const SITE_NAME = "MakSPH Digital Health Innovations";
const HOME_DESCRIPTION =
  "A unified portfolio of digital health innovations developed by Makerere University School of Public Health under the CRANE Survey Project in partnership with the Ministry of Health.";
const PUBLIC_DOMAIN = "https://musph.cc";

const innovations = [
  {
    slug: "netlife",
    title: "Netlife Online DIC",
    path: "/innovations/netlife",
    summary:
      "Virtual access to screening, appointments, referrals, and linkage to care through an online extension of physical Drop-In Centers.",
    purpose: "Expands confidential access and supports continuity of care.",
    icon: "phone",
    theme: "purple",
    image: "/images/netlife-hero.webp",
  },
  {
    slug: "virtual-academy",
    title: "Virtual Academy",
    path: "/innovations/virtual-academy",
    summary:
      "A centralized online learning platform for professional health training and workforce capacity building.",
    purpose: "Extends professional development while reducing travel and service disruption.",
    icon: "book",
    theme: "green",
    image: "/images/virtual-academy-hero.webp",
  },
  {
    slug: "training-database",
    title: "Training Database & Dashboard",
    path: "/innovations/training-database",
    summary:
      "A centralized system for tracking trained health workers, geographic coverage, and workforce capacity-building outputs.",
    purpose: "Supports accountability and real-time workforce monitoring.",
    icon: "chart",
    theme: "blue",
    image: "/images/training-hero-1.webp",
  },
  {
    slug: "crane-dashboard",
    title: "CRANE Dashboard",
    path: "/innovations/crane-dashboard",
    summary:
      "Interactive oversight of bio-behavioral survey sampling progress and surveillance outputs.",
    purpose: "Improves access to timely surveillance intelligence.",
    icon: "map",
    theme: "teal",
    image: "/images/crane-dashboard-hero.webp",
  },
  {
    slug: "acasi",
    title: "ACASI System",
    path: "/innovations/acasi",
    summary:
      "Private digital screening, risk assessment, triage, and service linkage through self-guided workflows.",
    purpose: "Strengthens confidentiality, data quality, and rapid linkage.",
    icon: "shield",
    theme: "gold",
    image: "/images/acasi-hero.webp",
  },
];

const routeMeta = {
  "/": {
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
  },
  "/innovations": {
    title: `Digital Health Innovation Portfolio | ${SITE_NAME}`,
    description:
      "Explore the MakSPH digital health innovation portfolio supporting access, workforce capacity, surveillance, and integrated health service delivery.",
  },
  "/innovations/netlife": {
    title: `Netlife Online Drop-In-Center | ${SITE_NAME}`,
    description:
      "Netlife supports online screening, health information, appointments, referrals, and linkage to physical care.",
  },
  "/innovations/virtual-academy": {
    title: `MakSPH Virtual Academy | ${SITE_NAME}`,
    description:
      "The MakSPH Virtual Academy supports self-paced online learning and professional health workforce development.",
  },
  "/innovations/training-database": {
    title: `Training Database & Dashboard | ${SITE_NAME}`,
    description:
      "A centralized system for tracking trained health workers, training coverage, and workforce capacity-building outputs.",
  },
  "/innovations/crane-dashboard": {
    title: `CRANE BBS Sampling & Stewardship Dashboard | ${SITE_NAME}`,
    description:
      "An interactive dashboard providing real-time oversight of bio-behavioral survey sampling progress and surveillance outputs.",
  },
  "/innovations/crane-dashboard/live": {
    title: `Live CRANE BBS Dashboard | ${SITE_NAME}`,
    description:
      "Full-screen live access to the CRANE BBS Sampling and Stewardship Dashboard.",
  },
  "/innovations/acasi": {
    title: `ACASI System | ${SITE_NAME}`,
    description:
      "An Audio Computer-Assisted Self-Interview system supporting private screening, risk assessment, triage, and service linkage.",
  },
};

let landingSlideIndex = 0;
let landingTimer;
let homeHeroSlideIndex = 0;
let homeHeroTimer;
let revealObserver;

const state = {
  rows: [],
  filtered: [],
  elearningRows: [],
  filteredElearning: [],
  elearningError: "",
  activeView: "overview",
  filters: {
    search: "",
    course: "All",
    district: "All",
    year: "All",
    sex: "All",
    mechanism: "All",
    completion: "All",
  },
};

const els = {
  searchInput: document.querySelector("#searchInput"),
  courseFilter: document.querySelector("#courseFilter"),
  mechanismFilter: document.querySelector("#mechanismFilter"),
  completionFilter: document.querySelector("#completionFilter"),
  districtFilter: document.querySelector("#districtFilter"),
  yearFilter: document.querySelector("#yearFilter"),
  sexFilter: document.querySelector("#sexFilter"),
  scopedFilters: document.querySelectorAll("[data-filter-scope]"),
  navItems: document.querySelectorAll(".nav-item[data-view]"),
  panels: document.querySelectorAll(".panel[data-section]"),
  activeViewLabel: document.querySelector("#activeViewLabel"),
  dashboardTitle: document.querySelector("#dashboardTitle"),
  dashboardDescription: document.querySelector("#dashboardDescription"),
  filterSummary: document.querySelector("#filterSummary"),
  activeFilters: document.querySelector("#activeFilters"),
  resetFilters: document.querySelector("#resetFilters"),
  refreshData: document.querySelector("#refreshData"),
  toggleFilters: document.querySelector("#toggleFilters"),
  dateWindow: document.querySelector("#dateWindow strong"),
  kpiParticipants: document.querySelector("#kpiParticipants"),
  kpiFacilities: document.querySelector("#kpiFacilities"),
  kpiPre: document.querySelector("#kpiPre"),
  kpiPost: document.querySelector("#kpiPost"),
  kpiGain: document.querySelector("#kpiGain"),
  kpiGainContext: document.querySelector("#kpiGainContext"),
  trendChart: document.querySelector("#trendChart"),
  sexDonut: document.querySelector("#sexDonut"),
  sexLegend: document.querySelector("#sexLegend"),
  courseBars: document.querySelector("#courseBars"),
  gainTrendChart: document.querySelector("#gainTrendChart"),
  districtGainBars: document.querySelector("#districtGainBars"),
  districtRateBars: document.querySelector("#districtRateBars"),
  districtBars: document.querySelector("#districtBars"),
  courseMixDonut: document.querySelector("#courseMixDonut"),
  courseMixLegend: document.querySelector("#courseMixLegend"),
  jobBars: document.querySelector("#jobBars"),
  organizationBars: document.querySelector("#organizationBars"),
  organizationRateBars: document.querySelector("#organizationRateBars"),
  participantTable: document.querySelector("#participantTable"),
  rowCount: document.querySelector("#rowCount"),
  dateRange: document.querySelector("#dateRange"),
  dbRecords: document.querySelector("#dbRecords"),
  dbFacilities: document.querySelector("#dbFacilities"),
  dbCourses: document.querySelector("#dbCourses"),
  dbCompleteness: document.querySelector("#dbCompleteness"),
  elearningRecords: document.querySelector("#elearningRecords"),
  elearningCompletion: document.querySelector("#elearningCompletion"),
  elearningAvgGrade: document.querySelector("#elearningAvgGrade"),
  elearningVisits: document.querySelector("#elearningVisits"),
  elearningStatusBars: document.querySelector("#elearningStatusBars"),
  elearningDistrictBars: document.querySelector("#elearningDistrictBars"),
  elearningDistrictCompletionBars: document.querySelector("#elearningDistrictCompletionBars"),
  elearningMechanismBars: document.querySelector("#elearningMechanismBars"),
  elearningCadreBars: document.querySelector("#elearningCadreBars"),
  elearningTimeline: document.querySelector("#elearningTimeline"),
  elearningTable: document.querySelector("#elearningTable"),
  elearningRowCount: document.querySelector("#elearningRowCount"),
  focusLayer: document.querySelector("#focusLayer"),
  focusTitle: document.querySelector("#focusTitle"),
  focusBody: document.querySelector("#focusBody"),
  toast: document.querySelector("#toast"),
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows.shift().map((header) => header.trim()).filter(Boolean);
  return rows
    .filter((line) => line.some((cell) => String(cell).trim()))
    .map((line) =>
      headers.reduce((entry, header, index) => {
        entry[header] = (line[index] || "").trim();
        return entry;
      }, {}),
    );
}

function parseDate(value) {
  if (!value) return null;
  const clean = value.trim();
  const months = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  const match = clean.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return new Date(Number(year), months[month.toLowerCase()], Number(day));
  }
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const fallback = new Date(clean);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function normalizeRow(row) {
  const pre = Number(row["Pre-Test"]);
  const post = Number(row["Post Test"]);
  const startDate = parseDate(row["Starting date"]);
  const endDate = parseDate(row["Ending date"]);
  const course = cleanLabel(row["Course Name"]) || "Unspecified course";
  const district = cleanDistrict(row.District);
  const sex = cleanLabel(row.Sex) || "Unspecified";

  return {
    serial: cleanLabel(row["S/N"]),
    name: cleanLabel(row.Name) || "Unnamed participant",
    sex: sex.toLowerCase() === "female" ? "Female" : sex.toLowerCase() === "male" ? "Male" : sex,
    jobTitle: cleanLabel(row["Job title"]) || "Unspecified role",
    organization: cleanLabel(row.Organization) || "Unspecified organization",
    facility: cleanLabel(row["Health Facility"]) || "Unspecified facility",
    district: district || "Unspecified district",
    telephone: cleanLabel(row["Telephone no"]),
    course,
    startDate,
    endDate,
    startYear: startDate ? String(startDate.getFullYear()) : "Unknown",
    startMonth: startDate ? monthKey(startDate) : "Unknown",
    pre: Number.isFinite(pre) ? pre : null,
    post: Number.isFinite(post) ? post : null,
    gain: Number.isFinite(pre) && Number.isFinite(post) ? post - pre : null,
  };
}

function cleanLabel(value) {
  return String(value || "").replace(/\\+/g, "").replace(/\s+/g, " ").trim();
}

function cleanDistrict(value) {
  const district = cleanLabel(value);
  if (!district) return "";
  return district
    .replace(/\s*,\s*/g, ", ")
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : word))
    .join(" ");
}

function isRealDistrict(value) {
  return Boolean(value && !/^unspecified/i.test(value) && value !== "Unknown");
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  if (key === "Unknown") return key;
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(value || 0));
}

function formatScore(value) {
  return value == null || Number.isNaN(value) ? "N/A" : `${Math.round(value)}%`;
}

function average(rows, key) {
  const values = rows.map((row) => row[key]).filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentImprovement(row) {
  return Number.isFinite(row.pre) && Number.isFinite(row.post) && row.pre > 0
    ? ((row.post - row.pre) / row.pre) * 100
    : null;
}

function durationDays(row) {
  if (!row.startDate || !row.endDate) return null;
  const days = Math.round((row.endDate.getTime() - row.startDate.getTime()) / 86400000);
  return days >= 0 && days <= 365 ? days : null;
}

function groupBy(rows, key) {
  return rows.reduce((map, row) => {
    const label = typeof key === "function" ? key(row) : row[key];
    map.set(label, [...(map.get(label) || []), row]);
    return map;
  }, new Map());
}

function countBy(rows, key) {
  return [...groupBy(rows, key)]
    .map(([name, items]) => ({ name, count: items.length, rows: items }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function fillSelect(select, values, current = "All") {
  select.innerHTML = "";
  ["All", ...values].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
  select.value = values.includes(current) ? current : "All";
  renderPremiumSelect(select);
  return select.value;
}

function renderPremiumSelect(select) {
  select.classList.add("native-select");
  let control = premiumSelects.get(select.id);

  if (!control) {
    control = createPremiumSelect(select);
    premiumSelects.set(select.id, control);
    select.insertAdjacentElement("afterend", control.root);
  }

  const options = [...select.options].map((option) => ({
    value: option.value,
    label: option.textContent,
  }));
  const current = options.find((option) => option.value === select.value) || options[0];

  control.value.textContent = current?.label || "All";
  control.options.innerHTML = options
    .map(
      (option) => `<button class="premium-select-option ${
        option.value === select.value ? "active" : ""
      }" type="button" data-value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</button>`,
    )
    .join("");
}

function createPremiumSelect(select) {
  const root = document.createElement("div");
  root.className = `premium-select premium-${select.id}`;
  root.innerHTML = `
    <button class="premium-select-button" type="button" aria-haspopup="listbox" aria-expanded="false">
      <span class="premium-select-value">All</span>
      <span class="premium-select-chevron">v</span>
    </button>
    <div class="premium-select-menu">
      <input class="premium-select-search" type="search" placeholder="Search options..." />
      <div class="premium-select-options" role="listbox"></div>
    </div>
  `;

  const button = root.querySelector(".premium-select-button");
  const value = root.querySelector(".premium-select-value");
  const search = root.querySelector(".premium-select-search");
  const options = root.querySelector(".premium-select-options");

  button.addEventListener("click", () => {
    const shouldOpen = !root.classList.contains("open");
    closePremiumSelects();
    root.classList.toggle("open", shouldOpen);
    button.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) {
      search.value = "";
      filterPremiumOptions(options, "");
      search.focus();
    }
  });

  search.addEventListener("input", () => filterPremiumOptions(options, search.value));

  options.addEventListener("click", (event) => {
    const option = event.target.closest(".premium-select-option");
    if (!option) return;
    select.value = option.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    closePremiumSelects();
  });

  return { root, button, value, search, options };
}

function filterPremiumOptions(container, query) {
  const needle = query.trim().toLowerCase();
  container.querySelectorAll(".premium-select-option").forEach((option) => {
    option.hidden = needle && !option.textContent.toLowerCase().includes(needle);
  });
}

function closePremiumSelects() {
  premiumSelects.forEach((control) => {
    control.root.classList.remove("open");
    control.button.setAttribute("aria-expanded", "false");
  });
}

function showLandingSlide(index) {
  landingSlideIndex = index;
  landingSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === index);
  });
  landingDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
  });
}

function startLandingSlideshow() {
  window.clearInterval(landingTimer);
  landingTimer = window.setInterval(() => {
    showLandingSlide((landingSlideIndex + 1) % landingSlides.length);
  }, 5200);
}

function stopLandingSlideshow() {
  window.clearInterval(landingTimer);
}

function parsePercent(value) {
  const number = Number(String(value || "").replace("%", "").trim());
  return Number.isFinite(number) ? number : null;
}

function normalizeElearningRow(row) {
  const enrolledDate = parseDate(row["Enrolled On"]);
  const completionDate = /^na$/i.test(cleanLabel(row["Course Completion Date"]))
    ? null
    : parseDate(row["Course Completion Date"]);
  const visits = Number(row["Number of Visits"]);
  const completed = /^yes$/i.test(cleanLabel(row["Course Completion"]));
  const district = cleanDistrict(row.District) || "Unspecified district";

  return {
    id: cleanLabel(row.ID),
    username: cleanLabel(row.Username),
    fullName: cleanLabel(row["Full Name"]) || "Unnamed learner",
    district,
    mechanism: cleanLabel(row.Mechanism) || "Unspecified mechanism",
    organizationUnit: cleanLabel(row["Organisation Unit"]) || "Unspecified unit",
    department: cleanLabel(row.Department) || "Unspecified cadre",
    enrolledDate,
    enrolledYear: enrolledDate ? String(enrolledDate.getFullYear()) : "Unknown",
    enrolledMonth: enrolledDate ? monthKey(enrolledDate) : "Unknown",
    visits: Number.isFinite(visits) ? visits : 0,
    completed,
    completionLabel: completed ? "Completed" : "In progress",
    completionDate,
    grade: parsePercent(row.Grade),
  };
}

function showHomeHeroSlide(hero, index) {
  const slides = [...hero.querySelectorAll(".portal-hero-slide")];
  const dots = [...hero.querySelectorAll("[data-home-hero-slide]")];
  if (!slides.length) return;

  homeHeroSlideIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === homeHeroSlideIndex);
    slide.classList.toggle("is-previous", slideIndex < homeHeroSlideIndex);
  });
  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === homeHeroSlideIndex);
  });
}

function startHomeHeroSlideshow(hero) {
  stopHomeHeroSlideshow();
  const slides = [...hero.querySelectorAll(".portal-hero-slide")];
  if (slides.length < 2) return;

  showHomeHeroSlide(hero, homeHeroSlideIndex);
  hero.querySelectorAll("[data-home-hero-slide]").forEach((dot) => {
    dot.addEventListener("click", () => {
      showHomeHeroSlide(hero, Number(dot.dataset.homeHeroSlide));
      startHomeHeroSlideshow(hero);
    });
  });
  homeHeroTimer = window.setInterval(() => {
    showHomeHeroSlide(hero, homeHeroSlideIndex + 1);
  }, 6500);
}

function stopHomeHeroSlideshow() {
  window.clearInterval(homeHeroTimer);
}

function iconMarkup(name) {
  const icons = {
    access: '<path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"></path><circle cx="12" cy="10" r="2.25"></circle>',
    training: '<path d="M4 6.5 12 3l8 3.5-8 3.5-8-3.5Z"></path><path d="M7 9.5v4c0 1.8 2.2 3.5 5 3.5s5-1.7 5-3.5v-4"></path>',
    data: '<path d="M4 19V9M10 19V5M16 19v-8M22 19V3"></path>',
    systems: '<rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M8 12h8M12 8v8"></path>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M11 18h2"></path>',
    book: '<path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 0 5 22V4.5Z"></path><path d="M5 18h15"></path>',
    chart: '<path d="M4 20h16"></path><path d="M7 20V11h4v9"></path><path d="M13 20V5h4v15"></path>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"></path><path d="M9 3v15M15 6v15"></path>',
    shield: '<path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z"></path><path d="M9 12l2 2 4-5"></path>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"></path>',
    external: '<path d="M14 3h7v7"></path><path d="M10 14 21 3"></path><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path>',
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.systems}</svg>`;
}

function sectionHeader(title, copy) {
  return `
    <div class="section-header">
      <h2>${title}</h2>
      <p>${copy}</p>
    </div>
  `;
}

function ctaButton(label, href, variant = "") {
  const className = ["cta-button", variant].filter(Boolean).join(" ");
  return `<a class="${className}" href="${href}" data-route="${href}">
    <span>${label}</span>
    <span class="button-icon">${iconMarkup("arrow")}</span>
  </a>`;
}

function externalLinkButton(label, href, variant = "") {
  const className = ["text-link-button", variant].filter(Boolean).join(" ");
  return `<a class="${className}" href="${href}" target="_blank" rel="noopener noreferrer">
    <span>${label}</span>
    <span class="button-icon">${iconMarkup("external")}</span>
  </a>`;
}

function heroSection({ title, copy, image, images = [], buttons }) {
  const heroImages = images.length ? images : [image];
  const hasCarousel = heroImages.length > 1;
  return `
    <section class="portal-hero"${hasCarousel ? " data-hero-carousel" : ""}>
      <div class="portal-hero-media" aria-hidden="true">
        ${heroImages
          .map(
            (heroImage, index) => `<span class="portal-hero-slide${
              index === 0 ? " is-active" : ""
            }" style="background-image: url('${heroImage}')"></span>`,
          )
          .join("")}
      </div>
      <div class="hero-effects" aria-hidden="true">
        <span class="hero-orbit one"></span>
        <span class="hero-orbit two"></span>
        <span class="hero-scanline"></span>
      </div>
      <div class="portal-hero-inner">
        <div class="portal-hero-copy">
          <h1>${title}</h1>
          <p>${copy}</p>
          <div class="button-row">${buttons.join("")}</div>
          ${
            hasCarousel
              ? `<div class="hero-slide-dots" aria-label="Home hero slides">
                  ${heroImages
                    .map(
                      (_, index) => `<button class="${
                        index === 0 ? "is-active" : ""
                      }" type="button" data-home-hero-slide="${index}" aria-label="Show hero image ${
                        index + 1
                      }"></button>`,
                    )
                    .join("")}
                </div>`
              : ""
          }
        </div>
      </div>
    </section>
  `;
}

function pageBanner({ title, copy, image, buttons = [], theme = "" }) {
  const className = ["page-banner", theme ? `theme-${theme}` : ""].filter(Boolean).join(" ");
  return `
    <section class="${className}">
      <div class="page-banner-media" style="background-image: url('${image}')"></div>
      <div class="hero-effects" aria-hidden="true">
        <span class="hero-orbit one"></span>
        <span class="hero-orbit two"></span>
        <span class="hero-scanline"></span>
      </div>
      <div class="page-banner-inner">
        <div class="page-banner-copy">
          <h1>${title}</h1>
          <p>${copy}</p>
          ${buttons.length ? `<div class="button-row">${buttons.join("")}</div>` : ""}
        </div>
      </div>
    </section>
  `;
}

function featureGrid(items) {
  return `
    <div class="feature-grid">
      ${items
        .map(
          (item) => `
            <article class="feature-card reveal">
              <span class="icon-chip">${iconMarkup(item.icon)}</span>
              <h3>${item.title}</h3>
              <p>${item.copy}</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function innovationCard(item) {
  return `
    <article class="innovation-card theme-${item.theme} reveal">
      <figure class="innovation-card-media">
        <img src="${item.image}" alt="" loading="lazy" />
      </figure>
      <header>
        <span class="icon-chip">${iconMarkup(item.icon)}</span>
        <div>
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
        </div>
      </header>
      <span>${item.purpose}</span>
      ${ctaButton("Learn More", item.path, "theme-button")}
    </article>
  `;
}

function renderHomePage() {
  return `
    ${heroSection({
      title: SITE_NAME,
      copy:
        "A unified portfolio of digital innovations developed by Makerere University School of Public Health under the CRANE Survey Project in partnership with the Ministry of Health to improve access, strengthen workforce capacity, support surveillance, and enhance data-driven decision-making.",
      images: HOME_HERO_IMAGES,
      buttons: [
        ctaButton("Explore Innovations", "/innovations"),
        ctaButton("View Training Dashboard", "/innovations/training-database", "secondary"),
      ],
    })}
    <section class="content-section">
      <div class="section-shell about-layout">
        <div class="about-copy">
          ${sectionHeader(
            "Strengthening Digital Health Service Delivery in Uganda",
            "Uganda's changing implementation context requires innovative approaches to health service delivery, especially for underserved populations and people at higher risk for HIV. These digital innovations support decentralized service delivery, virtual access, workforce development, surveillance, and real-time program monitoring.",
          )}
        </div>
        <figure class="media-frame">
          <img
            src="/images/innovation-about.webp"
            alt="Health workers using digital tools across community outreach and clinic settings"
          />
        </figure>
        ${featureGrid([
          {
            title: "Expanding Access",
            copy: "Extends health information, screening, referrals, and service linkage beyond facility walls.",
            icon: "access",
          },
          {
            title: "Workforce Capacity Building",
            copy: "Supports continuous learning and monitoring of health worker training across locations.",
            icon: "training",
          },
          {
            title: "Real-Time Data Use",
            copy: "Turns program and surveillance data into timely information for operational decisions.",
            icon: "data",
          },
          {
            title: "Sustainable Digital Systems",
            copy: "Builds interoperable tools that can be maintained and used within existing public systems.",
            icon: "systems",
          },
        ])}
      </div>
    </section>
    <section class="content-section muted">
      <div class="section-shell">
        ${sectionHeader(
          "Innovation Portfolio",
          "MakSPH Digital Health Innovations is a unified portfolio of digital tools developed by Makerere University School of Public Health under the CRANE Survey Project in partnership with the Ministry of Health to strengthen integrated health service delivery, workforce capacity, surveillance, and data-driven decision-making for underserved populations including people at higher risk for HIV.",
        )}
        <div class="innovation-grid">
          ${innovations.map(innovationCard).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderInnovationsPage() {
  return `
    ${pageBanner({
      title: "Digital Health Innovation Portfolio",
      copy:
        "These innovations were developed by Makerere University School of Public Health under the CRANE Survey Project in partnership with the Ministry of Health to strengthen access, workforce capacity, surveillance, and integrated health service delivery.",
      image: "/images/portal-hero.webp",
    })}
    <section class="content-section soft">
      <div class="section-shell overview-grid">
        ${innovations
          .map(
            (item) => `
              <article class="overview-panel theme-${item.theme} reveal">
                <figure class="innovation-card-media">
                  <img src="${item.image}" alt="" loading="lazy" />
                </figure>
                <span class="icon-chip">${iconMarkup(item.icon)}</span>
                <div>
                  <h2>${item.title}</h2>
                  <p>${item.summary}</p>
                </div>
                <p>${item.purpose}</p>
                ${ctaButton("Learn More", item.path, "theme-button")}
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderDetailPage({
  title,
  copy,
  image,
  purpose,
  features,
  theme,
  buttons = [],
  extra = "",
}) {
  const themeClass = theme ? `theme-${theme}` : "";
  return `
    ${pageBanner({ title, copy, image, buttons, theme })}
    <section class="content-section detail-section ${themeClass}">
      <div class="section-shell detail-grid">
        <article class="detail-card ${themeClass} reveal">
          <span class="detail-card-label">Purpose</span>
          <h3>Strategic Purpose</h3>
          <ul class="detail-list">
            ${purpose.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </article>
        <article class="detail-card ${themeClass} reveal">
          <span class="detail-card-label">Capabilities</span>
          <h3>Key Features</h3>
          <ul class="detail-list">
            ${features.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </article>
      </div>
    </section>
    ${extra}
  `;
}

function renderVirtualAcademySteps() {
  return `
    <section class="content-section soft">
      <div class="section-shell">
        ${sectionHeader(
          "Access Steps",
          "The academy is structured for straightforward onboarding and course administration.",
        )}
        <div class="step-grid">
          ${[
            "Visit the Virtual Academy",
            "Create a new account",
            "Verify email",
            "Contact course administration for enrollment",
          ]
            .map(
              (step, index) => `
                <article class="step-card reveal">
                  <strong>${index + 1}</strong>
                  <h3>${step}</h3>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderCraneEmbed() {
  return `
    <section class="content-section soft">
      <div class="section-shell">
        ${sectionHeader(
          "Live Dashboard",
          "The dashboard below provides embedded access to the CRANE BBS Sampling and Stewardship view.",
        )}
        <div class="embed-shell" id="craneEmbedShell">
          <div class="embed-loading">Loading CRANE dashboard...</div>
          <iframe
            title="CRANE BBS Sampling and Stewardship Dashboard"
            src="${CRANE_POWER_BI_URL}"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </section>
  `;
}

function renderCraneFullscreenPage() {
  return `
    <section class="crane-live-view">
      <div class="crane-live-toolbar">
        <strong>CRANE BBS Sampling & Stewardship Dashboard</strong>
        <div>
          ${ctaButton("Back to Overview", "/innovations/crane-dashboard", "secondary")}
          ${externalLinkButton(
            "Open in Power BI",
            CRANE_POWER_BI_URL,
          )}
        </div>
      </div>
      <div class="crane-live-frame" id="craneLiveShell">
        <div class="embed-loading">Loading CRANE dashboard...</div>
        <iframe
          title="Live CRANE BBS Sampling and Stewardship Dashboard"
          src="${CRANE_POWER_BI_URL}"
        ></iframe>
      </div>
    </section>
  `;
}

function renderPortalRoute(path) {
  switch (path) {
    case "/":
      return renderHomePage();
    case "/innovations":
      return renderInnovationsPage();
    case "/innovations/netlife":
      return renderDetailPage({
        title: "Netlife Online Drop-In-Center",
        copy:
          "Netlife functions as a virtual extension of physical Drop-In Centers, supporting online screening, health information, appointments, referrals, and linkage to physical care.",
        image: "/images/netlife-hero.webp",
        theme: "purple",
        purpose: [
          "Reduces barriers related to stigma and fear of public exposure",
          "Extends services to hard-to-reach populations",
          "Supports online screening and referrals",
          "Promotes proactive health-seeking behavior",
          "Supports continuity of care",
        ],
        features: [
          "Online screening",
          "Appointment booking",
          "Service linkage",
          "Tele-consultation support",
          "Prevention information access",
          "Referral pathways",
        ],
        buttons: [
          externalLinkButton("Open General User Interface", "https://netlife.cc/"),
          externalLinkButton("Open Service Provider Interface", "http://pro.netlife.cc/"),
        ],
      });
    case "/innovations/virtual-academy":
      return renderDetailPage({
        title: "MakSPH Virtual Academy",
        copy:
          "The MakSPH Virtual Academy is a centralized online learning platform for professional health training and workforce capacity building.",
        image: "/images/virtual-academy-hero.webp",
        theme: "green",
        purpose: [
          "Supports self-paced learning",
          "Reduces travel and logistics costs",
          "Preserves health service delivery",
          "Standardizes training quality",
          "Expands access to professional development",
        ],
        features: [
          "Centralized online learning",
          "Self-paced course access",
          "Professional development support",
          "Course administration pathways",
        ],
        buttons: [
          externalLinkButton("Open Virtual Academy", "https://va.elearning-musph.net:8443/"),
        ],
        extra: renderVirtualAcademySteps(),
      });
    case "/innovations/crane-dashboard":
      return renderDetailPage({
        title: "CRANE BBS Sampling & Stewardship Dashboard",
        copy:
          "An interactive dashboard providing real-time oversight of bio-behavioral survey sampling progress and surveillance outputs.",
        image: "/images/crane-dashboard-hero.webp",
        theme: "teal",
        purpose: [
          "Supports monitoring of sample achievement",
          "Enables surveillance oversight",
          "Improves data accessibility",
          "Supports timely decision-making",
          "Replaces static reporting systems",
        ],
        features: [
          "Sampling progress monitoring",
          "Surveillance output review",
          "Interactive data access",
          "Decision-support visualizations",
        ],
        buttons: [
          ctaButton("Open Full-Screen Dashboard", "/innovations/crane-dashboard/live", "theme-button"),
          externalLinkButton(
            "Open in Power BI",
            CRANE_POWER_BI_URL,
          ),
        ],
        extra: renderCraneEmbed(),
      });
    case "/innovations/crane-dashboard/live":
      return renderCraneFullscreenPage();
    case "/innovations/acasi":
      return renderDetailPage({
        title: "ACASI System",
        copy:
          "An Audio Computer-Assisted Self-Interview system supporting private screening, risk assessment, triage, and service linkage.",
        image: "/images/acasi-hero.webp",
        theme: "gold",
        purpose: [
          "Improves data quality",
          "Reduces interviewer bias",
          "Enhances confidentiality",
          "Supports automated triage",
          "Enables rapid service linkage",
        ],
        features: [
          "Self-guided screening",
          "Audio-assisted interaction",
          "Private risk assessment",
          "Digital referrals",
          "Automated workflows",
        ],
        buttons: [externalLinkButton("Request Access Information", "mailto:info@musph.cc")],
      });
    default:
      return `
        <section class="content-section">
          <div class="section-shell">
            ${sectionHeader(
              "Page not found",
              "The requested page is not available. Use the navigation to return to the innovation portfolio.",
            )}
            ${ctaButton("Back to Innovations", "/innovations")}
          </div>
        </section>
      `;
  }
}

function normalizePath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
}

function updateMeta(path) {
  const meta = routeMeta[path] || routeMeta["/innovations"];
  document.title = meta.title;
  metaDescription?.setAttribute("content", meta.description);
  canonicalLink?.setAttribute("href", `${PUBLIC_DOMAIN}${path}`);
  ogTitle?.setAttribute("content", meta.title);
  ogDescription?.setAttribute("content", meta.description);
  ogUrl?.setAttribute("content", `${PUBLIC_DOMAIN}${path}`);
}

function setActiveNavigation(path, dashboardOpen) {
  document.querySelectorAll(".primary-nav a").forEach((link) => {
    const nav = link.dataset.nav;
    const active =
      (nav === "home" && path === "/") ||
      (nav === "innovations" &&
        path.startsWith("/innovations") &&
        path !== "/innovations/training-database" &&
        !dashboardOpen) ||
      (nav === "training" && path === "/innovations/training-database");
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function closeInnovationMenu() {
  innovationMenu.classList.remove("is-open");
}

function bindDynamicRouteContent() {
  const heroCarousel = document.querySelector("[data-hero-carousel]");
  if (heroCarousel) startHomeHeroSlideshow(heroCarousel);

  const iframe = document.querySelector("#craneEmbedShell iframe");
  if (iframe) {
    iframe.addEventListener("load", () => {
      document.querySelector("#craneEmbedShell")?.classList.add("is-loaded");
    });
  }

  const liveIframe = document.querySelector("#craneLiveShell iframe");
  if (liveIframe) {
    liveIframe.addEventListener("load", () => {
      document.querySelector("#craneLiveShell")?.classList.add("is-loaded");
    });
  }

  revealObserver?.disconnect();
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 },
  );

  document.querySelectorAll(".reveal").forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${Math.min(index * 55, 280)}ms`);
    revealObserver.observe(element);
  });
}

function renderRoute() {
  const path = normalizePath(window.location.pathname);
  const dashboardOpen = path === "/innovations/training-database" && window.location.hash === "#dashboard";
  const trainingLandingOpen = path === "/innovations/training-database" && !dashboardOpen;
  const craneLiveOpen = path === "/innovations/crane-dashboard/live";

  if (window.location.pathname === "/" && window.location.hash === "#dashboard") {
    navigate("/innovations/training-database#dashboard", true);
    return;
  }

  updateMeta(path);
  setActiveNavigation(path, dashboardOpen);
  stopHomeHeroSlideshow();
  primaryNav.classList.remove("is-open");
  closeInnovationMenu();
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.toggle("training-landing-route", trainingLandingOpen);
  document.body.classList.toggle("crane-live-route", craneLiveOpen);

  if (dashboardOpen) {
    portalMain.hidden = true;
    portalFooter.hidden = true;
    trainingLanding.hidden = true;
    dashboardStage.hidden = false;
    stopLandingSlideshow();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  if (trainingLandingOpen) {
    portalMain.hidden = true;
    portalFooter.hidden = true;
    trainingLanding.hidden = false;
    dashboardStage.hidden = true;
    showLandingSlide(landingSlideIndex);
    startLandingSlideshow();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  dashboardStage.hidden = true;
  trainingLanding.hidden = true;
  portalMain.hidden = false;
  portalFooter.hidden = false;
  stopLandingSlideshow();
  portalView.innerHTML = renderPortalRoute(path);
  bindDynamicRouteContent();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function navigate(href, replace = false) {
  const url = new URL(href, window.location.origin);
  const method = replace ? "replaceState" : "pushState";
  window.history[method](null, "", `${url.pathname}${url.hash}`);
  renderRoute();
}

function openDashboard() {
  navigate("/innovations/training-database#dashboard");
}

function uniqueSorted(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function trainingOptionRows(excludeKey) {
  const needle = state.filters.search.toLowerCase();
  return state.rows.filter((row) => {
    const text = `${row.name} ${row.jobTitle} ${row.organization} ${row.facility} ${row.district} ${row.course}`.toLowerCase();
    return (
      (!needle || text.includes(needle)) &&
      (excludeKey === "course" || state.filters.course === "All" || row.course === state.filters.course) &&
      (excludeKey === "district" || state.filters.district === "All" || row.district === state.filters.district) &&
      (excludeKey === "year" || state.filters.year === "All" || row.startYear === state.filters.year) &&
      (excludeKey === "sex" || state.filters.sex === "All" || row.sex === state.filters.sex)
    );
  });
}

function elearningOptionRows(excludeKey) {
  const needle = state.filters.search.toLowerCase();
  return state.elearningRows.filter((row) => {
    const text = `${row.fullName} ${row.username} ${row.mechanism} ${row.organizationUnit} ${row.department} ${row.district} ${row.completionLabel}`.toLowerCase();
    return (
      (!needle || text.includes(needle)) &&
      (excludeKey === "district" || state.filters.district === "All" || row.district === state.filters.district) &&
      (excludeKey === "year" || state.filters.year === "All" || row.enrolledYear === state.filters.year) &&
      (excludeKey === "mechanism" || state.filters.mechanism === "All" || row.mechanism === state.filters.mechanism) &&
      (excludeKey === "completion" || state.filters.completion === "All" || row.completionLabel === state.filters.completion)
    );
  });
}

function setupFilters() {
  const isElearningView = state.activeView === "elearning";
  const districtRows = isElearningView
    ? elearningOptionRows("district").filter((row) => isRealDistrict(row.district))
    : trainingOptionRows("district").filter((row) => isRealDistrict(row.district));
  const yearRows = isElearningView
    ? elearningOptionRows("year")
        .filter((row) => row.enrolledYear !== "Unknown")
        .map((row) => ({ startYear: row.enrolledYear }))
    : trainingOptionRows("year").filter((row) => row.startYear !== "Unknown");

  state.filters.course = fillSelect(
    els.courseFilter,
    uniqueSorted(trainingOptionRows("course"), "course"),
    state.filters.course,
  );
  state.filters.mechanism = fillSelect(
    els.mechanismFilter,
    uniqueSorted(elearningOptionRows("mechanism"), "mechanism"),
    state.filters.mechanism,
  );
  state.filters.completion = fillSelect(
    els.completionFilter,
    uniqueSorted(elearningOptionRows("completion"), "completionLabel"),
    state.filters.completion,
  );
  state.filters.district = fillSelect(
    els.districtFilter,
    uniqueSorted(districtRows, "district"),
    state.filters.district,
  );
  state.filters.year = fillSelect(els.yearFilter, uniqueSorted(yearRows, "startYear").reverse(), state.filters.year);
  state.filters.sex = fillSelect(
    els.sexFilter,
    uniqueSorted(
      trainingOptionRows("sex").filter((row) => row.sex !== "Unspecified"),
      "sex",
    ),
    state.filters.sex,
  );
}

function applyFilters() {
  const needle = state.filters.search.toLowerCase();
  state.filtered = state.rows.filter((row) => {
    const text = `${row.name} ${row.jobTitle} ${row.organization} ${row.facility} ${row.district} ${row.course}`.toLowerCase();
    return (
      (!needle || text.includes(needle)) &&
      (state.filters.course === "All" || row.course === state.filters.course) &&
      (state.filters.district === "All" || row.district === state.filters.district) &&
      (state.filters.year === "All" || row.startYear === state.filters.year) &&
      (state.filters.sex === "All" || row.sex === state.filters.sex)
    );
  });
  state.filteredElearning = state.elearningRows.filter((row) => {
    const text = `${row.fullName} ${row.username} ${row.mechanism} ${row.organizationUnit} ${row.department} ${row.district} ${row.completionLabel}`.toLowerCase();
    return (
      (!needle || text.includes(needle)) &&
      (state.filters.district === "All" || row.district === state.filters.district) &&
      (state.filters.year === "All" || row.enrolledYear === state.filters.year) &&
      (state.filters.mechanism === "All" || row.mechanism === state.filters.mechanism) &&
      (state.filters.completion === "All" || row.completionLabel === state.filters.completion)
    );
  });
  render();
}

function render() {
  const rows = state.filtered;
  renderView();
  renderFilterSummary(state.activeView === "elearning" ? state.filteredElearning : rows);
  renderKpis(rows);
  renderTrend(rows);
  renderSex(rows);
  renderCourseBars(rows);
  renderGainTrend(rows);
  renderDistrictGains(rows);
  renderImprovementRates(rows);
  renderDistrictTrainingBars(rows);
  renderCourseMix(rows);
  renderRankedBars(els.jobBars, countBy(rows, "jobTitle").slice(0, 8), palette.gold);
  renderRankedBars(els.organizationBars, countBy(rows, "organization").slice(0, 8), palette.coral);
  renderDatabaseSnapshot(rows);
  renderParticipants(rows);
  renderElearning(state.filteredElearning);
}

function renderView() {
  const labels = {
    overview: "Overview",
    scores: "Score Analysis",
    coverage: "District Coverage",
    people: "Participants",
    elearning: "E-learning",
    database: "Database",
  };
  const viewCopy = {
    elearning: {
      title: "E-learning Performance Dashboard",
      description:
        "Virtual Academy learner enrollment, engagement, completion, and grade performance",
    },
    database: {
      title: "Training Database",
      description:
        "Protected training record snapshot for workforce monitoring and follow-up",
    },
    default: {
      title: "Training Performance Dashboard",
      description:
        "Training of health workers in providing friendly services to people at higher risk for HIV",
    },
  };
  const copy = viewCopy[state.activeView] || viewCopy.default;

  dashboardStage.dataset.activeView = state.activeView;
  els.activeViewLabel.textContent = labels[state.activeView] || "Overview";
  els.dashboardTitle.textContent = copy.title;
  els.dashboardDescription.textContent = copy.description;
  els.searchInput.placeholder =
    state.activeView === "elearning"
      ? "Search learners, mechanisms, units, departments..."
      : "Search records, facilities, organizations...";
  els.scopedFilters.forEach((filter) => {
    const hidden =
      state.activeView === "elearning"
        ? filter.dataset.filterScope === "training"
        : filter.dataset.filterScope === "elearning";
    filter.classList.toggle("is-hidden", hidden);
  });
  els.navItems.forEach((item) => {
    const active = item.dataset.view === state.activeView;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  els.panels.forEach((panel) => {
    const sections = panel.dataset.section.split(" ");
    panel.classList.toggle("is-hidden", !sections.includes(state.activeView));
  });
}

function renderFilterSummary(rows) {
  if (state.activeView === "elearning") {
    const districtCount = new Set(rows.map((row) => row.district).filter(isRealDistrict)).size;
    const active = [
      state.filters.district !== "All" ? `District: ${state.filters.district}` : "",
      state.filters.year !== "All" ? `Year: ${state.filters.year}` : "",
      state.filters.mechanism !== "All" ? `Mechanism: ${state.filters.mechanism}` : "",
      state.filters.completion !== "All" ? `Completion: ${state.filters.completion}` : "",
      state.filters.search ? "Search active" : "",
    ].filter(Boolean);

    els.filterSummary.textContent = `${formatNumber(rows.length)} learners across ${formatNumber(
      districtCount,
    )} districts`;
    els.activeFilters.textContent = active.length ? active.join(" | ") : "No filters applied";
    return;
  }

  const districtCount = new Set(rows.map((row) => row.district).filter(isRealDistrict)).size;
  const active = [
    state.filters.course !== "All" ? `Course: ${shorten(state.filters.course, 22)}` : "",
    state.filters.district !== "All" ? `District: ${state.filters.district}` : "",
    state.filters.year !== "All" ? `Year: ${state.filters.year}` : "",
    state.filters.sex !== "All" ? `Sex: ${state.filters.sex}` : "",
    state.filters.search ? "Search active" : "",
  ].filter(Boolean);

  els.filterSummary.textContent = `${formatNumber(rows.length)} participants across ${formatNumber(
    districtCount,
  )} districts`;
  els.activeFilters.textContent = active.length ? active.join(" | ") : "No filters applied";
}

function renderKpis(rows) {
  const pre = average(rows, "pre");
  const post = average(rows, "post");
  const gain = average(rows, "gain");
  const facilities = new Set(rows.map((row) => row.facility)).size;

  els.kpiParticipants.textContent = formatNumber(rows.length);
  els.kpiFacilities.textContent = `${formatNumber(facilities)} facilities`;
  els.kpiPre.textContent = formatScore(pre);
  els.kpiPost.textContent = formatScore(post);
  els.kpiGain.textContent = gain == null ? "N/A" : `${gain >= 0 ? "+" : ""}${Math.round(gain)} pts`;
  els.kpiGainContext.textContent =
    gain == null ? "No paired scores" : `${formatScore(pre)} to ${formatScore(post)}`;
}

function renderTrend(rows) {
  const grouped = [...groupBy(rows.filter((row) => row.startMonth !== "Unknown"), "startMonth")]
    .map(([name, items]) => ({
      name,
      post: average(items, "post"),
      gain: average(items, "gain"),
      count: items.length,
    }))
    .filter((item) => Number.isFinite(item.post) && Number.isFinite(item.gain))
    .sort((a, b) => a.name.localeCompare(b.name));
  els.dateRange.textContent =
    grouped.length > 1
      ? `${monthLabel(grouped[0].name)} - ${monthLabel(grouped[grouped.length - 1].name)}`
      : "All dates";
  els.dateWindow.textContent = els.dateRange.textContent;

  if (!grouped.length) {
    els.trendChart.innerHTML = emptyMarkup("No dated records in this filter.");
    return;
  }

  const width = 760;
  const height = 250;
  const pad = { top: 30, right: 48, bottom: 42, left: 46 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const postMax = Math.max(...grouped.map((item) => item.post), 100);
  const gainMax = Math.max(...grouped.map((item) => item.gain), 1);
  const points = grouped.map((item, index) => {
    const x = pad.left + (grouped.length === 1 ? plotW / 2 : (index / (grouped.length - 1)) * plotW);
    const postY = pad.top + plotH - (item.post / postMax) * plotH;
    const gainY = pad.top + plotH - (item.gain / gainMax) * plotH;
    return { ...item, x, postY, gainY };
  });
  const postPath = points
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.postY}`)
    .join(" ");
  const gainPath = points
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.gainY}`)
    .join(" ");
  const ticks = [0, 25, 50, 75, 100];
  const xLabels = points.filter((_, index) => index % Math.ceil(points.length / 7) === 0);

  els.trendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Score improvement over time">
      <g transform="translate(${pad.left} 7)">
        <line x1="0" y1="0" x2="18" y2="0" stroke="${palette.teal}" stroke-width="4" stroke-linecap="round"></line>
        <text class="axis-label" x="26" y="4">Average post-test</text>
        <line x1="150" y1="0" x2="168" y2="0" stroke="${palette.violet}" stroke-width="4" stroke-linecap="round"></line>
        <text class="axis-label" x="176" y="4">Average improvement</text>
      </g>
      ${ticks
        .map((tick) => {
          const y = pad.top + plotH - (tick / postMax) * plotH;
          return `<line class="grid-line" x1="${pad.left}" y1="${y}" x2="${
            width - pad.right
          }" y2="${y}"></line><text class="axis-label" x="8" y="${y + 4}">${tick}</text>`;
        })
        .join("")}
      <path d="${postPath}" fill="none" stroke="${palette.teal}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="${gainPath}" fill="none" stroke="${palette.violet}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
      ${points
        .map(
          (point) =>
            `<circle cx="${point.x}" cy="${point.postY}" r="4" fill="#fff" stroke="${palette.teal}" stroke-width="3"><title>${monthLabel(
              point.name,
            )}: ${Math.round(point.post)}% post-test from ${point.count} people</title></circle>
            <circle cx="${point.x}" cy="${point.gainY}" r="4" fill="#fff" stroke="${palette.violet}" stroke-width="3"><title>${monthLabel(
              point.name,
            )}: ${Math.round(point.gain)} pts improvement</title></circle>`,
        )
        .join("")}
      ${xLabels
        .map(
          (point) =>
            `<text class="axis-label" x="${point.x}" y="${height - 14}" text-anchor="middle">${monthLabel(
              point.name,
            )}</text>`,
        )
        .join("")}
      <text class="axis-label" x="${width - 12}" y="${pad.top + 4}" text-anchor="end">${Math.round(
        gainMax,
      )} pts</text>
    </svg>`;
}

function renderSex(rows) {
  const values = countBy(rows, "sex").filter((item) => item.name !== "Unspecified");
  const colors = [palette.teal, palette.coral, palette.gold, palette.navy];
  const total = values.reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    els.sexDonut.innerHTML = emptyMarkup("No sex data in this filter.");
    els.sexLegend.innerHTML = "";
    return;
  }

  let cumulative = 0;
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const rings = values
    .map((item, index) => {
      const fraction = item.count / total;
      const dash = fraction * circumference;
      const gap = circumference - dash;
      const offset = -cumulative * circumference;
      cumulative += fraction;
      return `<circle cx="120" cy="120" r="${radius}" fill="none" stroke="${colors[index % colors.length]}" stroke-width="34" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${offset}" transform="rotate(-90 120 120)"></circle>`;
    })
    .join("");

  els.sexDonut.innerHTML = `
    <svg viewBox="0 0 240 240" role="img" aria-label="Sex distribution donut">
      <circle cx="120" cy="120" r="${radius}" fill="none" stroke="#edf2f8" stroke-width="34"></circle>
      ${rings}
      <text x="120" y="114" text-anchor="middle" fill="${palette.navy}" font-size="32" font-weight="850">${formatNumber(
        total,
      )}</text>
      <text x="120" y="139" text-anchor="middle" fill="${palette.muted}" font-size="13" font-weight="700">participants</text>
    </svg>`;

  els.sexLegend.innerHTML = values
    .map(
      (item, index) => `<div class="legend-row">
        <span class="dot" style="background:${colors[index % colors.length]}"></span>
        <span title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        <strong>${Math.round((item.count / total) * 100)}%</strong>
      </div>`,
    )
    .join("");
}

function renderCourseBars(rows) {
  const courses = countBy(rows, "course")
    .slice(0, 5)
    .map((item) => ({
      name: item.name,
      pre: average(item.rows, "pre") || 0,
      post: average(item.rows, "post") || 0,
      count: item.count,
    }))
    .sort((a, b) => b.post - b.pre - (a.post - a.pre) || b.count - a.count);

  if (!courses.length) {
    els.courseBars.innerHTML = emptyMarkup("No course data in this filter.");
    return;
  }

  els.courseBars.innerHTML = `
    <div class="comparison-legend" aria-hidden="true">
      <span><i class="pre"></i>Pre-test</span>
      <span><i class="post"></i>Post-test</span>
    </div>
    <div class="comparison-rows" role="img" aria-label="Average score improvement by course">
      ${courses
        .map((course) => {
          const gain = Math.round(course.post - course.pre);
          const start = Math.min(course.pre, course.post);
          const width = Math.abs(course.post - course.pre);
          return `<div class="comparison-row">
            <div class="comparison-copy">
              <strong>${escapeHtml(course.name)}</strong>
              <span>${formatNumber(course.count)} people</span>
            </div>
            <div class="comparison-track-wrap">
              <span class="comparison-track"></span>
              <span class="comparison-segment" style="left:${start}%; width:${width}%;"></span>
              <span class="comparison-dot pre" style="left:${course.pre}%;" title="${escapeHtml(
                course.name,
              )} pre-test: ${Math.round(course.pre)}%"></span>
              <span class="comparison-dot post" style="left:${course.post}%;" title="${escapeHtml(
                course.name,
              )} post-test: ${Math.round(course.post)}%"></span>
              <span class="comparison-score pre" style="left:${course.pre}%;">${Math.round(
                course.pre,
              )}%</span>
              <span class="comparison-score post" style="left:${course.post}%;">${Math.round(
                course.post,
              )}%</span>
            </div>
            <strong class="comparison-gain">${gain >= 0 ? "+" : ""}${gain}</strong>
          </div>`;
        })
        .join("")}
    </div>
    <div class="comparison-axis-row" aria-hidden="true">
      <span></span>
      <div class="comparison-axis">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
      <span></span>
    </div>`;
}

function renderGainTrend(rows) {
  const grouped = [...groupBy(rows.filter((row) => row.startMonth !== "Unknown"), "startMonth")]
    .map(([name, items]) => ({ name, gain: average(items, "gain"), count: items.length }))
    .filter((item) => Number.isFinite(item.gain))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!grouped.length) {
    els.gainTrendChart.innerHTML = emptyMarkup("No paired score data in this filter.");
    return;
  }

  const width = 760;
  const height = 250;
  const pad = { top: 18, right: 24, bottom: 42, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const min = Math.min(0, ...grouped.map((item) => item.gain));
  const max = Math.max(1, ...grouped.map((item) => item.gain));
  const span = max - min || 1;
  const yFor = (value) => pad.top + plotH - ((value - min) / span) * plotH;
  const groupW = plotW / grouped.length;
  const barW = Math.min(44, Math.max(16, groupW * 0.54));
  const xLabels = grouped.filter((_, index) => index % Math.ceil(grouped.length / 7) === 0);
  const ticks = [min, min + span * 0.33, min + span * 0.66, max].map((value) => Math.round(value));

  els.gainTrendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly average score lift columns">
      ${ticks
        .map((tick) => {
          const y = yFor(tick);
          return `<line class="grid-line" x1="${pad.left}" y1="${y}" x2="${
            width - pad.right
          }" y2="${y}"></line><text class="axis-label" x="8" y="${y + 4}">${tick}</text>`;
        })
        .join("")}
      ${grouped
        .map((item, index) => {
          const x = pad.left + index * groupW + (groupW - barW) / 2;
          const y = yFor(item.gain);
          const barH = plotH - (y - pad.top);
          return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="7" fill="${palette.violet}"><title>${monthLabel(
            item.name,
          )}: ${Math.round(item.gain)} pts from ${item.count} people</title></rect>`;
        })
        .join("")}
      ${xLabels
        .map((item) => {
          const index = grouped.indexOf(item);
          const x = pad.left + index * groupW + groupW / 2;
          return `<text class="axis-label" x="${x}" y="${height - 14}" text-anchor="middle">${monthLabel(
            item.name,
          )}</text>`;
        })
        .join("")}
    </svg>`;
}

function renderDistrictGains(rows) {
  const data = countBy(rows.filter((row) => isRealDistrict(row.district)), "district")
    .map((item) => ({ name: item.name, value: average(item.rows, "gain"), count: item.count }))
    .filter((item) => Number.isFinite(item.value) && item.count >= 3)
    .sort((a, b) => b.value - a.value || b.count - a.count)
    .slice(0, 10);

  renderMetricBars(els.districtGainBars, data, palette.teal, "pts");
}

function renderDistrictTrainingBars(rows) {
  const data = countBy(rows.filter((row) => isRealDistrict(row.district)), "district");

  if (!data.length) {
    els.districtBars.innerHTML = emptyMarkup("No district data in this filter.");
    return;
  }

  const max = Math.max(...data.map((item) => item.count), 1);
  els.districtBars.innerHTML = data
    .map(
      (item) => `<div class="bar-row">
        <div class="bar-top">
          <span>${escapeHtml(item.name)}</span>
          <strong>${formatNumber(item.count)}</strong>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(
          2,
          (item.count / max) * 100,
        )}%; background:${palette.teal};"></div></div>
      </div>`,
    )
    .join("");
}

function renderImprovementRates(rows) {
  const districtData = countBy(rows.filter((row) => isRealDistrict(row.district)), "district")
    .map((item) => ({
      name: item.name,
      value: average(item.rows.map((row) => ({ rate: percentImprovement(row) })), "rate"),
      count: item.rows.filter((row) => Number.isFinite(percentImprovement(row))).length,
    }))
    .filter((item) => Number.isFinite(item.value) && item.count >= 3)
    .sort((a, b) => b.value - a.value || b.count - a.count)
    .slice(0, 8);

  const organizationData = countBy(rows, "organization")
    .map((item) => ({
      name: item.name,
      value: average(item.rows.map((row) => ({ rate: percentImprovement(row) })), "rate"),
      count: item.rows.filter((row) => Number.isFinite(percentImprovement(row))).length,
    }))
    .filter((item) => Number.isFinite(item.value) && item.count >= 3)
    .sort((a, b) => b.value - a.value || b.count - a.count)
    .slice(0, 8);

  renderMetricBars(els.districtRateBars, districtData, palette.green, "%");
  renderMetricBars(els.organizationRateBars, organizationData, palette.blue, "%");
}

function renderMetricBars(container, data, color, suffix = "") {
  if (!data.length) {
    container.innerHTML = emptyMarkup("No ranked score lift data in this filter.");
    return;
  }
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  container.innerHTML = data
    .map(
      (item) => `<div class="bar-row">
        <div class="bar-top">
          <span>${escapeHtml(shorten(item.name, 34))}</span>
          <strong>${item.value >= 0 ? "+" : ""}${Math.round(item.value)}${suffix ? ` ${suffix}` : ""}</strong>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(
          3,
          (Math.abs(item.value) / max) * 100,
        )}%; background:${color};"></div></div>
      </div>`,
    )
    .join("");
}

function renderCourseMix(rows) {
  const values = countBy(rows, "course").slice(0, 5);
  const remainder = rows.length - values.reduce((sum, item) => sum + item.count, 0);
  if (remainder > 0) values.push({ name: "Other courses", count: remainder });
  const colors = [palette.teal, palette.violet, palette.gold, palette.coral, palette.green, palette.navy];
  const total = values.reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    els.courseMixDonut.innerHTML = emptyMarkup("No course data in this filter.");
    els.courseMixLegend.innerHTML = "";
    return;
  }

  let cumulative = 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const rings = values
    .map((item, index) => {
      const fraction = item.count / total;
      const dash = fraction * circumference;
      const gap = circumference - dash;
      const offset = -cumulative * circumference;
      cumulative += fraction;
      return `<circle cx="110" cy="110" r="${radius}" fill="none" stroke="${colors[index % colors.length]}" stroke-width="28" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${offset}" transform="rotate(-90 110 110)"></circle>`;
    })
    .join("");

  els.courseMixDonut.innerHTML = `
    <svg viewBox="0 0 220 220" role="img" aria-label="Course mix donut">
      <circle cx="110" cy="110" r="${radius}" fill="none" stroke="#edf2f8" stroke-width="28"></circle>
      ${rings}
      <text x="110" y="106" text-anchor="middle" fill="${palette.navy}" font-size="26" font-weight="850">${values.length}</text>
      <text x="110" y="128" text-anchor="middle" fill="${palette.muted}" font-size="12" font-weight="700">courses</text>
    </svg>`;

  els.courseMixLegend.innerHTML = values
    .map(
      (item, index) => `<div class="legend-row">
        <span class="dot" style="background:${colors[index % colors.length]}"></span>
        <span title="${escapeHtml(item.name)}">${escapeHtml(shorten(item.name, 26))}</span>
        <strong>${Math.round((item.count / total) * 100)}%</strong>
      </div>`,
    )
    .join("");
}

function renderRankedBars(container, data, color) {
  if (!data.length) {
    container.innerHTML = emptyMarkup("No data in this filter.");
    return;
  }
  const max = Math.max(...data.map((item) => item.count), 1);
  container.innerHTML = data
    .map(
      (item) => `<div class="bar-row">
        <div class="bar-top">
          <span>${escapeHtml(shorten(item.name, 34))}</span>
          <strong>${formatNumber(item.count)}</strong>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(
          2,
          (item.count / max) * 100,
        )}%; background:${color};"></div></div>
      </div>`,
    )
    .join("");
}

function renderDatabaseSnapshot(rows) {
  const facilities = new Set(rows.map((row) => row.facility)).size;
  const courses = new Set(rows.map((row) => row.course)).size;
  const paired = rows.filter((row) => Number.isFinite(row.pre) && Number.isFinite(row.post)).length;
  const completeness = rows.length ? Math.round((paired / rows.length) * 100) : 0;
  els.dbRecords.textContent = formatNumber(rows.length);
  els.dbFacilities.textContent = formatNumber(facilities);
  els.dbCourses.textContent = formatNumber(courses);
  els.dbCompleteness.textContent = `${completeness}%`;
}

function renderParticipants(rows) {
  els.rowCount.textContent = `${formatNumber(rows.length)} rows`;
  els.participantTable.innerHTML = rows
    .slice()
    .sort((a, b) => (b.startDate?.getTime() || 0) - (a.startDate?.getTime() || 0))
    .slice(0, 40)
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.sex)}</td>
        <td>${escapeHtml(shorten(row.jobTitle, 26))}</td>
        <td>${escapeHtml(shorten(row.organization, 24))}</td>
        <td>${escapeHtml(shorten(row.facility, 30))}</td>
        <td>${escapeHtml(row.district)}</td>
        <td>${escapeHtml(shorten(row.course, 42))}</td>
        <td>${formatScore(row.pre)}</td>
        <td>${formatScore(row.post)}</td>
        <td><span class="gain-pill ${row.gain < 0 ? "negative" : ""}">${
          row.gain == null ? "N/A" : `${row.gain >= 0 ? "+" : ""}${Math.round(row.gain)}`
        }</span></td>
      </tr>`,
    )
    .join("");
}

function renderElearning(rows) {
  if (!els.elearningRecords) return;

  if (state.elearningError) {
    els.elearningRecords.textContent = "0";
    els.elearningCompletion.textContent = "N/A";
    els.elearningAvgGrade.textContent = "N/A";
    els.elearningVisits.textContent = "0";
    els.elearningStatusBars.innerHTML = emptyMarkup(state.elearningError);
    els.elearningDistrictBars.innerHTML = emptyMarkup("E-learning data is unavailable.");
    els.elearningDistrictCompletionBars.innerHTML = emptyMarkup("E-learning data is unavailable.");
    els.elearningMechanismBars.innerHTML = emptyMarkup("E-learning data is unavailable.");
    els.elearningCadreBars.innerHTML = emptyMarkup("E-learning data is unavailable.");
    els.elearningTimeline.innerHTML = emptyMarkup("E-learning data is unavailable.");
    els.elearningTable.innerHTML = "";
    els.elearningRowCount.textContent = "0 rows";
    return;
  }

  const completed = rows.filter((row) => row.completed).length;
  const completionRate = rows.length ? Math.round((completed / rows.length) * 100) : 0;
  const avgGrade = average(
    rows.filter((row) => row.completed && Number.isFinite(row.grade)),
    "grade",
  );
  const totalVisits = rows.reduce((sum, row) => sum + row.visits, 0);

  if (state.activeView === "elearning") {
    els.dateWindow.textContent = elearningDateRange(rows);
  }

  els.elearningRecords.textContent = formatNumber(rows.length);
  els.elearningCompletion.textContent = `${completionRate}%`;
  els.elearningAvgGrade.textContent = avgGrade == null ? "N/A" : `${Math.round(avgGrade)}%`;
  els.elearningVisits.textContent = formatNumber(totalVisits);
  els.elearningRowCount.textContent = `${formatNumber(rows.length)} rows`;

  renderElearningStatus(rows);
  renderRankedBars(els.elearningDistrictBars, countBy(rows.filter((row) => isRealDistrict(row.district)), "district").slice(0, 10), palette.teal);
  renderElearningDistrictCompletion(rows);
  renderRankedBars(els.elearningMechanismBars, countBy(rows, "mechanism").slice(0, 8), palette.blue);
  renderRankedBars(els.elearningCadreBars, countBy(rows, "department").slice(0, 8), palette.gold);
  renderElearningTimeline(rows);
  renderElearningTable(rows);
}

function elearningDateRange(rows) {
  const dated = rows
    .map((row) => row.enrolledDate)
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());
  if (dated.length < 2) return "All dates";
  return `${monthLabel(monthKey(dated[0]))} - ${monthLabel(monthKey(dated[dated.length - 1]))}`;
}

function renderElearningStatus(rows) {
  const data = [
    { name: "Completed", count: rows.filter((row) => row.completed).length, color: palette.green },
    { name: "In progress", count: rows.filter((row) => !row.completed).length, color: palette.violet },
  ];
  const max = Math.max(...data.map((item) => item.count), 1);

  els.elearningStatusBars.innerHTML = data
    .map(
      (item) => `<div class="bar-row">
        <div class="bar-top">
          <span>${item.name}</span>
          <strong>${formatNumber(item.count)}</strong>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(
          3,
          (item.count / max) * 100,
        )}%; background:${item.color};"></div></div>
      </div>`,
    )
    .join("");
}

function renderElearningDistrictCompletion(rows) {
  const data = countBy(rows.filter((row) => isRealDistrict(row.district)), "district")
    .map((item) => {
      const completed = item.rows.filter((row) => row.completed).length;
      return {
        name: item.name,
        count: item.count,
        completed,
        rate: item.count ? Math.round((completed / item.count) * 100) : 0,
      };
    })
    .sort((a, b) => b.rate - a.rate || b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 10);

  if (!data.length) {
    els.elearningDistrictCompletionBars.innerHTML = emptyMarkup("No district completion data in this filter.");
    return;
  }

  els.elearningDistrictCompletionBars.innerHTML = data
    .map(
      (item) => `<div class="bar-row">
        <div class="bar-top">
          <span>${escapeHtml(shorten(item.name, 34))}</span>
          <strong>${item.rate}%</strong>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(
          3,
          item.rate,
        )}%; background:${palette.green};"></div></div>
        <small class="bar-note">${formatNumber(item.completed)} of ${formatNumber(item.count)} completed</small>
      </div>`,
    )
    .join("");
}

function renderElearningTimeline(rows) {
  const groupedMap = new Map(groupBy(rows.filter((row) => row.enrolledMonth !== "Unknown"), "enrolledMonth"));
  const observedMonths = [...groupedMap.keys()].sort((a, b) => a.localeCompare(b));

  if (!observedMonths.length) {
    els.elearningTimeline.innerHTML = emptyMarkup("No enrollment dates in this filter.");
    return;
  }

  const [startYear, startMonth] = observedMonths[0].split("-").map(Number);
  const [endYear, endMonth] = observedMonths[observedMonths.length - 1].split("-").map(Number);
  const monthSpan = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  const months =
    monthSpan <= 24
      ? Array.from({ length: monthSpan }, (_, index) => {
          const date = new Date(startYear, startMonth - 1 + index, 1);
          return monthKey(date);
        })
      : observedMonths;
  const grouped = months.map((name) => {
    const items = groupedMap.get(name) || [];
    const completed = items.filter((row) => row.completed).length;
    return {
      name,
      count: items.length,
      completed,
      rate: items.length ? Math.round((completed / items.length) * 100) : 0,
    };
  });

  const width = 760;
  const height = 282;
  const pad = { top: 42, right: 58, bottom: 48, left: 50 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(...grouped.map((item) => item.count), 1);
  const groupW = plotW / grouped.length;
  const barW = Math.min(40, Math.max(10, groupW * 0.48));
  const showValueLabels = groupW >= 34;
  const xLabels = grouped.filter((_, index) => index % Math.ceil(grouped.length / 8) === 0);
  const ticks = [0, max * 0.5, max].map((value) => Math.round(value));
  const rateTicks = [0, 50, 100];
  const ratePoints = grouped.map((item, index) => {
    const x = pad.left + index * groupW + groupW / 2;
    const y = pad.top + plotH - (item.rate / 100) * plotH;
    return { ...item, x, y };
  });
  const ratePath = ratePoints
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

  els.elearningTimeline.innerHTML = `
    <div class="timeline-legend" aria-hidden="true">
      <span><i class="legend-total"></i>Total enrolled</span>
      <span><i class="legend-completed"></i>Completed</span>
      <span><i class="legend-rate"></i>Completion rate</span>
    </div>
    <svg class="elearning-trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="E-learning enrollment timeline with enrollment volume and completion rate">
      <defs>
        <linearGradient id="elearningTotalGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#d6e3f1"></stop>
          <stop offset="100%" stop-color="#ecf4fb"></stop>
        </linearGradient>
        <linearGradient id="elearningCompletedGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#4dad77"></stop>
          <stop offset="100%" stop-color="#0d9b74"></stop>
        </linearGradient>
      </defs>
      ${ticks
        .map((tick) => {
          const y = pad.top + plotH - (tick / max) * plotH;
          return `<line class="grid-line" x1="${pad.left}" y1="${y}" x2="${
            width - pad.right
          }" y2="${y}"></line><text class="axis-label" x="8" y="${y + 4}">${tick}</text>`;
        })
        .join("")}
      ${rateTicks
        .map((tick) => {
          const y = pad.top + plotH - (tick / 100) * plotH;
          return `<text class="axis-label rate-axis-label" x="${width - 8}" y="${y + 4}" text-anchor="end">${tick}%</text>`;
        })
        .join("")}
      <text class="axis-title" x="${pad.left}" y="18">Learners enrolled</text>
      <text class="axis-title" x="${width - pad.right}" y="18" text-anchor="end">Completion rate</text>
      ${grouped
        .map((item, index) => {
          const x = pad.left + index * groupW + (groupW - barW) / 2;
          const barH = (item.count / max) * plotH;
          const completedH = item.count ? (item.completed / item.count) * barH : 0;
          const y = pad.top + plotH - barH;
          const completedY = pad.top + plotH - completedH;
          const label = monthLabel(item.name);
          return `<g>
            <rect class="timeline-total-bar" x="${x}" y="${y}" width="${barW}" height="${barH}" rx="7" fill="url(#elearningTotalGradient)">
              <title>${label}: ${formatNumber(item.count)} enrolled, ${formatNumber(item.completed)} completed, ${item.rate}% completion</title>
            </rect>
            <rect class="timeline-completed-bar" x="${x}" y="${completedY}" width="${barW}" height="${completedH}" rx="7" fill="url(#elearningCompletedGradient)">
              <title>${label}: ${formatNumber(item.completed)} completed</title>
            </rect>
            ${
              item.count && showValueLabels
                ? `<text class="trend-value-label" x="${x + barW / 2}" y="${Math.max(22, y - 7)}" text-anchor="middle">${formatNumber(
                    item.count,
                  )}</text>`
                : ""
            }
          </g>`;
        })
        .join("")}
      <path class="rate-line-shadow" d="${ratePath}"></path>
      <path class="rate-line" d="${ratePath}"></path>
      ${ratePoints
        .map(
          (point) => `<g>
            <circle class="rate-dot" cx="${point.x}" cy="${point.y}" r="${point.count ? 4.5 : 3.2}">
              <title>${monthLabel(point.name)}: ${point.rate}% completion rate</title>
            </circle>
          </g>`,
        )
        .join("")}
      ${xLabels
        .map((item) => {
          const index = grouped.indexOf(item);
          const x = pad.left + index * groupW + groupW / 2;
          const [month, year] = monthLabel(item.name).split(" ");
          return `<text class="axis-label month-axis-label" x="${x}" y="${height - 26}" text-anchor="middle">
            <tspan x="${x}" dy="0">${month}</tspan>
            <tspan x="${x}" dy="13">${year}</tspan>
          </text>`;
        })
        .join("")}
    </svg>`;
}

function renderElearningTable(rows) {
  els.elearningTable.innerHTML = rows
    .slice()
    .sort((a, b) => (b.enrolledDate?.getTime() || 0) - (a.enrolledDate?.getTime() || 0))
    .slice(0, 40)
    .map(
      (row) => `<tr>
        <td>${escapeHtml(shorten(row.fullName, 28))}</td>
        <td>${escapeHtml(row.district)}</td>
        <td>${escapeHtml(shorten(row.mechanism, 22))}</td>
        <td>${escapeHtml(shorten(row.organizationUnit, 30))}</td>
        <td>${escapeHtml(shorten(row.department, 28))}</td>
        <td>${formatNumber(row.visits)}</td>
        <td><span class="status-pill ${row.completed ? "complete" : ""}">${row.completionLabel}</span></td>
        <td>${row.grade == null ? "N/A" : `${Math.round(row.grade)}%`}</td>
      </tr>`,
    )
    .join("");
}

function emptyMarkup(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function shorten(value, max) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function wrapLabel(value, maxChars, maxLines) {
  const words = String(value || "").split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });

  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;

  const clipped = lines.slice(0, maxLines);
  clipped[maxLines - 1] = shorten(clipped[maxLines - 1], maxChars);
  return clipped;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeSvg(value) {
  return escapeHtml(value);
}

function panelTitle(panel) {
  return panel.querySelector(".panel-header h2")?.textContent?.trim() || "visual";
}

function enhancePanelsForFocus() {
  document.querySelectorAll(".visual-grid .panel").forEach((panel) => {
    panel.tabIndex = 0;
    panel.setAttribute("aria-label", `${panelTitle(panel)} visual`);

    const header = panel.querySelector(".panel-header");
    if (!header) return;

    let meta = header.querySelector(".panel-meta");
    if (!meta) {
      meta = document.createElement("div");
      meta.className = "panel-meta";
      const trailing = [...header.children].find((child) => child !== header.firstElementChild);
      if (trailing) meta.append(trailing);
      header.append(meta);
    }

    if (!header.querySelector("[data-export-toggle]")) {
      const exportMenu = document.createElement("div");
      exportMenu.className = "export-menu export-ignore";
      exportMenu.innerHTML = `
        <button class="icon-button export-toggle" type="button" data-export-toggle aria-haspopup="true" aria-expanded="false" aria-label="Download ${escapeHtml(
          panelTitle(panel),
        )}">
          <svg viewBox="0 0 24 24">
            <path d="M12 3v12"></path>
            <path d="m7 10 5 5 5-5"></path>
            <path d="M5 21h14"></path>
          </svg>
        </button>
        <div class="export-menu-list" role="menu" hidden>
          <button type="button" role="menuitem" data-export-format="png">Download image</button>
          <button type="button" role="menuitem" data-export-format="pdf">Download PDF</button>
        </div>
      `;
      meta.append(exportMenu);
    }

    if (!header.querySelector("[data-open-focus]")) {
      const button = document.createElement("button");
      button.className = "icon-button export-ignore";
      button.type = "button";
      button.dataset.openFocus = "true";
      button.setAttribute("aria-label", `Focus ${panelTitle(panel)} visual`);
      button.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"></path>
        </svg>
      `;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openFocusMode(panel);
      });
      meta.append(button);
    }

    panel.addEventListener("keydown", (event) => {
      if (event.key === "Enter") openFocusMode(panel);
    });
  });
}

function closeExportMenus(exceptMenu = null) {
  document.querySelectorAll(".export-menu").forEach((menu) => {
    if (menu === exceptMenu) return;
    menu.classList.remove("is-open");
    menu.querySelector("[data-export-toggle]")?.setAttribute("aria-expanded", "false");
    const list = menu.querySelector(".export-menu-list");
    if (list) list.hidden = true;
  });
}

function toggleExportMenu(menu) {
  const open = !menu.classList.contains("is-open");
  closeExportMenus(menu);
  menu.classList.toggle("is-open", open);
  menu.querySelector("[data-export-toggle]")?.setAttribute("aria-expanded", String(open));
  const list = menu.querySelector(".export-menu-list");
  if (list) list.hidden = !open;
}

async function exportPanel(panel, format) {
  const title = panelTitle(panel);
  showToast(`Preparing ${format === "pdf" ? "PDF" : "image"}...`);
  try {
    const canvas = await renderPanelToCanvas(panel);
    const filename = `${slugify(title)}-${new Date().toISOString().slice(0, 10)}`;
    if (format === "pdf") {
      const pdfBlob = await canvasToPdfBlob(canvas, title);
      downloadBlob(pdfBlob, `${filename}.pdf`);
    } else {
      const pngBlob = await canvasToBlob(canvas, "image/png", 0.98);
      downloadBlob(pngBlob, `${filename}.png`);
    }
    showToast(`${title} download ready`);
  } catch (error) {
    console.error(error);
    showToast("Download failed. Try again after the chart finishes loading.");
  }
}

async function renderPanelToCanvas(panel) {
  try {
    return await renderPanelToCanvasWithForeignObject(panel);
  } catch (error) {
    console.warn("Falling back to canvas chart export.", error);
    return renderPanelToCanvasFallback(panel);
  }
}

function renderPanelToCanvasWithForeignObject(panel) {
  const rect = panel.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  const scale = Math.min(2, Math.max(1, 2200 / Math.max(width, height)));
  const clone = panel.cloneNode(true);

  inlineComputedStyles(panel, clone);
  clone.querySelectorAll(".export-ignore, .export-menu, [data-open-focus]").forEach((node) => node.remove());
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.boxShadow = "none";

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#fff;">
          ${serialized}
        </div>
      </foreignObject>
    </svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      try {
        assertCanvasReadable(canvas);
        resolve(canvas);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not render chart image."));
    };
    image.src = url;
  });
}

async function renderPanelToCanvasFallback(panel) {
  const rect = panel.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  const scale = Math.min(2, Math.max(1, 2200 / Math.max(width, height)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  context.scale(scale, scale);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  drawRoundedRect(context, 0.5, 0.5, width - 1, height - 1, 8, "#ffffff", "#dfe6ef");

  drawExportBlocks(context, panel, rect);
  await drawExportSvgs(context, panel, rect);
  drawExportText(context, panel, rect);
  return canvas;
}

function drawExportBlocks(context, panel, panelRect) {
  const selectors = [
    ".database-metrics article",
    ".band-card",
    ".bar-track",
    ".bar-fill",
    ".status-pill",
    ".gain-pill",
    "th",
    "td",
  ];
  panel.querySelectorAll(selectors.join(",")).forEach((element) => {
    if (element.closest(".export-ignore") || element.closest("svg")) return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const styles = window.getComputedStyle(element);
    const fill = solidColor(styles.backgroundColor, "#ffffff");
    const stroke = solidColor(styles.borderTopColor, "transparent");
    const radius = Math.min(parseFloat(styles.borderTopLeftRadius) || 0, 10);
    drawRoundedRect(
      context,
      rect.left - panelRect.left,
      rect.top - panelRect.top,
      rect.width,
      rect.height,
      radius,
      fill,
      styles.borderTopWidth !== "0px" ? stroke : "transparent",
    );
  });
}

async function drawExportSvgs(context, panel, panelRect) {
  const svgs = [...panel.querySelectorAll("svg")].filter((svg) => !svg.closest(".export-ignore"));
  for (const svg of svgs) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    try {
      const image = await svgElementToImage(svg);
      context.drawImage(image, rect.left - panelRect.left, rect.top - panelRect.top, rect.width, rect.height);
    } catch (error) {
      console.warn("Skipping SVG during export.", error);
    }
  }
}

function drawExportText(context, panel, panelRect) {
  const selectors = "h2, p, span, strong, small, th, td";
  panel.querySelectorAll(selectors).forEach((element) => {
    if (element.closest(".export-ignore") || element.closest("svg")) return;
    const text = element.textContent?.replace(/\s+/g, " ").trim();
    if (!text) return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const styles = window.getComputedStyle(element);
    if (styles.visibility === "hidden" || styles.display === "none") return;
    const size = parseFloat(styles.fontSize) || 12;
    const weight = styles.fontWeight || "600";
    context.fillStyle = solidColor(styles.color, "#10233f");
    context.font = `${weight} ${size}px ${fontFamilyForCanvas(styles.fontFamily)}`;
    context.textBaseline = "top";
    drawWrappedCanvasText(
      context,
      text,
      rect.left - panelRect.left,
      rect.top - panelRect.top,
      rect.width,
      size * 1.25,
      Math.max(1, Math.floor(rect.height / (size * 1.1))),
    );
  });
}

function svgElementToImage(svg) {
  const clone = svg.cloneNode(true);
  inlineSvgStyles(svg, clone);
  const rect = svg.getBoundingClientRect();
  clone.setAttribute("width", String(Math.ceil(rect.width)));
  clone.setAttribute("height", String(Math.ceil(rect.height)));
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const serialized = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not render embedded SVG."));
    };
    image.src = url;
  });
}

function inlineSvgStyles(source, target) {
  const styles = window.getComputedStyle(source);
  const keep = [
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "font-size",
    "font-weight",
    "font-family",
    "opacity",
  ];
  keep.forEach((property) => {
    const value = styles.getPropertyValue(property);
    if (value) target.style.setProperty(property, value);
  });
  [...source.children].forEach((child, index) => {
    const clonedChild = target.children[index];
    if (clonedChild) inlineSvgStyles(child, clonedChild);
  });
}

function drawRoundedRect(context, x, y, width, height, radius, fill, stroke) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
  if (fill && fill !== "transparent") {
    context.fillStyle = fill;
    context.fill();
  }
  if (stroke && stroke !== "transparent") {
    context.strokeStyle = stroke;
    context.lineWidth = 1;
    context.stroke();
  }
}

function drawWrappedCanvasText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width <= maxWidth || !line) {
      line = next;
      return;
    }
    lines.push(line);
    line = word;
  });
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((lineText, index) => {
    context.fillText(lineText, x, y + index * lineHeight);
  });
}

function solidColor(value, fallback) {
  if (!value || value === "transparent" || value === "rgba(0, 0, 0, 0)") return fallback;
  return value;
}

function fontFamilyForCanvas(value) {
  return value?.split(",")[0]?.replace(/["']/g, "").trim() || "Arial";
}

function assertCanvasReadable(canvas) {
  canvas.toDataURL("image/png");
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        try {
          resolve(dataUrlToBlob(canvas.toDataURL(type, quality)));
        } catch (error) {
          reject(error);
        }
      }, type, quality);
    } catch (error) {
      try {
        resolve(dataUrlToBlob(canvas.toDataURL(type, quality)));
      } catch (fallbackError) {
        reject(fallbackError);
      }
    }
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function inlineComputedStyles(source, target) {
  const computed = window.getComputedStyle(source);
  target.style.cssText = Array.from(computed)
    .map((property) => `${property}:${computed.getPropertyValue(property)};`)
    .join("");
  target.style.transform = "none";
  target.style.animation = "none";
  target.style.transition = "none";
  target.querySelectorAll("input, select, textarea").forEach((field, index) => {
    const sourceField = source.querySelectorAll("input, select, textarea")[index];
    if (!sourceField) return;
    field.value = sourceField.value;
  });

  [...source.children].forEach((child, index) => {
    const clonedChild = target.children[index];
    if (clonedChild) inlineComputedStyles(child, clonedChild);
  });
}

async function canvasToPdfBlob(canvas, title) {
  const imageData = canvas.toDataURL("image/jpeg", 0.92);
  const imageBytes = atob(imageData.split(",")[1]);
  const landscape = canvas.width > canvas.height;
  const pageWidth = landscape ? 841.89 : 595.28;
  const pageHeight = landscape ? 595.28 : 841.89;
  const margin = 30;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const fit = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const imageWidth = canvas.width * fit;
  const imageHeight = canvas.height * fit;
  const x = (pageWidth - imageWidth) / 2;
  const y = (pageHeight - imageHeight) / 2;
  const content = `q\n${imageWidth.toFixed(2)} 0 0 ${imageHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(
    2,
  )} cm\n/Im0 Do\nQ\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(
      2,
    )}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n${imageBytes}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n%âãÏÓ\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Title (${escapePdf(title)}) >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([Uint8Array.from(pdf, (char) => char.charCodeAt(0))], { type: "application/pdf" });
}

function downloadBlob(blob, filename) {
  if (!blob) throw new Error("No file was generated.");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function slugify(value) {
  return String(value || "dashboard-chart")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function escapePdf(value) {
  return String(value || "").replace(/[\\()]/g, "\\$&");
}

function openFocusMode(panel) {
  const clone = panel.cloneNode(true);
  clone.querySelectorAll(".export-ignore").forEach((node) => node.remove());
  els.focusTitle.textContent = panelTitle(panel);
  els.focusBody.replaceChildren(clone);
  els.focusLayer.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeFocusMode() {
  els.focusLayer.hidden = true;
  els.focusBody.replaceChildren();
  document.body.style.overflow = "";
}

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 1800);
}

async function loadData(source = LIVE_CSV, fallbackSource = LOCAL_CSV) {
  els.refreshData.disabled = true;
  els.refreshData.textContent = source === LIVE_CSV ? "Refreshing..." : "Loading...";
  try {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load CSV (${response.status})`);
    const csv = await response.text();
    state.rows = parseCsv(csv).map(normalizeRow).filter((row) => row.name !== "Unnamed participant");
    setupFilters();
    applyFilters();
  } catch (error) {
    if (fallbackSource && source !== fallbackSource) {
      console.warn("Live training sheet failed, loading local fallback.", error);
      await loadData(fallbackSource, null);
      return;
    }
    console.error(error);
    document.querySelector(".visual-grid").innerHTML = `<article class="panel span-12">${emptyMarkup(
      "The dashboard could not load the CSV. Start it from a local web server and try again.",
    )}</article>`;
  } finally {
    els.refreshData.disabled = false;
    els.refreshData.textContent = "Refresh data";
  }
}

async function loadElearningData(source = ELEARNING_CSV) {
  try {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load e-learning CSV (${response.status})`);
    const csv = await response.text();
    state.elearningRows = parseCsv(csv)
      .map(normalizeElearningRow)
      .filter((row) => row.fullName !== "Unnamed learner");
    state.elearningError = "";
    setupFilters();
    applyFilters();
  } catch (error) {
    console.error(error);
    state.elearningRows = [];
    state.elearningError =
      "The e-learning sheet could not load. Confirm the Virtual academy sheet is published and protected with the dashboard.";
    applyFilters();
  }
}

async function refreshDashboardData() {
  els.refreshData.disabled = true;
  els.refreshData.textContent = "Refreshing...";
  try {
    await Promise.all([loadData(LIVE_CSV), loadElearningData(ELEARNING_CSV)]);
  } finally {
    els.refreshData.disabled = false;
    els.refreshData.textContent = "Refresh data";
  }
}

els.searchInput.addEventListener("input", (event) => {
  state.filters.search = event.target.value;
  setupFilters();
  applyFilters();
});

[
  [els.courseFilter, "course"],
  [els.mechanismFilter, "mechanism"],
  [els.completionFilter, "completion"],
  [els.districtFilter, "district"],
  [els.yearFilter, "year"],
  [els.sexFilter, "sex"],
].forEach(([select, key]) => {
  select.addEventListener("change", (event) => {
    state.filters[key] = event.target.value;
    setupFilters();
    applyFilters();
  });
});

els.resetFilters.addEventListener("click", () => {
  state.filters = {
    search: "",
    course: "All",
    district: "All",
    year: "All",
    sex: "All",
    mechanism: "All",
    completion: "All",
  };
  els.searchInput.value = "";
  setupFilters();
  applyFilters();
});

els.refreshData.addEventListener("click", refreshDashboardData);
els.toggleFilters.addEventListener("click", () => {
  const collapsed = document.querySelector(".filter-shell").classList.toggle("is-collapsed");
  els.toggleFilters.setAttribute("aria-expanded", String(!collapsed));
});
landingDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    showLandingSlide(Number(dot.dataset.slide));
    startLandingSlideshow();
  });
});
enterDashboard.addEventListener("click", openDashboard);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".premium-select")) closePremiumSelects();
  if (!event.target.closest(".export-menu")) closeExportMenus();
  if (event.target.closest("[data-close-focus]")) closeFocusMode();
  if (!event.target.closest(".nav-group")) closeInnovationMenu();

  const exportToggle = event.target.closest("[data-export-toggle]");
  if (exportToggle) {
    event.preventDefault();
    event.stopPropagation();
    toggleExportMenu(exportToggle.closest(".export-menu"));
    return;
  }

  const exportOption = event.target.closest("[data-export-format]");
  if (exportOption) {
    event.preventDefault();
    event.stopPropagation();
    const panel = exportOption.closest(".panel");
    const format = exportOption.dataset.exportFormat;
    closeExportMenus();
    if (panel && format) exportPanel(panel, format);
    return;
  }

  const routeLink = event.target.closest("a[data-route]");
  if (!routeLink) return;
  const url = new URL(routeLink.href, window.location.origin);
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  navigate(`${url.pathname}${url.hash}`);
});

function updateScrollProgress() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(window.scrollY / maxScroll, 1);
  document.documentElement.style.setProperty("--scroll-progress", String(progress));
}

menuToggle.addEventListener("click", () => {
  const open = primaryNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePremiumSelects();
  if (event.key === "Escape") closeExportMenus();
  if (event.key === "Escape" && !els.focusLayer.hidden) closeFocusMode();
  if (event.key === "Escape" && primaryNav.classList.contains("is-open")) {
    primaryNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
  if (event.key === "Escape" && innovationMenu.classList.contains("is-open")) {
    closeInnovationMenu();
  }
});

els.navItems.forEach((item) => {
  item.addEventListener("click", () => {
    state.activeView = item.dataset.view;
    setupFilters();
    applyFilters();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

enhancePanelsForFocus();
loadData(LIVE_CSV);
loadElearningData();
updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("popstate", renderRoute);
window.addEventListener("hashchange", renderRoute);
renderRoute();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
