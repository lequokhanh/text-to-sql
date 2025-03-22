package com.slm.slmbackend.controller;

import com.slm.slmbackend.dto.auth.UserAccountDTO;
import com.slm.slmbackend.entity.UserAccount;
import com.slm.slmbackend.response.ResponseWrapper;
import com.slm.slmbackend.util.MapperUtil;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @GetMapping("/me")
    public ResponseWrapper<UserAccountDTO> getMe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        UserAccount userAccount = (UserAccount) authentication.getPrincipal();

        return ResponseWrapper.success(MapperUtil.mapObject(userAccount, UserAccountDTO.class));
    }

}
