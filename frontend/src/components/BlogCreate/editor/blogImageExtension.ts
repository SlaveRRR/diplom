import Image from '@tiptap/extension-image';

export const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      uploadId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-upload-id'),
        renderHTML: (attributes) => (attributes.uploadId ? { 'data-upload-id': attributes.uploadId } : {}),
      },
      storageKey: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-storage-key'),
        renderHTML: (attributes) => (attributes.storageKey ? { 'data-storage-key': attributes.storageKey } : {}),
      },
    };
  },
});
