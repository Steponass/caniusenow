<script setup lang="ts">
import { computed } from "vue";

interface Props {
  text: string;
  tag?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const props = withDefaults(defineProps<Props>(), {
  tag: "span",
});

/**
 * Escapes HTML special characters to prevent them from being interpreted as HTML.
 * This is critical for displaying element names like <tr>, <div>, etc.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Converts backtick-wrapped text to <code> elements, escaping all HTML.
 *
 * Examples:
 *   "`Array.from()` method" → "<code>Array.from()</code> method"
 *   "`<tr>`"                → "<code>&lt;tr&gt;</code>"
 *   "Use <table>"          → "Use &lt;table&gt;"
 *
 * Both content inside and outside backticks is HTML-escaped for safety.
 */
const formattedText = computed(() => {
  const text = props.text;
  if (!text) return "";

  // Split the text by backtick pairs to process each segment
  // We escape ALL text (inside and outside backticks) and wrap code segments
  const parts: string[] = [];
  let lastIndex = 0;
  const backtickPattern = /`([^`]+)`/g;
  let match: RegExpExecArray | null;

  while ((match = backtickPattern.exec(text)) !== null) {
    // Add escaped text before this match
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      parts.push(escapeHtml(textBefore));
    }

    // Add the code block with escaped content
    const codeContent = match[1] ?? "";
    parts.push(`<code>${escapeHtml(codeContent)}</code>`);

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(escapeHtml(remainingText));
  }

  return parts.join("");
});

const hasCodeElements = computed(() => props.text?.includes("`") ?? false);
</script>

<template>
  <component :is="tag" v-if="hasCodeElements" v-html="formattedText" class="formatted-text" />
  <component :is="tag" v-else class="formatted-text">{{ text }}</component>
</template>

<style scoped>
.formatted-text :deep(code) {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
    "Liberation Mono", monospace;
  font-size: 0.9em;
  background-color: var(--clr-bg-overlay);
  padding: var(--space-4px);
  border-radius: var(--radius-2px);
  color: var(--clr-text-strong);
}



</style>