package com.loopy.service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileRequest {

    @Pattern(regexp = ".*\\S.*", message = "must not be blank")
    @Size(max = 100)
    private String displayName;

    @Pattern(regexp = "[A-Za-z]{2,3}([_-][A-Za-z]{2,4})?", message = "invalid language")
    private String nativeLanguage;

    @Pattern(regexp = "[A-Za-z]{2,3}([_-][A-Za-z]{2,4})?", message = "invalid language")
    private String learningLanguage;

    @Size(min = 1, max = 100)
    private String timezone;

    @Min(0) @Max(1000)
    private Integer dailyNewCardsLimit;

    @Min(1) @Max(10000)
    private Integer dailyReviewLimit;
}
