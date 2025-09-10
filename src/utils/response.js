class ApiResponse {
  static success(data, message = 'Success', statusCode = 200) {
    return {
      success: true,
      statusCode,
      message,
      data
    };
  }

  static error(message = 'Error', statusCode = 500, errors = null) {
    return {
      success: false,
      statusCode,
      message,
      errors
    };
  }

  static notFound(message = 'Resource not found') {
    return {
      success: false,
      statusCode: 404,
      message
    };
  }

  static unauthorized(message = 'Unauthorized') {
    return {
      success: false,
      statusCode: 401,
      message
    };
  }

  static validationError(errors) {
    return {
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      errors
    };
  }
}

module.exports = ApiResponse;