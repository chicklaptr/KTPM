package com.bluemoon.bluemoon.entity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "Role")
public class Role {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@NotNull @Size(max=50)
	@Column(name = "name"  , nullable = false , length = 50)
	private String name;
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	
}
