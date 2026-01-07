// ==================================================
// ADMIN DASHBOARD FUNCTIONS
// ==================================================

// Check admin session
function checkAdminSession() {
    // Simple check - in production should verify with backend
    fetch('/api/auth/check-admin')
        .then(res => {
            if (res.status === 401) {
                window.location.href = '/login-admin.html';
            }
        })
        .catch(() => {
            // If endpoint doesn't exist, continue
        });
}

// ==================================================
// HOUSEHOLD MANAGEMENT
// ==================================================

let editingHouseholdId = null;

function loadHouseholds() {
    fetch('/api/households')
        .then(res => res.json())
        .then(households => {
            const tbody = document.getElementById('householdsTableBody');
            tbody.innerHTML = '';

            if (households.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Không có dữ liệu</td></tr>';
                return;
            }

            // Sort by ID ascending
            households.sort((a, b) => (a.id || 0) - (b.id || 0));

            households.forEach(h => {
                const row = `
                    <tr>
                        <td>${h.id}</td>
                        <td>${h.householdCode || ''}</td>
                        <td>${h.ownerName || ''}</td>
                        <td>${h.apartmentNumber || ''}</td>
                        <td>${h.phone || ''}</td>
                        <td>${h.membersCount || 0}</td>
                        <td>${h.active ? '<span style="color:green">Hoạt động</span>' : '<span style="color:red">Ngừng</span>'}</td>
                        <td>
                            <button class="btn" onclick="editHousehold(${h.id})">Sửa</button>
                            <button class="btn btn-danger" onclick="deleteHousehold(${h.id})">Xóa</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        })
        .catch(err => {
            console.error('Error loading households:', err);
            alert('Lỗi khi tải danh sách hộ dân');
        });
}

function openHouseholdForm() {
    editingHouseholdId = null;
    document.getElementById('householdFormTitle').textContent = 'Thêm hộ dân mới';
    document.getElementById('householdForm').reset();
    // Clear all errors
    ['householdCode', 'ownerName', 'apartmentNumber', 'phone', 'membersCount', 'moveOutDate'].forEach(id => {
        clearError(id);
    });
    document.getElementById('householdModal').style.display = 'block';
}

function editHousehold(id) {
    editingHouseholdId = id;
    fetch(`/api/households/${id}`)
        .then(res => res.json())
        .then(household => {
            document.getElementById('householdFormTitle').textContent = 'Sửa thông tin hộ dân';
            document.getElementById('householdCode').value = household.householdCode || '';
            document.getElementById('ownerName').value = household.ownerName || '';
            document.getElementById('apartmentNumber').value = household.apartmentNumber || '';
            document.getElementById('phone').value = household.phone || '';
            document.getElementById('membersCount').value = household.membersCount || '';
            document.getElementById('residenceStatus').value = household.residenceStatus || '';
            document.getElementById('householdOwnsApartment').checked = household.ownsApartment === true;
            document.getElementById('householdActive').checked = household.active !== false;
            if (household.moveInDate) {
                document.getElementById('moveInDate').value = household.moveInDate;
            }
            if (household.moveOutDate) {
                document.getElementById('moveOutDate').value = household.moveOutDate;
            }
            document.getElementById('householdModal').style.display = 'block';
        })
        .catch(err => {
            console.error('Error loading household:', err);
            alert('Lỗi khi tải thông tin hộ dân');
        });
}

// ==================================================
// VALIDATION FUNCTIONS
// ==================================================

function validatePhone(phone) {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    input.classList.add('error');
    let errorDiv = input.parentElement.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        input.parentElement.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function clearError(inputId) {
    const input = document.getElementById(inputId);
    input.classList.remove('error');
    const errorDiv = input.parentElement.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function validateHouseholdForm() {
    let isValid = true;
    
    // Validate household code
    const code = document.getElementById('householdCode').value.trim();
    if (!code) {
        showError('householdCode', 'Mã hộ không được để trống');
        isValid = false;
    } else if (code.length > 50) {
        showError('householdCode', 'Mã hộ không được quá 50 ký tự');
        isValid = false;
    } else {
        clearError('householdCode');
    }
    
    // Validate owner name
    const ownerName = document.getElementById('ownerName').value.trim();
    if (!ownerName) {
        showError('ownerName', 'Tên chủ hộ không được để trống');
        isValid = false;
    } else if (ownerName.length > 100) {
        showError('ownerName', 'Tên chủ hộ không được quá 100 ký tự');
        isValid = false;
    } else {
        clearError('ownerName');
    }
    
    // Validate apartment number
    const apartment = document.getElementById('apartmentNumber').value.trim();
    if (!apartment) {
        showError('apartmentNumber', 'Số căn hộ không được để trống');
        isValid = false;
    } else {
        clearError('apartmentNumber');
    }
    
    // Validate phone
    const phone = document.getElementById('phone').value.trim();
    if (phone && !validatePhone(phone)) {
        showError('phone', 'Số điện thoại không hợp lệ (10-11 chữ số)');
        isValid = false;
    } else {
        clearError('phone');
    }
    
    // Validate members count
    const membersCount = parseInt(document.getElementById('membersCount').value);
    if (document.getElementById('membersCount').value && (isNaN(membersCount) || membersCount < 1)) {
        showError('membersCount', 'Số thành viên phải là số nguyên dương');
        isValid = false;
    } else {
        clearError('membersCount');
    }
    
    // Validate dates
    const moveInDate = document.getElementById('moveInDate').value;
    const moveOutDate = document.getElementById('moveOutDate').value;
    if (moveInDate && moveOutDate && new Date(moveInDate) > new Date(moveOutDate)) {
        showError('moveOutDate', 'Ngày chuyển đi phải sau ngày vào ở');
        isValid = false;
    } else {
        clearError('moveOutDate');
    }
    
    return isValid;
}

function validateBillingPeriodForm() {
    let isValid = true;
    
    const year = parseInt(document.getElementById('periodYear').value);
    const month = parseInt(document.getElementById('periodMonth').value);
    const startDate = document.getElementById('periodStartDate').value;
    const endDate = document.getElementById('periodEndDate').value;
    
    if (!year || year < 2000 || year > 2100) {
        showError('periodYear', 'Năm phải từ 2000 đến 2100');
        isValid = false;
    } else {
        clearError('periodYear');
    }
    
    if (!month || month < 1 || month > 12) {
        showError('periodMonth', 'Tháng phải từ 1 đến 12');
        isValid = false;
    } else {
        clearError('periodMonth');
    }
    
    if (!startDate) {
        showError('periodStartDate', 'Ngày bắt đầu không được để trống');
        isValid = false;
    } else {
        clearError('periodStartDate');
    }
    
    if (!endDate) {
        showError('periodEndDate', 'Ngày kết thúc không được để trống');
        isValid = false;
    } else if (startDate && new Date(startDate) > new Date(endDate)) {
        showError('periodEndDate', 'Ngày kết thúc phải sau ngày bắt đầu');
        isValid = false;
    } else {
        clearError('periodEndDate');
    }
    
    return isValid;
}

function validateAccountForm() {
    let isValid = true;
    
    const username = document.getElementById('accountUsername').value.trim();
    const password = document.getElementById('accountPassword').value;
    const roleId = document.getElementById('accountRoleId').value;
    
    if (!username) {
        showError('accountUsername', 'Username không được để trống');
        isValid = false;
    } else if (username.length > 50) {
        showError('accountUsername', 'Username không được quá 50 ký tự');
        isValid = false;
    } else {
        clearError('accountUsername');
    }
    
    if (!editingAccountId && !password) {
        showError('accountPassword', 'Password không được để trống');
        isValid = false;
    } else if (password && password.length < 6) {
        showError('accountPassword', 'Password phải có ít nhất 6 ký tự');
        isValid = false;
    } else {
        clearError('accountPassword');
    }
    
    if (!roleId) {
        showError('accountRoleId', 'Vui lòng chọn vai trò');
        isValid = false;
    } else {
        clearError('accountRoleId');
    }
    
    return isValid;
}

function saveHousehold(event) {
    event.preventDefault();
    
    if (!validateHouseholdForm()) {
        return;
    }
    
    const household = {
        householdCode: document.getElementById('householdCode').value.trim(),
        ownerName: document.getElementById('ownerName').value.trim(),
        apartmentNumber: document.getElementById('apartmentNumber').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        membersCount: parseInt(document.getElementById('membersCount').value) || 0,
        residenceStatus: document.getElementById('residenceStatus').value,
        ownsApartment: document.getElementById('householdOwnsApartment').checked,
        active: document.getElementById('householdActive').checked,
        moveInDate: document.getElementById('moveInDate').value || null,
        moveOutDate: document.getElementById('moveOutDate').value || null
    };

    const url = editingHouseholdId 
        ? `/api/households/${editingHouseholdId}`
        : '/api/households';
    const method = editingHouseholdId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(household)
    })
    .then(res => {
        if (!res.ok) throw new Error('Lỗi khi lưu hộ dân');
        return res.json();
    })
    .then(() => {
        alert('Lưu thành công!');
        document.getElementById('householdModal').style.display = 'none';
        loadHouseholds();
    })
    .catch(err => {
        console.error('Error saving household:', err);
        alert('Lỗi khi lưu hộ dân: ' + err.message);
    });
}

function deleteHousehold(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa hộ dân này?')) return;

    fetch(`/api/households/${id}`, { method: 'DELETE' })
        .then(res => {
            if (!res.ok) throw new Error('Lỗi khi xóa');
            alert('Xóa thành công!');
            loadHouseholds();
        })
        .catch(err => {
            console.error('Error deleting household:', err);
            alert('Lỗi khi xóa hộ dân');
        });
}

// ==================================================
// BILLING PERIOD MANAGEMENT
// ==================================================

let editingPeriodId = null;

function loadBillingPeriods() {
    fetch('/api/billing-periods')
        .then(res => res.json())
        .then(periods => {
            const tbody = document.getElementById('billingPeriodsTableBody');
            tbody.innerHTML = '';

            if (periods.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Không có dữ liệu</td></tr>';
                return;
            }

            periods.sort((a, b) => {
                // First sort by year (descending), then month (descending), then ID (ascending)
                if (a.year !== b.year) return b.year - a.year;
                if (a.month !== b.month) return b.month - a.month;
                return (a.id || 0) - (b.id || 0);
            }).forEach(p => {
                const row = `
                    <tr>
                        <td>${p.id}</td>
                        <td>Tháng ${p.month}/${p.year}</td>
                        <td>${p.startDate || ''}</td>
                        <td>${p.endDate || ''}</td>
                        <td>${p.closed ? '<span style="color:red">Đã đóng</span>' : '<span style="color:green">Mở</span>'}</td>
                        <td>
                            <button class="btn" onclick="editBillingPeriod(${p.id})">Sửa</button>
                            <button class="btn btn-danger" onclick="deleteBillingPeriod(${p.id})">Xóa</button>
                            <button class="btn" onclick="viewPeriodDetails(${p.id})">Chi tiết</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        })
        .catch(err => {
            console.error('Error loading billing periods:', err);
            alert('Lỗi khi tải danh sách kỳ thu phí');
        });
}

function openBillingPeriodForm() {
    editingPeriodId = null;
    document.getElementById('billingPeriodFormTitle').textContent = 'Tạo kỳ thu phí mới';
    document.getElementById('billingPeriodForm').reset();
    // Clear errors
    ['periodYear', 'periodMonth', 'periodStartDate', 'periodEndDate'].forEach(id => {
        clearError(id);
    });
    document.getElementById('billingPeriodModal').style.display = 'block';
}

function editBillingPeriod(id) {
    editingPeriodId = id;
    fetch(`/api/billing-periods/${id}`)
        .then(res => res.json())
        .then(period => {
            document.getElementById('billingPeriodFormTitle').textContent = 'Sửa kỳ thu phí';
            document.getElementById('periodYear').value = period.year || '';
            document.getElementById('periodMonth').value = period.month || '';
            document.getElementById('periodStartDate').value = period.startDate || '';
            document.getElementById('periodEndDate').value = period.endDate || '';
            document.getElementById('periodClosed').checked = period.closed || false;
            // Clear errors
            ['periodYear', 'periodMonth', 'periodStartDate', 'periodEndDate'].forEach(id => {
                clearError(id);
            });
            document.getElementById('billingPeriodModal').style.display = 'block';
        })
        .catch(err => {
            console.error('Error loading billing period:', err);
            alert('Lỗi khi tải thông tin kỳ thu phí');
        });
}

function saveBillingPeriod(event) {
    event.preventDefault();
    
    if (!validateBillingPeriodForm()) {
        return;
    }
    
    const period = {
        year: parseInt(document.getElementById('periodYear').value),
        month: parseInt(document.getElementById('periodMonth').value),
        startDate: document.getElementById('periodStartDate').value,
        endDate: document.getElementById('periodEndDate').value,
        closed: document.getElementById('periodClosed').checked
    };

    const url = editingPeriodId 
        ? `/api/billing-periods/${editingPeriodId}`
        : '/api/billing-periods';
    const method = editingPeriodId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(period)
    })
    .then(res => {
        if (!res.ok) throw new Error('Lỗi khi lưu kỳ thu phí');
        return res.json();
    })
    .then(() => {
        alert('Lưu thành công!');
        document.getElementById('billingPeriodModal').style.display = 'none';
        loadBillingPeriods();
    })
    .catch(err => {
        console.error('Error saving billing period:', err);
        alert('Lỗi khi lưu kỳ thu phí: ' + err.message);
    });
}

