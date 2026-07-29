package com.loopy.controller;

import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.StudySessionService;
import com.loopy.service.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController @RequestMapping("/study-sessions") @RequiredArgsConstructor
public class StudySessionController {
    private final StudySessionService service;
    @PostMapping public ResponseEntity<StudySessionResponse> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateStudySessionRequest request) { return ResponseEntity.status(HttpStatus.CREATED).body(service.create(principal, request)); }
    @GetMapping("/{sessionId}") public StudySessionResponse get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long sessionId) { return service.getById(principal, sessionId); }
    @GetMapping("/active") public StudySessionResponse active(@AuthenticationPrincipal UserPrincipal principal, @RequestParam Long deckId) { return service.getActive(principal, deckId); }
    @GetMapping("/{sessionId}/current-card") public CurrentStudyCardResponse current(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long sessionId) { return service.getCurrentCard(principal, sessionId); }
    @PostMapping("/{sessionId}/cancel") public ResponseEntity<Void> cancel(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long sessionId) { service.cancel(principal, sessionId); return ResponseEntity.noContent().build(); }
}
