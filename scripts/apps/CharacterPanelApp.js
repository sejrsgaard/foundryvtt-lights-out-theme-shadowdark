import { openSheet } from "../actions.js";
import { setupLuckTracker, setupHealthPointsTracker } from "../helpers.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class CharacterPanelApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "player-character",
        tag: "div",
        position: {
            width: "auto",
            height: "auto",
        },
        window: {
            frame: false,
            positioned: false,
        },
    }

    static PARTS = {
        main: {
            template: "modules/lights-out-theme-shadowdark/templates/character.hbs"
        }
    }

    constructor(data = {}, options = {}) {
        super(options);
        this.characterData = data;
    }

    updateData(data) {
        this.characterData = data;
        this.show();
        this.render();
    }

    show() {
        const elem = document.querySelector("#player-character");
        if (elem) {
            elem.classList.remove("lights-out-fade-out");
            elem.classList.add("lights-out-fade-in-up");
            elem.style.pointerEvents = "auto";
        }
    }

    hide() {
        const elem = document.querySelector("#player-character");
        if (elem) {
            elem.classList.remove("lights-out-fade-in-up");
            elem.classList.add("lights-out-fade-out");
            elem.style.pointerEvents = "none";
        }
    }

    _prepareContext(options) {
        return {
            uuid: this.characterData.uuid,
            isPlayer: this.characterData.isPlayer,
            isToken: this.characterData.isToken,
            name: this.characterData.name,
            level: this.characterData.level,
            ancestry: this.characterData.ancestry,
            class: this.characterData.class,
            title: this.characterData.title,
            armor: this.characterData.armor,
            luck: this.characterData.luck,
            picture: this.characterData.picture,
            hp: this.characterData.hp,
            settings: this.characterData.settings,
            selected: this.characterData.selected,
        };
    }

    _insertElement(element) {
        const existing = document.getElementById(element.id);
        
        const container = document.querySelector("#ui-bottom");
        
        if (!container) {
            console.warn("Target container #ui-bottom not found");
            return;
        }
        
        if (existing) {
            if (existing.parentElement !== container) {
                existing.remove();
                container.prepend(element);
            } else {
                existing.replaceWith(element);
            }
        } else {
            container.prepend(element);
        }
    }

    _onRender(context, options) {
        // Event listener for opening the character sheet
        const playerCharacter = document.querySelector("#player-character");
        if (playerCharacter) {
            playerCharacter.querySelectorAll(".sheet").forEach(el => {
                el.addEventListener("click", openSheet);
            });
        }

        const luckTracker = document.querySelector(".attr#luck-attr");
        setupLuckTracker(luckTracker);

        const healthBar = document.querySelector("#current-health");
        setupHealthPointsTracker(healthBar);
    }
}