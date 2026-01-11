// Xử lý đăng nhập cư dân
/* ==================================================
	   LOGIN USER (CƯ DÂN)
	================================================== */
function loginUser(event) {
  event.preventDefault();

  const username = document.getElementById("userName").value;
  const password = document.getElementById("userPassword").value;

  const body = new URLSearchParams({ username, password });

  fetch("/api/auth/resident-login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
    .then((res) => {
      if (!res.ok) throw new Error("Sai tài khoản hoặc mật khẩu");

      window.location.href = "dashboard-user.html";
    })
    .catch((err) => alert(err.message));
}

/* ==================================================
	   AUTO LOAD DASHBOARD USER
	================================================== */
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM READY");
  if (document.getElementById("profile")) {
    loadUserInfo();
    loadHouseholdInfo();
    loadPeriods().then(() => {
      loadHouseholdFees();
      loadPaymentHistory();
    });
  }
});

/* ==================================================
	   USER INFO
	================================================== */
function loadUserInfo() {
  fetch("/api/residents/me", {
    credentials: 'same-origin'
  })
    .then((res) => {
      if (res.status === 401) {
        window.location.href = "login-user.html";
        return null;
      }
      if (!res.ok) throw new Error("Lỗi khi tải thông tin");
      return res.json();
    })
    .then((user) => {
      if (!user) return;
      console.log("USER:", user);
      document.getElementById("u-name").innerText = user.fullName || "-";
      document.getElementById("u-phone").innerText = user.phone || "-";
      document.getElementById("u-idNumber").innerText = user.idNumber || "-";
      document.getElementById("u-dateOfBirth").innerText = user.dateOfBirth ? 
        new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : "-";
      document.getElementById("u-gender").innerText = user.gender || "-";
      document.getElementById("u-relation").innerText = user.relationToHead || "-";
      document.getElementById("u-residenceStatus").innerText = user.residenceStatus || "-";
    })
    .catch(err => {
      console.error("Error loading user info:", err);
      alert("Lỗi khi tải thông tin cá nhân");
    });
}

/* ==================================================
	   HOUSEHOLD INFO
	================================================== */
function loadHouseholdInfo() {
  // Load thông tin căn hộ trước
  fetch("/api/households/me", {
    credentials: 'same-origin'
  })
    .then(async (res) => {
      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          // Ignore
        }
        throw new Error(errorMsg);
      }
      return res.json();
    })
    .then((h) => {
      if (!h) {
        throw new Error("Không có dữ liệu căn hộ");
      }
      
      // Hiển thị thông tin căn hộ
      const codeEl = document.getElementById("h-code");
      const ownerEl = document.getElementById("h-ownerName");
      const aptEl = document.getElementById("h-apartmentNumber");
      const phoneEl = document.getElementById("h-phone");
      const membersEl = document.getElementById("h-members");
      const statusEl = document.getElementById("h-residenceStatus");
      const moveInEl = document.getElementById("h-moveInDate");
      const ownsEl = document.getElementById("h-ownsApartment");
      
      if (codeEl) codeEl.innerText = h.householdCode || "-";
      if (ownerEl) ownerEl.innerText = h.ownerName || "-";
      if (aptEl) aptEl.innerText = h.apartmentNumber || "-";
      if (phoneEl) phoneEl.innerText = h.phone || "-";
      if (membersEl) membersEl.innerText = h.membersCount || "-";
      if (statusEl) {
        // Mapping residence status từ database sang tiếng Việt
        const statusMapping = {
          'DANG_O': 'Đang ở',
          'DA_CHUYEN': 'Đã chuyển',
          'TAM_VANG': 'Tạm vắng',
          'Active': 'Hoạt động',
          'Inactive': 'Ngừng hoạt động'
        };
        const displayStatus = statusMapping[h.residenceStatus] || h.residenceStatus || "-";
        statusEl.innerText = displayStatus;
      }
      if (moveInEl) {
        moveInEl.innerText = h.moveInDate ? 
          new Date(h.moveInDate).toLocaleDateString('vi-VN') : "-";
      }
      if (ownsEl) ownsEl.innerText = h.ownsApartment ? "Có" : "Không";
      
      // Sau đó load danh sách thành viên gia đình (không block nếu lỗi)
      loadFamilyMembers();
    })
    .catch(err => {
      console.error("Error loading household info:", err);
      // Hiển thị lỗi trong console và alert
      const errorMsg = err.message || "Lỗi không xác định";
      console.error("Chi tiết lỗi:", errorMsg);
      alert("Lỗi khi tải thông tin căn hộ: " + errorMsg);
    });
}

