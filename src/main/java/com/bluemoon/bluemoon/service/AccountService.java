package com.bluemoon.bluemoon.service;

import java.util.List;

import com.bluemoon.bluemoon.entity.Account;

public interface AccountService {

    Account create(Account account);

    Account update(Long id, Account account);

    void delete(Long id);

    Account getById(Long id);

    List<Account> getAll();
    
    Account resetPassword(Long id, String newPassword);

    // --- THÊM DÒNG NÀY ---
    void changePassword(Long id, String newRawPassword);
}