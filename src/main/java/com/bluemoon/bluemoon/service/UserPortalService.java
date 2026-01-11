package com.bluemoon.bluemoon.service;

import java.util.List;

import com.bluemoon.bluemoon.entity.BillingPeriod;
import com.bluemoon.bluemoon.entity.Household;
import com.bluemoon.bluemoon.entity.HouseholdFee;
import com.bluemoon.bluemoon.entity.Payment;
import com.bluemoon.bluemoon.entity.Resident;

import jakarta.servlet.http.HttpSession;

public interface UserPortalService {
    Resident getMyProfile(Long residentId);
    Household getMyHousehold(Long residentId);
    List<BillingPeriod> getMyPeriods(Long residentId);
    List<HouseholdFee> getMyFees(Long residentId);
    List<Payment> getMyPayments(Long residentId);
    List<Resident> getMyFamily(Long residentId);
}
