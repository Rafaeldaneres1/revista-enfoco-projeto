import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl, normalizeUploadedImageUrl, resolveAssetUrl } from '../lib/api';
import {
  normalizeRichTextForEditor,
  normalizeRichTextForStorage
} from '../lib/richText';

const BLOCK_SELECTOR = 'p, h1, h2, h3, ul, ol, li, figure';
const SIMPLE_BLOCK_SELECTOR = 'p, h1, h2, h3';
const DEFAULT_INLINE_FONT_SIZE = '18';
const DEFAULT_EDITORIAL_SIZE = '18';
const DEFAULT_PARAGRAPH_SPACING = '20';
const SELECTION_MARKER_ATTR = 'data-rich-editor-selection-marker';
const MEDIA_INSERTION_MARKER_ATTR = 'data-rich-editor-media-insertion-marker';
const RESETTABLE_INLINE_COMMANDS = ['bold', 'italic', 'underline'];
const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/jpg'
]);
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const IMAGE_UPLOAD_TIMEOUT_MS = 3 * 60 * 1000;
const EMPTY_MEDIA_META = {
  caption: '',
  credit: ''
};
const MEDIA_CAPTION_SEPARATOR = ' \u2014 ';
const LEGACY_BROKEN_MEDIA_CAPTION_SEPARATOR = ' \u00E2\u20AC\u201D ';
const EMPTY_CAPTION_MODAL = {
  mode: 'insert',
  type: 'image',
  imageUrls: [],
  selectionRange: null,
  targetFigure: null,
  existingCaption: ''
};

const INLINE_FONT_SIZES = [
  { value: '10', label: '10 px' },
  { value: '12', label: '12 px' },
  { value: '14', label: '14 px' },
  { value: '16', label: '16 px' },
  { value: '18', label: '18 px' },
  { value: '20', label: '20 px' },
  { value: '24', label: '24 px' },
  { value: '28', label: '28 px' },
  { value: '32', label: '32 px' },
  { value: '36', label: '36 px' },
  { value: '48', label: '48 px' },
  { value: '72', label: '72 px' }
];
const ALLOWED_INLINE_FONT_SIZE_VALUES = new Set(INLINE_FONT_SIZES.map((option) => option.value));

const EDITORIAL_TEXT_STYLES = [
  { value: '16', label: 'Compacto' },
  { value: '18', label: 'Editorial' },
  { value: '20', label: 'Destaque' },
  { value: '24', label: 'Grande' }
];

const PARAGRAPH_SPACING = [
  { value: '12', label: 'Ajustado' },
  { value: '20', label: 'Equilibrado' },
  { value: '28', label: 'Respirado' }
];

const BLOCK_OPTIONS = [
  { value: 'p', label: 'Paragrafo' },
  { value: 'h1', label: 'Titulo H1' },
  { value: 'h2', label: 'Titulo H2' },
  { value: 'h3', label: 'Titulo H3' }
];

const normalizeEditorHref = (value = '') => {
  const href = String(value || '').trim();
  if (!href) return '';

  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('/') ||
    href.startsWith('#')
  ) {
    return href;
  }

  return `https://${href}`;
};

const getCurrentSelection = () => {
  if (typeof window === 'undefined') return null;
  return window.getSelection();
};

const isRangeInsideEditor = (editor, range) => {
  if (!editor || !range) {
    return false;
  }

  try {
    const container =
      range.commonAncestorContainer?.nodeType === 1
        ? range.commonAncestorContainer
        : range.commonAncestorContainer?.parentElement;

    return Boolean(container && editor.contains(container));
  } catch (error) {
    return false;
  }
};

const getRangeInsideEditor = (editor) => {
  const selection = getCurrentSelection();
  if (!editor || !selection?.rangeCount) {
    return null;
  }

  const range = selection.getRangeAt(0);
  return isRangeInsideEditor(editor, range) ? range : null;
};

const getNodeElement = (node) => {
  if (!node) return null;
  return node.nodeType === 1 ? node : node.parentElement;
};

const getCurrentBlock = (editor, fromNode = null) => {
  if (!editor) return null;

  const selection = getCurrentSelection();
  const anchorNode = fromNode || selection?.anchorNode;
  const element = getNodeElement(anchorNode);

  if (!element) return null;

  const block = element.closest(BLOCK_SELECTOR);
  return block && editor.contains(block) ? block : null;
};

const getCurrentInlineFontSize = (editor, fromNode = null) => {
  if (!editor) {
    return DEFAULT_INLINE_FONT_SIZE;
  }

  const selection = getCurrentSelection();
  const anchorNode = fromNode || selection?.anchorNode;
  const element = getNodeElement(anchorNode);
  const inlineFontElement = element?.closest?.('span[style*="font-size"]');
  const inlineSize = inlineFontElement?.style?.fontSize?.replace('px', '');
  const currentBlock = getCurrentBlock(editor, anchorNode);
  const blockInlineSize = currentBlock?.style?.fontSize?.replace('px', '');

  if (
    inlineFontElement &&
    editor.contains(inlineFontElement) &&
    ALLOWED_INLINE_FONT_SIZE_VALUES.has(inlineSize)
  ) {
    return inlineSize;
  }

  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (range && isRangeInsideEditor(editor, range)) {
    const selectedInlineFontElement = Array.from(
      editor.querySelectorAll('span[style*="font-size"]')
    ).find((candidate) => {
      try {
        return range.intersectsNode(candidate);
      } catch (error) {
        return false;
      }
    });
    const selectedInlineSize = selectedInlineFontElement?.style?.fontSize?.replace('px', '');

    if (ALLOWED_INLINE_FONT_SIZE_VALUES.has(selectedInlineSize)) {
      return selectedInlineSize;
    }
  }

  if (ALLOWED_INLINE_FONT_SIZE_VALUES.has(blockInlineSize)) {
    return blockInlineSize;
  }

  return DEFAULT_INLINE_FONT_SIZE;
};

const focusEditor = (editor) => {
  editor?.focus();
};

const setSelectionRange = (range) => {
  const selection = getCurrentSelection();
  if (!selection || !range) {
    return false;
  }

  try {
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  } catch (error) {
    return false;
  }
};

const placeCaretInsideNode = (node, collapseToEnd = false) => {
  if (typeof window === 'undefined' || !node) {
    return null;
  }

  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(collapseToEnd);
  setSelectionRange(range);
  return range;
};

const saveSelection = (editor, selectionRef) => {
  const nextRange = getRangeInsideEditor(editor);
  if (nextRange) {
    selectionRef.current = nextRange.cloneRange();
  }
};

const getInlineCommandStates = () =>
  RESETTABLE_INLINE_COMMANDS.reduce((states, command) => {
    try {
      return {
        ...states,
        [command]: Boolean(document.queryCommandState(command))
      };
    } catch (error) {
      return {
        ...states,
        [command]: false
      };
    }
  }, {});

