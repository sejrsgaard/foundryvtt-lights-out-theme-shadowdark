export function getCharacter() {
  // if GM and canvas has loaded
  if (game.user.isGM && canvas.tokens) {
    const tokens = canvas.tokens.controlled;
    if (tokens.length === 0 || tokens.length > 1) return null;

    const token = tokens[0];
    if (token.document.actorLink) {
      return game.actors.get(token.document.actorId);
    }
    else {
      return token.document;
    }
  }

  let character = game.users.get(game.userId).character;
  if (!character) {
    for (let actor of Array.from(game.actors.values())) {
      if (actor.owner) {
        character = actor;
        break;
      }
    }
  }

  return character;
}

export function getPartyCharacters() {
  const showOnlyActive = game.settings.get('lights-out-theme-shadowdark', 'party-only-active');
  const characters = [];
  for (let user of game.users.values()) {
    if (user.character && user.character.system) {
      if (!showOnlyActive || user.active) {
        characters.push(user.character);
      }
    }
  }

  return characters;
}

export async function getEntityData(entity) {
  if (!entity) return;

  const pulpMode = game.settings.get("shadowdark", "usePulpMode");

  let actor = entity;
  if (!entity.prototypeToken) {
    actor = entity.actor;
  }

  const classData = await fromUuid(actor.system.class);
  const ancestryData = await fromUuid(actor.system.ancestry);

  const hp = await actor.system.attributes?.hp.value;
  const hpMax = await actor.system.attributes?.hp.max;
  const hpPercent = calculateHpPercent(hp, hpMax);

  const level = await actor.system.level.value;
  const ac = await actor.system.attributes?.ac.value;

  const titleData = classData?.system.titles;
  let title = null;
  if (titleData) {
    title = getTitle(actor.system.level.value, actor.system.alignment, titleData);
  }

  let luckValue = null;
  if (actor.system.luck) {
    if (pulpMode) {
      luckValue = actor.system.luck?.remaining;
    }
    else {
      luckValue = actor.system.luck?.available ? "●" : "○";
    }
  }

  return {
    uuid: actor.uuid,
    isPlayer: actor.type == "Player",
    isToken: !entity.prototypeToken,
    name: actor.name,
    level: level,
    ancestry: ancestryData?.name,
    class: classData?.name,
    title: title,
    armor: ac,
    luck: luckValue,
    picture: actor.img,
    hp: {
      value: hp,
      max: hpMax,
      percent: hpPercent,
      status: hpStatus(hpPercent),
    },
  };
}

function calculateHpPercent(v, m) {
  const percent = (v / m) * 100;
  return percent >= 99 ? 99 : percent;
}

function hpStatus(percent) {
  if (percent <= 25) {
    return 'critical';
  }

  if (percent <= 50) {
    return 'injured';
  }

  if (percent <= 75) {
    return 'hurt';
  }

  return 'healthy';
}

function getTitle(level, alignment, titles) {
  if (!titles) return "";

  for (const title of titles) {
    if (level >= title.from && level <= title.to) {
      switch (alignment.toLowerCase()) {
        case 'chaotic':
          return title.chaotic;
        case 'lawful':
          return title.lawful;
        case 'neutral':
          return title.neutral;
        default:
          return "";
      }
    }
  }
  return "";
}
