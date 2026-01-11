// ==================================================
// 0. UTILS & SAFETY CHECK
// ==================================================
// Kiểm tra xem file money-utils.js có hoạt động không, nếu không thì dùng hàm dự phòng
if (typeof formatMoney === "undefined") {
  console.warn(
    "⚠️ Cảnh báo: Không tìm thấy money-utils.js. Đang dùng hàm dự phòng."
  );
  window.formatMoney = (amount) =>
    amount ? parseFloat(amount).toLocaleString("vi-VN") + "đ" : "0đ";
  window.toMoneyInteger = (amount) => (amount ? parseFloat(amount) : 0);
  window.addMoney = (a, b) => a + b;
  window.multiplyMoney = (a, b) => a * b;
  window.saveMoneyData = () => {};
  window.calculateTotalFromCells = () => 0;
}

// ==================================================
// 1. AUTH & INIT
// ==================================================
function checkAdminSession() {
  fetch("/api/auth/check-admin")
    .then((res) => {
      if (res.status === 401) window.location.href = "/login-admin.html";
    })
    .catch(() => {});
}

// ==================================================
// 2. QUẢN LÝ HỘ DÂN (HOUSEHOLDS)
// ==================================================
let editingHouseholdId = null;

function loadHouseholds() {
  fetch("/api/households", {
    credentials: 'same-origin'
  })
    .then((res) => res.json())
    .then((households) => {
      const tbody = document.getElementById("householdsTableBody");
      if (!tbody) return;
      tbody.innerHTML = "";

      if (!households || households.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="8" style="text-align:center">Không có dữ liệu</td></tr>';
        return;
      }

      households.sort((a, b) => (a.id || 0) - (b.id || 0));

      households.forEach((h) => {
        const statusHtml = h.active
          ? '<span style="color:green">Hoạt động</span>'
          : '<span style="color:red">Ngừng</span>';
        const row = `
                    <tr>
                        <td>${h.id}</td>
                        <td>${h.householdCode || ""}</td>
                        <td>${h.ownerName || ""}</td>
                        <td>${h.apartmentNumber || ""}</td>
                        <td>${h.phone || ""}</td>
                        <td>${h.membersCount || 0}</td>
                        <td>${statusHtml}</td>
                        <td>
                            <div style="display: flex; gap: 4px; align-items: center;">
                                <button class="btn-icon btn-view" onclick="viewHouseholdDetails(${
                                  h.id
                                })" title="Xem chi tiết">👁️</button>
                                <button class="btn-icon btn-edit" onclick="editHousehold(${
                              h.id
                                })" title="Sửa">✏️</button>
                                <button class="btn-icon btn-delete" onclick="deleteHousehold(${
                              h.id
                                })" title="Xóa">🗑️</button>
                            </div>
                        </td>
                    </tr>`;
        tbody.innerHTML += row;
      });
    })
    .catch((err) => console.error("Lỗi tải hộ dân:", err));
}

function openHouseholdForm() {
  editingHouseholdId = null;
  document.getElementById("householdFormTitle").textContent = "Thêm hộ dân mới";
  document.getElementById("householdForm").reset();
  document.getElementById("householdModal").style.display = "block";
}

let residentsData = []; // Lưu danh sách cư dân khi edit

function editHousehold(id) {
  editingHouseholdId = id;
  Promise.all([
    fetch(`/api/households/${id}`, {
      credentials: 'same-origin'
    }).then(r => r.json()),
    fetch(`/api/residents/by-household/${id}`, {
      credentials: 'same-origin'
    }).then(r => {
      if (!r.ok) return [];
      return r.json().then(data => Array.isArray(data) ? data : []);
    }).catch(() => [])
  ])
    .then(([h, residents]) => {
      document.getElementById("householdFormTitle").textContent =
        "Sửa thông tin hộ dân";
      document.getElementById("householdCode").value = h.householdCode || "";
      document.getElementById("ownerName").value = h.ownerName || "";
      document.getElementById("apartmentNumber").value =
        h.apartmentNumber || "";
      document.getElementById("phone").value = h.phone || "";
      document.getElementById("membersCount").value = h.membersCount || "";
      document.getElementById("residenceStatus").value =
        h.residenceStatus || "";
      document.getElementById("householdOwnsApartment").checked =
        h.ownsApartment === true;
      document.getElementById("householdActive").checked = h.active !== false;
      if (h.moveInDate)
        document.getElementById("moveInDate").value = h.moveInDate;
      if (h.moveOutDate)
        document.getElementById("moveOutDate").value = h.moveOutDate;
      
      // Hiển thị và load danh sách cư dân
      residentsData = residents || [];
      document.getElementById("residentsSection").style.display = "block";
      loadResidentsList();
      
      document.getElementById("householdModal").style.display = "block";
    })
    .catch(err => {
      console.error("Error loading household:", err);
      alert("Lỗi khi tải thông tin hộ gia đình");
    });
}

function openHouseholdForm() {
  editingHouseholdId = null;
  residentsData = [];
  document.getElementById("householdFormTitle").textContent = "Thêm hộ dân mới";
  document.getElementById("householdForm").reset();
  document.getElementById("residentsSection").style.display = "none";
  document.getElementById("householdModal").style.display = "block";
}

function loadResidentsList() {
  const container = document.getElementById("residentsList");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (residentsData.length === 0) {
    container.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">Chưa có cư dân nào</p>';
    return;
  }
  
  residentsData.forEach((resident, index) => {
    const residentRow = createResidentRow(resident, index);
    container.innerHTML += residentRow;
  });
}

function createResidentRow(resident, index) {
  const id = resident.id || `new_${index}`;
  const dateOfBirth = resident.dateOfBirth ? resident.dateOfBirth.split('T')[0] : '';
  
  return `
    <div class="resident-row" data-resident-id="${id}" style="
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
      border: 1px solid #e2e8f0;
    ">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 10px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-size: 12px;">Họ và tên *</label>
          <input type="text" class="resident-field" data-field="fullName" value="${resident.fullName || ''}" required maxlength="100" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-size: 12px;">Ngày sinh</label>
          <input type="date" class="resident-field" data-field="dateOfBirth" value="${dateOfBirth}" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-size: 12px;">Giới tính</label>
          <select class="resident-field" data-field="gender">
            <option value="">-- Chọn --</option>
            <option value="Nam" ${resident.gender === 'Nam' ? 'selected' : ''}>Nam</option>
            <option value="Nữ" ${resident.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
            <option value="Khác" ${resident.gender === 'Khác' ? 'selected' : ''}>Khác</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-size: 12px;">CMND/CCCD</label>
          <input type="text" class="resident-field" data-field="idNumber" value="${resident.idNumber || ''}" maxlength="50" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-size: 12px;">Số điện thoại</label>
          <input type="text" class="resident-field" data-field="phone" value="${resident.phone || ''}" maxlength="20" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-size: 12px;">Quan hệ với chủ hộ</label>
          <input type="text" class="resident-field" data-field="relationToHead" value="${resident.relationToHead || ''}" maxlength="50" placeholder="VD: Chủ hộ, Vợ, Con..." />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-size: 12px;">Tình trạng cư trú</label>
          <select class="resident-field" data-field="residenceStatus">
            <option value="">-- Chọn --</option>
            <option value="Active" ${resident.residenceStatus === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${resident.residenceStatus === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      </div>
      <div style="text-align: right;">
        <button type="button" class="btn-icon btn-delete" onclick="removeResidentRow(${index})" title="Xóa cư dân">🗑️</button>
      </div>
    </div>
  `;
}

function addResidentRow() {
  const newResident = {
    id: null,
    fullName: '',
    dateOfBirth: null,
    gender: '',
    idNumber: '',
    phone: '',
    relationToHead: '',
    residenceStatus: ''
  };
  residentsData.push(newResident);
  loadResidentsList();
  
  // Scroll to bottom
  const container = document.getElementById("residentsList");
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function removeResidentRow(index) {
  if (confirm("Bạn có chắc chắn muốn xóa cư dân này?")) {
    residentsData.splice(index, 1);
    loadResidentsList();
  }
}

// Lắng nghe thay đổi trong các field của cư dân
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('resident-field')) {
    const row = e.target.closest('.resident-row');
    if (!row) return;
    
    const residentId = row.dataset.residentId;
    const field = e.target.dataset.field;
    const value = e.target.value;
    
    const resident = residentsData.find(r => {
      const id = r.id || `new_${residentsData.indexOf(r)}`;
      return id.toString() === residentId;
    });
    
    if (resident) {
      if (field === 'dateOfBirth') {
        resident[field] = value || null;
      } else {
        resident[field] = value;
      }
    }
  }
});

