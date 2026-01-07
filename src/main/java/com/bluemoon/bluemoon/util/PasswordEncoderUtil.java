package com.bluemoon.bluemoon.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordEncoderUtil {
    
    private final PasswordEncoder passwordEncoder;
    
    public PasswordEncoderUtil() {
        this.passwordEncoder = new BCryptPasswordEncoder();
    }
    
    /**
     * Encode (hash) a plain text password
     */
    public String encode(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            return null;
        }
        return passwordEncoder.encode(rawPassword);
    }
    
    /**
     * Check if raw password matches the encoded password
     */
    public boolean matches(String rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
            return false;
        }
        // Check if password is already encoded (starts with $2a$ or $2b$)
        if (encodedPassword.startsWith("$2a$") || encodedPassword.startsWith("$2b$")) {
            return passwordEncoder.matches(rawPassword, encodedPassword);
        }
        // Legacy: plain text comparison for backward compatibility
        // This allows existing plain text passwords to still work
        return rawPassword.equals(encodedPassword);
    }
    
    /**
     * Check if a password is already encoded
     */
    public boolean isEncoded(String password) {
        return password != null && (password.startsWith("$2a$") || password.startsWith("$2b$"));
    }
}

