/* SCRIPT TẠO DỮ LIỆU MẪU FULL (CLEAN & ROBUST)
   - 20 Hộ dân (A101-A110, B101-B110)
   - 1 Admin, 1 Tài khoản Resident mẫu
   - Dữ liệu phí & thanh toán 3 tháng
   - KHÔNG NULL, Giá trị >= 0
*/

-- 1. Cấu hình môi trường
SET client_encoding = 'UTF8';
\set ON_ERROR_STOP on

BEGIN;

-- =========================================================
-- 1. LÀM SẠCH DATABASE & RESET ID
-- =========================================================
TRUNCATE TABLE payment, household_fee, account, resident, household, 
               billing_period, role, fee_category RESTART IDENTITY CASCADE;

-- =========================================================
-- 2. KHỞI TẠO MASTER DATA (DỮ LIỆU NỀN)
-- =========================================================

-- 2.1. Billing Period (3 Tháng)
INSERT INTO billing_period (month, year, start_date, end_date, closed) VALUES 
(11, 2025, '2025-11-01', '2025-11-30', true),
(12, 2025, '2025-12-01', '2025-12-31', true),
(1, 2026, '2026-01-01', '2026-01-31', false);

-- 2.2. Role
INSERT INTO role (name) VALUES ('RESIDENT'), ('ADMIN');

-- 2.3. Fee Category (Điền đầy đủ Unit, Description, Default Amount)
INSERT INTO fee_category (name, code, description, unit, default_amount, fixed_monthly, active) VALUES 
('Phí quản lý', 'PHQL', 'Phí vận hành tòa nhà', 'Căn hộ', 800000, true, true),
('Phí vệ sinh', 'VS', 'Phí thu gom rác thải', 'Hộ', 150000, true, true),
('Phí gửi xe', 'PARK', 'Phí gửi xe máy hầm B1', 'Xe', 100000, true, true),
('Phí nước', 'WATER', 'Nước sinh hoạt', 'm3', 10000, false, true),
('Phí điện', 'ELEC', 'Điện sinh hoạt', 'kWh', 3500, false, true);

-- =========================================================
-- 3. TẠO TÀI KHOẢN ADMIN & RESIDENT MẪU
-- =========================================================

-- 3.1. Admin (admin01 / admin123)
INSERT INTO account (username, password, role_id, created_at, updated_at)
VALUES ('admin01', 'admin123', 2, NOW(), NOW());

-- 3.2. Hộ mẫu A101 (cho resident01)
INSERT INTO household (active, apartment_number, household_code, owner_name, phone, residence_status, move_in_date, members_count, created_at, updated_at) 
VALUES (true, 'A101', 'H001', 'Nguyễn Văn An', '0909111222', 'DANG_O', '2025-01-01', 3, NOW(), NOW());

-- Chủ hộ A101
INSERT INTO resident (full_name, date_of_birth, gender, id_number, phone, relation_to_head, residence_status, household_id, created_at, updated_at) 
VALUES ('Nguyễn Văn An', '1990-01-01', 'Nam', '001090000001', '0909111222', 'Chủ hộ', 'Active', 1, NOW(), NOW());

-- Account resident01 (pass: 123456)
INSERT INTO account (username, password, role_id, resident_id, created_at, updated_at)
VALUES ('resident01', '123456', 1, 1, NOW(), NOW());

-- Thành viên gia đình A101
INSERT INTO resident (full_name, date_of_birth, gender, id_number, phone, relation_to_head, residence_status, household_id, created_at, updated_at) VALUES 
('Trần Thị Mai', '1992-05-20', 'Nữ', '001092000002', '0909333444', 'Vợ', 'Active', 1, NOW(), NOW()),
('Nguyễn Gia Bảo', '2018-10-10', 'Nam', 'Chưa có', 'Không có', 'Con', 'Active', 1, NOW(), NOW());

