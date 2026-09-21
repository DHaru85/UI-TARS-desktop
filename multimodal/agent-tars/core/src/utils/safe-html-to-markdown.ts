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

export interface SafeHtmlToMarkdownOptions extends Turndown.Options {
  gfmExtension?: boolean;
  removeTags?: TagName[];
  fallbackMaxLength?: number;
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

function convertHtmlToMarkdown(html: string, options: SafeHtmlToMarkdownOptions): string {
  const {
    codeBlockStyle = 'fenced',
    headingStyle = 'atx',
    emDelimiter = '*',
    strongDelimiter = '**',
    gfmExtension = true,
    removeTags = DEFAULT_TAGS_TO_REMOVE,
  } = options;

  const turndown = new Turndown({
    codeBlockStyle,
    headingStyle,
    emDelimiter,
    strongDelimiter,
  });

  turndown.remove(removeTags);

  if (gfmExtension) {
    turndown.use(gfm);
  }

  return turndown.turndown(html);
}

/**
 * Convert Readability HTML to markdown without falling back to raw HTML (avoids LLM context blow-up).
 */
export function safeHtmlToMarkdown(html: string, options: SafeHtmlToMarkdownOptions = {}): string {
  if (!html) {
    return '';
  }

  const fallbackMaxLength = options.fallbackMaxLength ?? DEFAULT_FALLBACK_MAX_LENGTH;

  try {
    return convertHtmlToMarkdown(html, options);
  } catch {
    if (options.gfmExtension !== false) {
      try {
        return convertHtmlToMarkdown(html, { ...options, gfmExtension: false });
      } catch {
        // fall through to plain text
      }
    }

    console.warn(
      'HTML to Markdown conversion failed; using plain text fallback (content was not sent as raw HTML).',
    );
    return truncateWithNotice(htmlToPlainText(html), fallbackMaxLength);
  }
}