document.addEventListener('change', function(e) {
  if (e.target.classList.contains('resident-field')) {
    const row = e.target.closest('.resident-row');
    if (!row) return;
    
    const residentId = row.dataset.residentId;
    const field = e.target.dataset.field;
    const value = e.target.value;
    
    const resident = residentsData.find(r => {
      const id = r.id || `new_${residentsData.indexOf(r)}`;
      return id.toString() === residentId;
    });
    
    if (resident) {
      resident[field] = value;
    }
  }
});

function saveHousehold(event) {
  event.preventDefault();
  const household = {
    householdCode: document.getElementById("householdCode").value.trim(),
    ownerName: document.getElementById("ownerName").value.trim(),
    apartmentNumber: document.getElementById("apartmentNumber").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    membersCount: parseInt(document.getElementById("membersCount").value) || 0,
    residenceStatus: document.getElementById("residenceStatus").value,
    ownsApartment: document.getElementById("householdOwnsApartment").checked,
    active: document.getElementById("householdActive").checked,
    moveInDate: document.getElementById("moveInDate").value || null,
    moveOutDate: document.getElementById("moveOutDate").value || null,
  };

  const url = editingHouseholdId
    ? `/api/households/${editingHouseholdId}`
    : "/api/households";
  const method = editingHouseholdId ? "PUT" : "POST";
  
  // Save household first

  fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    credentials: 'same-origin',
    body: JSON.stringify(household),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Lỗi lưu dữ liệu");
      return res.json();
    })
    .then((savedHousehold) => {
      // Nếu đang sửa và có danh sách cư dân, lưu cư dân
      if (editingHouseholdId && residentsData.length > 0) {
        return saveResidents(savedHousehold.id);
      }
      return Promise.resolve();
    })
    .then(() => {
      alert("Lưu thành công!");
      document.getElementById("householdModal").style.display = "none";
      loadHouseholds();
      residentsData = [];
    })
    .catch((err) => alert(err.message));
}

function saveResidents(householdId) {
  const promises = [];
  
  residentsData.forEach((resident) => {
    const residentData = {
      fullName: resident.fullName || '',
      dateOfBirth: resident.dateOfBirth || null,
      gender: resident.gender || null,
      idNumber: resident.idNumber || null,
      phone: resident.phone || null,
      relationToHead: resident.relationToHead || null,
      residenceStatus: resident.residenceStatus || null,
      household: { id: householdId }
    };
    
    if (resident.id) {
      // Update existing resident
      promises.push(
        fetch(`/api/residents/${resident.id}`, {
          method: 'PUT',
          headers: { "Content-Type": "application/json" },
          credentials: 'same-origin',
          body: JSON.stringify(residentData)
        })
      );
    } else {
      // Create new resident
      promises.push(
        fetch('/api/residents', {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          credentials: 'same-origin',
          body: JSON.stringify(residentData)
        })
      );
    }
  });
  
  return Promise.all(promises).then(responses => {
    const errors = responses.filter(r => !r.ok);
    if (errors.length > 0) {
      throw new Error("Một số cư dân không thể lưu được");
    }
  });
}

function deleteHousehold(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa?")) return;
  fetch(`/api/households/${id}`, { 
    method: "DELETE",
    credentials: 'same-origin'
  }).then(() => {
    alert("Xóa thành công!");
    loadHouseholds();
  });
}

// ==================================================
// 3. QUẢN LÝ LOẠI PHÍ (FEE CATEGORIES) - (Phần bạn bị thiếu)
// ==================================================
let editingFeeCategoryId = null;

function loadFeeCategories() {
  fetch("/api/fee-categories")
    .then((res) => res.json())
    .then((categories) => {
      const tbody = document.getElementById("feeCategoriesTableBody");
      if (!tbody) return;
      tbody.innerHTML = "";

      if (!categories || categories.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="9" style="text-align:center">Không có dữ liệu</td></tr>';
        return;
      }
      categories.sort((a, b) => (a.id || 0) - (b.id || 0));

      categories.forEach((cat) => {
        const row = `
                    <tr>
                        <td>${cat.id}</td>
                        <td><strong>${cat.code || ""}</strong></td>
                        <td>${cat.name || ""}</td>
                        <td>${cat.description || ""}</td>
                        <td>${cat.unit || ""}</td>
                        <td>${
                          cat.defaultAmount
                            ? formatMoney(cat.defaultAmount)
                            : ""
                        }</td>
                        <td>${cat.fixedMonthly ? "✓" : ""}</td>
                        <td>${
                          cat.active
                            ? '<span style="color:green">Hoạt động</span>'
                            : "Ngừng"
                        }</td>
                        <td>
                            <div style="display: flex; gap: 4px; align-items: center;">
                                <button class="btn-icon btn-edit" onclick="editFeeCategory(${
                              cat.id
                                })" title="Sửa">✏️</button>
                                <button class="btn-icon btn-delete" onclick="deleteFeeCategory(${
                              cat.id
                                })" title="Xóa">🗑️</button>
                            </div>
                        </td>
                    </tr>`;
        tbody.innerHTML += row;
      });
    })
    .catch((err) => console.error("Lỗi load loại phí:", err));
}

function openFeeCategoryForm() {
  editingFeeCategoryId = null;
  document.getElementById("feeCategoryFormTitle").textContent =
    "Thêm loại phí mới";
  document.getElementById("feeCategoryForm").reset();
  document.getElementById("feeCategoryModal").style.display = "block";
}

function editFeeCategory(id) {
  editingFeeCategoryId = id;
  fetch(`/api/fee-categories/${id}`)
    .then((res) => res.json())
    .then((cat) => {
      document.getElementById("feeCategoryFormTitle").textContent =
        "Sửa loại phí";
      document.getElementById("feeCategoryCode").value = cat.code;
      document.getElementById("feeCategoryName").value = cat.name;
      document.getElementById("feeCategoryDescription").value =
        cat.description || "";
      document.getElementById("feeCategoryUnit").value = cat.unit || "";
      document.getElementById("feeCategoryDefaultAmount").value =
        cat.defaultAmount || "";
      document.getElementById("feeCategoryFixedMonthly").checked =
        cat.fixedMonthly;
      document.getElementById("feeCategoryActive").checked = cat.active;
      document.getElementById("feeCategoryModal").style.display = "block";
    });
}

function saveFeeCategory(event) {
  event.preventDefault();
  const category = {
    code: document.getElementById("feeCategoryCode").value.trim(),
    name: document.getElementById("feeCategoryName").value.trim(),
    description: document.getElementById("feeCategoryDescription").value.trim(),
    unit: document.getElementById("feeCategoryUnit").value.trim(),
    defaultAmount: document.getElementById("feeCategoryDefaultAmount").value,
    fixedMonthly: document.getElementById("feeCategoryFixedMonthly").checked,
    active: document.getElementById("feeCategoryActive").checked,
  };

  const url = editingFeeCategoryId
    ? `/api/fee-categories/${editingFeeCategoryId}`
    : "/api/fee-categories";
  const method = editingFeeCategoryId ? "PUT" : "POST";

  fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(category),
  }).then((res) => {
    if (res.ok) {
      alert("Lưu thành công");
      document.getElementById("feeCategoryModal").style.display = "none";
      loadFeeCategories();
    } else {
      alert("Lỗi khi lưu");
    }
  });
}

function deleteFeeCategory(id) {
  if (confirm("Bạn có chắc chắn xóa?")) {
    fetch(`/api/fee-categories/${id}`, { method: "DELETE" }).then((res) => {
      if (res.ok) {
        alert("Xóa thành công");
        loadFeeCategories();
      } else {
        alert("Lỗi khi xóa");
      }
    });
  }
}

// ==================================================
// 4. QUẢN LÝ KỲ THU PHÍ (BILLING PERIODS)
// ==================================================
let editingPeriodId = null;

