package com.bluemoon.bluemoon.controller;

import com.bluemoon.bluemoon.entity.HouseholdFee;
import com.bluemoon.bluemoon.entity.Payment;
import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.exception.UnauthorizedException;
import com.bluemoon.bluemoon.service.HouseholdFeeService;
import com.bluemoon.bluemoon.service.HouseholdService;
import com.bluemoon.bluemoon.service.PaymentService;
import com.bluemoon.bluemoon.service.ResidentService;
import com.bluemoon.bluemoon.session.SessionGuard;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final ResidentService residentService;
    private final HouseholdFeeService householdFeeService;
    public PaymentController(PaymentService paymentService, ResidentService residentService, HouseholdFeeService householdFeeService) {
        this.paymentService = paymentService;
        this.residentService = residentService;
        this.householdFeeService = householdFeeService;
    }

    @GetMapping("/me")
    public ResponseEntity<List<Payment>> myPayments(HttpSession session) {
        Long residentId = (Long) session.getAttribute("residentId");
        if (residentId == null) throw new UnauthorizedException("Not logged in ");

        Long householdId = residentService.getById(residentId).getHousehold().getId();
        return ResponseEntity.ok(paymentService.getByHouseholdId(householdId)); // trả [] nếu không có
    }
    
    @PostMapping
    public ResponseEntity<Payment> create(@Valid @RequestBody Payment payment,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(paymentService.create(payment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        paymentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getById(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(paymentService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getAll(HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(paymentService.getAll());
    }
}
