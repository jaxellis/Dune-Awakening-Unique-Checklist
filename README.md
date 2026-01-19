# Dune Awakening - Unique Schematics Checklist

> **📋 Interactive checklist tool for tracking all unique schematics across Arrakis**

This repository contains the source code for the Dune Awakening Unique Schematics Checklist web application. This is a static site that helps players track their progress collecting unique schematics in Dune: Awakening.

## 🌐 Live Site

**👉 [Visit the Live Checklist](https://jaxellis.github.io/Dune-Awakening-Unique-Checklist/)**

*Note: This repository contains the source code. For the interactive checklist, visit the live site above.*

## ✨ Features

- **📊 Complete Schematic Tracking** - Track all unique schematics organized by material tier (Copper, Iron, Steel, Aluminum, Duraluminum, Plastanium)
- **🔍 Search & Filter** - Quickly find schematics by name, type, or location
- **💾 Local Storage** - Your progress is automatically saved in your browser
- **📥 Export/Import** - Export your progress to share between devices or create backups
- **↩️ Undo/Redo** - Easily correct mistakes with full undo/redo support
- **👁️ Hide Checked Items** - Focus on what you still need to collect
- **📍 Farming Locations** - Access a sidebar with farming locations organized by region
- **📈 Progress Tracking** - Real-time progress percentage and completion stats
- **🎨 Modern UI** - Clean, responsive design optimized for desktop and mobile

## 🎮 How to Use

1. Visit the [live site](https://jaxellis.github.io/Dune-Awakening-Unique-Checklist/)
2. Check off schematics as you collect them

## 📁 Project Structure

```
├── data/
│   ├── schematics.json      # All unique schematic data
│   ├── locations.json       # Farming location information
│   └── location_icons.json  # Location icon mappings
├── images/                  # Schematic item images
├── scripts/                 # JavaScript modules
├── styles/                  # CSS stylesheets
├── python scripts/          # Utility scripts for data management
└── index.html              # Main application entry point
```

## 🛠️ Development

This is a static web application built with vanilla JavaScript, HTML, and CSS. No build process or dependencies required - just open `index.html` in a browser.

### Python Scripts

The `python scripts/` directory contains utility scripts:

- `image.py` - Downloads schematic images from the wiki
- `update_file_names.py` - Manages file naming and asset references

## 📝 Data Sources

- Schematic data and images sourced from [awakening.wiki](https://awakening.wiki) and [Dune Gaming Tools](https://dune.gaming.tools/)
- Location data linked to [MapGenie Dune Awakening maps](https://mapgenie.io/dune-awakening)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made for the Dune: Awakening community** 🏜️

*This is the source code repository. For the interactive checklist, visit the [live site](https://jaxellis.github.io/Dune-Awakening-Unique-Checklist/).*
