package com.loopy.service.dto;

import com.loopy.model.enumeration.StudyCardType;
import lombok.*;

@Data @AllArgsConstructor
public class CurrentStudyCardResponse {
    private Long sessionId; private Long sessionCardId; private Long cardId; private int position; private int total;
    private StudyCardType type; private String front; private String back; private String example; private String note;
}
