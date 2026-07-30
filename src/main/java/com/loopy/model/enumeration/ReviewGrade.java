package com.loopy.model.enumeration;

import lombok.Getter;

@Getter
public enum ReviewGrade {

    AGAIN(1),
    HARD(3),
    GOOD(4),
    EASY(5);

    private final int sm2Score;

    ReviewGrade(int sm2Score) {
        this.sm2Score = sm2Score;
    }

    public boolean isSuccessful() {
        return sm2Score >= 3;
    }
}
