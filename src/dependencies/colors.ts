/* eslint-disable lines-between-class-members */

import {
  parse, applyStyle, RESET_CODE,
  // FIXME: link?
} from 'https://raw.githubusercontent.com/quilicicf/ColorMee/ed17547550cf3ee4f1d099eedbd1bc649134a928/index.ts';
import {
  ForegroundCode, ForegroundRgbCode, StyleCode,
  createStyle,
  // FIXME: link?
} from 'https://raw.githubusercontent.com/quilicicf/ColorMee/ed17547550cf3ee4f1d099eedbd1bc649134a928/createStyle.ts';

interface Theme {
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  color6: string;

  // Generic
  dim: string;
  strong: string;
  emphasis: string;
  error: string;
  warning: string;
  success: string;

  // Audit
  important: string;
  fileName: string;
  lineNumber: string;
  added: string;
  removed: string;

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
  dim: string;
  strong: string;
  emphasis: string;
  error: string;
  warning: string;
  success: string;

  // Audit
  important: string;
  fileName: string;
  lineNumber: string;
  added: string;
  removed: string;

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

    this.dim = createStyle({ style: StyleCode.Dim });
    this.strong = createStyle({ style: StyleCode.Bold });
    this.emphasis = createStyle({ style: StyleCode.Italic });
    this.error = createStyle({ foreground: ForegroundCode.Red });
    this.warning = createStyle({ foreground: ForegroundCode.Yellow });
    this.success = createStyle({ foreground: ForegroundCode.Green });

    this.important = this.color1;
    this.fileName = this.color4;
    this.lineNumber = this.color5;
    this.added = this.success;
    this.removed = this.error;

    this.sha = this.color3;
    this.author = createStyle({ foreground: cyanCode, style: StyleCode.Bold });
    this.branches = this.color4;
    this.relativeDate = this.color2;
  }
}

const defaultTheme = new DefaultTheme();

export {
  RESET_CODE,
  parse as __,
  applyStyle,
  defaultTheme as theme,
};
