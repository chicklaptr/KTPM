package com.bluemoon.bluemoon.service.impl;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.bluemoon.bluemoon.entity.Account;
import com.bluemoon.bluemoon.repository.AccountRepository;
import com.bluemoon.bluemoon.service.AuthService;
import com.bluemoon.bluemoon.util.PasswordEncoderUtil;

import jakarta.servlet.http.HttpSession;

@Service
public class AuthServiceImpl implements AuthService {

    private final AccountRepository accountRepository;
    private final PasswordEncoderUtil passwordEncoder;

    public AuthServiceImpl(AccountRepository accountRepository, PasswordEncoderUtil passwordEncoder) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public String loginResident(String username, String password, HttpSession session) {
        Optional<Account> opt = accountRepository.findByUsername(username);
        if (opt.isEmpty()) return "redirect:/login-user.html?error=notfound";

        Account acc = opt.get();

        boolean roleOk = acc.getRole() != null
                && "RESIDENT".equalsIgnoreCase(acc.getRole().getName());

        if (!roleOk) return "redirect:/login-user.html?error=role";
        if (!passwordEncoder.matches(password, acc.getPassword()))
            return "redirect:/login-user.html?error=wrongpass";

        if (acc.getResident() == null)
            return "redirect:/login-user.html?error=resident_missing";

        // chỉ giữ 1 role trong session
        session.removeAttribute("admin");
        session.setAttribute("residentId", acc.getResident().getId());

        return "redirect:/dashboard-user.html";
    }

    @Override
    public String loginAdmin(String username, String password, HttpSession session) {
        Optional<Account> opt = accountRepository.findByUsername(username);
        if (opt.isEmpty()) return "redirect:/login-admin.html?error=notfound";

        Account acc = opt.get();

        boolean roleOk = acc.getRole() != null
                && "ADMIN".equalsIgnoreCase(acc.getRole().getName());
        if (!roleOk) return "redirect:/login-admin.html?error=role";

        if (!passwordEncoder.matches(password, acc.getPassword()))
            return "redirect:/login-admin.html?error=password";

        session.removeAttribute("residentId");
        session.setAttribute("admin", acc.getId());

        return "redirect:/dashboard-admin.html";
    }

    @Override
    public Map<String, Object> checkAdmin(HttpSession session) {
        Map<String, Object> res = new HashMap<>();
        Long adminId = (Long) session.getAttribute("admin");
        res.put("authenticated", adminId != null);
        if (adminId != null) res.put("adminId", adminId);
        return res;
    }

    @Override
    public Map<String, Object> checkResident(HttpSession session) {
        Map<String, Object> res = new HashMap<>();
        Long residentId = (Long) session.getAttribute("residentId");
        res.put("authenticated", residentId != null);
        if (residentId != null) res.put("residentId", residentId);
        return res;
    }

    @Override
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        Map<String, String> res = new HashMap<>();
        res.put("message", "Đăng xuất thành công");
        return res;
    }

    @Override
    public Map<String, Object> changePasswordResident(Map<String, String> req, HttpSession session) {
        Map<String, Object> res = new HashMap<>();
        Long residentId = (Long) session.getAttribute("residentId");
        if (residentId == null) {
            res.put("success", false);
            res.put("message", "Chưa đăng nhập");
            return res;
        }

        String currentPassword = req.get("currentPassword");
        String newPassword = req.get("newPassword");

        if (currentPassword == null || currentPassword.isBlank()
                || newPassword == null || newPassword.isBlank()) {
            res.put("success", false);
            res.put("message", "Vui lòng nhập đầy đủ thông tin");
            return res;
        }
        if (newPassword.length() < 6) {
            res.put("success", false);
            res.put("message", "Mật khẩu mới phải có ít nhất 6 ký tự");
            return res;
        }

        Account account = accountRepository.findByResidentId(residentId)
                .orElse(null);
        if (account == null) {
            res.put("success", false);
            res.put("message", "Không tìm thấy tài khoản");
            return res;
        }

        if (!passwordEncoder.matches(currentPassword, account.getPassword())) {
            res.put("success", false);
            res.put("message", "Mật khẩu hiện tại không đúng");
            return res;
        }

        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);

        res.put("success", true);
        res.put("message", "Đổi mật khẩu thành công");
        return res;
    }
}

