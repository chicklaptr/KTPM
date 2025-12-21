package com.bluemoon.bluemoon.entity;

import jakarta.persistence.*;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "household")

public class Household {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 50)
    @Column(name = "household_code", nullable = false, unique = true, length = 50)
    private String householdCode;

    @NotBlank @Size(max=100)
    @Column(name = "owner_name", nullable = false, length = 100)
    private String ownerName;
    
    @NotBlank @Size(max=20)
    @Column(name = "apartment_number", nullable = false, length = 20)
    private String apartmentNumber;

    @Size(max=20)
    @Column(name = "phone", length = 20)
    private String phone;

    @Min(1)
    @Column(name = "members_count")
    private Integer membersCount;
    
    @Size(max=50)
    @Column(name = "residence_status", length = 50)
    private String residenceStatus;

    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @Column(name = "move_out_date")
    private LocalDate moveOutDate;
    
    @NotNull	
    @Column(name = "active")
    private Boolean active = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getHouseholdCode() {
		return householdCode;
	}

	public void setHouseholdCode(String householdCode) {
		this.householdCode = householdCode;
	}

	public String getOwnerName() {
		return ownerName;
	}

	public void setOwnerName(String ownerName) {
		this.ownerName = ownerName;
	}

	public String getApartmentNumber() {
		return apartmentNumber;
	}

	public void setApartmentNumber(String apartmentNumber) {
		this.apartmentNumber = apartmentNumber;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public Integer getMembersCount() {
		return membersCount;
	}

	public void setMembersCount(Integer membersCount) {
		this.membersCount = membersCount;
	}

	public String getResidenceStatus() {
		return residenceStatus;
	}

	public void setResidenceStatus(String residenceStatus) {
		this.residenceStatus = residenceStatus;
	}

	public LocalDate getMoveInDate() {
		return moveInDate;
	}

	public void setMoveInDate(LocalDate moveInDate) {
		this.moveInDate = moveInDate;
	}

	public LocalDate getMoveOutDate() {
		return moveOutDate;
	}

	public void setMoveOutDate(LocalDate moveOutDate) {
		this.moveOutDate = moveOutDate;
	}

	public Boolean getActive() {
		return active;
	}

	public void setActive(Boolean active) {
		this.active = active;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}
}
