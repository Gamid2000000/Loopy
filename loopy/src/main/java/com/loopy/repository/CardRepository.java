package com.loopy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.loopy.model.Card;

public interface CardRepository extends JpaRepository<Card, Long> {
	
}
