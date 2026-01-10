package com.bluemoon.bluemoon.controller;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.exception.UnauthorizedException;
import com.bluemoon.bluemoon.service.ResidentService;
import com.bluemoon.bluemoon.session.SessionGuard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/residents")
public class ResidentController {

    private final ResidentService residentService;

    public ResidentController(ResidentService residentService) {
        this.residentService = residentService;
    }
    
    @GetMapping("/me")
    public ResponseEntity<Resident> getMe(HttpSession session) {
        Long residentId = (Long) session.getAttribute("residentId");

        if (residentId == null) {
            throw new UnauthorizedException("Not logged in");
        }
        //System.out.println("Resident ID from session: " + residentId);
        return ResponseEntity.ok(residentService.getById(residentId));
    }
    
    @PostMapping
    public ResponseEntity<Resident> create(@Valid @RequestBody Resident resident,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(residentService.create(resident));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resident> update( @PathVariable Long id,
    		@Valid @RequestBody Resident resident,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(residentService.update(id, resident));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        residentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resident> getById(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(residentService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<Resident>> getAll(HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(residentService.getAll());
    }

    @GetMapping("/by-household/{householdId}")
    public ResponseEntity<List<Resident>> getByHousehold(@PathVariable Long householdId,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(residentService.getByHousehold(householdId));
    }

    @GetMapping("/by-status")
    public ResponseEntity<List<Resident>> getByStatus(@RequestParam String status,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(residentService.getByResidenceStatus(status));
    }
}
