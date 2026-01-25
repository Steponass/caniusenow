// ============================================================================
// MDN PATH NAME INFERENCE
// ============================================================================

/**
 * Infers a human-readable name from an MDN BCD path.
 *
 * Path patterns:
 * - api.Interface                        → "Interface"
 * - api.Interface.Interface              → "Interface() constructor"
 * - api.Interface.method                 → "Interface.method"
 * - api.Interface.event_event            → "Interface: event event"
 * - css.properties.property-name         → "property-name"
 * - css.properties.property-name.value   → "property-name: value"
 * - html.elements.element                → "<element>"
 *
 * @param path - The MDN BCD path (e.g., "api.AbortController.abort")
 * @returns A human-readable feature name
 */
export function inferNameFromMdnPath(path: string): string {
  const parts = path.split(".");
  const category = parts[0];

  if (category === "api") {
    return inferApiName(parts);
  }

  if (category === "css") {
    return inferCssName(parts);
  }

  if (category === "html") {
    return inferHtmlName(parts);
  }

  if (category === "javascript") {
    return inferJavaScriptName(parts);
  }

  if (category === "svg") {
    return inferSvgName(parts);
  }

  return inferGenericName(parts);
}

function inferApiName(parts: string[]): string {
  if (parts.length === 2) {
    return parts[1];
  }

  if (parts.length === 3) {
    const interfaceName = parts[1];
    const memberName = parts[2];

    // Constructor: api.Interface.Interface
    if (interfaceName === memberName) {
      return `${interfaceName}() constructor`;
    }

    // Event: ends with _event
    if (memberName.endsWith("_event")) {
      const eventName = memberName.replace("_event", "");
      return `${interfaceName}: ${eventName} event`;
    }

    // Static method: ends with _static
    if (memberName.endsWith("_static")) {
      const methodName = memberName.replace("_static", "");
      return `${interfaceName}.${methodName}() static method`;
    }

    // Regular member - keep original case
    return `${interfaceName}.${memberName}`;
  }

  if (parts.length >= 4) {
    const interfaceName = parts[1];
    const memberName = parts[2];
    const subFeature = parts[parts.length - 1];

    return `${interfaceName}.${memberName}: ${formatSnakeCase(subFeature)}`;
  }

  return parts[parts.length - 1];
}

function inferCssName(parts: string[]): string {
  const subCategory = parts[1];

  if (subCategory === "properties") {
    if (parts.length === 3) {
      return parts[2];
    }

    if (parts.length === 4) {
      return `${parts[2]}: ${formatSnakeCase(parts[3])}`;
    }

    if (parts.length >= 5) {
      return `${parts[2]}: ${formatSnakeCase(parts[parts.length - 1])}`;
    }
  }

  if (subCategory === "selectors") {
    return parts.length >= 3 ? parts[2] : parts[parts.length - 1];
  }

  if (subCategory === "at-rules") {
    const ruleName = parts[2];
    if (parts.length === 3) {
      return `@${ruleName}`;
    }
    return `@${ruleName}: ${formatSnakeCase(parts[parts.length - 1])}`;
  }

  if (subCategory === "types") {
    if (parts.length >= 3) {
      const typeName = parts[parts.length - 1];
      const functions = [
        "rgb", "hsl", "hwb", "lab", "lch", "oklch", "oklab",
        "calc", "var", "min", "max", "clamp", "url", "attr",
        "counter", "counters", "linear-gradient", "radial-gradient",
      ];
      if (functions.includes(typeName)) {
        return `${typeName}()`;
      }
      return formatSnakeCase(typeName);
    }
  }

  return formatSnakeCase(parts[parts.length - 1]);
}

function inferHtmlName(parts: string[]): string {
  const subCategory = parts[1];

  if (subCategory === "elements" && parts.length >= 3) {
    return `<${parts[2]}>`;
  }

  if (subCategory === "global_attributes" && parts.length >= 3) {
    return parts[2];
  }

  return formatSnakeCase(parts[parts.length - 1]);
}

