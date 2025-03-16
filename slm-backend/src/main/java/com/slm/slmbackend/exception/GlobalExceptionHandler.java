package com.slm.slmbackend.exception;

import com.slm.slmbackend.response.ResponseWrapper;
import org.springframework.data.crossstore.ChangeSetPersister;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(Exception.class)
    public ResponseWrapper<?> handleUnwantedException(Exception e) {
        return new ResponseWrapper<>()
                .setCode(500)
                .setMessage(e.getMessage());
    }

    @ExceptionHandler(AppException.class)
    public ResponseWrapper<?> handleAppException(AppException e) {
        return new ResponseWrapper<>()
                .setCode(e.getCode())
                .setMessage(e.getMessage());
    }

    @ExceptionHandler(ChangeSetPersister.NotFoundException.class)
    public ResponseWrapper<?> handleNotFoundException(ChangeSetPersister.NotFoundException e) {
        return new ResponseWrapper<>()
                .setCode(404)
                .setMessage(e.getMessage());
    }
}