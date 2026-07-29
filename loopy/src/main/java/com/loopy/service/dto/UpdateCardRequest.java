package com.loopy.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Getter;

@Getter
public class UpdateCardRequest {
	private String front;
	private String back;
	private String example;
	private String note;
	@JsonIgnore
	private boolean frontPresent;
	@JsonIgnore
	private boolean backPresent;
	@JsonIgnore
	private boolean examplePresent;
	@JsonIgnore
	private boolean notePresent;

	@JsonSetter("front")
	public void setFront(String value) {
		front = value;
		frontPresent = true;
	}

	@JsonSetter("back")
	public void setBack(String value) {
		back = value;
		backPresent = true;
	}

	@JsonSetter("example")
	public void setExample(String value) {
		example = value;
		examplePresent = true;
	}

	@JsonSetter("note")
	public void setNote(String value) {
		note = value;
		notePresent = true;
	}

	public boolean hasChanges() {
		return frontPresent || backPresent || examplePresent || notePresent;
	}
}
