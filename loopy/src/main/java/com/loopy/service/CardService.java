package com.loopy.service;

import java.util.Optional;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.loopy.exception.CardNotFoundException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.Card;
import com.loopy.repository.CardRepository;
import com.loopy.service.dto.CreateCardDto;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;

    public Optional<Card> get(Long id) {
        return cardRepository.findById(id);
    }

    public Card getWithThrow(Long id) {
        return cardRepository.findById(id)
            .orElseThrow(() -> new CardNotFoundException(HttpResponseMessage.HTTP_CARD_NOT_FOUND.getMessage()));
    }

    public Card create(CreateCardDto dto) {
        return cardRepository.save(cardWrapper(dto));
    }

    private Card cardWrapper(CreateCardDto dto) {
        return Card.builder()
            .front(dto.getFront())
            .back(dto.getBack())
            .build();
    }
}
