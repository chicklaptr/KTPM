--
-- PostgreSQL database dump
--

\restrict SeOPZMJEFBIZumYy79syvmFdDHdZ6tgrIHz4CNNIM38hV1rwvsOVADWYXtx2MeW

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-01-08 15:28:25

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 249 (class 1255 OID 41085)
-- Name: get_fee_statistics(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_fee_statistics(p_billing_period_id bigint DEFAULT NULL::bigint) RETURNS TABLE(period_info text, fee_category_name text, total_households bigint, total_amount_due numeric, total_paid numeric, total_overdue numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p_billing_period_id IS NULL THEN 'Tất cả kỳ'
            ELSE bp.month::text || '/' || bp.year::text 
        END::text AS period_info,
        fc.name AS fee_category_name,
        COUNT(DISTINCT hf.household_id)::bigint AS total_households,
        SUM(hf.amount) AS total_amount_due,
        SUM(COALESCE(p.paid_amount, 0)) AS total_paid,
        SUM(
            CASE 
                WHEN hf.status = 'OVERDUE' 
                     OR (hf.due_date < CURRENT_DATE AND hf.status = 'UNPAID') 
                THEN hf.amount - COALESCE(p.paid_amount, 0) 
                ELSE 0 
            END
        ) AS total_overdue
    FROM fee_category fc
    JOIN household_fee hf ON hf.fee_category_id = fc.id
    JOIN household h ON hf.household_id = h.id AND h.active = true
    LEFT JOIN billing_period bp ON hf.billing_period_id = bp.id
    LEFT JOIN (
        SELECT household_fee_id, SUM(amount) AS paid_amount
        FROM payment
        GROUP BY household_fee_id
    ) p ON p.household_fee_id = hf.id
    WHERE (p_billing_period_id IS NULL OR hf.billing_period_id = p_billing_period_id)
    GROUP BY 
        CASE WHEN p_billing_period_id IS NULL THEN NULL ELSE bp.month END,
        CASE WHEN p_billing_period_id IS NULL THEN NULL ELSE bp.year END,
        fc.name
    ORDER BY period_info, fc.name;
END;
$$;


ALTER FUNCTION public.get_fee_statistics(p_billing_period_id bigint) OWNER TO postgres;

--
-- TOC entry 235 (class 1255 OID 41080)
-- Name: mark_overdue_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_overdue_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_paid numeric(15,2);
BEGIN
    -- Tính tổng đã trả
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payment
    WHERE household_fee_id = NEW.id;

    -- Cập nhật status (mở rộng từ trigger cũ)
    IF total_paid >= NEW.amount THEN
        NEW.status := 'PAID';
    ELSIF total_paid > 0 THEN
        NEW.status := 'PARTIALLY_PAID';
    ELSIF NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE THEN
        NEW.status := 'OVERDUE';
    ELSE
        NEW.status := 'UNPAID';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.mark_overdue_status() OWNER TO postgres;

--
-- TOC entry 236 (class 1255 OID 41078)
-- Name: set_household_fee_defaults(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_household_fee_defaults() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Đặt quantity mặc định = 1 nếu NULL
    IF NEW.quantity IS NULL THEN
        NEW.quantity := 1;
    END IF;

    -- Đặt unit_price từ fee_category nếu NULL
    IF NEW.unit_price IS NULL THEN
        SELECT default_amount INTO NEW.unit_price
        FROM fee_category
        WHERE id = NEW.fee_category_id;
    END IF;

    -- Tính amount nếu NULL
    IF NEW.amount IS NULL THEN
        IF NEW.unit_price IS NOT NULL THEN
            NEW.amount := NEW.unit_price * NEW.quantity;
        ELSE
            -- Lấy default_amount từ fee_category và nhân với quantity
            SELECT default_amount * NEW.quantity INTO NEW.amount
            FROM fee_category
            WHERE id = NEW.fee_category_id;
        END IF;
    END IF;

    -- Đặt due_date từ billing_period.end_date nếu NULL
    IF NEW.due_date IS NULL THEN
        SELECT end_date INTO NEW.due_date
        FROM billing_period
        WHERE id = NEW.billing_period_id;
    END IF;

    -- Đặt status mặc định
    IF NEW.status IS NULL THEN
        NEW.status := 'UNPAID';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_household_fee_defaults() OWNER TO postgres;

--
-- TOC entry 237 (class 1255 OID 41081)
-- Name: update_household_members_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_household_members_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Cập nhật số lượng thành viên (chỉ đếm resident có residence_status = 'Active' hoặc tương tự)
    UPDATE household
    SET members_count = (
        SELECT COUNT(*)
        FROM resident
        WHERE household_id = (
            CASE 
                WHEN TG_OP = 'DELETE' THEN OLD.household_id 
                ELSE NEW.household_id 
            END
        )
        AND (residence_status IS NULL OR residence_status ILIKE '%active%')  -- linh hoạt với dữ liệu
    )
    WHERE id = (
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.household_id 
            ELSE NEW.household_id 
        END
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.update_household_members_count() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 40961)
-- Name: account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone,
    password character varying(100) NOT NULL,
    updated_at timestamp(6) without time zone,
    username character varying(50) NOT NULL,
    role_id bigint NOT NULL,
    resident_id bigint
);


ALTER TABLE public.account OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 40968)
-- Name: account_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.account ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.account_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 221 (class 1259 OID 40969)
-- Name: billing_period; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billing_period (
    id bigint NOT NULL,
    closed boolean,
    end_date date,
    month integer NOT NULL,
    start_date date,
    year integer NOT NULL
);


ALTER TABLE public.billing_period OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 40975)
-- Name: billing_period_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.billing_period ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.billing_period_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 223 (class 1259 OID 40976)
-- Name: fee_category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_category (
    id bigint NOT NULL,
    active boolean,
    code character varying(50) NOT NULL,
    default_amount numeric(15,2),
    description character varying(255),
    fixed_monthly boolean,
    name character varying(100) NOT NULL,
    unit character varying(50)
);


