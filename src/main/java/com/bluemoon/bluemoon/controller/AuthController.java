package com.bluemoon.bluemoon.controller;
import com.bluemoon.bluemoon.entity.Account;
import com.bluemoon.bluemoon.repository.AccountRepository;

import jakarta.servlet.http.HttpSession;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;


import java.util.Optional;

@Controller
@RequestMapping("/api/auth")
public class AuthController {
	private final AccountRepository accountRepository;
	public AuthController(AccountRepository accountRepository) {
		this.accountRepository = accountRepository;
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

	    boolean passwordOk = acc.getPassword().equals(password);
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

	    if (!acc.getPassword().equals(password)) {
	        return "redirect:/login-admin.html?error=password";
	    }

	    session.setAttribute("admin", acc.getId());
	    return "redirect:/dashboard-admin.html";
	}

}