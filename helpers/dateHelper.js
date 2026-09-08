/**
 * Centralized Date & Timezone Helper
 * Standardizes UTC processing and localized application formatting.
 */

class DateHelper {
  /**
   * Get the configured application display timezone
   * @returns {string}
   */
  static getAppTimezone() {
    return process.env.APP_TIMEZONE || 'Asia/Kolkata';
  }

  /**
   * Convert any date, string, or timestamp to standard ISO 8601 UTC string (YYYY-MM-DDTHH:mm:ss.sssZ)
   * @param {Date|string|number} [date=new Date()]
   * @returns {string}
   */
  static toUTCISO(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date provided to DateHelper.toUTCISO');
    }
    return d.toISOString();
  }

  /**
   * Format a date into human-readable string in application timezone (e.g. for emails, reports)
   * @param {Date|string|number} date
   * @param {Intl.DateTimeFormatOptions} [options]
   * @param {string} [timeZone]
   * @returns {string}
   */
  static formatAppDate(date, options = {}, timeZone = this.getAppTimezone()) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date provided to DateHelper.formatAppDate');
    }

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      timeZone
    };

    return new Intl.DateTimeFormat('en-US', mergedOptions).format(d);
  }

  /**
   * Add specified number of minutes to a date (UTC safe)
   * @param {Date|string|number} date
   * @param {number} minutes
   * @returns {Date}
   */
  static addMinutes(date, minutes) {
    const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date provided to DateHelper.addMinutes');
    }
    return new Date(d.getTime() + minutes * 60 * 1000);
  }

  /**
   * Add specified number of hours to a date (UTC safe)
   * @param {Date|string|number} date
   * @param {number} hours
   * @returns {Date}
   */
  static addHours(date, hours) {
    return this.addMinutes(date, hours * 60);
  }

  /**
   * Add specified number of days to a date (UTC safe)
   * @param {Date|string|number} date
   * @param {number} days
   * @returns {Date}
   */
  static addDays(date, days) {
    return this.addMinutes(date, days * 24 * 60);
  }

  /**
   * Check if a given expiration date is in the past compared to current UTC time
   * @param {Date|string|number} expiryDate
   * @returns {boolean}
   */
  static isExpired(expiryDate) {
    const d = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date provided to DateHelper.isExpired');
    }
    return d.getTime() <= Date.now();
  }
}

module.exports = DateHelper;
