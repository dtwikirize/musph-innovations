import argparse
import json
import re
from datetime import date
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn


ROOT = Path(__file__).resolve().parents[1]

PROFILES = {
    "msm": {
        "source": Path(r"C:\Users\USER\Downloads\Report\MSM_BBS_Crane 3.docx"),
        "raw": ROOT / "public" / "data" / "crane3-msm-tables.json",
        "dashboard": ROOT / "public" / "data" / "crane3-msm-dashboard.json",
        "group": "MSM",
        "population": "Men at risk",
        "reportTitle": "MSM BBS Crane 3",
        "dashboardTitle": "CRANE 3 MSM Dashboard",
        "surveyLabel": "MSM Bio-behavioral Survey, Uganda 2021-2023",
        "period": "2021-2023",
        "prefix": "crane3-msm",
        "themes": {
            "A": "Demographics",
            "B": "Stigma and Health Care",
            "C": "Outreach Services",
            "D": "HIV Testing History",
            "E": "HIV Cascade",
            "F": "PrEP",
            "G": "Tuberculosis",
            "H": "Alcohol Use",
            "J": "Mental Health",
            "K": "Drug Use",
            "L": "HIV Socio-demographics",
            "M": "ART Characteristics",
            "N": "Viral Load and CD4",
            "O": "HIV and Syphilis",
        },
    },
    "pwid": {
        "source": Path(r"C:\Users\USER\Downloads\Report\PWID_BBS_Crane 3.docx"),
        "raw": ROOT / "public" / "data" / "crane3-pwid-tables.json",
        "dashboard": ROOT / "public" / "data" / "crane3-pwid-dashboard.json",
        "group": "PWID",
        "population": "People who inject drugs",
        "reportTitle": "PWID BBS Crane 3",
        "dashboardTitle": "CRANE 3 PWID Dashboard",
        "surveyLabel": "PWID Bio-behavioral Survey, Uganda 2023",
        "period": "2023",
        "prefix": "crane3-pwid",
        "themes": {
            "A": "Demographics",
            "B": "Injection Drug Use",
            "C": "Stigma and Health Care",
            "D": "HIV Testing History",
            "E": "HIV, Syphilis, HBV and HCV Burden",
            "F": "Reproductive Health",
            "G": "Outreach Services",
            "H": "HIV Socio-demographics",
            "I": "Tuberculosis",
            "J": "ART Characteristics",
            "K": "HIV Cascade",
            "L": "Viral Load and CD4",
            "M": "PrEP",
            "N": "Alcohol Use",
            "O": "Mental Health",
            "Q": "Depression",
        },
    },
}


def clean(value):
    return re.sub(r"\s+", " ", str(value or "").replace("\xa0", " ")).strip()


def compact(value):
    return re.sub(r"[^a-z0-9]", "", clean(value).lower())


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
    if len(nums) >= 3:
        return int(round(nums[0])), int(round(nums[1])), int(round(nums[2]))
    return int(round(nums[0])), None, None


def iter_blocks(document):
    table_by_element = {table._tbl: table for table in document.tables}
    for child in document.element.body.iterchildren():
        if child.tag == qn("w:p"):
            text = "".join(node.text or "" for node in child.iter() if node.tag == qn("w:t"))
            yield "paragraph", clean(text)
        elif child.tag == qn("w:tbl"):
            yield "table", table_by_element[child]


def row_text(row):
    return [clean(cell.text) for cell in row.cells]


def title_for_table(recent):
    for text in reversed(recent):
        if re.match(r"^Table\s+[A-Z]\s*\d*\s*[:\-]?", text, re.I):
            return text
        if re.match(r"^Table\s+\d+\s*[A-Z]?:", text, re.I):
            return text
        if "Population Size Estimate" in text:
            return text
    return recent[-1] if recent else ""


def table_code(title):
    letter_match = re.search(r"\bTable\s+([A-Z])\s*(\d*)\s*[:\-]?", title, re.I)
    if letter_match:
        number = letter_match.group(2) or "0"
        return f"{letter_match.group(1).upper()}{number}"
    return ""


def site_from_title(title, code, sites):
    number = re.search(r"\d+", code or "")
    if number and number.group(0) == "0":
        return "All sites"
    normalized = title.split(":", 1)[1] if ":" in title else title
    normalized_compact = compact(normalized)
    for site in sorted(sites, key=len, reverse=True):
        if re.search(rf"\b{re.escape(site)}\b", normalized, re.I) or compact(site) in normalized_compact:
            return site
    return ""