function deleteBillingPeriod(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa kỳ thu phí này?')) return;

    fetch(`/api/billing-periods/${id}`, { method: 'DELETE' })
        .then(res => {
            if (!res.ok) throw new Error('Lỗi khi xóa');
            alert('Xóa thành công!');
            loadBillingPeriods();
        })
        .catch(err => {
            console.error('Error deleting billing period:', err);
            alert('Lỗi khi xóa kỳ thu phí');
        });
}

function viewPeriodDetails(id) {
    // Load billing period info first
    fetch(`/api/billing-periods/${id}`)
        .then(res => res.json())
        .then(period => {
            document.getElementById('periodInfoText').textContent = 
                `Tháng ${period.month}/${period.year} (${period.startDate || ''} - ${period.endDate || ''})`;
            document.getElementById('periodDetailsTitle').textContent = 
                `Chi tiết kỳ thu phí - Tháng ${period.month}/${period.year}`;
            
            // Load household fees for this period
            return fetch(`/api/household-fees/by-period/${id}`);
        })
        .then(res => res.json())
        .then(fees => {
            const modal = document.getElementById('periodDetailsModal');
            const tbody = document.getElementById('periodDetailsTableBody');
            tbody.innerHTML = '';

            if (fees.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align:center">Chưa có phí nào</td></tr>';
                document.getElementById('totalHouseholds').textContent = '0';
                document.getElementById('totalFees').textContent = '0';
                document.getElementById('totalAmount').textContent = '0đ';
            } else {
                // Sort by ID ascending
                fees.sort((a, b) => (a.id || 0) - (b.id || 0));
                
                // Calculate totals
                const uniqueHouseholds = new Set(fees.map(f => f.household?.id).filter(id => id));
                let totalAmount = 0;
                
                fees.forEach(fee => {
                    const amount = fee.amount ? parseFloat(fee.amount) : 0;
                    totalAmount += amount;
                    
                    const statusColor = fee.status === 'PAID' ? 'green' : 
                                      fee.status === 'PENDING' ? 'orange' : 'red';
                    const statusText = fee.status === 'PAID' ? 'Đã thanh toán' :
                                      fee.status === 'PENDING' ? 'Chờ thanh toán' :
                                      fee.status === 'OVERDUE' ? 'Quá hạn' : fee.status || 'Chờ thanh toán';
                    
                    const row = `
                        <tr>
                            <td>${fee.id || ''}</td>
                            <td>${fee.household?.householdCode || ''}</td>
                            <td>${fee.household?.ownerName || ''}</td>
                            <td>${fee.household?.apartmentNumber || ''}</td>
                            <td>${fee.feeCategory?.name || ''}</td>
                            <td>${fee.quantity ? fee.quantity.toLocaleString() : ''}</td>
                            <td>${fee.unitPrice ? formatMoney(fee.unitPrice) : ''}</td>
                            <td><strong>${formatMoney(amount)}</strong></td>
                            <td><span style="color:${statusColor}; font-weight:bold">${statusText}</span></td>
                            <td>${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('vi-VN') : ''}</td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
                
                document.getElementById('totalHouseholds').textContent = uniqueHouseholds.size;
                document.getElementById('totalFees').textContent = fees.length;
                document.getElementById('totalAmount').textContent = totalAmount.toLocaleString('vi-VN') + 'đ';
            }
            modal.style.display = 'block';
        })
        .catch(err => {
            console.error('Error loading period details:', err);
            alert('Lỗi khi tải chi tiết kỳ thu phí: ' + err.message);
        });
}

// ==================================================
// ACCOUNT MANAGEMENT
// ==================================================

let editingAccountId = null;

let allAccounts = []; // Store all accounts for filtering

function loadAccounts() {
    fetch('/api/accounts')
        .then(res => {
            console.log('Accounts API response status:', res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(accounts => {
            console.log('Loaded accounts:', accounts);
            allAccounts = accounts; // Store for filtering
            displayAccounts(accounts);
        })
        .catch(err => {
            console.error('Error loading accounts:', err);
            console.error('Error details:', err.message, err.stack);
            const tbody = document.getElementById('accountsTableBody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; color: red;">
                        Lỗi khi tải dữ liệu: ${err.message}<br>
                        <small>Vui lòng kiểm tra console để biết thêm chi tiết</small>
                    </td>
                </tr>
            `;
        });
}

function displayAccounts(accounts) {
    const tbody = document.getElementById('accountsTableBody');
    tbody.innerHTML = '';

    if (!accounts || accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Không có dữ liệu</td></tr>';
        return;
    }

    // Sort: Admin first, then Resident, and within each group sort by ID ascending
    const sortedAccounts = [...accounts].sort((a, b) => {
        const roleA = a.role?.name || '';
        const roleB = b.role?.name || '';
        
        // If both are ADMIN or both are RESIDENT, sort by ID ascending
        if (roleA === roleB) {
            return (a.id || 0) - (b.id || 0);
        }
        
        // Admin comes before Resident
        if (roleA === 'ADMIN' && roleB !== 'ADMIN') return -1;
        if (roleA !== 'ADMIN' && roleB === 'ADMIN') return 1;
        
        // Default: sort by ID
        return (a.id || 0) - (b.id || 0);
    });

    sortedAccounts.forEach(acc => {
        const roleName = acc.role?.name || 'N/A';
        const roleColor = roleName === 'ADMIN' ? '#e74c3c' : '#3498db';
        const roleIcon = roleName === 'ADMIN' ? '👨‍💼' : '👤';
        const residentInfo = acc.resident ? acc.resident.fullName : (roleName === 'ADMIN' ? '<span style="color:#999">Admin Account</span>' : '<span style="color:#999">Chưa liên kết</span>');
        
        const row = `
            <tr>
                <td>${acc.id}</td>
                <td><strong>${acc.username || ''}</strong></td>
                <td>
                    <span style="padding: 4px 8px; border-radius: 4px; background: ${roleColor}; color: white; font-size: 12px; font-weight: bold;">
                        ${roleIcon} ${roleName}
                    </span>
                </td>
                <td>${residentInfo}</td>
                <td>${acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                <td>
                    <button class="btn" onclick="viewAccountDetails(${acc.id})" title="Xem chi tiết">👁️</button>
                    <button class="btn" onclick="editAccount(${acc.id})" title="Sửa">✏️</button>
                    <button class="btn" onclick="resetAccountPassword(${acc.id})" title="Reset mật khẩu">🔑</button>
                    <button class="btn btn-danger" onclick="deleteAccount(${acc.id})" title="Xóa">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterAccounts() {
    const searchTerm = document.getElementById('searchAccount').value.toLowerCase();
    const roleFilter = document.getElementById('filterAccountRole').value;
    
    let filtered = allAccounts;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(acc => 
            acc.username?.toLowerCase().includes(searchTerm) ||
            acc.resident?.fullName?.toLowerCase().includes(searchTerm) ||
            acc.id.toString().includes(searchTerm)
        );
    }
    
    // Filter by role
    if (roleFilter) {
        filtered = filtered.filter(acc => acc.role?.id == roleFilter);
    }
    
    displayAccounts(filtered);
}

function viewAccountDetails(id) {
    fetch(`/api/accounts/${id}`)
        .then(res => res.json())
        .then(account => {
            const modal = document.getElementById('accountDetailsModal');
            document.getElementById('accountDetailsId').textContent = account.id || '';
            document.getElementById('accountDetailsUsername').textContent = account.username || '';
            document.getElementById('accountDetailsRole').textContent = account.role?.name || '';
            document.getElementById('accountDetailsResident').textContent = account.resident ? account.resident.fullName : 'N/A';
            document.getElementById('accountDetailsCreated').textContent = account.createdAt ? new Date(account.createdAt).toLocaleString('vi-VN') : '';
            document.getElementById('accountDetailsUpdated').textContent = account.updatedAt ? new Date(account.updatedAt).toLocaleString('vi-VN') : '';
            modal.style.display = 'block';
        })
        .catch(err => {
            console.error('Error loading account details:', err);
            alert('Lỗi khi tải thông tin tài khoản');
        });
}

function resetAccountPassword(id) {
    const newPassword = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }
    
    if (!confirm('Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản này?')) return;
    
    fetch(`/api/accounts/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPassword })
    })
    .then(res => {
        if (!res.ok) throw new Error('Lỗi khi reset mật khẩu');
        return res.json();
    })
    .then(() => {
        alert('Đặt lại mật khẩu thành công!');
        loadAccounts();
    })
    .catch(err => {
        console.error('Error resetting password:', err);
        alert('Lỗi khi đặt lại mật khẩu: ' + err.message);
    });
}

function openAccountForm() {
    editingAccountId = null;
    document.getElementById('accountFormTitle').textContent = 'Tạo tài khoản mới';
    document.getElementById('accountForm').reset();
    document.getElementById('accountPassword').required = true;
    document.getElementById('passwordRequired').textContent = '*';
    
    // Show resident field by default
    const residentGroup = document.getElementById('residentFieldGroup');
    if (residentGroup) {
        residentGroup.style.display = 'block';
    }
    
    // Clear errors
    ['accountUsername', 'accountPassword', 'accountRoleId'].forEach(id => {
        clearError(id);
    });
    
    loadResidentsForAccount();
    loadRolesForAccount();
    
    // Add event listener to show/hide resident field based on role
    setTimeout(() => {
        const roleSelect = document.getElementById('accountRoleId');
        if (roleSelect) {
            roleSelect.onchange = function() {
                const residentGroup = document.getElementById('residentFieldGroup');
                if (this.value === '2') { // ADMIN
                    if (residentGroup) residentGroup.style.display = 'none';
                    document.getElementById('accountResidentId').value = '';
                } else { // RESIDENT
                    if (residentGroup) residentGroup.style.display = 'block';
                }
            };
        }
    }, 100);
    
    document.getElementById('accountModal').style.display = 'block';
}

function loadResidentsForAccount() {
    fetch('/api/residents')
        .then(res => res.json())
        .then(residents => {
            const select = document.getElementById('accountResidentId');
            select.innerHTML = '<option value="">-- Chọn cư dân (tùy chọn) --</option>';
            residents.forEach(r => {
                select.innerHTML += `<option value="${r.id}">${r.fullName} (${r.idNumber || ''})</option>`;
            });
        })
        .catch(err => console.error('Error loading residents:', err));
}

function loadRolesForAccount() {
    // Try to load roles from API, fallback to hardcoded
    fetch('/api/roles')
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            return null;
        })
        .then(roles => {
            const select = document.getElementById('accountRoleId');
            if (roles && roles.length > 0) {
                select.innerHTML = '<option value="">-- Chọn vai trò --</option>';
                roles.forEach(role => {
                    const icon = role.name === 'ADMIN' ? '👨‍💼' : '👤';
                    select.innerHTML += `<option value="${role.id}">${icon} ${role.name}</option>`;
                });
            } else {
                // Fallback to hardcoded roles
                select.innerHTML = `
                    <option value="">-- Chọn vai trò --</option>
                    <option value="1">👤 RESIDENT - Cư dân</option>
                    <option value="2">👨‍💼 ADMIN - Quản trị viên</option>
                `;
            }
        })
        .catch(err => {
            console.error('Error loading roles:', err);
            // Fallback to hardcoded roles
            const select = document.getElementById('accountRoleId');
            select.innerHTML = `
                <option value="">-- Chọn vai trò --</option>
                <option value="1">👤 RESIDENT - Cư dân</option>
                <option value="2">👨‍💼 ADMIN - Quản trị viên</option>
            `;
        });
}

