package com.loopy.service;

import java.util.Optional;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.loopy.exception.CardNotFoundException;
import com.loopy.exception.CardReviewStateNotFoundException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.Card;
import com.loopy.model.CardReviewState;
import com.loopy.model.User;
import com.loopy.repository.CardRepository;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.service.dto.CreateCardReviewStateDto;

@Service
@RequiredArgsConstructor
public class CardReviewStateService {

    private final CardReviewStateRepository cardReviewStateRepository;
    private final UserService userService;
    private final CardRepository cardRepository;

    public Optional<CardReviewState> get(Long id) {
        return cardReviewStateRepository.findById(id);
    }

    public CardReviewState getWithThrow(Long id) {
        return cardReviewStateRepository.findById(id)
            .orElseThrow(() ->
                new CardReviewStateNotFoundException(HttpResponseMessage.HTTP_CARD_STATE_NOT_FOUND.getMessage()));
    }

    public CardReviewState create(CreateCardReviewStateDto dto) {
        return cardReviewStateRepository.save(toEntity(dto));
    }

    private CardReviewState toEntity(CreateCardReviewStateDto dto) {
        User user = userService.getWithException(dto.getUserId());
        Card card = cardRepository.findById(dto.getCardId())
            .orElseThrow(() -> new CardNotFoundException(HttpResponseMessage.HTTP_CARD_NOT_FOUND.getMessage()));

        return CardReviewState.builder()
            .user(user)
            .card(card)
            .easinessFactor(dto.getEasinessFactor())
            .intervalDays(dto.getIntervalDays())
            .consecutiveCorrectCount(dto.getConsecutiveCorrectCount())
            .dueAt(dto.getDueAt())
            .build();
    }
}
