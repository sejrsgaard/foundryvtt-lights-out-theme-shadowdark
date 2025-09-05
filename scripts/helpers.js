import * as actions from "./actions.js";

export function setupLuckTracker(element) {
    const pulpMode = game.settings.get("shadowdark", "usePulpMode");
        
    if (element) {
        element.addEventListener("click", (e) => {
            if (pulpMode) {
                actions.changePulpLuck.call(element, e, 1);
            } else {
                actions.changeLuck.call(element, e);
            }
        });

        element.addEventListener("contextmenu", (e) => {
            e.preventDefault(); // Prevent the default context menu
            if (pulpMode) {
                actions.changePulpLuck.call(element, e, -1);
            } else {
                actions.changeLuck.call(element, e);
            }
        });
    }
} 

export function setupHealthPointsTracker(element) {
    element.addEventListener("focus", function () {
        this.value = "";
    });

    element.addEventListener("blur", function () {
        this.value = this.dataset.value;
    });

    element.addEventListener("keyup", async function (e) {
        if (e.keyCode !== 13) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        let actor = await fromUuid(this.dataset.uuid);

        if (!actor) {
            return;
        }

        const currentHP = this.dataset.value;
        const inputValue = this.value.trim();

        let damageAmount;
        let multiplier;

        if (inputValue.startsWith('+')) {
            damageAmount = parseInt(inputValue.slice(1), 10);
            multiplier = -1;
        } else if (inputValue.startsWith('-')) {
            damageAmount = parseInt(inputValue.slice(1), 10);
            multiplier = 1;
        } else {
            const newHP = parseInt(inputValue, 10);
            damageAmount = currentHP - newHP;
            multiplier = 1;
        }

        if (!isNaN(damageAmount)) {
            actor.applyDamage(damageAmount, multiplier);
        }

        // Automatically blur (remove focus) from the input after execution
        this.blur();
    });
}