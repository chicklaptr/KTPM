package com.bluemoon.bluemoon.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;


@RestControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<ApiError> handleResourceNotFoundException(ResourceNotFoundException ex){
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(404, ex.getMessage()));
	}
	@ExceptionHandler(BadRequestException.class)
	public ResponseEntity<ApiError> handleBadRequestException(BadRequestException ex){
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(400, ex.getMessage()));
	}
	
	@ExceptionHandler(ConflictException.class)
	public ResponseEntity<ApiError> handleConflictException(ConflictException ex){
		return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(409, ex.getMessage()));
	}
	
	@ExceptionHandler(UnauthorizedException.class)
	public ResponseEntity<ApiError> handleUnauthorized(UnauthorizedException ex) {
		ApiError err = new ApiError(401, ex.getMessage());	
	    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
	}
	
	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiError> handleDataIntegrityViolationException(DataIntegrityViolationException ex){
		String message = "Dữ liệu không hợp lệ";
		if (ex.getMessage() != null) {
			if (ex.getMessage().contains("username") || ex.getMessage().contains("ukgex1lmaqpg0ir5g1f5eftyaa1")) {
				message = "Username đã tồn tại. Vui lòng chọn username khác.";
			} else if (ex.getMessage().contains("resident_id") || ex.getMessage().contains("ukjxtwetrowtd365oi8hnb1dyud")) {
				message = "Cư dân này đã có tài khoản.";
			}
		}
		return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(409, message));
	}
	
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleGenericException(Exception ex){
		ex.printStackTrace(); // Log for debugging
		String message = "An unexpected error occurred";
		if (ex.getMessage() != null) {
			message = ex.getMessage();
			// Check for common database errors
			if (message.contains("ConstraintViolationException") || message.contains("DataIntegrityViolationException")) {
				if (message.contains("username") || message.contains("ukgex1lmaqpg0ir5g1f5eftyaa1")) {
					message = "Username đã tồn tại. Vui lòng chọn username khác.";
				} else if (message.contains("resident_id") || message.contains("ukjxtwetrowtd365oi8hnb1dyud")) {
					message = "Cư dân này đã có tài khoản.";
				} else {
					message = "Dữ liệu không hợp lệ: " + message;
				}
			}
		}
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiError(500, message));
	}
	
	
}
