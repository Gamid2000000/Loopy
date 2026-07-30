package com.loopy.service.dto;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.loopy.model.enumeration.DeckStatus;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DeckSummaryResponse {

	private Long id;
	private String name;
	private String description;
	@JsonProperty("isPublic")
	private boolean isPublic;
	private DeckStatus status;
	private Instant createdAt;
	private Instant updatedAt;

	@JsonIgnore
	public boolean isPublic() {
		return this.isPublic;
	}
}
