package com.bluemoon.bluemoon.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.bluemoon.entity.BillingPeriod;
import com.bluemoon.bluemoon.entity.Household;
import com.bluemoon.bluemoon.entity.HouseholdFee;
import com.bluemoon.bluemoon.entity.Payment;
import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.repository.HouseholdFeeRepository;
import com.bluemoon.bluemoon.repository.PaymentRepository;
import com.bluemoon.bluemoon.repository.ResidentRepository;
import com.bluemoon.bluemoon.service.UserPortalService;

@Service
@Transactional(readOnly = true)
public class UserPortalServiceImpl implements UserPortalService {

    private final ResidentRepository residentRepository;
    private final HouseholdFeeRepository householdFeeRepository;
    private final PaymentRepository paymentRepository;

    public UserPortalServiceImpl(
            ResidentRepository residentRepository,
            HouseholdFeeRepository householdFeeRepository,
            PaymentRepository paymentRepository) {
        this.residentRepository = residentRepository;
        this.householdFeeRepository = householdFeeRepository;
        this.paymentRepository = paymentRepository;
    }
    
    @Override
    public List<BillingPeriod> getMyPeriods(Long residentId) {
        Long householdId = getHouseholdId(residentId);
        return householdFeeRepository.findDistinctBillingPeriodsByHouseholdId(householdId);
    }
    
    @Override
    public Household getMyHousehold(Long residentId) {
        Resident resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found"));

        Household household = resident.getHousehold();
        if (household == null) {
            throw new ResourceNotFoundException("Household not found");
        }

        return household;
    }


    @Override
    public Resident getMyProfile(Long residentId) {
        return residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found"));
    }

    private Long getHouseholdId(Long residentId) {
        Resident resident = getMyProfile(residentId);

        if (resident.getHousehold() == null) {
            throw new ResourceNotFoundException("No household found for resident");
        }

        return resident.getHousehold().getId();
    }

    @Override
    public List<HouseholdFee> getMyFees(Long residentId) {
        Long householdId = getHouseholdId(residentId);
        return householdFeeRepository.findByHouseholdId(householdId);
    }

    @Override
    public List<Payment> getMyPayments(Long residentId) {
        Long householdId = getHouseholdId(residentId);
        return paymentRepository.findByHouseholdFee_Household_Id(householdId);
    }

    @Override
    public List<Resident> getMyFamily(Long residentId) {
        Long householdId = getHouseholdId(residentId);
        return residentRepository.findByHouseholdId(householdId);
    }
}