ALTER TABLE public.fee_category OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 40982)
-- Name: fee_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.fee_category ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fee_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 225 (class 1259 OID 40983)
-- Name: household; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.household (
    id bigint NOT NULL,
    active boolean,
    apartment_number character varying(20) NOT NULL,
    created_at timestamp(6) without time zone,
    household_code character varying(50) NOT NULL,
    members_count integer,
    move_in_date date,
    move_out_date date,
    owner_name character varying(100) NOT NULL,
    phone character varying(20),
    residence_status character varying(50),
    updated_at timestamp(6) without time zone
);


ALTER TABLE public.household OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 40990)
-- Name: household_fee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.household_fee (
    id bigint NOT NULL,
    amount numeric(15,2),
    due_date date,
    quantity numeric(15,2),
    status character varying(20),
    unit_price numeric(15,2),
    billing_period_id bigint NOT NULL,
    fee_category_id bigint NOT NULL,
    household_id bigint NOT NULL
);


ALTER TABLE public.household_fee OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 40997)
-- Name: household_fee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.household_fee ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.household_fee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 228 (class 1259 OID 40998)
-- Name: household_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.household ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.household_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 229 (class 1259 OID 40999)
-- Name: payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment (
    id bigint NOT NULL,
    amount numeric(15,2) NOT NULL,
    method character varying(50),
    note character varying(255),
    paid_at timestamp(6) without time zone,
    household_fee_id bigint NOT NULL
);


ALTER TABLE public.payment OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 41005)
-- Name: payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payment ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 231 (class 1259 OID 41006)
-- Name: resident; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resident (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone,
    date_of_birth date,
    full_name character varying(100) NOT NULL,
    gender character varying(10),
    id_number character varying(50),
    phone character varying(20),
    relation_to_head character varying(50),
    residence_status character varying(50),
    updated_at timestamp(6) without time zone,
    household_id bigint NOT NULL
);


