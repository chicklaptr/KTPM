package com.bluemoon.bluemoon.service.impl;

import com.bluemoon.bluemoon.entity.HouseholdFee;
import com.bluemoon.bluemoon.entity.Payment;
import com.bluemoon.bluemoon.exception.BadRequestException;
import com.bluemoon.bluemoon.exception.ConflictException;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.repository.HouseholdFeeRepository;
import com.bluemoon.bluemoon.repository.PaymentRepository;
import com.bluemoon.bluemoon.service.PaymentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final HouseholdFeeRepository householdFeeRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
							  HouseholdFeeRepository householdFeeRepository) {
		this.paymentRepository = paymentRepository;
		this.householdFeeRepository = householdFeeRepository;
	}

    @Override
    public List<Payment> getByHouseholdId(Long householdId) {
        return paymentRepository.findByHouseholdFee_Household_Id(householdId);
    }

    @Override
    public Payment create(Payment payment) {

        if (payment.getHouseholdFee() == null || payment.getHouseholdFee().getId() == null) {
            throw new BadRequestException("householdFeeId is required");
        }

        Long householdFeeId = payment.getHouseholdFee().getId();

    
        HouseholdFee hf = householdFeeRepository.findById(householdFeeId)
            .orElseThrow(() ->
                new ResourceNotFoundException("HouseholdFee not found with id " + householdFeeId)
            );

       
        if (paymentRepository.existsByHouseholdFeeId(householdFeeId)) {
            throw new ConflictException("This fee has already been paid");
        }

      
        payment.setHouseholdFee(hf);
        return paymentRepository.save(payment);
    }


    @Override
    public void delete(Long id) {
    	if(!paymentRepository.existsById(id)) {
    		throw new ResourceNotFoundException("Payment not found with id " + id);
    	}
        paymentRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Payment getById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Payment> getAll() {
        return paymentRepository.findAll();
    }
}
