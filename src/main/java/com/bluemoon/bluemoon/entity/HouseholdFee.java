package com.bluemoon.bluemoon.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "household_fee")

public class HouseholdFee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fee_category_id", nullable = false)
    private FeeCategory feeCategory;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "billing_period_id", nullable = false)
    private BillingPeriod billingPeriod;

    @DecimalMin(value="0.0",inclusive = true)
    @Column(name = "quantity", precision = 15, scale = 2)
    private BigDecimal quantity;

    @DecimalMin(value="0.0",inclusive = true)
    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @DecimalMin(value="0.0",inclusive = true)
    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    @NotBlank @Size(max=20)
    @Column(name = "status", length = 20)
    private String status = "PENDING";

    @Column(name = "due_date")
    private LocalDate dueDate;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Household getHousehold() {
		return household;
	}

	public void setHousehold(Household household) {
		this.household = household;
	}

	public FeeCategory getFeeCategory() {
		return feeCategory;
	}

	public void setFeeCategory(FeeCategory feeCategory) {
		this.feeCategory = feeCategory;
	}

	public BillingPeriod getBillingPeriod() {
		return billingPeriod;
	}

	public void setBillingPeriod(BillingPeriod billingPeriod) {
		this.billingPeriod = billingPeriod;
	}

	public BigDecimal getQuantity() {
		return quantity;
	}

	public void setQuantity(BigDecimal quantity) {
		this.quantity = quantity;
	}

	public BigDecimal getUnitPrice() {
		return unitPrice;
	}

	public void setUnitPrice(BigDecimal unitPrice) {
		this.unitPrice = unitPrice;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public LocalDate getDueDate() {
		return dueDate;
	}

	public void setDueDate(LocalDate dueDate) {
		this.dueDate = dueDate;
	}
}
