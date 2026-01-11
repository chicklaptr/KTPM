package com.bluemoon.bluemoon.service.impl;

import com.bluemoon.bluemoon.entity.BillingPeriod;
import com.bluemoon.bluemoon.entity.FeeCategory;
import com.bluemoon.bluemoon.entity.Household;
import com.bluemoon.bluemoon.entity.HouseholdFee;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.repository.BillingPeriodRepository;
import com.bluemoon.bluemoon.repository.FeeCategoryRepository;
import com.bluemoon.bluemoon.repository.HouseholdFeeRepository;
import com.bluemoon.bluemoon.repository.HouseholdRepository;
import com.bluemoon.bluemoon.service.HouseholdFeeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class HouseholdFeeServiceImpl implements HouseholdFeeService {

    private final HouseholdFeeRepository householdFeeRepository;
    private final BillingPeriodRepository billingPeriodRepository;

    // ✅ THÊM
    private final HouseholdRepository householdRepository;
    private final FeeCategoryRepository feeCategoryRepository;

    public HouseholdFeeServiceImpl(HouseholdFeeRepository householdFeeRepository,
                                  BillingPeriodRepository billingPeriodRepository,
                                  HouseholdRepository householdRepository,
                                  FeeCategoryRepository feeCategoryRepository) {
        this.householdFeeRepository = householdFeeRepository;
        this.billingPeriodRepository = billingPeriodRepository;

        // ✅ THÊM
        this.householdRepository = householdRepository;
        this.feeCategoryRepository = feeCategoryRepository;
    }

    @Override
    public List<HouseholdFee> getByHouseholdId(Long householdId) {
        List<HouseholdFee> fees = householdFeeRepository.findByHouseholdId(householdId);

        if (fees.isEmpty()) {
            throw new ResourceNotFoundException(
                "No household fees found for household id " + householdId
            );
        }

        return fees;
    }

    @Override
    public HouseholdFee create(HouseholdFee fee) {
        return householdFeeRepository.save(fee);
    }

    @Override
    public HouseholdFee update(Long id, HouseholdFee fee) {
        HouseholdFee existing = householdFeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HouseholdFee not found with id " + id));

        existing.setHousehold(fee.getHousehold());
        existing.setFeeCategory(fee.getFeeCategory());
        existing.setBillingPeriod(fee.getBillingPeriod());
        existing.setQuantity(fee.getQuantity());
        existing.setUnitPrice(fee.getUnitPrice());
        existing.setAmount(fee.getAmount());
        existing.setStatus(fee.getStatus());
        existing.setDueDate(fee.getDueDate());

        return householdFeeRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        if(!householdFeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("HouseholdFee not found with id " + id);
        }
        householdFeeRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public HouseholdFee getById(Long id) {
        return householdFeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HouseholdFee not found with id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HouseholdFee> getAll() {
        return householdFeeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<HouseholdFee> getByPeriodId(Long periodId) {
        if (!billingPeriodRepository.existsById(periodId)) {
            throw new ResourceNotFoundException("Billing period not found: " + periodId);
        }
        return householdFeeRepository.findByBillingPeriodId(periodId);
    }


    // ✅ THÊM: Sinh phí cho 1 kỳ thu (billing_period)
    // - fixedMonthly = true  -> amount = defaultAmount (tự có tiền)
    // - fixedMonthly = false -> amount = null (admin nhập sau)
    // NOTE: repo cần có existsByHouseholdIdAndFeeCategoryIdAndBillingPeriodId(...)
    @Override
    public List<HouseholdFee> generateForPeriod(Long periodId) {

        BillingPeriod period = billingPeriodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("BillingPeriod not found with id " + periodId));

        List<Household> households = householdRepository.findByActiveTrue();
        List<FeeCategory> categories = feeCategoryRepository.findByActiveTrue();

        List<HouseholdFee> created = new ArrayList<>();

        for (Household household : households) {
            for (FeeCategory category : categories) {

                boolean exists = householdFeeRepository
                        .existsByHouseholdIdAndFeeCategoryIdAndBillingPeriodId(
                                household.getId(),
                                category.getId(),
                                period.getId()
                        );

                if (exists) continue;

                HouseholdFee fee = new HouseholdFee();
                fee.setHousehold(household);
                fee.setFeeCategory(category);
                fee.setBillingPeriod(period);

                // snapshot giá mặc định
                fee.setUnitPrice(category.getDefaultAmount());

                if (Boolean.TRUE.equals(category.getFixedMonthly())) {
                    // phí cố định: có tiền ngay
                    fee.setAmount(category.getDefaultAmount());
                } else {
                    // phí tự nhập: admin nhập sau
                    fee.setAmount(null);
                }

                created.add(householdFeeRepository.save(fee));
            }
        }
        return created;
    }
}
