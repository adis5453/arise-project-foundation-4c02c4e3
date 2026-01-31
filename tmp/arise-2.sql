--
-- PostgreSQL database dump
--

\restrict a7CtoNVMI36NSe5vQr1shkic7bLPJKDK5eEF4OHsecowYbpWFGvyaHd4q8xeavw

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-02-01 04:02:43

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
-- TOC entry 2 (class 3079 OID 17011)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5816 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 3 (class 3079 OID 17048)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5817 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 979 (class 1247 OID 17060)
-- Name: approval_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.approval_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


ALTER TYPE public.approval_status OWNER TO postgres;

--
-- TOC entry 985 (class 1247 OID 17080)
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.attendance_status AS ENUM (
    'present',
    'absent',
    'late',
    'on_leave',
    'holiday',
    'weekend'
);


ALTER TYPE public.attendance_status OWNER TO postgres;

--
-- TOC entry 988 (class 1247 OID 17094)
-- Name: employment_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employment_status_type AS ENUM (
    'active',
    'on_leave',
    'terminated',
    'resigned',
    'retired'
);


ALTER TYPE public.employment_status_type OWNER TO postgres;

--
-- TOC entry 991 (class 1247 OID 17106)
-- Name: employment_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employment_type_enum AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'intern',
    'temporary'
);


ALTER TYPE public.employment_type_enum OWNER TO postgres;

--
-- TOC entry 994 (class 1247 OID 17118)
-- Name: gender_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender_enum AS ENUM (
    'male',
    'female',
    'other',
    'prefer_not_to_say'
);


ALTER TYPE public.gender_enum OWNER TO postgres;

--
-- TOC entry 982 (class 1247 OID 17070)
-- Name: priority_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.priority_level OWNER TO postgres;

--
-- TOC entry 359 (class 1255 OID 18101)
-- Name: calculate_attendance_hours(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_attendance_hours() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            DECLARE
                break_duration NUMERIC := 0;
                work_duration NUMERIC := 0;
            BEGIN
                IF NEW.check_out IS NOT NULL AND NEW.check_in IS NOT NULL THEN
                    work_duration := EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600.0;
                    
                    IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
                        break_duration := EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 3600.0;
                    END IF;
                    
                    NEW.total_hours := ROUND((work_duration - break_duration)::NUMERIC, 2);
                    
                    IF NEW.total_hours > 8 THEN
                        NEW.overtime_hours := ROUND((NEW.total_hours - 8)::NUMERIC, 2);
                    ELSE
                        NEW.overtime_hours := 0;
                    END IF;
                    
                    IF NEW.total_hours >= 8 THEN
                        NEW.status := 'present';
                    ELSIF NEW.total_hours >= 4 THEN
                        NEW.status := 'half_day';
                    ELSE
                        NEW.status := 'partial';
                    END IF;
                END IF;
                
                NEW.updated_at := CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$;


ALTER FUNCTION public.calculate_attendance_hours() OWNER TO postgres;

--
-- TOC entry 361 (class 1255 OID 18105)
-- Name: check_overlapping_leaves(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_overlapping_leaves() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            DECLARE
                overlap_count INTEGER;
            BEGIN
                IF NEW.status IN ('pending', 'approved') THEN
                    SELECT COUNT(*) INTO overlap_count
                    FROM leave_requests
                    WHERE employee_id = NEW.employee_id
                    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
                    AND status IN ('pending', 'approved')
                    AND (
                        (NEW.start_date BETWEEN start_date AND end_date) OR
                        (NEW.end_date BETWEEN start_date AND end_date) OR
                        (start_date BETWEEN NEW.start_date AND NEW.end_date) OR
                        (end_date BETWEEN NEW.start_date AND NEW.end_date)
                    );
                    
                    IF overlap_count > 0 THEN
                        RAISE EXCEPTION 'Overlapping leave request exists for this employee';
                    END IF;
                END IF;
                
                RETURN NEW;
            END;
            $$;


ALTER FUNCTION public.check_overlapping_leaves() OWNER TO postgres;

--
-- TOC entry 360 (class 1255 OID 18103)
-- Name: update_leave_balance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_leave_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            DECLARE
                balance_exists BOOLEAN;
            BEGIN
                SELECT EXISTS(
                    SELECT 1 FROM employee_leave_balances
                    WHERE employee_id = NEW.employee_id 
                    AND leave_type_id = NEW.leave_type_id
                    AND year = EXTRACT(YEAR FROM NEW.start_date)
                ) INTO balance_exists;
                
                IF NOT balance_exists THEN
                    INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, current_balance, accrued_balance)
                    VALUES (NEW.employee_id, NEW.leave_type_id, EXTRACT(YEAR FROM NEW.start_date), 20, 20)
                    ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
                END IF;
                
                IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
                    UPDATE employee_leave_balances
                    SET used_balance = used_balance + NEW.days_requested,
                        current_balance = current_balance - NEW.days_requested,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE employee_id = NEW.employee_id 
                    AND leave_type_id = NEW.leave_type_id
                    AND year = EXTRACT(YEAR FROM NEW.start_date);
                    
                ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
                    UPDATE employee_leave_balances
                    SET used_balance = used_balance - NEW.days_requested,
                        current_balance = current_balance + NEW.days_requested,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE employee_id = NEW.employee_id 
                    AND leave_type_id = NEW.leave_type_id
                    AND year = EXTRACT(YEAR FROM NEW.start_date);
                END IF;
                
                RETURN NEW;
            END;
            $$;


ALTER FUNCTION public.update_leave_balance() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 278 (class 1259 OID 19575)
-- Name: announcement_reads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcement_reads (
    id integer NOT NULL,
    announcement_id integer,
    user_id uuid,
    read_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.announcement_reads OWNER TO postgres;

--
-- TOC entry 277 (class 1259 OID 19574)
-- Name: announcement_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcement_reads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcement_reads_id_seq OWNER TO postgres;

--
-- TOC entry 5818 (class 0 OID 0)
-- Dependencies: 277
-- Name: announcement_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcement_reads_id_seq OWNED BY public.announcement_reads.id;


--
-- TOC entry 272 (class 1259 OID 19484)
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    type character varying(50) DEFAULT 'general'::character varying,
    priority character varying(20) DEFAULT 'normal'::character varying,
    target_audience character varying(50) DEFAULT 'all'::character varying,
    target_ids uuid[],
    is_pinned boolean DEFAULT false,
    is_published boolean DEFAULT false,
    publish_date timestamp without time zone,
    expire_date timestamp without time zone,
    author_id uuid,
    views_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 19467)
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO postgres;

--
-- TOC entry 5819 (class 0 OID 0)
-- Dependencies: 269
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- TOC entry 282 (class 1259 OID 19646)
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_records (
    id integer NOT NULL,
    employee_id uuid,
    date date DEFAULT CURRENT_DATE NOT NULL,
    clock_in timestamp without time zone,
    clock_out timestamp without time zone,
    clock_in_type character varying(20) DEFAULT 'office'::character varying,
    clock_out_type character varying(20),
    clock_in_latitude numeric(10,8),
    clock_in_longitude numeric(11,8),
    clock_out_latitude numeric(10,8),
    clock_out_longitude numeric(11,8),
    wfh_request_id integer,
    working_hours numeric(5,2),
    overtime_hours numeric(5,2) DEFAULT 0,
    break_duration integer DEFAULT 0,
    status character varying(20) DEFAULT 'present'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.attendance_records OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 19643)
-- Name: attendance_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_records_id_seq OWNER TO postgres;

--
-- TOC entry 5820 (class 0 OID 0)
-- Dependencies: 281
-- Name: attendance_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_records_id_seq OWNED BY public.attendance_records.id;


--
-- TOC entry 232 (class 1259 OID 17832)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action character varying(100),
    resource_type character varying(50),
    resource_id character varying(50),
    details jsonb,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 290 (class 1259 OID 20127)
-- Name: benefit_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.benefit_plans (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    description text,
    provider character varying(255),
    coverage_details jsonb,
    cost_employee numeric(10,2) DEFAULT 0,
    cost_employer numeric(10,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.benefit_plans OWNER TO postgres;

--
-- TOC entry 289 (class 1259 OID 20126)
-- Name: benefit_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.benefit_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.benefit_plans_id_seq OWNER TO postgres;

--
-- TOC entry 5821 (class 0 OID 0)
-- Dependencies: 289
-- Name: benefit_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.benefit_plans_id_seq OWNED BY public.benefit_plans.id;


--
-- TOC entry 270 (class 1259 OID 19468)
-- Name: candidates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidates (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    job_position_id integer,
    resume_url character varying(500),
    portfolio_url character varying(500),
    linkedin_url character varying(500),
    source character varying(50),
    status character varying(30) DEFAULT 'new'::character varying,
    notes text,
    rating integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT candidates_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.candidates OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 19465)
-- Name: candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidates_id_seq OWNER TO postgres;

--
-- TOC entry 5822 (class 0 OID 0)
-- Dependencies: 268
-- Name: candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidates_id_seq OWNED BY public.candidates.id;


--
-- TOC entry 220 (class 1259 OID 17303)
-- Name: clock_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clock_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    radius_meters integer DEFAULT 100,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.clock_locations OWNER TO postgres;

--
-- TOC entry 301 (class 1259 OID 20440)
-- Name: competency_ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competency_ratings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    review_id integer,
    competency_id uuid,
    competency_name character varying(255) NOT NULL,
    rating numeric(3,1),
    comments text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT competency_ratings_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);


ALTER TABLE public.competency_ratings OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 19380)
-- Name: compliance_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compliance_items (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(50),
    type character varying(50),
    frequency character varying(20),
    due_date date,
    department_id uuid,
    applies_to character varying(50) DEFAULT 'all'::character varying,
    created_by uuid,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.compliance_items OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 19361)
-- Name: compliance_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compliance_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compliance_items_id_seq OWNER TO postgres;

--
-- TOC entry 5823 (class 0 OID 0)
-- Dependencies: 260
-- Name: compliance_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compliance_items_id_seq OWNED BY public.compliance_items.id;


--
-- TOC entry 263 (class 1259 OID 19371)
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversation_participants (
    id integer NOT NULL,
    conversation_id integer,
    user_id uuid,
    role character varying(20) DEFAULT 'member'::character varying,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_read_at timestamp without time zone,
    is_muted boolean DEFAULT false
);


ALTER TABLE public.conversation_participants OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 19368)
-- Name: conversation_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversation_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversation_participants_id_seq OWNER TO postgres;

--
-- TOC entry 5824 (class 0 OID 0)
-- Dependencies: 262
-- Name: conversation_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversation_participants_id_seq OWNED BY public.conversation_participants.id;


--
-- TOC entry 254 (class 1259 OID 19294)
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    type character varying(20) DEFAULT 'direct'::character varying,
    name character varying(255),
    description text,
    avatar_url character varying(500),
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 19286)
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO postgres;

--
-- TOC entry 5825 (class 0 OID 0)
-- Dependencies: 253
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- TOC entry 224 (class 1259 OID 17662)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    item_order integer NOT NULL,
    parent_department_id uuid,
    manager_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17661)
-- Name: departments_item_order_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_item_order_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_item_order_seq OWNER TO postgres;

--
-- TOC entry 5826 (class 0 OID 0)
-- Dependencies: 223
-- Name: departments_item_order_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_item_order_seq OWNED BY public.departments.item_order;


--
-- TOC entry 300 (class 1259 OID 20397)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) DEFAULT 'file'::character varying,
    extension character varying(10),
    size integer,
    mime_type character varying(100),
    path character varying(500) DEFAULT '/'::character varying,
    file_url character varying(500),
    uploaded_by uuid,
    employee_id uuid,
    is_shared boolean DEFAULT false,
    is_starred boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 299 (class 1259 OID 20392)
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- TOC entry 5827 (class 0 OID 0)
-- Dependencies: 299
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 298 (class 1259 OID 20182)
-- Name: employee_benefits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_benefits (
    id integer NOT NULL,
    employee_id uuid,
    benefit_plan_id integer,
    enrollment_date date DEFAULT CURRENT_DATE,
    coverage_level character varying(50) DEFAULT 'individual'::character varying,
    dependents jsonb DEFAULT '[]'::jsonb,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_benefits OWNER TO postgres;

--
-- TOC entry 294 (class 1259 OID 20169)
-- Name: employee_benefits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_benefits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_benefits_id_seq OWNER TO postgres;

--
-- TOC entry 5828 (class 0 OID 0)
-- Dependencies: 294
-- Name: employee_benefits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_benefits_id_seq OWNED BY public.employee_benefits.id;


--
-- TOC entry 280 (class 1259 OID 19600)
-- Name: employee_compliance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_compliance (
    id integer NOT NULL,
    employee_id uuid,
    compliance_item_id integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    completion_date timestamp without time zone,
    expiry_date date,
    document_url character varying(500),
    notes text,
    verified_by uuid,
    verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_compliance OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 19599)
-- Name: employee_compliance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_compliance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_compliance_id_seq OWNER TO postgres;

--
-- TOC entry 5829 (class 0 OID 0)
-- Dependencies: 279
-- Name: employee_compliance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_compliance_id_seq OWNED BY public.employee_compliance.id;


--
-- TOC entry 238 (class 1259 OID 17928)
-- Name: employee_leave_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_leave_balances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    leave_type_id uuid,
    current_balance numeric(5,2) DEFAULT 0,
    accrued_balance numeric(5,2) DEFAULT 0,
    used_balance numeric(5,2) DEFAULT 0,
    pending_balance numeric(5,2) DEFAULT 0,
    year integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_leave_balances OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 17269)
