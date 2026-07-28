package com.loopy.sm2;

import java.util.Map;

public class Main {
	public static void main(String[] args) {
		Item item = Item.builder().build();

		Review review = new Review(item, 3);

		Session session = new Session();
		session.applyReview(review);

		Scheduler scheduler = Scheduler.builder().build();
		scheduler.applySession(session);
		Map<Item, SessionItemStatistics> sessionMap = session.getItemStatistics();
		sessionMap.forEach((card, statistic) -> {
			System.out.println(card.getId());
			System.out.println(statistic.getMostRecentScore());
		});	
	}
}
