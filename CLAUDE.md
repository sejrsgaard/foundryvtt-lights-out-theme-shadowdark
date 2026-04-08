# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a FoundryVTT UI theme module for the **Shadowdark RPG system**. It has no build process — all files are plain JavaScript ES modules, CSS, and Handlebars templates that are served directly by FoundryVTT.

## Releasing

Releases are fully automated via GitHub Actions (`.github/workflows/release.yml`). Push a tag (e.g., `v2.0.1`) to trigger a release that packages and uploads `module.zip` with the correct versioned manifest URLs.

There is no local build, lint, or test tooling.

## Architecture

### Entry Point & Hook Registration (`scripts/main.js`)

FoundryVTT calls into the module exclusively through hooks. `main.js` registers all hooks and wires up the two panel applications.

### Two Custom Panel Applications

Both extend `HandlebarsApplicationMixin(ApplicationV2)` (Foundry V13 API):

- **`CharacterPanelApp`** (`scripts/apps/CharacterPanelApp.js`) — Injected into `#ui-bottom`, shows the controlled token's character stats to the current player.
- **`PartyPanelApp`** (`scripts/apps/PartyPanelApp.js`) — Injected after `#scene-controls`, shows all party members.

Both apps use `_insertElement()` override to position themselves into specific DOM containers rather than appending to `<body>`. Re-renders are triggered by hooks (`updateActor`, `controlToken`, etc.).

### Data Flow

```
Hook event (updateActor / controlToken / ready / ...)
  → getCharacter() or getPartyCharacters()  (scripts/character.js)
  → getEntityData()  — extracts HP, AC, luck, level, class/ancestry UUIDs
  → app.render()
  → Handlebars template (templates/*.hbs)
  → _onRender() sets up DOM event listeners for HP input
```

### Settings (`scripts/settings.js`)

All behavior is controlled by world-scoped settings registered with `game.settings.register()`. Visibility levels: `0` = hidden, `1` = GM only, `2` = players and GM.

### CSS Architecture (`styles/`)

- `main.css` — imports everything else; no preprocessor
- `variables.css` — all CSS custom properties; has `.themed.theme-light` and `.themed.theme-dark` variants
- Per-feature files: `foundry.css`, `ui.css`, `character-panel.css`, `party-panel.css`, `animations.css`

### Localization

Translation keys use the `LIGHTSOUTSD.*` namespace. `languages/en.json` is the source; other language files are generated via Crowdin. Use `game.i18n.localize()` in JS and `{{localize "LIGHTSOUTSD.key"}}` in Handlebars.

## FoundryVTT V13 API Notes

- Applications use `foundry.applications.api.HandlebarsApplicationMixin(ApplicationV2)` — not the older `Application` class.
- `DEFAULT_OPTIONS` and `PARTS` are declarative static properties on the class.
- Actor system data lives under `actor.system.*` (Shadowdark-specific paths: `attributes.hp`, `attributes.ac`, `level.value`, `luck`, `class`, `ancestry`).
