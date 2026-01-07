package com.bluemoon.bluemoon.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import jakarta.validation.constraints.*;
import jakarta.persistence.Entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "account")
public class Account {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@NotBlank @Size(max=50)
	@Column(name = "username", nullable = false, length = 50, unique = true)
	private String username;
	
	@NotBlank @Size(min=6,max=100)
	@Column(name = "password", nullable = false, length = 100)
	@JsonIgnore
	private String password;
	
	@NotNull
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "role_id", nullable = false)
	@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
	private Role role;
	
	
	@Column(name = "created_at")
	private LocalDateTime createdAt = LocalDateTime.now();
	
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    
    @OneToOne
    @JoinColumn(name = "resident_id")
    @JsonIgnoreProperties({"household", "hibernateLazyInitializer", "handler"})
    private Resident resident;
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public Role getRole() {
		return role;
	}
	public void setRole(Role role) {
		this.role = role;
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
	public Resident getResident() {
		return resident;
	}
	public void setResident(Resident resident) {
		this.resident = resident;
	}
	
    
}
