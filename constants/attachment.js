/**
 * Attachment Constants
 * Centralized mapping for polymorphic attachments, storage paths, allowed MIME types, and file limits.
 */

const ATTACHMENT_FOR = Object.freeze({
  USER: Object.freeze({
    PROFILE: 1,
  }),
});

const ATTACHABLE_TYPE = Object.freeze({
  USER: 'User',
});

// List of attachment_for types that can be accessed publicly without authentication
const PUBLIC_ATTACHMENT_TYPES = Object.freeze([1, 2, 3, 4, 5, 8]);

// Storage destination locations
const DEFAULT_DESTINATION = 'storage/app/upload';
const ATTACHMENT_DESTINATIONS = Object.freeze({
  DEFAULT: 'storage/app/upload',
  PROFILES: 'storage/app/profiles',
});

// Allowed MIME types for uploads
const ALLOWED_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

module.exports = {
  ATTACHMENT_FOR,
  ATTACHABLE_TYPE,
  PUBLIC_ATTACHMENT_TYPES,
  DEFAULT_DESTINATION,
  ATTACHMENT_DESTINATIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
