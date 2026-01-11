package com.bluemoon.bluemoon.controller;
import com.bluemoon.bluemoon.entity.Account;
import com.bluemoon.bluemoon.repository.AccountRepository;
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
	private final AccountRepository accountRepository;
	private final PasswordEncoderUtil passwordEncoder;
	
	public AuthController(AccountRepository accountRepository, PasswordEncoderUtil passwordEncoder) {
		this.accountRepository = accountRepository;
		this.passwordEncoder = passwordEncoder;
	}
	
	@PostMapping("/resident-login")
	public String loginResident(@RequestParam String username,
	                            @RequestParam String password,
	                            HttpSession session) {

	    Optional<Account> opt = accountRepository.findByUsername(username);

	    if (opt.isEmpty()) {
	        return "redirect:/login-user.html?error=notfound";
	    }

	    Account acc = opt.get();

	    boolean passwordOk = passwordEncoder.matches(password, acc.getPassword());
	    boolean roleOk = acc.getRole() != null
	            && acc.getRole().getName().equalsIgnoreCase("RESIDENT");

	    if (!passwordOk) {
	        return "redirect:/login-user.html?error=wrongpass";
	    }

	    if (!roleOk) {
	        return "redirect:/login-user.html?error=role";
	    }

	    session.setAttribute("residentId", acc.getResident().getId());
	    return "redirect:/dashboard-user.html";
	}

	
	@PostMapping("/admin-login")
	public String loginAdmin(@RequestParam String username,
	                         @RequestParam String password,
	                         HttpSession session) {

	    Optional<Account> opt = accountRepository.findByUsername(username);

	    if (opt.isEmpty()) {
	        return "redirect:/login-admin.html?error=notfound";
	    }

	    Account acc = opt.get();

	    if (acc.getRole() == null ||
	        !acc.getRole().getName().equalsIgnoreCase("ADMIN")) {
	        return "redirect:/login-admin.html?error=role";
	    }

	    if (!passwordEncoder.matches(password, acc.getPassword())) {
	        return "redirect:/login-admin.html?error=password";
	    }

	    session.setAttribute("admin", acc.getId());
	    return "redirect:/dashboard-admin.html";
	}

	@GetMapping("/check-admin")
	@ResponseBody
	public ResponseEntity<Map<String, Object>> checkAdmin(HttpSession session) {
	    Map<String, Object> response = new HashMap<>();
	    Long adminId = (Long) session.getAttribute("admin");
	    
	    if (adminId != null) {
	        response.put("authenticated", true);
	        response.put("adminId", adminId);
	    } else {
	        response.put("authenticated", false);
	    }
	    
	    return ResponseEntity.ok(response);
	}

	@PostMapping("/logout")
	@ResponseBody
	public ResponseEntity<Map<String, String>> logout(HttpSession session) {
	    session.invalidate();
	    Map<String, String> response = new HashMap<>();
	    response.put("message", "Đăng xuất thành công");
	    return ResponseEntity.ok(response);
	}

	@PostMapping("/resident/change-password")
	@ResponseBody
	public ResponseEntity<Map<String, Object>> changePasswordResident(
			@RequestBody Map<String, String> request,
			HttpSession session) {
		Map<String, Object> response = new HashMap<>();
		
		Long residentId = (Long) session.getAttribute("residentId");
		if (residentId == null) {
			response.put("success", false);
			response.put("message", "Chưa đăng nhập");
			return ResponseEntity.status(401).body(response);
		}
		
		String currentPassword = request.get("currentPassword");
		String newPassword = request.get("newPassword");
		
		if (currentPassword == null || newPassword == null || 
		    currentPassword.isEmpty() || newPassword.isEmpty()) {
			response.put("success", false);
			response.put("message", "Vui lòng nhập đầy đủ thông tin");
			return ResponseEntity.badRequest().body(response);
		}
		
		if (newPassword.length() < 6) {
			response.put("success", false);
			response.put("message", "Mật khẩu mới phải có ít nhất 6 ký tự");
			return ResponseEntity.badRequest().body(response);
		}
		
		// Tìm account của resident
		Optional<Account> accountOpt = accountRepository.findByResidentId(residentId);
		if (accountOpt.isEmpty()) {
			response.put("success", false);
			response.put("message", "Không tìm thấy tài khoản");
			return ResponseEntity.badRequest().body(response);
		}
		
		Account account = accountOpt.get();
		
		// Kiểm tra mật khẩu hiện tại
		if (!passwordEncoder.matches(currentPassword, account.getPassword())) {
			response.put("success", false);
			response.put("message", "Mật khẩu hiện tại không đúng");
			return ResponseEntity.badRequest().body(response);
		}
		
		// Cập nhật mật khẩu mới
		String encodedPassword = passwordEncoder.encode(newPassword);
		account.setPassword(encodedPassword);
		accountRepository.save(account);
		
		response.put("success", true);
		response.put("message", "Đổi mật khẩu thành công");
		return ResponseEntity.ok(response);
	}

}