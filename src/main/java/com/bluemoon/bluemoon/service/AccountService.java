package com.bluemoon.bluemoon.service;

import com.bluemoon.bluemoon.entity.Account;

import java.util.List;

public interface AccountService {

    Account create(Account account);

    Account update(Long id, Account account);

    void delete(Long id);

    Account getById(Long id);

    List<Account> getAll();
    
    Account resetPassword(Long id, String newPassword);
}

