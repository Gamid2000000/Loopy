package com.loopy.service.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BulkCardActionRequest {
    @NotNull
    @Size(min = 1, max = 100)
    private List<@NotNull @Positive Long> cardIds;
}
