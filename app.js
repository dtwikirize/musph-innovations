const LOCAL_CSV = "./data/training-data.csv";
const LIVE_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1AW3386YCAvkvU-DYobpaoWWfnNLTbIWthl9Oyc057QdlkinMxlert2sjTcJ8Zr2qewd8Ufio7lqh/pub?gid=328536026&single=true&output=csv";

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
  exportData: document.querySelector("#exportData"),
  exportMenu: document.querySelector("#exportMenu"),
  dateWindow: document.querySelector("#dateWindow strong"),
  kpiParticipants: document.querySelector("#kpiParticipants"),
  kpiFacilities: document.querySelector("#kpiFacilities"),
  kpiPre: document.querySelector("#kpiPre"),
  kpiPost: document.querySelector("#kpiPost"),
  kpiGain: document.querySelector("#kpiGain"),
  kpiGainContext: document.querySelector("#kpiGainContext"),
  kpiLift: document.querySelector("#kpiLift"),
  kpiLiftContext: document.querySelector("#kpiLiftContext"),
  kpiCompletions: document.querySelector("#kpiCompletions"),
  kpiCompletionRate: document.querySelector("#kpiCompletionRate"),
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
  organizationBars: document.querySelector("#organizationBars"),
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

function setExportRows(container, headers, rows) {
  container.dataset.exportRows = JSON.stringify([headers, ...rows]);
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

function closeExportMenus(except = null) {
  document.querySelectorAll(".export-control.open, .panel-export.open").forEach((control) => {
    if (except && control === except) return;
    control.classList.remove("open");
    control.querySelector("[aria-expanded]")?.setAttribute("aria-expanded", "false");
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
  renderRankedBars(
    els.districtBars,
    countBy(rows.filter((row) => isRealDistrict(row.district)), "district").slice(0, 10),
    palette.teal,
  );
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
  const districts = new Set(rows.map((row) => row.district).filter(isRealDistrict)).size;
  const allDistricts = new Set(state.rows.map((row) => row.district).filter(isRealDistrict)).size;
  const paired = rows.filter((row) => Number.isFinite(row.pre) && Number.isFinite(row.post)).length;
  const completionRate = rows.length ? Math.round((paired / rows.length) * 100) : 0;
  const topDistrict = countBy(rows.filter((row) => isRealDistrict(row.district)), "district")
    .map((item) => ({ name: item.name, value: average(item.rows, "gain"), count: item.count }))
    .filter((item) => Number.isFinite(item.value) && item.count >= 3)
    .sort((a, b) => b.value - a.value || b.count - a.count)[0];
  const districtCoverage = allDistricts ? Math.round((districts / allDistricts) * 100) : 0;

  els.kpiParticipants.textContent = formatNumber(rows.length);
  els.kpiFacilities.textContent = `${formatNumber(facilities)} facilities`;
  els.kpiPre.textContent = `Baseline ${formatScore(pre)}`;
  els.kpiPost.textContent = formatScore(post);
  els.kpiGain.textContent = gain == null ? "N/A" : `${gain >= 0 ? "+" : ""}${Math.round(gain)} pts`;
  els.kpiGainContext.textContent =
    gain == null ? "No paired scores" : `${formatScore(pre)} to ${formatScore(post)}`;
  els.kpiLift.textContent = topDistrict
    ? `${topDistrict.value >= 0 ? "+" : ""}${Math.round(topDistrict.value)} pts`
    : "N/A";
  els.kpiLiftContext.textContent = topDistrict ? shorten(topDistrict.name, 18) : "Top district";
  els.kpiCompletions.textContent = formatNumber(paired);
  els.kpiCompletionRate.textContent = `${completionRate}% completion rate`;
  els.kpiDistricts.textContent = `${formatNumber(districts)} / ${formatNumber(allDistricts)}`;
  els.kpiCourses.textContent = `${districtCoverage}% coverage`;
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
    delete els.trendChart.dataset.exportRows;
    els.trendChart.innerHTML = emptyMarkup("No dated records in this filter.");
    return;
  }
  setExportRows(
    els.trendChart,
    ["Month", "Average post-test", "Average improvement", "Participants"],
    grouped.map((item) => [monthLabel(item.name), Math.round(item.post), Math.round(item.gain), item.count]),
  );

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
    delete els.sexDonut.dataset.exportRows;
    els.sexDonut.innerHTML = emptyMarkup("No sex data in this filter.");
    els.sexLegend.innerHTML = "";
    return;
  }

  setExportRows(
    els.sexDonut,
    ["Sex", "Participants", "Share"],
    values.map((item) => [item.name, item.count, `${Math.round((item.count / total) * 100)}%`]),
  );
  els.sexDonut.innerHTML = `<div class="inline-bars" role="img" aria-label="Sex distribution bars">
    ${values
      .map(
        (item, index) => `<div class="bar-row">
          <div class="bar-top">
            <span>${escapeHtml(item.name)}</span>
            <strong>${formatNumber(item.count)}</strong>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.max(
            4,
            (item.count / total) * 100,
          )}%; background:${colors[index % colors.length]};"></div></div>
        </div>`,
      )
      .join("")}
  </div>`;

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
    .slice(0, 5)
    .map((item) => ({
      name: item.name,
      pre: average(item.rows, "pre") || 0,
      post: average(item.rows, "post") || 0,
      count: item.count,
    }));

  if (!courses.length) {
    delete els.courseBars.dataset.exportRows;
    els.courseBars.innerHTML = emptyMarkup("No course data in this filter.");
    return;
  }
  setExportRows(
    els.courseBars,
    ["Course", "Pre-test", "Post-test", "Improvement", "Participants"],
    courses.map((course) => [
      course.name,
      Math.round(course.pre),
      Math.round(course.post),
      Math.round(course.post - course.pre),
      course.count,
    ]),
  );

  const width = 760;
  const height = 250;
  const pad = { top: 18, right: 18, bottom: 84, left: 42 };
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
          const lines = wrapLabel(course.name, 15, 2);
          const gain = Math.round(course.post - course.pre);
          return `<g>
            <rect x="${center - barW - 3}" y="${yFor(course.pre)}" width="${barW}" height="${preH}" rx="5" fill="${palette.teal}"><title>${course.name} pre: ${Math.round(
              course.pre,
            )}%</title></rect>
            <rect x="${center + 3}" y="${yFor(course.post)}" width="${barW}" height="${postH}" rx="5" fill="${palette.violet}"><title>${course.name} post: ${Math.round(
              course.post,
            )}%</title></rect>
            <text class="axis-label" x="${center}" y="${Math.max(
              13,
              yFor(Math.max(course.pre, course.post)) - 9,
            )}" text-anchor="middle">+${gain}</text>
            <text class="axis-label" x="${center}" y="${height - 42}" text-anchor="middle">
              ${lines
                .map(
                  (line, lineIndex) =>
                    `<tspan x="${center}" dy="${lineIndex ? 13 : 0}">${escapeSvg(line)}</tspan>`,
                )
                .join("")}
            </text>
            <text class="axis-label" x="${center}" y="${height - 12}" text-anchor="middle">${course.count} people</text>
          </g>`;
        })
        .join("")}
      <g transform="translate(${width - 190} 6)">
        <rect width="10" height="10" rx="2" fill="${palette.teal}"></rect>
        <text class="axis-label" x="16" y="10">Pre-test</text>
        <rect x="86" width="10" height="10" rx="2" fill="${palette.violet}"></rect>
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
    delete els.gainTrendChart.dataset.exportRows;
    els.gainTrendChart.innerHTML = emptyMarkup("No paired score data in this filter.");
    return;
  }
  setExportRows(
    els.gainTrendChart,
    ["Month", "Average score lift", "Participants"],
    grouped.map((item) => [monthLabel(item.name), Math.round(item.gain), item.count]),
  );

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