def extract_raw_tables(document, profile):
    recent = []
    preliminary = []

    for kind, payload in iter_blocks(document):
        if kind == "paragraph":
            text = payload
            if text:
                recent.append(text)
                recent = recent[-10:]
            continue

        title = title_for_table(recent)
        code = table_code(title)
        rows = [row_text(row) for row in payload.rows]
        preliminary.append(
            {
                "code": code,
                "title": title,
                "theme": profile["themes"].get(code[:1], "Methods and Annexes"),
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
            and clean(table["rows"][0][0]).lower() in {"site", "location"}
            and (
                "population size estimate" in clean(table["rows"][0][1]).lower()
                or (len(table["rows"]) > 1 and "population size estimate" in " ".join(table["rows"][1]).lower())
            )
        ),
        None,
    )
    sites = []
    if pse_table:
        for row in pse_table["rows"][1:]:
            site = clean(row[0])
            if site and site.lower() not in {"total", "pooled", "location"}:
                sites.append(site)

    tables = []
    for index, table in enumerate(preliminary, 1):
        code = table["code"]
        table["id"] = f"{profile['prefix']}-table-{index:03d}"
        table["index"] = index
        table["site"] = site_from_title(table["title"], code, sites)
        tables.append(table)

    return tables, sites


def clean_group(value):
    return clean(value).replace("ï¼š", ":").replace(" :", ":").rstrip(":")


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


def build_themes(tables, profile, site=None):
    themes = {}
    for table in tables:
        code = clean(table.get("code"))
        key = code[:1]
        if not code or key not in profile["themes"]:
            continue
        table_site = table.get("site", "")
        if site is None and table_site != "All sites":
            continue
        if site is not None and table_site != site:
            continue
        indicators = indicators_from_table(table)
        if not indicators:
            continue
        existing = themes.get(key, {}).get("allIndicators", [])
        themes[key] = {
            "key": key,
            "name": profile["themes"][key],
            "tableId": table["id"],
            "tableTitle": table["title"],
            "tableIndex": table["index"],
            "allIndicators": dedupe_indicators(existing + indicators),
        }

    output = []
    for key, theme in themes.items():
        theme["indicatorCount"] = len(theme["allIndicators"])
        theme["featuredIndicators"] = theme["allIndicators"][:4]
        output.append(theme)
    return output


def build_site_themes(tables, sites, profile):
    site_themes = {}
    for site in sites:
        for theme in build_themes(tables, profile, site):
            key = theme["key"]
            site_themes.setdefault(site, {})
            site_themes[site][key] = {
                "key": key,
                "name": theme["name"],
                "tableTitle": theme["tableTitle"],
                "site": site,
                "indicatorCount": theme["indicatorCount"],
                "allIndicators": theme["allIndicators"],
            }
    return site_themes


def find_indicator_item(themes, pattern):
    regex = re.compile(pattern, re.I)
    for theme in themes:
        found = next((item for item in theme["allIndicators"] if regex.search(item["label"])), None)
        if found:
            return found
    return None


def find_indicator(themes, pattern, default=0):
    item = find_indicator_item(themes, pattern)
    return item["estimate"] if item else default


def build_population_estimates(tables):
    table = next(
        (
            item
            for item in tables
            if item["rows"]
            and clean(item["rows"][0][0]).lower() in {"site", "location"}
            and (
                "population size estimate" in clean(item["rows"][0][1]).lower()
                or (len(item["rows"]) > 1 and "population size estimate" in " ".join(item["rows"][1]).lower())
            )
        ),
        None,
    )
    rows = []
    if not table:
        return rows
    for row in table["rows"][1:]:
        site = clean(row[0])
        if not site or site.lower() in {"total", "pooled", "location"}:
            continue
        cell = row[1] if len(row) > 1 else ""
        if "estimate" in clean(cell).lower() and len(row) > 3:
            estimate, lower, upper = parse_int(row[3]), parse_int(row[2]), parse_int(row[4])
            label = f"{estimate} ({lower} - {upper})"
        else:
            estimate, lower, upper = parse_estimate_ci(cell)
            label = clean(cell)
        if estimate is None:
            continue
        rows.append({"site": site, "estimate": estimate, "lower": lower, "upper": upper, "label": label})
    return rows


