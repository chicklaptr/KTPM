package com.bluemoon.bluemoon.controller;

import com.bluemoon.bluemoon.entity.Household;
import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.exception.UnauthorizedException;
import com.bluemoon.bluemoon.service.HouseholdService;
import com.bluemoon.bluemoon.service.ResidentService;
import com.bluemoon.bluemoon.session.SessionGuard;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/households")
public class HouseholdController {

    private final HouseholdService householdService;
    private final ResidentService residentService;
    public HouseholdController(HouseholdService householdService, ResidentService residentService) {
        this.householdService = householdService;
        this.residentService = residentService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> myHousehold(HttpSession session) {
        Long residentId = (Long) session.getAttribute("residentId");
        if (residentId == null) {
            throw new UnauthorizedException("Not logged in");
        }

        Resident r = residentService.getById(residentId);
        
        if (r.getHousehold() == null) {
            throw new ResourceNotFoundException("Resident does not have a household");
        }
      
        Long householdId = r.getHousehold().getId();
        Household household = householdService.getById(householdId);

        return ResponseEntity.ok(household);
    }

    @PostMapping
    public ResponseEntity<Household> create(@Valid @RequestBody Household household,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdService.create(household));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Household> update( @PathVariable Long id,
    		@Valid @RequestBody Household household,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdService.update(id, household));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        householdService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Household> getById(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<Household>> getAll(HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Household>> getActive(HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdService.getActive());
    }

    @GetMapping("/by-apartment")
    public ResponseEntity<List<Household>> getByApartment(@RequestParam String apartmentNumber,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(householdService.getByApartment(apartmentNumber));
    }
}
