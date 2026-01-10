package com.bluemoon.bluemoon.service.impl;

import java.util.List;
import java.util.Optional;

import com.bluemoon.bluemoon.entity.Role;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.repository.RoleRepository;

public class RoleServiceImpl {
	private final RoleRepository roleRepository ;
	RoleServiceImpl(RoleRepository roleRepository){
		this.roleRepository=roleRepository;
	}
	
	List<Role> getAll(){
		return roleRepository.findAll();
	}
	Role getById(Long id) {
		return roleRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Payment not found with id " + id));
	}
	

}
