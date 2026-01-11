package com.bluemoon.bluemoon.service.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.bluemoon.entity.Role;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.repository.RoleRepository;
import com.bluemoon.bluemoon.service.RoleService;

@Service
@Transactional
public class RoleServiceImpl implements RoleService {
	private final RoleRepository roleRepository ;
	RoleServiceImpl(RoleRepository roleRepository){
		this.roleRepository=roleRepository;
	}
	@Override
	public List<Role> getAll(){
		return roleRepository.findAll();
	}
	@Override
	public Role getById(Long id) {
		return roleRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Payment not found with id " + id));
	}
	

}
