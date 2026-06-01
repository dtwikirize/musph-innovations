import json
import re
from datetime import date
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DOC = Path(r"C:\Users\USER\Downloads\Report\CRANE4_WCS_Sentinel Surveillance Survey_Report_Final_draft.2.docx")
RAW_OUT = ROOT / "public" / "data" / "crane4-fsw-tables.json"
DASHBOARD_OUT = ROOT / "public" / "data" / "crane4-fsw-dashboard.json"

THEMES = {
    "A": "Demographics",
    "B": "Sexual Behaviour",
    "C": "Stigma and Health Care",
    "D": "HIV Testing History",
    "E": "HIV, Syphilis and HPV Burden",
    "F": "Maternal Health",
    "G": "Outreach Services",
    "H": "HIV Socio-demographics",
    "I": "Non-communicable Diseases",
    "J": "Tuberculosis",
    "K": "PrEP",
    "L": "HIV Cascade",
    "M": "Viral Load and CD4",
    "N": "ART Adherence",
    "O": "Alcohol Use",
    "P": "Drug Use",
    "Q": "Mental Health",
    "R": "Violence",
}


def clean(value):
    return re.sub(r"\s+", " ", str(value or "").replace("\xa0", " ")).strip()


def parse_num(value):
    match = re.search(r"-?\d+(?:\.\d+)?", clean(value).replace(",", ""))
    return float(match.group(0)) if match else None


def parse_int(value):
    parsed = parse_num(value)
    return int(round(parsed)) if parsed is not None else None


def parse_estimate_ci(value):
    text = clean(value).replace(",", "")
    nums = [float(x) for x in re.findall(r"\d+(?:\.\d+)?", text)]
    if not nums:
        return None, None, None
    estimate = int(round(nums[0]))
    lower = int(round(nums[1])) if len(nums) > 1 else None
    upper = int(round(nums[2])) if len(nums) > 2 else None
    return estimate, lower, upper


def title_for_table(recent, current_result):
    for text in reversed(recent):
        if re.match(r"^Table\s+[A-Z]\s*\d+", text, re.I):
            return text
        if re.match(r"^Pooled data\b", text, re.I):
            return text
        if re.match(r"^Table\s+\d+\s*[A-Z]?:", text, re.I):
            return text
        if "Population Size Estimates" in text:
            return text
    return recent[-1] if recent else ""


def table_code(title, current_result):
    match = re.search(r"\bTable\s+([A-Z])\s*(\d+)\b", title, re.I)
    if match:
        return f"{match.group(1).upper()}{match.group(2)}"
    if re.match(r"^Pooled data\b", title, re.I) and current_result in THEMES:
        return f"{current_result}0"
    return ""


def site_from_title(title, code, sites):
    number = re.search(r"\d+", code or "")
    if number and number.group(0) == "0":
        return "All sites"
    after_colon = title.split(":", 1)[1] if ":" in title else title
    normalized = clean(after_colon)
    for site in sorted(sites, key=len, reverse=True):
        if re.match(rf"^{re.escape(site)}\b", normalized, re.I):
            return site
    return ""


def row_text(row):
    return [clean(cell.text) for cell in row.cells]


def iter_blocks(document):
    table_by_element = {table._tbl: table for table in document.tables}
    for child in document.element.body.iterchildren():
        if child.tag == qn("w:p"):
            text = "".join(node.text or "" for node in child.iter() if node.tag == qn("w:t"))
            yield "paragraph", clean(text)
        elif child.tag == qn("w:tbl"):
            yield "table", table_by_element[child]


