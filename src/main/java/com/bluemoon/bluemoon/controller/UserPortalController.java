package com.bluemoon.bluemoon.controller;
import com.bluemoon.bluemoon.entity.Account;
import com.bluemoon.bluemoon.entity.Resident;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.exception.UnauthorizedException;
import com.bluemoon.bluemoon.entity.HouseholdFee;
import com.bluemoon.bluemoon.entity.Payment;
import com.bluemoon.bluemoon.repository.AccountRepository;
import com.bluemoon.bluemoon.repository.ResidentRepository;
import com.bluemoon.bluemoon.repository.HouseholdFeeRepository;
import com.bluemoon.bluemoon.repository.PaymentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.List;

@RestController
@RequestMapping("/api/user-portal")	
public class UserPortalController {
	private final ResidentRepository residentRepository;
	private final HouseholdFeeRepository  householdFeeRepository;
	private final PaymentRepository paymentRepository;
	
	public UserPortalController( ResidentRepository residentRepository,
			                      HouseholdFeeRepository householdFeeRepository,
			                      PaymentRepository paymentRepository) {
		this.residentRepository = residentRepository;
		this.householdFeeRepository = householdFeeRepository;
		this.paymentRepository = paymentRepository;
	}
	private Resident getLoggedInResident(HttpSession session) {
		Long residentId = (Long) session.getAttribute("residentId");
		if(residentId==null)	{
			throw new UnauthorizedException("Not logged in");
		}
		return residentRepository.findById(residentId)
				.orElseThrow(()-> new ResourceNotFoundException("Resident not found"));
	}
	
	@GetMapping("/profile")
	public ResponseEntity<Resident> getMyProfile(HttpSession session){
		Resident resident = getLoggedInResident(session);
		return ResponseEntity.ok(resident);
	}
	@GetMapping("/fees")
	public ResponseEntity<List<HouseholdFee>> getMyFees(HttpSession session){
		Resident resident = getLoggedInResident(session);
		if(resident.getHousehold()==null) {
			return ResponseEntity.notFound().build();
		}
		Long householdId = resident.getHousehold().getId();
		List<HouseholdFee> fees = householdFeeRepository.findByHouseholdId(householdId);
		return ResponseEntity.ok(fees);
	}	
	@GetMapping("/payments")
	public ResponseEntity<List<Payment>> getMyPayments(HttpSession session){
		Resident resident = getLoggedInResident(session);
		if(resident.getHousehold()==null) {
			return ResponseEntity.notFound().build();
		}
		Long householdId = resident.getHousehold().getId();
		List<Payment> payments = paymentRepository.findByHouseholdFee_Household_Id(householdId);
		return ResponseEntity.ok(payments);	
	}
	
	
	
	
	

}
