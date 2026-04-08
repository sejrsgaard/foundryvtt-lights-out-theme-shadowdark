export async function openSheet() {
  const actor = await fromUuid(this.dataset.uuid);
  if (actor) {
    actor.sheet.render({force: true});
  }
}

export async function selectToken() {
  const actor = await fromUuid(this.dataset.uuid);
  if (!actor) return;

  const tokens = actor.getActiveTokens();
  if (tokens.length > 0) {
    tokens[0].control();
  }
}

export async function changeLuck() {
  const actor = await fromUuid(this.dataset.uuid);
  if (actor) {
    actor.update({ "system.luck.available": !actor.system.luck.available });
  }
}

export async function changePulpLuck(_, change) {
  const actor = await fromUuid(this.dataset.uuid);

  if (actor) {
    let luckValue = parseInt(actor.system.luck.remaining + change);
    if (luckValue < 0) luckValue = 0;
    
    const updateData = {
      "system.luck.available": luckValue > 0,
      "system.luck.remaining": luckValue,
    };

    actor.update(updateData);
  }
}