function inferJavaScriptName(parts: string[]): string {
  const subCategory = parts[1];

  if (subCategory === "builtins" && parts.length >= 4) {
    const objectName = parts[2];
    const memberName = parts[3];
    return `${objectName}.${memberName}()`;
  }

  if (subCategory === "statements" && parts.length >= 3) {
    return `${parts[2]} statement`;
  }

  if (subCategory === "operators" && parts.length >= 3) {
    return `${formatSnakeCase(parts[2])} operator`;
  }

  return formatSnakeCase(parts[parts.length - 1]);
}

function inferSvgName(parts: string[]): string {
  const subCategory = parts[1];

  if (subCategory === "elements" && parts.length >= 3) {
    return `<${parts[2]}> (SVG)`;
  }

  if (subCategory === "attributes" && parts.length >= 3) {
    return parts[2];
  }

  return formatSnakeCase(parts[parts.length - 1]);
}

function inferGenericName(parts: string[]): string {
  return formatSnakeCase(parts[parts.length - 1]);
}

/**
 * Convert snake_case to "Title case" (for descriptive sub-features)
 * But preserve kebab-case CSS properties as-is
 */
function formatSnakeCase(name: string): string {
  // If it's kebab-case (CSS property), keep as-is
  if (name.includes("-") && !name.includes("_")) {
    return name;
  }

  // Convert snake_case to title case
  return name
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase());
}

// ============================================================================
// FEATURE DEDUPLICATION
// ============================================================================

/**
 * Normalizes a feature ID for deduplication comparison.
 * Removes common prefixes and normalizes casing.
 *
 * @param id - The feature ID
 * @returns Normalized ID for comparison
 */
export function normalizeFeatureId(id: string): string {
  return id
    .toLowerCase()
    .replace(/^(css-|wf-|mdn-)/, "")  // Remove source prefixes
    .replace(/[^a-z0-9]/g, "");        // Remove non-alphanumeric
}

/**
 * Normalizes a feature name for deduplication comparison.
 * Removes common prefixes like "CSS " and normalizes casing.
 *
 * @param name - The feature name
 * @returns Normalized name for comparison
 */
