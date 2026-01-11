package com.bluemoon.bluemoon.repository;
import com.bluemoon.bluemoon.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
public interface RoleRepository extends JpaRepository <Role , Long> {
	Optional<Role> findByName(String name);
	Optional<Role> findById(Long id);
	List<Role> findAll();
	
}
