/**
 * Response Wrapper
 * يوفر طريقة موحدة لإرجاع الاستجابات
 */

class ApiResponse {
  /**
   * إرجاع استجابة نجاح
   */
  static success(res, data = null, message = 'تمت العملية بنجاح', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * إرجاع استجابة خطأ
   */
  static error(res, message = 'حدث خطأ', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      ...(errors && { errors })
    };
    return res.status(statusCode).json(response);
  }

  /**
   * إرجاع استجابة غير مصرح
   */
  static unauthorized(res, message = 'غير مصرح لك بالوصول') {
    return this.error(res, message, 401);
  }

  /**
   * إرجاع استجابة محظور
   */
  static forbidden(res, message = 'ليس لديك صلاحية للوصول') {
    return this.error(res, message, 403);
  }

  /**
   * إرجاع استجابة غير موجود
   */
  static notFound(res, message = 'المورد غير موجود') {
    return this.error(res, message, 404);
  }

  /**
   * إرجاع استجابة تحقق فشل
   */
  static validationError(res, errors, message = 'البيانات المدخلة غير صحيحة') {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  }
}

module.exports = ApiResponse;



