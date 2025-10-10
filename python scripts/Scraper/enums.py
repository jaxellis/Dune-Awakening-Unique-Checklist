from enum import Enum


class ItemCategory(str, Enum):
    ARMOR = "Armor"
    WEAPON = "Weapon"
    VEHICLE = "Vehicle"
    TOOL = "Tool"
    UNKNOWN = "Unknown"


class ArmorType(str, Enum):
    LIGHT = "Light"
    HEAVY = "Heavy"
    STILLSUIT = "Stillsuit"


class WeaponType(str, Enum):
    MELEE = "Melee"
    RANGED = "Ranged"


class VehicleType(str, Enum):
    AERIAL = "Aerial"
    LAND = "Land"


class ToolType(str, Enum):
    SHIELD = "Shield"
    BLOODBAG = "Bloodbag"
    FLUID_EXTRACTOR = "Fluid Extractor"
    WATER_CONTAINER = "Water Container"
    POWER_PACK = "Power Pack"
    DEW_REAPER = "Dew Reaper"
    CUTTERAY = "Cutteray"
    COMPACTOR = "Compactor"
    SCANNER = "Scanner"
