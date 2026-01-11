package com.bluemoon.bluemoon.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import  java.time.LocalDate;

@Entity
@Table(name = "billing_period")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class BillingPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    
    @NotNull @Min(2000) @Max(2100)
    @Column(name = "year", nullable = false)
    private Integer year;
    
    @NotNull @Min(1) @Max(12)
    @Column(name = "month", nullable = false)
    private Integer month;
    
    @NotNull 
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @NotNull	
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @NotNull	
    @Column(name = "closed")
    private Boolean closed = false;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Integer getYear() {
		return year;
	}

	public void setYear(Integer year) {
		this.year = year;
	}

	public Integer getMonth() {
		return month;
	}

	public void setMonth(Integer month) {
		this.month = month;
	}

	public LocalDate getStartDate() {
		return startDate;
	}

	public void setStartDate(LocalDate startDate) {
		this.startDate = startDate;
	}

	public LocalDate getEndDate() {
		return endDate;
	}

	public void setEndDate(LocalDate endDate) {
		this.endDate = endDate;
	}

	public Boolean getClosed() {
		return closed;
	}

	public void setClosed(Boolean closed) {
		this.closed = closed;
	}
}