-- =========================================================
-- 4. TẠO 19 HỘ GIA ĐÌNH CÒN LẠI (TỰ ĐỘNG)
-- =========================================================
DO $$
DECLARE
    v_household_id BIGINT;
    v_head_id BIGINT;
    v_apt_no TEXT;
    v_full_name TEXT;
    v_phone TEXT;
    v_i INT;
    v_owner_last_names TEXT[] := ARRAY['Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];
    v_owner_first_names TEXT[] := ARRAY['Bình', 'Cường', 'Dung', 'Giang', 'Hương', 'Hùng', 'Khánh', 'Lan', 'Tú', 'Thảo', 'Minh', 'Tài'];
BEGIN
    FOR v_i IN 2..20 LOOP
        -- Random tên và SĐT
        v_full_name := v_owner_last_names[1 + floor(random() * array_length(v_owner_last_names, 1))::int] || ' Văn ' ||
                       v_owner_first_names[1 + floor(random() * array_length(v_owner_first_names, 1))::int];
        v_phone := '09' || floor(random() * 89999999 + 10000000)::text;

        -- Tạo số phòng (A102-A110, B101-B110)
        IF v_i <= 10 THEN v_apt_no := 'A' || (100 + v_i);
        ELSE v_apt_no := 'B' || (100 + (v_i - 10)); END IF;

        -- Insert Hộ
        INSERT INTO household (active, apartment_number, household_code, owner_name, phone, residence_status, move_in_date, members_count, created_at, updated_at) 
        VALUES (true, v_apt_no, 'H' || lpad(v_i::text, 3, '0'), v_full_name, v_phone, 'DANG_O', '2024-06-01'::date + (random() * 300)::int, 2, NOW(), NOW()) 
        RETURNING id INTO v_household_id;

        -- Insert Chủ hộ
        INSERT INTO resident (full_name, date_of_birth, gender, id_number, phone, relation_to_head, residence_status, household_id, created_at, updated_at) 
        VALUES (v_full_name, '1980-01-01'::date + (random() * 10000)::int, 'Nam', '001080' || floor(random()*999999)::text, v_phone, 'Chủ hộ', 'Active', v_household_id, NOW(), NOW())
        RETURNING id INTO v_head_id;

        -- Insert Account cho chủ hộ (user_a102...)
        INSERT INTO account (username, password, role_id, resident_id, created_at, updated_at)
        VALUES ('user_' || lower(v_apt_no), '123456', 1, v_head_id, NOW(), NOW());

        -- Insert 1 thành viên phụ
        INSERT INTO resident (full_name, date_of_birth, gender, relation_to_head, residence_status, household_id, created_at, updated_at)
        VALUES ('Người nhà ' || v_apt_no, '1985-01-01', 'Nữ', 'Vợ/Chồng', 'Active', v_household_id, NOW(), NOW());
    END LOOP;
END $$;

-- =========================================================
-- 5. TẠO PHÍ & THANH TOÁN (LOGIC KHÔNG NULL)
-- =========================================================
DO $$
DECLARE
    v_hh RECORD;
    v_period RECORD;
    v_fee_cat RECORD;
    v_qty NUMERIC;
    v_amount NUMERIC;
    v_status TEXT;
    v_fee_id BIGINT;
    v_paid_amt NUMERIC;
BEGIN
    FOR v_hh IN SELECT * FROM household WHERE active = true LOOP
        FOR v_period IN SELECT * FROM billing_period ORDER BY id LOOP
            FOR v_fee_cat IN SELECT * FROM fee_category ORDER BY id LOOP
                
                -- 1. Tính Số Lượng (Quantity) - Không NULL, min = 0
                IF v_fee_cat.code = 'PHQL' OR v_fee_cat.code = 'VS' THEN 
                    v_qty := 1;
                ELSIF v_fee_cat.code = 'PARK' THEN 
                    v_qty := floor(random() * 3); -- 0, 1, 2 xe
                ELSIF v_fee_cat.code = 'WATER' THEN 
                    v_qty := floor(random() * 20) + 5; -- 5-24 m3
                ELSIF v_fee_cat.code = 'ELEC' THEN 
                    v_qty := floor(random() * 300) + 50; -- 50-349 kWh
                ELSE
                    v_qty := 1;
                END IF;

                -- 2. Tính Thành Tiền
                v_amount := v_qty * v_fee_cat.default_amount;
                v_paid_amt := 0;

                -- 3. Xác định Trạng thái (Status)
                IF v_amount = 0 THEN
                    v_status := 'PAID'; -- 0đ coi như đã đóng
                ELSE
                    IF v_period.month = 11 THEN -- Tháng 11: 95% Đã đóng
                        IF random() > 0.05 THEN v_status := 'PAID'; v_paid_amt := v_amount;
                        ELSE v_status := 'OVERDUE'; END IF;
                    ELSIF v_period.month = 12 THEN -- Tháng 12: Hỗn hợp
                        IF random() > 0.3 THEN v_status := 'PAID'; v_paid_amt := v_amount;
                        ELSIF random() > 0.6 THEN v_status := 'PARTIALLY_PAID'; v_paid_amt := v_amount/2;
                        ELSE v_status := 'OVERDUE'; END IF;
                    ELSE -- Tháng 1: Đa số chưa đóng
                        IF random() > 0.8 THEN v_status := 'PAID'; v_paid_amt := v_amount;
                        ELSE v_status := 'UNPAID'; END IF;
                    END IF;
                END IF;

                -- 4. INSERT HOUSEHOLD_FEE (Các cột NOT NULL)
                INSERT INTO household_fee (
                    household_id, fee_category_id, billing_period_id, 
                    quantity, unit_price, amount, due_date, status
                ) VALUES (
                    v_hh.id, v_fee_cat.id, v_period.id, 
                    v_qty, v_fee_cat.default_amount, v_amount, v_period.end_date, v_status
                ) RETURNING id INTO v_fee_id;

                -- 5. INSERT PAYMENT (Nếu có trả tiền)
                IF v_paid_amt > 0 THEN
                    INSERT INTO payment (amount, paid_at, method, note, household_fee_id)
                    VALUES (
                        v_paid_amt, 
                        v_period.start_date + (random() * 25)::int,
                        CASE WHEN random() > 0.4 THEN 'Chuyển khoản' ELSE 'Tiền mặt' END, 
                        'Thanh toán phí', 
                        v_fee_id
                    );
                END IF;

            END LOOP;
        END LOOP;
    END LOOP;
END $$;

COMMIT;

-- =========================================================
-- KIỂM TRA KẾT QUẢ
-- =========================================================
SELECT 'Số lượng Hộ dân' as Thong_Ke, count(*) as Gia_Tri FROM household
UNION ALL
SELECT 'Số tài khoản', count(*) FROM account
UNION ALL
SELECT 'Tổng số hóa đơn', count(*) FROM household_fee
UNION ALL
SELECT 'Hóa đơn bị NULL', count(*) FROM household_fee WHERE amount IS NULL OR quantity IS NULL;