ALTER TABLE public.resident OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 41012)
-- Name: resident_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.resident ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.resident_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 233 (class 1259 OID 41013)
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    id bigint NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.role OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 41018)
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.role ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 5073 (class 0 OID 40961)
-- Dependencies: 219
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account (id, created_at, password, updated_at, username, role_id, resident_id) FROM stdin;
2	2025-07-12 00:00:00	admin123	2025-07-12 00:00:00	admin01	2	\N
1	2025-07-12 00:00:00	123456	2025-07-12 00:00:00	resident01	1	1
\.


--
-- TOC entry 5075 (class 0 OID 40969)
-- Dependencies: 221
-- Data for Name: billing_period; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billing_period (id, closed, end_date, month, start_date, year) FROM stdin;
1	t	2025-11-30	11	2025-11-01	2025
2	t	2025-12-31	12	2025-12-01	2025
3	f	2026-01-31	1	2026-01-01	2026
\.


--
-- TOC entry 5077 (class 0 OID 40976)
-- Dependencies: 223
-- Data for Name: fee_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_category (id, active, code, default_amount, description, fixed_monthly, name, unit) FROM stdin;
1	t	PHQL	800000.00	Phí quản lý tòa nhà	t	Phí quản lý	\N
2	t	VS	150000.00	Phí vệ sinh và thu gom rác	t	Phí vệ sinh	\N
3	t	PARK	100000.00	Phí gửi xe máy (per xe)	t	Phí gửi xe	xe/tháng
4	f	WATER	10000.00	Phí nước sinh hoạt theo m³	f	Phí nước	m³
5	f	ELEC	3500.00	Phí điện sinh hoạt theo kWh	f	Phí điện	kWh
\.


--
-- TOC entry 5079 (class 0 OID 40983)
-- Dependencies: 225
-- Data for Name: household; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.household (id, active, apartment_number, created_at, household_code, members_count, move_in_date, move_out_date, owner_name, phone, residence_status, updated_at) FROM stdin;
2	t	A102	2025-12-10 09:00:00	H002	2	2025-03-01	\N	Trần Thị Bích	0987654321	DANG_O	2025-12-10 09:00:00
3	t	A201	2025-12-15 10:00:00	H003	4	2024-08-01	\N	Lê Văn Cường	0912345678	DANG_O	2025-12-15 10:00:00
4	t	B101	2025-12-20 11:00:00	H004	1	2025-10-01	\N	Phạm Hồng Diễm	0934567890	DANG_O	2025-12-20 11:00:00
1	t	A101	2025-12-01 19:14:06.189838	H001	3	\N	\N	Nguyen Van A	0123456789	DANG_O	2025-12-01 19:14:07
\.


