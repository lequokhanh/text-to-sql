package com.slm.slmbackend.enums;

public enum ResponseEnum {
    UNAUTHORIZED(401, "Unauthorized"),
    FORBIDDEN(403, "Forbidden"),
    NOT_FOUND(404, "Not Found"),
    INTERNAL_SERVER_ERROR(500, "Internal Server Error"),
    INVALID_USERNAME_OR_PASSWORD(401, "Invalid username or password"),
    USERNAME_ALREADY_EXISTS(400, "Username already exists"),
    TOKEN_EXPIRED(401, "Token expired"),
    TOKEN_INVALID(401, "Token invalid"),
    USER_NOT_FOUND(404, "User not found"),


    SUCCESS(0, "Success"),
    DATA_SOURCE_CONFIGURATION_NOT_FOUND(1, "Data source configuration not found"),
    DATA_SOURCE_NOT_BELONG_TO_USER(2, "Data source does not belong to user"),
    COLUMN_IN_RELATION_NOT_FOUND(3, "Column in relation not found"),
    ;

    private final int code;
    private final String message;

    ResponseEnum(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
