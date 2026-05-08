/**
 * MediaService.js
 * Service de gestion des médias (images, uploads, etc.)
 */

class MediaService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.uploadQueue = [];
  }

  async uploadFile(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        await this.eventBus.emit('media:uploaded', { url: data.url });
        return data;
      }

      throw new Error('Upload failed');
    } catch (error) {
      console.error('[MediaService] Erreur upload:', error);
      await this.eventBus.emit('media:upload_failed', { error: error.message });
      throw error;
    }
  }

  getMediaUrl(mediaId) {
    return `/api/v1/media/${mediaId}`;
  }
}

module.exports = MediaService;