function renderMetricBars(container, data, color, suffix = "") {
  if (!data.length) {
    delete container.dataset.exportRows;
    container.innerHTML = emptyMarkup("No ranked score lift data in this filter.");
    return;
  }
  setExportRows(
    container,
    ["Label", "Value", "Participants"],
    data.map((item) => [item.name, Math.round(item.value), item.count]),
  );
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
    delete els.courseMixDonut.dataset.exportRows;
    els.courseMixDonut.innerHTML = emptyMarkup("No course data in this filter.");
    els.courseMixLegend.innerHTML = "";
    return;
  }

  setExportRows(
    els.courseMixDonut,
    ["Course", "Participants", "Share"],
    values.map((item) => [item.name, item.count, `${Math.round((item.count / total) * 100)}%`]),
  );

  const width = 360;
  const height = 220;
  const pad = { top: 18, right: 16, bottom: 52, left: 34 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(...values.map((item) => item.count), 1);
  const groupW = plotW / values.length;
  const barW = Math.min(36, groupW * 0.54);

  els.courseMixDonut.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Course mix columns">
      ${[0, 0.5, 1]
        .map((ratio) => {
          const y = pad.top + plotH - ratio * plotH;
          return `<line class="grid-line" x1="${pad.left}" y1="${y}" x2="${
            width - pad.right
          }" y2="${y}"></line>`;
        })
        .join("")}
      ${values
        .map((item, index) => {
          const x = pad.left + index * groupW + (groupW - barW) / 2;
          const barH = (item.count / max) * plotH;
          const y = pad.top + plotH - barH;
          return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="7" fill="${
            colors[index % colors.length]
          }"><title>${item.name}: ${formatNumber(item.count)} people</title></rect>
          <text class="axis-label" x="${x + barW / 2}" y="${height - 18}" text-anchor="middle">${Math.round(
            (item.count / total) * 100,
          )}%</text>`;
        })
        .join("")}
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
    delete container.dataset.exportRows;
    container.innerHTML = emptyMarkup("No data in this filter.");
    return;
  }
  setExportRows(
    container,
    ["Label", "Participants"],
    data.map((item) => [item.name, item.count]),
  );
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
  setExportRows(document.querySelector(".database-summary"), ["Metric", "Value"], [
    ["Total records", rows.length],
    ["Facilities", facilities],
    ["Courses", courses],
    ["Paired scores", `${completeness}%`],
  ]);

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

function hydratePanelTools() {
  document.querySelectorAll(".panel[data-section]").forEach((panel) => {
    const header = panel.querySelector(".panel-header");
    if (!header || header.querySelector(".panel-tools")) return;

    const tools = document.createElement("div");
    tools.className = "panel-tools";
    tools.innerHTML = `
      <button class="icon-button" type="button" data-panel-action="copy-image" aria-label="Copy visual image">
        <svg viewBox="0 0 24 24">
          <rect x="9" y="9" width="11" height="11" rx="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
      <div class="panel-export">
        <button class="icon-button" type="button" data-panel-action="toggle-export" aria-label="Export visual">
          <svg viewBox="0 0 24 24">
            <path d="M12 3v12"></path>
            <path d="m7 10 5 5 5-5"></path>
            <path d="M5 21h14"></path>
          </svg>
        </button>
        <div class="export-menu">
          <button type="button" data-panel-export="image">Image</button>
          <button type="button" data-panel-export="excel">Excel</button>
        </div>
      </div>
      <button class="icon-button" type="button" data-panel-action="focus" aria-label="Open focus mode">
        <svg viewBox="0 0 24 24">
          <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"></path>
        </svg>
      </button>
    `;

    const trailingNode = header.lastElementChild;
    if (trailingNode && trailingNode !== header.firstElementChild) {
      const meta = document.createElement("div");
      meta.className = "panel-meta";
      meta.append(trailingNode);
      meta.append(tools);
      header.append(meta);
    } else {
      header.append(tools);
    }
  });
}

function panelTitle(panel) {
  return panel.querySelector(".panel-header h2")?.textContent?.trim() || "visual";
}

async function copyPanelImage(panel) {
  try {
    const blob = await panelImageBlob(panel);
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    showToast(`${panelTitle(panel)} image copied`);
  } catch (error) {
    const blob = await panelImageBlob(panel);
    downloadBlob(blob, `${slugify(panelTitle(panel))}.png`);
    showToast("Image downloaded; clipboard was unavailable");
  }
}

async function exportPanel(panel, type) {
  if (type === "image") {
    const blob = await panelImageBlob(panel);
    downloadBlob(blob, `${slugify(panelTitle(panel))}.png`);
    showToast(`${panelTitle(panel)} image exported`);
  } else {
    const rows = panelRows(panel);
    downloadExcel(`${panelTitle(panel)}`, rows, `${slugify(panelTitle(panel))}.xls`);
    showToast(`${panelTitle(panel)} Excel exported`);
  }
}

function panelRows(panel) {
  const exported = panel.matches("[data-export-rows]") ? panel : panel.querySelector("[data-export-rows]");
  if (exported?.dataset.exportRows) {
    try {
      const rows = JSON.parse(exported.dataset.exportRows);
      if (rows?.length) return rows;
    } catch (error) {
      // Fall through to DOM extraction.
    }
  }

  if (panel.classList.contains("database-panel")) {
    return [
      ["Name", "Sex", "Job title", "Organization", "Facility", "District", "Course", "Pre", "Post", "Gain"],
      ...state.filtered.slice(0, 40).map((row) => [
        row.name,
        row.sex,
        row.jobTitle,
        row.organization,
        row.facility,
        row.district,
        row.course,
        row.pre ?? "",
        row.post ?? "",
        row.gain ?? "",
      ]),
    ];
  }

  const rows = [...panel.querySelectorAll(".bar-row, .legend-row")].map((row) =>
    [...row.querySelectorAll("span, strong")].map((cell) => cell.textContent.trim()),
  );
  if (rows.length) return [["Label", "Value"], ...rows.map((row) => [row[0], row[row.length - 1] || ""])];

  const svg = panel.querySelector("svg");
  if (!svg) return [["Summary"], [panel.innerText.replace(/\s+/g, " ").trim()]];
  return [["Visual"], [panelTitle(panel)], ["Note"], ["Image-based chart exported separately as PNG."]];
}

async function panelImageBlob(panel) {
  const svg = panel.querySelector("svg");
  const markup = svg ? normalizeSvg(svg) : panelSummarySvg(panel);
  return svgTextToPngBlob(markup.text, markup.width, markup.height);
}

function normalizeSvg(svg) {
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const viewBox = clone.getAttribute("viewBox")?.split(/\s+/).map(Number) || [];
  const width = Number(clone.getAttribute("width")) || viewBox[2] || 960;
  const height = Number(clone.getAttribute("height")) || viewBox[3] || 520;
  clone.setAttribute("width", width);
  clone.setAttribute("height", height);
  clone.querySelectorAll("text").forEach((node) => {
    if (!node.getAttribute("font-family")) {
      node.setAttribute("font-family", "Inter, Arial, sans-serif");
    }
  });
  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", "#ffffff");
  clone.prepend(background);
  return { text: new XMLSerializer().serializeToString(clone), width, height };
}

function panelSummarySvg(panel) {
  const title = escapeXml(panelTitle(panel));
  const subtitle = escapeXml(panel.querySelector(".panel-header p")?.textContent?.trim() || "");
  const rows = panelRows(panel).slice(1, 10);
  const width = 960;
  const height = 180 + rows.length * 54;
  const body = rows
    .map(([label, value], index) => {
      const y = 132 + index * 54;
      return `<g>
        <text x="48" y="${y}" fill="#10192b" font-size="24" font-weight="700">${escapeXml(
          shorten(label, 48),
        )}</text>
        <text x="912" y="${y}" fill="#10192b" font-size="24" font-weight="800" text-anchor="end">${escapeXml(
          value,
        )}</text>
        <line x1="48" y1="${y + 22}" x2="912" y2="${y + 22}" stroke="#e8edf4" stroke-width="2"/>
      </g>`;
    })
    .join("");
  return {
    width,
    height,
    text: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="18" fill="#fbfdff" stroke="#dfe6ef"/>
      <text x="48" y="70" fill="#10233f" font-size="30" font-weight="850" font-family="Inter, Arial, sans-serif">${title}</text>
      <text x="48" y="104" fill="#617088" font-size="18" font-weight="650" font-family="Inter, Arial, sans-serif">${subtitle}</text>
      ${body}
    </svg>`,
  };
}

function svgTextToPngBlob(svgText, width, height) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * 2);
      canvas.height = Math.ceil(height * 2);
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.scale(2, 2);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not render image."));
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load visual image."));
    };
    image.src = url;
  });
}

