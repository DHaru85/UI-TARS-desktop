/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import Turndown, { TagName } from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const DEFAULT_TAGS_TO_REMOVE: TagName[] = [
  'script',
  'style',
  'link',
  'head',
  'iframe',
  'video',
  'audio',
  'canvas',
  'object',
  'embed',
  'noscript',
  'aside',
  'dialog',
];

const DEFAULT_FALLBACK_MAX_LENGTH = 120_000;

export function looksLikeHtml(text: string): boolean {
  if (!text) {
    return false;
  }

  const sample = text.slice(0, 8000);
  if (/^\s*</.test(sample)) {
    return true;
  }

  const tagCount = (sample.match(/<[a-zA-Z][^>]*>/g) || []).length;
  return tagCount > 5;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateWithNotice(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return (
    text.slice(0, maxLength) +
    '\n\n[Content truncated: HTML-to-Markdown conversion failed and output exceeded size limits]'
  );
}

function convertHtmlToMarkdown(html: string, gfmExtension: boolean): string {
  const turndown = new Turndown({
    codeBlockStyle: 'fenced',
    headingStyle: 'atx',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  turndown.remove(DEFAULT_TAGS_TO_REMOVE);

  if (gfmExtension) {
    turndown.use(gfm);
  }

  return turndown.turndown(html);
}

/** Safe HTML → Markdown; never returns raw HTML on Turndown/GFM failures. */
export function toMarkdown(html: string): string {
  if (!html) {
    return '';
  }

  try {
    return convertHtmlToMarkdown(html, true);
  } catch {
    try {
      return convertHtmlToMarkdown(html, false);
    } catch {
      console.warn(
        'HTML to Markdown conversion failed; using plain text fallback (content was not sent as raw HTML).',
      );
      return truncateWithNotice(htmlToPlainText(html), DEFAULT_FALLBACK_MAX_LENGTH);
    }
  }
}