--
-- TOC entry 5080 (class 0 OID 40990)
-- Dependencies: 226
-- Data for Name: household_fee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.household_fee (id, amount, due_date, quantity, status, unit_price, billing_period_id, fee_category_id, household_id) FROM stdin;
1	800000.00	2025-12-31	1.00	PAID	800000.00	2	1	1
2	150000.00	2025-12-31	1.00	PAID	150000.00	2	2	1
3	200000.00	2025-12-31	2.00	PARTIALLY_PAID	100000.00	2	3	1
4	250000.00	2025-12-31	25.00	PAID	10000.00	2	4	1
5	700000.00	2025-12-31	200.00	OVERDUE	3500.00	2	5	1
6	800000.00	2026-01-31	1.00	UNPAID	800000.00	3	1	1
7	150000.00	2026-01-31	1.00	PAID	150000.00	3	2	1
8	200000.00	2026-01-31	2.00	UNPAID	100000.00	3	3	1
9	180000.00	2026-01-31	18.00	UNPAID	10000.00	3	4	1
10	630000.00	2026-01-31	180.00	PARTIALLY_PAID	3500.00	3	5	1
11	800000.00	2025-12-31	1.00	PAID	800000.00	2	1	2
12	150000.00	2025-12-31	1.00	PAID	150000.00	2	2	2
13	100000.00	2025-12-31	1.00	OVERDUE	100000.00	2	3	2
14	150000.00	2025-12-31	15.00	PAID	10000.00	2	4	2
15	525000.00	2025-12-31	150.00	PAID	3500.00	2	5	2
16	800000.00	2026-01-31	1.00	UNPAID	800000.00	3	1	2
17	150000.00	2026-01-31	1.00	UNPAID	150000.00	3	2	2
18	100000.00	2026-01-31	1.00	PAID	100000.00	3	3	2
19	160000.00	2026-01-31	16.00	UNPAID	10000.00	3	4	2
20	560000.00	2026-01-31	160.00	UNPAID	3500.00	3	5	2
21	800000.00	2025-12-31	1.00	PARTIALLY_PAID	800000.00	2	1	3
22	150000.00	2025-12-31	1.00	PAID	150000.00	2	2	3
23	300000.00	2025-12-31	3.00	PAID	100000.00	2	3	3
24	300000.00	2025-12-31	30.00	OVERDUE	10000.00	2	4	3
25	1050000.00	2025-12-31	300.00	PAID	3500.00	2	5	3
26	800000.00	2026-01-31	1.00	UNPAID	800000.00	3	1	3
27	150000.00	2026-01-31	1.00	UNPAID	150000.00	3	2	3
28	300000.00	2026-01-31	3.00	UNPAID	100000.00	3	3	3
29	280000.00	2026-01-31	28.00	PAID	10000.00	3	4	3
30	980000.00	2026-01-31	280.00	UNPAID	3500.00	3	5	3
31	800000.00	2025-12-31	1.00	PAID	800000.00	2	1	4
32	150000.00	2025-12-31	1.00	PAID	150000.00	2	2	4
33	100000.00	2025-12-31	1.00	PAID	100000.00	2	3	4
34	120000.00	2025-12-31	12.00	PAID	10000.00	2	4	4
35	350000.00	2025-12-31	100.00	PARTIALLY_PAID	3500.00	2	5	4
36	800000.00	2026-01-31	1.00	UNPAID	800000.00	3	1	4
37	150000.00	2026-01-31	1.00	UNPAID	150000.00	3	2	4
38	100000.00	2026-01-31	1.00	UNPAID	100000.00	3	3	4
39	110000.00	2026-01-31	11.00	UNPAID	10000.00	3	4	4
40	385000.00	2026-01-31	110.00	UNPAID	3500.00	3	5	4
\.


--
-- TOC entry 5083 (class 0 OID 40999)
-- Dependencies: 229
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment (id, amount, method, note, paid_at, household_fee_id) FROM stdin;
1	800000.00	Chuyển khoản	Thanh toán phí quản lý 12/2025	2025-12-20 10:00:00	1
2	150000.00	Tiền mặt	\N	2025-12-15 14:00:00	2
3	100000.00	Chuyển khoản	Trả 1 xe	2025-12-25 09:00:00	3
4	250000.00	Chuyển khoản	\N	2025-12-18 11:00:00	4
5	150000.00	Tiền mặt	\N	2026-01-05 15:00:00	7
6	800000.00	Chuyển khoản	\N	2025-12-10 08:00:00	11
7	150000.00	Tiền mặt	\N	2025-12-12 16:00:00	12
8	150000.00	Chuyển khoản	\N	2025-12-14 10:00:00	14
9	525000.00	Chuyển khoản	\N	2025-12-16 12:00:00	15
10	100000.00	Tiền mặt	Trả phí xe kỳ 01/2026 sớm	2026-01-03 09:00:00	18
11	500000.00	Chuyển khoản	Trả một phần phí quản lý	2025-12-28 13:00:00	21
12	150000.00	Tiền mặt	\N	2025-12-19 17:00:00	22
13	300000.00	Chuyển khoản	\N	2025-12-22 11:00:00	23
14	1050000.00	Chuyển khoản	\N	2025-12-24 14:00:00	25
15	280000.00	Tiền mặt	\N	2026-01-07 10:00:00	29
16	800000.00	Chuyển khoản	\N	2025-12-21 15:00:00	31
17	150000.00	Tiền mặt	\N	2025-12-23 16:00:00	32
18	100000.00	Chuyển khoản	\N	2025-12-25 17:00:00	33
19	120000.00	Tiền mặt	\N	2025-12-26 18:00:00	34
20	200000.00	Chuyển khoản	Trả một phần phí điện	2025-12-29 19:00:00	35
21	200000.00	Chuyển khoản	Trả thêm phí điện kỳ hiện tại	2026-01-04 11:00:00	10
\.


