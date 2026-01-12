package com.bluemoon.bluemoon.service.impl;

import com.bluemoon.bluemoon.entity.Household;
import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.repository.HouseholdRepository;
import com.bluemoon.bluemoon.repository.ResidentRepository;
import com.bluemoon.bluemoon.service.ResidentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ResidentServiceImpl implements ResidentService {

    private final ResidentRepository residentRepository;
    private final HouseholdRepository householdRepository;

    public ResidentServiceImpl(ResidentRepository residentRepository,
                               HouseholdRepository householdRepository) {
        this.residentRepository = residentRepository;
        this.householdRepository = householdRepository;
    }

    @Override
    public Resident create(Resident resident) {
        return residentRepository.save(resident);
    }

    @Override
    public Resident update(Long id, Resident resident) {
        Resident existing = residentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id " + id));

        existing.setFullName(resident.getFullName());
        existing.setDateOfBirth(resident.getDateOfBirth());
        existing.setGender(resident.getGender());
        existing.setIdNumber(resident.getIdNumber());
        existing.setPhone(resident.getPhone());
        existing.setRelationToHead(resident.getRelationToHead());
        existing.setResidenceStatus(resident.getResidenceStatus());
        existing.setHousehold(resident.getHousehold());

        return residentRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        Resident r = residentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Resident not found"));
        r.setActive(false);      
        residentRepository.save(r);
    }

    @Override
    @Transactional(readOnly = true)
    public Resident getById(Long id) {
        return residentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Resident> getAll() {
        return residentRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Resident> getByHousehold(Long householdId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new ResourceNotFoundException("Household not found with id " + householdId));
        return residentRepository.findByHouseholdIdAndActiveTrue(householdId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Resident> getByResidenceStatus(String status) {
        return residentRepository.findByResidenceStatus(status);
    }
}
