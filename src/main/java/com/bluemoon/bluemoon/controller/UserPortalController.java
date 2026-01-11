package com.bluemoon.bluemoon.controller;

import com.bluemoon.bluemoon.entity.*;
import com.bluemoon.bluemoon.service.UserPortalService;
import com.bluemoon.bluemoon.session.SessionGuard;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-portal")
public class UserPortalController {

    private final UserPortalService userPortalService;

    public UserPortalController(UserPortalService userPortalService) {
        this.userPortalService = userPortalService;
    }
    
    @GetMapping("/profile")
    public ResponseEntity<Resident> getMyProfile(HttpSession session) {
        SessionGuard.requireUser(session);
        
        Long residentId = (Long) session.getAttribute("residentId");
        return ResponseEntity.ok(userPortalService.getMyProfile(residentId));
    }
    
    @GetMapping("/periods")
    public ResponseEntity<List<BillingPeriod>> getMyPeriods(HttpSession session) {
        SessionGuard.requireUser(session);

        Long residentId = (Long) session.getAttribute("residentId");
        return ResponseEntity.ok(userPortalService.getMyPeriods(residentId));
    }

   
    @GetMapping("/household")
    public ResponseEntity<Household> getMyHousehold(HttpSession session) {
        SessionGuard.requireUser(session);

        Long residentId = (Long) session.getAttribute("residentId");
        return ResponseEntity.ok(userPortalService.getMyHousehold(residentId));
    }
    
    @GetMapping("/fees")
    public ResponseEntity<List<HouseholdFee>> getMyFees(HttpSession session) {
        SessionGuard.requireUser(session);

        Long residentId = (Long) session.getAttribute("residentId");
        return ResponseEntity.ok(userPortalService.getMyFees(residentId));
    }
   
    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getMyPayments(HttpSession session) {
        SessionGuard.requireUser(session);

        Long residentId = (Long) session.getAttribute("residentId");
        return ResponseEntity.ok(userPortalService.getMyPayments(residentId));
    }
    
    @GetMapping("/family")
    public ResponseEntity<List<Resident>> getMyFamily(HttpSession session) {
        SessionGuard.requireUser(session);

        Long residentId = (Long) session.getAttribute("residentId");
        return ResponseEntity.ok(userPortalService.getMyFamily(residentId));
    }
}
