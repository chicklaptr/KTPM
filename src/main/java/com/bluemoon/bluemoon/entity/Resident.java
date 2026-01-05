package com.bluemoon.bluemoon.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "resident")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Resident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull @Size(max=100)
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Size(max=10)
    @Column(name = "gender", length = 10)
    private String gender;

    @Size(max=50)
    @Column(name = "id_number", length = 50)
    private String idNumber;

    @Size(max=20)
    @Column(name = "phone", length = 20)
    private String phone;

    @Size(max=50)
    @Column(name = "relation_to_head", length = 50)
    private String relationToHead;

    @Size(max=50)
    @Column(name = "residence_status", length = 50)
    private String residenceStatus;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"residents", "hibernateLazyInitializer", "handler"})
    private Household household;

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

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public LocalDate getDateOfBirth() {
		return dateOfBirth;
	}

	public void setDateOfBirth(LocalDate dateOfBirth) {
		this.dateOfBirth = dateOfBirth;
	}

	public String getGender() {
		return gender;
	}

	public void setGender(String gender) {
		this.gender = gender;
	}

	public String getIdNumber() {
		return idNumber;
	}

	public void setIdNumber(String idNumber) {
		this.idNumber = idNumber;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getRelationToHead() {
		return relationToHead;
	}

	public void setRelationToHead(String relationToHead) {
		this.relationToHead = relationToHead;
	}

	public String getResidenceStatus() {
		return residenceStatus;
	}

	public void setResidenceStatus(String residenceStatus) {
		this.residenceStatus = residenceStatus;
	}

	public Household getHousehold() {
		return household;
	}

	public void setHousehold(Household household) {
		this.household = household;
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