def extract_raw_tables(document):
    recent = []
    current_result = ""
    preliminary = []

    for kind, payload in iter_blocks(document):
        if kind == "paragraph":
            text = payload
            if not text:
                continue
            result_match = re.match(r"^Result\s+([A-Z])\b", text, re.I)
            if result_match:
                current_result = result_match.group(1).upper()
            recent.append(text)
            recent = recent[-10:]
            continue

        title = title_for_table(recent, current_result)
        code = table_code(title, current_result)
        rows = [row_text(row) for row in payload.rows]
        preliminary.append(
            {
                "code": code,
                "title": title,
                "theme": THEMES.get(code[:1], "Methods and Annexes"),
                "context": recent[-5:],
                "rows": rows,
                "rowCount": len(rows),
                "columnCount": max((len(row) for row in rows), default=0),
            }
        )

    pse_table = next(
        (
            table
            for table in preliminary
            if table["rows"]
            and clean(table["rows"][0][0]).lower() == "site"
            and "population size estimate" in clean(table["rows"][0][1]).lower()
        ),
        None,
    )
    sites = []
    if pse_table:
        for row in pse_table["rows"][1:]:
            site = clean(row[0])
            if site and site.lower() != "total":
                sites.append(site)

    tables = []
    for index, table in enumerate(preliminary, 1):
        code = table["code"]
        table["id"] = f"crane4-fsw-table-{index:03d}"
        table["index"] = index
        table["site"] = site_from_title(table["title"], code, sites)
        tables.append(table)

    return tables, sites


def clean_group(value):
    return clean(value).replace("：", ":").replace(" :", ":").rstrip(":")


def indicators_from_table(table):
    indicators = []
    current_group = ""
    for row in table.get("rows", []):
        characteristic = clean(row[0] if row else "")
        if not characteristic:
            continue
        if re.match(r"^(Characteristic|Unweighted)$", characteristic, re.I):
            continue
        if re.search(r"summary$|^\* For continuous variables", characteristic, re.I):
            continue

        estimate = parse_num(row[3] if len(row) > 3 else "")
        if estimate is None:
            if len(row) <= 2 or all(not clean(cell) for cell in row[1:]):
                current_group = clean_group(re.sub(r"\s*\(N\s*=.*?\)\s*", "", characteristic, flags=re.I))
            continue

        group = "" if characteristic.endswith("*") else current_group
        indicators.append(
            {
                "label": f"{group}: {characteristic}" if group else characteristic,
                "shortLabel": characteristic,
                "group": group,
                "estimate": estimate,
                "lower": parse_num(row[4] if len(row) > 4 else ""),
                "upper": parse_num(row[5] if len(row) > 5 else ""),
                "unweightedN": clean(row[1] if len(row) > 1 else ""),
                "unweightedPct": clean(row[2] if len(row) > 2 else ""),
                "site": table.get("site", ""),
                "tableIndex": table.get("index"),
                "tableCode": table.get("code", ""),
            }
        )
    return indicators


def build_themes(tables, site=None):
    themes = []
    source_tables = []
    for table in tables:
        code = clean(table.get("code"))
        if not code or code[:1] not in THEMES:
            continue
        table_site = table.get("site", "")
        if site is None and table_site != "All sites":
            continue
        if site is not None and table_site != site:
            continue
        source_tables.append(table)

    for table in source_tables:
        key = table["code"][:1]
        indicators = indicators_from_table(table)
        if not indicators:
            continue
        themes.append(
            {
                "key": key,
                "name": THEMES[key],
                "tableId": table["id"],
                "tableTitle": table["title"],
                "tableIndex": table["index"],
                "indicatorCount": len(indicators),
                "featuredIndicators": indicators[:4],
                "allIndicators": indicators,
            }
        )
    return themes


def dedupe_indicators(items):
    seen = set()
    output = []
    for item in items:
        marker = (item.get("label"), item.get("estimate"), item.get("tableIndex"))
        if marker in seen:
            continue
        seen.add(marker)
        output.append(item)
    return output


def build_site_themes(tables, sites):
    site_themes = {}
    for site in sites:
        for theme in build_themes(tables, site):
            key = theme["key"]
            site_themes.setdefault(site, {})
            existing = site_themes[site].get(key, {}).get("allIndicators", [])
            indicators = dedupe_indicators(existing + theme["allIndicators"])
            site_themes[site][key] = {
                "key": key,
                "name": theme["name"],
                "tableTitle": theme["tableTitle"],
                "site": site,
                "indicatorCount": len(indicators),
                "allIndicators": indicators,
            }
    return site_themes


