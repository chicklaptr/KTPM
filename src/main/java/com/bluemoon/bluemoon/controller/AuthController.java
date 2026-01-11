package com.bluemoon.bluemoon.controller;
import com.bluemoon.bluemoon.entity.Account;
import com.bluemoon.bluemoon.exception.UnauthorizedException;
import com.bluemoon.bluemoon.repository.AccountRepository;
import com.bluemoon.bluemoon.service.AuthService;
import com.bluemoon.bluemoon.util.PasswordEncoderUtil;

import jakarta.servlet.http.HttpSession;


import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Controller
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/resident-login")
    public String loginResident(@RequestParam String username,
                                @RequestParam String password,
                                HttpSession session) {
        return authService.loginResident(username, password, session);
    }

    @PostMapping("/admin-login")
    public String loginAdmin(@RequestParam String username,
                             @RequestParam String password,
                             HttpSession session) {
        return authService.loginAdmin(username, password, session);
    }

    @GetMapping("/check-admin")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> checkAdmin(HttpSession session) {
        return ResponseEntity.ok(authService.checkAdmin(session));
    }

    @GetMapping("/check-resident")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> checkResident(HttpSession session) {
        return ResponseEntity.ok(authService.checkResident(session));
    }

    @PostMapping("/logout")
    @ResponseBody
    public ResponseEntity<Map<String, String>> logout(HttpSession session) {
        return ResponseEntity.ok(authService.logout(session));
    }

    @PostMapping("/resident/change-password")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> changePasswordResident(@RequestBody Map<String, String> req,
                                                                      HttpSession session) {
        Map<String, Object> out = authService.changePasswordResident(req, session);
        // nếu muốn status code 401 khi chưa login:
        Object successObj = out.get("success");
        boolean success = successObj instanceof Boolean && (Boolean) successObj;

        if (!success && "Chưa đăng nhập".equals(out.get("message"))) {
            throw new UnauthorizedException("Chưa đăng nhập");
        }
        return ResponseEntity.ok(out);
    }
}
