/**
 * Money Utility Functions
 * Xử lý tính toán và format tiền tệ cho hệ thống quản lý phí
 */

/**
 * Chuyển đổi giá trị tiền thành số nguyên (để tính toán chính xác)
 * @param {number|string} value - Giá trị cần chuyển đổi
 * @returns {number} Số nguyên (đơn vị: đồng)
 */
function toMoneyInteger(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    // Chuyển thành số và làm tròn về số nguyên
    const num = parseFloat(value);
    if (isNaN(num)) {
        return 0;
    }
    // Làm tròn về số nguyên (đồng)
    return Math.round(num);
}

/**
 * Cộng các giá trị tiền (sử dụng số nguyên để tránh lỗi làm tròn)
 * @param {...number} values - Các giá trị cần cộng
 * @returns {number} Tổng (số nguyên)
 */
function addMoney(...values) {
    return values.reduce((sum, value) => {
        return sum + toMoneyInteger(value);
    }, 0);
}

/**
 * Nhân hai giá trị tiền (sử dụng số nguyên)
 * @param {number|string} a - Số lượng
 * @param {number|string} b - Đơn giá
 * @returns {number} Thành tiền (số nguyên)
 */
function multiplyMoney(a, b) {
    const aInt = toMoneyInteger(a);
    const bInt = toMoneyInteger(b);
    return aInt * bInt;
}

/**
 * Format tiền để hiển thị (đầy đủ số không)
 * @param {number|string} value - Giá trị cần format
 * @param {boolean} showCurrency - Có hiển thị ký hiệu "đ" không (mặc định: true)
 * @returns {string} Chuỗi đã format (ví dụ: "1.234.567đ" hoặc "1.234.567")
 */
function formatMoney(value, showCurrency = true) {
    const intValue = toMoneyInteger(value);
    
    // Format với dấu chấm phân cách hàng nghìn
    const formatted = intValue.toLocaleString('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return showCurrency ? formatted + 'đ' : formatted;
}

/**
 * Parse giá trị tiền từ chuỗi đã format
 * @param {string} formattedValue - Chuỗi đã format (ví dụ: "1.234.567đ")
 * @returns {number} Số nguyên
 */
function parseMoney(formattedValue) {
    if (!formattedValue) return 0;
    // Loại bỏ tất cả ký tự không phải số
    const cleaned = formattedValue.toString().replace(/[^\d]/g, '');
    return toMoneyInteger(cleaned);
}

/**
 * Tính tổng tiền của một hộ dân từ danh sách các phí
 * @param {Array} fees - Danh sách các phí của hộ dân
 * @returns {number} Tổng tiền (số nguyên)
 */
function calculateHouseholdTotal(fees) {
    if (!Array.isArray(fees)) {
        return 0;
    }
    return fees.reduce((total, fee) => {
        const amount = toMoneyInteger(fee.amount || 0);
        return total + amount;
    }, 0);
}

/**
 * Tính tổng tiền từ các cell hiển thị tiền trong DOM
 * @param {NodeList|Array} amountCells - Các element chứa giá trị tiền
 * @returns {number} Tổng tiền (số nguyên)
 */
function calculateTotalFromCells(amountCells) {
    let total = 0;
    if (amountCells && amountCells.length > 0) {
        amountCells.forEach(cell => {
            const text = cell.textContent || '';
            const amount = parseMoney(text);
            total = addMoney(total, amount);
        });
    }
    return total;
}

/**
 * Tính tổng tiền từ một object chứa các giá trị tiền
 * @param {Object} data - Object chứa các giá trị tiền
 * @param {string} amountKey - Tên key chứa giá trị tiền (mặc định: 'amount')
 * @returns {number} Tổng tiền (số nguyên)
 */
function calculateTotalFromObject(data, amountKey = 'amount') {
    if (!data || typeof data !== 'object') {
        return 0;
    }
    
    if (Array.isArray(data)) {
        return data.reduce((total, item) => {
            return addMoney(total, item[amountKey] || 0);
        }, 0);
    }
    
    // Nếu là object, tính tổng các giá trị
    return Object.values(data).reduce((total, value) => {
        if (typeof value === 'object' && value[amountKey] !== undefined) {
            return addMoney(total, value[amountKey]);
        }
        return addMoney(total, value);
    }, 0);
}

/**
 * Lưu trữ dữ liệu tiền vào localStorage để thống kê
 * @param {string} key - Key để lưu trữ
 * @param {Object} data - Dữ liệu cần lưu
 */
function saveMoneyData(key, data) {
    try {
        const dataToSave = {
            timestamp: new Date().toISOString(),
            data: data
        };
        localStorage.setItem(`money_data_${key}`, JSON.stringify(dataToSave));
    } catch (error) {
        console.error('Error saving money data:', error);
    }
}

/**
 * Lấy dữ liệu tiền từ localStorage
 * @param {string} key - Key để lấy dữ liệu
 * @returns {Object|null} Dữ liệu đã lưu hoặc null
 */
function getMoneyData(key) {
    try {
        const saved = localStorage.getItem(`money_data_${key}`);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error getting money data:', error);
    }
    return null;
}

/**
 * Xóa dữ liệu tiền từ localStorage
 * @param {string} key - Key cần xóa
 */
function clearMoneyData(key) {
    try {
        localStorage.removeItem(`money_data_${key}`);
    } catch (error) {
        console.error('Error clearing money data:', error);
    }
}

/**
 * Lấy tất cả dữ liệu tiền đã lưu
 * @returns {Object} Object chứa tất cả dữ liệu tiền
 */
function getAllMoneyData() {
    const allData = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('money_data_')) {
                const dataKey = key.replace('money_data_', '');
                allData[dataKey] = getMoneyData(dataKey);
            }
        }
    } catch (error) {
        console.error('Error getting all money data:', error);
    }
    return allData;
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toMoneyInteger,
        addMoney,
        multiplyMoney,
        formatMoney,
        parseMoney,
        calculateHouseholdTotal,
        calculateTotalFromCells,
        calculateTotalFromObject,
        saveMoneyData,
        getMoneyData,
        clearMoneyData,
        getAllMoneyData
    };
}