const isEditorBlank = (editor) => {
  if (!editor) {
    return true;
  }

  const text = editor.textContent?.replace(/\u00A0/g, ' ').trim();
  return !text && !editor.querySelector('img, figure[data-image="true"], figure[data-gallery="true"]');
};

const resetPendingInlineFormatting = (editor) => {
  if (!editor || !isEditorBlank(editor)) {
    return;
  }

  focusEditor(editor);

  RESETTABLE_INLINE_COMMANDS.forEach((command) => {
    try {
      if (document.queryCommandState(command)) {
        document.execCommand(command, false, null);
      }
    } catch (error) {
      // Some browsers can throw for queryCommandState in contenteditable.
    }
  });
};

const createSelectionMarker = (id) => {
  const marker = document.createElement('span');
  marker.setAttribute(SELECTION_MARKER_ATTR, id);
  marker.setAttribute('contenteditable', 'false');
  marker.style.display = 'none';
  marker.textContent = '\uFEFF';
  return marker;
};

const createMediaInsertionMarker = () => {
  const marker = document.createElement('span');
  marker.setAttribute(MEDIA_INSERTION_MARKER_ATTR, 'true');
  marker.setAttribute('contenteditable', 'false');
  marker.style.display = 'none';
  marker.textContent = '\uFEFF';
  return marker;
};

const getMediaInsertionMarker = (editor) =>
  editor?.querySelector?.(`[${MEDIA_INSERTION_MARKER_ATTR}="true"]`) || null;

const removeMediaInsertionMarker = (editor) => {
  getMediaInsertionMarker(editor)?.remove();
};

const placeMediaInsertionMarker = (editor, selectionRef) => {
  if (!editor) {
    return false;
  }

  const range = getSafeRange(editor, selectionRef);
  if (!range) {
    return false;
  }

  removeMediaInsertionMarker(editor);

  const insertionRange = range.cloneRange();
  insertionRange.collapse(false);

  const marker = createMediaInsertionMarker();
  insertionRange.insertNode(marker);

  const nextRange = document.createRange();
  nextRange.setStartAfter(marker);
  nextRange.collapse(true);
  setSelectionRange(nextRange);
  selectionRef.current = nextRange.cloneRange();

  return true;
};

const insertSelectionMarkers = (editor, range) => {
  if (!editor || !range || range.collapsed) {
    return null;
  }

  const markerId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const startId = `${markerId}-start`;
  const endId = `${markerId}-end`;
  const startMarker = createSelectionMarker(startId);
  const endMarker = createSelectionMarker(endId);

  const endRange = range.cloneRange();
  endRange.collapse(false);
  endRange.insertNode(endMarker);

  const startRange = range.cloneRange();
  startRange.collapse(true);
  startRange.insertNode(startMarker);

  const markedRange = document.createRange();
  markedRange.setStartAfter(startMarker);
  markedRange.setEndBefore(endMarker);
  setSelectionRange(markedRange);

  return { startId, endId };
};

const restoreSelectionFromMarkers = (editor, markers) => {
  if (!editor || !markers) {
    return null;
  }

  const startMarker = editor.querySelector(`[${SELECTION_MARKER_ATTR}="${markers.startId}"]`);
  const endMarker = editor.querySelector(`[${SELECTION_MARKER_ATTR}="${markers.endId}"]`);

  if (!startMarker || !endMarker || !startMarker.parentNode || !endMarker.parentNode) {
    return getRangeInsideEditor(editor);
  }

  const restoredRange = document.createRange();
  restoredRange.setStartAfter(startMarker);
  restoredRange.setEndBefore(endMarker);
  setSelectionRange(restoredRange);

  startMarker.remove();
  endMarker.remove();

  return restoredRange;
};

const hasMeaningfulContent = (node) => {
  if (!node) {
    return false;
  }

  const text = node.textContent?.replace(/\u00A0/g, ' ').trim();
  if (text) {
    return true;
  }

  return Boolean(node.querySelector?.('img, br, ul, ol, li'));
};

const cloneBlockStyles = (sourceBlock, targetBlock, options = {}) => {
  if (!sourceBlock || !targetBlock) {
    return;
  }

  const { copyTypography = true, copySpacing = true } = options;

  if (copyTypography && sourceBlock.style.fontSize) {
    targetBlock.style.fontSize = sourceBlock.style.fontSize;
  }

  if (copyTypography && sourceBlock.style.lineHeight) {
    targetBlock.style.lineHeight = sourceBlock.style.lineHeight;
  }

  if (copySpacing && sourceBlock.style.marginBottom) {
    targetBlock.style.marginBottom = sourceBlock.style.marginBottom;
  }
};

const createBlockFromFragment = (tagName, fragment, sourceBlock, options = {}) => {
  const block = document.createElement(tagName);
  cloneBlockStyles(sourceBlock, block, options);

  if (fragment) {
    block.appendChild(fragment);
  }

  if (!hasMeaningfulContent(block)) {
    block.innerHTML = '<br />';
  }

  return block;
};

const createEmptyParagraph = () => {
  const paragraph = document.createElement('p');
  paragraph.innerHTML = '<br />';
  return paragraph;
};

const createPlainTextFragment = (text) => {
  const fragment = document.createDocumentFragment();
  const lines = String(text || '').split(/\n/);

  lines.forEach((line, index) => {
    if (index > 0) {
      fragment.appendChild(document.createElement('br'));
    }
    if (line) {
      fragment.appendChild(document.createTextNode(line));
    }
  });

  if (!hasMeaningfulContent(fragment)) {
    fragment.appendChild(document.createElement('br'));
  }

  return fragment;
};

const createPlainTextBlocks = (text, sourceBlock) =>
  String(text || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((paragraphText) =>
      createBlockFromFragment('p', createPlainTextFragment(paragraphText), sourceBlock, {
        copyTypography: true,
        copySpacing: true
      })
    );

const insertPlainTextAtRange = (editor, range, text) => {
  const cleanText = String(text || '').replace(/\r\n?/g, '\n');
  if (!editor || !range || !cleanText) {
    return getRangeInsideEditor(editor);
  }

  const startBlock = getCurrentBlock(editor, range.startContainer);
  const endBlock = getCurrentBlock(editor, range.endContainer);
  const isMultiParagraph = /\n{2,}/.test(cleanText);

  if (!isMultiParagraph && startBlock && endBlock && startBlock === endBlock) {
    range.deleteContents();
    const fragment = createPlainTextFragment(cleanText);
    const lastChild = fragment.lastChild;
    range.insertNode(fragment);

    if (lastChild) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(lastChild);
      nextRange.collapse(true);
      setSelectionRange(nextRange);
      return nextRange;
    }

    return getRangeInsideEditor(editor);
  }

  const pastedBlocks = createPlainTextBlocks(cleanText, startBlock);
  if (startBlock && endBlock && startBlock === endBlock && isSimpleTextBlock(startBlock)) {
    const nextCaretTarget = insertNodesIntoSimpleBlock(startBlock, range, pastedBlocks);
    return placeCaretInsideNode(nextCaretTarget);
  }

  const fallbackTarget = insertBlocksWithFallback(range, pastedBlocks);
  return placeCaretInsideNode(fallbackTarget);
};

