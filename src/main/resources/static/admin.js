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
  fetch("/api/households")
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
                            <button class="btn" onclick="editHousehold(${
                              h.id
                            })">Sửa</button>
                            <button class="btn btn-danger" onclick="deleteHousehold(${
                              h.id
                            })">Xóa</button>
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

function editHousehold(id) {
  editingHouseholdId = id;
  fetch(`/api/households/${id}`)
    .then((res) => res.json())
    .then((h) => {
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
      document.getElementById("householdModal").style.display = "block";
    });
}

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

  fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(household),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Lỗi lưu dữ liệu");
      return res.json();
    })
    .then(() => {
      alert("Lưu thành công!");
      document.getElementById("householdModal").style.display = "none";
      loadHouseholds();
    })
    .catch((err) => alert(err.message));
}

function deleteHousehold(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa?")) return;
  fetch(`/api/households/${id}`, { method: "DELETE" }).then(() => {
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
                            <button class="btn" onclick="editFeeCategory(${
                              cat.id
                            })">Sửa</button>
                            <button class="btn btn-danger" onclick="deleteFeeCategory(${
                              cat.id
                            })">Xóa</button>
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
                            <button class="btn" onclick="editBillingPeriod(${p.id})">Sửa</button>
                            <button class="btn btn-danger" onclick="deleteBillingPeriod(${p.id})">Xóa</button>
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

  const url = editingPeriodId
    ? `/api/billing-periods/${editingPeriodId}`
    : "/api/billing-periods";
  const method = editingPeriodId ? "PUT" : "POST";

  fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(period),
  }).then((res) => {
    if (res.ok) {
      alert("Lưu thành công");
      document.getElementById("billingPeriodModal").style.display = "none";
      loadBillingPeriods();
    } else {
      alert("Lỗi khi lưu");
    }
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
                            <button class="btn" onclick="editAccount(${
                              acc.id
                            })">Sửa</button>
                            <button class="btn btn-danger" onclick="deleteAccount(${
                              acc.id
                            })">Xóa</button>
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
  // Load danh sách kỳ thu phí vào dropdown thống kê
  fetch("/api/billing-periods")
    .then((res) => res.json())
    .then((periods) => {
      const select = document.getElementById("statsPeriodSelect");
      if (select) {
        // Sắp xếp kỳ mới nhất lên đầu
        periods.sort((a, b) => b.year - a.year || b.month - a.month);

        select.innerHTML = '<option value="">-- Chọn kỳ thu phí --</option>';
        periods.forEach((p) => {
          select.innerHTML += `<option value="${p.id}">Tháng ${p.month}/${p.year}</option>`;
        });
      }
    })
    .catch((err) => console.error("Lỗi load kỳ thu phí:", err));
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
  fetch("/api/households")
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
    else if (sectionId === "cost-stats") loadStatistics();
    else if (sectionId === "reports") loadReports();
    else if (sectionId === "my-account") loadMyAccountInfo();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
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
// 9. APP INITIALIZATION
// ==================================================
document.addEventListener("DOMContentLoaded", () => {
  checkAdminSession();
  loadHouseholds(); // Mặc định load tab Hộ dân
});
