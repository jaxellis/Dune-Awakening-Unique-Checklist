from __future__ import annotations

from lxml import html
import re
import logging
from enums import ItemCategory, WeaponType, ArmorType, ToolType, VehicleType
from utils import normalize_text, keyword_in_text

logger = logging.getLogger("scraper")


CATEGORIES: list[str] = []
LOCATIONS: list[str] = []


def categorize_types(tree: html.HtmlElement) -> list[str]:
    """Detect a single main type and related subtypes from the infobox."""
    text = normalize_text(" ".join(tree.xpath("//text()")))
    infobox_rows = tree.xpath('//tr[th[contains(@class,"infobox-label")]]')

    infobox_data = {}
    for row in infobox_rows:
        label: str = normalize_text("".join(row.xpath("./th//text()")))
        value: str = normalize_text("".join(row.xpath("./td//text()")))
        if label and value:
            infobox_data[label.lower()] = value.lower()

    main_type = detect_main_type(infobox_data, text)
    if not main_type:
        logger.debug("Main type not detected; marking as Unknown")
        return [ItemCategory.UNKNOWN.value]

    match main_type:
        case ItemCategory.WEAPON.value:
            subtypes = detect_weapon_subtypes(infobox_data, text)
        case ItemCategory.ARMOR.value:
            subtypes = detect_armor_subtypes(infobox_data)
        case ItemCategory.TOOL.value:
            subtypes = detect_tool_subtypes(infobox_data, text)
        case ItemCategory.VEHICLE.value:
            subtypes = detect_vehicle_subtypes(infobox_data, text)
        case _:
            subtypes = []

    logger.debug(f"Detected {main_type} → Subtypes: {subtypes}")
    return [main_type] + subtypes


def detect_main_type(infobox_data: dict[str, str], text: str) -> str | None:
    """Return the main item category based on infobox labels and fallback keywords."""

    if "vehicle module stats" in infobox_data or "module type" in infobox_data:
        logger.debug("Main type detected as Vehicle (infobox label found)")
        return ItemCategory.VEHICLE.value

    if "fire mode" in infobox_data or "damage type" in infobox_data:
        logger.debug("Main type detected as Weapon (infobox label found)")
        return ItemCategory.WEAPON.value

    if "armor rating" in infobox_data or "armor type" in infobox_data:
        logger.debug("Main type detected as Armor (infobox label found)")
        return ItemCategory.ARMOR.value

    if "tool type" in infobox_data:
        logger.debug("Main type detected as Tool (infobox label found)")
        return ItemCategory.TOOL.value

    if keyword_in_text(text, ["armor", "helmet", "suit", "stillsuit"]):
        logger.debug("Main type detected as Armor (text fallback)")
        return ItemCategory.ARMOR.value
    if keyword_in_text(text, ["weapon", "gun", "rifle", "pistol", "blade", "sword"]):
        logger.debug("Main type detected as Weapon (text fallback)")
        return ItemCategory.WEAPON.value
    if keyword_in_text(text, ["tool", "shield", "extractor", "container", "pack"]):
        logger.debug("Main type detected as Tool (text fallback)")
        return ItemCategory.TOOL.value
    if keyword_in_text(text, ["vehicle", "ornithopter", "buggy", "sandbike"]):
        logger.debug("Main type detected as Vehicle (text fallback)")
        return ItemCategory.VEHICLE.value

    return None


def detect_weapon_subtypes(infobox_data: dict[str, str], text: str) -> list[str]:
    subtypes = []
    if "fire mode" in infobox_data:
        subtypes.append(WeaponType.RANGED.value)
        logger.debug("Weapon subtype Ranged (Fire Mode found)")
    elif "damage type" in infobox_data and keyword_in_text(
        infobox_data["damage type"], ["blade", "melee"]
    ):
        subtypes.append(WeaponType.MELEE.value)
        logger.debug("Weapon subtype Melee (Damage Type found)")
    elif keyword_in_text(text, ["gun", "rifle", "pistol", "bow", "launcher"]):
        subtypes.append(WeaponType.RANGED.value)
        logger.debug("Weapon subtype Ranged (keyword match)")
    elif keyword_in_text(text, ["blade", "sword", "knife"]):
        subtypes.append(WeaponType.MELEE.value)
        logger.debug("Weapon subtype Melee (keyword match)")
    return subtypes


