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

}