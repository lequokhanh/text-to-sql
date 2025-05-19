package com.slm.slmbackend.exception;

import com.slm.slmbackend.enums.ResponseEnum;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppException extends RuntimeException {

    private int code;

    public AppException(int statusCode,String message) {
        super(message);
        this.code = statusCode;
    }

    public AppException(ResponseEnum responseEnum) {
        super(responseEnum.getMessage());
        this.code = responseEnum.getCode();
    }

    public AppException(ResponseEnum responseEnum, String message) {
        super(message);
        this.code = responseEnum.getCode();
    }
}