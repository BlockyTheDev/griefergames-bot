interface JsonChat {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;
  color?: string;
  extra?: JsonChat[];
  [key: string]: any;
  // There are additional (unnecessary) properties
  // See: https://wiki.vg/Chat
}

enum ChatCodes {
  BLACK = '§0',
  DARK_BLUE = '§1',
  DARK_GREEN = '§2',
  DARK_AQUA = '§3',
  DARK_RED = '§4',
  DARK_PURPLE = '§5',
  GOLD = '§6',
  GRAY = '§7',
  DARK_GRAY = '§8',
  BLUE = '§9',
  GREEN = '§a',
  AQUA = '§b',
  RED = '§c',
  LIGHT_PURPLE = '§d',
  YELLOW = '§e',
  WHITE = '§f',

  OBFUSCATED = '§k',
  BOLD = '§l',
  STRIKETHROUGH = '§m',
  UNDERLINE = '§n',
  ITALIC = '§o',
  RESET = '§r',
}

// Turns a JSON chat into a Minecraft code string.
// Multi-type for recursion.
function jsonToCodedText(item: JsonChat | JsonChat[] | string): string {
  let message = '';

  // Servers sometimes send messages that
  // don't follow the specs.
  // As far as I know, vanilla messages (e.g. achievements)
  // can also be strings.
  if (typeof item === 'string') {
    return item;
  }

  if (typeof item === 'object') {
    if (Array.isArray(item)) {
      // We're looking at an array of 'extra' items.
      for (const element of item) {
        message += jsonToCodedText(element);
      }
    } else {
      // We're looking at a specific 'extra' item.
      const { text, color, extra, bold, italic, underlined, strikethrough, obfuscated } = item;

      if (color) {
        message += ChatCodes[color.toUpperCase()] || '';
      }

      if (bold) {
        message += ChatCodes.BOLD;
      }

      if (italic) {
        message += ChatCodes.ITALIC;
      }

      if (underlined) {
        message += ChatCodes.UNDERLINE;
      }

      if (strikethrough) {
        message += ChatCodes.STRIKETHROUGH;
      }

      if (obfuscated) {
        message += ChatCodes.OBFUSCATED;
      }

      message += text;

      if (extra) {
        message += jsonToCodedText(extra);
      }
    }
  }

  return message;
}

// Turns a JSON chat into a non-coded string.
function jsonToText(item: JsonChat | JsonChat[]): string {
  return stripCodes(jsonToCodedText(item));
}

// Strips a coded string of its codes.
function stripCodes(text: string): string {
  return text.replace(/\u00A7[0-9A-FK-OR]/gi, '');
}

export { jsonToText, jsonToCodedText, stripCodes };