-- Name: employee_teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying,
    team_id uuid,
    role_in_team character varying DEFAULT 'member'::character varying,
    is_primary_team boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.employee_teams OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 19281)
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    max_amount numeric(10,2),
    requires_receipt boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 19265)
-- Name: expense_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expense_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_categories_id_seq OWNER TO postgres;

--
-- TOC entry 5830 (class 0 OID 0)
-- Dependencies: 250
-- Name: expense_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expense_categories_id_seq OWNED BY public.expense_categories.id;


--
-- TOC entry 258 (class 1259 OID 19315)
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    employee_id uuid,
    category_id integer,
    title character varying(255) NOT NULL,
    description text,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    expense_date date NOT NULL,
    receipt_url character varying(500),
    receipt_name character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reviewed_by uuid,
    reviewed_at timestamp without time zone,
    review_notes text,
    reimbursed_at timestamp without time zone,
    payment_method character varying(50),
    payment_reference character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 19312)
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO postgres;

--
-- TOC entry 5831 (class 0 OID 0)
-- Dependencies: 257
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- TOC entry 234 (class 1259 OID 17863)
-- Name: failed_login_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.failed_login_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255),
    ip_address character varying(50),
    attempt_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reason character varying(100)
);


ALTER TABLE public.failed_login_attempts OWNER TO postgres;

--
-- TOC entry 274 (class 1259 OID 19502)
-- Name: interviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interviews (
    id integer NOT NULL,
    candidate_id integer,
    interviewer_id uuid,
    interview_type character varying(50),
    scheduled_at timestamp without time zone NOT NULL,
    duration_minutes integer DEFAULT 60,
    location character varying(200),
    meeting_url character varying(500),
    status character varying(20) DEFAULT 'scheduled'::character varying,
    feedback text,
    rating integer,
    recommendation character varying(20),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT interviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.interviews OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 19499)
-- Name: interviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interviews_id_seq OWNER TO postgres;

--
-- TOC entry 5832 (class 0 OID 0)
-- Dependencies: 273
-- Name: interviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interviews_id_seq OWNED BY public.interviews.id;


--
-- TOC entry 236 (class 1259 OID 17888)
-- Name: job_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_applications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    job_posting_id uuid,
    candidate_name character varying(200) NOT NULL,
    candidate_email character varying(200) NOT NULL,
    candidate_phone character varying(50),
    resume_url text,
    cover_letter text,
    status character varying(50) DEFAULT 'applied'::character varying,
    applied_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    rating integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.job_applications OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 19367)
-- Name: job_positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_positions (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    department_id uuid,
    description text,
    requirements text,
    salary_range character varying(100),
    employment_type character varying(50),
    location character varying(200),
    is_remote boolean DEFAULT false,
    status character varying(20) DEFAULT 'open'::character varying,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.job_positions OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 19355)
-- Name: job_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_positions_id_seq OWNER TO postgres;

--
-- TOC entry 5833 (class 0 OID 0)
-- Dependencies: 259
-- Name: job_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_positions_id_seq OWNED BY public.job_positions.id;


--
-- TOC entry 235 (class 1259 OID 17871)
-- Name: job_postings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_postings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(200) NOT NULL,
    department character varying(100),
    location character varying(100),
    employment_type character varying(50),
    description text,
    requirements text[],
    benefits text[],
    salary_min numeric(15,2),
    salary_max numeric(15,2),
    status character varying(50) DEFAULT 'draft'::character varying,
    posted_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    closing_date timestamp without time zone,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.job_postings OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 18165)
-- Name: leave_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    leave_request_id uuid,
    action character varying(50) NOT NULL,
    performed_by uuid,
    action_reason text,
    previous_status character varying(50),
    new_status character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leave_audit_log OWNER TO postgres;

--
-- TOC entry 5834 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE leave_audit_log; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.leave_audit_log IS 'Audit trail for all leave request actions';


--
-- TOC entry 230 (class 1259 OID 17776)
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    leave_type_id uuid,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days_requested numeric(5,2),
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying,
    manager_comments text,
    rejection_reason text,
    reviewed_by uuid,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cancelled_at timestamp without time zone,
    cancelled_by uuid,
    cancellation_reason text,
    CONSTRAINT check_valid_dates CHECK ((end_date >= start_date))
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- TOC entry 5835 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN leave_requests.cancelled_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_requests.cancelled_at IS 'Timestamp when leave was cancelled';


--
-- TOC entry 5836 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN leave_requests.cancelled_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_requests.cancelled_by IS 'User who cancelled the approved leave';


--
-- TOC entry 5837 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN leave_requests.cancellation_reason; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_requests.cancellation_reason IS 'Reason for cancelling approved leave';


--
-- TOC entry 229 (class 1259 OID 17766)
-- Name: leave_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    description text,
    category character varying(50),
    color character varying(20),
    icon character varying(50),
    max_days_per_year integer,
    accrual_method character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    allow_half_day boolean DEFAULT true,
    allow_carryover boolean DEFAULT false,
    max_carryover_days integer DEFAULT 0,
    requires_document_after_days integer,
    applicable_gender character varying(10) DEFAULT 'ALL'::character varying,
    min_service_months integer DEFAULT 0,
    is_paid boolean DEFAULT true
);


ALTER TABLE public.leave_types OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 19411)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer,
    sender_id uuid,
    content text NOT NULL,
    message_type character varying(20) DEFAULT 'text'::character varying,
    attachment_url character varying(500),
    attachment_name character varying(255),
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    reply_to_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 19410)
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- TOC entry 5838 (class 0 OID 0)
-- Dependencies: 265
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- TOC entry 231 (class 1259 OID 17817)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipient_id uuid,
    title character varying(200),
    message text,
    type character varying(50),
    link character varying(255),
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 284 (class 1259 OID 19674)
-- Name: office_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.office_locations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    address text,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    radius_meters integer DEFAULT 100,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.office_locations OWNER TO postgres;

--
-- TOC entry 283 (class 1259 OID 19673)
-- Name: office_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.office_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.office_locations_id_seq OWNER TO postgres;

--
-- TOC entry 5839 (class 0 OID 0)
-- Dependencies: 283
-- Name: office_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.office_locations_id_seq OWNED BY public.office_locations.id;


--
-- TOC entry 297 (class 1259 OID 20181)
-- Name: onboarding_processes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarding_processes (
    id integer NOT NULL,
    employee_id uuid,
    template_id integer,
    start_date date DEFAULT CURRENT_DATE,
    expected_end_date date,
    actual_end_date date,
    status character varying(50) DEFAULT 'in_progress'::character varying,
    progress_percentage integer DEFAULT 0,
    assigned_buddy_id uuid,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.onboarding_processes OWNER TO postgres;

--
-- TOC entry 296 (class 1259 OID 20180)
-- Name: onboarding_processes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.onboarding_processes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onboarding_processes_id_seq OWNER TO postgres;

--
-- TOC entry 5840 (class 0 OID 0)
-- Dependencies: 296
-- Name: onboarding_processes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.onboarding_processes_id_seq OWNED BY public.onboarding_processes.id;


--
-- TOC entry 237 (class 1259 OID 17906)
-- Name: onboarding_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarding_tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    task_name character varying(200) NOT NULL,
    description text,
    category character varying(50),
    status character varying(50) DEFAULT 'pending'::character varying,
    assigned_to uuid,
    due_date date,
    completed_date timestamp without time zone,
    priority character varying(20) DEFAULT 'medium'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.onboarding_tasks OWNER TO postgres;

--
-- TOC entry 292 (class 1259 OID 20141)
-- Name: onboarding_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarding_templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    department_id uuid,
    position_id uuid,
    tasks jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.onboarding_templates OWNER TO postgres;

--
-- TOC entry 291 (class 1259 OID 20140)
-- Name: onboarding_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.onboarding_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onboarding_templates_id_seq OWNER TO postgres;

--
-- TOC entry 5841 (class 0 OID 0)
-- Dependencies: 291
-- Name: onboarding_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.onboarding_templates_id_seq OWNED BY public.onboarding_templates.id;


--
-- TOC entry 239 (class 1259 OID 17953)
-- Name: payroll_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    pay_period character varying(20) NOT NULL,
    basic_salary numeric(10,2) DEFAULT 0,
    allowances numeric(10,2) DEFAULT 0,
    deductions numeric(10,2) DEFAULT 0,
    gross_salary numeric(10,2) GENERATED ALWAYS AS ((basic_salary + allowances)) STORED,
    net_salary numeric(10,2) GENERATED ALWAYS AS (((basic_salary + allowances) - deductions)) STORED,
    status character varying(20) DEFAULT 'draft'::character varying,
    payment_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    period_start date,
    period_end date
);


ALTER TABLE public.payroll_records OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 17972)
-- Name: performance_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_goals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    title character varying(255) NOT NULL,
    description text,
    category character varying(50) DEFAULT 'individual'::character varying,
    priority character varying(50) DEFAULT 'medium'::character varying,
    status character varying(50) DEFAULT 'not_started'::character varying,
    target_date date,
    completion_percentage integer DEFAULT 0,
    employee_notes text,
    manager_notes text,
    created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_date timestamp without time zone,
    created_by uuid
);


ALTER TABLE public.performance_goals OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 18010)
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_metrics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    metric_name character varying(100),
    metric_value numeric(10,2),
    target_value numeric(10,2),
    unit character varying(20),
    period character varying(50),
    category character varying(50),
    recorded_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.performance_metrics OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 17990)
-- Name: performance_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    reviewer_id uuid,
    review_period_start date,
    review_period_end date,
    status character varying(50) DEFAULT 'draft'::character varying,
    overall_rating numeric(3,1),
    strengths jsonb,
    areas_for_improvement jsonb,
    goals_for_next_period jsonb,
    manager_comments text,
    employee_comments text,
    created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    submitted_date timestamp without time zone,
    completed_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.performance_reviews OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17678)
-- Name: positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.positions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    department_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.positions OWNER TO postgres;

--
-- TOC entry 285 (class 1259 OID 19850)
-- Name: project_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    employee_id uuid,
    role character varying(100),
    allocation_percentage integer DEFAULT 100,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.project_members OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 18063)
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'planning'::character varying,
    team_id uuid,
    start_date date,
    end_date date,
    progress integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    department_id uuid,
    manager_id uuid
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- TOC entry 288 (class 1259 OID 20107)
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    token_id character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    revoked boolean DEFAULT false,
    revoked_at timestamp without time zone,
    user_agent text,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- TOC entry 287 (class 1259 OID 20106)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- TOC entry 5842 (class 0 OID 0)
-- Dependencies: 287
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- TOC entry 246 (class 1259 OID 18109)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    role_id integer,
    permission_key character varying(100) NOT NULL,
    resource_type character varying(50),
    action_type character varying(50),
    scope character varying(20) DEFAULT 'own'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17650)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    level integer DEFAULT 0,
    display_name character varying(100),
    color_code character varying(20),
    icon character varying(50),
    is_system_role boolean DEFAULT false,
    permissions text[]
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 17649)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5843 (class 0 OID 0)
-- Dependencies: 221
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 295 (class 1259 OID 20170)
-- Name: salary_components; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_components (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    calculation_type character varying(50) DEFAULT 'fixed'::character varying,
    default_value numeric(12,2),
    is_taxable boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.salary_components OWNER TO postgres;

--
-- TOC entry 293 (class 1259 OID 20168)
-- Name: salary_components_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salary_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_components_id_seq OWNER TO postgres;

--
-- TOC entry 5844 (class 0 OID 0)
-- Dependencies: 293
-- Name: salary_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salary_components_id_seq OWNED BY public.salary_components.id;


--
-- TOC entry 247 (class 1259 OID 18129)
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    break_duration_minutes integer DEFAULT 60,
    grace_period_minutes integer DEFAULT 15,
    half_day_threshold_minutes integer DEFAULT 240,
    is_night_shift boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 18082)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    key character varying(50) NOT NULL,
    value text,
    description text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    category character varying(50)
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 18032)
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    department_id uuid,
    team_lead_id uuid,
    description text,
    parent_team_id uuid,
    type character varying(50) DEFAULT 'functional'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 19266)
