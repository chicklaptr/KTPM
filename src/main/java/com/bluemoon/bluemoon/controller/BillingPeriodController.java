package com.bluemoon.bluemoon.controller;

import com.bluemoon.bluemoon.entity.BillingPeriod;
import com.bluemoon.bluemoon.service.BillingPeriodService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing-periods")
public class BillingPeriodController {

    private final BillingPeriodService billingPeriodService;

    public BillingPeriodController(BillingPeriodService billingPeriodService) {
        this.billingPeriodService = billingPeriodService;
    }

    @PostMapping
    public ResponseEntity<BillingPeriod> create(@Valid @RequestBody BillingPeriod period) {
        return ResponseEntity.ok(billingPeriodService.create(period));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BillingPeriod> update(@Valid @PathVariable Long id,
                                                @RequestBody BillingPeriod period) {
        return ResponseEntity.ok(billingPeriodService.update(id, period));	
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        billingPeriodService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BillingPeriod> getById(@PathVariable Long id) {
        return ResponseEntity.ok(billingPeriodService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<BillingPeriod>> getAll() {
        return ResponseEntity.ok(billingPeriodService.getAll());
    }

    @GetMapping("/by-year-month")
    public ResponseEntity<BillingPeriod> getByYearMonth(@RequestParam Integer year,
                                                        @RequestParam Integer month) {
        return ResponseEntity.ok(billingPeriodService.getByYearMonth(year, month));
    }
}
