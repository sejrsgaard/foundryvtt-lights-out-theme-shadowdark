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

export async function characterData(c) {
  const { attributes, level, luck, alignment } = c.system;

  const pulpMode = game.settings.get("shadowdark", "usePulpMode");

  const classData = await fromUuid(c.system.class);
  const ancestryData = await fromUuid(c.system.ancestry);

  const titleData = classData?.system.titles;
  const title = getTitle(level.value, alignment, titleData);

  let hpPercent = calculateHpPercent(attributes.hp.value, attributes.hp.max);

  let luckValue;
  if (pulpMode) {
    luckValue = luck?.remaining;
  }
  else {
    luckValue = luck?.available ? "●" : "○"
  }
  
  return {
    uuid: c.uuid,
    isPlayer: c.type == "Player",
    isToken: false,
    name: c.name,
    level: level.value,
    ancestry: ancestryData?.name,
    class: classData?.name,
    title: title,
    armor: attributes.ac.value,
    luck: luckValue,
    picture: c.img,
    hp: {
      value: attributes.hp.value,
      max: attributes.hp.max,
      percent: hpPercent,
      status: hpStatus(hpPercent),
    },
  };
}

export async function tokenData(token) {
  const actor = token?.actor;
  if (!actor) return;

  const hp = actor.system.attributes?.hp.value;
  const hpMax = actor.system.attributes?.hp.max;
  const hpPercent = calculateHpPercent(hp, hpMax);
  const status = hpStatus(hpPercent);

  return {
    uuid: actor.uuid,
    isPlayer: false,
    isToken: true,
    name: actor.name,
    level: actor.system.level.value,
    armor: actor.system.attributes.ac.value,
    picture: token.img ?? actor.img,
    hp: {
      value: hp,
      max: hpMax,
      percent: hpPercent,
      status: status,
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
