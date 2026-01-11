package com.bluemoon.bluemoon.repository;
import com.bluemoon.bluemoon.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface  AccountRepository extends JpaRepository< Account , Long>{
    Optional<Account> findByUsername(String username);
    Optional<Account> findByResidentId(Long residentId);
}