def find_indicator(themes, key, pattern, default=0):
    regex = re.compile(pattern, re.I)
    theme = next((item for item in themes if item["key"] == key), None)
    if not theme:
        return default
    found = next((item for item in theme["allIndicators"] if regex.search(item["label"])), None)
    return found["estimate"] if found else default


def find_indicator_item(themes, key, pattern):
    regex = re.compile(pattern, re.I)
    theme = next((item for item in themes if item["key"] == key), None)
    if not theme:
        return None
    return next((item for item in theme["allIndicators"] if regex.search(item["label"])), None)


def build_population_estimates(tables):
    table = next(
        (
            item
            for item in tables
            if item["rows"]
            and clean(item["rows"][0][0]).lower() == "site"
            and "population size estimate" in clean(item["rows"][0][1]).lower()
        ),
        None,
    )
    rows = []
    if not table:
        return rows
    for row in table["rows"][1:]:
        site = clean(row[0])
        if not site or site.lower() in {"total", "pooled"}:
            continue
        estimate, lower, upper = parse_estimate_ci(row[1] if len(row) > 1 else "")
        if estimate is None:
            continue
        rows.append(
            {
                "site": site,
                "estimate": estimate,
                "lower": lower,
                "upper": upper,
                "label": clean(row[1]),
            }
        )
    return rows


def build_prevalence_by_site(tables):
    table = next(
        (
            item
            for item in tables
            if item["rows"]
            and clean(item["rows"][0][0]).lower() == "district"
            and clean(item["rows"][0][1]).lower() == "hiv"
        ),
        None,
    )
    rows = []
    if not table:
        return rows
    for row in table["rows"][2:]:
        site = clean(row[0])
        if not site or site.lower() in {"total", "pooled"}:
            continue
        rows.append(
            {
                "site": site,
                "hiv": parse_num(row[1] if len(row) > 1 else "") or 0,
                "hpv": parse_num(row[2] if len(row) > 2 else "") or 0,
                "syphilis": parse_num(row[3] if len(row) > 3 else "") or 0,
                "hivLabel": clean(row[1] if len(row) > 1 else ""),
                "hpvLabel": clean(row[2] if len(row) > 2 else ""),
                "syphilisLabel": clean(row[3] if len(row) > 3 else ""),
            }
        )
    return rows


def build_cascade_by_site(tables):
    table = next(
        (
            item
            for item in tables
            if item["rows"]
            and clean(item["rows"][0][0]).lower() == "site"
            and "conditional" in " ".join(item["rows"][0]).lower()
            and "unconditional" in " ".join(item["rows"][0]).lower()
        ),
        None,
    )
    rows = []
    if not table:
        return rows
    for row in table["rows"][2:]:
        site = clean(row[0])
        if not site or site.lower() in {"total", "pooled"}:
            continue
        rows.append(
            {
                "site": site,
                "conditionalAware": parse_num(row[1] if len(row) > 1 else "") or 0,
                "conditionalArt": parse_num(row[2] if len(row) > 2 else "") or 0,
                "conditionalVls": parse_num(row[3] if len(row) > 3 else "") or 0,
                "unconditionalAware": parse_num(row[4] if len(row) > 4 else "") or 0,
                "unconditionalArt": parse_num(row[5] if len(row) > 5 else "") or 0,
                "unconditionalVls": parse_num(row[6] if len(row) > 6 else "") or 0,
            }
        )
    return rows


def build_enrollment_by_site(tables):
    table = next(
        (
            item
            for item in tables
            if item["rows"]
            and clean(item["rows"][0][0]).lower() == "site"
            and "sampling month" in clean(item["rows"][0][1]).lower()
        ),
        None,
    )
    rows = []
    if not table:
        return rows
    for row in table["rows"][1:]:
        site = clean(row[0])
        if not site or site.lower() in {"total", "pooled"}:
            continue
        eligible = parse_int(row[7] if len(row) > 7 else "") or parse_int(row[-1] if row else "") or 0
        ineligible = parse_int(row[8] if len(row) > 8 else "") or 0
        rows.append(
            {
                "site": site,
                "period": clean(row[1] if len(row) > 1 else ""),
                "days": parse_int(row[2] if len(row) > 2 else "") or 0,
                "seeds": parse_int(row[3] if len(row) > 3 else "") or 0,
                "couponsIssued": parse_int(row[4] if len(row) > 4 else "") or 0,
                "couponsRedeemed": parse_int(row[5] if len(row) > 5 else "") or 0,
                "couponRedemptionPct": parse_num(row[6] if len(row) > 6 else "") or 0,
                "eligible": eligible,
                "ineligible": ineligible,
                "eligibilityPct": (eligible / (eligible + ineligible) * 100) if eligible + ineligible else 0,
            }
        )
    return rows


