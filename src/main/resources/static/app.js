// Xử lý đăng nhập cư dân
function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("userEmail").value;
    const pass = document.getElementById("userPassword").value;

    // gọi API thật sau
    if (email && pass) {
        alert("Đăng nhập cư dân thành công!");
        window.location.href = "user-dashboard.html"; // trang sau đăng nhập
    }

    return false;
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
