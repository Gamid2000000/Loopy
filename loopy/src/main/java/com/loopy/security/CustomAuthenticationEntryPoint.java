package com.loopy.security;

import tools.jackson.databind.ObjectMapper;
import com.loopy.exception_handler.JsonErrorResponse;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

	private final ObjectMapper objectMapper;

	@Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        JsonErrorResponse errorResponse = new JsonErrorResponse("INVALID_ACCESS_TOKEN",
                HttpResponseMessage.HTTP_INVALID_JWT_RESPONSE_MESSAGE.getMessage(), HttpStatus.UNAUTHORIZED.value());

        String errorJson = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(errorJson);
    }
}
