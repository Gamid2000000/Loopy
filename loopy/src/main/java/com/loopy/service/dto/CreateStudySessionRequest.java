package com.loopy.service.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class CreateStudySessionRequest { @NotNull private Long deckId; }