async function exportDashboardImage() {
  const rows = [
    ["Total participants", els.kpiParticipants.textContent],
    ["Average improvement", els.kpiGain.textContent],
    ["District score lift", els.kpiLift.textContent],
    ["Completions", els.kpiCompletions.textContent],
    ["Active districts", els.kpiDistricts.textContent],
  ];
  const svg = dashboardSummarySvg(rows);
  const blob = await svgTextToPngBlob(svg.text, svg.width, svg.height);
  downloadBlob(blob, "training-dashboard-summary.png");
  showToast("Dashboard image exported");
}

function dashboardSummarySvg(rows) {
  const width = 1100;
  const height = 210 + rows.length * 60;
  const rowsMarkup = rows
    .map(([label, value], index) => {
      const y = 160 + index * 60;
      return `<text x="70" y="${y}" fill="#617088" font-size="22" font-weight="750" font-family="Inter, Arial, sans-serif">${escapeXml(
        label,
      )}</text><text x="1030" y="${y}" fill="#10233f" font-size="32" font-weight="850" text-anchor="end" font-family="Inter, Arial, sans-serif">${escapeXml(
        value,
      )}</text>`;
    })
    .join("");
  return {
    width,
    height,
    text: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="24" fill="#fbfdff" stroke="#dfe6ef"/>
      <text x="70" y="82" fill="#10233f" font-size="38" font-weight="850" font-family="Inter, Arial, sans-serif">Training Performance Dashboard</text>
      <text x="70" y="118" fill="#617088" font-size="20" font-weight="650" font-family="Inter, Arial, sans-serif">Filtered dashboard summary</text>
      ${rowsMarkup}
    </svg>`,
  };
}

function exportFilteredRows() {
  const headers = [
    "Name",
    "Sex",
    "Job title",
    "Organization",
    "Facility",
    "District",
    "Course",
    "Pre-test",
    "Post-test",
    "Gain",
  ];
  const rows = state.filtered.map((row) => [
    row.name,
    row.sex,
    row.jobTitle,
    row.organization,
    row.facility,
    row.district,
    row.course,
    row.pre ?? "",
    row.post ?? "",
    row.gain ?? "",
  ]);
  downloadExcel("Training Dashboard Export", [headers, ...rows], "training-dashboard-export.xls");
  showToast("Excel workbook exported");
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

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadExcel(sheetName, rows, filename) {
  const safeRows = rows?.length ? rows : [["No records"], ["No data matched the current filter."]];
  const html = `<!doctype html><html><head><meta charset="UTF-8"></head><body>
    <table>
      <caption>${escapeHtml(sheetName)}</caption>
      ${safeRows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
        )
        .join("")}
    </table>
  </body></html>`;
  downloadBlob(new Blob([`\ufeff${html}`], { type: "application/vnd.ms-excel;charset=utf-8" }), filename);
}

function slugify(value) {
  return String(value || "visual")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    hydratePanelTools();
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
els.exportData.addEventListener("click", (event) => {
  event.stopPropagation();
  closeExportMenus();
  const control = event.currentTarget.closest(".export-control");
  control.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(control.classList.contains("open")));
});
els.exportMenu.addEventListener("click", (event) => {
  const action = event.target.closest("[data-global-export]")?.dataset.globalExport;
  if (action === "excel") exportFilteredRows();
  if (action === "image") exportDashboardImage();
  closeExportMenus();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".premium-select")) closePremiumSelects();
  if (!event.target.closest(".export-control") && !event.target.closest(".panel-export")) {
    closeExportMenus();
  }
  const panelButton = event.target.closest("[data-panel-action]");
  if (panelButton) {
    const panel = panelButton.closest(".panel");
    const action = panelButton.dataset.panelAction;
    if (action === "copy-image") copyPanelImage(panel);
    if (action === "toggle-export") {
      event.stopPropagation();
      closeExportMenus(panelButton.closest(".panel-export"));
      panelButton.closest(".panel-export").classList.toggle("open");
    }
    if (action === "focus") openFocusMode(panel);
  }
  const panelExport = event.target.closest("[data-panel-export]");
  if (panelExport) {
    const panel = panelExport.closest(".panel");
    exportPanel(panel, panelExport.dataset.panelExport);
    closeExportMenus();
  }
  if (event.target.closest("[data-close-focus]")) closeFocusMode();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePremiumSelects();
  if (event.key === "Escape") closeExportMenus();
  if (event.key === "Escape" && !els.focusLayer.hidden) closeFocusMode();
});

els.navItems.forEach((item) => {
  item.addEventListener("click", () => {
    state.activeView = item.dataset.view;
    renderView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

loadData();
