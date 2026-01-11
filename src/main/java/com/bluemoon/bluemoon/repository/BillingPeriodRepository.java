package com.bluemoon.bluemoon.repository;

import com.bluemoon.bluemoon.entity.BillingPeriod;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;

public interface BillingPeriodRepository extends JpaRepository<BillingPeriod, Long> {

    Optional<BillingPeriod> findByYearAndMonth(Integer year, Integer month);
}