function loadBillingPeriods() {
  fetch("/api/billing-periods")
    .then((res) => res.json())
    .then((periods) => {
      const tbody = document.getElementById("billingPeriodsTableBody");
      if (!tbody) return;
      tbody.innerHTML = "";

      if (!periods || periods.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" style="text-align:center">Không có dữ liệu</td></tr>';
        return;
      }

      periods.forEach((p) => {
        const status = p.closed
          ? '<span style="color:red">Đã đóng</span>'
          : '<span style="color:green">Mở</span>';
        const row = `
                    <tr>
                        <td>${p.id}</td>
                        <td>Tháng ${p.month}/${p.year}</td>
                        <td>${p.startDate}</td>
                        <td>${p.endDate}</td>
                        <td>${status}</td>
                        <td>
                            <div style="display: flex; gap: 4px; align-items: center;">
                                <button class="btn-icon btn-edit" onclick="editBillingPeriod(${p.id})" title="Sửa">✏️</button>
                                <button class="btn-icon btn-delete" onclick="deleteBillingPeriod(${p.id})" title="Xóa">🗑️</button>
                            </div>
                        </td>
                    </tr>`;
        tbody.innerHTML += row;
      });
    });
}

function openBillingPeriodForm() {
  editingPeriodId = null;
  document.getElementById("billingPeriodFormTitle").textContent =
    "Tạo kỳ thu phí";
  document.getElementById("billingPeriodForm").reset();
  document.getElementById("billingPeriodModal").style.display = "block";
}

function editBillingPeriod(id) {
  editingPeriodId = id;
  fetch(`/api/billing-periods/${id}`)
    .then((res) => res.json())
    .then((p) => {
      document.getElementById("billingPeriodFormTitle").textContent =
        "Sửa kỳ thu phí";
      document.getElementById("periodYear").value = p.year;
      document.getElementById("periodMonth").value = p.month;
      document.getElementById("periodStartDate").value = p.startDate;
      document.getElementById("periodEndDate").value = p.endDate;
      document.getElementById("periodClosed").checked = p.closed;
      document.getElementById("billingPeriodModal").style.display = "block";
    });
}

function saveBillingPeriod(event) {
  event.preventDefault();

  const period = {
    year: document.getElementById("periodYear").value,
    month: document.getElementById("periodMonth").value,
    startDate: document.getElementById("periodStartDate").value,
    endDate: document.getElementById("periodEndDate").value,
    closed: document.getElementById("periodClosed").checked,
  };

  const isCreate = !editingPeriodId;

  const url = isCreate
    ? "/api/billing-periods"
    : `/api/billing-periods/${editingPeriodId}`;

  const method = isCreate ? "POST" : "PUT";

  fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(period),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Lỗi khi lưu period");

      // ⚠️ POST phải trả về BillingPeriod có id
      return isCreate ? res.json() : null;
    })
    .then(async (createdPeriod) => {
      if (isCreate && createdPeriod?.id) {
        // 👉 GỌI GENERATE household_fee
		console.log("createdPeriod=", createdPeriod);

        await fetch(`/api/household-fees/generate/${createdPeriod.id}`, {
          method: "POST",
        });
      }

      alert("Lưu thành công");
      document.getElementById("billingPeriodModal").style.display = "none";

      loadBillingPeriods();

      // (không bắt buộc)
      // loadStatistics();
      // displayStatisticsByPeriod(createdPeriod.id);
    })
    .catch((err) => {
      console.error(err);
      alert("Lỗi khi lưu");
    });
}

function deleteBillingPeriod(id) {
  if (confirm("Xóa kỳ thu phí này?")) {
    fetch(`/api/billing-periods/${id}`, { method: "DELETE" }).then((res) => {
      if (res.ok) {
        loadBillingPeriods();
      } else {
        alert("Không thể xóa (có thể đã có dữ liệu phí)");
      }
    });
  }
}

// ==================================================
// 5. QUẢN LÝ TÀI KHOẢN (ACCOUNTS)
// ==================================================
let editingAccountId = null;

function loadAccounts() {
  fetch("/api/accounts")
    .then((res) => res.json())
    .then((accounts) => {
      const tbody = document.getElementById("accountsTableBody");
      if (!tbody) return;
      tbody.innerHTML = "";

      if (!accounts || accounts.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" style="text-align:center">Không có dữ liệu</td></tr>';
        return;
      }

      accounts.forEach((acc) => {
        const roleName = acc.role ? acc.role.name : "";
        const residentName = acc.resident ? acc.resident.fullName : "N/A";
        const row = `
                    <tr>
                        <td>${acc.id}</td>
                        <td>${acc.username}</td>
                        <td>${roleName}</td>
                        <td>${residentName}</td>
                        <td>${
                          acc.createdAt
                            ? new Date(acc.createdAt).toLocaleDateString()
                            : ""
                        }</td>
                        <td>
                            <div style="display: flex; gap: 4px; align-items: center;">
                                <button class="btn-icon btn-edit" onclick="editAccount(${
                              acc.id
                                })" title="Sửa">✏️</button>
                                <button class="btn-icon btn-delete" onclick="deleteAccount(${
                              acc.id
                                })" title="Xóa">🗑️</button>
                            </div>
                        </td>
                    </tr>`;
        tbody.innerHTML += row;
      });
    });
}

function openAccountForm() {
  editingAccountId = null;
  document.getElementById("accountFormTitle").textContent = "Tạo tài khoản mới";
  document.getElementById("accountForm").reset();
  loadRoles();
  loadResidents();
  document.getElementById("accountModal").style.display = "block";
}

function loadRoles() {
  // Hardcode role options for simplicity, or fetch from API
  const select = document.getElementById("accountRoleId");
  select.innerHTML = `
        <option value="">-- Chọn vai trò --</option>
        <option value="1">RESIDENT</option>
        <option value="2">ADMIN</option>
    `;
}

function loadResidents() {
  fetch("/api/residents")
    .then((res) => res.json())
    .then((data) => {
      const select = document.getElementById("accountResidentId");
      select.innerHTML = '<option value="">-- Chọn cư dân --</option>';
      data.forEach((r) => {
        select.innerHTML += `<option value="${r.id}">${r.fullName} - ${r.householdCode}</option>`;
      });
    });
}

function editAccount(id) {
  editingAccountId = id;
  loadRoles();
  loadResidents();
  fetch(`/api/accounts/${id}`)
    .then((res) => res.json())
    .then((acc) => {
      document.getElementById("accountUsername").value = acc.username;
      document.getElementById("accountRoleId").value = acc.role.id;
      if (acc.resident)
        document.getElementById("accountResidentId").value = acc.resident.id;
      document.getElementById("accountModal").style.display = "block";
    });
}

function saveAccount(event) {
  event.preventDefault();
  const account = {
    username: document.getElementById("accountUsername").value,
    roleId: document.getElementById("accountRoleId").value,
    residentId: document.getElementById("accountResidentId").value || null,
  };

  const pass = document.getElementById("accountPassword").value;
  if (pass) account.password = pass;

  const url = editingAccountId
    ? `/api/accounts/${editingAccountId}`
    : "/api/accounts";
  const method = editingAccountId ? "PUT" : "POST";

  fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  }).then((res) => {
    if (res.ok) {
      alert("Lưu thành công");
      document.getElementById("accountModal").style.display = "none";
      loadAccounts();
    } else {
      alert("Lỗi khi lưu");
    }
  });
}

function deleteAccount(id) {
  if (confirm("Xóa tài khoản này?")) {
    fetch(`/api/accounts/${id}`, { method: "DELETE" }).then(() =>
      loadAccounts()
    );
  }
}

function filterAccounts() {
  const term = document.getElementById("searchAccount").value.toLowerCase();
  const rows = document.querySelectorAll("#accountsTableBody tr");
  rows.forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(term)
      ? ""
      : "none";
  });
}

// ==================================================
// 6. THỐNG KÊ & BÁO CÁO (STATISTICS & REPORTS)
// ==================================================

