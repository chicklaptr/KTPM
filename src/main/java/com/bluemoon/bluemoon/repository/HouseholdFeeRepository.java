package com.bluemoon.bluemoon.repository;

import com.bluemoon.bluemoon.entity.BillingPeriod;
import com.bluemoon.bluemoon.entity.Household;
import com.bluemoon.bluemoon.entity.HouseholdFee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HouseholdFeeRepository extends JpaRepository<HouseholdFee, Long> {

    List<HouseholdFee> findByHousehold(Household household);

    List<HouseholdFee> findByBillingPeriodId(Long periodId);

    @Query("""
        select distinct hf.billingPeriod
        from HouseholdFee hf
        where hf.household.id = :householdId
        order by hf.billingPeriod.year desc, hf.billingPeriod.month desc
    """)
    List<BillingPeriod> findDistinctBillingPeriodsByHouseholdId(@Param("householdId") Long householdId);

    List<HouseholdFee> findByHouseholdAndBillingPeriod(Household household, BillingPeriod period);

    List<HouseholdFee> findByStatus(String status);
    List<HouseholdFee> findByHouseholdId(Long householdId);
    boolean existsByHouseholdIdAndFeeCategoryIdAndBillingPeriodId(
            Long householdId, Long feeCategoryId, Long billingPeriodId
    );
}
