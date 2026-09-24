<template>
  <div class="ai-md" :class="compact ? 'ai-md--compact' : ''" v-html="html" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { renderAiMarkdown } from '~/utils/aiMarkdown';

const props = defineProps<{ content: string; compact?: boolean }>();
const html = computed(() => renderAiMarkdown(props.content));
</script>

<style scoped>
.ai-md {
  font-size: 0.875rem;
  line-height: 1.6;
  color: inherit;
  word-break: break-word;
}
.ai-md--compact {
  font-size: 0.8125rem;
  line-height: 1.55;
}
.ai-md :deep(.ai-md-p) {
  margin: 0 0 0.6em;
}
.ai-md :deep(> :last-child) {
  margin-bottom: 0;
}
.ai-md :deep(strong) {
  font-weight: 700;
  color: rgb(17 24 39);
}
:global(.dark) .ai-md :deep(strong) {
  color: #fff;
}
.ai-md :deep(em) {
  font-style: italic;
}
.ai-md :deep(.ai-md-h) {
  font-weight: 700;
  margin: 0.9em 0 0.4em;
  font-size: 0.95em;
  letter-spacing: -0.01em;
}
.ai-md :deep(.ai-md-ul),
.ai-md :deep(.ai-md-ol) {
  margin: 0.2em 0 0.7em;
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.3em;
}
.ai-md :deep(.ai-md-ol) {
  counter-reset: ai-li;
}
.ai-md :deep(.ai-md-ul > li),
.ai-md :deep(.ai-md-ol > li) {
  position: relative;
  padding-left: 1.6em;
}
.ai-md :deep(.ai-md-ul > li)::before {
  content: '';
  position: absolute;
  left: 0.55em;
  top: 0.62em;
  width: 0.38em;
  height: 0.38em;
  border-radius: 9999px;
  background: rgb(59 130 246);
}
.ai-md :deep(.ai-md-ol > li) {
  counter-increment: ai-li;
}
.ai-md :deep(.ai-md-ol > li)::before {
  content: counter(ai-li);
  position: absolute;
  left: 0;
  top: 0.18em;
  width: 1.25em;
  height: 1.25em;
  border-radius: 0.4em;
  font-size: 0.75em;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(37 99 235);
  background: rgb(219 234 254);
}
:global(.dark) .ai-md :deep(.ai-md-ol > li)::before {
  color: rgb(147 197 253);
  background: rgb(30 58 138 / 0.5);
}
.ai-md :deep(.ai-md-code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
  padding: 0.08em 0.4em;
  border-radius: 0.375rem;
  background: rgb(238 242 255);
  color: rgb(67 56 202);
  border: 1px solid rgb(224 231 255);
  white-space: nowrap;
}
:global(.dark) .ai-md :deep(.ai-md-code) {
  background: rgb(49 46 129 / 0.35);
  color: rgb(165 180 252);
  border-color: rgb(67 56 202 / 0.4);
}
.ai-md :deep(.ai-md-pre) {
  margin: 0.5em 0 0.8em;
  padding: 0.75em 0.9em;
  border-radius: 0.75rem;
  background: rgb(3 7 18);
  color: rgb(52 211 153);
  font-size: 0.78em;
  overflow-x: auto;
}
.ai-md :deep(.ai-md-quote) {
  margin: 0.4em 0 0.7em;
  padding: 0.45em 0.8em;
  border-left: 3px solid rgb(59 130 246);
  background: rgb(239 246 255 / 0.7);
  border-radius: 0 0.5rem 0.5rem 0;
  color: rgb(55 65 81);
}
:global(.dark) .ai-md :deep(.ai-md-quote) {
  background: rgb(30 58 138 / 0.2);
  color: rgb(209 213 219);
}
.ai-md :deep(.ai-md-link) {
  color: rgb(37 99 235);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.ai-md :deep(.ai-md-hr) {
  border: 0;
  border-top: 1px solid rgb(229 231 235);
  margin: 0.8em 0;
}
.ai-md :deep(.ai-md-table-wrap) {
  overflow-x: auto;
  margin: 0.4em 0 0.8em;
  border-radius: 0.75rem;
  border: 1px solid rgb(229 231 235);
}
:global(.dark) .ai-md :deep(.ai-md-table-wrap) {
  border-color: rgb(55 65 81);
}
.ai-md :deep(.ai-md-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
}
.ai-md :deep(.ai-md-table th) {
  text-align: left;
  font-weight: 600;
  padding: 0.45em 0.7em;
  background: rgb(249 250 251);
  white-space: nowrap;
}
:global(.dark) .ai-md :deep(.ai-md-table th) {
  background: rgb(31 41 55);
}
.ai-md :deep(.ai-md-table td) {
  padding: 0.4em 0.7em;
  border-top: 1px solid rgb(243 244 246);
}
:global(.dark) .ai-md :deep(.ai-md-table td) {
  border-top-color: rgb(55 65 81);
}
</style>
