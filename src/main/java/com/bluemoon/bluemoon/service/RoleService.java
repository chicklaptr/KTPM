package com.bluemoon.bluemoon.service;

import java.util.List;

import com.bluemoon.bluemoon.entity.Role;

public interface RoleService {
	List<Role> getAll();
	
	Role getById(Long id);
	

}
