package com.loopy.repository;

import com.loopy.model.enumeration.CardStatus;

public interface CardDuplicateKeyProjection {
	Long getId();
	String getFront();
	String getBack();
	CardStatus getStatus();
}
