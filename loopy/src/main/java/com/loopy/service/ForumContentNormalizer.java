package com.loopy.service;

import org.springframework.stereotype.Component;

@Component
public class ForumContentNormalizer {

    public String normalizeTitle(String value) {
        return value == null ? null : value.trim();
    }

    public String normalizeContent(String value) {
        return value == null ? null : value.replace("\r\n", "\n").replace('\r', '\n').trim();
    }

    public boolean containsHtmlTag(String value) {
        return value != null && value.matches("(?s).*<\\s*/?\\s*[a-zA-Z][^>]*>.*");
    }
}
