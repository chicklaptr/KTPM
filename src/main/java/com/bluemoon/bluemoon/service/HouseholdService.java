package com.bluemoon.bluemoon.service;

import com.bluemoon.bluemoon.entity.Household;


import java.util.List;

public interface HouseholdService {

    Household create(Household household);

    Household update(Long id, Household household);

    void delete(Long id);

    Household getById(Long id);

   
    List<Household> getAll();

    List<Household> getActive();

    List<Household> getByApartment(String apartmentNumber);
}
