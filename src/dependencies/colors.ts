/* eslint-disable lines-between-class-members */

import {
  parse, applyStyle,
  // FIXME: link?
} from 'https://raw.githubusercontent.com/quilicicf/ColorMee/8fc5390ffcae98ad3f462d5d7343f476c73caff4/index.ts';
import {
  ForegroundRgbCode, StyleCode,
  createStyle,
  // FIXME: link?
} from 'https://raw.githubusercontent.com/quilicicf/ColorMee/8fc5390ffcae98ad3f462d5d7343f476c73caff4/createStyle.ts';

interface Theme {
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  color6: string;

  // Generic
  error: string;
  warning: string;

  // Commit
  sha: string;
  author: string;
  branches: string;
  relativeDate: string;
}

class DefaultTheme implements Theme { // monokai
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  color6: string;

  // Generic
  error: string;
  warning: string;

  // Commit
  sha: string;
  author: string;
  branches: string;
  relativeDate: string;

  constructor () {
    const cyanCode = new ForegroundRgbCode(102, 217, 239);
    const greenCode = new ForegroundRgbCode(166, 226, 46);
    const redCode = new ForegroundRgbCode(249, 38, 114);
    const yellowCode = new ForegroundRgbCode(230, 219, 116);
    const purpleCode = new ForegroundRgbCode(174, 129, 255);
    const pinkCode = new ForegroundRgbCode(255, 0, 198);

    this.color1 = createStyle({ foreground: cyanCode });
    this.color2 = createStyle({ foreground: greenCode });
    this.color3 = createStyle({ foreground: redCode });
    this.color4 = createStyle({ foreground: yellowCode });
    this.color5 = createStyle({ foreground: purpleCode });
    this.color6 = createStyle({ foreground: pinkCode });

    this.error = this.color3;
    this.warning = this.color4;

    this.sha = this.color3;
    this.author = createStyle({ foreground: cyanCode, style: StyleCode.Bold });
    this.branches = this.color4;
    this.relativeDate = this.color2;
  }
}

const defaultTheme = new DefaultTheme();
const bold = createStyle({ style: StyleCode.Bold });

export {
  parse as __,
  applyStyle,
  defaultTheme as theme,

  bold,
};
