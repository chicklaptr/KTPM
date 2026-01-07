package com.bluemoon.bluemoon.controller;

import com.bluemoon.bluemoon.entity.FeeCategory;
import com.bluemoon.bluemoon.service.FeeCategoryService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fee-categories")
public class FeeCategoryController {

    private final FeeCategoryService feeCategoryService;

    public FeeCategoryController(FeeCategoryService feeCategoryService) {
        this.feeCategoryService = feeCategoryService;
    }

    @PostMapping
    public ResponseEntity<FeeCategory> create(@Valid @RequestBody FeeCategory feeCategory) {
        return ResponseEntity.ok(feeCategoryService.create(feeCategory));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FeeCategory> update(@Valid @PathVariable Long id,
                                              @RequestBody FeeCategory feeCategory) {
        return ResponseEntity.ok(feeCategoryService.update(id, feeCategory));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        feeCategoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeeCategory> getById(@PathVariable Long id) {
        return ResponseEntity.ok(feeCategoryService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<FeeCategory>> getAll() {
        return ResponseEntity.ok(feeCategoryService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<FeeCategory>> getActive() {
        return ResponseEntity.ok(feeCategoryService.getActive());
    }
}
