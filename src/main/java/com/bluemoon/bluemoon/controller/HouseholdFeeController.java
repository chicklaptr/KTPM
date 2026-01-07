package com.bluemoon.bluemoon.controller;

import com.bluemoon.bluemoon.entity.HouseholdFee;
import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.service.HouseholdFeeService;
import com.bluemoon.bluemoon.service.ResidentService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/household-fees")
public class HouseholdFeeController {

    private final HouseholdFeeService householdFeeService;
    private final com.bluemoon.bluemoon.service.ResidentService residentService;
    public HouseholdFeeController(HouseholdFeeService householdFeeService, ResidentService residentService) {
        this.householdFeeService = householdFeeService;
        this.residentService = residentService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> myHouseholdFees(HttpSession session) {
        Long residentId = (Long) session.getAttribute("residentId");
        if (residentId == null) return ResponseEntity.status(401).body("Not logged in");

        Resident r = residentService.getById(residentId);
        Long householdId = r.getHousehold().getId(); 

        
        return ResponseEntity.ok(householdFeeService.getByHouseholdId(householdId));
    }
    
    @PostMapping
    public ResponseEntity<HouseholdFee> create(@Valid @RequestBody HouseholdFee fee) {
        return ResponseEntity.ok(householdFeeService.create(fee));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HouseholdFee> update(@Valid @PathVariable Long id,
                                               @RequestBody HouseholdFee fee) {
        return ResponseEntity.ok(householdFeeService.update(id, fee));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        householdFeeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HouseholdFee> getById(@PathVariable Long id) {
        return ResponseEntity.ok(householdFeeService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<HouseholdFee>> getAll() {
        return ResponseEntity.ok(householdFeeService.getAll());
    }

    @GetMapping("/by-period/{periodId}")
    public ResponseEntity<List<HouseholdFee>> getByPeriod(@PathVariable Long periodId) {
        try {
            List<HouseholdFee> fees = householdFeeService.getByPeriodId(periodId);
            return ResponseEntity.ok(fees);
        } catch (com.bluemoon.bluemoon.exception.ResourceNotFoundException e) {
            // Return empty list if period not found
            return ResponseEntity.ok(java.util.Collections.emptyList());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Collections.emptyList());
        }
    }
}
