const LOCAL_CSV = "./data/training-data.csv";
const LIVE_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1AW3386YCAvkvU-DYobpaoWWfnNLTbIWthl9Oyc057QdlkinMxlert2sjTcJ8Zr2qewd8Ufio7lqh/pub?gid=328536026&single=true&output=csv";

const palette = {
  navy: "#14345c",
  teal: "#0e9a9a",
  coral: "#e86f52",
  gold: "#d9a441",
  green: "#2f9f6b",
  violet: "#5368d8",
  muted: "#657188",
};

const premiumSelects = new Map();

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
  kpiParticipants: document.querySelector("#kpiParticipants"),
  kpiFacilities: document.querySelector("#kpiFacilities"),
  kpiPre: document.querySelector("#kpiPre"),
  kpiPost: document.querySelector("#kpiPost"),
  kpiGain: document.querySelector("#kpiGain"),
  kpiGainContext: document.querySelector("#kpiGainContext"),
  kpiDistricts: document.querySelector("#kpiDistricts"),
  kpiCourses: document.querySelector("#kpiCourses"),
  trendChart: document.querySelector("#trendChart"),
  sexDonut: document.querySelector("#sexDonut"),
  sexLegend: document.querySelector("#sexLegend"),
  courseBars: document.querySelector("#courseBars"),
  gainTrendChart: document.querySelector("#gainTrendChart"),
  districtGainBars: document.querySelector("#districtGainBars"),
  districtBars: document.querySelector("#districtBars"),
  courseMixDonut: document.querySelector("#courseMixDonut"),
  courseMixLegend: document.querySelector("#courseMixLegend"),
  jobBars: document.querySelector("#jobBars"),
  organizationTable: document.querySelector("#organizationTable"),
  scoreBands: document.querySelector("#scoreBands"),
  durationBands: document.querySelector("#durationBands"),
  participantTable: document.querySelector("#participantTable"),
  rowCount: document.querySelector("#rowCount"),
  dateRange: document.querySelector("#dateRange"),
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
    ),
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
  renderRankedBars(
    els.districtBars,
    countBy(rows.filter((row) => isRealDistrict(row.district)), "district").slice(0, 10),
    palette.teal,
  );
  renderCourseMix(rows);
  renderRankedBars(els.jobBars, countBy(rows, "jobTitle").slice(0, 8), palette.gold);
  renderOrganizations(rows);
  renderScoreBands(rows);
  renderDurationBands(rows);
  renderParticipants(rows);
}

