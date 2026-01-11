package com.bluemoon.bluemoon.controller;

import com.bluemoon.bluemoon.entity.HouseholdFee;
import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.exception.UnauthorizedException;
import com.bluemoon.bluemoon.service.HouseholdFeeService;
import com.bluemoon.bluemoon.service.ResidentService;
import com.bluemoon.bluemoon.session.SessionGuard;

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

	
	/*
	 * @GetMapping("/me") public ResponseEntity<?> myHouseholdFees(HttpSession
	 * session) { Long residentId = (Long) session.getAttribute("residentId"); if
	 * (residentId == null) throw new UnauthorizedException("Not logged in ");
	 * 
	 * Resident r = residentService.getById(residentId); Long householdId =
	 * r.getHousehold().getId();
	 * 
	 * 
	 * return ResponseEntity.ok(householdFeeService.getByHouseholdId(householdId));
	 * }
	 */
	 
    
    @PostMapping
    public ResponseEntity<HouseholdFee> create(@Valid @RequestBody HouseholdFee fee,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdFeeService.create(fee));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HouseholdFee> update( @PathVariable Long id,
    		@Valid @RequestBody HouseholdFee fee,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdFeeService.update(id, fee));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        householdFeeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HouseholdFee> getById(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdFeeService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<HouseholdFee>> getAll(HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdFeeService.getAll());
    }

    @GetMapping("/by-period/{periodId}")
    public ResponseEntity<List<HouseholdFee>> getByPeriod(@PathVariable Long periodId,
                                                          HttpSession session) {
        SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdFeeService.getByPeriodId(periodId));
    }
    
}

