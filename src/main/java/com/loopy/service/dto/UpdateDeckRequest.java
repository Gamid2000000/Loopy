package com.loopy.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Getter;

@Getter
public class UpdateDeckRequest {
	private String name;
	private String description;
	private Boolean isPublic;

	@JsonIgnore
	private boolean namePresent;
	@JsonIgnore
	private boolean descriptionPresent;
	@JsonIgnore
	private boolean publicPresent;

	@JsonSetter("name")
	public void setName(String name) {
		this.name = name;
		this.namePresent = true;
	}

	@JsonSetter("description")
	public void setDescription(String description) {
		this.description = description;
		this.descriptionPresent = true;
	}

	@JsonSetter("isPublic")
	public void setPublic(Boolean isPublic) {
		this.isPublic = isPublic;
		this.publicPresent = true;
	}

	public boolean hasChanges() {
		return namePresent || descriptionPresent || publicPresent;
	}
}
