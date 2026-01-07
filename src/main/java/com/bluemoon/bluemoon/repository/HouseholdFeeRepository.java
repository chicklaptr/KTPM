package com.bluemoon.bluemoon.repository;

import com.bluemoon.bluemoon.entity.BillingPeriod;
import com.bluemoon.bluemoon.entity.Household;
import com.bluemoon.bluemoon.entity.HouseholdFee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HouseholdFeeRepository extends JpaRepository<HouseholdFee, Long> {

    List<HouseholdFee> findByHousehold(Household household);

    List<HouseholdFee> findByBillingPeriod(BillingPeriod period);

    List<HouseholdFee> findByHouseholdAndBillingPeriod(Household household, BillingPeriod period);

    List<HouseholdFee> findByStatus(String status);
    List<HouseholdFee> findByHouseholdId(Long householdId);
    boolean existsByHouseholdIdAndFeeCategoryIdAndBillingPeriodId(
            Long householdId, Long feeCategoryId, Long billingPeriodId
    );
}
