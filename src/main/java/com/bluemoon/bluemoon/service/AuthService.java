package com.bluemoon.bluemoon.service;

import java.util.Map;

import jakarta.servlet.http.HttpSession;

public interface AuthService {
    String loginResident(String username, String password, HttpSession session);
    String loginAdmin(String username, String password, HttpSession session);
    Map<String, Object> checkAdmin(HttpSession session);
    Map<String, Object> checkResident(HttpSession session);
    Map<String, String> logout(HttpSession session);

    Map<String, Object> changePasswordResident(Map<String, String> req, HttpSession session);
}

