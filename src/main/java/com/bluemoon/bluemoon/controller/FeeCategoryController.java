package com.bluemoon.bluemoon.controller;

import com.bluemoon.bluemoon.entity.FeeCategory;
import com.bluemoon.bluemoon.service.FeeCategoryService;
import com.bluemoon.bluemoon.session.SessionGuard;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fee-categories")
public class FeeCategoryController {

    private final FeeCategoryService feeCategoryService;

    public FeeCategoryController(FeeCategoryService feeCategoryService,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        this.feeCategoryService = feeCategoryService;
    }

    @PostMapping
    public ResponseEntity<FeeCategory> create(@Valid @RequestBody FeeCategory feeCategory,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(feeCategoryService.create(feeCategory));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FeeCategory> update( @PathVariable Long id,
    		@Valid @RequestBody FeeCategory feeCategory,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(feeCategoryService.update(id, feeCategory));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        feeCategoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeeCategory> getById(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(feeCategoryService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<FeeCategory>> getAll(HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(feeCategoryService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<FeeCategory>> getActive(HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(feeCategoryService.getActive());
    }
}