function editAccount(id) {
    editingAccountId = id;
    fetch(`/api/accounts/${id}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(account => {
            console.log('Loaded account for editing:', account);
            document.getElementById('accountFormTitle').textContent = 'Sửa tài khoản';
            document.getElementById('accountUsername').value = account.username || '';
            document.getElementById('accountPassword').value = '';
            document.getElementById('accountPassword').required = false;
            document.getElementById('passwordRequired').textContent = '(để trống nếu không đổi)';
            document.getElementById('accountRoleId').value = account.role?.id || '';
            document.getElementById('accountResidentId').value = account.resident?.id || '';
            
            // Show/hide resident field based on role
            const residentGroup = document.getElementById('residentFieldGroup');
            if (account.role?.id === 2) { // ADMIN
                if (residentGroup) residentGroup.style.display = 'none';
            } else {
                if (residentGroup) residentGroup.style.display = 'block';
            }
            
            // Add event listener to show/hide resident field based on role
            setTimeout(() => {
                const roleSelect = document.getElementById('accountRoleId');
                if (roleSelect) {
                    roleSelect.onchange = function() {
                        if (this.value === '2') { // ADMIN
                            if (residentGroup) residentGroup.style.display = 'none';
                            document.getElementById('accountResidentId').value = '';
                        } else { // RESIDENT
                            if (residentGroup) residentGroup.style.display = 'block';
                        }
                    };
                }
            }, 100);
            
            // Clear errors
            ['accountUsername', 'accountPassword', 'accountRoleId'].forEach(id => {
                clearError(id);
            });
            loadResidentsForAccount();
            loadRolesForAccount();
            document.getElementById('accountModal').style.display = 'block';
        })
        .catch(err => {
            console.error('Error loading account:', err);
            alert('Lỗi khi tải thông tin tài khoản: ' + err.message);
        });
}

function saveAccount(event) {
    event.preventDefault();
    
    if (!validateAccountForm()) {
        return;
    }
    
    const username = document.getElementById('accountUsername').value.trim();
    const password = document.getElementById('accountPassword').value;
    const roleId = parseInt(document.getElementById('accountRoleId').value);
    const residentIdValue = document.getElementById('accountResidentId').value;
    
    // Validate roleId
    if (isNaN(roleId) || roleId <= 0) {
        alert('Vui lòng chọn vai trò');
        return;
    }
    
    const account = {
        username: username,
        password: password,
        roleId: roleId,
        residentId: residentIdValue && residentIdValue.trim() !== '' ? parseInt(residentIdValue) : null
    };
    
    // Remove password from update if empty (when editing)
    if (editingAccountId && (!password || password.trim() === '')) {
        delete account.password;
    }

    const url = editingAccountId 
        ? `/api/accounts/${editingAccountId}`
        : '/api/accounts';
    const method = editingAccountId ? 'PUT' : 'POST';

    console.log('Saving account:', account); // Debug log
    
    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
    })
    .then(async res => {
        console.log('Response status:', res.status); // Debug log
        if (!res.ok) {
            let errorMessage = 'Lỗi khi lưu tài khoản';
            try {
                const errorData = await res.json();
                console.log('Error data:', errorData); // Debug log
                // Try different possible error message fields
                errorMessage = errorData.message || errorData.error || errorData.status || errorMessage;
                if (errorData.message && typeof errorData.message === 'string') {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                console.error('Error parsing error response:', e);
                // Try to get text response
                try {
                    const text = await res.text();
                    console.log('Error response text:', text);
                    if (text) {
                        errorMessage = text;
                    } else {
                        errorMessage = res.statusText || errorMessage;
                    }
                } catch (e2) {
                    errorMessage = res.statusText || errorMessage;
                }
            }
            throw new Error(errorMessage);
        }
        return res.json();
    })
    .then((data) => {
        console.log('Success:', data); // Debug log
        alert('Lưu thành công!');
        document.getElementById('accountModal').style.display = 'none';
        loadAccounts();
    })
    .catch(err => {
        console.error('Error saving account:', err);
        console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            account: account
        });
        alert('Lỗi khi lưu tài khoản: ' + err.message);
    });
}

function deleteAccount(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;

    fetch(`/api/accounts/${id}`, { method: 'DELETE' })
        .then(res => {
            if (!res.ok) throw new Error('Lỗi khi xóa');
            alert('Xóa thành công!');
            loadAccounts();
        })
        .catch(err => {
            console.error('Error deleting account:', err);
            alert('Lỗi khi xóa tài khoản');
        });
}

// ==================================================
// STATISTICS
// ==================================================

function loadStatistics() {
    const periodId = document.getElementById('statsPeriodSelect')?.value;
    
    if (!periodId) {
        // Load billing periods for dropdown
        fetch('/api/billing-periods')
            .then(res => res.json())
            .then(periods => {
                const select = document.getElementById('statsPeriodSelect');
                if (select) {
                    select.innerHTML = '<option value="">-- Chọn kỳ thu phí --</option>';
                    select.innerHTML += '<option value="all">📊 Tất cả các kỳ</option>';
                    periods.sort((a, b) => {
                        if (a.year !== b.year) return b.year - a.year;
                        if (a.month !== b.month) return b.month - a.month;
                        return (b.id || 0) - (a.id || 0);
                    });
                    periods.forEach(p => {
                        select.innerHTML += `<option value="${p.id}">Tháng ${p.month}/${p.year}</option>`;
                    });
                }
                document.getElementById('costStatsContent').innerHTML = 
                    '<p style="color: #666; font-style: italic;">Vui lòng chọn kỳ thu phí để xem thống kê</p>';
            })
            .catch(err => console.error('Error loading periods:', err));
        return;
    }
    
    // Check if "all periods" is selected
    if (periodId === 'all') {
        // Load statistics for all periods
        Promise.all([
            fetch('/api/fee-categories/active').then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
                return r.json();
            }),
            fetch('/api/household-fees').then(r => {
                if (!r.ok) {
                    console.error('Error fetching all fees:', r.status, r.statusText);
                    return r.json().then(data => {
                        console.error('Error response:', data);
                        return [];
                    }).catch(() => []);
                }
                return r.json().then(data => Array.isArray(data) ? data : []);
            }),
            fetch('/api/billing-periods').then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
                return r.json();
            }),
            fetch('/api/households').then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
                return r.json();
            })
        ])
        .then(([categories, fees, periods, households]) => {
            // Ensure all data is valid
            if (!Array.isArray(categories)) categories = [];
            if (!Array.isArray(fees)) fees = [];
            if (!Array.isArray(periods)) periods = [];
            if (!Array.isArray(households)) households = [];
            displayStatisticsAllPeriods(categories, fees, periods, households);
        })
        .catch(err => {
            console.error('Error loading statistics:', err);
            document.getElementById('costStatsContent').innerHTML = 
                '<p style="color: red;">Lỗi khi tải dữ liệu: ' + err.message + '</p>';
        });
        return;
    }
    
    // Load statistics for selected period
    Promise.all([
        fetch('/api/fee-categories/active').then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
            return r.json();
        }),
        fetch('/api/household-fees/by-period/' + periodId).then(r => {
            if (!r.ok) {
                console.error('Error fetching fees:', r.status, r.statusText);
                return r.json().then(data => {
                    console.error('Error response:', data);
                    return []; // Return empty array on error
                }).catch(() => {
                    return []; // Return empty array if JSON parse fails
                });
            }
            return r.json().then(data => {
                // Ensure response is an array
                if (Array.isArray(data)) {
                    return data;
                } else {
                    console.warn('Response is not an array:', data);
                    return [];
                }
            });
        }),
        fetch('/api/billing-periods/' + periodId).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
            return r.json();
        }),
        fetch('/api/households').then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
            return r.json();
        })
    ])
    .then(([categories, fees, period, households]) => {
        // Ensure fees is an array
        if (!Array.isArray(fees)) {
            console.error('Fees is not an array:', fees);
            fees = [];
        }
        // Ensure other data is valid
        if (!Array.isArray(categories)) categories = [];
        if (!Array.isArray(households)) households = [];
        if (!period) {
            throw new Error('Không tìm thấy kỳ thu phí');
        }
        displayStatistics(categories, fees, period, households);
    })
    .catch(err => {
        console.error('Error loading statistics:', err);
        document.getElementById('costStatsContent').innerHTML = 
            '<p style="color: red;">Lỗi khi tải dữ liệu: ' + err.message + '</p>';
    });
}

function displayStatistics(categories, fees, period, households) {
    const statsDiv = document.getElementById('costStatsContent');
    
    // Ensure fees is an array
    if (!Array.isArray(fees)) {
        console.error('Fees is not an array:', fees);
        fees = [];
    }
    if (!Array.isArray(categories)) {
        console.error('Categories is not an array:', categories);
        categories = [];
    }
    if (!Array.isArray(households)) {
        console.error('Households is not an array:', households);
        households = [];
    }
    
    // Create a map of existing fees: key = "householdId_categoryId"
    const feeMap = {};
    fees.forEach(fee => {
        if (fee && fee.household && fee.feeCategory) {
            const key = `${fee.household.id}_${fee.feeCategory.id}`;
            feeMap[key] = fee;
        }
    });
    
    // Calculate totals
    let grandTotal = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalHouseholds = households.length;
    
    fees.forEach(fee => {
        const amount = toMoneyInteger(fee.amount || 0);
        grandTotal = addMoney(grandTotal, amount);
        if (fee.status === 'PAID') {
            totalPaid++;
        } else {
            totalPending++;
        }
    });
    
    // Lưu dữ liệu tổng tiền kỳ thu phí để thống kê
    saveMoneyData(`period_${period.id}_total`, {
        periodId: period.id,
        periodMonth: period.month,
        periodYear: period.year,
        grandTotal: grandTotal,
        totalPaid: totalPaid,
        totalPending: totalPending,
        totalHouseholds: totalHouseholds,
        timestamp: new Date().toISOString()
    });
    
    // Store periodId for use in update functions
    window.currentPeriodId = period.id;
    
    // Build HTML
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
                    <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${fees.length}</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="color: #666; font-size: 14px;">Đã thanh toán</div>
                    <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${totalPaid}</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="color: #666; font-size: 14px;">Chờ thanh toán</div>
                    <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${totalPending}</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="color: #666; font-size: 14px;">Tổng tiền</div>
                    <div style="font-size: 24px; font-weight: bold; color: #e67e22;">${grandTotal.toLocaleString('vi-VN')}đ</div>
                </div>
            </div>
        </div>
    `;
    
    // Display each household with all fee categories
    households.sort((a, b) => (a.id || 0) - (b.id || 0)).forEach(household => {
        let householdTotal = 0;
        let householdPaid = 0;
        let householdPending = 0;
        
        // Calculate household totals using money-utils (số nguyên)
        categories.forEach(cat => {
            const key = `${household.id}_${cat.id}`;
            const fee = feeMap[key];
            if (fee) {
                const amount = toMoneyInteger(fee.amount || 0);
                householdTotal = addMoney(householdTotal, amount);
                if (fee.status === 'PAID') {
                    householdPaid++;
                } else {
                    householdPending++;
                }
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
                            ${formatMoney(householdTotal)}
                        </div>
                        <div style="font-size: 12px; color: #7f8c8d;">
                            ${householdPaid} đã trả / ${householdPending} chờ
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
                            </tr>
                        </thead>
                        <tbody id="householdTableBody_${household.id}">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    statsDiv.innerHTML = html;
    
    // Populate tables for each household
    households.forEach(household => {
        const tbody = document.getElementById(`householdTableBody_${household.id}`);
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Display all fee categories for this household
        categories.sort((a, b) => (a.id || 0) - (b.id || 0)).forEach(cat => {
            const key = `${household.id}_${cat.id}`;
            let fee = feeMap[key];
            
            // If no fee exists, create a placeholder
            if (!fee) {
                fee = {
                    id: null,
                    household: household,
                    feeCategory: cat,
                    quantity: null,
                    unitPrice: cat.defaultAmount || 0,
                    amount: 0,
                    status: 'PENDING'
                };
            }
            
            // Sử dụng money-utils để đảm bảo tính toán chính xác
            const amount = toMoneyInteger(fee.amount || 0);
            const quantity = fee.quantity !== null && fee.quantity !== undefined ? fee.quantity : '';
            const unitPrice = fee.unitPrice !== null && fee.unitPrice !== undefined ? toMoneyInteger(fee.unitPrice) : toMoneyInteger(cat.defaultAmount || 0);
            const statusColor = fee.status === 'PAID' ? '#27ae60' : 
                              fee.status === 'PENDING' ? '#f39c12' : '#e74c3c';
            const statusText = fee.status === 'PAID' ? 'Đã trả' :
                              fee.status === 'PENDING' ? 'Chờ trả' : 'Quá hạn';
            
            tbody.innerHTML += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">
                        <strong>${cat.name}</strong>
                        ${cat.description ? `<br><small style="color: #7f8c8d;">${cat.description}</small>` : ''}
                    </td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${cat.unit || 'N/A'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">
                        <input type="number" step="0.01" value="${quantity}" 
                               data-household-id="${household.id}"
                               data-category-id="${cat.id}"
                               data-fee-id="${fee.id || ''}"
                               data-input-type="quantity"
                               onchange="updateFeeQuantity(${fee.id || 'null'}, ${household.id}, ${cat.id}, ${period.id}, this.value)" 
                               oninput="calculateAmount(${household.id}, ${cat.id})"
                               placeholder="Nhập số lượng"
                               style="width: 100px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; text-align: right;">
                    </td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">
                        <input type="number" step="0.01" value="${unitPrice}" 
                               data-household-id="${household.id}"
                               data-category-id="${cat.id}"
                               data-fee-id="${fee.id || ''}"
                               data-input-type="unitPrice"
                               onchange="updateFeeUnitPrice(${fee.id || 'null'}, ${household.id}, ${cat.id}, ${period.id}, this.value)" 
                               oninput="calculateAmount(${household.id}, ${cat.id})"
                               style="width: 120px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; text-align: right;">
                    </td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;" id="amount_${household.id}_${cat.id}">
                        ${formatMoney(amount)}
                    </td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                        <select onchange="updateFeeStatus(${fee.id || 'null'}, ${household.id}, ${cat.id}, ${period.id}, this.value)" 
                                style="padding: 5px; border: 1px solid #ddd; border-radius: 4px; color: ${statusColor};">
                            <option value="PENDING" ${fee.status === 'PENDING' ? 'selected' : ''}>Chờ trả</option>
                            <option value="PAID" ${fee.status === 'PAID' ? 'selected' : ''}>Đã trả</option>
                            <option value="OVERDUE" ${fee.status === 'OVERDUE' ? 'selected' : ''}>Quá hạn</option>
                        </select>
                    </td>
                </tr>
            `;
        });
    });
}

function calculateAmount(householdId, categoryId) {
    // Find quantity and unit price inputs for this household and category
    const quantityInput = document.querySelector(`input[data-household-id="${householdId}"][data-category-id="${categoryId}"][data-input-type="quantity"]`);
    const unitPriceInput = document.querySelector(`input[data-household-id="${householdId}"][data-category-id="${categoryId}"][data-input-type="unitPrice"]`);
    
    if (!quantityInput || !unitPriceInput) return;
    
    // Sử dụng money-utils để tính toán chính xác
    const quantity = quantityInput.value || 0;
    const unitPrice = unitPriceInput.value || 0;
    const amount = multiplyMoney(quantity, unitPrice); // Tính bằng số nguyên
    
    // Update amount display immediately với format đầy đủ số không
    const amountCell = document.getElementById(`amount_${householdId}_${categoryId}`);
    if (amountCell) {
        amountCell.textContent = formatMoney(amount);
    }
    
    // Update household total
    updateHouseholdTotal(householdId);
}

function updateFeeQuantity(feeId, householdId, categoryId, periodId, quantity) {
    const qty = toMoneyInteger(quantity);
    
    // Get unit price from input
    const unitPriceInput = document.querySelector(`input[data-household-id="${householdId}"][data-category-id="${categoryId}"][data-input-type="unitPrice"]`);
    const unitPrice = unitPriceInput ? toMoneyInteger(unitPriceInput.value) : 0;
    
    // Calculate amount using money-utils (số nguyên)
    const amount = multiplyMoney(qty, unitPrice);
    
    // Update or create fee
    updateFeeField(feeId, householdId, categoryId, periodId, 'quantity', qty, amount);
}

function updateFeeUnitPrice(feeId, householdId, categoryId, periodId, unitPrice) {
    const price = toMoneyInteger(unitPrice);
    
    // Get quantity from input
    const quantityInput = document.querySelector(`input[data-household-id="${householdId}"][data-category-id="${categoryId}"][data-input-type="quantity"]`);
    const quantity = quantityInput ? toMoneyInteger(quantityInput.value) : 0;
    
    // Calculate amount using money-utils (số nguyên)
    const amount = multiplyMoney(quantity, price);
    
    // Update or create fee
    updateFeeField(feeId, householdId, categoryId, periodId, 'unitPrice', price, amount);
}

function updateFeeStatus(feeId, householdId, categoryId, periodId, status) {
    updateFeeField(feeId, householdId, categoryId, periodId, 'status', status, null);
}

function updateFeeField(feeId, householdId, categoryId, periodId, field, value, calculatedAmount) {
    // If feeId is null, create new fee
    if (!feeId || feeId === 'null' || feeId === null) {
        // Get current values from inputs using data attributes
        const quantityInput = document.querySelector(`input[data-household-id="${householdId}"][data-category-id="${categoryId}"][data-input-type="quantity"]`);
        const unitPriceInput = document.querySelector(`input[data-household-id="${householdId}"][data-category-id="${categoryId}"][data-input-type="unitPrice"]`);
        
        let quantity = 0;
        let unitPrice = 0;
        
        if (field === 'quantity') {
            quantity = toMoneyInteger(value);
            unitPrice = unitPriceInput ? toMoneyInteger(unitPriceInput.value) : 0;
        } else if (field === 'unitPrice') {
            quantity = quantityInput ? toMoneyInteger(quantityInput.value) : 0;
            unitPrice = toMoneyInteger(value);
        } else if (field === 'status') {
            quantity = quantityInput ? toMoneyInteger(quantityInput.value) : 0;
            unitPrice = unitPriceInput ? toMoneyInteger(unitPriceInput.value) : 0;
        }
        
        // Only create fee if quantity or unitPrice is provided
        if (quantity === 0 && unitPrice === 0 && field !== 'status') {
            return; // Don't create empty fee
        }
        
        // Get due date from billing period or use current date
        const dueDate = new Date().toISOString().split('T')[0]; // Default to today
        
        // Tính amount bằng money-utils (số nguyên)
        const finalAmount = calculatedAmount !== null ? toMoneyInteger(calculatedAmount) : multiplyMoney(quantity, unitPrice);
        
        const newFee = {
            household: { id: householdId },
            feeCategory: { id: categoryId },
            billingPeriod: { id: periodId },
            quantity: quantity,
            unitPrice: unitPrice,
            amount: finalAmount,
            status: field === 'status' ? value : 'PENDING',
            dueDate: dueDate
        };
        
        fetch('/api/household-fees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFee)
        })
        .then(res => {
            if (!res.ok) throw new Error('Lỗi khi tạo phí');
            return res.json();
        })
        .then(fee => {
            // Update data-fee-id in inputs so next time it will update instead of create
            const quantityInput = document.querySelector(`input[data-household-id="${householdId}"][data-category-id="${categoryId}"][data-input-type="quantity"]`);
            const unitPriceInput = document.querySelector(`input[data-household-id="${householdId}"][data-category-id="${categoryId}"][data-input-type="unitPrice"]`);
            const statusSelect = document.querySelector(`select[onchange*="updateFeeStatus"][onchange*="${householdId}"][onchange*="${categoryId}"]`);
            
            if (quantityInput && fee.id) {
                quantityInput.setAttribute('data-fee-id', fee.id);
                quantityInput.setAttribute('onchange', `updateFeeQuantity(${fee.id}, ${householdId}, ${categoryId}, ${periodId}, this.value)`);
            }
            if (unitPriceInput && fee.id) {
                unitPriceInput.setAttribute('data-fee-id', fee.id);
                unitPriceInput.setAttribute('onchange', `updateFeeUnitPrice(${fee.id}, ${householdId}, ${categoryId}, ${periodId}, this.value)`);
            }
            if (statusSelect && fee.id) {
                // Update status select onchange to use the new fee id
                const currentOnchange = statusSelect.getAttribute('onchange');
                if (currentOnchange && currentOnchange.includes('null')) {
                    statusSelect.setAttribute('onchange', `updateFeeStatus(${fee.id}, ${householdId}, ${categoryId}, ${periodId}, this.value)`);
                }
            }
            
            // Update amount display với format đầy đủ số không
            const amountCell = document.getElementById(`amount_${householdId}_${categoryId}`);
            if (amountCell) {
                amountCell.textContent = formatMoney(fee.amount || 0);
            }
            // Update household total
            updateHouseholdTotal(householdId);
            // Show success message briefly
            console.log('Fee saved successfully:', fee.id);
        })
        .catch(err => {
            console.error('Error creating fee:', err);
            alert('Lỗi khi tạo phí: ' + err.message);
        });
        return;
    }
    
    // Update existing fee
    fetch(`/api/household-fees/${feeId}`)
        .then(res => res.json())
        .then(fee => {
            if (field === 'quantity') {
                fee.quantity = value;
            } else if (field === 'unitPrice') {
                fee.unitPrice = value;
            } else if (field === 'status') {
                fee.status = value;
            }
            
            // Recalculate amount if quantity or unitPrice changed using money-utils
            if (field === 'quantity' || field === 'unitPrice') {
                const qty = toMoneyInteger(fee.quantity || 0);
                const price = toMoneyInteger(fee.unitPrice || 0);
                fee.amount = calculatedAmount !== null ? toMoneyInteger(calculatedAmount) : multiplyMoney(qty, price);
            }
            
            return fetch(`/api/household-fees/${feeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fee)
            });
        })
        .then(res => {
            if (!res.ok) throw new Error('Lỗi khi cập nhật');
            return res.json();
        })
        .then(updatedFee => {
            // Update amount display với format đầy đủ số không
            const amountCell = document.getElementById(`amount_${householdId}_${categoryId}`);
            if (amountCell && (field === 'quantity' || field === 'unitPrice')) {
                amountCell.textContent = formatMoney(updatedFee.amount || 0);
            }
            // Update household total
            updateHouseholdTotal(householdId);
            // Don't reload - data is already updated in database and displayed correctly
        })
        .catch(err => {
            console.error('Error updating fee:', err);
            alert('Lỗi khi cập nhật: ' + err.message);
        });
}

function updateHouseholdTotal(householdId) {
    // Find all amount cells for this household and recalculate total
    const tbody = document.getElementById(`householdTableBody_${householdId}`);
    if (!tbody) return;
    
    // Sử dụng money-utils để tính tổng chính xác
    const amountCells = tbody.querySelectorAll(`[id^="amount_${householdId}_"]`);
    const total = calculateTotalFromCells(amountCells);
    
    // Find and update household total display với format đầy đủ số không
    const householdCard = tbody.closest('div[style*="background: white"]');
    if (householdCard) {
        const totalElement = householdCard.querySelector('div[style*="font-size: 20px"][style*="color: #e67e22"]');
        if (totalElement) {
            totalElement.textContent = formatMoney(total);
        }
    }
    
    // Lưu dữ liệu tổng tiền của hộ dân để thống kê
    saveMoneyData(`household_${householdId}_total`, {
        householdId: householdId,
        total: total,
        timestamp: new Date().toISOString()
    });
}

function displayStatisticsAllPeriods(categories, fees, periods, households) {
    const statsDiv = document.getElementById('costStatsContent');
    
    // Create a map of existing fees: key = "householdId_categoryId"
    const feeMap = {};
    fees.forEach(fee => {
        const key = `${fee.household?.id}_${fee.feeCategory?.id}`;
        if (!feeMap[key]) {
            feeMap[key] = [];
        }
        feeMap[key].push(fee);
    });
    
    // Calculate totals across all periods
    let grandTotal = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalHouseholds = households.length;
    
    fees.forEach(fee => {
        const amount = toMoneyInteger(fee.amount || 0);
        grandTotal = addMoney(grandTotal, amount);
        if (fee.status === 'PAID') {
            totalPaid++;
        } else {
            totalPending++;
        }
    });
    
    // Lưu dữ liệu tổng tiền tất cả các kỳ để thống kê
    saveMoneyData('all_periods_total', {
        grandTotal: grandTotal,
        totalPaid: totalPaid,
        totalPending: totalPending,
        totalHouseholds: totalHouseholds,
        timestamp: new Date().toISOString()
    });
    
    // Build HTML
    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">📊 Thống kê tất cả các kỳ</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="color: #666; font-size: 14px;">Tổng số hộ dân</div>
                    <div style="font-size: 24px; font-weight: bold; color: #3498db;">${totalHouseholds}</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="color: #666; font-size: 14px;">Tổng số phí</div>
                    <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${fees.length}</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="color: #666; font-size: 14px;">Đã thanh toán</div>
                    <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${totalPaid}</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="color: #666; font-size: 14px;">Chờ thanh toán</div>
                    <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${totalPending}</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="color: #666; font-size: 14px;">Tổng tiền</div>
                    <div style="font-size: 24px; font-weight: bold; color: #e67e22;">${formatMoney(grandTotal)}</div>
                </div>
            </div>
            <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 6px; color: #856404;">
                <strong>Lưu ý:</strong> Để quản lý và nhập liệu chi tiết, vui lòng chọn một kỳ thu phí cụ thể.
            </div>
        </div>
    `;
    
    statsDiv.innerHTML = html;
}


// ==================================================
// REPORTS
// ==================================================

function loadReports() {
    const reportsDiv = document.getElementById('reportsContent');
    reportsDiv.innerHTML = `
        <h3>Xuất báo cáo</h3>
        <div style="margin: 20px 0;">
            <h4>Danh sách hộ dân</h4>
            <button class="btn btn-success" onclick="exportReport('households')">📊 Xuất Excel</button>
            <button class="btn" onclick="exportToPDF('households')">📄 Xuất PDF</button>
        </div>
        <div style="margin: 20px 0;">
            <h4>Danh sách phí</h4>
            <button class="btn btn-success" onclick="exportReport('fees')">📊 Xuất Excel</button>
            <button class="btn" onclick="exportToPDF('fees')">📄 Xuất PDF</button>
        </div>
        <div style="margin: 20px 0;">
            <h4>Lịch sử thanh toán</h4>
            <button class="btn btn-success" onclick="exportReport('payments')">📊 Xuất Excel</button>
            <button class="btn" onclick="exportToPDF('payments')">📄 Xuất PDF</button>
        </div>
    `;
}

// ==================================================
// EXPORT FUNCTIONS
// ==================================================

function exportReport(type) {
    switch(type) {
        case 'households':
            exportHouseholdsToExcel();
            break;
        case 'fees':
            exportFeesToExcel();
            break;
        case 'payments':
            exportPaymentsToExcel();
            break;
        default:
            alert('Loại báo cáo không hợp lệ');
    }
}

function exportHouseholdsToExcel() {
    fetch('/api/households')
        .then(res => res.json())
        .then(households => {
            const data = households.map(h => ({
                'ID': h.id,
                'Mã hộ': h.householdCode || '',
                'Chủ hộ': h.ownerName || '',
                'Căn hộ': h.apartmentNumber || '',
                'Số điện thoại': h.phone || '',
                'Số thành viên': h.membersCount || 0,
                'Tình trạng': h.residenceStatus || '',
                'Trạng thái': h.active ? 'Hoạt động' : 'Ngừng',
                'Ngày vào ở': h.moveInDate || '',
                'Ngày chuyển đi': h.moveOutDate || ''
            }));
            exportToExcel(data, 'Danh_sach_ho_dan');
        })
        .catch(err => {
            console.error('Error exporting households:', err);
            alert('Lỗi khi xuất dữ liệu');
        });
}

function exportFeesToExcel() {
    fetch('/api/household-fees')
        .then(res => res.json())
        .then(fees => {
            const data = fees.map(f => ({
                'ID': f.id,
                'Mã hộ': f.household?.householdCode || '',
                'Chủ hộ': f.household?.ownerName || '',
                'Loại phí': f.feeCategory?.name || '',
                'Kỳ thu phí': f.billingPeriod ? `Tháng ${f.billingPeriod.month}/${f.billingPeriod.year}` : '',
                'Số lượng': f.quantity || 0,
                'Đơn giá': f.unitPrice || 0,
                'Tổng tiền': f.amount || 0,
                'Trạng thái': f.status || '',
                'Hạn thanh toán': f.dueDate || ''
            }));
            exportToExcel(data, 'Danh_sach_phi');
        })
        .catch(err => {
            console.error('Error exporting fees:', err);
            alert('Lỗi khi xuất dữ liệu');
        });
}

function exportPaymentsToExcel() {
    fetch('/api/payments')
        .then(res => res.json())
        .then(payments => {
            const data = payments.map(p => ({
                'ID': p.id,
                'Số tiền': p.amount || 0,
                'Phương thức': p.method || '',
                'Ghi chú': p.note || '',
                'Ngày thanh toán': p.paidAt || '',
                'Mã hộ': p.householdFee?.household?.householdCode || '',
                'Loại phí': p.householdFee?.feeCategory?.name || ''
            }));
            exportToExcel(data, 'Lich_su_thanh_toan');
        })
        .catch(err => {
            console.error('Error exporting payments:', err);
            alert('Lỗi khi xuất dữ liệu');
        });
}

function exportToExcel(data, filename) {
    // Check if SheetJS is available
    if (typeof XLSX === 'undefined') {
        // Fallback to CSV
        exportToCSV(data, filename);
        return;
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename + '.xlsx');
    alert('Xuất file Excel thành công!');
}

function exportToCSV(data, filename) {
    if (data.length === 0) {
        alert('Không có dữ liệu để xuất');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"')) {
                return '"' + stringValue.replace(/"/g, '""') + '"';
            }
            return stringValue;
        });
        csvRows.push(values.join(','));
    });
    
    const csv = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename + '.csv';
    link.click();
    alert('Xuất file CSV thành công!');
}

function exportToPDF(type) {
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
        alert('Thư viện PDF chưa được tải. Vui lòng tải lại trang.');
        return;
    }
    
    const { jsPDF } = window.jspdf || { jsPDF: jsPDF };
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Báo cáo ' + type, 14, 20);
    
    switch(type) {
        case 'households':
            exportHouseholdsToPDF(doc);
            break;
        case 'fees':
            exportFeesToPDF(doc);
            break;
        case 'payments':
            exportPaymentsToPDF(doc);
            break;
    }
}

function exportHouseholdsToPDF(doc) {
    fetch('/api/households')
        .then(res => res.json())
        .then(households => {
            doc.setFontSize(12);
            let y = 30;
            households.forEach((h, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`${index + 1}. ${h.householdCode} - ${h.ownerName} - ${h.apartmentNumber}`, 14, y);
                y += 7;
            });
            doc.save('Danh_sach_ho_dan.pdf');
            alert('Xuất file PDF thành công!');
        })
        .catch(err => {
            console.error('Error exporting to PDF:', err);
            alert('Lỗi khi xuất PDF');
        });
}

function exportFeesToPDF(doc) {
    fetch('/api/household-fees')
        .then(res => res.json())
        .then(fees => {
            doc.setFontSize(10);
            let y = 30;
            fees.forEach((f, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                const text = `${index + 1}. ${f.household?.householdCode || ''} - ${f.feeCategory?.name || ''} - ${f.amount || 0}đ`;
                doc.text(text, 14, y);
                y += 7;
            });
            doc.save('Danh_sach_phi.pdf');
            alert('Xuất file PDF thành công!');
        })
        .catch(err => {
            console.error('Error exporting to PDF:', err);
            alert('Lỗi khi xuất PDF');
        });
}

function exportPaymentsToPDF(doc) {
    fetch('/api/payments')
        .then(res => res.json())
        .then(payments => {
            doc.setFontSize(10);
            let y = 30;
            payments.forEach((p, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                const text = `${index + 1}. ${p.amount || 0}đ - ${p.method || ''} - ${p.paidAt || ''}`;
                doc.text(text, 14, y);
                y += 7;
            });
            doc.save('Lich_su_thanh_toan.pdf');
            alert('Xuất file PDF thành công!');
        })
        .catch(err => {
            console.error('Error exporting to PDF:', err);
            alert('Lỗi khi xuất PDF');
        });
}

// ==================================================
// FEE CATEGORY MANAGEMENT
// ==================================================

let editingFeeCategoryId = null;
let allFeeCategories = [];

function loadFeeCategories() {
    fetch('/api/fee-categories')
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(categories => {
            allFeeCategories = categories;
            displayFeeCategories(categories);
        })
        .catch(err => {
            console.error('Error loading fee categories:', err);
            document.getElementById('feeCategoriesTableBody').innerHTML = 
                '<tr><td colspan="9" style="text-align:center; color: red;">Lỗi khi tải dữ liệu</td></tr>';
        });
}

function displayFeeCategories(categories) {
    const tbody = document.getElementById('feeCategoriesTableBody');
    tbody.innerHTML = '';

    if (!categories || categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center">Không có dữ liệu</td></tr>';
        return;
    }

    // Sort by ID ascending
    categories.sort((a, b) => (a.id || 0) - (b.id || 0));

    categories.forEach(cat => {
        const row = `
            <tr>
                <td>${cat.id}</td>
                <td><strong>${cat.code || ''}</strong></td>
                <td>${cat.name || ''}</td>
                <td>${cat.description || '<span style="color:#999">-</span>'}</td>
                <td>${cat.unit || '<span style="color:#999">-</span>'}</td>
                <td>${cat.defaultAmount ? cat.defaultAmount.toLocaleString('vi-VN') + 'đ' : '<span style="color:#999">-</span>'}</td>
                <td>${cat.fixedMonthly ? '<span style="color:green">✓</span>' : '<span style="color:red">✗</span>'}</td>
                <td>${cat.active ? '<span style="color:green">Hoạt động</span>' : '<span style="color:red">Ngừng</span>'}</td>
                <td>
                    <button class="btn" onclick="editFeeCategory(${cat.id})" title="Sửa">✏️</button>
                    <button class="btn btn-danger" onclick="deleteFeeCategory(${cat.id})" title="Xóa">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function openFeeCategoryForm() {
    editingFeeCategoryId = null;
    document.getElementById('feeCategoryFormTitle').textContent = 'Thêm loại phí mới';
    document.getElementById('feeCategoryForm').reset();
    document.getElementById('feeCategoryFixedMonthly').checked = true;
    document.getElementById('feeCategoryActive').checked = true;
    // Clear errors
    ['feeCategoryCode', 'feeCategoryName'].forEach(id => {
        clearError(id);
    });
    document.getElementById('feeCategoryModal').style.display = 'block';
}

function editFeeCategory(id) {
    editingFeeCategoryId = id;
    fetch(`/api/fee-categories/${id}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(category => {
            document.getElementById('feeCategoryFormTitle').textContent = 'Sửa loại phí';
            document.getElementById('feeCategoryCode').value = category.code || '';
            document.getElementById('feeCategoryName').value = category.name || '';
            document.getElementById('feeCategoryDescription').value = category.description || '';
            document.getElementById('feeCategoryUnit').value = category.unit || '';
            document.getElementById('feeCategoryDefaultAmount').value = category.defaultAmount || '';
            document.getElementById('feeCategoryFixedMonthly').checked = category.fixedMonthly !== false;
            document.getElementById('feeCategoryActive').checked = category.active !== false;
            // Clear errors
            ['feeCategoryCode', 'feeCategoryName'].forEach(id => {
                clearError(id);
            });
            document.getElementById('feeCategoryModal').style.display = 'block';
        })
        .catch(err => {
            console.error('Error loading fee category:', err);
            alert('Lỗi khi tải thông tin loại phí: ' + err.message);
        });
}

function saveFeeCategory(event) {
    event.preventDefault();
    
    if (!validateFeeCategoryForm()) {
        return;
    }
    
    const category = {
        code: document.getElementById('feeCategoryCode').value.trim(),
        name: document.getElementById('feeCategoryName').value.trim(),
        description: document.getElementById('feeCategoryDescription').value.trim(),
        unit: document.getElementById('feeCategoryUnit').value.trim(),
        defaultAmount: document.getElementById('feeCategoryDefaultAmount').value ? 
            parseFloat(document.getElementById('feeCategoryDefaultAmount').value) : null,
        fixedMonthly: document.getElementById('feeCategoryFixedMonthly').checked,
        active: document.getElementById('feeCategoryActive').checked
    };

    const url = editingFeeCategoryId 
        ? `/api/fee-categories/${editingFeeCategoryId}`
        : '/api/fee-categories';
    const method = editingFeeCategoryId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
    })
    .then(async res => {
        if (!res.ok) {
            let errorMessage = 'Lỗi khi lưu loại phí';
            try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = res.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        return res.json();
    })
    .then(() => {
        alert('Lưu thành công!');
        document.getElementById('feeCategoryModal').style.display = 'none';
        loadFeeCategories();
    })
    .catch(err => {
        console.error('Error saving fee category:', err);
        alert('Lỗi khi lưu loại phí: ' + err.message);
    });
}

function deleteFeeCategory(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa loại phí này?')) return;
    
    fetch(`/api/fee-categories/${id}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (!res.ok) throw new Error('Lỗi khi xóa loại phí');
        return res;
    })
    .then(() => {
        alert('Xóa thành công!');
        loadFeeCategories();
    })
    .catch(err => {
        console.error('Error deleting fee category:', err);
        alert('Lỗi khi xóa loại phí: ' + err.message);
    });
}

function validateFeeCategoryForm() {
    let isValid = true;
    
    const code = document.getElementById('feeCategoryCode').value.trim();
    const name = document.getElementById('feeCategoryName').value.trim();
    
    if (!code) {
        showError('feeCategoryCode', 'Mã loại phí không được để trống');
        isValid = false;
    } else if (code.length > 50) {
        showError('feeCategoryCode', 'Mã loại phí không được quá 50 ký tự');
        isValid = false;
    } else {
        clearError('feeCategoryCode');
    }
    
    if (!name) {
        showError('feeCategoryName', 'Tên loại phí không được để trống');
        isValid = false;
    } else if (name.length > 100) {
        showError('feeCategoryName', 'Tên loại phí không được quá 100 ký tự');
        isValid = false;
    } else {
        clearError('feeCategoryName');
    }
    
    return isValid;
}

function filterFeeCategories() {
    const searchTerm = document.getElementById('searchFeeCategory').value.toLowerCase();
    let filtered = allFeeCategories;
    
    if (searchTerm) {
        filtered = filtered.filter(cat => 
            cat.code?.toLowerCase().includes(searchTerm) ||
            cat.name?.toLowerCase().includes(searchTerm) ||
            cat.description?.toLowerCase().includes(searchTerm) ||
            cat.id.toString().includes(searchTerm)
        );
    }
    
    displayFeeCategories(filtered);
}


// ==================================================
// UI HELPERS
// ==================================================

function show(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        
        // Load data when section is shown
        if (sectionId === 'households') {
            loadHouseholds();
        } else if (sectionId === 'billing') {
            loadBillingPeriods();
        } else if (sectionId === 'accounts') {
            loadAccounts();
        } else if (sectionId === 'fee-categories') {
            loadFeeCategories();
        } else if (sectionId === 'cost-stats') {
            loadStatistics();
        } else if (sectionId === 'reports') {
            loadReports();
        }
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function filterHouseholds() {
    const searchTerm = document.getElementById('searchHousehold').value.toLowerCase();
    const rows = document.querySelectorAll('#householdsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
    loadHouseholds(); // Load default section
});

