/**
 * Logging System
 * يسجل الأخطاء والعمليات المهمة
 */

const fs = require('fs');
const path = require('path');

// إنشاء مجلد logs إذا لم يكن موجوداً
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  /**
   * تسجيل رسالة
   * @param {string} level - مستوى السجل (ERROR, INFO, WARN)
   * @param {string} message - الرسالة
   * @param {any} data - بيانات إضافية
   */
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    const fullMessage = data ? `${logMessage} ${JSON.stringify(data, null, 2)}` : logMessage;
    
    // طباعة في Console
    console.log(fullMessage);
    
    // حفظ في ملف
    const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
    const logLine = `${fullMessage}\n`;
    
    try {
      fs.appendFileSync(logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  /**
   * تسجيل خطأ
   */
  static error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      ...error
    } : null;
    this.log('ERROR', message, errorData);
  }

  /**
   * تسجيل معلومات
   */
  static info(message, data = null) {
    this.log('INFO', message, data);
  }

  /**
   * تسجيل تحذير
   */
  static warn(message, data = null) {
    this.log('WARN', message, data);
  }

  /**
   * تسجيل عملية حساسة (مثل تسجيل الدخول، الدفع، إلخ)
   */
  static audit(action, userId, details = null) {
    this.log('AUDIT', `Action: ${action}, User: ${userId}`, details);
  }
}

module.exports = Logger;



