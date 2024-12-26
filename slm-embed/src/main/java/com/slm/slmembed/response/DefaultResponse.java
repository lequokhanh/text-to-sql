package com.slm.slmembed.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import org.springframework.http.ResponseEntity;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@Accessors(chain = true)
public class DefaultResponse {
    int statusCode;
    String message;
    Object data;

    public ResponseEntity<DefaultResponse> response() {
        return ResponseEntity.status(statusCode).body(this);
    }
}
