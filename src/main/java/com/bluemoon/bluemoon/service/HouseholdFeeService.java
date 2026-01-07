package com.bluemoon.bluemoon.service;

import com.bluemoon.bluemoon.entity.HouseholdFee;

import java.util.List;

public interface HouseholdFeeService {

    HouseholdFee create(HouseholdFee fee);

    HouseholdFee update(Long id, HouseholdFee fee);

    void delete(Long id);

    HouseholdFee getById(Long id);
    List<HouseholdFee> getByHouseholdId(Long householdId);
    List<HouseholdFee> getByPeriodId(Long periodId);
                
    List<HouseholdFee> getAll();
    List<HouseholdFee> generateForPeriod(Long periodId);
}