--
-- TOC entry 5085 (class 0 OID 41006)
-- Dependencies: 231
-- Data for Name: resident; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resident (id, created_at, date_of_birth, full_name, gender, id_number, phone, relation_to_head, residence_status, updated_at, household_id) FROM stdin;
2	2025-12-01 00:00:00	1975-05-20	Nguyễn Văn An	Nam	001975123456	0123456789	Chủ hộ	Active	2025-12-01 00:00:00	1
3	2025-12-01 00:00:00	1978-08-15	Trần Thị Hoa	Nữ	001978654321	\N	Vợ	Active	2025-12-01 00:00:00	1
4	2025-12-10 00:00:00	1985-03-10	Trần Thị Bích	Nữ	001985789012	0987654321	Chủ hộ	Active	2025-12-10 00:00:00	2
5	2025-12-10 00:00:00	1983-11-22	Nguyễn Văn Bình	Nam	001983456789	\N	Chồng	Active	2025-12-10 00:00:00	2
6	2025-12-15 00:00:00	1970-07-01	Lê Văn Cường	Nam	001970111222	0912345678	Chủ hộ	Active	2025-12-15 00:00:00	3
7	2025-12-15 00:00:00	1972-09-12	Vũ Thị Dung	Nữ	001972333444	\N	Vợ	Active	2025-12-15 00:00:00	3
8	2025-12-15 00:00:00	2000-01-05	Lê Thị Ngọc	Nữ	002000555666	\N	Con	Active	2025-12-15 00:00:00	3
9	2025-12-15 00:00:00	2005-12-20	Lê Văn Em	Nam	002005777888	\N	Con	Active	2025-12-15 00:00:00	3
10	2025-12-20 00:00:00	1990-04-15	Phạm Hồng Diễm	Nữ	001990999000	0934567890	Chủ hộ	Active	2025-12-20 00:00:00	4
1	2025-08-12 00:00:00	2024-12-08	Nguyen Hoang Long	Nam	1	0403043043	Con	Active	2025-08-12 00:00:00	1
\.


--
-- TOC entry 5087 (class 0 OID 41013)
-- Dependencies: 233
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role (id, name) FROM stdin;
1	RESIDENT
2	ADMIN
\.


--
-- TOC entry 5094 (class 0 OID 0)
-- Dependencies: 220
-- Name: account_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.account_id_seq', 5, true);


--
-- TOC entry 5095 (class 0 OID 0)
-- Dependencies: 222
-- Name: billing_period_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billing_period_id_seq', 1, false);


--
-- TOC entry 5096 (class 0 OID 0)
-- Dependencies: 224
-- Name: fee_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fee_category_id_seq', 1, false);


--
-- TOC entry 5097 (class 0 OID 0)
-- Dependencies: 227
-- Name: household_fee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.household_fee_id_seq', 1, false);


--
-- TOC entry 5098 (class 0 OID 0)
-- Dependencies: 228
-- Name: household_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.household_id_seq', 1, true);


--
-- TOC entry 5099 (class 0 OID 0)
-- Dependencies: 230
-- Name: payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_id_seq', 1, false);


--
-- TOC entry 5100 (class 0 OID 0)
-- Dependencies: 232
-- Name: resident_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resident_id_seq', 2, true);


--
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 234
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_id_seq', 8, true);


--
-- TOC entry 4896 (class 2606 OID 41020)
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- TOC entry 4902 (class 2606 OID 41022)
-- Name: billing_period billing_period_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_period
    ADD CONSTRAINT billing_period_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 41024)
-- Name: fee_category fee_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_category
    ADD CONSTRAINT fee_category_pkey PRIMARY KEY (id);


