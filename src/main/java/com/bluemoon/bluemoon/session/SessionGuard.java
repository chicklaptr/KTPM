package com.bluemoon.bluemoon.session;

import com.bluemoon.bluemoon.exception.UnauthorizedException;

import jakarta.servlet.http.HttpSession;

public final class SessionGuard {
	private SessionGuard() {}
	
	public static void requireAdmin(HttpSession session) {
		Object adminId = session.getAttribute("admin");
		if (adminId == null) throw new UnauthorizedException("Admin login required.");
		
		
	}
	public static Integer requireUser(HttpSession session) {
		Object rid=session.getAttribute("residentId");
		if(rid==null) throw new UnauthorizedException("Resident login required.");
	    return (Integer) rid;
		
	}

}
