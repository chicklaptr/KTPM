package com.bluemoon.bluemoon.controller;

import com.bluemoon.bluemoon.entity.Account;
import com.bluemoon.bluemoon.entity.Role;
import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.exception.BadRequestException;
import com.bluemoon.bluemoon.exception.ConflictException;
import com.bluemoon.bluemoon.service.AccountService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<Account> create(@RequestBody Map<String, Object> accountData) {
        try {
            // Validate required fields
            if (accountData.get("username") == null || ((String) accountData.get("username")).trim().isEmpty()) {
                throw new BadRequestException("Username is required");
            }
            if (accountData.get("password") == null || ((String) accountData.get("password")).isEmpty()) {
                throw new BadRequestException("Password is required");
            }
            if (accountData.get("roleId") == null) {
                throw new BadRequestException("Role is required");
            }
            
            Account account = new Account();
            account.setUsername(((String) accountData.get("username")).trim());
            account.setPassword((String) accountData.get("password"));
            
            // Set role (required)
            try {
                Object roleIdObj = accountData.get("roleId");
                Long roleId;
                if (roleIdObj instanceof Number) {
                    roleId = ((Number) roleIdObj).longValue();
                } else if (roleIdObj instanceof String) {
                    roleId = Long.parseLong((String) roleIdObj);
                } else {
                    throw new BadRequestException("Invalid roleId format");
                }
                Role role = new Role();
                role.setId(roleId);
                account.setRole(role);
            } catch (NumberFormatException e) {
                throw new BadRequestException("Invalid roleId: " + accountData.get("roleId"));
            }
            
            // Set resident (optional)
            if (accountData.get("residentId") != null && !accountData.get("residentId").toString().trim().isEmpty()) {
                try {
                    Object residentIdObj = accountData.get("residentId");
                    Long residentId = null;
                    if (residentIdObj instanceof Number) {
                        residentId = ((Number) residentIdObj).longValue();
                    } else if (residentIdObj instanceof String) {
                        residentId = Long.parseLong((String) residentIdObj);
                    }
                    if (residentId != null) {
                        Resident resident = new Resident();
                        resident.setId(residentId);
                        account.setResident(resident);
                    } else {
                        account.setResident(null);
                    }
                } catch (Exception e) {
                    // If residentId is invalid, set to null
                    account.setResident(null);
                }
            } else {
                account.setResident(null);
            }
            
            return ResponseEntity.ok(accountService.create(account));
        } catch (BadRequestException | ConflictException e) {
            throw e; // Re-throw known exceptions
        } catch (Exception e) {
            e.printStackTrace();
            throw new BadRequestException("Error creating account: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Account> update(@PathVariable Long id,
                                         @RequestBody Map<String, Object> accountData) {
        try {
            // Validate required fields
            if (accountData.get("username") == null || ((String) accountData.get("username")).trim().isEmpty()) {
                throw new BadRequestException("Username is required");
            }
            if (accountData.get("roleId") == null) {
                throw new BadRequestException("Role is required");
            }
            
            Account account = new Account();
            account.setUsername(((String) accountData.get("username")).trim());
            
            // Only update password if provided
            if (accountData.get("password") != null && !((String) accountData.get("password")).isEmpty()) {
                account.setPassword((String) accountData.get("password"));
            }
            
            // Set role (required)
            try {
                Object roleIdObj = accountData.get("roleId");
                Long roleId;
                if (roleIdObj instanceof Number) {
                    roleId = ((Number) roleIdObj).longValue();
                } else if (roleIdObj instanceof String) {
                    roleId = Long.parseLong((String) roleIdObj);
                } else {
                    throw new BadRequestException("Invalid roleId format");
                }
                Role role = new Role();
                role.setId(roleId);
                account.setRole(role);
            } catch (NumberFormatException e) {
                throw new BadRequestException("Invalid roleId: " + accountData.get("roleId"));
            }
            
            // Set resident (optional)
            if (accountData.get("residentId") != null && !accountData.get("residentId").toString().trim().isEmpty()) {
                try {
                    Object residentIdObj = accountData.get("residentId");
                    Long residentId;
                    if (residentIdObj instanceof Number) {
                        residentId = ((Number) residentIdObj).longValue();
                    } else if (residentIdObj instanceof String) {
                        residentId = Long.parseLong((String) residentIdObj);
                    } else {
                        residentId = null;
                    }
                    if (residentId != null) {
                        Resident resident = new Resident();
                        resident.setId(residentId);
                        account.setResident(resident);
                    } else {
                        account.setResident(null);
                    }
                } catch (Exception e) {
                    // If residentId is invalid, set to null
                    account.setResident(null);
                }
            } else {
                account.setResident(null);
            }
            
            return ResponseEntity.ok(accountService.update(id, account));
        } catch (BadRequestException | ConflictException e) {
            throw e; // Re-throw known exceptions
        } catch (Exception e) {
            e.printStackTrace();
            throw new BadRequestException("Error updating account: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        accountService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getById(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<Account>> getAll() {
        return ResponseEntity.ok(accountService.getAll());
    }
    
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Account> resetPassword(@PathVariable Long id,
                                                 @RequestBody Map<String, String> request) {
        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(accountService.resetPassword(id, newPassword));
    }
}

