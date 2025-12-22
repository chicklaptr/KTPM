package com.bluemoon.bluemoon.service.impl;

import com.bluemoon.bluemoon.entity.HouseholdFee;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.repository.HouseholdFeeRepository;
import com.bluemoon.bluemoon.service.HouseholdFeeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class HouseholdFeeServiceImpl implements HouseholdFeeService {

    private final HouseholdFeeRepository householdFeeRepository;

    public HouseholdFeeServiceImpl(HouseholdFeeRepository householdFeeRepository) {
        this.householdFeeRepository = householdFeeRepository;
    }
    @Override
    public List<HouseholdFee> getByHouseholdId(Long householdId) {
        List<HouseholdFee> fees = householdFeeRepository.findByHouseholdId(householdId);

        if (fees.isEmpty()) {
            throw new ResourceNotFoundException(
                "No household fees found for household id " + householdId
            );
        }

        return fees;
    }


    @Override
    public HouseholdFee create(HouseholdFee fee) {
        return householdFeeRepository.save(fee);
    }

    @Override
    public HouseholdFee update(Long id, HouseholdFee fee) {
        HouseholdFee existing = householdFeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HouseholdFee not found with id " + id));

        existing.setHousehold(fee.getHousehold());
        existing.setFeeCategory(fee.getFeeCategory());
        existing.setBillingPeriod(fee.getBillingPeriod());
        existing.setQuantity(fee.getQuantity());
        existing.setUnitPrice(fee.getUnitPrice());
        existing.setAmount(fee.getAmount());
        existing.setStatus(fee.getStatus());
        existing.setDueDate(fee.getDueDate());

        return householdFeeRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
    	if(!householdFeeRepository.existsById(id)) {
    		throw new ResourceNotFoundException("HouseholdFee not found with id " + id);
    	}
        householdFeeRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public HouseholdFee getById(Long id) {
        return householdFeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HouseholdFee not found with id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HouseholdFee> getAll() {
        return householdFeeRepository.findAll();
    }
    
}