function loadStatistics() {
  const periodId = document.getElementById("statsPeriodSelect")?.value;
  const statsContent = document.getElementById("costStatsContent");
  
  // Load danh sách kỳ thu phí vào dropdown thống kê
  fetch("/api/billing-periods")
    .then((res) => res.json())
    .then((periods) => {
      const select = document.getElementById("statsPeriodSelect");
      if (select) {
        // Sắp xếp kỳ mới nhất lên đầu
        periods.sort((a, b) => b.year - a.year || b.month - a.month);

        select.innerHTML = '<option value="">-- Chọn kỳ thu phí --</option>';
        select.innerHTML += '<option value="all">📊 Tất cả</option>';
        periods.forEach((p) => {
          const selected = periodId && p.id == periodId ? 'selected' : '';
          select.innerHTML += `<option value="${p.id}" ${selected}>Tháng ${p.month}/${p.year}</option>`;
        });
      }
      
      // Nếu đã chọn kỳ thu phí, hiển thị thống kê
      if (periodId) {
        displayStatisticsByPeriod(periodId);
      } else {
        if (statsContent) {
          statsContent.innerHTML = '<p>Vui lòng chọn kỳ thu phí để xem thống kê</p>';
        }
      }
    })
    .catch((err) => console.error("Lỗi load kỳ thu phí:", err));
}

// Hàm xử lý khi chọn kỳ thu phí
function onPeriodSelectChange() {
  const periodId = document.getElementById("statsPeriodSelect")?.value;
  if (periodId === 'all') {
    displayAllPeriodsStatistics();
  } else if (periodId) {
    displayStatisticsByPeriod(periodId);
  } else {
    const statsContent = document.getElementById("costStatsContent");
    if (statsContent) {
      statsContent.innerHTML = '<p>Vui lòng chọn kỳ thu phí để xem thống kê</p>';
    }
  }
}

// Hàm refresh thống kê (tải lại dữ liệu)
function refreshStatistics() {
  const periodId = document.getElementById("statsPeriodSelect")?.value;
  if (periodId === 'all') {
    displayAllPeriodsStatistics();
  } else if (periodId) {
    displayStatisticsByPeriod(periodId);
  } else {
    loadStatistics(); // Load lại dropdown và chọn kỳ nếu có
  }
}

