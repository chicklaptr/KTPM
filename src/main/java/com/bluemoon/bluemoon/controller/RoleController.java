package com.bluemoon.bluemoon.controller;

import com.bluemoon.bluemoon.entity.Role;
import com.bluemoon.bluemoon.repository.RoleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleRepository roleRepository;

    public RoleController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @GetMapping
    public ResponseEntity<List<Role>> getAll() {
        return ResponseEntity.ok(roleRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Role> getById(@PathVariable Long id) {
        return roleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

