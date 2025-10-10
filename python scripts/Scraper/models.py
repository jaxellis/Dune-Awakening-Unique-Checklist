from dataclasses import dataclass


@dataclass
class Item:
    name: str
    types: list[str]
    location: str
    tier: str
    category: str
    url: str
    image: str
