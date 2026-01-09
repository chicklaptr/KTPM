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
    loadHouseholdFees();
    loadPaymentHistory();
  }
});

/* ==================================================
	   USER INFO
	================================================== */
function loadUserInfo() {
  fetch("/api/residents/me")
    .then((res) => {
      if (res.status === 401) {
        window.location.href = "login-user.html";
        return null;
      }
      return res.json();
    })
    .then((user) => {
      console.log("USER:", user);
      document.getElementById("u-name").innerText = user.fullName || "";
      document.getElementById("u-phone").innerText = user.phone || "";
      document.getElementById("u-email").innerText = user.email || "";
    });
}

/* ==================================================
	   HOUSEHOLD INFO
	================================================== */
function loadHouseholdInfo() {
  fetch("/api/households/me")
    .then((res) => res.json())
    .then((h) => {
      document.getElementById("h-code").innerText = h.code;
      document.getElementById("h-area").innerText = h.area + " m²";
      document.getElementById("h-members").innerText = h.memberCount;
      document.getElementById("h-type").innerText = h.type;
    });
}

/* ==================================================
	   HOUSEHOLD FEES
	================================================== */
function loadHouseholdFees() {
  fetch("/api/household-fees/me")
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById("feeTable");
      tbody.innerHTML = "";

      if (data.length === 0) {
        tbody.innerHTML = `
	                    <tr>
	                        <td colspan="5" style="text-align:center">
	                            Không có khoản phí nào
	                        </td>
	                    </tr>`;
        return;
      }

      data.forEach((fee) => {
        tbody.innerHTML += `
	                    <tr>
	                        <td>${fee.billingPeriod}</td>
	                        <td>${fee.feeCategory}</td>
	                        <td>${fee.amount.toLocaleString()}đ</td>
	                        <td style="color:${fee.paid ? "green" : "red"}">
	                            ${fee.paid ? "Đã đóng" : "Chưa đóng"}
	                        </td>
	                        <td>
	                            ${
                                fee.paid
                                  ? '<button class="btn" disabled>✓</button>'
                                  : `<button class="btn" onclick="pay(${fee.id})">Thanh toán</button>`
                              }
	                        </td>
	                    </tr>`;
      });
    });
}

/* ==================================================
	   PAYMENT HISTORY
	================================================== */
function loadPaymentHistory() {
  fetch("/api/payments/me")
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById("historyTable");
      tbody.innerHTML = "";

      if (data.length === 0) {
        tbody.innerHTML = `
	                    <tr>
	                        <td colspan="4" style="text-align:center">
	                            Chưa có lịch sử thanh toán
	                        </td>
	                    </tr>`;
        return;
      }

      data.forEach((p) => {
        tbody.innerHTML += `
	                    <tr>
	                        <td>${p.date}</td>
	                        <td>${p.feeCategory}</td>
	                        <td>${p.amount.toLocaleString()}đ</td>
	                        <td>${p.method}</td>
	                    </tr>`;
      });
    });
}

/* ==================================================
	   PAYMENT DEMO
	================================================== */
function pay(id) {
  alert("Demo thanh toán cho phí ID = " + id);
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
  alert("Yêu cầu hỗ trợ đã được gửi!");
  document.getElementById("supportText").value = "";
}

/* ==================================================
	   UI SECTION SWITCH
	================================================== */
function show(id) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
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