--
-- TOC entry 4912 (class 2606 OID 41026)
-- Name: household_fee household_fee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household_fee
    ADD CONSTRAINT household_fee_pkey PRIMARY KEY (id);


--
-- TOC entry 4908 (class 2606 OID 41028)
-- Name: household household_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household
    ADD CONSTRAINT household_pkey PRIMARY KEY (id);


--
-- TOC entry 4914 (class 2606 OID 41030)
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);


--
-- TOC entry 4916 (class 2606 OID 41032)
-- Name: resident resident_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resident
    ADD CONSTRAINT resident_pkey PRIMARY KEY (id);


--
-- TOC entry 4918 (class 2606 OID 41034)
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- TOC entry 4906 (class 2606 OID 41036)
-- Name: fee_category ukcje94bhnudyq3m0dlt24spiqc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_category
    ADD CONSTRAINT ukcje94bhnudyq3m0dlt24spiqc UNIQUE (code);


--
-- TOC entry 4898 (class 2606 OID 41038)
-- Name: account ukgex1lmaqpg0ir5g1f5eftyaa1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT ukgex1lmaqpg0ir5g1f5eftyaa1 UNIQUE (username);


--
-- TOC entry 4900 (class 2606 OID 41040)
-- Name: account ukjxtwetrowtd365oi8hnb1dyud; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT ukjxtwetrowtd365oi8hnb1dyud UNIQUE (resident_id);


--
-- TOC entry 4910 (class 2606 OID 41042)
-- Name: household ukkueevo1w3qbwt7v37r0ubscax; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household
    ADD CONSTRAINT ukkueevo1w3qbwt7v37r0ubscax UNIQUE (household_code);


--
-- TOC entry 4921 (class 2606 OID 41043)
-- Name: household_fee fk2l2gie0wfmb53l58g5pni2f6y; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household_fee
    ADD CONSTRAINT fk2l2gie0wfmb53l58g5pni2f6y FOREIGN KEY (billing_period_id) REFERENCES public.billing_period(id);


--
-- TOC entry 4922 (class 2606 OID 41048)
-- Name: household_fee fkbdprusbndfac0qpcd60eojld2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household_fee
    ADD CONSTRAINT fkbdprusbndfac0qpcd60eojld2 FOREIGN KEY (household_id) REFERENCES public.household(id);


--
-- TOC entry 4919 (class 2606 OID 41053)
-- Name: account fkd4vb66o896tay3yy52oqxr9w0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT fkd4vb66o896tay3yy52oqxr9w0 FOREIGN KEY (role_id) REFERENCES public.role(id);


--
-- TOC entry 4920 (class 2606 OID 41058)
-- Name: account fke6rxsgkrycgbwvkke4ds50fs5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT fke6rxsgkrycgbwvkke4ds50fs5 FOREIGN KEY (resident_id) REFERENCES public.resident(id);


--
-- TOC entry 4923 (class 2606 OID 41063)
-- Name: household_fee fkl75df66mfilu2lyq5omxvrbg; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household_fee
    ADD CONSTRAINT fkl75df66mfilu2lyq5omxvrbg FOREIGN KEY (fee_category_id) REFERENCES public.fee_category(id);


--
-- TOC entry 4925 (class 2606 OID 41068)
-- Name: resident fklaf6ipjvwblhj9mp9bn8wp2ba; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resident
    ADD CONSTRAINT fklaf6ipjvwblhj9mp9bn8wp2ba FOREIGN KEY (household_id) REFERENCES public.household(id);


--
-- TOC entry 4924 (class 2606 OID 41073)
-- Name: payment fko1sfg9eyh2835bmgxblu5m38i; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT fko1sfg9eyh2835bmgxblu5m38i FOREIGN KEY (household_fee_id) REFERENCES public.household_fee(id);


-- Completed on 2026-01-08 15:28:25

--
-- PostgreSQL database dump complete
--

\unrestrict SeOPZMJEFBIZumYy79syvmFdDHdZ6tgrIHz4CNNIM38hV1rwvsOVADWYXtx2MeW

