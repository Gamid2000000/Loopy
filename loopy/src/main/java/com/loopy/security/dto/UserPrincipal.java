package com.loopy.security.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.security.Principal;

@AllArgsConstructor
@Getter
public class UserPrincipal implements Principal {

    private final String email;
    private final String token;

    @Override
    public String getName() {
        return email;
    }
}