function renderView() {
  const labels = {
    overview: "Overview",
    scores: "Score Analysis",
    coverage: "District Coverage",
    people: "Participants",
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
  const districts = new Set(rows.map((row) => row.district).filter(isRealDistrict)).size;
  const courses = new Set(rows.map((row) => row.course)).size;

  els.kpiParticipants.textContent = formatNumber(rows.length);
  els.kpiFacilities.textContent = `${formatNumber(facilities)} facilities`;
  els.kpiPre.textContent = formatScore(pre);
  els.kpiPost.textContent = formatScore(post);
  els.kpiGain.textContent = gain == null ? "N/A" : `${gain >= 0 ? "+" : ""}${Math.round(gain)} pts`;
  els.kpiGainContext.textContent =
    gain == null ? "No paired scores" : `${formatScore(pre)} to ${formatScore(post)}`;
  els.kpiDistricts.textContent = formatNumber(districts);
  els.kpiCourses.textContent = `${formatNumber(courses)} courses`;
}

function renderTrend(rows) {
  const grouped = [...groupBy(rows.filter((row) => row.startMonth !== "Unknown"), "startMonth")]
    .map(([name, items]) => ({ name, count: items.length }))
    .sort((a, b) => a.name.localeCompare(b.name));
  els.dateRange.textContent =
    grouped.length > 1
      ? `${monthLabel(grouped[0].name)} - ${monthLabel(grouped[grouped.length - 1].name)}`
      : "All dates";

  if (!grouped.length) {
    els.trendChart.innerHTML = emptyMarkup("No dated records in this filter.");
    return;
  }

  const width = 760;
  const height = 250;
  const pad = { top: 16, right: 22, bottom: 42, left: 46 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(...grouped.map((item) => item.count), 1);
  const points = grouped.map((item, index) => {
    const x = pad.left + (grouped.length === 1 ? plotW / 2 : (index / (grouped.length - 1)) * plotW);
    const y = pad.top + plotH - (item.count / max) * plotH;
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x} ${pad.top + plotH} L ${points[0].x} ${
    pad.top + plotH
  } Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio));
  const xLabels = points.filter((_, index) => index % Math.ceil(points.length / 7) === 0);

  els.trendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Training volume trend">
      ${ticks
        .map((tick) => {
          const y = pad.top + plotH - (tick / max) * plotH;
          return `<line class="grid-line" x1="${pad.left}" y1="${y}" x2="${
            width - pad.right
          }" y2="${y}"></line><text class="axis-label" x="8" y="${y + 4}">${tick}</text>`;
        })
        .join("")}
      <path d="${area}" fill="rgba(14,154,154,0.14)"></path>
      <path d="${path}" fill="none" stroke="${palette.teal}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
      ${points
        .map(
          (point) =>
            `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#fff" stroke="${palette.teal}" stroke-width="3"><title>${monthLabel(
              point.name,
            )}: ${point.count}</title></circle>`,
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
        <span>${escapeHtml(item.name)}</span>
        <strong>${Math.round((item.count / total) * 100)}%</strong>
      </div>`,
    )
    .join("");
}

function renderCourseBars(rows) {
  const courses = countBy(rows, "course")
    .slice(0, 6)
    .map((item) => ({
      name: shorten(item.name, 28),
      pre: average(item.rows, "pre") || 0,
      post: average(item.rows, "post") || 0,
      count: item.count,
    }));

  if (!courses.length) {
    els.courseBars.innerHTML = emptyMarkup("No course data in this filter.");
    return;
  }

  const width = 760;
  const height = 250;
  const pad = { top: 12, right: 24, bottom: 58, left: 42 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const groupW = plotW / courses.length;
  const barW = Math.min(26, groupW / 4);
  const ticks = [0, 25, 50, 75, 100];
  const yFor = (value) => pad.top + plotH - (value / 100) * plotH;

  els.courseBars.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Course score comparison">
      ${ticks
        .map((tick) => {
          const y = yFor(tick);
          return `<line class="grid-line" x1="${pad.left}" y1="${y}" x2="${
            width - pad.right
          }" y2="${y}"></line><text class="axis-label" x="9" y="${y + 4}">${tick}</text>`;
        })
        .join("")}
      ${courses
        .map((course, index) => {
          const center = pad.left + index * groupW + groupW / 2;
          const preH = plotH - (yFor(course.pre) - pad.top);
          const postH = plotH - (yFor(course.post) - pad.top);
          return `<g>
            <rect x="${center - barW - 3}" y="${yFor(course.pre)}" width="${barW}" height="${preH}" rx="5" fill="${palette.gold}"><title>${course.name} pre: ${Math.round(
              course.pre,
            )}%</title></rect>
            <rect x="${center + 3}" y="${yFor(course.post)}" width="${barW}" height="${postH}" rx="5" fill="${palette.teal}"><title>${course.name} post: ${Math.round(
              course.post,
            )}%</title></rect>
            <text class="axis-label" x="${center}" y="${
              height - 32
            }" text-anchor="middle">${escapeSvg(course.name)}</text>
            <text class="axis-label" x="${center}" y="${height - 14}" text-anchor="middle">${course.count} people</text>
          </g>`;
        })
        .join("")}
      <g transform="translate(${width - 190} 6)">
        <rect width="10" height="10" rx="2" fill="${palette.gold}"></rect>
        <text class="axis-label" x="16" y="10">Pre-test</text>
        <rect x="86" width="10" height="10" rx="2" fill="${palette.teal}"></rect>
        <text class="axis-label" x="102" y="10">Post-test</text>
      </g>
    </svg>`;
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
  const points = grouped.map((item, index) => ({
    ...item,
    x: pad.left + (grouped.length === 1 ? plotW / 2 : (index / (grouped.length - 1)) * plotW),
    y: yFor(item.gain),
  }));
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const xLabels = points.filter((_, index) => index % Math.ceil(points.length / 7) === 0);
  const ticks = [min, min + span * 0.33, min + span * 0.66, max].map((value) => Math.round(value));

  els.gainTrendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly average score lift">
      ${ticks
        .map((tick) => {
          const y = yFor(tick);
          return `<line class="grid-line" x1="${pad.left}" y1="${y}" x2="${
            width - pad.right
          }" y2="${y}"></line><text class="axis-label" x="8" y="${y + 4}">${tick}</text>`;
        })
        .join("")}
      <path d="${path}" fill="none" stroke="${palette.violet}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
      ${points
        .map(
          (point) =>
            `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#fff" stroke="${palette.violet}" stroke-width="3"><title>${monthLabel(
              point.name,
            )}: ${Math.round(point.gain)} pts from ${point.count} people</title></circle>`,
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
    </svg>`;
}

function renderDistrictGains(rows) {
  const data = countBy(rows.filter((row) => isRealDistrict(row.district)), "district")
    .map((item) => ({ name: item.name, value: average(item.rows, "gain"), count: item.count }))
    .filter((item) => Number.isFinite(item.value) && item.count >= 3)
    .sort((a, b) => b.value - a.value || b.count - a.count)
    .slice(0, 10);

  renderMetricBars(els.districtGainBars, data, palette.violet, "pts");
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
      <text x="110" y="128" text-anchor="middle" fill="${palette.muted}" font-size="12" font-weight="700">segments</text>
    </svg>`;

  els.courseMixLegend.innerHTML = values
    .map(
      (item, index) => `<div class="legend-row">
        <span class="dot" style="background:${colors[index % colors.length]}"></span>
        <span>${escapeHtml(shorten(item.name, 22))}</span>
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

function renderOrganizations(rows) {
  const orgs = countBy(rows, "organization")
    .slice(0, 8)
    .map((item) => ({ ...item, gain: average(item.rows, "gain") }));

  els.organizationTable.innerHTML = orgs
    .map(
      (item) => `<tr>
        <td>${escapeHtml(shorten(item.name, 30))}</td>
        <td>${formatNumber(item.count)}</td>
        <td><span class="gain-pill ${item.gain < 0 ? "negative" : ""}">${
          item.gain == null ? "N/A" : `${item.gain >= 0 ? "+" : ""}${Math.round(item.gain)}`
        }</span></td>
      </tr>`,
    )
    .join("");
}

function renderScoreBands(rows) {
  const bands = [
    { name: "90-100%", test: (value) => value >= 90, color: palette.green },
    { name: "75-89%", test: (value) => value >= 75 && value < 90, color: palette.teal },
    { name: "60-74%", test: (value) => value >= 60 && value < 75, color: palette.gold },
    { name: "Below 60%", test: (value) => value < 60, color: palette.coral },
  ].map((band) => ({
    ...band,
    count: rows.filter((row) => Number.isFinite(row.post) && band.test(row.post)).length,
  }));
  const total = bands.reduce((sum, band) => sum + band.count, 0) || 1;

  els.scoreBands.innerHTML = bands
    .map(
      (band) => `<div class="band-card">
        <strong style="color:${band.color}">${formatNumber(band.count)}</strong>
        <span>${band.name} post-test (${Math.round((band.count / total) * 100)}%)</span>
        <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${Math.max(
          2,
          (band.count / total) * 100,
        )}%; background:${band.color}"></div></div>
      </div>`,
    )
    .join("");
}

function renderDurationBands(rows) {
  const bands = [
    { name: "Same day", test: (value) => value === 0, color: palette.green },
    { name: "1-3 days", test: (value) => value >= 1 && value <= 3, color: palette.teal },
    { name: "4-7 days", test: (value) => value >= 4 && value <= 7, color: palette.violet },
    { name: "8+ days", test: (value) => value >= 8, color: palette.gold },
  ].map((band) => ({
    ...band,
    count: rows.filter((row) => {
      const days = durationDays(row);
      return Number.isFinite(days) && band.test(days);
    }).length,
  }));
  const total = bands.reduce((sum, band) => sum + band.count, 0) || 1;

  els.durationBands.innerHTML = bands
    .map(
      (band) => `<div class="band-card">
        <strong style="color:${band.color}">${formatNumber(band.count)}</strong>
        <span>${band.name} (${Math.round((band.count / total) * 100)}%)</span>
        <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${Math.max(
          2,
          (band.count / total) * 100,
        )}%; background:${band.color}"></div></div>
      </div>`,
    )
    .join("");
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

document.addEventListener("click", (event) => {
  if (!event.target.closest(".premium-select")) closePremiumSelects();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePremiumSelects();
});

els.navItems.forEach((item) => {
  item.addEventListener("click", () => {
    state.activeView = item.dataset.view;
    renderView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

loadData();