// Hiển thị thống kê chi phí theo kỳ thu phí
function displayStatisticsByPeriod(periodId) {
  const statsContent = document.getElementById("costStatsContent");
  if (!statsContent) return;
  
  statsContent.innerHTML = '<p>Đang tải dữ liệu...</p>';
  
  // Lấy thông tin kỳ thu phí và danh sách phí
  Promise.all([
    fetch(`/api/billing-periods/${periodId}`, {
      credentials: 'same-origin'
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      }),
    fetch(`/api/household-fees/by-period/${periodId}`, {
      credentials: 'same-origin' // Đảm bảo gửi session cookie
    })
      .then(async r => {
        if (!r.ok) {
          console.warn('Error fetching fees:', r.status, r.statusText);
          // Thử đọc error message
          try {
            const errorData = await r.json();
            console.warn('Error data:', errorData);
          } catch (e) {
            // Ignore
          }
          return []; // Trả về array rỗng nếu lỗi
        }
        return r.json().then(data => {
          // Đảm bảo luôn trả về array
          if (!Array.isArray(data)) {
            console.warn('Fees response is not an array:', data);
            return [];
          }
          return data;
        }).catch(err => {
          console.error('Error parsing fees JSON:', err);
          return [];
        });
      }),
    fetch('/api/households', {
      credentials: 'same-origin'
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json().then(data => {
          if (!Array.isArray(data)) {
            console.warn('Households response is not an array:', data);
            return [];
          }
          return data;
        });
      }),
    fetch('/api/fee-categories/active', {
      credentials: 'same-origin'
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json().then(data => {
          if (!Array.isArray(data)) {
            console.warn('Categories response is not an array:', data);
            return [];
          }
          return data;
        });
      })
  ])
  .then(([period, fees, households, categories]) => {
    // Đảm bảo tất cả đều là array
    if (!Array.isArray(fees)) {
      console.error('Fees is not an array:', fees);
      fees = [];
    }
    if (!Array.isArray(households)) {
      console.error('Households is not an array:', households);
      households = [];
    }
    if (!Array.isArray(categories)) {
      console.error('Categories is not an array:', categories);
      categories = [];
    }
    
    if (!period) {
      statsContent.innerHTML = '<p style="color: red;">Không tìm thấy kỳ thu phí</p>';
      return;
    }
    
    // Nhóm phí theo household
    const feesByHousehold = {};
    fees.forEach(fee => {
      const householdId = fee.household?.id;
      if (!householdId) return;
      
      if (!feesByHousehold[householdId]) {
        feesByHousehold[householdId] = {
          household: fee.household,
          fees: []
        };
      }
      feesByHousehold[householdId].fees.push(fee);
    });
    
    // Tính tổng thống kê - chỉ tính từ các phí đã có (không tính các phí chưa tạo)
    let totalHouseholds = households.filter(h => h.active !== false).length;
    let totalFees = fees.length; // Số phí đã được tạo
    // Hỗ trợ cả UNPAID (từ DB) và PENDING (tương thích)
    let totalPaid = fees.filter(f => f.status === 'PAID').length;
    let totalPending = fees.filter(f => f.status === 'PENDING' || f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID').length;
    let totalOverdue = fees.filter(f => f.status === 'OVERDUE').length;
    
    // Tính tổng tiền từ các phí đã có
    let grandTotal = 0;
    fees.forEach(fee => {
      if (fee.amount) {
        grandTotal += parseFloat(fee.amount) || 0;
      }
    });
    
    // Tạo HTML thống kê tổng quan
    let html = `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Kỳ thu phí: Tháng ${period.month}/${period.year}</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
          <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="color: #666; font-size: 14px;">Tổng số hộ dân</div>
            <div style="font-size: 24px; font-weight: bold; color: #3498db;">${totalHouseholds}</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="color: #666; font-size: 14px;">Tổng số phí</div>
            <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${totalFees}</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="color: #666; font-size: 14px;">Đã thanh toán</div>
            <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${totalPaid}</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="color: #666; font-size: 14px;">Chờ thanh toán</div>
            <div style="font-size: 24px; font-weight: bold; color: #f39c12;">${totalPending}</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="color: #666; font-size: 14px;">Quá hạn</div>
            <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${totalOverdue}</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="color: #666; font-size: 14px;">Tổng tiền</div>
            <div style="font-size: 24px; font-weight: bold; color: #e67e22;">${grandTotal.toLocaleString('vi-VN')}đ</div>
          </div>
        </div>
      </div>
    `;
    
    // Tạo map phí theo household và category để dễ tra cứu
    const feeMap = {};
    fees.forEach(fee => {
      const householdId = fee.household?.id;
      const categoryId = fee.feeCategory?.id;
      if (householdId && categoryId) {
        const key = `${householdId}_${categoryId}`;
        feeMap[key] = fee;
      }
    });
    
    // Hiển thị thống kê từng hộ - hiển thị TẤT CẢ các loại phí active
    households.sort((a, b) => (a.id || 0) - (b.id || 0)).forEach(household => {
      // Tính tổng tiền của hộ từ các phí đã có
      let householdTotal = 0;
      let householdPaid = 0;
      let householdPending = 0;
      let householdOverdue = 0;
      
      // Duyệt qua TẤT CẢ các loại phí active để tính tổng
      categories.forEach(category => {
        const key = `${household.id}_${category.id}`;
        const fee = feeMap[key];
        if (fee && fee.amount) {
          householdTotal += parseFloat(fee.amount) || 0;
          // Hỗ trợ cả UNPAID (từ DB) và PENDING (tương thích)
          if (fee.status === 'PAID') householdPaid++;
          else if (fee.status === 'PENDING' || fee.status === 'UNPAID') householdPending++;
          else if (fee.status === 'PARTIALLY_PAID') householdPending++; // Đếm vào pending
          else if (fee.status === 'OVERDUE') householdOverdue++;
        }
      });
      
      html += `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #ecf0f1;">
            <div>
              <h3 style="margin: 0; color: #2c3e50;">${household.householdCode || ''} - ${household.ownerName || ''}</h3>
              <div style="color: #7f8c8d; font-size: 14px; margin-top: 5px;">
                Căn hộ: ${household.apartmentNumber || ''} | SĐT: ${household.phone || 'N/A'}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 20px; font-weight: bold; color: #e67e22;">
                ${householdTotal.toLocaleString('vi-VN')}đ
              </div>
              <div style="font-size: 12px; color: #7f8c8d;">
                ${householdPaid} đã trả / ${householdPending} chờ / ${householdOverdue} quá hạn
              </div>
            </div>
          </div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #ecf0f1;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Loại phí</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Đơn vị</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Số lượng</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Đơn giá</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Thành tiền</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Trạng thái</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Loại</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      // Hiển thị TẤT CẢ các loại phí active cho hộ này
      categories.sort((a, b) => (a.id || 0) - (b.id || 0)).forEach(category => {
        const key = `${household.id}_${category.id}`;
        const fee = feeMap[key];
        
        // Nếu có phí, dùng dữ liệu từ phí; nếu không, hiển thị với giá trị mặc định
        const amount = fee && fee.amount ? parseFloat(fee.amount) : 0;
        const quantity = fee && fee.quantity ? parseFloat(fee.quantity) : '';
        const unitPrice = fee && fee.unitPrice ? parseFloat(fee.unitPrice) : (category.defaultAmount ? parseFloat(category.defaultAmount) : '');
        
        // Lấy trạng thái từ database (có thể là UNPAID, PAID, PARTIALLY_PAID, OVERDUE)
        const dbStatus = fee ? fee.status : 'UNPAID';
        
        // Mapping từ database sang hiển thị
        // UNPAID -> PENDING (Chờ trả) - màu vàng
        // PAID -> PAID (Đã trả) - màu xanh lá
        // PARTIALLY_PAID -> PARTIALLY_PAID (Đã trả một phần) - màu xanh dương
        // OVERDUE -> OVERDUE (Quá hạn) - màu đỏ
        
        const statusColor = dbStatus === 'PAID' ? '#27ae60' : 
                          dbStatus === 'UNPAID' || dbStatus === 'PENDING' ? '#f39c12' : 
                          dbStatus === 'PARTIALLY_PAID' ? '#3498db' : '#e74c3c';
        const statusText = dbStatus === 'PAID' ? 'Đã trả' :
                          dbStatus === 'UNPAID' || dbStatus === 'PENDING' ? 'Chờ trả' :
                          dbStatus === 'PARTIALLY_PAID' ? 'Đã trả một phần' : 'Quá hạn';
        
        const isFixed = category.fixedMonthly ? 'Cố định' : 'Tự nhập';
        const fixedColor = category.fixedMonthly ? '#27ae60' : '#3498db';
        
        const feeId = fee ? fee.id : null;
        const householdId = household.id;
        const categoryId = category.id;
        
        // Tạo input cho số lượng (chỉ cho phép chỉnh sửa nếu có fee)
        const quantityInput = feeId ? 
          `<input type="number" 
                  id="qty_${feeId}" 
                  value="${quantity !== '' ? quantity : ''}" 
                  min="0" 
                  step="1"
                  onchange="updateFeeQuantity(${feeId}, ${householdId}, ${categoryId}, ${unitPrice !== '' ? unitPrice : 0})"
                  style="width: 100px; padding: 5px; border: 2px solid #667eea; border-radius: 4px; text-align: right; font-size: 14px;"
                  title="Nhấn Enter hoặc click ra ngoài để lưu">` :
          `<span style="color: #95a5a6;">-</span>`;
        
        // Tạo select cho trạng thái (chỉ cho phép chỉnh sửa nếu có fee)
        // Sử dụng giá trị từ database (UNPAID, PAID, PARTIALLY_PAID, OVERDUE)
        const statusSelect = feeId ?
          `<select id="status_${feeId}" 
                   onchange="updateFeeStatus(${feeId}, ${householdId}, ${categoryId})"
                   style="padding: 5px 8px; border: 2px solid #667eea; border-radius: 4px; font-size: 13px; font-weight: bold; color: ${statusColor}; cursor: pointer; background: white;">
            <option value="UNPAID" ${dbStatus === 'UNPAID' || dbStatus === 'PENDING' ? 'selected' : ''} style="color: #f39c12;">Chờ trả</option>
            <option value="PAID" ${dbStatus === 'PAID' ? 'selected' : ''} style="color: #27ae60;">Đã trả</option>
            <option value="PARTIALLY_PAID" ${dbStatus === 'PARTIALLY_PAID' ? 'selected' : ''} style="color: #3498db;">Đã trả một phần</option>
            <option value="OVERDUE" ${dbStatus === 'OVERDUE' ? 'selected' : ''} style="color: #e74c3c;">Quá hạn</option>
          </select>` :
          `<span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>`;
        
        html += `
          <tr data-fee-id="${feeId || ''}" data-household-id="${householdId}" data-category-id="${categoryId}">
            <td style="padding: 10px; border: 1px solid #ddd;">
              <strong>${category.name || ''}</strong>
              ${category.description ? `<br><small style="color: #7f8c8d;">${category.description}</small>` : ''}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd;">${category.unit || 'N/A'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">
              ${quantityInput}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">
              ${unitPrice !== '' ? parseFloat(unitPrice).toLocaleString('vi-VN') + 'đ' : '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;" id="amount_${feeId || 'new_' + householdId + '_' + categoryId}">
              ${amount > 0 ? amount.toLocaleString('vi-VN') + 'đ' : '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
              ${statusSelect}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
              <span style="color: ${fixedColor}; font-weight: bold;">${isFixed}</span>
            </td>
          </tr>
        `;
      });
      
      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    });
    
    statsContent.innerHTML = html;
  })
  .catch(err => {
    console.error('Error loading statistics:', err);
    let errorMessage = err.message || 'Lỗi không xác định';
    
    // Kiểm tra nếu là lỗi authentication
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorMessage = 'Bạn cần đăng nhập lại. Vui lòng refresh trang.';
    }
    
    statsContent.innerHTML = `
      <div style="background: #fee; padding: 20px; border-radius: 8px; border: 1px solid #fcc;">
        <h3 style="color: #c33; margin-top: 0;">⚠️ Lỗi khi tải dữ liệu</h3>
        <p style="color: #c33; margin-bottom: 10px;"><strong>Chi tiết:</strong> ${errorMessage}</p>
        <button class="btn" onclick="loadStatistics()" style="margin-top: 10px;">Thử lại</button>
      </div>
    `;
  });
}

// Hiển thị thống kê tất cả các kỳ với biểu đồ
function displayAllPeriodsStatistics() {
  const statsContent = document.getElementById("costStatsContent");
  if (!statsContent) return;
  
  statsContent.innerHTML = '<p>Đang tải dữ liệu...</p>';
  
  Promise.all([
    fetch('/api/billing-periods', { credentials: 'same-origin' }).then(r => r.ok ? r.json().then(d => Array.isArray(d) ? d : []) : []),
    fetch('/api/household-fees', { credentials: 'same-origin' }).then(async r => r.ok ? r.json().then(d => Array.isArray(d) ? d : []).catch(() => []) : []),
    fetch('/api/payments', { credentials: 'same-origin' }).then(async r => r.ok ? r.json().then(d => Array.isArray(d) ? d : []).catch(() => []) : []),
    fetch('/api/households', { credentials: 'same-origin' }).then(r => r.ok ? r.json().then(d => Array.isArray(d) ? d : []) : [])
  ])
  .then(([periods, fees, payments, households]) => {
    periods.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
    
    const revenueByPeriod = {};
    const periodLabels = [];
    
    periods.forEach(period => {
      const periodFees = fees.filter(f => f.billingPeriod?.id === period.id);
      const totalRevenue = periodFees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);
      const periodKey = `Tháng ${period.month}/${period.year}`;
      revenueByPeriod[period.id] = { label: periodKey, revenue: totalRevenue, fees: periodFees };
      periodLabels.push(periodKey);
    });
    
    const totalRevenue = Object.values(revenueByPeriod).reduce((sum, p) => sum + p.revenue, 0);
    let paidCount = 0, overdueCount = 0, pendingCount = 0;
    fees.forEach(fee => {
      if (fee.status === 'PAID') paidCount++;
      else if (fee.status === 'OVERDUE') overdueCount++;
      else if (fee.status === 'PENDING') pendingCount++;
    });
    
    let html = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">📊 Thống kê tổng hợp tất cả các kỳ</h2>
        <p style="margin: 0; opacity: 0.9; font-size: 16px;">Tổng doanh thu: <strong style="font-size: 24px;">${totalRevenue.toLocaleString('vi-VN')}đ</strong></p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px; font-weight: 600;">📈 Doanh thu qua các kỳ</h3>
          <canvas id="revenueChart" style="max-height: 400px;"></canvas>
        </div>
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px; font-weight: 600;">🥧 Tỉ lệ thanh toán</h3>
          <canvas id="paymentChart" style="max-height: 400px;"></canvas>
        </div>
      </div>
      <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px; font-weight: 600;">📋 Chi tiết từng kỳ</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Kỳ thu phí</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Tổng doanh thu</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Đã trả</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Chờ trả</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Quá hạn</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Tổng số phí</th>
              </tr>
            </thead>
            <tbody>`;
    
    periods.forEach(period => {
      const p = revenueByPeriod[period.id];
      const paid = p.fees.filter(f => f.status === 'PAID').length;
      const pending = p.fees.filter(f => f.status === 'PENDING').length;
      const overdue = p.fees.filter(f => f.status === 'OVERDUE').length;
      html += `<tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: 600;">${p.label}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #e67e22; font-weight: 600;">${p.revenue.toLocaleString('vi-VN')}đ</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #27ae60; font-weight: 600;">${paid}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #f39c12; font-weight: 600;">${pending}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #e74c3c; font-weight: 600;">${overdue}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: 600;">${p.fees.length}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
    statsContent.innerHTML = html;
    
    setTimeout(() => {
      const revenueCtx = document.getElementById('revenueChart');
      if (revenueCtx && typeof Chart !== 'undefined') {
        const revenueValues = periods.map(p => revenueByPeriod[p.id].revenue);
        const maxRevenue = Math.max(...revenueValues, 0);
        const suggestedMax = maxRevenue * 1.25;
        let stepSize;
        if (suggestedMax >= 10000000) {
          stepSize = Math.ceil(suggestedMax / 5 / 1000000) * 1000000;
        } else if (suggestedMax >= 1000000) {
          stepSize = Math.ceil(suggestedMax / 5 / 100000) * 100000;
        } else if (suggestedMax >= 100000) {
          stepSize = Math.ceil(suggestedMax / 5 / 10000) * 10000;
        } else {
          stepSize = Math.ceil(suggestedMax / 5 / 1000) * 1000;
        }
        
        new Chart(revenueCtx, {
          type: 'bar',
          data: {
            labels: periodLabels,
            datasets: [{
              label: 'Doanh thu (đ)',
              data: revenueValues,
              backgroundColor: 'rgba(102, 126, 234, 0.8)',
              borderColor: 'rgba(102, 126, 234, 1)',
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                callbacks: {
                  label: function(context) {
                    return 'Doanh thu: ' + context.parsed.y.toLocaleString('vi-VN') + 'đ';
                  }
                }
              },
              datalabels: {
                anchor: 'end',
                align: 'top',
                color: '#2c3e50',
                font: {
                  size: 11,
                  weight: 'bold',
                  family: "'Inter', sans-serif"
                },
                formatter: function(value) {
                  if (value >= 1000000) {
                    return (value / 1000000).toFixed(1) + 'M';
                  } else if (value >= 1000) {
                    return (value / 1000).toFixed(0) + 'K';
                  }
                  return value.toLocaleString('vi-VN');
                },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: 'rgba(102, 126, 234, 0.6)',
                borderWidth: 1.5,
                borderRadius: 5,
                padding: {
                  top: 4,
                  right: 6,
                  bottom: 4,
                  left: 6
                },
                display: function(context) {
                  return context.dataset.data[context.dataIndex] > 0;
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                suggestedMax: suggestedMax,
                ticks: {
                  stepSize: stepSize,
                  callback: function(value) { return value.toLocaleString('vi-VN') + 'đ'; },
                  font: { size: 11 },
                  padding: 10
                },
                grid: { 
                  color: 'rgba(0, 0, 0, 0.05)',
                  lineWidth: 1
                }
              },
              x: {
                ticks: { font: { size: 11 } },
                grid: { display: false }
              }
            }
          }
        });
      }
      
      const paymentCtx = document.getElementById('paymentChart');
      if (paymentCtx && typeof Chart !== 'undefined') {
        const totalPayments = paidCount + overdueCount + pendingCount;
        const paidPercent = totalPayments > 0 ? ((paidCount / totalPayments) * 100).toFixed(1) : 0;
        const overduePercent = totalPayments > 0 ? ((overdueCount / totalPayments) * 100).toFixed(1) : 0;
        const pendingPercent = totalPayments > 0 ? ((pendingCount / totalPayments) * 100).toFixed(1) : 0;
        
        new Chart(paymentCtx, {
          type: 'doughnut',
          data: {
            labels: ['Đã trả đúng hạn', 'Quá hạn', 'Chờ trả'],
            datasets: [{
              data: [paidCount, overdueCount, pendingCount],
              backgroundColor: ['rgba(39, 174, 96, 0.8)', 'rgba(231, 76, 60, 0.8)', 'rgba(243, 156, 18, 0.8)'],
              borderColor: ['rgba(39, 174, 96, 1)', 'rgba(231, 76, 60, 1)', 'rgba(243, 156, 18, 1)'],
              borderWidth: 3,
              hoverOffset: 10
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 15,
                  font: { size: 13, weight: '500' },
                  usePointStyle: true,
                  pointStyle: 'circle',
                  generateLabels: function(chart) {
                    const data = chart.data;
                    if (data.labels.length && data.datasets.length) {
                      return data.labels.map((label, i) => {
                        const value = data.datasets[0].data[i];
                        const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return {
                          text: label + ': ' + value + ' (' + percentage + '%)',
                          fillStyle: data.datasets[0].backgroundColor[i],
                          strokeStyle: data.datasets[0].borderColor[i],
                          lineWidth: data.datasets[0].borderWidth,
                          hidden: false,
                          index: i
                        };
                      });
                    }
                    return [];
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                callbacks: {
                  label: function(context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((context.parsed || 0) / total * 100).toFixed(1) : 0;
                    return context.label + ': ' + (context.parsed || 0) + ' (' + percentage + '%)';
                  }
                }
              },
              datalabels: {
                color: '#fff',
                font: {
                  size: 16,
                  weight: 'bold',
                  family: "'Inter', sans-serif"
                },
                formatter: function(value, context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return percentage + '%';
                },
                textStrokeColor: 'rgba(0, 0, 0, 0.4)',
                textStrokeWidth: 2.5,
                display: function(context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((context.dataset.data[context.dataIndex] / total) * 100) : 0;
                  return percentage >= 5; // Chỉ hiển thị nếu >= 5%
                }
              }
            }
          }
        });
      }
    }, 100);
  })
  .catch(err => {
    console.error('Error loading all periods statistics:', err);
    statsContent.innerHTML = `<div style="background: #fee; padding: 20px; border-radius: 8px; border: 1px solid #fcc;">
      <h3 style="color: #c33; margin-top: 0;">⚠️ Lỗi khi tải dữ liệu</h3>
      <p style="color: #c33; margin-bottom: 10px;"><strong>Chi tiết:</strong> ${err.message || 'Lỗi không xác định'}</p>
      <button class="btn" onclick="displayAllPeriodsStatistics()" style="margin-top: 10px;">Thử lại</button>
    </div>`;
  });
}

// --- PHẦN BÁO CÁO ĐẦY ĐỦ ---
function loadReports() {
  const reportsDiv = document.getElementById("reportsContent");
  if (!reportsDiv) return;

  reportsDiv.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <h3 style="margin-top: 0; color: #2c3e50;">📂 Trung tâm báo cáo</h3>
            <p style="color: #7f8c8d; margin-bottom: 25px;">Chọn loại dữ liệu bạn muốn xuất ra file:</p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div style="border: 1px solid #eee; padding: 20px; border-radius: 8px; background: #f9f9f9;">
                    <h4 style="margin-top: 0;">🏠 Danh sách hộ dân</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-success" onclick="exportReport('households')">📊 Xuất Excel</button>
                        <button class="btn" style="background: #e74c3c;" onclick="exportToPDF('households')">📄 Xuất PDF</button>
                    </div>
                </div>

                <div style="border: 1px solid #eee; padding: 20px; border-radius: 8px; background: #f9f9f9;">
                    <h4 style="margin-top: 0;">💰 Danh sách phí</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-success" onclick="exportReport('fees')">📊 Xuất Excel</button>
                        <button class="btn" style="background: #e74c3c;" onclick="exportToPDF('fees')">📄 Xuất PDF</button>
                    </div>
                </div>

                <div style="border: 1px solid #eee; padding: 20px; border-radius: 8px; background: #f9f9f9;">
                    <h4 style="margin-top: 0;">🧾 Lịch sử thanh toán</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-success" onclick="exportReport('payments')">📊 Xuất Excel</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- CÁC HÀM XỬ LÝ XUẤT FILE ---

function exportReport(type) {
  if (type === "households") exportHouseholdsToExcel();
  else if (type === "fees") exportFeesToExcel();
  else if (type === "payments") exportPaymentsToExcel();
}

// 1. Xuất Excel Hộ dân
function exportHouseholdsToExcel() {
  fetch("/api/households", {
    credentials: 'same-origin'
  })
    .then((res) => res.json())
    .then((data) => {
      const exportData = data.map((h) => ({
        ID: h.id,
        "Mã Hộ": h.householdCode,
        "Chủ Hộ": h.ownerName,
        "Căn Hộ": h.apartmentNumber,
        SĐT: h.phone,
        "Số TV": h.membersCount,
        "Trạng Thái": h.active ? "Hoạt động" : "Ngừng",
      }));
      exportToExcel(exportData, "Danh_Sach_Ho_Dan");
    })
    .catch((err) => alert("Lỗi tải dữ liệu: " + err));
}

// 2. Xuất Excel Phí
function exportFeesToExcel() {
  fetch("/api/household-fees")
    .then((res) => res.json())
    .then((data) => {
      const exportData = data.map((f) => ({
        "Mã Hộ": f.household ? f.household.householdCode : "",
        "Chủ Hộ": f.household ? f.household.ownerName : "",
        "Loại Phí": f.feeCategory ? f.feeCategory.name : "",
        "Số Lượng": f.quantity,
        "Đơn Giá": f.unitPrice,
        "Thành Tiền": f.amount,
        "Trạng Thái": f.status === "PAID" ? "Đã thu" : "Chưa thu",
        Kỳ: f.billingPeriod
          ? `Tháng ${f.billingPeriod.month}/${f.billingPeriod.year}`
          : "",
      }));
      exportToExcel(exportData, "Danh_Sach_Phi_Chung_Cu");
    })
    .catch((err) => alert("Lỗi tải dữ liệu: " + err));
}

// 3. Xuất Excel Thanh toán
function exportPaymentsToExcel() {
  // Giả sử có API /api/payments, nếu chưa có thì dùng tạm logic fees đã PAID
  fetch("/api/household-fees")
    .then((res) => res.json())
    .then((data) => {
      const paidFees = data.filter((f) => f.status === "PAID");
      if (paidFees.length === 0) return alert("Chưa có dữ liệu thanh toán nào");

      const exportData = paidFees.map((f) => ({
        "Mã Hộ": f.household?.householdCode,
        "Loại Phí": f.feeCategory?.name,
        "Số Tiền Đã Trả": f.amount,
        "Ngày Tạo": f.billingPeriod
          ? `${f.billingPeriod.month}/${f.billingPeriod.year}`
          : "",
      }));
      exportToExcel(exportData, "Lich_Su_Thanh_Toan");
    })
    .catch((err) => alert("Lỗi tải dữ liệu: " + err));
}

// Hàm hỗ trợ xuất Excel (dùng thư viện XLSX)
function exportToExcel(data, fileName) {
  if (typeof XLSX === "undefined") {
    return alert(
      "Lỗi: Thư viện XLSX chưa được tải. Hãy kiểm tra lại file HTML."
    );
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, fileName + ".xlsx");
}

// Hàm hỗ trợ xuất PDF (dùng thư viện jsPDF)
function exportToPDF(type) {
  if (typeof jspdf === "undefined") {
    return alert("Lỗi: Thư viện jsPDF chưa được tải.");
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.text("BAO CAO HE THONG BLUEMOON", 105, 20, null, null, "center");
  doc.setFont("helvetica", "normal");
  doc.text(
    "Loai bao cao: " + type.toUpperCase(),
    105,
    30,
    null,
    null,
    "center"
  );

  doc.text("Chuc nang xuat PDF chi tiet dang duoc cap nhat...", 20, 50);
  doc.save(`Bao_Cao_${type}.pdf`);
}

// ==================================================
// 7. ACCOUNT SETTINGS (TÀI KHOẢN CỦA TÔI)
// ==================================================
function loadMyAccountInfo() {
  fetch("/api/accounts/me")
    .then((res) => {
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Lỗi tải thông tin");
      return res.json();
    })
    .then((data) => {
      if (!data) return;

      const userEl = document.getElementById("myUsername");
      if (userEl) userEl.value = data.username || "";

      const roleEl = document.getElementById("myRole");
      if (roleEl) {
        let roleName = "Khác";
        if (data.role && data.role.id == 2) roleName = "QUẢN TRỊ VIÊN";
        else if (data.role && data.role.id == 1) roleName = "CƯ DÂN";
        roleEl.value = roleName;
      }

      const resGroup = document.getElementById("myResidentInfoGroup");
      const resName = document.getElementById("myResidentName");
      if (data.resident) {
        if (resGroup) resGroup.style.display = "block";
        if (resName) resName.value = data.resident.fullName || "";
      } else {
        if (resGroup) resGroup.style.display = "none";
      }
    })
    .catch((err) => console.log("Account info ignored:", err));
}

function openChangePasswordModal() {
  const form = document.getElementById("changePasswordForm");
  if (form) form.reset();
  const modal = document.getElementById("changePasswordModal");
  if (modal) modal.style.display = "block";
}

function handleChangePassword(event) {
  event.preventDefault();
  const oldPass = document.getElementById("oldPassword").value;
  const newPass = document.getElementById("newPassword").value;
  const confirmPass = document.getElementById("confirmNewPassword").value;

  if (newPass !== confirmPass) {
    alert("Mật khẩu xác nhận không khớp!");
    return;
  }

  fetch("/api/accounts/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPass: oldPass, newPass: newPass }),
  })
    .then(async (res) => {
      const text = await res.text();
      if (res.ok) {
        alert("Đổi mật khẩu thành công!");
        closeModal("changePasswordModal");
      } else {
        alert("Lỗi: " + text);
      }
    })
    .catch((err) => alert("Lỗi kết nối: " + err));
}

// ==================================================
// 8. UI HELPERS (HÀM SHOW & UTILS)
// ==================================================
function show(sectionId) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  const section = document.getElementById(sectionId);

  if (section) {
    section.classList.add("active");

    // Lazy Load Data
    if (sectionId === "households") loadHouseholds();
    else if (sectionId === "billing") loadBillingPeriods();
    else if (sectionId === "accounts") loadAccounts();
    else if (sectionId === "fee-categories")
      loadFeeCategories(); // ĐÃ CÓ HÀM NÀY
    else if (sectionId === "cost-stats") {
      loadStatistics();
      // Nếu đã chọn "Tất cả", tự động refresh dữ liệu
      const periodSelect = document.getElementById("statsPeriodSelect");
      if (periodSelect && periodSelect.value === 'all') {
        displayAllPeriodsStatistics();
      }
    }
    else if (sectionId === "reports") loadReports();
    else if (sectionId === "my-account") loadMyAccountInfo();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
}

// ==================================================
// VIEW HOUSEHOLD DETAILS
// ==================================================
function viewHouseholdDetails(householdId) {
  const modal = document.getElementById("householdDetailsModal");
  const contentDiv = document.getElementById("householdDetailsContent");
  
  if (!modal || !contentDiv) return;
  
  modal.style.display = "block";
  contentDiv.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
      <p>Đang tải thông tin...</p>
    </div>
  `;

  // Load household info and residents in parallel
  Promise.all([
    fetch(`/api/households/${householdId}`, {
      credentials: 'same-origin'
    }).then(r => {
      if (!r.ok) throw new Error("Lỗi khi tải thông tin hộ gia đình");
      return r.json();
    }),
    fetch(`/api/residents/by-household/${householdId}`, {
      credentials: 'same-origin'
    }).then(r => {
      if (!r.ok) return [];
      return r.json().then(data => Array.isArray(data) ? data : []);
    }).catch(() => [])
  ])
    .then(([household, residents]) => {
      // Format dates
      const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
          return new Date(dateStr).toLocaleDateString('vi-VN');
        } catch {
          return dateStr;
        }
      };

      const statusText = household.active ? "Hoạt động" : "Ngừng hoạt động";
      const statusColor = household.active ? "#10b981" : "#ef4444";
      const ownsApartment = household.ownsApartment ? "Có" : "Không";

      let html = `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e293b; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
            🏠 Thông tin hộ gia đình
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">ID</label>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${household.id || "-"}</span>
            </div>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">Mã hộ</label>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${household.householdCode || "-"}</span>
            </div>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">Chủ hộ</label>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${household.ownerName || "-"}</span>
            </div>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">Số căn hộ</label>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${household.apartmentNumber || "-"}</span>
            </div>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">Số điện thoại</label>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${household.phone || "-"}</span>
            </div>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">Số thành viên</label>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${household.membersCount || 0}</span>
            </div>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">Tình trạng cư trú</label>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${household.residenceStatus || "-"}</span>
            </div>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">Ngày vào ở</label>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${formatDate(household.moveInDate)}</span>
            </div>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">Ngày chuyển đi</label>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${formatDate(household.moveOutDate)}</span>
            </div>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">Sở hữu căn hộ</label>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${ownsApartment}</span>
            </div>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
              <label style="display: block; color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 5px;">Trạng thái</label>
              <span style="color: ${statusColor}; font-size: 16px; font-weight: 600;">${statusText}</span>
            </div>
          </div>
        </div>
      `;

      // Add residents section
      if (residents && residents.length > 0) {
        html += `
          <div style="margin-top: 30px;">
            <h3 style="color: #1e293b; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              👥 Danh sách cư dân (${residents.length})
            </h3>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <th style="padding: 12px; text-align: left; font-weight: 600;">ID</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Họ và tên</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Ngày sinh</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Giới tính</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">CMND/CCCD</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">SĐT</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Quan hệ</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
        `;

        residents.forEach((resident, index) => {
          const bgColor = index % 2 === 0 ? "#ffffff" : "#f8fafc";
          html += `
                  <tr style="background: ${bgColor};">
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${resident.id || "-"}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${resident.fullName || "-"}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${formatDate(resident.dateOfBirth)}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${resident.gender || "-"}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${resident.idNumber || "-"}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${resident.phone || "-"}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${resident.relationToHead || "-"}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${resident.residenceStatus || "-"}</td>
                  </tr>
          `;
        });

        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else {
        html += `
          <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;">
            <p style="color: #64748b;">Chưa có thông tin cư dân</p>
          </div>
        `;
      }

      contentDiv.innerHTML = html;
    })
    .catch(err => {
      console.error("Error loading household details:", err);
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #ef4444;">
          <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
          <p>Lỗi khi tải thông tin: ${err.message}</p>
          <button class="btn" onclick="viewHouseholdDetails(${householdId})" style="margin-top: 15px;">Thử lại</button>
        </div>
      `;
    });
}

function filterHouseholds() {
  const input = document.getElementById("searchHousehold");
  if (!input) return;
  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll("#householdsTableBody tr");
  rows.forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(filter)
      ? ""
      : "none";
  });
}

// ==================================================
// HÀM CẬP NHẬT CHI PHÍ (EDITABLE IN STATISTICS)
// ==================================================

// Cập nhật số lượng và tự động tính lại thành tiền
function updateFeeQuantity(feeId, householdId, categoryId, unitPrice) {
  const quantityInput = document.getElementById(`qty_${feeId}`);
  if (!quantityInput) return;
  
  const newQuantity = parseFloat(quantityInput.value) || 0;
  const newAmount = newQuantity * (parseFloat(unitPrice) || 0);
  
  // Cập nhật hiển thị thành tiền ngay lập tức
  const amountCell = document.getElementById(`amount_${feeId}`);
  if (amountCell) {
    amountCell.innerHTML = newAmount > 0 ? newAmount.toLocaleString('vi-VN') + 'đ' : '-';
  }
  
  // Lấy thông tin fee hiện tại
  fetch(`/api/household-fees/${feeId}`, {
    credentials: 'same-origin'
  })
    .then(res => res.json())
    .then(fee => {
      // Cập nhật fee với số lượng và số tiền mới
      const updatedFee = {
        ...fee,
        quantity: newQuantity,
        amount: newAmount,
        householdId: fee.household?.id,
        feeCategoryId: fee.feeCategory?.id,
        billingPeriodId: fee.billingPeriod?.id
      };
      
      // Gọi API cập nhật
      return fetch(`/api/household-fees/${feeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(updatedFee)
      });
    })
    .then(res => {
      if (res.ok) {
        // Cập nhật lại thống kê sau khi lưu thành công
        const periodId = document.getElementById("statsPeriodSelect")?.value;
        if (periodId && periodId !== 'all') {
          setTimeout(() => {
            displayStatisticsByPeriod(periodId);
          }, 300);
        }
      } else {
        alert('Lỗi khi cập nhật số lượng');
        // Reload để khôi phục giá trị cũ
        const periodId = document.getElementById("statsPeriodSelect")?.value;
        if (periodId && periodId !== 'all') {
          displayStatisticsByPeriod(periodId);
        }
      }
    })
    .catch(err => {
      console.error('Error updating fee quantity:', err);
      alert('Lỗi khi cập nhật số lượng: ' + err.message);
      // Reload để khôi phục giá trị cũ
      const periodId = document.getElementById("statsPeriodSelect")?.value;
      if (periodId && periodId !== 'all') {
        displayStatisticsByPeriod(periodId);
      }
    });
}

// Cập nhật trạng thái
function updateFeeStatus(feeId, householdId, categoryId) {
  const statusSelect = document.getElementById(`status_${feeId}`);
  if (!statusSelect) return;
  
  const newStatus = statusSelect.value;
  
  // Lấy thông tin fee hiện tại
  fetch(`/api/household-fees/${feeId}`, {
    credentials: 'same-origin'
  })
    .then(res => res.json())
    .then(fee => {
      // Cập nhật fee với trạng thái mới
      const updatedFee = {
        ...fee,
        status: newStatus,
        householdId: fee.household?.id,
        feeCategoryId: fee.feeCategory?.id,
        billingPeriodId: fee.billingPeriod?.id
      };
      
      // Gọi API cập nhật
      return fetch(`/api/household-fees/${feeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(updatedFee)
      });
    })
    .then(res => {
      if (res.ok) {
        // Cập nhật màu sắc của select để phản ánh trạng thái mới
        const statusColors = {
          'UNPAID': '#f39c12',
          'PENDING': '#f39c12', // Tương thích với giá trị cũ
          'PAID': '#27ae60',
          'PARTIALLY_PAID': '#3498db',
          'OVERDUE': '#e74c3c'
        };
        statusSelect.style.color = statusColors[newStatus] || '#333';
        
        // Cập nhật lại thống kê sau khi lưu thành công
        const periodId = document.getElementById("statsPeriodSelect")?.value;
        if (periodId && periodId !== 'all') {
          setTimeout(() => {
            displayStatisticsByPeriod(periodId);
          }, 300);
        }
      } else {
        alert('Lỗi khi cập nhật trạng thái');
        // Reload để khôi phục giá trị cũ
        const periodId = document.getElementById("statsPeriodSelect")?.value;
        if (periodId && periodId !== 'all') {
          displayStatisticsByPeriod(periodId);
        }
      }
    })
    .catch(err => {
      console.error('Error updating fee status:', err);
      alert('Lỗi khi cập nhật trạng thái: ' + err.message);
      // Reload để khôi phục giá trị cũ
      const periodId = document.getElementById("statsPeriodSelect")?.value;
      if (periodId && periodId !== 'all') {
        displayStatisticsByPeriod(periodId);
      }
  });
}

// ==================================================
// 9. APP INITIALIZATION
// ==================================================
document.addEventListener("DOMContentLoaded", () => {
  checkAdminSession();
  loadHouseholds(); // Mặc định load tab Hộ dân
});
