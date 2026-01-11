package com.bluemoon.bluemoon.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.bluemoon.entity.Account;
import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.entity.Role;
import com.bluemoon.bluemoon.exception.BadRequestException;
import com.bluemoon.bluemoon.exception.ConflictException;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.repository.AccountRepository;
import com.bluemoon.bluemoon.repository.ResidentRepository;
import com.bluemoon.bluemoon.repository.RoleRepository;
import com.bluemoon.bluemoon.service.AccountService;
import com.bluemoon.bluemoon.util.PasswordEncoderUtil;

@Service
@Transactional
@SuppressWarnings("null")
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final ResidentRepository residentRepository;
    private final PasswordEncoderUtil passwordEncoder;

    public AccountServiceImpl(AccountRepository accountRepository,
                              RoleRepository roleRepository,
                              ResidentRepository residentRepository,
                              PasswordEncoderUtil passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.residentRepository = residentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Account create(Account account) {
        // Validate role (required)
        if (account.getRole() == null || account.getRole().getId() == null) {
            throw new BadRequestException("Role is required");
        }
        Long roleId = account.getRole().getId();
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + roleId));
        account.setRole(role);

        // Set resident if provided
        if (account.getResident() != null && account.getResident().getId() != null) {
            Long residentId = account.getResident().getId();
            Resident resident = residentRepository.findById(residentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id " + residentId));
            account.setResident(resident);
        } else {
            account.setResident(null);
        }

        // Validate and encode password before saving
        if (account.getPassword() == null || account.getPassword().isEmpty()) {
            throw new BadRequestException("Password is required");
        }
        // Only encode if not already encoded
        if (!passwordEncoder.isEncoded(account.getPassword())) {
            try {
                account.setPassword(passwordEncoder.encode(account.getPassword()));
            } catch (Exception e) {
                throw new BadRequestException("Lỗi khi mã hóa mật khẩu: " + e.getMessage());
            }
        }
        
        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());
        try {
            return accountRepository.save(account);
        } catch (Exception e) {
            // Re-throw with more context
            if (e.getMessage() != null && e.getMessage().contains("username")) {
                throw new ConflictException("Username đã tồn tại. Vui lòng chọn username khác.");
            }
            throw e;
        }
    }

    @Override
    public Account update(Long id, Account account) {
        Account existing = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id " + id));

        existing.setUsername(account.getUsername());
        
        // Only update password if provided
        if (account.getPassword() != null && !account.getPassword().isEmpty()) {
            // Only encode if not already encoded
            if (!passwordEncoder.isEncoded(account.getPassword())) {
                existing.setPassword(passwordEncoder.encode(account.getPassword()));
            } else {
                existing.setPassword(account.getPassword());
            }
        }

        // Update role (required)
        if (account.getRole() == null || account.getRole().getId() == null) {
            throw new BadRequestException("Role is required");
        }
        Long roleId = account.getRole().getId();
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id " + roleId));
        existing.setRole(role);

        // Update resident
        if (account.getResident() != null && account.getResident().getId() != null) {
            Long residentId = account.getResident().getId();
            Resident resident = residentRepository.findById(residentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Resident not found"));
            existing.setResident(resident);
        } else {
            existing.setResident(null);
        }

        existing.setUpdatedAt(LocalDateTime.now());
        return accountRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        if (!accountRepository.existsById(id)) {
            throw new ResourceNotFoundException("Account not found with id " + id);
        }
        accountRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Account getById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Account> getAll() {
        // Sort by role (ADMIN first) and then by ID ascending
        return accountRepository.findAll().stream()
                .sorted((a, b) -> {
                    String roleA = a.getRole() != null ? a.getRole().getName() : "";
                    String roleB = b.getRole() != null ? b.getRole().getName() : "";
                    
                    // If both are ADMIN or both are RESIDENT, sort by ID ascending
                    if (roleA.equals(roleB)) {
                        return Long.compare(a.getId() != null ? a.getId() : 0L, 
                                          b.getId() != null ? b.getId() : 0L);
                    }
                    
                    // Admin comes before Resident
                    if ("ADMIN".equals(roleA) && !"ADMIN".equals(roleB)) {
                        return -1;
                    }
                    if (!"ADMIN".equals(roleA) && "ADMIN".equals(roleB)) {
                        return 1;
                    }
                    
                    // Default: sort by ID
                    return Long.compare(a.getId() != null ? a.getId() : 0L, 
                                      b.getId() != null ? b.getId() : 0L);
                })
                .collect(Collectors.toList());
    }
    
    @Override
    public Account resetPassword(Long id, String newPassword) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id " + id));
        
        // Encode the new password
        account.setPassword(passwordEncoder.encode(newPassword));
        account.setUpdatedAt(LocalDateTime.now());
        
        return accountRepository.save(account);
    }

    @Override
    public void changePassword(Long id, String newRawPassword) {
        Account account = getById(id);
        // Mã hóa mật khẩu mới trước khi lưu
        String encodedPassword = passwordEncoder.encode(newRawPassword);
        account.setPassword(encodedPassword);
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);
    }
}