const applyInlineFontSizeToTypingTarget = (editor, range, nextSize) => {
  const targetBlock = getCurrentBlock(editor, range.startContainer);
  const canApplyDirectly =
    isSimpleTextBlock(targetBlock) || targetBlock?.tagName?.toLowerCase() === 'li';

  if (!targetBlock || !canApplyDirectly) {
    return getRangeInsideEditor(editor);
  }

  targetBlock.style.fontSize = `${nextSize}px`;
  return getRangeInsideEditor(editor) || placeCaretInsideNode(targetBlock, true);
};

const ensureParagraphScaffold = (editor, selectionRef) => {
  if (!editor) {
    return null;
  }

  const hasBlockChild = Array.from(editor.children).some((child) =>
    child.matches?.(BLOCK_SELECTOR)
  );

  if (!hasBlockChild) {
    editor.innerHTML = '<p><br /></p>';
    const firstBlock = editor.querySelector(BLOCK_SELECTOR);
    if (firstBlock) {
      const range = placeCaretInsideNode(firstBlock, true);
      if (range) {
        selectionRef.current = range.cloneRange();
      }
    }
  }

  return getCurrentBlock(editor) || editor.querySelector(BLOCK_SELECTOR);
};

const getSafeRange = (editor, selectionRef) => {
  ensureParagraphScaffold(editor, selectionRef);

  const selectionRange = getRangeInsideEditor(editor);
  if (selectionRange) {
    selectionRef.current = selectionRange.cloneRange();
    return selectionRange;
  }

  if (selectionRef.current && isRangeInsideEditor(editor, selectionRef.current)) {
    const restored = selectionRef.current.cloneRange();
    if (setSelectionRange(restored)) {
      return restored;
    }
  }

  const fallbackBlock = editor.querySelector(BLOCK_SELECTOR);
  if (!fallbackBlock) {
    return null;
  }

  const fallbackRange = placeCaretInsideNode(fallbackBlock, true);
  if (fallbackRange) {
    selectionRef.current = fallbackRange.cloneRange();
  }
  return fallbackRange;
};

const getSelectedBlocks = (editor, range) => {
  if (!editor || !range) {
    return [];
  }

  return Array.from(editor.querySelectorAll(BLOCK_SELECTOR)).filter((block) => {
    try {
      return range.intersectsNode(block);
    } catch (error) {
      return false;
    }
  });
};

const isSimpleTextBlock = (block) => block?.matches?.(SIMPLE_BLOCK_SELECTOR);

const replaceBlockTag = (block, nextBlockType) => {
  if (!block || !nextBlockType) {
    return null;
  }

  const currentTag = block.tagName.toLowerCase();
  if (currentTag === nextBlockType) {
    return block;
  }

  const replacement = document.createElement(nextBlockType);
  cloneBlockStyles(block, replacement, {
    copyTypography: false,
    copySpacing: true
  });
  replacement.innerHTML = block.innerHTML || '<br />';
  block.replaceWith(replacement);
  return replacement;
};

const splitSimpleBlockForStructure = (block, range, nextBlockType) => {
  if (!block?.parentNode) {
    return null;
  }

  const currentTag = block.tagName.toLowerCase();
  if (currentTag === nextBlockType) {
    return block;
  }

  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(block);
  beforeRange.setEnd(range.startContainer, range.startOffset);

  const selectedRange = range.cloneRange();

  const afterRange = document.createRange();
  afterRange.selectNodeContents(block);
  afterRange.setStart(range.endContainer, range.endOffset);

  const beforeFragment = beforeRange.cloneContents();
  const selectedFragment = selectedRange.cloneContents();
  const afterFragment = afterRange.cloneContents();

  const fragment = document.createDocumentFragment();
  if (hasMeaningfulContent(beforeFragment)) {
    fragment.appendChild(
      createBlockFromFragment(currentTag, beforeFragment, block, {
        copyTypography: true,
        copySpacing: true
      })
    );
  }

  const selectedBlock = createBlockFromFragment(nextBlockType, selectedFragment, block, {
    copyTypography: false,
    copySpacing: true
  });
  fragment.appendChild(selectedBlock);

  if (hasMeaningfulContent(afterFragment)) {
    fragment.appendChild(
      createBlockFromFragment(currentTag, afterFragment, block, {
        copyTypography: true,
        copySpacing: true
      })
    );
  }

  block.parentNode.insertBefore(fragment, block);
  block.remove();
  return selectedBlock;
};

const composeMediaCaption = ({ caption = '', credit = '' } = EMPTY_MEDIA_META) => {
  const cleanCaption = caption.trim();
  const cleanCredit = credit.trim();

  if (cleanCaption && cleanCredit) {
    return `${cleanCaption}${MEDIA_CAPTION_SEPARATOR}${cleanCredit}`;
  }

  return cleanCaption || cleanCredit;
};

const splitMediaCaption = (value = '') => {
  const captionText = String(value || '').trim();
  if (!captionText) {
    return EMPTY_MEDIA_META;
  }

  const separator =
    [MEDIA_CAPTION_SEPARATOR, LEGACY_BROKEN_MEDIA_CAPTION_SEPARATOR, ' - '].find((candidate) =>
      captionText.includes(candidate)
    ) || '';
  if (!separator) {
    return {
      caption: '',
      credit: captionText
    };
  }

  const [caption, ...creditParts] = captionText.split(separator);
  return {
    caption: caption.trim(),
    credit: creditParts.join(separator).trim()
  };
};

const createMediaCaptionElement = (mediaMeta = EMPTY_MEDIA_META) => {
  const captionText = composeMediaCaption(mediaMeta);
  if (!captionText) {
    return null;
  }

  const figcaption = document.createElement('figcaption');
  figcaption.textContent = captionText;
  return figcaption;
};

const setMediaMetaAttributes = (figure, mediaMeta = EMPTY_MEDIA_META) => {
  const cleanCaption = String(mediaMeta.caption || '').trim();
  const cleanCredit = String(mediaMeta.credit || '').trim();

  if (cleanCaption) {
    figure.setAttribute('data-caption', cleanCaption);
  } else {
    figure.removeAttribute('data-caption');
  }

  if (cleanCredit) {
    figure.setAttribute('data-credit', cleanCredit);
  } else {
    figure.removeAttribute('data-credit');
  }
};