export function normalizeFeatureName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^css\s+/i, "")           // Remove "CSS " prefix
    .replace(/`/g, "")                  // Remove backticks
    .replace(/[^a-z0-9]/g, "");        // Remove non-alphanumeric
}

/**
 * Checks if two features are likely duplicates based on ID and name.
 *
 * @param feature1 - First feature { id, name }
 * @param feature2 - Second feature { id, name }
 * @returns true if likely duplicates
 */
export function areLikelyDuplicates(
  feature1: { id: string; name: string },
  feature2: { id: string; name: string }
): boolean {
  const normId1 = normalizeFeatureId(feature1.id);
  const normId2 = normalizeFeatureId(feature2.id);

  // Exact normalized ID match
  if (normId1 === normId2) {
    return true;
  }

  const normName1 = normalizeFeatureName(feature1.name);
  const normName2 = normalizeFeatureName(feature2.name);

  // Exact normalized name match
  if (normName1 === normName2) {
    return true;
  }

  // One name contains the other (for "CSS X" vs "X" cases)
  if (normName1.includes(normName2) || normName2.includes(normName1)) {
    // Only if they're reasonably similar in length
    const lenRatio = Math.min(normName1.length, normName2.length) /
                     Math.max(normName1.length, normName2.length);
    if (lenRatio > 0.7) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// CODE TAG NORMALIZATION (the only text transformation we do)
// ============================================================================

/**
 * Converts HTML <code> tags to backticks for consistent formatting.
 * 
 * This is the ONLY text transformation we apply to feature names/descriptions.
 * MDN BCD data sometimes contains HTML markup like:
 *   "The <code>options</code> parameter"
 * 
 * We convert this to backticks so the UI can render it consistently:
 *   "The `options` parameter"
 *
 * @param text - Text that may contain HTML <code> tags
 * @returns Text with <code> tags converted to backticks
 */
export function normalizeCodeTags(text: string): string {
  if (!text) return text;
  return text.replace(/<code>([^<]+)<\/code>/g, "`$1`");
}

// ============================================================================
// FEATURE NAME FORMATTING
// ============================================================================

/**
 * Formats a feature name by wrapping code-like elements with backticks.
 * This allows consistent rendering of technical names across the UI.
 *
 * Patterns detected:
 * - HTML elements: <a>, <div>, <input> → `<a>`, `<div>`, `<input>`
 * - Methods/functions: Array.from(), Array at() → `Array.from()`, `Array at()`
 * - CSS at-rules: @font-face, @media → `@font-face`, `@media`
 * - Attribute syntax: hidden="until-found" → `hidden="until-found"`
 * - CSS properties: accent-color, grid-template → `accent-color`, `grid-template`
 *
 * @param name - The raw feature name from the data source
 * @param category - The feature category (CSS, HTML5, JS API, etc.) for context
 * @returns The formatted name with backticks around code elements
 */
export function formatFeatureName(name: string, category?: string): string {
  if (!name) return name;

  // Step 1: Convert existing HTML <code> tags to backticks for consistency
  // MDN BCD data uses HTML tags like: "The <code>options</code> parameter"
  const normalized = normalizeCodeTags(name);

  // If we converted HTML tags, return the normalized version
  // (don't apply further formatting as it's already marked up)
  if (normalized !== name) {
    return normalized;
  }

  // Already has backticks - return as-is
  if (name.includes("`")) {
    return name;
  }

  // Pattern 1: HTML elements like <a>, <div>, <input type="text">
  // Matches: starts with < and contains >
  if (name.startsWith("<") && name.includes(">")) {
    return wrapWithBackticks(name);
  }

  // Pattern 2: CSS at-rules like @font-face, @media, @scope
  if (name.startsWith("@")) {
    return wrapWithBackticks(name);
  }

  // Pattern 3: Attribute syntax like hidden="until-found", sandbox="allow-scripts"
  if (/^\w+="[^"]*"$/.test(name)) {
    return wrapWithBackticks(name);
  }

  // Pattern 4: Methods/functions - wrap each occurrence including prefix
  // Examples: "Array.from()", "Array at()", "abs() and sign()"
  if (name.includes("()")) {
    return formatMethodNames(name);
  }

  // Pattern 5: CSS properties - lowercase with hyphens, no spaces
  // Examples: "accent-color", "grid-template-columns"
  // But NOT: "align-content in block layouts" (has spaces = descriptive)
  if (isCssPropertyName(name, category)) {
    return wrapWithBackticks(name);
  }

  // Pattern 6: Single lowercase word that looks like a property/attribute
  // Examples: "accesskey", "all", "appearance"
  // But NOT: "Accelerometer", "Alerts" (capitalized = descriptive)
  if (isSingleWordProperty(name, category)) {
    return wrapWithBackticks(name);
  }

  // No pattern matched - return as plain text
  return name;
}

/**
 * Wraps the entire string with backticks
 */
function wrapWithBackticks(text: string): string {
  return `\`${text}\``;
}

/**
 * Formats method names within a string.
 *
 * Handles patterns like:
 *   "Array.from()"                    → "`Array.from()`"
 *   "Array at()"                      → "`Array at()`"
 *   "abs() and sign()"                → "`abs()` and `sign()`"
 *   "Array find() and findIndex()"    → "`Array find()` and `findIndex()`"
 */
function formatMethodNames(name: string): string {
  // Handle compound expressions with "and" by splitting and processing each part
  if (name.includes(" and ")) {
    const parts = name.split(" and ");
    const formattedParts = parts.map((part) =>
      formatSingleMethodExpression(part.trim())
    );
    return formattedParts.join(" and ");
  }

  return formatSingleMethodExpression(name);
}

/**
 * Formats a single method expression (no "and" connectors)
 *
 * Examples:
 *   "Array.from()"  → "`Array.from()`"
 *   "Array at()"    → "`Array at()`"
 *   "fetch()"       → "`fetch()`"
 */