function loadFamilyMembers() {
  fetch("/api/user-portal/family", {
    credentials: 'same-origin'
  })
    .then((res) => {
      if (!res.ok) {
        console.warn("Error loading family members:", res.status, res.statusText);
        return [];
      }
      return res.json().then(data => {
        if (!Array.isArray(data)) {
          console.warn("Family response is not an array:", data);
          return [];
        }
        return data;
      });
    })
    .catch(err => {
      console.error("Error loading family members:", err);
      return [];
    })
    .then((family) => {
      displayFamilyMembers(family);
    });
}

function displayFamilyMembers(family) {
  const container = document.getElementById("familyMembersList");
  if (!container) return;
  
  if (!family || family.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Chưa có thông tin thành viên</p>';
    return;
  }
  
  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };
  
  // Sắp xếp: Chủ hộ trước, sau đó theo quan hệ
  const sortedFamily = [...family].sort((a, b) => {
    if (a.relationToHead === 'Chủ hộ') return -1;
    if (b.relationToHead === 'Chủ hộ') return 1;
    return (a.relationToHead || '').localeCompare(b.relationToHead || '');
  });
  
  let html = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">STT</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">Họ và tên</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">Ngày sinh</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">Giới tính</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">CMND/CCCD</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">SĐT</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">Quan hệ</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">Tình trạng</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  sortedFamily.forEach((member, index) => {
    const bgColor = index % 2 === 0 ? "#ffffff" : "#f8fafc";
    const isHead = member.relationToHead === 'Chủ hộ';
    
    html += `
          <tr style="background: ${bgColor}; transition: all 0.2s ease;">
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${index + 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: ${isHead ? '600' : '400'}; color: ${isHead ? '#667eea' : '#1e293b'};">
              ${member.fullName || "-"}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${formatDate(member.dateOfBirth)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${member.gender || "-"}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${member.idNumber || "-"}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${member.phone || "-"}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
              <span style="padding: 4px 8px; background: ${isHead ? '#e0e7ff' : '#f1f5f9'}; border-radius: 6px; font-size: 12px; font-weight: 500;">
                ${member.relationToHead || "-"}
              </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
              <span style="padding: 4px 8px; background: ${member.residenceStatus === 'Active' ? '#d1fae5' : '#fee2e2'}; color: ${member.residenceStatus === 'Active' ? '#065f46' : '#991b1b'}; border-radius: 6px; font-size: 12px; font-weight: 500;">
                ${member.residenceStatus === 'Active' ? 'Hoạt động' : member.residenceStatus || 'N/A'}
              </span>
            </td>
          </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
}

// Lưu trữ dữ liệu để filter
let allFees = [];
let allPayments = [];
let allBillingPeriods = [];

/* ==================================================
	   LOAD BILLING PERIODS
	================================================== */
function loadPeriods() {
  return fetch("/api/billing-periods", {
    credentials: 'same-origin'
  })
    .then((res) => {
      if (!res.ok) {
        console.warn("Error loading periods:", res.status, res.statusText);
        return [];
      }
      return res.json().then(data => {
        if (!Array.isArray(data)) {
          console.warn("Periods response is not an array:", data);
          return [];
        }
        return data;
      });
    })
    .catch(err => {
      console.error("Error loading periods:", err);
      return [];
    })
    .then((periods) => {
      allBillingPeriods = periods;
      
      // Sắp xếp kỳ mới nhất lên đầu
      periods.sort((a, b) => b.year - a.year || b.month - a.month);
      
      // Populate dropdown cho Fees
      const feeSelect = document.getElementById("feePeriodSelect");
      if (feeSelect) {
        const currentValue = feeSelect.value;
        feeSelect.innerHTML = '<option value="">-- Tất cả các kỳ --</option>';
        periods.forEach((p) => {
          const periodLabel = `Tháng ${String(p.month).padStart(2, '0')}/${p.year}`;
          feeSelect.innerHTML += `<option value="${p.id}">${periodLabel}</option>`;
        });
        if (currentValue) {
          feeSelect.value = currentValue;
        }
      }
      
      // Populate dropdown cho History
      const historySelect = document.getElementById("historyPeriodSelect");
      if (historySelect) {
        const currentValue = historySelect.value;
        historySelect.innerHTML = '<option value="">-- Tất cả các kỳ --</option>';
        periods.forEach((p) => {
          const periodLabel = `Tháng ${String(p.month).padStart(2, '0')}/${p.year}`;
          historySelect.innerHTML += `<option value="${p.id}">${periodLabel}</option>`;
        });
        if (currentValue) {
          historySelect.value = currentValue;
        }
      }
    });
}

/* ==================================================
	   HOUSEHOLD FEES
	================================================== */
function loadHouseholdFees() {
  Promise.all([
    fetch("/api/household-fees/me", {
      credentials: 'same-origin'
    }).then(r => {
      if (!r.ok) throw new Error("Lỗi khi tải danh sách phí");
      return r.json();
    }),
    fetch("/api/payments/me", {
      credentials: 'same-origin'
    }).then(r => {
      if (!r.ok) return [];
      return r.json().then(data => Array.isArray(data) ? data : []);
    }).catch(() => [])
  ])
    .then(([fees, payments]) => {
      // Lọc chỉ lấy các phí có feeCategory.active === true
      const activeFees = fees.filter(fee => {
        return fee.feeCategory && fee.feeCategory.active === true;
      });
      
      allFees = activeFees;
      allPayments = payments;
      
      // Tạo map tổng đã trả theo household_fee_id
      const paidAmountByFeeId = {};
      payments.forEach(payment => {
        const feeId = payment.householdFee?.id;
        if (feeId) {
          if (!paidAmountByFeeId[feeId]) {
            paidAmountByFeeId[feeId] = 0;
          }
          paidAmountByFeeId[feeId] += parseFloat(payment.amount) || 0;
        }
      });
      
      // Tính tổng thống kê chỉ từ các phí active
      let totalDue = 0;
      let totalPaid = 0;
      let totalRemaining = 0;
      
      activeFees.forEach(fee => {
        const feeAmount = parseFloat(fee.amount) || 0;
        const paidAmount = paidAmountByFeeId[fee.id] || 0;
        totalDue += feeAmount;
        totalPaid += paidAmount;
        totalRemaining += (feeAmount - paidAmount);
      });
      
      // Hiển thị tổng quan
      const summaryDiv = document.getElementById("feesSummary");
      if (summaryDiv) {
        summaryDiv.style.display = activeFees.length > 0 ? "block" : "none";
        document.getElementById("totalDue").textContent = totalDue.toLocaleString('vi-VN') + "đ";
        document.getElementById("totalPaid").textContent = totalPaid.toLocaleString('vi-VN') + "đ";
        document.getElementById("totalRemaining").textContent = totalRemaining.toLocaleString('vi-VN') + "đ";
      }
      
      const tbody = document.getElementById("feeTable");
      tbody.innerHTML = "";

      if (activeFees.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="text-align:center">
              Không có khoản phí nào
            </td>
          </tr>`;
        return;
      }

      // Sắp xếp theo kỳ thu phí (mới nhất trước)
      activeFees.sort((a, b) => {
        const periodA = a.billingPeriod;
        const periodB = b.billingPeriod;
        if (periodA && periodB) {
          if (periodA.year !== periodB.year) return periodB.year - periodA.year;
          if (periodA.month !== periodB.month) return periodB.month - periodA.month;
        }
        return (b.id || 0) - (a.id || 0);
      });

      activeFees.forEach((fee) => {
        const feeAmount = parseFloat(fee.amount) || 0;
        const paidAmount = paidAmountByFeeId[fee.id] || 0;
        const remainingAmount = feeAmount - paidAmount;
        
        // Xác định trạng thái
        let statusClass, statusText;
        if (paidAmount >= feeAmount && feeAmount > 0) {
          statusClass = "status-paid";
          statusText = "Đã trả đủ";
        } else if (paidAmount > 0) {
          statusClass = "status-partial";
          statusText = `Đã trả ${paidAmount.toLocaleString('vi-VN')}đ`;
        } else if (fee.dueDate && new Date(fee.dueDate) < new Date()) {
          statusClass = "status-overdue";
          statusText = "Quá hạn";
        } else {
          statusClass = "status-pending";
          statusText = "Chờ thanh toán";
        }
        
        const period = fee.billingPeriod ? `Tháng ${String(fee.billingPeriod.month).padStart(2, '0')}/${fee.billingPeriod.year}` : "-";
        const periodId = fee.billingPeriod ? fee.billingPeriod.id : null;
        const category = fee.feeCategory ? fee.feeCategory.name : "-";
        const quantity = fee.quantity ? parseFloat(fee.quantity).toLocaleString('vi-VN') : "-";
        const unitPrice = fee.unitPrice ? parseFloat(fee.unitPrice).toLocaleString('vi-VN') + "đ" : "-";
        const dueDate = fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('vi-VN') : "-";
        
        tbody.innerHTML += `
          <tr data-period-id="${periodId || ''}">
            <td>${period}</td>
            <td><strong>${category}</strong></td>
            <td style="text-align: right;">${quantity}</td>
            <td style="text-align: right;">${unitPrice}</td>
            <td style="text-align: right; font-weight: bold;">${feeAmount > 0 ? feeAmount.toLocaleString('vi-VN') + "đ" : "-"}</td>
            <td style="text-align: right; color: #27ae60;">${paidAmount > 0 ? paidAmount.toLocaleString('vi-VN') + "đ" : "0đ"}</td>
            <td style="text-align: right; color: #e74c3c; font-weight: bold;">${remainingAmount > 0 ? remainingAmount.toLocaleString('vi-VN') + "đ" : "0đ"}</td>
            <td>${dueDate}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
          </tr>`;
      });
    })
    .catch(err => {
      console.error("Error loading fees:", err);
      const tbody = document.getElementById("feeTable");
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; color: red;">
            Lỗi khi tải danh sách phí: ${err.message}
          </td>
        </tr>`;
    });
}

/* ==================================================
	   PAYMENT HISTORY
	================================================== */
function loadPaymentHistory() {
  fetch("/api/payments/me", {
    credentials: 'same-origin'
  })
    .then((res) => {
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "login-user.html";
          return [];
        }
        throw new Error("Lỗi khi tải lịch sử thanh toán");
      }
      return res.json();
    })
    .then((data) => {
      allPayments = data;
      const tbody = document.getElementById("historyTable");
      tbody.innerHTML = "";

      if (!data || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center">
              Chưa có lịch sử thanh toán
            </td>
          </tr>`;
        return;
      }

      // Sắp xếp theo ngày thanh toán (mới nhất trước)
      data.sort((a, b) => {
        const dateA = a.paidAt ? new Date(a.paidAt) : new Date(0);
        const dateB = b.paidAt ? new Date(b.paidAt) : new Date(0);
        return dateB - dateA;
      });

      data.forEach((p) => {
        const paidDate = p.paidAt ? new Date(p.paidAt).toLocaleString('vi-VN') : "-";
        const periodId = p.householdFee?.billingPeriod ? p.householdFee.billingPeriod.id : null;
        const period = p.householdFee?.billingPeriod ? 
          `Tháng ${String(p.householdFee.billingPeriod.month).padStart(2, '0')}/${p.householdFee.billingPeriod.year}` : "-";
        const category = p.householdFee?.feeCategory ? p.householdFee.feeCategory.name : "-";
        const amount = p.amount ? parseFloat(p.amount).toLocaleString('vi-VN') + "đ" : "0đ";
        const method = p.method || "-";
        const note = p.note || "-";
        
        tbody.innerHTML += `
          <tr data-period-id="${periodId || ''}">
            <td>${paidDate}</td>
            <td>${period}</td>
            <td><strong>${category}</strong></td>
            <td style="text-align: right; font-weight: bold; color: #27ae60;">${amount}</td>
            <td>${method}</td>
            <td>${note}</td>
          </tr>`;
      });
    })
    .catch(err => {
      console.error("Error loading payment history:", err);
      const tbody = document.getElementById("historyTable");
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color: red;">
            Lỗi khi tải lịch sử thanh toán: ${err.message}
          </td>
        </tr>`;
    });
}

/* ==================================================
	   FILTER FUNCTIONS
	================================================== */
function filterFees() {
  const searchTerm = document.getElementById("searchFees")?.value.toLowerCase() || "";
  const selectedPeriodId = document.getElementById("feePeriodSelect")?.value || "";
  const rows = document.querySelectorAll("#feeTable tr");
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    let showRow = true;
    
    // Filter theo search term
    if (searchTerm && !text.includes(searchTerm)) {
      showRow = false;
    }
    
    // Filter theo period (sử dụng data-period-id attribute)
    if (selectedPeriodId && showRow) {
      const rowPeriodId = row.getAttribute("data-period-id");
      if (rowPeriodId !== selectedPeriodId) {
        showRow = false;
      }
    }
    
    row.style.display = showRow ? "" : "none";
  });
  
  // Cập nhật thống kê dựa trên filtered fees
  updateFeesSummary();
}

function filterHistory() {
  const searchTerm = document.getElementById("searchHistory")?.value.toLowerCase() || "";
  const selectedPeriodId = document.getElementById("historyPeriodSelect")?.value || "";
  const rows = document.querySelectorAll("#historyTable tr");
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    let showRow = true;
    
    // Filter theo search term
    if (searchTerm && !text.includes(searchTerm)) {
      showRow = false;
    }
    
    // Filter theo period (sử dụng data-period-id attribute)
    if (selectedPeriodId && showRow) {
      const rowPeriodId = row.getAttribute("data-period-id");
      if (rowPeriodId !== selectedPeriodId) {
        showRow = false;
      }
    }
    
    row.style.display = showRow ? "" : "none";
  });
}

// Cập nhật thống kê dựa trên filtered fees
function updateFeesSummary() {
  const visibleRows = document.querySelectorAll("#feeTable tr[style='']");
  let totalDue = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  
  visibleRows.forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 7) {
      // Cột "Phải trả" (index 4)
      const dueText = cells[4].textContent.replace(/[^\d]/g, '');
      const due = parseFloat(dueText) || 0;
      
      // Cột "Đã trả" (index 5)
      const paidText = cells[5].textContent.replace(/[^\d]/g, '');
      const paid = parseFloat(paidText) || 0;
      
      // Cột "Còn lại" (index 6)
      const remainingText = cells[6].textContent.replace(/[^\d]/g, '');
      const remaining = parseFloat(remainingText) || 0;
      
      totalDue += due;
      totalPaid += paid;
      totalRemaining += remaining;
    }
  });
  
  // Cập nhật summary
  const summaryDiv = document.getElementById("feesSummary");
  if (summaryDiv && visibleRows.length > 0) {
    summaryDiv.style.display = "block";
    document.getElementById("totalDue").textContent = totalDue.toLocaleString('vi-VN') + "đ";
    document.getElementById("totalPaid").textContent = totalPaid.toLocaleString('vi-VN') + "đ";
    document.getElementById("totalRemaining").textContent = totalRemaining.toLocaleString('vi-VN') + "đ";
  } else if (summaryDiv) {
    summaryDiv.style.display = "none";
  }
}

/* ==================================================
	   CHANGE PASSWORD
	================================================== */
function changePassword(event) {
  event.preventDefault();
  
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  
  // Validation
  if (newPassword.length < 6) {
    alert("Mật khẩu mới phải có ít nhất 6 ký tự");
    return;
  }
  
  if (newPassword !== confirmPassword) {
    alert("Mật khẩu mới và xác nhận không khớp");
    return;
  }
  
  // Gọi API đổi mật khẩu
  fetch("/api/auth/resident/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'same-origin',
    body: JSON.stringify({
      currentPassword: currentPassword,
      newPassword: newPassword
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Đổi mật khẩu thành công!");
      document.getElementById("changePasswordForm").reset();
    } else {
      alert("Lỗi: " + (data.message || "Lỗi khi đổi mật khẩu"));
    }
  })
  .catch(err => {
    console.error("Error:", err);
    alert("Lỗi: " + err.message);
  });
}

/* ==================================================
	   LOGOUT
	================================================== */
function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: 'same-origin'
    })
    .then(() => {
      window.location.href = "login-user.html";
    })
    .catch(() => {
      window.location.href = "login-user.html";
    });
  }
}

/* ==================================================
	   SUPPORT
	================================================== */
function sendSupport() {
  const text = document.getElementById("supportText").value;
  if (text.trim().length === 0) {
    alert("Vui lòng nhập nội dung!");
    return;
  }
  
  // Gọi API gửi yêu cầu hỗ trợ (có thể tạo endpoint sau)
  alert("Yêu cầu hỗ trợ đã được gửi! Chúng tôi sẽ liên hệ với bạn sớm nhất.");
  document.getElementById("supportText").value = "";
}

/* ==================================================
	   UI SECTION SWITCH
	================================================== */
function show(id) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  const section = document.getElementById(id);
  if (section) {
    section.classList.add("active");
    
    // Reload data khi chuyển section
    if (id === "fees") {
      if (allBillingPeriods.length === 0) {
        loadPeriods().then(() => {
          loadHouseholdFees();
        });
      } else {
        loadHouseholdFees();
      }
    } else if (id === "history") {
      if (allBillingPeriods.length === 0) {
        loadPeriods().then(() => {
          loadPaymentHistory();
        });
      } else {
        loadPaymentHistory();
      }
    }
  }
}

// Xử lý đăng nhập ban quản lý
function loginAdmin(event) {
  event.preventDefault();

  const email = document.getElementById("adminEmail").value;
  const pass = document.getElementById("adminPassword").value;

  if (email === "admin" && pass === "admin") {
    alert("Đăng nhập quản lý thành công!");
    window.location.href = "admin-dashboard.html";
  } else {
    alert("Sai tài khoản quản lý!");
  }

  return false;
}

/*
 * 📌 Ghi chú:
 * - Sau này bạn thêm chức năng khác (gọi API, tạo hóa đơn, xem căn hộ...)
 *   → chỉ cần viết thêm function tại đây.
 *
 * Ví dụ:
 * function createBillingPeriod() { ... }
 * function fetchApartments() { ... }
 */