-- Name: training_courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_courses (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    instructor character varying(100),
    duration_hours numeric(5,2),
    thumbnail_url text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.training_courses OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 19253)
-- Name: training_courses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_courses_id_seq OWNER TO postgres;

--
-- TOC entry 5845 (class 0 OID 0)
-- Dependencies: 249
-- Name: training_courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_courses_id_seq OWNED BY public.training_courses.id;


--
-- TOC entry 256 (class 1259 OID 19300)
-- Name: training_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_enrollments (
    id integer NOT NULL,
    course_id integer,
    employee_id uuid,
    status character varying(50) DEFAULT 'enrolled'::character varying,
    progress_percentage integer DEFAULT 0,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    certificate_url text
);


ALTER TABLE public.training_enrollments OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 19296)
-- Name: training_enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_enrollments_id_seq OWNER TO postgres;

--
-- TOC entry 5846 (class 0 OID 0)
-- Dependencies: 255
-- Name: training_enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_enrollments_id_seq OWNED BY public.training_enrollments.id;


--
-- TOC entry 228 (class 1259 OID 17749)
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    language character varying(10) DEFAULT 'en'::character varying,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    notifications jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_preferences OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17691)
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    auth_user_id text,
    employee_id character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    role_id integer,
    department_id uuid,
    position_id uuid,
    manager_id uuid,
    avatar_url text,
    phone_number character varying(50),
    date_of_birth date,
    hire_date date,
    salary numeric(10,2),
    employment_type character varying(50) DEFAULT 'full_time'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    is_active boolean DEFAULT true,
    address jsonb,
    preferences jsonb,
    emergency_contact jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    team_id uuid,
    employee_code character varying(50),
    profile_photo_url text,
    shift character varying(50),
    middle_name character varying(100),
    preferred_name character varying(100),
    gender character varying(20),
    marital_status character varying(20),
    blood_group character varying(5),
    nationality character varying(50) DEFAULT 'Indian'::character varying,
    alternate_phone character varying(50),
    personal_email character varying(255),
    pan_number character varying(10),
    aadhaar_number character varying(255),
    uan_number character varying(12),
    pan_aadhaar_linked boolean DEFAULT false,
    pan_linked_date date,
    esi_number character varying(17),
    pf_account_number character varying(22),
    previous_pf_account character varying(22),
    tax_regime character varying(10) DEFAULT 'new'::character varying,
    professional_tax_applicable boolean DEFAULT true,
    bank_name character varying(100),
    bank_account_number character varying(255),
    bank_ifsc_code character varying(11),
    bank_branch character varying(100),
    account_holder_name character varying(200),
    account_type character varying(20) DEFAULT 'savings'::character varying,
    payment_method character varying(20) DEFAULT 'bank_transfer'::character varying,
    currency_code character varying(3) DEFAULT 'INR'::character varying,
    basic_salary numeric(10,2),
    hra numeric(10,2),
    special_allowance numeric(10,2),
    gross_salary numeric(10,2),
    net_salary numeric(10,2),
    default_shift_id uuid,
    profile_completion_percentage integer DEFAULT 0,
    profile_deadline date,
    profile_completed_at timestamp without time zone,
    last_profile_reminder_sent timestamp without time zone,
    profile_sections_completed jsonb DEFAULT '{"bank": 0, "contact": 0, "personal": 0, "documents": 0, "education": 0, "additional": 0, "compliance": 0}'::jsonb,
    mfa_enabled boolean DEFAULT false,
    mfa_secret character varying(255),
    mfa_backup_codes text[],
    account_locked boolean DEFAULT false,
    failed_login_attempts integer DEFAULT 0,
    last_login timestamp without time zone,
    password_changed_at timestamp without time zone,
    force_password_change boolean DEFAULT false,
    employment_status character varying(50) DEFAULT 'active'::character varying,
    emergency_contact_name character varying(100),
    emergency_contact_phone character varying(50),
    emergency_contact_relation character varying(50)
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- TOC entry 5847 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN user_profiles.profile_completion_percentage; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.profile_completion_percentage IS 'Overall profile completion (0-100)';


--
-- TOC entry 5848 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN user_profiles.profile_sections_completed; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.profile_sections_completed IS 'Completion % of individual sections';


--
-- TOC entry 286 (class 1259 OID 20101)
-- Name: user_profiles_with_role; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_profiles_with_role AS
 SELECT u.id,
    u.auth_user_id,
    u.employee_id,
    u.first_name,
    u.last_name,
    u.email,
    u.password_hash,
    u.role_id,
    u.department_id,
    u.position_id,
    u.manager_id,
    u.avatar_url,
    u.phone_number,
    u.date_of_birth,
    u.hire_date,
    u.salary,
    u.employment_type,
    u.status,
    u.is_active,
    u.address,
    u.preferences,
    u.emergency_contact,
    u.created_at,
    u.updated_at,
    u.team_id,
    u.employee_code,
    u.profile_photo_url,
    u.shift,
    u.middle_name,
    u.preferred_name,
    u.gender,
    u.marital_status,
    u.blood_group,
    u.nationality,
    u.alternate_phone,
    u.personal_email,
    u.pan_number,
    u.aadhaar_number,
    u.uan_number,
    u.pan_aadhaar_linked,
    u.pan_linked_date,
    u.esi_number,
    u.pf_account_number,
    u.previous_pf_account,
    u.tax_regime,
    u.professional_tax_applicable,
    u.bank_name,
    u.bank_account_number,
    u.bank_ifsc_code,
    u.bank_branch,
    u.account_holder_name,
    u.account_type,
    u.payment_method,
    u.currency_code,
    u.basic_salary,
    u.hra,
    u.special_allowance,
    u.gross_salary,
    u.net_salary,
    u.default_shift_id,
    u.profile_completion_percentage,
    u.profile_deadline,
    u.profile_completed_at,
    u.last_profile_reminder_sent,
    u.profile_sections_completed,
    u.mfa_enabled,
    u.mfa_secret,
    u.mfa_backup_codes,
    u.account_locked,
    u.failed_login_attempts,
    u.last_login,
    u.password_changed_at,
    u.force_password_change,
    u.employment_status,
    u.emergency_contact_name,
    u.emergency_contact_phone,
    u.emergency_contact_relation,
    r.name AS role_name,
    r.description AS role_description
   FROM (public.user_profiles u
     LEFT JOIN public.roles r ON ((u.role_id = r.id)));


ALTER VIEW public.user_profiles_with_role OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 17846)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    session_token text,
    device_info jsonb,
    ip_address character varying(50),
    is_active boolean DEFAULT true,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_activity timestamp without time zone
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17735)
-- Name: user_themes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_themes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    theme character varying(20) DEFAULT 'light'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_themes OWNER TO postgres;

--
-- TOC entry 276 (class 1259 OID 19555)
-- Name: wfh_policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wfh_policies (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    max_days_per_week integer DEFAULT 2,
    max_days_per_month integer DEFAULT 8,
    requires_approval boolean DEFAULT true,
    allowed_roles integer[],
    allowed_departments uuid[],
    min_notice_days integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wfh_policies OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 19554)
-- Name: wfh_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wfh_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wfh_policies_id_seq OWNER TO postgres;

--
-- TOC entry 5849 (class 0 OID 0)
-- Dependencies: 275
-- Name: wfh_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wfh_policies_id_seq OWNED BY public.wfh_policies.id;


--
-- TOC entry 271 (class 1259 OID 19480)
-- Name: wfh_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wfh_requests (
    id integer NOT NULL,
    employee_id uuid,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    work_type character varying(20) DEFAULT 'full_day'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    approved_by uuid,
    approved_at timestamp without time zone,
    rejection_reason text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wfh_requests OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 19462)
-- Name: wfh_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wfh_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wfh_requests_id_seq OWNER TO postgres;

--
-- TOC entry 5850 (class 0 OID 0)
-- Dependencies: 267
-- Name: wfh_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wfh_requests_id_seq OWNED BY public.wfh_requests.id;


--
-- TOC entry 5272 (class 2604 OID 19578)
-- Name: announcement_reads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_reads ALTER COLUMN id SET DEFAULT nextval('public.announcement_reads_id_seq'::regclass);


--
-- TOC entry 5251 (class 2604 OID 19500)
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- TOC entry 5278 (class 2604 OID 19649)
-- Name: attendance_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records ALTER COLUMN id SET DEFAULT nextval('public.attendance_records_id_seq'::regclass);


--
-- TOC entry 5297 (class 2604 OID 20130)
-- Name: benefit_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.benefit_plans ALTER COLUMN id SET DEFAULT nextval('public.benefit_plans_id_seq'::regclass);


--
-- TOC entry 5242 (class 2604 OID 19471)
-- Name: candidates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates ALTER COLUMN id SET DEFAULT nextval('public.candidates_id_seq'::regclass);


--
-- TOC entry 5231 (class 2604 OID 19391)
-- Name: compliance_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compliance_items ALTER COLUMN id SET DEFAULT nextval('public.compliance_items_id_seq'::regclass);


--
-- TOC entry 5227 (class 2604 OID 19374)
-- Name: conversation_participants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants ALTER COLUMN id SET DEFAULT nextval('public.conversation_participants_id_seq'::regclass);


--
-- TOC entry 5208 (class 2604 OID 19303)
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- TOC entry 5072 (class 2604 OID 17666)
-- Name: departments item_order; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN item_order SET DEFAULT nextval('public.departments_item_order_seq'::regclass);


--
-- TOC entry 5326 (class 2604 OID 20404)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 5319 (class 2604 OID 20195)
-- Name: employee_benefits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_benefits ALTER COLUMN id SET DEFAULT nextval('public.employee_benefits_id_seq'::regclass);


--
-- TOC entry 5274 (class 2604 OID 19603)
-- Name: employee_compliance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_compliance ALTER COLUMN id SET DEFAULT nextval('public.employee_compliance_id_seq'::regclass);


--
-- TOC entry 5204 (class 2604 OID 19288)
-- Name: expense_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_categories_id_seq'::regclass);


--
-- TOC entry 5216 (class 2604 OID 19321)
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- TOC entry 5260 (class 2604 OID 19514)
-- Name: interviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews ALTER COLUMN id SET DEFAULT nextval('public.interviews_id_seq'::regclass);


--
-- TOC entry 5222 (class 2604 OID 19378)
-- Name: job_positions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions ALTER COLUMN id SET DEFAULT nextval('public.job_positions_id_seq'::regclass);


--
-- TOC entry 5236 (class 2604 OID 19415)
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- TOC entry 5286 (class 2604 OID 19677)
-- Name: office_locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_locations ALTER COLUMN id SET DEFAULT nextval('public.office_locations_id_seq'::regclass);


--
-- TOC entry 5313 (class 2604 OID 20185)
-- Name: onboarding_processes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_processes ALTER COLUMN id SET DEFAULT nextval('public.onboarding_processes_id_seq'::regclass);


--
-- TOC entry 5303 (class 2604 OID 20144)
-- Name: onboarding_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_templates ALTER COLUMN id SET DEFAULT nextval('public.onboarding_templates_id_seq'::regclass);


--
-- TOC entry 5294 (class 2604 OID 20110)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 5067 (class 2604 OID 17653)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 5308 (class 2604 OID 20173)
-- Name: salary_components id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_components ALTER COLUMN id SET DEFAULT nextval('public.salary_components_id_seq'::regclass);


--
-- TOC entry 5200 (class 2604 OID 19271)
-- Name: training_courses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_courses ALTER COLUMN id SET DEFAULT nextval('public.training_courses_id_seq'::regclass);


--
-- TOC entry 5212 (class 2604 OID 19304)
-- Name: training_enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_enrollments ALTER COLUMN id SET DEFAULT nextval('public.training_enrollments_id_seq'::regclass);


--
-- TOC entry 5265 (class 2604 OID 19558)
-- Name: wfh_policies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfh_policies ALTER COLUMN id SET DEFAULT nextval('public.wfh_policies_id_seq'::regclass);


--
-- TOC entry 5246 (class 2604 OID 19485)
-- Name: wfh_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfh_requests ALTER COLUMN id SET DEFAULT nextval('public.wfh_requests_id_seq'::regclass);


--
-- TOC entry 5788 (class 0 OID 19575)
-- Dependencies: 278
-- Data for Name: announcement_reads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcement_reads (id, announcement_id, user_id, read_at) FROM stdin;
\.


