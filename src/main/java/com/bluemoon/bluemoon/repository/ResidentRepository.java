package com.bluemoon.bluemoon.repository;

import com.bluemoon.bluemoon.entity.Household;
import com.bluemoon.bluemoon.entity.Resident;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResidentRepository extends JpaRepository<Resident, Long> {

    List<Resident> findByHousehold(Household household);
    
    List<Resident> findByHouseholdId(Long householdId);

    List<Resident> findByResidenceStatus(String residenceStatus);
}
