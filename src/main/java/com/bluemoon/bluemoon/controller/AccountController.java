package com.bluemoon.bluemoon.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bluemoon.bluemoon.entity.Account;
import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.entity.Role;
import com.bluemoon.bluemoon.exception.BadRequestException;
import com.bluemoon.bluemoon.exception.ConflictException;
import com.bluemoon.bluemoon.service.AccountService;
import com.bluemoon.bluemoon.session.SessionGuard;
import com.bluemoon.bluemoon.util.PasswordEncoderUtil;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;
    private final PasswordEncoderUtil passwordEncoderUtil;

    public AccountController(AccountService accountService, PasswordEncoderUtil passwordEncoderUtil) {
        this.accountService = accountService;
        this.passwordEncoderUtil = passwordEncoderUtil;
    }

    @PostMapping
    public ResponseEntity<Account> create(@RequestBody Map<String, Object> accountData,HttpSession session) {
    	SessionGuard.requireAdmin(session);
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
            // Mã hóa mật khẩu trước khi gán vào Account ---
            String rawPassword = (String) accountData.get("password");
            account.setPassword(passwordEncoderUtil.encode(rawPassword)); 
            
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
                                         @RequestBody Map<String, Object> accountData,HttpSession session) {
    	SessionGuard.requireAdmin(session);
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
            
            // Mã hóa và cập nhật nếu password được gửi lên
            if (accountData.get("password") != null && !((String) accountData.get("password")).isEmpty()) {
                String rawPassword = (String) accountData.get("password");
                // Mã hóa mật khẩu thô trước khi gán vào đối tượng account
                account.setPassword(passwordEncoderUtil.encode(rawPassword));
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
    public ResponseEntity<Void> delete(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        accountService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getById(@PathVariable Long id,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(accountService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<Account>> getAll(HttpSession session) {
    	SessionGuard.requireAdmin(session);
        return ResponseEntity.ok(accountService.getAll());
    }
    
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Account> resetPassword(@PathVariable Long id,
                                                 @RequestBody Map<String, String> request,HttpSession session) {
    	SessionGuard.requireAdmin(session);
        String newPassword = request.get("newPassword");
        // 1. Kiểm tra mật khẩu mới có trống hay không
        if (newPassword == null || newPassword.isEmpty()) {
                     return ResponseEntity.badRequest().build();
        }
        // 2. MÃ HÓA mật khẩu mới bằng BCrypt trước khi lưu
        String encodedPassword = passwordEncoderUtil.encode(newPassword);
        // 3. Chuyển mật khẩu ĐÃ MÃ HÓA vào Service để cập nhật Database
        return ResponseEntity.ok(accountService.resetPassword(id, encodedPassword));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo(HttpSession session) {
        Long id = (Long) session.getAttribute("admin");
        if (id == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(accountService.getById(id));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> req, HttpSession session) {
        Long id = (Long) session.getAttribute("admin");
        if (id == null) return ResponseEntity.status(401).body("Chưa đăng nhập");
        
        Account acc = accountService.getById(id);
        if (!passwordEncoderUtil.matches(req.get("oldPass"), acc.getPassword())) {
            return ResponseEntity.badRequest().body("Mật khẩu cũ sai");
        }
        
        accountService.changePassword(id, req.get("newPass")); // Gọi hàm service mới
        return ResponseEntity.ok("Thành công");
    }
}