--
-- TOC entry 5782 (class 0 OID 19484)
-- Dependencies: 272
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, content, type, priority, target_audience, target_ids, is_pinned, is_published, publish_date, expire_date, author_id, views_count, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5792 (class 0 OID 19646)
-- Dependencies: 282
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_records (id, employee_id, date, clock_in, clock_out, clock_in_type, clock_out_type, clock_in_latitude, clock_in_longitude, clock_out_latitude, clock_out_longitude, wfh_request_id, working_hours, overtime_hours, break_duration, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5742 (class 0 OID 17832)
-- Dependencies: 232
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, created_at) FROM stdin;
\.


--
-- TOC entry 5799 (class 0 OID 20127)
-- Dependencies: 290
-- Data for Name: benefit_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.benefit_plans (id, name, type, description, provider, coverage_details, cost_employee, cost_employer, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5780 (class 0 OID 19468)
-- Dependencies: 270
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidates (id, first_name, last_name, email, phone, job_position_id, resume_url, portfolio_url, linkedin_url, source, status, notes, rating, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5730 (class 0 OID 17303)
-- Dependencies: 220
-- Data for Name: clock_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clock_locations (id, name, latitude, longitude, radius_meters, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5810 (class 0 OID 20440)
-- Dependencies: 301
-- Data for Name: competency_ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.competency_ratings (id, review_id, competency_id, competency_name, rating, comments, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5774 (class 0 OID 19380)
-- Dependencies: 264
-- Data for Name: compliance_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compliance_items (id, title, description, category, type, frequency, due_date, department_id, applies_to, created_by, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5773 (class 0 OID 19371)
-- Dependencies: 263
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversation_participants (id, conversation_id, user_id, role, joined_at, last_read_at, is_muted) FROM stdin;
\.


--
-- TOC entry 5764 (class 0 OID 19294)
-- Dependencies: 254
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, type, name, description, avatar_url, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5734 (class 0 OID 17662)
-- Dependencies: 224
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, item_order, parent_department_id, manager_id, is_active, created_at) FROM stdin;
2bb7dfb7-f937-4bca-825d-37d09bd466f2	Engineering	1	\N	\N	t	2025-12-12 01:48:20.083942
4f97e6cd-163a-4d86-92c1-7eb9f3daff8b	HR	2	\N	\N	t	2025-12-12 01:48:20.083942
33b89887-90d3-4d9f-bdb1-596196aee12f	Sales	3	\N	\N	t	2025-12-12 01:48:20.083942
\.


--
-- TOC entry 5809 (class 0 OID 20397)
-- Dependencies: 300
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, name, type, extension, size, mime_type, path, file_url, uploaded_by, employee_id, is_shared, is_starred, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5807 (class 0 OID 20182)
-- Dependencies: 298
-- Data for Name: employee_benefits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_benefits (id, employee_id, benefit_plan_id, enrollment_date, coverage_level, dependents, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5790 (class 0 OID 19600)
-- Dependencies: 280
-- Data for Name: employee_compliance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_compliance (id, employee_id, compliance_item_id, status, completion_date, expiry_date, document_url, notes, verified_by, verified_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5748 (class 0 OID 17928)
-- Dependencies: 238
-- Data for Name: employee_leave_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_leave_balances (id, employee_id, leave_type_id, current_balance, accrued_balance, used_balance, pending_balance, year, created_at, updated_at) FROM stdin;
f827a4fd-7802-43f6-9c48-c675ad3467d0	98ac06d8-75e8-4306-be42-6e8626d8e5db	571b2fc8-2402-4c8f-b62a-0c030b664673	20.00	20.00	0.00	0.00	2025	2025-12-12 04:07:43.68678	2025-12-12 04:07:43.68678
30df1ada-5f32-4f82-a183-ba2cd48359f3	2164ecde-322a-4dee-8f13-281d007a9d50	571b2fc8-2402-4c8f-b62a-0c030b664673	20.00	20.00	0.00	0.00	2025	2025-12-13 20:34:02.021062	2025-12-13 20:34:02.021062
c0b24073-0504-4183-82dd-c81857ae5fd5	8af3fcf1-77f0-4545-97fa-e1b3a7cbe53b	571b2fc8-2402-4c8f-b62a-0c030b664673	20.00	20.00	0.00	0.00	2025	2025-12-13 21:08:37.537939	2025-12-13 21:08:37.537939
6577e33b-e5e4-4b8f-9a0a-aa0a9234480c	7c808189-871a-4b94-a07c-841314ac5755	571b2fc8-2402-4c8f-b62a-0c030b664673	20.00	20.00	0.00	0.00	2025	2025-12-13 04:29:54.672625	2025-12-13 04:29:54.672625
92fe523f-9ff9-48a9-b58c-eb35b5f82461	e22eceda-3e4b-4af3-b4ba-d5f2d5fb89c3	571b2fc8-2402-4c8f-b62a-0c030b664673	20.00	20.00	0.00	0.00	2025	2025-12-17 16:10:54.455878	2025-12-17 16:11:49.174675
55523ee0-8d54-4757-b038-5134799542d4	3627d147-e2c2-43fe-9f18-7f663f38ba1d	571b2fc8-2402-4c8f-b62a-0c030b664673	20.00	20.00	0.00	0.00	2025	2025-12-20 14:58:33.724346	2025-12-20 14:58:33.724346
22b14f9c-119e-4b20-8322-a9319ec32b1c	98ac06d8-75e8-4306-be42-6e8626d8e5db	571b2fc8-2402-4c8f-b62a-0c030b664673	20.00	20.00	0.00	0.00	2026	2026-01-02 16:41:41.326292	2026-01-02 16:41:41.326292
\.


--
-- TOC entry 5729 (class 0 OID 17269)
-- Dependencies: 219
-- Data for Name: employee_teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_teams (id, employee_id, team_id, role_in_team, is_primary_team, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5762 (class 0 OID 19281)
-- Dependencies: 252
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_categories (id, name, description, max_amount, requires_receipt, is_active, created_at) FROM stdin;
1	Travel	Transportation and lodging expenses	5000.00	t	t	2025-12-18 04:43:38.278033
2	Meals	Food and beverage expenses	100.00	t	t	2025-12-18 04:43:38.278033
3	Equipment	Office equipment and supplies	1000.00	t	t	2025-12-18 04:43:38.278033
4	Software	Software licenses and subscriptions	500.00	f	t	2025-12-18 04:43:38.278033
5	Training	Professional development and courses	2000.00	t	t	2025-12-18 04:43:38.278033
6	Communication	Phone and internet expenses	200.00	f	t	2025-12-18 04:43:38.278033
7	Other	Miscellaneous expenses	500.00	t	t	2025-12-18 04:43:38.278033
\.


--
-- TOC entry 5768 (class 0 OID 19315)
-- Dependencies: 258
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, employee_id, category_id, title, description, amount, currency, expense_date, receipt_url, receipt_name, status, submitted_at, reviewed_by, reviewed_at, review_notes, reimbursed_at, payment_method, payment_reference, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5744 (class 0 OID 17863)
-- Dependencies: 234
-- Data for Name: failed_login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.failed_login_attempts (id, email, ip_address, attempt_time, reason) FROM stdin;
\.


--
-- TOC entry 5784 (class 0 OID 19502)
-- Dependencies: 274
-- Data for Name: interviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interviews (id, candidate_id, interviewer_id, interview_type, scheduled_at, duration_minutes, location, meeting_url, status, feedback, rating, recommendation, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5746 (class 0 OID 17888)
-- Dependencies: 236
-- Data for Name: job_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_applications (id, job_posting_id, candidate_name, candidate_email, candidate_phone, resume_url, cover_letter, status, applied_date, notes, rating, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5771 (class 0 OID 19367)
-- Dependencies: 261
-- Data for Name: job_positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_positions (id, title, department_id, description, requirements, salary_range, employment_type, location, is_remote, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5745 (class 0 OID 17871)
-- Dependencies: 235
-- Data for Name: job_postings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_postings (id, title, department, location, employment_type, description, requirements, benefits, salary_min, salary_max, status, posted_date, closing_date, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5758 (class 0 OID 18165)
-- Dependencies: 248
-- Data for Name: leave_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_audit_log (id, leave_request_id, action, performed_by, action_reason, previous_status, new_status, created_at) FROM stdin;
\.


--
-- TOC entry 5740 (class 0 OID 17776)
-- Dependencies: 230
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (id, employee_id, leave_type_id, start_date, end_date, days_requested, reason, status, manager_comments, rejection_reason, reviewed_by, reviewed_at, created_at, updated_at, cancelled_at, cancelled_by, cancellation_reason) FROM stdin;
6be987b8-f11c-468b-863e-985ba68af51b	7c808189-871a-4b94-a07c-841314ac5755	571b2fc8-2402-4c8f-b62a-0c030b664673	2025-12-12	2025-12-12	0.00	going out	approved	Approved via dashboard	\N	98ac06d8-75e8-4306-be42-6e8626d8e5db	2025-12-15 00:27:46.568492	2025-12-15 00:22:12.099426	2025-12-15 00:27:46.568492	\N	\N	\N
3c98cd91-05a0-4232-9ad3-27f8ce470b05	e22eceda-3e4b-4af3-b4ba-d5f2d5fb89c3	571b2fc8-2402-4c8f-b62a-0c030b664673	2025-12-18	2025-12-18	0.00	going out	approved	Approved via dashboard	\N	98ac06d8-75e8-4306-be42-6e8626d8e5db	2025-12-17 16:11:49.174675	2025-12-17 16:11:22.982276	2025-12-17 16:11:49.174675	\N	\N	\N
\.


--
-- TOC entry 5739 (class 0 OID 17766)
-- Dependencies: 229
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_types (id, name, code, description, category, color, icon, max_days_per_year, accrual_method, is_active, created_at, allow_half_day, allow_carryover, max_carryover_days, requires_document_after_days, applicable_gender, min_service_months, is_paid) FROM stdin;
571b2fc8-2402-4c8f-b62a-0c030b664673	Annual	AL	\N	\N	\N	\N	20	\N	t	2025-12-12 04:04:34.7478	t	f	0	\N	ALL	0	t
\.


--
-- TOC entry 5776 (class 0 OID 19411)
-- Dependencies: 266
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, sender_id, content, message_type, attachment_url, attachment_name, is_edited, is_deleted, reply_to_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5741 (class 0 OID 17817)
-- Dependencies: 231
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, recipient_id, title, message, type, link, is_read, read_at, created_at) FROM stdin;
\.


--
-- TOC entry 5794 (class 0 OID 19674)
-- Dependencies: 284
-- Data for Name: office_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.office_locations (id, name, address, latitude, longitude, radius_meters, is_default, is_active, created_at) FROM stdin;
1	Main Office	\N	0.00000000	0.00000000	100	t	t	2025-12-18 04:45:20.663244
\.


--
-- TOC entry 5806 (class 0 OID 20181)
-- Dependencies: 297
-- Data for Name: onboarding_processes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.onboarding_processes (id, employee_id, template_id, start_date, expected_end_date, actual_end_date, status, progress_percentage, assigned_buddy_id, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5747 (class 0 OID 17906)
-- Dependencies: 237
-- Data for Name: onboarding_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.onboarding_tasks (id, employee_id, task_name, description, category, status, assigned_to, due_date, completed_date, priority, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5801 (class 0 OID 20141)
-- Dependencies: 292
-- Data for Name: onboarding_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.onboarding_templates (id, name, description, department_id, position_id, tasks, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5749 (class 0 OID 17953)
-- Dependencies: 239
-- Data for Name: payroll_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_records (id, employee_id, pay_period, basic_salary, allowances, deductions, status, payment_date, created_at, updated_at, period_start, period_end) FROM stdin;
909dd8da-5c20-4cee-b0e6-f355a870a3ab	8af3fcf1-77f0-4545-97fa-e1b3a7cbe53b	January 2025	50000.00	5000.00	2500.00	processed	\N	2025-12-15 00:29:41.294585	2025-12-15 00:29:41.294585	\N	\N
5fc1c461-8cc8-4d2e-a100-c3d64e76a127	2164ecde-322a-4dee-8f13-281d007a9d50	January 2025	50000.00	5000.00	2500.00	processed	\N	2025-12-15 00:29:41.294585	2025-12-15 00:29:41.294585	\N	\N
0aa8dfe0-eac1-40c8-a2d7-e41327ced725	7c808189-871a-4b94-a07c-841314ac5755	January 2025	50000.00	5000.00	2500.00	processed	\N	2025-12-15 00:29:41.294585	2025-12-15 00:29:41.294585	\N	\N
84344f19-34fd-4258-9456-2df1e9ff08e5	98ac06d8-75e8-4306-be42-6e8626d8e5db	January 2025	50000.00	5000.00	2500.00	processed	\N	2025-12-15 00:29:41.294585	2025-12-15 00:29:41.294585	\N	\N
\.


--
-- TOC entry 5750 (class 0 OID 17972)
-- Dependencies: 240
-- Data for Name: performance_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.performance_goals (id, employee_id, title, description, category, priority, status, target_date, completion_percentage, employee_notes, manager_notes, created_date, completed_date, created_by) FROM stdin;
\.


--
-- TOC entry 5752 (class 0 OID 18010)
-- Dependencies: 242
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.performance_metrics (id, employee_id, metric_name, metric_value, target_value, unit, period, category, recorded_date) FROM stdin;
\.


--
-- TOC entry 5751 (class 0 OID 17990)
-- Dependencies: 241
-- Data for Name: performance_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.performance_reviews (id, employee_id, reviewer_id, review_period_start, review_period_end, status, overall_rating, strengths, areas_for_improvement, goals_for_next_period, manager_comments, employee_comments, created_date, submitted_date, completed_date, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5735 (class 0 OID 17678)
-- Dependencies: 225
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.positions (id, name, department_id, is_active, created_at) FROM stdin;
e0f84f3c-6f7c-4ebf-b78e-c01a367c53b1	Senior Developer	2bb7dfb7-f937-4bca-825d-37d09bd466f2	t	2025-12-12 01:48:20.283509
1e8f1cc5-83a3-436e-a6d2-6d66948c2c05	HR Manager	2bb7dfb7-f937-4bca-825d-37d09bd466f2	t	2025-12-12 01:48:20.283509
58ff539d-8f98-4272-b51e-2fd1da39882a	Senior Developer	2bb7dfb7-f937-4bca-825d-37d09bd466f2	t	2025-12-12 02:31:15.348743
529cfacf-f804-46ba-a3ca-b5fefe7d00d6	HR Manager	2bb7dfb7-f937-4bca-825d-37d09bd466f2	t	2025-12-12 02:31:15.348743
ff1da575-3c19-42d0-91c6-e90900116238	Software Engineer	2bb7dfb7-f937-4bca-825d-37d09bd466f2	t	2025-12-13 04:20:37.682606
3947c9ff-7f5b-4bab-9256-f0a0076c5ab3	Senior Software Engineer	2bb7dfb7-f937-4bca-825d-37d09bd466f2	t	2025-12-13 04:20:37.692621
99cfdb06-b1cc-4bc1-adb4-41c9de16429e	QA Engineer	2bb7dfb7-f937-4bca-825d-37d09bd466f2	t	2025-12-13 04:20:37.696045
41c1547d-41f7-478a-9fa7-bd29023a4a8c	HR Manager	4f97e6cd-163a-4d86-92c1-7eb9f3daff8b	t	2025-12-13 04:20:37.698775
a747bd67-eeef-4f94-81de-e2ed7e376460	Recruiter	4f97e6cd-163a-4d86-92c1-7eb9f3daff8b	t	2025-12-13 04:20:37.701752
cb254fbb-dead-4df2-93fa-5ed6b7db7a59	HR Specialist	4f97e6cd-163a-4d86-92c1-7eb9f3daff8b	t	2025-12-13 04:20:37.705903
f28e0a1d-496b-4d6e-84cd-7ec17c19052b	Sales Representative	33b89887-90d3-4d9f-bdb1-596196aee12f	t	2025-12-13 04:20:37.709031
86057ac9-9f3a-4c6c-bb0b-45d8ff971f16	Account Manager	33b89887-90d3-4d9f-bdb1-596196aee12f	t	2025-12-13 04:20:37.71158
01a7e937-8a25-457f-a75a-fa01fad4f7cf	Sales Executive	33b89887-90d3-4d9f-bdb1-596196aee12f	t	2025-12-13 14:25:42.36802
\.


--
-- TOC entry 5795 (class 0 OID 19850)
-- Dependencies: 285
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_members (id, project_id, employee_id, role, allocation_percentage, joined_at) FROM stdin;
\.


--
-- TOC entry 5754 (class 0 OID 18063)
-- Dependencies: 244
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, name, description, status, team_id, start_date, end_date, progress, created_at, updated_at, department_id, manager_id) FROM stdin;
deeabd1d-5517-404a-9b86-5b6a32bba01c	HR Portal Redesign	Revamp internal HR tool	active	14626517-d008-4bdf-a881-522c4366944f	2025-01-01	2025-06-01	45	2025-12-13 04:35:05.547797	2025-12-13 04:35:05.547797	\N	\N
d4cf253a-ec5a-4ec7-acbd-130f6ab14308	API Migration	Move to Node.js	planning	14626517-d008-4bdf-a881-522c4366944f	2025-03-01	2025-08-01	10	2025-12-13 04:35:05.547797	2025-12-13 04:35:05.547797	\N	\N
a2624ade-7af8-41c9-bb8d-19750d239b74	Q1 Hiring Sprint	Hire 10 engineers	active	9dbbb0bc-1811-46f7-8d57-f51766e46338	2025-01-15	2025-04-01	70	2025-12-13 04:35:05.547797	2025-12-13 04:35:05.547797	\N	\N
\.


--
-- TOC entry 5797 (class 0 OID 20107)
-- Dependencies: 288
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token_id, expires_at, revoked, revoked_at, user_agent, ip_address, created_at) FROM stdin;
1	98ac06d8-75e8-4306-be42-6e8626d8e5db	bb084c55-e348-40bd-8421-fef2694768e3	2025-12-28 03:50:38.353	f	\N	\N	\N	2025-12-21 03:50:38.357233
2	98ac06d8-75e8-4306-be42-6e8626d8e5db	3e014933-5b15-47d7-a2e2-e2eec1262b88	2025-12-28 03:51:27.551	f	\N	\N	\N	2025-12-21 03:51:27.553608
3	98ac06d8-75e8-4306-be42-6e8626d8e5db	694ac8bc-0e32-4a68-b591-0c96ed89e604	2026-01-09 16:39:31.777	t	2026-01-03 02:52:54.057789	\N	\N	2026-01-02 16:39:31.780681
4	98ac06d8-75e8-4306-be42-6e8626d8e5db	0191ee3d-24d9-4562-b06a-0ff8144d71f3	2026-01-10 02:52:54.065	t	2026-01-03 02:54:48.44329	\N	\N	2026-01-03 02:52:54.067771
5	98ac06d8-75e8-4306-be42-6e8626d8e5db	3c254b6c-c92e-43f2-bd52-7abd06b419a3	2026-01-10 02:54:50.609	t	2026-01-03 03:07:02.327106	\N	\N	2026-01-03 02:54:50.610541
6	98ac06d8-75e8-4306-be42-6e8626d8e5db	e3f22d1d-c557-4614-aaaa-19dffa40056c	2026-01-10 03:07:03.702	t	2026-01-03 03:07:07.317078	\N	\N	2026-01-03 03:07:03.704537
7	98ac06d8-75e8-4306-be42-6e8626d8e5db	b4482580-0452-4d51-a1a5-33ef5ef3a06c	2026-01-10 03:07:08.632	t	2026-01-03 03:20:58.886438	\N	\N	2026-01-03 03:07:08.634183
8	98ac06d8-75e8-4306-be42-6e8626d8e5db	d1129504-6cb6-4e93-b29f-1d3e2e30fd28	2026-01-10 03:21:00.435	t	2026-01-03 03:39:53.681206	\N	\N	2026-01-03 03:21:00.438478
9	98ac06d8-75e8-4306-be42-6e8626d8e5db	69452f28-a55b-49e7-8618-6829e5f6638a	2026-01-10 03:39:53.686	t	2026-01-03 03:44:31.307072	\N	\N	2026-01-03 03:39:53.689077
10	98ac06d8-75e8-4306-be42-6e8626d8e5db	112366e1-db15-4833-9e10-1a13d97b61ff	2026-01-10 03:44:33.072	f	\N	\N	\N	2026-01-03 03:44:33.07517
11	98ac06d8-75e8-4306-be42-6e8626d8e5db	b5d310e2-d70c-4e9c-90ba-6f044cce9e54	2026-01-10 03:53:38.351	t	2026-01-03 04:04:43.349842	\N	\N	2026-01-03 03:53:38.354303
12	98ac06d8-75e8-4306-be42-6e8626d8e5db	f523812e-a112-465f-87a5-4f23cb2b0fd3	2026-01-10 04:05:25.363	t	2026-01-03 04:05:40.594636	\N	\N	2026-01-03 04:05:25.366456
13	98ac06d8-75e8-4306-be42-6e8626d8e5db	34fbf7f2-8ea2-4a5b-8e4c-b06d16c9b9b7	2026-01-20 16:22:34.967	f	\N	\N	\N	2026-01-13 16:22:34.972213
\.


--
-- TOC entry 5756 (class 0 OID 18109)
-- Dependencies: 246
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, permission_key, resource_type, action_type, scope, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5732 (class 0 OID 17650)
-- Dependencies: 222
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, created_at, level, display_name, color_code, icon, is_system_role, permissions) FROM stdin;
1	super_admin	\N	2025-12-12 01:48:20.083942	100	Super Administrator	#dc2626	SupervisorAccount	t	\N
2	hr_manager	\N	2025-12-12 01:48:20.083942	80	HR Manager	#c2410c	People	f	\N
4	employee	\N	2025-12-12 01:48:20.083942	40	Employee	#6b7280	Person	f	\N
5	intern	\N	2025-12-12 01:48:20.083942	30	Intern	#9ca3af	PersonOutline	f	\N
6	team_lead	Team Leader	2025-12-13 02:54:23.797786	60	Team Leader	#2563eb	Group	f	\N
3	department_manager	\N	2025-12-12 01:48:20.083942	70	Department Manager	#dc2626	Business	f	\N
7	admin	Administrator	2025-12-16 02:42:43.906337	90	Administrator	#ea580c	AdminPanelSettings	t	\N
8	senior_employee	Senior Employee	2025-12-16 02:42:43.906337	50	Senior Employee	#059669	School	f	\N
13	manager	Manager	2025-12-21 03:32:41.396705	0	\N	\N	\N	f	\N
14	team_leader	Team Leader	2025-12-21 03:32:41.396705	0	\N	\N	\N	f	\N
\.


--
-- TOC entry 5804 (class 0 OID 20170)
-- Dependencies: 295
-- Data for Name: salary_components; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salary_components (id, name, type, calculation_type, default_value, is_taxable, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 5757 (class 0 OID 18129)
-- Dependencies: 247
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (id, name, code, start_time, end_time, break_duration_minutes, grace_period_minutes, half_day_threshold_minutes, is_night_shift, is_active, created_at, updated_at) FROM stdin;
eab43aaa-a83d-4637-abdc-ff3a6cdad78d	General Shift	GEN	09:00:00	18:00:00	60	15	240	f	t	2025-12-17 15:22:22.916292	2025-12-17 15:22:22.916292
b5bbdd3b-90f0-4d0c-8bd6-3738248a01d9	Morning Shift	MOR	06:00:00	15:00:00	60	15	240	f	t	2025-12-17 15:22:22.916292	2025-12-17 15:22:22.916292
79627856-3ad9-4c47-9572-b3cbbe4f5ea0	Evening Shift	EVE	15:00:00	00:00:00	60	15	240	f	t	2025-12-17 15:22:22.916292	2025-12-17 15:22:22.916292
6f3ec760-d356-4f01-a6a5-a1c68df87d77	Night Shift	NGT	22:00:00	07:00:00	60	15	240	t	t	2025-12-17 15:22:22.916292	2025-12-17 15:22:22.916292
\.


--
-- TOC entry 5755 (class 0 OID 18082)
-- Dependencies: 245
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (key, value, description, updated_at, category) FROM stdin;
office_lat	28.6139	Office Latitude	2025-12-13 21:53:28.702685	\N
office_lng	77.2090	Office Longitude	2025-12-13 21:53:28.702685	\N
office_radius	150	Geofencing Radius (meters)	2025-12-13 21:53:28.702685	\N
payroll_tax_rate	0.15	Default tax rate (15%)	2025-12-16 01:38:59.514696	payroll
payroll_allowance_rate	0.10	Default allowance rate (10%)	2025-12-16 01:38:59.514696	payroll
standard_work_hours	8	Standard work hours per day	2025-12-16 01:38:59.514696	attendance
overtime_multiplier	1.5	Overtime pay multiplier	2025-12-16 01:38:59.514696	attendance
late_arrival_threshold	09:30:00	Late arrival time threshold	2025-12-16 01:38:59.514696	attendance
leave_accrual_rate	1.67	Monthly leave accrual (20 days/year)	2025-12-16 01:38:59.514696	leave
max_leave_carryover	5	Maximum leave carryover days	2025-12-16 01:38:59.514696	leave
\.


--
-- TOC entry 5753 (class 0 OID 18032)
-- Dependencies: 243
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (id, name, department_id, team_lead_id, description, parent_team_id, type, created_at, updated_at) FROM stdin;
14626517-d008-4bdf-a881-522c4366944f	Dev Team	2bb7dfb7-f937-4bca-825d-37d09bd466f2	\N	\N	\N	engineering	2025-12-13 04:35:05.547797	2025-12-13 04:35:05.547797
9dbbb0bc-1811-46f7-8d57-f51766e46338	Recruiting Team	4f97e6cd-163a-4d86-92c1-7eb9f3daff8b	\N	\N	\N	hr	2025-12-13 04:35:05.547797	2025-12-13 04:35:05.547797
\.


--
-- TOC entry 5761 (class 0 OID 19266)
-- Dependencies: 251
-- Data for Name: training_courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_courses (id, title, description, instructor, duration_hours, thumbnail_url, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5766 (class 0 OID 19300)
-- Dependencies: 256
-- Data for Name: training_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_enrollments (id, course_id, employee_id, status, progress_percentage, enrolled_at, completed_at, certificate_url) FROM stdin;
\.


--
-- TOC entry 5738 (class 0 OID 17749)
-- Dependencies: 228
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preferences (id, user_id, language, timezone, notifications, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5736 (class 0 OID 17691)
-- Dependencies: 226
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_profiles (id, auth_user_id, employee_id, first_name, last_name, email, password_hash, role_id, department_id, position_id, manager_id, avatar_url, phone_number, date_of_birth, hire_date, salary, employment_type, status, is_active, address, preferences, emergency_contact, created_at, updated_at, team_id, employee_code, profile_photo_url, shift, middle_name, preferred_name, gender, marital_status, blood_group, nationality, alternate_phone, personal_email, pan_number, aadhaar_number, uan_number, pan_aadhaar_linked, pan_linked_date, esi_number, pf_account_number, previous_pf_account, tax_regime, professional_tax_applicable, bank_name, bank_account_number, bank_ifsc_code, bank_branch, account_holder_name, account_type, payment_method, currency_code, basic_salary, hra, special_allowance, gross_salary, net_salary, default_shift_id, profile_completion_percentage, profile_deadline, profile_completed_at, last_profile_reminder_sent, profile_sections_completed, mfa_enabled, mfa_secret, mfa_backup_codes, account_locked, failed_login_attempts, last_login, password_changed_at, force_password_change, employment_status, emergency_contact_name, emergency_contact_phone, emergency_contact_relation) FROM stdin;
3627d147-e2c2-43fe-9f18-7f663f38ba1d	0776c905-61f8-4cd0-a0a5-abb6b593eb52	EMP1766222850835	Mansi	Ravrani	mansi@gmail.com	$2b$10$e01angwtKI12JpT3cn3JC.OwWIsQ1Gebj38y5AXORw6FgN8iEqXm2	6	2bb7dfb7-f937-4bca-825d-37d09bd466f2	ff1da575-3c19-42d0-91c6-e90900116238	\N	\N		\N	2025-12-20	\N	Full-Time	active	t	\N	\N	\N	2025-12-20 14:57:30.86967	2025-12-20 14:57:30.86967	\N	\N	\N	morning	\N	\N	\N	\N	\N	Indian	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	new	t	\N	\N	\N	\N	\N	savings	bank_transfer	INR	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	{"bank": 0, "contact": 0, "personal": 0, "documents": 0, "education": 0, "additional": 0, "compliance": 0}	f	\N	\N	f	0	\N	\N	f	active	\N	\N	\N
e135b22c-7ad9-4d3e-afd5-f20cd62b4662	\N	EMP-TEST-1765965382384	Rajesh	Sharma	rajesh.sharma.test1765965382384@company.com	\N	1	2bb7dfb7-f937-4bca-825d-37d09bd466f2	\N	\N	\N	9876543210	1990-05-15	2025-01-01	\N	Full-Time	terminated	f	\N	\N	\N	2025-12-17 15:26:22.411266	2025-12-17 18:00:29.359562	\N	\N	\N	\N	Kumar	\N	Male	Married	O+	Indian	\N	\N	ABCDE1434F	123456789012	123456789123	f	\N	1234567890	MH/BOM/12345/001234	\N	new	t	State Bank of India	12345678901234	SBIN0001234	Mumbai Main	Rajesh Kumar Sharma	savings	bank_transfer	INR	30000.00	12000.00	8000.00	50000.00	45000.00	eab43aaa-a83d-4637-abdc-ff3a6cdad78d	0	\N	\N	\N	{"bank": 0, "contact": 0, "personal": 0, "documents": 0, "education": 0, "additional": 0, "compliance": 0}	f	\N	\N	f	0	\N	\N	f	active	\N	\N	\N
fff85210-321c-4b46-a48a-c425adc47efd	0600bd7b-877b-44dd-9b7f-c003eec32cac	EMP1765967424804	Aditya	Singh	Adis5453@gmail.com	$2b$10$XJtMef3KXTljYmMUaCoH6ea/DHsJ7bhZX9Trbgsub.I1xmmPXpyru	8	2bb7dfb7-f937-4bca-825d-37d09bd466f2	e0f84f3c-6f7c-4ebf-b78e-c01a367c53b1	\N	\N		\N	2025-12-17	\N	Full-Time	terminated	f	\N	\N	\N	2025-12-17 16:00:24.840622	2025-12-18 05:03:33.081611	\N	\N	\N	morning	\N	\N	\N	\N	\N	Indian	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	new	t	\N	\N	\N	\N	\N	savings	bank_transfer	INR	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	{"bank": 0, "contact": 0, "personal": 0, "documents": 0, "education": 0, "additional": 0, "compliance": 0}	f	\N	\N	f	0	\N	\N	f	active	\N	\N	\N
8af3fcf1-77f0-4545-97fa-e1b3a7cbe53b	fbd5f317-691f-44f4-9f41-12b7d0cd592d	EMP1765637495076	suraj	pandey	suraj@gmail.com	$2b$10$WjT.lxHe4qKexr6oYEVUq.cvFiob9zlXnELkoTEjRkFZB9m6AfU7G	2	4f97e6cd-163a-4d86-92c1-7eb9f3daff8b	41c1547d-41f7-478a-9fa7-bd29023a4a8c	\N	\N	8966987097	\N	2025-12-12	\N	full_time	terminated	f	\N	\N	\N	2025-12-13 20:21:35.115904	2025-12-18 05:03:36.298659	\N	\N	\N	\N	\N	\N	\N	\N	\N	Indian	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	new	t	\N	\N	\N	\N	\N	savings	bank_transfer	INR	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	{"bank": 0, "contact": 0, "personal": 0, "documents": 0, "education": 0, "additional": 0, "compliance": 0}	f	\N	\N	f	0	\N	\N	f	active	\N	\N	\N
2164ecde-322a-4dee-8f13-281d007a9d50	e66c2d6d-e020-45ec-aa18-ed1e205ac7b9	EMP1765638208099	Ritik	Suthar	testsalary@example.com	$2b$10$wBIFKdzSeKKowVn1iUzaDOzB..W.W8HxV1lxfBmXOKeLm1dc6hIva	2	4f97e6cd-163a-4d86-92c1-7eb9f3daff8b	cb254fbb-dead-4df2-93fa-5ed6b7db7a59	\N	\N		\N	2025-12-13	\N	full_time	terminated	f	\N	\N	\N	2025-12-13 20:33:28.100366	2025-12-18 05:03:38.562221	\N	\N	\N	\N	\N	\N	\N	\N	\N	Indian	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	new	t	\N	\N	\N	\N	\N	savings	bank_transfer	INR	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	{"bank": 0, "contact": 0, "personal": 0, "documents": 0, "education": 0, "additional": 0, "compliance": 0}	f	\N	\N	f	0	\N	\N	f	active	\N	\N	\N
7c808189-871a-4b94-a07c-841314ac5755	f28d2a43-ca4f-41f4-a042-67159da1ecec	EMP1765580229083	Mansi	Ravrani	mansir5453@gmail.com	$2b$10$O/gCGJz8Gu12vOMgSrKVPe3fO1K2qGHR2Jy9.O71W0DBSb49gcoaW	4	33b89887-90d3-4d9f-bdb1-596196aee12f	01a7e937-8a25-457f-a75a-fa01fad4f7cf	\N	\N	999-888-7777	\N	2025-12-12	\N	full_time	terminated	f	""	{"theme": "dark", "language": "en", "timezone": "UTC", "dateFormat": "MM/DD/YYYY", "smsNotifications": false, "pushNotifications": true, "emailNotifications": true, "weekendNotifications": false}	{"name": "", "phone": "", "relationship": ""}	2025-12-13 04:27:09.162349	2025-12-18 05:03:41.149952	\N	EMP002	\N	\N	\N	\N	\N	\N	\N	Indian	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	new	t	\N	\N	\N	\N	\N	savings	bank_transfer	INR	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	{"bank": 0, "contact": 0, "personal": 0, "documents": 0, "education": 0, "additional": 0, "compliance": 0}	f	\N	\N	f	0	\N	\N	f	active	\N	\N	\N
e22eceda-3e4b-4af3-b4ba-d5f2d5fb89c3	\N	EMP-2025-0001	Adis	User	adis5453@gmail.com	$2b$10$lR5vkJMcDAStSg2GFifmZOCroOAvLr0d2H6D1j3RbvE4hrvK19ABi	4	\N	\N	\N	\N	\N	\N	2025-12-17	\N	Full-Time	terminated	f	\N	\N	\N	2025-12-17 16:09:23.475129	2025-12-18 05:03:44.697979	\N	\N	\N	\N	\N	\N	\N	\N	\N	Indian	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	new	t	\N	\N	\N	\N	\N	savings	bank_transfer	INR	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	{"bank": 0, "contact": 0, "personal": 0, "documents": 0, "education": 0, "additional": 0, "compliance": 0}	f	\N	\N	f	0	\N	\N	f	active	\N	\N	\N
f9cbfd6e-8f4b-4eaf-a3cd-1bfe76e6e018	\N	EMP-TEST-1765965369479	Rajesh	Sharma	rajesh.sharma.test1765965369479@company.com	\N	1	2bb7dfb7-f937-4bca-825d-37d09bd466f2	\N	\N	\N	9876543210	1990-05-15	2025-01-01	\N	Full-Time	terminated	f	\N	\N	\N	2025-12-17 15:26:09.508	2025-12-18 05:03:47.435181	\N	\N	\N	\N	Kumar	\N	Male	Married	O+	Indian	\N	\N	ABCDE2279F	123456789012	123456789123	f	\N	1234567890	MH/BOM/12345/001234	\N	new	t	State Bank of India	12345678901234	SBIN0001234	Mumbai Main	Rajesh Kumar Sharma	savings	bank_transfer	INR	30000.00	12000.00	8000.00	50000.00	45000.00	eab43aaa-a83d-4637-abdc-ff3a6cdad78d	0	\N	\N	\N	{"bank": 0, "contact": 0, "personal": 0, "documents": 0, "education": 0, "additional": 0, "compliance": 0}	f	\N	\N	f	0	\N	\N	f	active	\N	\N	\N
98ac06d8-75e8-4306-be42-6e8626d8e5db	be83f526-eccc-4cd6-a8a2-c8639ca33539	EMP001	Super	Admin	admin@arisehrm.com	$2b$10$oHBjBmlOJi6rye2KX5wUrONPgN1iomb0GAyKzAicBsANFEVVqXnte	1	2bb7dfb7-f937-4bca-825d-37d09bd466f2	e0f84f3c-6f7c-4ebf-b78e-c01a367c53b1	\N	\N		\N	\N	\N	full_time	active	t	\N	{"theme": "light", "language": "en", "timezone": "UTC", "dateFormat": "MM/DD/YYYY", "smsNotifications": false, "pushNotifications": true, "emailNotifications": true, "weekendNotifications": false}	\N	2025-12-12 01:48:20.339111	2025-12-13 14:09:26.069366	\N	EMP001	\N	\N	\N	\N	\N	\N	\N	Indian	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	new	t	\N	\N	\N	\N	\N	savings	bank_transfer	INR	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	{"bank": 0, "contact": 0, "personal": 0, "documents": 0, "education": 0, "additional": 0, "compliance": 0}	f	\N	\N	f	0	2026-01-13 16:22:34.93561	\N	f	active	\N	\N	\N
\.


--
-- TOC entry 5743 (class 0 OID 17846)
-- Dependencies: 233
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, session_token, device_info, ip_address, is_active, expires_at, created_at, last_activity) FROM stdin;
\.


--
-- TOC entry 5737 (class 0 OID 17735)
-- Dependencies: 227
-- Data for Name: user_themes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_themes (id, user_id, theme, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5786 (class 0 OID 19555)
-- Dependencies: 276
-- Data for Name: wfh_policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wfh_policies (id, name, max_days_per_week, max_days_per_month, requires_approval, allowed_roles, allowed_departments, min_notice_days, is_active, created_at) FROM stdin;
1	Default WFH Policy	2	8	t	\N	\N	1	t	2025-12-18 04:43:38.325433
\.


--
-- TOC entry 5781 (class 0 OID 19480)
-- Dependencies: 271
-- Data for Name: wfh_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wfh_requests (id, employee_id, start_date, end_date, reason, work_type, status, approved_by, approved_at, rejection_reason, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5851 (class 0 OID 0)
-- Dependencies: 277
-- Name: announcement_reads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcement_reads_id_seq', 1, false);


--
-- TOC entry 5852 (class 0 OID 0)
-- Dependencies: 269
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, false);


--
-- TOC entry 5853 (class 0 OID 0)
-- Dependencies: 281
-- Name: attendance_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_records_id_seq', 1, false);


--
-- TOC entry 5854 (class 0 OID 0)
-- Dependencies: 289
-- Name: benefit_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.benefit_plans_id_seq', 1, false);


--
-- TOC entry 5855 (class 0 OID 0)
-- Dependencies: 268
-- Name: candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidates_id_seq', 1, false);


--
-- TOC entry 5856 (class 0 OID 0)
-- Dependencies: 260
-- Name: compliance_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compliance_items_id_seq', 1, false);


--
-- TOC entry 5857 (class 0 OID 0)
-- Dependencies: 262
-- Name: conversation_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversation_participants_id_seq', 1, false);


--
-- TOC entry 5858 (class 0 OID 0)
-- Dependencies: 253
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversations_id_seq', 1, false);


--
-- TOC entry 5859 (class 0 OID 0)
-- Dependencies: 223
-- Name: departments_item_order_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_item_order_seq', 16, true);


--
-- TOC entry 5860 (class 0 OID 0)
-- Dependencies: 299
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- TOC entry 5861 (class 0 OID 0)
-- Dependencies: 294
-- Name: employee_benefits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_benefits_id_seq', 1, false);


--
-- TOC entry 5862 (class 0 OID 0)
-- Dependencies: 279
-- Name: employee_compliance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_compliance_id_seq', 1, false);


--
-- TOC entry 5863 (class 0 OID 0)
-- Dependencies: 250
-- Name: expense_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expense_categories_id_seq', 7, true);


--
-- TOC entry 5864 (class 0 OID 0)
-- Dependencies: 257
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- TOC entry 5865 (class 0 OID 0)
-- Dependencies: 273
-- Name: interviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interviews_id_seq', 1, false);


--
-- TOC entry 5866 (class 0 OID 0)
-- Dependencies: 259
-- Name: job_positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_positions_id_seq', 1, false);


--
-- TOC entry 5867 (class 0 OID 0)
-- Dependencies: 265
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- TOC entry 5868 (class 0 OID 0)
-- Dependencies: 283
-- Name: office_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.office_locations_id_seq', 1, true);


--
-- TOC entry 5869 (class 0 OID 0)
-- Dependencies: 296
-- Name: onboarding_processes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.onboarding_processes_id_seq', 1, false);


--
-- TOC entry 5870 (class 0 OID 0)
-- Dependencies: 291
-- Name: onboarding_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.onboarding_templates_id_seq', 1, false);


--
-- TOC entry 5871 (class 0 OID 0)
-- Dependencies: 287
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 13, true);


--
-- TOC entry 5872 (class 0 OID 0)
-- Dependencies: 221
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 16, true);


--
-- TOC entry 5873 (class 0 OID 0)
-- Dependencies: 293
-- Name: salary_components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.salary_components_id_seq', 1, false);


--
-- TOC entry 5874 (class 0 OID 0)
-- Dependencies: 249
-- Name: training_courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.training_courses_id_seq', 1, false);


--
-- TOC entry 5875 (class 0 OID 0)
-- Dependencies: 255
-- Name: training_enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.training_enrollments_id_seq', 1, false);


--
-- TOC entry 5876 (class 0 OID 0)
-- Dependencies: 275
-- Name: wfh_policies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wfh_policies_id_seq', 1, true);


--
-- TOC entry 5877 (class 0 OID 0)
-- Dependencies: 267
-- Name: wfh_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wfh_requests_id_seq', 1, false);


--
-- TOC entry 5464 (class 2606 OID 19583)
-- Name: announcement_reads announcement_reads_announcement_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_user_id_key UNIQUE (announcement_id, user_id);


--
-- TOC entry 5466 (class 2606 OID 19581)
-- Name: announcement_reads announcement_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_pkey PRIMARY KEY (id);


--
-- TOC entry 5458 (class 2606 OID 19528)
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- TOC entry 5472 (class 2606 OID 19662)
-- Name: attendance_records attendance_records_employee_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_employee_id_date_key UNIQUE (employee_id, date);


--
-- TOC entry 5474 (class 2606 OID 19660)
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- TOC entry 5385 (class 2606 OID 17840)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5488 (class 2606 OID 20139)
-- Name: benefit_plans benefit_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.benefit_plans
    ADD CONSTRAINT benefit_plans_pkey PRIMARY KEY (id);


--
-- TOC entry 5454 (class 2606 OID 19486)
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- TOC entry 5343 (class 2606 OID 17314)
-- Name: clock_locations clock_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clock_locations
    ADD CONSTRAINT clock_locations_pkey PRIMARY KEY (id);


--
-- TOC entry 5502 (class 2606 OID 20450)
-- Name: competency_ratings competency_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competency_ratings
    ADD CONSTRAINT competency_ratings_pkey PRIMARY KEY (id);


--
-- TOC entry 5450 (class 2606 OID 19424)
-- Name: compliance_items compliance_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compliance_items
    ADD CONSTRAINT compliance_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5446 (class 2606 OID 19392)
-- Name: conversation_participants conversation_participants_conversation_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id);


--
-- TOC entry 5448 (class 2606 OID 19381)
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- TOC entry 5436 (class 2606 OID 19335)
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- TOC entry 5350 (class 2606 OID 17672)
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- TOC entry 5352 (class 2606 OID 17670)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 5500 (class 2606 OID 20417)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 5496 (class 2606 OID 20225)
-- Name: employee_benefits employee_benefits_employee_id_benefit_plan_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_benefits
    ADD CONSTRAINT employee_benefits_employee_id_benefit_plan_id_key UNIQUE (employee_id, benefit_plan_id);


--
-- TOC entry 5498 (class 2606 OID 20223)
-- Name: employee_benefits employee_benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_benefits
    ADD CONSTRAINT employee_benefits_pkey PRIMARY KEY (id);


--
-- TOC entry 5468 (class 2606 OID 19612)
-- Name: employee_compliance employee_compliance_employee_id_compliance_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_compliance
    ADD CONSTRAINT employee_compliance_employee_id_compliance_item_id_key UNIQUE (employee_id, compliance_item_id);


--
-- TOC entry 5470 (class 2606 OID 19610)
-- Name: employee_compliance employee_compliance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_compliance
    ADD CONSTRAINT employee_compliance_pkey PRIMARY KEY (id);


--
-- TOC entry 5399 (class 2606 OID 17942)
-- Name: employee_leave_balances employee_leave_balances_employee_id_leave_type_id_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_employee_id_leave_type_id_year_key UNIQUE (employee_id, leave_type_id, year);


--
-- TOC entry 5401 (class 2606 OID 17940)
-- Name: employee_leave_balances employee_leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 5341 (class 2606 OID 17280)
-- Name: employee_teams employee_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_teams
    ADD CONSTRAINT employee_teams_pkey PRIMARY KEY (id);


--
-- TOC entry 5434 (class 2606 OID 19299)
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5442 (class 2606 OID 19336)
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- TOC entry 5391 (class 2606 OID 17869)
-- Name: failed_login_attempts failed_login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_login_attempts
    ADD CONSTRAINT failed_login_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 5460 (class 2606 OID 19527)
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5395 (class 2606 OID 17900)
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);


--
-- TOC entry 5444 (class 2606 OID 19416)
-- Name: job_positions job_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_pkey PRIMARY KEY (id);


--
-- TOC entry 5393 (class 2606 OID 17882)
-- Name: job_postings job_postings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_pkey PRIMARY KEY (id);


--
-- TOC entry 5430 (class 2606 OID 18173)
-- Name: leave_audit_log leave_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_audit_log
    ADD CONSTRAINT leave_audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5381 (class 2606 OID 17786)
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 5376 (class 2606 OID 17775)
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5452 (class 2606 OID 19430)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 5383 (class 2606 OID 17826)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5476 (class 2606 OID 19685)
-- Name: office_locations office_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_locations
    ADD CONSTRAINT office_locations_pkey PRIMARY KEY (id);


--
-- TOC entry 5494 (class 2606 OID 20197)
-- Name: onboarding_processes onboarding_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_processes
    ADD CONSTRAINT onboarding_processes_pkey PRIMARY KEY (id);


--
-- TOC entry 5397 (class 2606 OID 17917)
-- Name: onboarding_tasks onboarding_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_tasks
    ADD CONSTRAINT onboarding_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 5490 (class 2606 OID 20152)
-- Name: onboarding_templates onboarding_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_templates
    ADD CONSTRAINT onboarding_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 5403 (class 2606 OID 17966)
-- Name: payroll_records payroll_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_records
    ADD CONSTRAINT payroll_records_pkey PRIMARY KEY (id);


--
-- TOC entry 5405 (class 2606 OID 17984)
-- Name: performance_goals performance_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_pkey PRIMARY KEY (id);


--
-- TOC entry 5409 (class 2606 OID 18016)
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 5407 (class 2606 OID 17999)
-- Name: performance_reviews performance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5354 (class 2606 OID 17685)
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- TOC entry 5478 (class 2606 OID 19858)
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- TOC entry 5480 (class 2606 OID 19860)
-- Name: project_members project_members_project_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_project_id_employee_id_key UNIQUE (project_id, employee_id);


--
-- TOC entry 5413 (class 2606 OID 18074)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 5484 (class 2606 OID 20116)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 5486 (class 2606 OID 20118)
-- Name: refresh_tokens refresh_tokens_token_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_id_key UNIQUE (token_id);


--
-- TOC entry 5419 (class 2606 OID 18117)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5421 (class 2606 OID 18119)
-- Name: role_permissions role_permissions_role_id_permission_key_scope_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_key_scope_key UNIQUE (role_id, permission_key, scope);


--
-- TOC entry 5346 (class 2606 OID 17660)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 5348 (class 2606 OID 17658)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5492 (class 2606 OID 20179)
-- Name: salary_components salary_components_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_components
    ADD CONSTRAINT salary_components_pkey PRIMARY KEY (id);


--
-- TOC entry 5423 (class 2606 OID 18143)
-- Name: shifts shifts_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_code_key UNIQUE (code);


--
-- TOC entry 5425 (class 2606 OID 18141)
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- TOC entry 5415 (class 2606 OID 18089)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- TOC entry 5411 (class 2606 OID 18042)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 5432 (class 2606 OID 19287)
-- Name: training_courses training_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_courses
    ADD CONSTRAINT training_courses_pkey PRIMARY KEY (id);


--
-- TOC entry 5438 (class 2606 OID 19330)
-- Name: training_enrollments training_enrollments_course_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_enrollments
    ADD CONSTRAINT training_enrollments_course_id_employee_id_key UNIQUE (course_id, employee_id);


--
-- TOC entry 5440 (class 2606 OID 19320)
-- Name: training_enrollments training_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_enrollments
    ADD CONSTRAINT training_enrollments_pkey PRIMARY KEY (id);


--
-- TOC entry 5374 (class 2606 OID 17760)
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 5360 (class 2606 OID 17705)
-- Name: user_profiles user_profiles_auth_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_auth_user_id_key UNIQUE (auth_user_id);


--
-- TOC entry 5362 (class 2606 OID 17709)
-- Name: user_profiles user_profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_email_key UNIQUE (email);


--
-- TOC entry 5364 (class 2606 OID 18081)
-- Name: user_profiles user_profiles_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_employee_code_key UNIQUE (employee_code);


--
-- TOC entry 5366 (class 2606 OID 17707)
-- Name: user_profiles user_profiles_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_employee_id_key UNIQUE (employee_id);


--
-- TOC entry 5368 (class 2606 OID 18146)
-- Name: user_profiles user_profiles_pan_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pan_number_key UNIQUE (pan_number);


--
-- TOC entry 5370 (class 2606 OID 17703)
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5387 (class 2606 OID 17855)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5389 (class 2606 OID 17857)
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- TOC entry 5372 (class 2606 OID 17743)
-- Name: user_themes user_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_themes
    ADD CONSTRAINT user_themes_pkey PRIMARY KEY (id);


--
-- TOC entry 5462 (class 2606 OID 19568)
-- Name: wfh_policies wfh_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfh_policies
    ADD CONSTRAINT wfh_policies_pkey PRIMARY KEY (id);


--
-- TOC entry 5456 (class 2606 OID 19524)
-- Name: wfh_requests wfh_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfh_requests
    ADD CONSTRAINT wfh_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 5426 (class 1259 OID 18186)
-- Name: idx_leave_audit_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_audit_created ON public.leave_audit_log USING btree (created_at DESC);


--
-- TOC entry 5427 (class 1259 OID 18185)
-- Name: idx_leave_audit_performer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_audit_performer ON public.leave_audit_log USING btree (performed_by);


--
-- TOC entry 5428 (class 1259 OID 18184)
-- Name: idx_leave_audit_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_audit_request ON public.leave_audit_log USING btree (leave_request_id);


--
-- TOC entry 5377 (class 1259 OID 18163)
-- Name: idx_leave_requests_cancelled_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_cancelled_by ON public.leave_requests USING btree (cancelled_by);


--
-- TOC entry 5378 (class 1259 OID 18098)
-- Name: idx_leave_requests_reviewed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_reviewed_by ON public.leave_requests USING btree (reviewed_by);


--
-- TOC entry 5379 (class 1259 OID 18164)
-- Name: idx_leave_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_status ON public.leave_requests USING btree (status);


--
-- TOC entry 5355 (class 1259 OID 18189)
-- Name: idx_profile_completion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profile_completion ON public.user_profiles USING btree (profile_completion_percentage);


--
-- TOC entry 5481 (class 1259 OID 20125)
-- Name: idx_refresh_tokens_token_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_token_id ON public.refresh_tokens USING btree (token_id);


--
-- TOC entry 5482 (class 1259 OID 20124)
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- TOC entry 5416 (class 1259 OID 18126)
-- Name: idx_role_permissions_permission_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_permission_key ON public.role_permissions USING btree (permission_key);


--
-- TOC entry 5417 (class 1259 OID 18125)
-- Name: idx_role_permissions_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING btree (role_id);


--
-- TOC entry 5344 (class 1259 OID 18127)
-- Name: idx_roles_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_level ON public.roles USING btree (level);


--
-- TOC entry 5356 (class 1259 OID 18097)
-- Name: idx_user_profiles_manager_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_manager_id ON public.user_profiles USING btree (manager_id);


--
-- TOC entry 5357 (class 1259 OID 18128)
-- Name: idx_user_profiles_manager_id_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_manager_id_active ON public.user_profiles USING btree (manager_id) WHERE (is_active = true);


--
-- TOC entry 5358 (class 1259 OID 18096)
-- Name: idx_user_profiles_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_role_id ON public.user_profiles USING btree (role_id);


--
-- TOC entry 5581 (class 2620 OID 18106)
-- Name: leave_requests check_leave_overlap; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER check_leave_overlap BEFORE INSERT OR UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.check_overlapping_leaves();


--
-- TOC entry 5582 (class 2620 OID 18104)
-- Name: leave_requests leave_balance_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER leave_balance_trigger AFTER INSERT OR UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_leave_balance();


--
-- TOC entry 5561 (class 2606 OID 19584)
-- Name: announcement_reads announcement_reads_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;


--
-- TOC entry 5562 (class 2606 OID 19589)
-- Name: announcement_reads announcement_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5558 (class 2606 OID 19569)
-- Name: announcements announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5566 (class 2606 OID 19663)
-- Name: attendance_records attendance_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5567 (class 2606 OID 19668)
-- Name: attendance_records attendance_records_wfh_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_wfh_request_id_fkey FOREIGN KEY (wfh_request_id) REFERENCES public.wfh_requests(id);


--
-- TOC entry 5519 (class 2606 OID 17841)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5555 (class 2606 OID 19489)
-- Name: candidates candidates_job_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_job_position_id_fkey FOREIGN KEY (job_position_id) REFERENCES public.job_positions(id);


--
-- TOC entry 5550 (class 2606 OID 19594)
-- Name: compliance_items compliance_items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compliance_items
    ADD CONSTRAINT compliance_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5551 (class 2606 OID 19539)
-- Name: compliance_items compliance_items_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compliance_items
    ADD CONSTRAINT compliance_items_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 5548 (class 2606 OID 19393)
-- Name: conversation_participants conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- TOC entry 5549 (class 2606 OID 19403)
-- Name: conversation_participants conversation_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5540 (class 2606 OID 19362)
-- Name: conversations conversations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5503 (class 2606 OID 17673)
-- Name: departments departments_parent_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_department_id_fkey FOREIGN KEY (parent_department_id) REFERENCES public.departments(id);


--
-- TOC entry 5579 (class 2606 OID 20423)
-- Name: documents documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5580 (class 2606 OID 20418)
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5577 (class 2606 OID 20236)
-- Name: employee_benefits employee_benefits_benefit_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_benefits
    ADD CONSTRAINT employee_benefits_benefit_plan_id_fkey FOREIGN KEY (benefit_plan_id) REFERENCES public.benefit_plans(id);


--
-- TOC entry 5578 (class 2606 OID 20229)
-- Name: employee_benefits employee_benefits_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_benefits
    ADD CONSTRAINT employee_benefits_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 5563 (class 2606 OID 19618)
-- Name: employee_compliance employee_compliance_compliance_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_compliance
    ADD CONSTRAINT employee_compliance_compliance_item_id_fkey FOREIGN KEY (compliance_item_id) REFERENCES public.compliance_items(id) ON DELETE CASCADE;


--
-- TOC entry 5564 (class 2606 OID 19613)
-- Name: employee_compliance employee_compliance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_compliance
    ADD CONSTRAINT employee_compliance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5565 (class 2606 OID 19623)
-- Name: employee_compliance employee_compliance_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_compliance
    ADD CONSTRAINT employee_compliance_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5525 (class 2606 OID 17943)
-- Name: employee_leave_balances employee_leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5526 (class 2606 OID 17948)
-- Name: employee_leave_balances employee_leave_balances_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- TOC entry 5543 (class 2606 OID 19345)
-- Name: expenses expenses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);


--
-- TOC entry 5544 (class 2606 OID 19339)
-- Name: expenses expenses_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5545 (class 2606 OID 19350)
-- Name: expenses expenses_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5504 (class 2606 OID 17730)
-- Name: departments fk_manager; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5559 (class 2606 OID 19529)
-- Name: interviews interviews_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- TOC entry 5560 (class 2606 OID 19534)
-- Name: interviews interviews_interviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_interviewer_id_fkey FOREIGN KEY (interviewer_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5522 (class 2606 OID 17901)
-- Name: job_applications job_applications_job_posting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_job_posting_id_fkey FOREIGN KEY (job_posting_id) REFERENCES public.job_postings(id) ON DELETE CASCADE;


--
-- TOC entry 5546 (class 2606 OID 19456)
-- Name: job_positions job_positions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5547 (class 2606 OID 19426)
-- Name: job_positions job_positions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 5521 (class 2606 OID 17883)
-- Name: job_postings job_postings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5538 (class 2606 OID 18174)
-- Name: leave_audit_log leave_audit_log_leave_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_audit_log
    ADD CONSTRAINT leave_audit_log_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5539 (class 2606 OID 18179)
-- Name: leave_audit_log leave_audit_log_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_audit_log
    ADD CONSTRAINT leave_audit_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5514 (class 2606 OID 18158)
-- Name: leave_requests leave_requests_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5515 (class 2606 OID 17787)
-- Name: leave_requests leave_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5516 (class 2606 OID 17792)
-- Name: leave_requests leave_requests_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- TOC entry 5517 (class 2606 OID 17797)
-- Name: leave_requests leave_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5552 (class 2606 OID 19436)
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- TOC entry 5553 (class 2606 OID 19446)
-- Name: messages messages_reply_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.messages(id);


--
-- TOC entry 5554 (class 2606 OID 19441)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5518 (class 2606 OID 17827)
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5574 (class 2606 OID 20216)
-- Name: onboarding_processes onboarding_processes_assigned_buddy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_processes
    ADD CONSTRAINT onboarding_processes_assigned_buddy_id_fkey FOREIGN KEY (assigned_buddy_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5575 (class 2606 OID 20205)
-- Name: onboarding_processes onboarding_processes_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_processes
    ADD CONSTRAINT onboarding_processes_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 5576 (class 2606 OID 20211)
-- Name: onboarding_processes onboarding_processes_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_processes
    ADD CONSTRAINT onboarding_processes_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.onboarding_templates(id);


--
-- TOC entry 5523 (class 2606 OID 17923)
-- Name: onboarding_tasks onboarding_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_tasks
    ADD CONSTRAINT onboarding_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.user_profiles(id);


--
-- TOC entry 5524 (class 2606 OID 17918)
-- Name: onboarding_tasks onboarding_tasks_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_tasks
    ADD CONSTRAINT onboarding_tasks_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5571 (class 2606 OID 20163)
-- Name: onboarding_templates onboarding_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_templates
    ADD CONSTRAINT onboarding_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5572 (class 2606 OID 20153)
-- Name: onboarding_templates onboarding_templates_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_templates
    ADD CONSTRAINT onboarding_templates_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 5573 (class 2606 OID 20158)
-- Name: onboarding_templates onboarding_templates_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_templates
    ADD CONSTRAINT onboarding_templates_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id);


--
-- TOC entry 5527 (class 2606 OID 17967)
-- Name: payroll_records payroll_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_records
    ADD CONSTRAINT payroll_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5528 (class 2606 OID 20451)
-- Name: performance_goals performance_goals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5529 (class 2606 OID 17985)
-- Name: performance_goals performance_goals_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5532 (class 2606 OID 18017)
-- Name: performance_metrics performance_metrics_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5530 (class 2606 OID 18000)
-- Name: performance_reviews performance_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5531 (class 2606 OID 18005)
-- Name: performance_reviews performance_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5505 (class 2606 OID 17686)
-- Name: positions positions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 5568 (class 2606 OID 19866)
-- Name: project_members project_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 5569 (class 2606 OID 19861)
-- Name: project_members project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5536 (class 2606 OID 18075)
-- Name: projects projects_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- TOC entry 5570 (class 2606 OID 20119)
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 5537 (class 2606 OID 18120)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5533 (class 2606 OID 18043)
-- Name: teams teams_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 5534 (class 2606 OID 18053)
-- Name: teams teams_parent_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_parent_team_id_fkey FOREIGN KEY (parent_team_id) REFERENCES public.teams(id);


--
-- TOC entry 5535 (class 2606 OID 18048)
-- Name: teams teams_team_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_team_lead_id_fkey FOREIGN KEY (team_lead_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5541 (class 2606 OID 19332)
-- Name: training_enrollments training_enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_enrollments
    ADD CONSTRAINT training_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id);


--
-- TOC entry 5542 (class 2606 OID 19356)
-- Name: training_enrollments training_enrollments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_enrollments
    ADD CONSTRAINT training_enrollments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5513 (class 2606 OID 17761)
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 5506 (class 2606 OID 18153)
-- Name: user_profiles user_profiles_default_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_default_shift_id_fkey FOREIGN KEY (default_shift_id) REFERENCES public.shifts(id);


--
-- TOC entry 5507 (class 2606 OID 17715)
-- Name: user_profiles user_profiles_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 5508 (class 2606 OID 17725)
-- Name: user_profiles user_profiles_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.user_profiles(id);


--
-- TOC entry 5509 (class 2606 OID 17720)
-- Name: user_profiles user_profiles_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id);


--
-- TOC entry 5510 (class 2606 OID 17710)
-- Name: user_profiles user_profiles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 5511 (class 2606 OID 18058)
-- Name: user_profiles user_profiles_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- TOC entry 5520 (class 2606 OID 17858)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 5512 (class 2606 OID 17744)
-- Name: user_themes user_themes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_themes
    ADD CONSTRAINT user_themes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 5556 (class 2606 OID 19549)
-- Name: wfh_requests wfh_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfh_requests
    ADD CONSTRAINT wfh_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.user_profiles(id);


--
-- TOC entry 5557 (class 2606 OID 19541)
-- Name: wfh_requests wfh_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfh_requests
    ADD CONSTRAINT wfh_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.user_profiles(id);


-- Completed on 2026-02-01 04:02:43

--
-- PostgreSQL database dump complete
--

\unrestrict a7CtoNVMI36NSe5vQr1shkic7bLPJKDK5eEF4OHsecowYbpWFGvyaHd4q8xeavw