def main():
    document = Document(SOURCE_DOC)
    tables, sites = extract_raw_tables(document)
    source = {
        "group": "FSW",
        "population": "Women engaged in commercial sex",
        "reportTitle": "CRANE4 WCS Sentinel Surveillance Survey Report Final Draft 2",
        "period": "2024-2025",
        "sourceFile": str(SOURCE_DOC),
        "extractedOn": date.today().isoformat(),
        "siteThemesBuiltOn": date.today().isoformat(),
        "dashboardTitle": "CRANE 4 FSW Dashboard",
        "surveyLabel": "FSW Sentinel Surveillance Survey, Uganda 2024-2025",
    }

    raw = {"source": source, "tables": tables}
    RAW_OUT.write_text(json.dumps(raw, indent=2) + "\n", encoding="utf-8")

    themes = build_themes(tables)
    site_themes = build_site_themes(tables, sites)
    population_estimates = build_population_estimates(tables)
    prevalence_by_site = build_prevalence_by_site(tables)
    cascade_by_site = build_cascade_by_site(tables)
    enrollment_by_site = build_enrollment_by_site(tables)
    participants = parse_int(find_indicator_item(themes, "A", r"Age\*")["unweightedN"]) if find_indicator_item(themes, "A", r"Age\*") else sum(row["eligible"] for row in enrollment_by_site)

    dashboard = {
        "source": source,
        "metrics": {
            "participants": participants,
            "surveySites": len(sites),
            "tablesExtracted": len(tables),
            "populationEstimate3scrc": sum(row["estimate"] for row in population_estimates),
            "hivPrevalenceWeighted": find_indicator(themes, "E", r"Overall HIV prevalence.*HIV positive", 0),
            "hpvAverageAcrossSites": find_indicator(themes, "E", r"Overall HPV prevalence|HPV.*Positive|HPV positive", 0),
            "syphilisAverageAcrossSites": find_indicator(themes, "E", r"Active Syphilis.*Positive|Active syphilis", 0),
            "hivAverageAcrossSites": sum(row["hiv"] for row in prevalence_by_site) / len(prevalence_by_site) if prevalence_by_site else 0,
        },
        "populationEstimates": [
            {
                "site": row["site"],
                "femalePopulation1549": 0,
                "lower": row["lower"],
                "estimate": row["estimate"],
                "upper": row["upper"],
                "relativePct": 0,
                "networkEstimate": 0,
                "networkRelativePct": 0,
            }
            for row in population_estimates
        ],
        "populationEstimateSummary": population_estimates,
        "prevalenceBySite": prevalence_by_site,
        "cascadeBySite": cascade_by_site,
        "enrollmentBySite": enrollment_by_site,
        "themes": themes,
        "tableIndex": [
            {
                "id": table["id"],
                "index": table["index"],
                "code": table["code"],
                "theme": table["theme"],
                "site": table["site"],
                "title": table["title"],
                "rowCount": table["rowCount"],
                "columnCount": table["columnCount"],
            }
            for table in tables
        ],
        "siteThemes": site_themes,
    }
    DASHBOARD_OUT.write_text(json.dumps(dashboard, indent=2) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "tables": len(tables),
                "themes": len(themes),
                "sites": len(sites),
                "participants": participants,
                "hivPrevalence": dashboard["metrics"]["hivPrevalenceWeighted"],
                "dashboard": str(DASHBOARD_OUT),
                "raw": str(RAW_OUT),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
