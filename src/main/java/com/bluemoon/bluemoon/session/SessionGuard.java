package com.bluemoon.bluemoon.session;

import com.bluemoon.bluemoon.exception.UnauthorizedException;

import jakarta.servlet.http.HttpSession;

public final class SessionGuard {
    private SessionGuard() {}

    public static void requireAdmin(HttpSession session) {
        if (session.getAttribute("admin") == null) {
            throw new UnauthorizedException("Admin login required.");
        }
    }

    public static void requireUser(HttpSession session) {
        if (session.getAttribute("residentId") == null) {
            throw new UnauthorizedException("Resident login required.");
        }
    }
}


