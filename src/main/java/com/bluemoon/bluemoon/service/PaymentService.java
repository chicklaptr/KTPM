package com.bluemoon.bluemoon.service;

import com.bluemoon.bluemoon.entity.Payment;

import java.util.List;

public interface PaymentService {

    Payment create(Payment payment);

    void delete(Long id);

    Payment getById(Long id);
    List<Payment> getByHouseholdId(Long householdId);
    List<Payment> getAll();
}
