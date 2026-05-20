const LOCAL_CSV = "/data/training-data.csv";
const LIVE_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1AW3386YCAvkvU-DYobpaoWWfnNLTbIWthl9Oyc057QdlkinMxlert2sjTcJ8Zr2qewd8Ufio7lqh/pub?gid=328536026&single=true&output=csv";
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
  activeView: "overview",
  filters: {
    search: "",
    course: "All",
    district: "All",
    year: "All",
    sex: "All",
  },
};

const els = {
  searchInput: document.querySelector("#searchInput"),
  courseFilter: document.querySelector("#courseFilter"),
  districtFilter: document.querySelector("#districtFilter"),
  yearFilter: document.querySelector("#yearFilter"),
  sexFilter: document.querySelector("#sexFilter"),
  navItems: document.querySelectorAll(".nav-item[data-view]"),
  panels: document.querySelectorAll(".panel[data-section]"),
  activeViewLabel: document.querySelector("#activeViewLabel"),
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

function setupFilters() {
  fillSelect(els.courseFilter, uniqueSorted(state.rows, "course"), state.filters.course);
  fillSelect(
    els.districtFilter,
    uniqueSorted(
      state.rows.filter((row) => isRealDistrict(row.district)),
      "district",
    ),
    state.filters.district,
  );
  fillSelect(
    els.yearFilter,
    uniqueSorted(
      state.rows.filter((row) => row.startYear !== "Unknown"),
      "startYear",
    ).reverse(),
    state.filters.year,
  );
  fillSelect(
    els.sexFilter,
    uniqueSorted(
      state.rows.filter((row) => row.sex !== "Unspecified"),
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
  render();
}

function render() {
  const rows = state.filtered;
  renderView();
  renderFilterSummary(rows);
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
}

function renderView() {
  const labels = {
    overview: "Overview",
    scores: "Score Analysis",
    coverage: "District Coverage",
    people: "Participants",
    database: "Database",
  };

  els.activeViewLabel.textContent = labels[state.activeView] || "Overview";
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
    if (!header || header.querySelector("[data-open-focus]")) return;

    let meta = header.querySelector(".panel-meta");
    if (!meta) {
      meta = document.createElement("div");
      meta.className = "panel-meta";
      const trailing = [...header.children].find((child) => child !== header.firstElementChild);
      if (trailing) meta.append(trailing);
      header.append(meta);
    }

    const button = document.createElement("button");
    button.className = "icon-button";
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

    panel.addEventListener("keydown", (event) => {
      if (event.key === "Enter") openFocusMode(panel);
    });
  });
}

function openFocusMode(panel) {
  const clone = panel.cloneNode(true);
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

async function loadData(source = LOCAL_CSV) {
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
    console.error(error);
    document.querySelector(".visual-grid").innerHTML = `<article class="panel span-12">${emptyMarkup(
      "The dashboard could not load the CSV. Start it from a local web server and try again.",
    )}</article>`;
  } finally {
    els.refreshData.disabled = false;
    els.refreshData.textContent = "Refresh data";
  }
}

els.searchInput.addEventListener("input", (event) => {
  state.filters.search = event.target.value;
  applyFilters();
});

[
  [els.courseFilter, "course"],
  [els.districtFilter, "district"],
  [els.yearFilter, "year"],
  [els.sexFilter, "sex"],
].forEach(([select, key]) => {
  select.addEventListener("change", (event) => {
    state.filters[key] = event.target.value;
    renderPremiumSelect(select);
    applyFilters();
  });
});

els.resetFilters.addEventListener("click", () => {
  state.filters = { search: "", course: "All", district: "All", year: "All", sex: "All" };
  els.searchInput.value = "";
  setupFilters();
  applyFilters();
});

els.refreshData.addEventListener("click", () => loadData(LIVE_CSV));
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
  if (event.target.closest("[data-close-focus]")) closeFocusMode();
  if (!event.target.closest(".nav-group")) closeInnovationMenu();

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
    renderView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

enhancePanelsForFocus();
loadData();
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