def build_prevalence_by_site(tables, profile):
    table = next(
        (
            item
            for item in tables
            if item["rows"]
            and clean(item["rows"][0][0]).lower() in {"district", "site"}
            and "hiv" in " ".join(item["rows"][0]).lower()
            and ("syphilis" in " ".join(item["rows"][0]).lower() or "active syphilis" in " ".join(item["rows"][0]).lower())
        ),
        None,
    )
    rows = []
    if not table:
        return rows
    headers = [clean(item).lower() for item in table["rows"][0]]
    hiv_idx = next((idx for idx, text in enumerate(headers) if text == "hiv" or "hiv" in text), 1)
    syph_idx = next((idx for idx, text in enumerate(headers) if "syphilis" in text), None)
    other_idx = next((idx for idx, text in enumerate(headers) if "hpv" in text or "hcv" in text or "hbv" in text), None)
    for row in table["rows"][1:]:
        site = clean(row[0])
        if not site or site.lower() in {"total", "pooled"}:
            continue
        rows.append(
            {
                "site": site,
                "hiv": parse_num(row[hiv_idx] if len(row) > hiv_idx else "") or 0,
                "hpv": parse_num(row[other_idx] if other_idx is not None and len(row) > other_idx else "") or 0,
                "syphilis": parse_num(row[syph_idx] if syph_idx is not None and len(row) > syph_idx else "") or 0,
                "hivLabel": clean(row[hiv_idx] if len(row) > hiv_idx else ""),
                "hpvLabel": clean(row[other_idx] if other_idx is not None and len(row) > other_idx else ""),
                "syphilisLabel": clean(row[syph_idx] if syph_idx is not None and len(row) > syph_idx else ""),
            }
        )
    return rows


def build_cascade_by_site(tables):
    table = next(
        (
            item
            for item in tables
            if item["rows"]
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
            and "sampling" in clean(item["rows"][0][1]).lower()
            and "coupon" in " ".join(item["rows"][0]).lower()
        ),
        None,
    )
    rows = []
    if not table:
        return rows
    headers = [clean(item).lower() for item in table["rows"][0]]
    eligible_idx = next((i for i, h in enumerate(headers) if "eligible" in h and "ineligible" not in h), 8)
    ineligible_idx = next((i for i, h in enumerate(headers) if "ineligible" in h), 7)
    for row in table["rows"][1:]:
        site = clean(row[0])
        if not site or site.lower() in {"total", "pooled"}:
            continue
        eligible = parse_int(row[eligible_idx] if len(row) > eligible_idx else "") or 0
        ineligible = parse_int(row[ineligible_idx] if len(row) > ineligible_idx else "") or 0
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


def build_dashboard(profile):
    document = Document(profile["source"])
    tables, sites = extract_raw_tables(document, profile)
    source = {
        "group": profile["group"],
        "population": profile["population"],
        "reportTitle": profile["reportTitle"],
        "period": profile["period"],
        "sourceFile": str(profile["source"]),
        "extractedOn": date.today().isoformat(),
        "siteThemesBuiltOn": date.today().isoformat(),
        "dashboardTitle": profile["dashboardTitle"],
        "surveyLabel": profile["surveyLabel"],
    }

    raw = {"source": source, "tables": tables}
    profile["raw"].write_text(json.dumps(raw, indent=2) + "\n", encoding="utf-8")

    themes = build_themes(tables, profile)
    site_themes = build_site_themes(tables, sites, profile)
    population_estimates = build_population_estimates(tables)
    prevalence_by_site = build_prevalence_by_site(tables, profile)
    cascade_by_site = build_cascade_by_site(tables)
    enrollment_by_site = build_enrollment_by_site(tables)
    age_item = find_indicator_item(themes, r"Age\*|Age at injection drug debut\*")
    participants = parse_int(age_item["unweightedN"]) if age_item else sum(row["eligible"] for row in enrollment_by_site)

    dashboard = {
        "source": source,
        "metrics": {
            "participants": participants,
            "surveySites": len(sites),
            "tablesExtracted": len(tables),
            "populationEstimate3scrc": sum(row["estimate"] for row in population_estimates),
            "hivPrevalenceWeighted": find_indicator(themes, r"Overall HIV prevalence.*HIV positive|HIV positive", 0),
            "hpvAverageAcrossSites": find_indicator(themes, r"Overall HPV prevalence|Overall HCV prevalence|HCV positive|HBV positive", 0),
            "syphilisAverageAcrossSites": find_indicator(themes, r"Active Syphilis.*Positive|Active syphilis", 0),
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
    profile["dashboard"].write_text(json.dumps(dashboard, indent=2) + "\n", encoding="utf-8")
    return {
        "group": profile["group"],
        "tables": len(tables),
        "themes": len(themes),
        "sites": len(sites),
        "participants": participants,
        "hivPrevalence": dashboard["metrics"]["hivPrevalenceWeighted"],
        "dashboard": str(profile["dashboard"]),
        "raw": str(profile["raw"]),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("profile", choices=sorted(PROFILES.keys()))
    args = parser.parse_args()
    print(json.dumps(build_dashboard(PROFILES[args.profile]), indent=2))


if __name__ == "__main__":
    main()
