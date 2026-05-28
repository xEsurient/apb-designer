export class FileParser {
  static parse(content) {
    const lines = content.split(/\\r?\\n/);
    const parsedLines = [];
    let currentCategory = 'General';

    lines.forEach((line, index) => {
      if (!line.trim()) {
        parsedLines.push({ type: 'empty', raw: line, index });
        return;
      }

      if (line.startsWith(';')) {
        const catMatch = line.match(/^;\\s+(.+)$/);
        if (catMatch && !catMatch[1].startsWith('==') && !catMatch[1].startsWith('--')) {
          currentCategory = catMatch[1].trim();
        }
        parsedLines.push({ type: 'comment', raw: line, index });
        return;
      }

      if (line.startsWith('[') && line.endsWith(']')) {
        parsedLines.push({ type: 'section', raw: line, index });
        return;
      }

      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        const value = line.substring(eqIndex + 1);

        const displayInfo = this.extractDisplayInfo(value);

        parsedLines.push({
          type: 'entry',
          raw: line,
          index,
          key,
          value,
          category: currentCategory,
          ...displayInfo
        });
        return;
      }

      parsedLines.push({ type: 'unknown', raw: line, index });
    });

    return parsedLines;
  }

  static extractDisplayInfo(value) {
    let displayText = value;
    let colorTag = null;
    let fontTag = null;

    const fontMatch = displayText.match(/^(<Fonts:[^>]+>)(.*)$/i);
    if (fontMatch) {
      fontTag = fontMatch[1];
      displayText = fontMatch[2];
    }

    const stdTagMatch = displayText.match(/^(<col:[^>]+>)(.*)(?:<\/col>|<col:\/>)$/i);
    if (stdTagMatch) {
      colorTag = stdTagMatch[1];
      displayText = stdTagMatch[2];
    } else {
      const customTagMatch = displayText.match(/^(<Color:R=[0-9.]+ G=[0-9.]+ B=[0-9.]+(?:\s+A=[0-9.]+)?\s*>)(.*)(<Color:\/>)$/i);
      if (customTagMatch) {
        colorTag = customTagMatch[1];
        displayText = customTagMatch[2];
      }
    }

    displayText = displayText.replace(/\\n/g, '\n').replace(/↵/g, '\n');

    return { displayText, colorTag, fontTag };
  }

  static buildEntryString(key, displayText, colorTag, fontTag) {
    let safeText = displayText.replace(/\n/g, '\\n');
    let output = safeText;

    if (colorTag) {
      const isCol = colorTag.toLowerCase().startsWith('<col:');
      const closingTag = isCol ? '<col:/>' : '<Color:/>';
      output = `${colorTag}${safeText}${closingTag}`;
    }

    if (fontTag) {
      output = `${fontTag}${output}`;
    }

    return `${key}=${output}`;
  }

  static stringify(parsedLines) {
    return parsedLines.map(line => {
      if (line.type === 'entry' && line.isModified) {
        return this.buildEntryString(line.key, line.displayText, line.colorTag, line.fontTag);
      }
      return line.raw;
    }).join('\r\n');
  }
}