const createInlineImageElement = (imageUrl, mediaMeta = EMPTY_MEDIA_META) => {
  const image = document.createElement('img');
  image.setAttribute('src', resolveAssetUrl(imageUrl) || imageUrl);
  image.setAttribute('data-src', imageUrl);
  image.setAttribute('alt', mediaMeta.caption?.trim() || '');
  return image;
};

const createInlineImageFigure = (imageUrl, mediaMeta = EMPTY_MEDIA_META) => {
  const figure = document.createElement('figure');
  figure.setAttribute('data-image', 'true');
  setMediaMetaAttributes(figure, mediaMeta);
  figure.appendChild(createInlineImageElement(imageUrl, mediaMeta));

  const figcaption = createMediaCaptionElement(mediaMeta);
  if (figcaption) {
    figure.appendChild(figcaption);
  }

  return figure;
};

const createGalleryFigure = (imageUrls, mediaMeta = EMPTY_MEDIA_META) => {
  const figure = document.createElement('figure');
  figure.setAttribute('data-gallery', 'true');
  setMediaMetaAttributes(figure, mediaMeta);

  imageUrls.forEach((imageUrl) => {
    figure.appendChild(createInlineImageElement(imageUrl, mediaMeta));
  });

  const figcaption = createMediaCaptionElement(mediaMeta);
  if (figcaption) {
    figure.appendChild(figcaption);
  }

  return figure;
};

const getMediaFigureFromRange = (editor, range) => {
  if (!editor || !range) {
    return null;
  }

  const startElement = getNodeElement(range.startContainer);
  const closestFigure = startElement?.closest?.('figure[data-image="true"], figure[data-gallery="true"]');
  if (closestFigure && editor.contains(closestFigure)) {
    return closestFigure;
  }

  return Array.from(editor.querySelectorAll('figure[data-image="true"], figure[data-gallery="true"]')).find((figure) => {
    try {
      return range.intersectsNode(figure);
    } catch (error) {
      return false;
    }
  }) || null;
};

const setFigureCaption = (figure, mediaMeta = EMPTY_MEDIA_META) => {
  if (!figure) {
    return;
  }

  const captionText = composeMediaCaption(mediaMeta);
  const currentCaption = Array.from(figure.children || []).find(
    (child) => child.tagName?.toLowerCase() === 'figcaption'
  );

  if (!captionText) {
    setMediaMetaAttributes(figure, EMPTY_MEDIA_META);
    currentCaption?.remove();
    return;
  }

  setMediaMetaAttributes(figure, mediaMeta);
  const figcaption = currentCaption || document.createElement('figcaption');
  figcaption.textContent = captionText;

  if (!currentCaption) {
    figure.appendChild(figcaption);
  }
};

const insertNodesIntoSimpleBlock = (block, range, insertedNodes) => {
  if (!block?.parentNode || !insertedNodes?.length) {
    return null;
  }

  const currentTag = block.tagName.toLowerCase();
  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(block);
  beforeRange.setEnd(range.startContainer, range.startOffset);

  const afterRange = document.createRange();
  afterRange.selectNodeContents(block);
  afterRange.setStart(range.endContainer, range.endOffset);

  const beforeFragment = beforeRange.cloneContents();
  const afterFragment = afterRange.cloneContents();

  const fragment = document.createDocumentFragment();
  if (hasMeaningfulContent(beforeFragment)) {
    fragment.appendChild(
      createBlockFromFragment(currentTag, beforeFragment, block, {
        copyTypography: true,
        copySpacing: true
      })
    );
  }

  insertedNodes.forEach((node) => {
    fragment.appendChild(node);
  });

  let caretTarget = null;
  if (hasMeaningfulContent(afterFragment)) {
    caretTarget = createBlockFromFragment(currentTag, afterFragment, block, {
      copyTypography: true,
      copySpacing: true
    });
    fragment.appendChild(caretTarget);
  } else {
    caretTarget = createEmptyParagraph();
    fragment.appendChild(caretTarget);
  }

  block.parentNode.insertBefore(fragment, block);
  block.remove();
  return caretTarget;
};

const insertBlocksWithFallback = (range, insertedNodes) => {
  if (!insertedNodes?.length) {
    return null;
  }

  range.deleteContents();

  const trailingParagraph = createEmptyParagraph();
  const fragment = document.createDocumentFragment();
  insertedNodes.forEach((node) => {
    fragment.appendChild(node);
  });
  fragment.appendChild(trailingParagraph);

  range.insertNode(fragment);
  return trailingParagraph;
};

const insertNodesAtMediaInsertionMarker = (editor, insertedNodes) => {
  const marker = getMediaInsertionMarker(editor);
  if (!marker || !insertedNodes?.length) {
    return null;
  }

  const markerRange = document.createRange();
  markerRange.setStartBefore(marker);
  markerRange.setEndAfter(marker);

  const startBlock = getCurrentBlock(editor, marker);
  const endBlock = startBlock;

  if (
    startBlock &&
    endBlock &&
    startBlock === endBlock &&
    isSimpleTextBlock(startBlock)
  ) {
    return insertNodesIntoSimpleBlock(startBlock, markerRange, insertedNodes);
  }

  return insertBlocksWithFallback(markerRange, insertedNodes);
};

