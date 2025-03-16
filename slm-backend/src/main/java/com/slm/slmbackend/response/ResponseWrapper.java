package com.slm.slmbackend.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.slm.slmbackend.enums.ResponseEnum;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

@Getter
@Setter
@Accessors(chain = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResponseWrapper<T> {
    private int code;
    private String message;
    private T data;

    public static ResponseWrapper<Void> toResponse(int code, String message) {
        return new ResponseWrapper<Void>()
                .setCode(code)
                .setMessage(message);
    }

    public static ResponseWrapper<Void> toResponse(ResponseEnum responseEnum) {
        return new ResponseWrapper<Void>()
                .setCode(responseEnum.getCode())
                .setMessage(responseEnum.getMessage());
    }

    public static ResponseWrapper<Void> success() {
        return new ResponseWrapper<Void>()
                .setCode(ResponseEnum.SUCCESS.getCode())
                .setMessage(ResponseEnum.SUCCESS.getMessage());
    }

    public static <T> ResponseWrapper<T> toResponse(T data) {
        return new ResponseWrapper<T>()
                .setCode(ResponseEnum.SUCCESS.getCode())
                .setMessage(ResponseEnum.SUCCESS.getMessage())
                .setData(data);
    }
}
