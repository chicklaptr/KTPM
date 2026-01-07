package com.bluemoon.bluemoon.service.impl;

import com.bluemoon.bluemoon.entity.Household;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.repository.HouseholdRepository;
import com.bluemoon.bluemoon.service.HouseholdService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class HouseholdServiceImpl implements HouseholdService {

    private final HouseholdRepository householdRepository;

    public HouseholdServiceImpl(HouseholdRepository householdRepository) {
        this.householdRepository = householdRepository;
    }

    @Override
    public Household create(Household household) {
        return householdRepository.save(household);
    }

    @Override
    public Household update(Long id, Household household) {
        Household existing = householdRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Household not found with id " + id));

        existing.setHouseholdCode(household.getHouseholdCode());
        existing.setOwnerName(household.getOwnerName());
        existing.setApartmentNumber(household.getApartmentNumber());
        existing.setPhone(household.getPhone());
        existing.setMembersCount(household.getMembersCount());
        existing.setResidenceStatus(household.getResidenceStatus());
        existing.setMoveInDate(household.getMoveInDate());
        existing.setMoveOutDate(household.getMoveOutDate());
        existing.setActive(household.getActive());
        existing.setOwnsApartment(household.getOwnsApartment());

        return householdRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
    	if(!householdRepository.existsById(id)) {
    		throw new ResourceNotFoundException("Household not found with id " + id);
    	}
        householdRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Household getById(Long id) {
        return householdRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Household not found with id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Household> getAll() {
        return householdRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Household> getActive() {
        return householdRepository.findByActiveTrue();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Household> getByApartment(String apartmentNumber) {
        return householdRepository.findByApartmentNumber(apartmentNumber);
    }
}
