package com.loopy.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.dto.CreateForumPostRequest;
import com.loopy.service.dto.CreateForumTopicRequest;
import com.loopy.service.dto.CreatedForumPostResponse;
import com.loopy.service.dto.CreatedForumTopicResponse;
import com.loopy.service.dto.DeletedForumPostResponse;
import com.loopy.service.dto.ForumCategoryResponse;
import com.loopy.service.dto.ForumTopicResponse;
import com.loopy.service.dto.ForumTopicSummaryResponse;
import com.loopy.service.dto.UpdateForumPostRequest;
import com.loopy.service.dto.UpdateForumTopicRequest;
import com.loopy.service.dto.UpdatedForumPostResponse;
import com.loopy.service.dto.UpdatedForumTopicResponse;
import com.loopy.service.ForumService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/forum")
@Validated
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;

    @GetMapping("/categories")
    public List<ForumCategoryResponse> categories() {
        return forumService.getCategories();
    }

    @GetMapping("/categories/{categorySlug}/topics")
    public Page<ForumTopicSummaryResponse> topics(@PathVariable String categorySlug,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size) {
        return forumService.getTopics(categorySlug, page, size);
    }

    @GetMapping("/topics/{topicId}")
    public ForumTopicResponse topic(@PathVariable Long topicId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return forumService.getTopic(topicId, page, size);
    }

    @PostMapping("/categories/{categorySlug}/topics")
    public ResponseEntity<CreatedForumTopicResponse> createTopic(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable String categorySlug,
            @Valid @RequestBody CreateForumTopicRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(forumService.createTopic(principal, categorySlug, request));
    }

    @PostMapping("/topics/{topicId}/posts")
    public ResponseEntity<CreatedForumPostResponse> createPost(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable Long topicId,
            @Valid @RequestBody CreateForumPostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(forumService.createPost(principal, topicId, request));
    }

    @PatchMapping("/topics/{topicId}")
    public ResponseEntity<UpdatedForumTopicResponse> updateTopic(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable Long topicId,
            @Valid @RequestBody UpdateForumTopicRequest request) {
        return ResponseEntity.ok(forumService.updateTopic(principal, topicId, request));
    }

    @PatchMapping("/posts/{postId}")
    public ResponseEntity<UpdatedForumPostResponse> updatePost(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable Long postId,
            @Valid @RequestBody UpdateForumPostRequest request) {
        return ResponseEntity.ok(forumService.updatePost(principal, postId, request));
    }

    @DeleteMapping("/topics/{topicId}")
    public ResponseEntity<Void> deleteTopic(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable Long topicId,
            @RequestParam @NotNull Long version) {
        forumService.deleteTopic(principal, topicId, version);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<DeletedForumPostResponse> deletePost(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable Long postId,
            @RequestParam @NotNull Long version) {
        return ResponseEntity.ok(forumService.deletePost(principal, postId, version));
    }
}