function formatSingleMethodExpression(expr: string): string {
  // If it doesn't contain (), return as-is
  if (!expr.includes("()")) {
    return expr;
  }

  // Pattern: Matches "Word.method()" or "Word method()" or "method()"
  // where Word starts with uppercase (like Array, Object, AbortSignal)

  // Check if the whole expression is a method call (with optional prefix)
  // Examples: "Array.from()", "Array at()", "fetch()"
  const fullMethodPattern =
    /^([A-Z][a-zA-Z]*(?:[\s.][a-zA-Z]+)*\(\))$|^([a-z][a-zA-Z]*\(\))$/;

  if (fullMethodPattern.test(expr)) {
    return wrapWithBackticks(expr);
  }

  // Check for "Prefix method()" pattern (space-separated)
  // Example: "Array at()" → "`Array at()`"
  const prefixSpaceMethodPattern = /^([A-Z][a-zA-Z]*)\s+([a-zA-Z]+\(\))$/;
  if (prefixSpaceMethodPattern.test(expr)) {
    return wrapWithBackticks(expr);
  }

  // Check for "Prefix.method()" pattern (dot-separated)
  // Example: "Array.from()" → "`Array.from()`"
  const prefixDotMethodPattern =
    /^([A-Z][a-zA-Z]*(?:\.[A-Z]?[a-zA-Z]*)*\.[a-zA-Z]+\(\))$/;
  if (prefixDotMethodPattern.test(expr)) {
    return wrapWithBackticks(expr);
  }

  // Fallback: wrap any standalone method() pattern found
  return expr.replace(/(\b[A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*\(\))/g, "`$1`");
}

/**
 * Determines if a name looks like a CSS property name.
 * CSS properties are lowercase, may contain hyphens, and have no spaces.
 */
function isCssPropertyName(name: string, category?: string): boolean {
  // Must be lowercase
  if (name !== name.toLowerCase()) {
    return false;
  }

  // Must not contain spaces (otherwise it's descriptive like "align-content in block layouts")
  if (name.includes(" ")) {
    return false;
  }

  // Should contain a hyphen (most CSS properties do)
  // Single words are handled separately by isSingleWordProperty
  if (!name.includes("-")) {
    return false;
  }

  // Additional confidence if we know it's a CSS category
  if (category === "CSS") {
    return true;
  }

  // Heuristic: looks like a CSS property pattern
  // e.g., "accent-color", "grid-template-columns", "backdrop-filter"
  return /^[a-z]+(-[a-z]+)+$/.test(name);
}

/**
 * Determines if a name is a single lowercase word that represents a property.
 * Examples: "all", "appearance", "accesskey"
 * Not: "Accelerometer", "Alerts" (capitalized = API/concept name)
 */
function isSingleWordProperty(name: string, category?: string): boolean {
  // Must be a single word (no spaces, no hyphens)
  if (name.includes(" ") || name.includes("-")) {
    return false;
  }

  // Must be all lowercase
  if (name !== name.toLowerCase()) {
    return false;
  }

  // If it's in CSS category, it's likely a property
  if (category === "CSS") {
    return true;
  }

  // Common HTML global attributes that should be formatted as code
  const htmlAttributes = [
    "accesskey",
    "autocapitalize",
    "autofocus",
    "contenteditable",
    "dir",
    "draggable",
    "enterkeyhint",
    "hidden",
    "inert",
    "inputmode",
    "lang",
    "popover",
    "spellcheck",
    "tabindex",
    "title",
    "translate",
  ];

  if (htmlAttributes.includes(name)) {
    return true;
  }

  // CSS global values and short properties
  const cssKeywords = [
    "all",
    "appearance",
    "azimuth",
    "backface",
    "baseline",
    "bottom",
    "caption",
    "clear",
    "clip",
    "color",
    "content",
    "cursor",
    "direction",
    "display",
    "elevation",
    "filter",
    "flex",
    "float",
    "font",
    "gap",
    "grid",
    "height",
    "hyphens",
    "icon",
    "isolation",
    "left",
    "margin",
    "mask",
    "offset",
    "opacity",
    "order",
    "orphans",
    "outline",
    "overflow",
    "padding",
    "perspective",
    "position",
    "quotes",
    "resize",
    "right",
    "rotate",
    "scale",
    "top",
    "transform",
    "transition",
    "translate",
    "visibility",
    "widows",
    "width",
    "zoom",
  ];

  return cssKeywords.includes(name);
}