def detect_armor_subtypes(infobox_data: dict[str, str]) -> list[str]:
    subtypes = []
    match infobox_data["garment type"]:
        case "light armor":
            subtypes.append(ArmorType.LIGHT.value)
            logger.debug("Armor subtype Light")
        case "heavy armor":
            subtypes.append(ArmorType.HEAVY.value)
            logger.debug("Armor subtype Heavy")
        case "water discipline":
            subtypes.append(ArmorType.STILLSUIT.value)
            logger.debug("Armor subtype Stillsuit")
        case _:
            pass
    return subtypes


def detect_tool_subtypes(infobox_data: dict[str, str], text: str) -> list[str]:
    subtypes = []
    match infobox_data["tool type"]:
        case "shield":
            subtypes.append(ToolType.SHIELD.value)
            logger.debug("Tool subtype Shield")
        case "fluid extractor":
            subtypes.append(ToolType.FLUID_EXTRACTOR.value)
            logger.debug("Tool subtype Fluid Extractor")
        case "bloodbag":
            subtypes.append(ToolType.BLOODBAG.value)
            logger.debug("Tool subtype Bloodbag")
        case "water container":
            subtypes.append(ToolType.WATER_CONTAINER.value)
            logger.debug("Tool subtype Water Container")
        case "power pack":
            subtypes.append(ToolType.POWER_PACK.value)
            logger.debug("Tool subtype Power Pack")
        case "dew reaper":
            subtypes.append(ToolType.DEW_REAPER.value)
            logger.debug("Tool subtype Dew Reaper")
        case "cutteray":
            subtypes.append(ToolType.CUTTERAY.value)
            logger.debug("Tool subtype Cutteray")
        case "compactor":
            subtypes.append(ToolType.COMPACTOR.value)
            logger.debug("Tool subtype Compactor")
        case "scanner":
            subtypes.append(ToolType.SCANNER.value)
            logger.debug("Tool subtype Scanner")
        case _:
            logger.info(
                f"Unknown tool subtype '{infobox_data['tool type']}' in infobox;"
            )
    return subtypes


def detect_vehicle_subtypes(infobox_data: dict[str, str], text: str) -> list[str]:
    subtypes = []
    module_type = infobox_data.get("module type", "")
    if any(k in module_type for k in ["ornithopter", "carrier", "scout", "assault"]):
        subtypes.append(VehicleType.AERIAL.value)
        logger.debug("Vehicle subtype Aerial")
    elif any(
        k in module_type for k in ["sandbike", "buggy", "sandcrawler", "treadwheel"]
    ):
        subtypes.append(VehicleType.LAND.value)
        logger.debug("Vehicle subtype Land")
    else:
        if keyword_in_text(text, ["ornithopter", "flyer", "aerial"]):
            subtypes.append(VehicleType.AERIAL.value)
            logger.debug("Vehicle subtype Aerial (text fallback)")
        elif keyword_in_text(
            text, ["buggy", "sandbike", "ground", "land", "treadwheel"]
        ):
            subtypes.append(VehicleType.LAND.value)
            logger.debug("Vehicle subtype Land (text fallback)")
    return subtypes


def find_category(page_tree: html.HtmlElement) -> str:
    """Find material category by link titles using exact word match."""
    for a in page_tree.xpath("//a[@title]"):
        title = a.get("title", "")
        for cat in CATEGORIES:
            if re.search(rf"\b{re.escape(cat)}\b", title, re.IGNORECASE):
                return cat
    return "Unknown"


def find_location(page_tree: html.HtmlElement) -> str:
    """Find known locations in paragraphs using id 'mw-content-text'."""
    paragraphs = page_tree.xpath('//div[@id="mw-content-text"]//p')
    for p in paragraphs:
        paragraph_text = " ".join(p.xpath(".//text()"))

        match_station = re.search(
            r"(Imperial Testing Station No\.\s*\d+)", paragraph_text
        )
        if match_station:
            return match_station.group(1)

        normalized_text = normalize_text(paragraph_text)
        for loc in LOCATIONS:
            if loc.lower() in normalized_text:
                return loc
    return ""
