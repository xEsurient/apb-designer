/**
 * FileParser - Parses APB Localization Files
 */

export class FileParser {
  /**
   * Parses the raw content of an APB localization file.
   * @param {string} content - The raw text file content
   * @returns {Array} Array of parsed line objects
   */
  static parse(content) {
    const lines = content.split(/\\r?\\n/);
    const parsedLines = [];
    let currentCategory = 'General';

    lines.forEach((line, index) => {
      // Handle empty lines
      if (!line.trim()) {
        parsedLines.push({ type: 'empty', raw: line, index });
        return;
      }

      // Handle Category Comments (e.g., ";  Marksman")
      if (line.startsWith(';')) {
        const catMatch = line.match(/^;\\s+(.+)$/);
        if (catMatch && !catMatch[1].startsWith('==') && !catMatch[1].startsWith('--')) {
          currentCategory = catMatch[1].trim();
        }
        parsedLines.push({ type: 'comment', raw: line, index });
        return;
      }

      // Handle Section Headers (e.g., "[InventoryItemTypes]")
      if (line.startsWith('[') && line.endsWith(']')) {
        parsedLines.push({ type: 'section', raw: line, index });
        return;
      }

      // Handle Key=Value Pairs
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        const value = line.substring(eqIndex + 1);
        
        // Extract basic styling/color info from value
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

      // Fallback
      parsedLines.push({ type: 'unknown', raw: line, index });
    });

    return parsedLines;
  }

  /**
   * Extracts clean text and the primary color tag from an APB formatted string.
   */
  static extractDisplayInfo(value) {
    let displayText = value;
    let colorTag = null;

    // Fast check if it starts with a standard tag
    const stdTagMatch = value.match(/^(<col:[^>]+>)(.*)(<col:\/>)$/i);
    if (stdTagMatch) {
      colorTag = stdTagMatch[1];
      displayText = stdTagMatch[2];
    } else {
      // Check for <Color:R=x G=x B=x A=x> tag
      const customTagMatch = value.match(/^(<Color:R=[0-9.]+ G=[0-9.]+ B=[0-9.]+ A=[0-9.]+>)(.*)(<Color:\/>)$/i);
      if (customTagMatch) {
        colorTag = customTagMatch[1];
        displayText = customTagMatch[2];
      }
    }

    // Unescape newlines for display
    displayText = displayText.replace(/\\n/g, '\\n').replace(/↵/g, '\\n');

    return { displayText, colorTag };
  }

  /**
   * Rebuilds the raw string for a modified entry.
   */
  static buildEntryString(key, displayText, colorTag) {
    // Escape newlines back for APB
    let safeText = displayText.replace(/\\n/g, '\\n');
    
    if (colorTag) {
      const isCol = colorTag.startsWith('<col:');
      const closingTag = isCol ? '<col:/>' : '<Color:/>';
      return \`\${key}=\${colorTag}\${safeText}\${closingTag}\`;
    }
    
    return \`\${key}=\${safeText}\`;
  }

  /**
   * Stringifies the parsed line objects back into a file string.
   */
  static stringify(parsedLines) {
    return parsedLines.map(line => {
      if (line.type === 'entry' && line.isModified) {
        return this.buildEntryString(line.key, line.displayText, line.colorTag);
      }
      return line.raw;
    }).join('\\r\\n');
  }
}
