package com.bluemoon.bluemoon.service.impl;

import com.bluemoon.bluemoon.entity.FeeCategory;
import com.bluemoon.bluemoon.exception.ResourceNotFoundException;
import com.bluemoon.bluemoon.repository.FeeCategoryRepository;
import com.bluemoon.bluemoon.service.FeeCategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FeeCategoryServiceImpl implements FeeCategoryService {

    private final FeeCategoryRepository feeCategoryRepository;

    public FeeCategoryServiceImpl(FeeCategoryRepository feeCategoryRepository) {
        this.feeCategoryRepository = feeCategoryRepository;
    }

    @Override
    public FeeCategory create(FeeCategory feeCategory) {
        return feeCategoryRepository.save(feeCategory);
    }

    @Override
    public FeeCategory update(Long id, FeeCategory feeCategory) {
        FeeCategory existing = feeCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FeeCategory not found with id " + id));

        existing.setCode(feeCategory.getCode());
        existing.setName(feeCategory.getName());
        existing.setDescription(feeCategory.getDescription());
        existing.setUnit(feeCategory.getUnit());
        existing.setDefaultAmount(feeCategory.getDefaultAmount());
        existing.setFixedMonthly(feeCategory.getFixedMonthly());
        existing.setActive(feeCategory.getActive());

        return feeCategoryRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
    	if(!feeCategoryRepository.existsById(id)) {
    		throw new ResourceNotFoundException("FeeCategory not found with id " + id);
    	}
        feeCategoryRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public FeeCategory getById(Long id) {
        return feeCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FeeCategory not found with id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeCategory> getAll() {
        // Sort by ID ascending
        return feeCategoryRepository.findAll().stream()
                .sorted((a, b) -> Long.compare(a.getId() != null ? a.getId() : 0L, 
                                             b.getId() != null ? b.getId() : 0L))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeCategory> getActive() {
        return feeCategoryRepository.findByActiveTrue();
    }
}
