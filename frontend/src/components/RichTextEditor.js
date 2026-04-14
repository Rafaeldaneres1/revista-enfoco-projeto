import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl, normalizeUploadedImageUrl, resolveAssetUrl } from '../lib/api';
import {
  normalizeRichTextForEditor,
  normalizeRichTextForStorage
} from '../lib/richText';

const BLOCK_SELECTOR = 'p, h1, h2, h3, ul, ol, li, figure';
const SIMPLE_BLOCK_SELECTOR = 'p, h1, h2, h3';
const DEFAULT_FONT_SIZE = '18';
const DEFAULT_PARAGRAPH_SPACING = '20';
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

const TEXT_SIZES = [
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

const createInlineImageElement = (imageUrl) => {
  const image = document.createElement('img');
  image.setAttribute('src', resolveAssetUrl(imageUrl) || imageUrl);
  image.setAttribute('data-src', imageUrl);
  image.setAttribute('alt', '');
  return image;
};

const createInlineImageParagraph = (imageUrl) => {
  const paragraph = document.createElement('p');
  paragraph.appendChild(createInlineImageElement(imageUrl));
  return paragraph;
};

const createGalleryFigure = (imageUrls) => {
  const figure = document.createElement('figure');
  figure.setAttribute('data-gallery', 'true');

  imageUrls.forEach((imageUrl) => {
    figure.appendChild(createInlineImageElement(imageUrl));
  });

  return figure;
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

const replaceSimpleBlockSelectionWithImage = (block, range, imageUrl) => {
  return insertNodesIntoSimpleBlock(block, range, [createInlineImageParagraph(imageUrl)]);
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

const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Escreva a materia...',
  minHeight = 360,
  token
}) => {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const syncingRef = useRef(false);
  const focusedRef = useRef(false);
  const toolbarInteractionRef = useRef(false);

  const [blockType, setBlockType] = useState('p');
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [paragraphSpacing, setParagraphSpacing] = useState(DEFAULT_PARAGRAPH_SPACING);
  const [uploadError, setUploadError] = useState('');
  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const syncToolbarWithBlock = (block) => {
    if (!block) {
      return;
    }

    const tagName = block.tagName.toLowerCase();
    setBlockType(['p', 'h1', 'h2', 'h3'].includes(tagName) ? tagName : 'p');
    setFontSize(block.style.fontSize?.replace('px', '') || DEFAULT_FONT_SIZE);
    setParagraphSpacing(block.style.marginBottom?.replace('px', '') || DEFAULT_PARAGRAPH_SPACING);
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
      syncToolbarWithBlock(getCurrentBlock(editor, range.startContainer));
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
    toolbarInteractionRef.current = false;
    focusEditor(editor);

    const range = getSafeRange(editor, selectionRef);
    if (!range) {
      return;
    }

    const nextRange = callback({ editor, range: range.cloneRange() });
    handleInput();

    const selectionTarget = nextRange && isRangeInsideEditor(editor, nextRange) ? nextRange : getRangeInsideEditor(editor);
    if (selectionTarget) {
      selectionRef.current = selectionTarget.cloneRange();
      setSelectionRange(selectionTarget);
      syncToolbarWithBlock(getCurrentBlock(editor, selectionTarget.startContainer));
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
    const href = window.prompt('Cole o link da materia ou referencia:', 'https://');
    if (!href) {
      return;
    }

    runMutation(() => {
      const selection = getCurrentSelection();
      const selectedText = selection?.toString().trim();

      if (selection?.isCollapsed) {
        document.execCommand(
          'insertHTML',
          false,
          `<a href="${href}">${href}</a>`
        );
        return getRangeInsideEditor(editorRef.current);
      }

      document.execCommand('createLink', false, href);

      if (!selectedText) {
        document.execCommand(
          'insertHTML',
          false,
          `<a href="${href}">${href}</a>`
        );
      }

      return getRangeInsideEditor(editorRef.current);
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

  const handleFontSizeChange = (event) => {
    const nextSize = event.target.value;
    setFontSize(nextSize);
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

  const handleEditorFocus = () => {
    const editor = editorRef.current;
    if (!editor) return;

    focusedRef.current = true;
    ensureParagraphScaffold(editor, selectionRef);
    saveSelection(editor, selectionRef);
    syncToolbarWithBlock(getCurrentBlock(editor));
  };

  const handleEditorBlur = () => {
    focusedRef.current = false;

    if (toolbarInteractionRef.current) {
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
    const range = getSafeRange(editor, selectionRef);
    if (range) {
      selectionRef.current = range.cloneRange();
    } else {
      saveSelection(editor, selectionRef);
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
    const range = getSafeRange(editor, selectionRef);
    if (range) {
      selectionRef.current = range.cloneRange();
    } else {
      saveSelection(editor, selectionRef);
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

  const handleInlineImageChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    setUploadError('');
    setUploadProgress(0);

    const validationError = validateInlineFiles(files);
    if (validationError) {
      setUploadError(validationError);
      event.target.value = '';
      return;
    }

    setUploadingInlineImage(true);

    try {
      const imageUrls = await uploadInlineImages(files);

      runMutation(({ editor, range }) => {
        const startBlock = getCurrentBlock(editor, range.startContainer);
        const endBlock = getCurrentBlock(editor, range.endContainer);
        const insertedNodes = imageUrls.map((imageUrl) => createInlineImageParagraph(imageUrl));

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
    } catch (uploadError) {
      console.error('Error uploading inline image:', uploadError);
      if (uploadError.code === 'ECONNABORTED') {
        setUploadError('O envio da imagem demorou demais. Tente novamente com uma imagem menor.');
      } else {
        setUploadError(
          uploadError?.response?.data?.detail || 'Nao foi possivel inserir a imagem no conteudo.'
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
      return;
    }

    setUploadError('');
    setUploadProgress(0);

    const validationError = validateInlineFiles(files);
    if (validationError) {
      setUploadError(validationError);
      event.target.value = '';
      return;
    }

    setUploadingInlineImage(true);

    try {
      const imageUrls = await uploadInlineImages(files);

      runMutation(({ editor, range }) => {
        const startBlock = getCurrentBlock(editor, range.startContainer);
        const endBlock = getCurrentBlock(editor, range.endContainer);
        const insertedNodes = [createGalleryFigure(imageUrls)];

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
    } catch (uploadError) {
      console.error('Error uploading gallery images:', uploadError);
      if (uploadError.code === 'ECONNABORTED') {
        setUploadError('O envio da galeria demorou demais. Tente novamente ou reduza as imagens.');
      } else {
        setUploadError(
          uploadError?.response?.data?.detail || 'Nao foi possivel inserir a galeria no conteudo.'
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
          <label className="rich-editor-toolbar-label" htmlFor="font-size-select">
            Tamanho
          </label>
          <select
            id="font-size-select"
            value={fontSize}
            onChange={handleFontSizeChange}
            onMouseDown={() => {
              toolbarInteractionRef.current = true;
            }}
            className="rich-editor-select"
          >
            {TEXT_SIZES.map((option) => (
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
            className="rich-editor-button rich-editor-button-bold"
            onMouseDown={preventToolbarBlur}
            onClick={() => applyInlineCommand('bold')}
          >
            B
          </button>
          <button
            type="button"
            className="rich-editor-button rich-editor-button-italic"
            onMouseDown={preventToolbarBlur}
            onClick={() => applyInlineCommand('italic')}
          >
            I
          </button>
          <button
            type="button"
            className="rich-editor-button rich-editor-button-underline"
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

      <div className="rich-editor-surface">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="rich-editor-content article-rich-content"
          data-placeholder={placeholder}
          style={{ minHeight }}
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

