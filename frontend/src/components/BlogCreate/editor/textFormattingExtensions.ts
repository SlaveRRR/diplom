import { Extension, Mark, mergeAttributes } from '@tiptap/core';

type TextAlignment = 'left' | 'center' | 'right' | 'justify';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlight: {
      toggleHighlight: () => ReturnType;
      unsetHighlight: () => ReturnType;
    };
    textAlign: {
      setTextAlign: (alignment: TextAlignment) => ReturnType;
      unsetTextAlign: () => ReturnType;
    };
  }
}

export const TextAlign = Extension.create({
  name: 'textAlign',

  addGlobalAttributes() {
    return [
      {
        types: ['heading', 'paragraph'],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element) => element.style.textAlign || null,
            renderHTML: (attributes) => {
              if (!attributes.textAlign) {
                return {};
              }

              return {
                style: `text-align: ${attributes.textAlign}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        (alignment) =>
        ({ commands }) =>
          commands.updateAttributes('paragraph', { textAlign: alignment }) ||
          commands.updateAttributes('heading', { textAlign: alignment }),
      unsetTextAlign:
        () =>
        ({ commands }) =>
          commands.updateAttributes('paragraph', { textAlign: null }) ||
          commands.updateAttributes('heading', { textAlign: null }),
    };
  },
});

export const Highlight = Mark.create({
  name: 'highlight',

  parseHTML() {
    return [
      {
        tag: 'mark',
      },
      {
        style: 'background-color',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(HTMLAttributes, {
        style: 'background-color: #fff59d; padding: 0 0.12em; border-radius: 0.2em;',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleHighlight:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      unsetHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