const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Escreva a matéria...',
  minHeight = 360,
  token
}) => {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const mediaInsertionRangeRef = useRef(null);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const syncingRef = useRef(false);
  const focusedRef = useRef(false);
  const toolbarInteractionRef = useRef(false);
  const lockedInlineFontSizeRef = useRef(null);

  const [blockType, setBlockType] = useState('p');
  const [inlineFontSize, setInlineFontSize] = useState(DEFAULT_INLINE_FONT_SIZE);
  const [editorialSize, setEditorialSize] = useState(DEFAULT_EDITORIAL_SIZE);
  const [paragraphSpacing, setParagraphSpacing] = useState(DEFAULT_PARAGRAPH_SPACING);
  const [uploadError, setUploadError] = useState('');
  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingMediaInsertion, setPendingMediaInsertion] = useState(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaCredit, setMediaCredit] = useState('');
  const [activeInlineCommands, setActiveInlineCommands] = useState(getInlineCommandStates);

  const syncToolbarWithBlock = (block, fromNode = null) => {
    if (!block) {
      return;
    }

    const tagName = block.tagName.toLowerCase();
    setBlockType(['p', 'h1', 'h2', 'h3'].includes(tagName) ? tagName : 'p');
    setInlineFontSize(
      lockedInlineFontSizeRef.current || getCurrentInlineFontSize(editorRef.current, fromNode || block)
    );
    setEditorialSize(block.style.fontSize?.replace('px', '') || DEFAULT_EDITORIAL_SIZE);
    setParagraphSpacing(block.style.marginBottom?.replace('px', '') || DEFAULT_PARAGRAPH_SPACING);
    setActiveInlineCommands(getInlineCommandStates());
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || syncingRef.current || focusedRef.current) {
      return;
    }

    const normalized = value ? normalizeRichTextForEditor(value) : '<p><br /></p>';
    const currentNormalized = normalizeRichTextForEditor(editor.innerHTML || '');

    if (currentNormalized !== normalized) {
      editor.innerHTML = normalized;
    }

    syncToolbarWithBlock(editor.querySelector(BLOCK_SELECTOR));
  }, [value]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      const range = getRangeInsideEditor(editor);
      if (!range) {
        return;
      }

      selectionRef.current = range.cloneRange();
      syncToolbarWithBlock(getCurrentBlock(editor, range.startContainer), range.startContainer);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleInput = () => {
    const editor = editorRef.current;
    if (!editor) return;

    saveSelection(editor, selectionRef);
    onChange(editor.innerHTML);
  };

  const handleBeforeInput = () => {
    resetPendingInlineFormatting(editorRef.current);
    setActiveInlineCommands(getInlineCommandStates());
  };

  const handleEditorKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    const editor = editorRef.current;
    const range = getRangeInsideEditor(editor);
    const block = range ? getCurrentBlock(editor, range.startContainer) : null;
    const tagName = block?.tagName?.toLowerCase();

    if (!editor || !range?.collapsed || !['h1', 'h2', 'h3'].includes(tagName)) {
      return;
    }

    event.preventDefault();

    const afterRange = document.createRange();
    afterRange.selectNodeContents(block);
    afterRange.setStart(range.startContainer, range.startOffset);

    const afterFragment = afterRange.cloneContents();
    afterRange.deleteContents();

    const paragraph = createBlockFromFragment('p', afterFragment, block, {
      copyTypography: false,
      copySpacing: true
    });

    block.parentNode.insertBefore(paragraph, block.nextSibling);
    const nextRange = placeCaretInsideNode(paragraph);

    if (nextRange) {
      selectionRef.current = nextRange.cloneRange();
    }

    handleInput();
    syncToolbarWithBlock(paragraph, paragraph);
  };

  const handlePaste = (event) => {
    const pastedText = event.clipboardData?.getData('text/plain') || '';
    if (!pastedText) {
      return;
    }

    event.preventDefault();

    runMutation(({ editor, range }) => insertPlainTextAtRange(editor, range, pastedText));
  };

  const syncContent = () => {
    const editor = editorRef.current;
    if (!editor) return;

    syncingRef.current = true;
    const normalized = normalizeRichTextForStorage(editor.innerHTML);
    const editorHtml = normalized ? normalizeRichTextForEditor(normalized) : '<p><br /></p>';
    editor.innerHTML = editorHtml;
    onChange(normalized);
    syncingRef.current = false;
  };

  const runMutation = (callback) => {
    const editor = editorRef.current;
    if (!editor) return;

    setUploadError('');
    const shouldRestoreToolbarSelection = toolbarInteractionRef.current;
    toolbarInteractionRef.current = false;
    focusEditor(editor);

    let range = null;
    if (
      shouldRestoreToolbarSelection &&
      selectionRef.current &&
      isRangeInsideEditor(editor, selectionRef.current)
    ) {
      range = selectionRef.current.cloneRange();
      setSelectionRange(range);
    }

    if (!range) {
      range = getSafeRange(editor, selectionRef);
    }

    if (!range) {
      return;
    }

    const nextRange = callback({ editor, range: range.cloneRange() });
    handleInput();

    const selectionTarget = nextRange && isRangeInsideEditor(editor, nextRange) ? nextRange : getRangeInsideEditor(editor);
    if (selectionTarget) {
      selectionRef.current = selectionTarget.cloneRange();
      setSelectionRange(selectionTarget);
      syncToolbarWithBlock(getCurrentBlock(editor, selectionTarget.startContainer), selectionTarget.startContainer);
    } else {
      saveSelection(editor, selectionRef);
      syncToolbarWithBlock(getCurrentBlock(editor));
    }
  };

  const applyInlineCommand = (command) => {
    runMutation(() => {
      document.execCommand('styleWithCSS', false, false);
      document.execCommand(command, false, null);
      return getRangeInsideEditor(editorRef.current);
    });
  };

  const applyBlockType = (nextBlockType) => {
    runMutation(({ editor, range }) => {
      const startBlock = getCurrentBlock(editor, range.startContainer);
      const endBlock = getCurrentBlock(editor, range.endContainer);

      if (!startBlock) {
        return getRangeInsideEditor(editor);
      }

      if (range.collapsed) {
        const updatedBlock = replaceBlockTag(startBlock, nextBlockType);
        return placeCaretInsideNode(updatedBlock || startBlock);
      }

      if (
        startBlock &&
        endBlock &&
        startBlock === endBlock &&
        isSimpleTextBlock(startBlock)
      ) {
        const updatedBlock = splitSimpleBlockForStructure(startBlock, range, nextBlockType);
        if (updatedBlock) {
          const nextRange = document.createRange();
          nextRange.selectNodeContents(updatedBlock);
          setSelectionRange(nextRange);
          return nextRange;
        }
      }

      const selectedBlocks = getSelectedBlocks(editor, range);
      if (!selectedBlocks.length) {
        return getRangeInsideEditor(editor);
      }

      let firstUpdatedBlock = null;
      selectedBlocks.forEach((block) => {
        const updatedBlock = replaceBlockTag(block, nextBlockType);
        if (!firstUpdatedBlock) {
          firstUpdatedBlock = updatedBlock || block;
        }
      });

      return placeCaretInsideNode(firstUpdatedBlock || selectedBlocks[0]);
    });
  };

  const applyList = (ordered = false) => {
    runMutation(() => {
      document.execCommand(
        ordered ? 'insertOrderedList' : 'insertUnorderedList',
        false,
        null
      );
      return getRangeInsideEditor(editorRef.current);
    });
  };

  const applyLink = () => {
    const href = normalizeEditorHref(window.prompt('Cole o link da matéria ou referência:', 'https://'));
    if (!href) {
      return;
    }

    runMutation(({ editor, range }) => {
      const selection = getCurrentSelection();
      const selectedText = selection?.toString().trim();

      if (selection?.isCollapsed) {
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = href;
        range.insertNode(anchor);

        const nextRange = document.createRange();
        nextRange.setStartAfter(anchor);
        nextRange.collapse(true);
        setSelectionRange(nextRange);
        return nextRange;
      }

      document.execCommand('createLink', false, href);
      Array.from(editor.querySelectorAll('a')).forEach((anchor) => {
        try {
          if (!range.intersectsNode(anchor)) {
            return;
          }
        } catch (error) {
          return;
        }

        anchor.setAttribute('href', href);
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
      });

      if (!selectedText) {
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = href;
        range.insertNode(anchor);
      }

      return getRangeInsideEditor(editor);
    });
  };

  const updateBlockStyle = (property, nextValue) => {
    runMutation(({ editor, range }) => {
      const blocks = getSelectedBlocks(editor, range);
      const targetBlocks = blocks.length ? blocks : [getCurrentBlock(editor, range.startContainer)];

      targetBlocks.filter(Boolean).forEach((block) => {
        if (nextValue) {
          block.style.setProperty(property, nextValue);
        } else {
          block.style.removeProperty(property);
        }
      });

      return getRangeInsideEditor(editor);
    });
  };

  const handleInlineFontSizeChange = (event) => {
    const nextSize = event.target.value;
    if (!ALLOWED_INLINE_FONT_SIZE_VALUES.has(nextSize)) {
      return;
    }

    lockedInlineFontSizeRef.current = nextSize;
    setInlineFontSize(nextSize);

    runMutation(({ editor, range }) => {
      if (range.collapsed) {
        return applyInlineFontSizeToTypingTarget(editor, range, nextSize);
      }

      const selectionMarkers = insertSelectionMarkers(editor, range);
      document.execCommand('fontSize', false, '7');

      Array.from(editor.querySelectorAll('font[size="7"]')).forEach((fontElement) => {
        const span = document.createElement('span');
        span.style.fontSize = `${nextSize}px`;

        while (fontElement.firstChild) {
          span.appendChild(fontElement.firstChild);
        }

        fontElement.replaceWith(span);
      });

      return selectionMarkers
        ? restoreSelectionFromMarkers(editor, selectionMarkers)
        : getRangeInsideEditor(editor);
    });

    setInlineFontSize(nextSize);
    window.setTimeout(() => {
      if (lockedInlineFontSizeRef.current === nextSize) {
        lockedInlineFontSizeRef.current = null;
      }
    }, 250);
  };

  const handleEditorialSizeChange = (event) => {
    const nextSize = event.target.value;
    setEditorialSize(nextSize);
    updateBlockStyle('font-size', `${nextSize}px`);
  };

  const handleParagraphSpacingChange = (event) => {
    const nextSpacing = event.target.value;
    setParagraphSpacing(nextSpacing);
    updateBlockStyle('margin-bottom', `${nextSpacing}px`);
  };

  const preventToolbarBlur = (event) => {
    toolbarInteractionRef.current = true;
    event.preventDefault();
  };

  const captureToolbarSelection = () => {
    toolbarInteractionRef.current = true;
    saveSelection(editorRef.current, selectionRef);
  };

  const handleEditorFocus = () => {
    const editor = editorRef.current;
    if (!editor) return;

    focusedRef.current = true;
    ensureParagraphScaffold(editor, selectionRef);
    resetPendingInlineFormatting(editor);
    setActiveInlineCommands(getInlineCommandStates());
    saveSelection(editor, selectionRef);
    syncToolbarWithBlock(getCurrentBlock(editor));
  };

  const handleEditorBlur = () => {
    focusedRef.current = false;

    if (toolbarInteractionRef.current || getMediaInsertionMarker(editorRef.current)) {
      return;
    }

    syncContent();
  };

  const openInlineImagePicker = () => {
    const editor = editorRef.current;
    if (!editor || !token) {
      setUploadError('Faca login novamente para inserir imagens no texto.');
      return;
    }

    setUploadError('');
    if (!placeMediaInsertionMarker(editor, selectionRef)) {
      saveSelection(editor, selectionRef);
      mediaInsertionRangeRef.current = selectionRef.current?.cloneRange() || null;
    } else {
      mediaInsertionRangeRef.current = null;
    }
    fileInputRef.current?.click();
  };

  const openGalleryPicker = () => {
    const editor = editorRef.current;
    if (!editor || !token) {
      setUploadError('Faca login novamente para inserir galerias no texto.');
      return;
    }

    setUploadError('');
    if (!placeMediaInsertionMarker(editor, selectionRef)) {
      saveSelection(editor, selectionRef);
      mediaInsertionRangeRef.current = selectionRef.current?.cloneRange() || null;
    } else {
      mediaInsertionRangeRef.current = null;
    }
    galleryInputRef.current?.click();
  };

  const uploadInlineImages = async (files) => {
    const uploadedUrls = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const payload = new FormData();
      payload.append('file', file);

      const response = await axios.post(apiUrl('/api/media/upload'), payload, {
        headers: {
          
        },
        timeout: IMAGE_UPLOAD_TIMEOUT_MS,
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }

          const singleProgress = progressEvent.loaded / progressEvent.total;
          const overallProgress = ((index + singleProgress) / files.length) * 100;
          setUploadProgress(Math.max(1, Math.min(100, Math.round(overallProgress))));
        }
      });

      const imageUrl = normalizeUploadedImageUrl(response.data?.url || '');
      if (!imageUrl) {
        throw new Error('Upload returned an empty URL');
      }

      uploadedUrls.push(imageUrl);
    }

    setUploadProgress(100);
    return uploadedUrls;
  };

  const validateInlineFiles = (files) => {
    if (!files.length) {
      return 'Nenhuma imagem foi selecionada.';
    }

    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.has((file.type || '').toLowerCase())) {
        return 'Escolha imagens JPG, PNG, WEBP, GIF ou SVG.';
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return `Cada imagem deve ter no maximo ${MAX_FILE_SIZE_MB} MB.`;
      }
    }

    return '';
  };

  const openCaptionModalForUpload = (type, imageUrls) => {
    toolbarInteractionRef.current = true;
    setMediaCaption('');
    setMediaCredit('');
    setPendingMediaInsertion({
      ...EMPTY_CAPTION_MODAL,
      mode: 'insert',
      type,
      imageUrls,
      selectionRange:
        mediaInsertionRangeRef.current && isRangeInsideEditor(editorRef.current, mediaInsertionRangeRef.current)
          ? mediaInsertionRangeRef.current.cloneRange()
          : null
    });
  };

  const openCaptionModalForSelectedMedia = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const range = getSafeRange(editor, selectionRef);
    const targetFigure = getMediaFigureFromRange(editor, range);

    if (!targetFigure) {
      setUploadError('Clique em uma imagem ou galeria do conteúdo para editar a legenda.');
      return;
    }

    const currentCaption =
      Array.from(targetFigure.children || []).find(
        (child) => child.tagName?.toLowerCase() === 'figcaption'
      )?.textContent || '';
    const currentMeta = splitMediaCaption(currentCaption);

    setUploadError('');
    setMediaCaption(currentMeta.caption);
    setMediaCredit(currentMeta.credit);
    setPendingMediaInsertion({
      ...EMPTY_CAPTION_MODAL,
      mode: 'edit',
      type: targetFigure.getAttribute('data-gallery') === 'true' ? 'gallery' : 'image',
      targetFigure,
      existingCaption: currentCaption
    });
  };

  const insertUploadedMedia = ({ skipCaption = false } = {}) => {
    if (!pendingMediaInsertion) {
      return;
    }

    const editorNode = editorRef.current;

    const mediaMeta = skipCaption
      ? EMPTY_MEDIA_META
      : {
          caption: mediaCaption,
          credit: mediaCredit
        };

    if (pendingMediaInsertion.mode === 'edit') {
      setFigureCaption(pendingMediaInsertion.targetFigure, mediaMeta);
      handleInput();
      cancelUploadedMediaInsertion();
      return;
    }

    if (!pendingMediaInsertion.imageUrls?.length) {
      return;
    }

    const hasInsertionMarker = Boolean(getMediaInsertionMarker(editorNode));
    if (
      !hasInsertionMarker &&
      pendingMediaInsertion.selectionRange &&
      isRangeInsideEditor(editorNode, pendingMediaInsertion.selectionRange)
    ) {
      selectionRef.current = pendingMediaInsertion.selectionRange.cloneRange();
      toolbarInteractionRef.current = true;
    }

    runMutation(({ editor, range }) => {
      const startBlock = getCurrentBlock(editor, range.startContainer);
      const endBlock = getCurrentBlock(editor, range.endContainer);
      const insertedNodes =
        pendingMediaInsertion.type === 'gallery'
          ? [createGalleryFigure(pendingMediaInsertion.imageUrls, mediaMeta)]
          : pendingMediaInsertion.imageUrls.map((imageUrl) =>
              createInlineImageFigure(imageUrl, mediaMeta)
            );

      const markedCaretTarget = insertNodesAtMediaInsertionMarker(editor, insertedNodes);
      if (markedCaretTarget) {
        return placeCaretInsideNode(markedCaretTarget);
      }

      if (
        startBlock &&
        endBlock &&
        startBlock === endBlock &&
        isSimpleTextBlock(startBlock)
      ) {
        const nextCaretTarget = insertNodesIntoSimpleBlock(startBlock, range, insertedNodes);
        return placeCaretInsideNode(nextCaretTarget);
      }

      const fallbackTarget = insertBlocksWithFallback(range, insertedNodes);
      return placeCaretInsideNode(fallbackTarget);
    });

    setPendingMediaInsertion(null);
    removeMediaInsertionMarker(editorNode);
    mediaInsertionRangeRef.current = null;
    setMediaCaption('');
    setMediaCredit('');
  };

  const cancelUploadedMediaInsertion = () => {
    removeMediaInsertionMarker(editorRef.current);
    toolbarInteractionRef.current = false;
    setPendingMediaInsertion(null);
    mediaInsertionRangeRef.current = null;
    setMediaCaption('');
    setMediaCredit('');
  };

  const handleInlineImageChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      removeMediaInsertionMarker(editorRef.current);
      toolbarInteractionRef.current = false;
      mediaInsertionRangeRef.current = null;
      return;
    }

    setUploadError('');
    setUploadProgress(0);

    const validationError = validateInlineFiles(files);
    if (validationError) {
      removeMediaInsertionMarker(editorRef.current);
      toolbarInteractionRef.current = false;
      mediaInsertionRangeRef.current = null;
      setUploadError(validationError);
      event.target.value = '';
      return;
    }

    setUploadingInlineImage(true);

    try {
      const imageUrls = await uploadInlineImages(files);
      openCaptionModalForUpload('image', imageUrls);
    } catch (uploadError) {
      removeMediaInsertionMarker(editorRef.current);
      toolbarInteractionRef.current = false;
      mediaInsertionRangeRef.current = null;
      console.error('Error uploading inline image:', uploadError);
      if (uploadError.code === 'ECONNABORTED') {
        setUploadError('O envio da imagem demorou demais. Tente novamente com uma imagem menor.');
      } else {
        setUploadError(
          uploadError?.response?.data?.detail || 'Não foi possível inserir a imagem no conteúdo.'
        );
      }
    } finally {
      setUploadingInlineImage(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  const handleGalleryChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      removeMediaInsertionMarker(editorRef.current);
      toolbarInteractionRef.current = false;
      mediaInsertionRangeRef.current = null;
      return;
    }

    setUploadError('');
    setUploadProgress(0);

    const validationError = validateInlineFiles(files);
    if (validationError) {
      removeMediaInsertionMarker(editorRef.current);
      toolbarInteractionRef.current = false;
      mediaInsertionRangeRef.current = null;
      setUploadError(validationError);
      event.target.value = '';
      return;
    }

    setUploadingInlineImage(true);

    try {
      const imageUrls = await uploadInlineImages(files);
      openCaptionModalForUpload('gallery', imageUrls);
    } catch (uploadError) {
      removeMediaInsertionMarker(editorRef.current);
      toolbarInteractionRef.current = false;
      mediaInsertionRangeRef.current = null;
      console.error('Error uploading gallery images:', uploadError);
      if (uploadError.code === 'ECONNABORTED') {
        setUploadError('O envio da galeria demorou demais. Tente novamente ou reduza as imagens.');
      } else {
        setUploadError(
          uploadError?.response?.data?.detail || 'Não foi possível inserir a galeria no conteúdo.'
        );
      }
    } finally {
      setUploadingInlineImage(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  return (
    <div className="rich-editor-shell">
      <div className="rich-editor-toolbar">
        <div className="rich-editor-toolbar-group">
          <label className="rich-editor-toolbar-label" htmlFor="block-type-select">
            Estrutura
          </label>
          <select
            id="block-type-select"
            value={blockType}
            onChange={(event) => applyBlockType(event.target.value)}
            onMouseDown={() => {
              toolbarInteractionRef.current = true;
            }}
            className="rich-editor-select"
          >
            {BLOCK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rich-editor-toolbar-group">
          <label className="rich-editor-toolbar-label" htmlFor="inline-font-size-select">
            Fonte
          </label>
          <select
            id="inline-font-size-select"
            value={inlineFontSize}
            onChange={handleInlineFontSizeChange}
            onFocus={captureToolbarSelection}
            onMouseDown={captureToolbarSelection}
            className="rich-editor-select"
          >
            {INLINE_FONT_SIZES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rich-editor-toolbar-group">
          <label className="rich-editor-toolbar-label" htmlFor="editorial-size-select">
            Estilo
          </label>
          <select
            id="editorial-size-select"
            value={editorialSize}
            onChange={handleEditorialSizeChange}
            onMouseDown={() => {
              toolbarInteractionRef.current = true;
            }}
            className="rich-editor-select"
          >
            {EDITORIAL_TEXT_STYLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rich-editor-toolbar-group">
          <label className="rich-editor-toolbar-label" htmlFor="paragraph-spacing-select">
            Espacamento
          </label>
          <select
            id="paragraph-spacing-select"
            value={paragraphSpacing}
            onChange={handleParagraphSpacingChange}
            onMouseDown={() => {
              toolbarInteractionRef.current = true;
            }}
            className="rich-editor-select"
          >
            {PARAGRAPH_SPACING.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rich-editor-toolbar-group rich-editor-toolbar-actions">
          <button
            type="button"
            className={`rich-editor-button rich-editor-button-bold ${
              activeInlineCommands.bold ? 'rich-editor-button-active' : ''
            }`}
            aria-pressed={activeInlineCommands.bold}
            onMouseDown={preventToolbarBlur}
            onClick={() => applyInlineCommand('bold')}
          >
            B
          </button>
          <button
            type="button"
            className={`rich-editor-button rich-editor-button-italic ${
              activeInlineCommands.italic ? 'rich-editor-button-active' : ''
            }`}
            aria-pressed={activeInlineCommands.italic}
            onMouseDown={preventToolbarBlur}
            onClick={() => applyInlineCommand('italic')}
          >
            I
          </button>
          <button
            type="button"
            className={`rich-editor-button rich-editor-button-underline ${
              activeInlineCommands.underline ? 'rich-editor-button-active' : ''
            }`}
            aria-pressed={activeInlineCommands.underline}
            onMouseDown={preventToolbarBlur}
            onClick={() => applyInlineCommand('underline')}
          >
            U
          </button>
          <button
            type="button"
            className="rich-editor-button"
            onMouseDown={preventToolbarBlur}
            onClick={() => applyList(false)}
          >
            Lista
          </button>
          <button
            type="button"
            className="rich-editor-button"
            onMouseDown={preventToolbarBlur}
            onClick={() => applyList(true)}
          >
            1.
          </button>
          <button
            type="button"
            className="rich-editor-button"
            onMouseDown={preventToolbarBlur}
            onClick={applyLink}
          >
            Link
          </button>
          <button
            type="button"
            className="rich-editor-button"
            onMouseDown={preventToolbarBlur}
            onClick={openInlineImagePicker}
            disabled={uploadingInlineImage}
          >
            {uploadingInlineImage ? 'Imagem...' : 'Imagem'}
          </button>
          <button
            type="button"
            className="rich-editor-button"
            onMouseDown={preventToolbarBlur}
            onClick={openGalleryPicker}
            disabled={uploadingInlineImage}
          >
            {uploadingInlineImage ? 'Galeria...' : 'Galeria'}
          </button>
          <button
            type="button"
            className="rich-editor-button"
            onMouseDown={preventToolbarBlur}
            onClick={openCaptionModalForSelectedMedia}
            disabled={uploadingInlineImage}
          >
            Legenda
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.gif,.svg,image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleInlineImageChange}
        className="hidden"
      />

      <input
        ref={galleryInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.gif,.svg,image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleGalleryChange}
        className="hidden"
      />

      {uploadError ? (
        <div className="px-4 py-3 text-sm text-red-800 bg-red-50 border-b border-red-200">
          {uploadError}
        </div>
      ) : null}

      {uploadingInlineImage ? (
        <div className="px-4 py-3 border-b border-charcoal/10 bg-white/80">
          <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.14em] text-stone font-semibold mb-2">
            <span>Enviando imagens</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-charcoal/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-royal-blue transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {pendingMediaInsertion ? (
        <div className="rich-editor-media-modal-backdrop" role="presentation">
          <div
            className="rich-editor-media-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rich-editor-media-modal-title"
          >
            <div>
              <p className="rich-editor-toolbar-label mb-2">
                {pendingMediaInsertion.mode === 'edit'
                  ? 'Editar legenda'
                  : pendingMediaInsertion.type === 'gallery'
                    ? 'Legenda da galeria'
                    : 'Legenda da imagem'}
              </p>
              <h3 id="rich-editor-media-modal-title" className="font-display text-2xl font-bold text-charcoal mb-2">
                Crédito da foto no conteúdo
              </h3>
              <p className="text-sm text-stone leading-relaxed">
                Este crédito fica preso na imagem ou galeria inserida no meio da matéria.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="rich-editor-media-caption" className="block text-sm font-medium text-charcoal mb-2">
                  Legenda
                </label>
                <input
                  id="rich-editor-media-caption"
                  type="text"
                  value={mediaCaption}
                  onChange={(event) => setMediaCaption(event.target.value)}
                  placeholder="Ex.: Hospital Femina"
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                />
              </div>

              <div>
                <label htmlFor="rich-editor-media-credit" className="block text-sm font-medium text-charcoal mb-2">
                  Crédito / autor da foto
                </label>
                <input
                  id="rich-editor-media-credit"
                  type="text"
                  value={mediaCredit}
                  onChange={(event) => setMediaCredit(event.target.value)}
                  placeholder="Ex.: Foto: Josmar Leite/RBS TV"
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={cancelUploadedMediaInsertion}
                className="px-5 py-3 rounded-full border border-charcoal/12 text-sm font-semibold text-charcoal hover:bg-charcoal/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => insertUploadedMedia({ skipCaption: true })}
                className="px-5 py-3 rounded-full border border-charcoal/12 text-sm font-semibold text-charcoal hover:bg-charcoal/5 transition-colors"
              >
                {pendingMediaInsertion.mode === 'edit' ? 'Remover legenda' : 'Inserir sem legenda'}
              </button>
              <button
                type="button"
                onClick={() => insertUploadedMedia()}
                className="px-5 py-3 rounded-full bg-charcoal text-white text-sm font-semibold hover:bg-charcoal-light transition-colors"
              >
                {pendingMediaInsertion.mode === 'edit'
                  ? 'Salvar legenda'
                  : pendingMediaInsertion.type === 'gallery'
                    ? 'Inserir galeria'
                    : 'Inserir imagem'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rich-editor-surface">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="rich-editor-content article-rich-content"
          data-placeholder={placeholder}
          style={{ minHeight }}
          onBeforeInput={handleBeforeInput}
          onKeyDown={handleEditorKeyDown}
          onPaste={handlePaste}
          onInput={handleInput}
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
          onMouseUp={() => saveSelection(editorRef.current, selectionRef)}
          onKeyUp={() => saveSelection(editorRef.current, selectionRef)}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
