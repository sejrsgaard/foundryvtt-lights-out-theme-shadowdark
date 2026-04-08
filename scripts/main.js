import {
  getCharacter,
  getPartyCharacters,
  getEntityData
} from "./character.js";
import * as actions from "./actions.js";
import { setupHealthPointsTracker } from "./helpers.js";
import { registerSettings } from "./settings.js";
import { CharacterPanelApp } from "./apps/CharacterPanelApp.js";
import { PartyPanelApp } from "./apps/PartyPanelApp.js";

Hooks.once("init", async () => {
    registerSettings();
});

Hooks.once("ready", async () => {
    // Enable high contrast mode for icons
    // This changes a CSS variable to enable/disable the filter
    let highContrastModeSetting = game.settings.get("lights-out-theme-shadowdark", "icon-high-contrast-mode");
    if (highContrastModeSetting) document.documentElement.classList.add("high-contrast");

    // Create and render apps
    game.lightsOutTheme = game.lightsOutTheme || {};
    game.lightsOutTheme.characterPanel = new CharacterPanelApp();
    game.lightsOutTheme.characterPanel.render();

    game.lightsOutTheme.partyPanel = new PartyPanelApp();
    game.lightsOutTheme.partyPanel.render();

    // Initial data for UI components
    await renderCharacter();
    await renderParty();

    console.log("Lights Out Theme | Ready");
});

Hooks.on("renderSettings", function (app, html) {
    const modulesSection = html.querySelector('section[data-tab="modules"]');
    if (modulesSection) {
        const block = document.createElement('div');
        block.className = 'lights-out-block';
        modulesSection.insertAdjacentElement('afterend', block);
    }
});

// Hide UI elements if current player permissions are below the global setting
Hooks.on("renderHotbar", async (app, html) => {
    const hotBarSetting = game.settings.get("lights-out-theme-shadowdark", "hotbar_visibility");
    const hide = hotBarSetting < userPermission();
    app.element.classList.toggle("hidden", hide);
});

Hooks.on("renderSceneNavigation", async (app, html) => {
    let navBarSetting = game.settings.get("lights-out-theme-shadowdark", "navbar_visibility");
    const hide = navBarSetting < userPermission();
    app.element.classList.toggle("hidden", hide);
});

Hooks.on("renderSceneControls", (controls, html) => {
    const collapsed = ui.sidebar.collapsed;
    const icon = collapsed ? "fa-caret-left" : "fa-caret-right";

    const mainControls = document.querySelector("#controls ol.control-tools.main-controls");
    if (mainControls) {
        const li = document.createElement('li');
        li.className = 'scene-control sidebar-control';
        li.dataset.tooltip = game.i18n.localize("LIGHTSOUTSD.sidebar_tooltip");
        li.innerHTML = `<i class="fas ${icon}"></i>`;
        li.addEventListener('click', () => {
            ui.sidebar.collapsed ? ui.sidebar.expand() : ui.sidebar.collapse();
        });
        mainControls.append(li);
    }

    const controlsEl = document.querySelector("#controls");
    if (controlsEl) {
        controlsEl.style.right = `${uiEdges().right}px`;
        controlsEl.classList.toggle("collapsed", collapsed);
    }

    document.querySelector("section.effect-panel")?.classList.toggle("collapsed", collapsed);
});

// Since Foundry V13, the Player List is no longer rendered through the old PlayerList Application 
// that emitted the renderPlayerList hook. Instead, we need to directly manipulate the DOM element.
function applyPlayerListVisibility() {
    const playerListSetting = game.settings.get("lights-out-theme-shadowdark", "players_list_visibility");
    const hide = playerListSetting < userPermission();
    const el = ui.players?.element || document.querySelector("#players");
    if (el) el.classList.toggle("hidden", hide);
}
Hooks.on("ready", applyPlayerListVisibility);
Hooks.on("updateUser", applyPlayerListVisibility);

Hooks.on("collapseSidebar", (sidebar, collapsed) => {
    ui.controls.render();
    game.shadowdark.effectPanel.render();
});

// re-render scene controls when AV dock position changes.
Hooks.on("rtcSettingsChanged", async (settings, changes) => {
    if (changes.client) {
        if ("hideDock" in changes.client || "dockPosition" in changes.client) 
            ui.controls.render();
    }
});

Hooks.on("updateActor", async function (actor) {
  if (game.user.isGM || actor.uuid === getCharacter()?.uuid) {
    await renderCharacter();
  }
  
  await renderParty();
});

Hooks.on('controlToken', async function () {
  if (!game.user.isGM || game.settings.get("lights-out-theme-shadowdark", "disable-gm-selected-token")) return;
  await renderCharacter(true);
});

Hooks.on('userConnected', async function () {
  await renderCharacter();
  await renderParty();
});

Hooks.on('updateUser', async function () {
  await renderCharacter();
  await renderParty();
});

async function renderCharacter(selection = false) {
  const character = getCharacter();
  if (!character) {
    game.lightsOutTheme.characterPanel.hide();
    return;
  }

  let data = await getEntityData(character);
  if (!data) return;

  /*
  const settings = {
    hide_title: game.settings.get("lights-out-theme-shadowdark", "hide-pc-title"),
  }
  data.settings = settings;
  */

  // Mark if the render was triggered by a selection
  data.selected = selection;

  game.lightsOutTheme.characterPanel.updateData(data);
}

async function renderParty() {
  const partyVisibility = game.settings.get("lights-out-theme-shadowdark", "party_panel_visibility");
  if (partyVisibility < userPermission()) {
    game.lightsOutTheme.partyPanel.close();
    return;
  }
  
  const characters = await Promise.all(getPartyCharacters().map(getEntityData));
  game.lightsOutTheme.partyPanel.updateData(characters);
}

function userPermission() {
    return game.user.isGM ? 1 : 2; // GMs = 1, Players = 2
}

function uiEdges() {
    const body = document.querySelector("body").getBoundingClientRect();
    const uiInterface = document.querySelector("#interface").getBoundingClientRect();
    return {
        top: uiInterface.top,
        left: uiInterface.left,
        right: body.width - uiInterface.right,
        bottom: body.height - uiInterface.bottom
    }
}