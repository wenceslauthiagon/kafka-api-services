--
-- PostgreSQL database dump
--

-- Dumped from database version 11.5 (Debian 11.5-1+deb10u1)
-- Dumped by pg_dump version 11.5 (Debian 11.5-1+deb10u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: logging; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA logging;


--
-- Name: tablefunc; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;


--
-- Name: EXTENSION tablefunc; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION tablefunc IS 'functions that manipulate whole tables, including crosstab';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: enum_Campaigns_state; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Campaigns_state" AS ENUM (
    'test_pending',
    'test_in_progress',
    'test_notif_in_progress',
    'test_notif_end',
    'test_fcm_in_progres',
    'test_completed',
    'ready',
    'send_in_progress',
    'send_notif_in_progress',
    'send_notif_end',
    'send_fcm_in_progres',
    'sent'
);


--
-- Name: enum_Campaigns_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Campaigns_type" AS ENUM (
    'CAMPAIGN_MARKETING',
    'CAMPAIGN_GENERAL'
);


--
-- Name: enum_Onboardings_review_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Onboardings_review_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: enum_Users_notes_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Users_notes_type" AS ENUM (
    'note',
    'warning',
    'alert'
);


--
-- Name: enum_events_model; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_events_model AS ENUM (
    'verification',
    'document',
    'inquiry',
    'inquiry-session',
    'report/adverse-media',
    'report/email-address',
    'report/phone-number',
    'report/watchlist',
    'report/profile',
    'case'
);


--
-- Name: enum_events_state; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_events_state AS ENUM (
    'created',
    'started',
    'failed',
    'expired',
    'completed',
    'approved',
    'declined',
    'assigned',
    'resolved',
    'reopened',
    'matched',
    'errored',
    'processed',
    'submitted',
    'canceled',
    'passed',
    'ready',
    'marked-for-review'
);


--
-- Name: enum_inquiries_state; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_inquiries_state AS ENUM (
    'created',
    'started',
    'failed',
    'expired',
    'completed',
    'approved',
    'declined',
    'marked-for-review'
);


--
-- Name: _final_median(numeric[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._final_median(numeric[]) RETURNS numeric
    LANGUAGE sql IMMUTABLE
    AS $_$
   SELECT AVG(val)
   FROM (
     SELECT val
     FROM unnest($1) val
     ORDER BY 1
     LIMIT  2 - MOD(array_upper($1, 1), 2)
     OFFSET CEIL(array_upper($1, 1) / 2.0) - 1
   ) sub;
$_$;


--
-- Name: avg_price_method(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.avg_price_method(uid integer) RETURNS TABLE(abrl bigint, abtc bigint, apm bigint)
    LANGUAGE plpgsql
    AS $$
DECLARE
    item RECORD;
    fapm FLOAT8;
BEGIN
    abrl := 1;
    abtc := 0;
    apm  := 0;
    fapm := 0;
    FOR item IN
        SELECT * FROM (
          --- Get buy and sell conversion operations
          SELECT 
            conversion_type as type, created_at, fiat_amount, btc_amount
          FROM
            "Conversions"  
          WHERE 
            user_id=uid
          UNION 
          --- Get withdrawals
          SELECT
              'withdraw' as type, 
              created_at, 
              0 as fiat_amount, 
              value as btc_amount 
          FROM 
            "Operations"  
          WHERE 
            (owner_id = uid AND transaction_type_id=6)
          UNION
          --- Get deposits
          SELECT 
            'deposit' as type, 
            created_at,
            CAST(value/1e8::float * (usd_received_quote * btc_received_quote / 100) AS BIGINT) AS fiat_amount,
            value as btc_amount
          FROM 
            "Operations_btc_receives" 
          WHERE 
             beneficiary_id=uid AND btc_received_quote>0 AND usd_received_quote>0  
        ) x 
        ORDER BY created_at
    LOOP
        IF item.type = 'deposit' OR item.type = 'buy' 
        THEN
            abrl := abrl + item.fiat_amount * 100; -- *100 minimizes rounding errors
            abtc := abtc + item.btc_amount;
            fapm := abrl * 1e6::float8 / abtc;     -- 1e6 because of the *100 above, otherwise 1e8
        ELSE
            abtc := GREATEST(abtc - item.btc_amount,0);
            abrl := fapm * abtc / 1e6;             -- 1e6 because of the *100 above, otherwise 1e8
        END IF;
        -- RAISE NOTICE '% % % %', item,abrl,abtc,fapm;
        -- RAISE NOTICE '% % %', item.type, item.fiat_amount, item.btc_amount;
    END LOOP;
    abrl := abrl/100; -- because of *100 above, otherwise should be removed
    apm  := fapm;
    RETURN NEXT;
END; $$;


--
-- Name: change_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.change_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
 
        BEGIN
 
                IF      TG_OP = 'INSERT'
 
                THEN
 
                        INSERT INTO logging.t_history (tabname, schemaname, operation, new_val)
 
                                VALUES (TG_RELNAME, TG_TABLE_SCHEMA, TG_OP, row_to_json(NEW));
 
                        RETURN NEW;
 
                ELSIF   TG_OP = 'UPDATE'
 
                THEN
 
                        INSERT INTO logging.t_history (tabname, schemaname, operation, new_val, old_val)
 
                                VALUES (TG_RELNAME, TG_TABLE_SCHEMA, TG_OP,
 
                                        row_to_json(NEW), row_to_json(OLD));
 
                        RETURN NEW;
 
                ELSIF   TG_OP = 'DELETE'
 
                THEN
 
                        INSERT INTO logging.t_history (tabname, schemaname, operation, old_val)
 
                                VALUES (TG_RELNAME, TG_TABLE_SCHEMA, TG_OP, row_to_json(OLD));
 
                        RETURN OLD;
 
                END IF;
 
        END;
 
$$;


--
-- Name: is_male_ptbr(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_male_ptbr(fullname character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
 DECLARE
  name   VARCHAR(30);
  suffix VARCHAR(1);
  match  BOOLEAN;
  base   INTEGER;
BEGIN
  SELECT INTO name   regexp_replace(lower(ltrim(fullname,' ')),'\s.*$','');
  SELECT INTO name   translate(name, '??????????????????????????????????????????????', 'aeiouaeiouaoaeiooaeioucAEIOUAEIOUAOAEIOOAEIOUC');
  SELECT INTO suffix right(name,1);
  SELECT INTO base   CASE suffix WHEN 'a' THEN 0 WHEN 'e' THEN 0 ELSE 1 END;
  SELECT INTO match  CASE suffix
    WHEN 'a' THEN name ~ '(wilba|rba|vica|milca|meida|randa|uda|rrea|afa|^ha|cha|oha|apha|natha|^elia|rdelia|remia|aja|rja|aka|kka|^ala|gla|tila|vila|cola|orla|nama|yama|inima|jalma|nma|urma|zuma|gna|tanna|pna|moa|jara|tara|guara|beira|veira|kira|uira|pra|jura|mura|tura|asa|assa|ussa|^iata|onata|irata|leta|preta|jota|ista|aua|dua|hua|qua|ava|dva|^iva|silva|ova|rva|wa|naya|ouza)$'
    WHEN 'b' THEN name ~ '(inadab)$'
    WHEN 'c' THEN name ~ '(lic|tic)$'
    WHEN 'd' THEN name ~ '(edad|rid)$'
    WHEN 'e' THEN name ~ '(dae|jae|kae|oabe|ube|lace|dece|felice|urice|nce|bruce|dade|bede|^ide|^aide|taide|cide|alide|vide|alde|hilde|asenilde|nde|ode|lee|^ge|ege|oge|rge|uge|phe|bie|elie|llie|nie|je|eke|ike|olke|nke|oke|ske|uke|tale|uale|vale|cle|rdele|gele|tiele|nele|ssele|uele|hle|tabile|lile|rile|delle|ole|yle|ame|aeme|deme|ime|lme|rme|sme|ume|yme|phane|nane|ivane|alvane|elvane|gilvane|ovane|dene|ociene|tiene|gilene|uslene|^rene|vaine|waine|aldine|udine|mine|nine|oine|rtine|vanne|renne|hnne|ionne|cone|done|eone|fone|ecione|alcione|edione|hione|jone|rone|tone|rne|une|ioe|noe|epe|ipe|ope|ppe|ype|sare|bre|dre|bere|dere|fre|aire|hire|ore|rre|tre|dse|ese|geise|wilse|jose|rse|esse|usse|use|aete|waldete|iodete|sdete|aiete|nisete|ezete|nizete|dedite|uite|lte|ante|ente|arte|laerte|herte|ierte|reste|aue|gue|oue|aque|eque|aique|inique|rique|lque|oque|rque|esue|osue|ozue|tave|ive|ove|we|ye|^ze|aze|eze|uze)$'
    WHEN 'g' THEN name ~ '(eig|heng|mping|bong|jung)$'
    WHEN 'h' THEN name ~ '(kah|nah|rah|sh|beth|reth|seth|lizeth|rizeth|^edith|udith|ruth)$'
    WHEN 'i' THEN name ~ '(elai|anai|onai|abi|djaci|glaci|maraci|^iraci|diraci|loraci|ildeci|^neci|aici|arici|^elci|nci|oci|uci|kadi|leidi|ridi|hudi|hirlei|sirlei|^mei|rinei|ahi|^ji|iki|isuki|^yuki|gali|rali|ngeli|ieli|keli|leli|neli|seli|ueli|veli|zeli|ili|helli|kelli|arli|wanderli|hami|iemi|oemi|romi|tmi|ssumi|yumi|zumi|bani|iani|irani|sani|tani|luani|^vani|^ivani|ilvani|yani|^eni|ceni|geni|leni|ureni|^oseni|veni|zeni|cini|eini|lini|jenni|moni|uni|mari|veri|hri|aori|ayuri|lsi|rsi|gessi|roti|sti|retti|uetti|aui|iavi|^zi|zazi|suzi)$'
    WHEN 'k' THEN name ~ '(nak|lk)$'
    WHEN 'l' THEN name ~ '(mal|^bel|mabel|rabel|sabel|zabel|achel|thel|quel|gail|lenil|mell|ol)$'
    WHEN 'm' THEN name ~ '(liliam|riam|viam|miram|eem|uelem|mem|rem)$'
    WHEN 'n' THEN name ~ '(lilian|lillian|marian|irian|yrian|ivian|elan|rilan|usan|nivan|arivan|iryan|uzan|ohen|cken|elen|llen|men|aren|sten|rlein|kelin|velin|smin|rin|istin|rstin|^ann|ynn|haron|kun|sun|yn)$'
    WHEN 'o' THEN name ~ '(eicao|eco|mico|tico|^do|^ho|ocio|ako|eko|keiko|seiko|chiko|shiko|akiko|ukiko|miko|riko|tiko|oko|ruko|suko|yuko|izuko|uelo|stano|maurino|orro|jeto|mento|luo)$'
    WHEN 'p' THEN name ~ '(yip)$'
    WHEN 'r' THEN name ~ '(lar|lamar|zamar|ycimar|idimar|eudimar|olimar|lsimar|lzimar|erismar|edinar|iffer|ifer|ather|sther|esper|^ester|madair|eclair|olair|^nair|glacir|^nadir|ledir|^vanir|^evanir|^cenir|elenir|zenir|ionir|fior|eonor|racyr)$'
    WHEN 's' THEN name ~ '(unidas|katias|rces|cedes|oides|aildes|derdes|urdes|leudes|iudes|irges|lkes|geles|elenes|gnes|^ines|aines|^dines|rines|pes|deres|^mires|amires|ores|neves|hais|lais|tais|adis|alis|^elis|ilis|llis|ylis|ldenis|annis|ois|aris|^cris|^iris|miris|siris|doris|yris|isis|rtis|zis|heiros|dys|inys|rys)$'
    WHEN 't' THEN name ~ '(bet|ret|^edit|git|est|nett|itt)$'
    WHEN 'u' THEN name ~ '(^du|alu|^miharu|^su)$'
    WHEN 'y' THEN name ~ '(may|anay|ionay|lacy|^aracy|^iracy|doracy|vacy|aricy|oalcy|ncy|nercy|ucy|lady|hedy|hirley|raney|gy|ahy|rothy|taly|aely|ucely|gely|kely|nely|sely|uely|vely|zely|aily|rily|.elly|marly|mony|tamy|iany|irany|sany|uany|lvany|wany|geny|leny|ueny|anny|mary|imery|smery|iry|rory|isy|osy|usy|ty)$'
    ELSE false
  END;
  RETURN (base # CAST(match as INTEGER) ) = 1;
END; $_$;


--
-- Name: json_diff(jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.json_diff(l jsonb, r jsonb) RETURNS jsonb
    LANGUAGE sql
    AS $$
    SELECT jsonb_object_agg(a.key, a.value) FROM
        ( SELECT key, value FROM jsonb_each(l) ) a LEFT OUTER JOIN
        ( SELECT key, value FROM jsonb_each(r) ) b ON a.key = b.key
    WHERE a.value != b.value OR b.key IS NULL;
$$;


--
-- Name: prettify_proper_name(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prettify_proper_name(fullname character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $_$
 DECLARE
  name   VARCHAR(100);
  parts  VARCHAR(30)[];
  out    VARCHAR(100);
BEGIN
  SELECT INTO name   lower(btrim(fullname,' '));
  SELECT INTO parts  regexp_split_to_array(name,E'\\s+');
  SELECT INTO out    '';
  FOREACH name IN ARRAY parts
  LOOP 
     SELECT INTO name CASE WHEN name ~ '^(d[ao]s?|e|de|del)$' THEN name ELSE upper(left(name,1)) || lower(substr(name,2)) END;
     SELECT INTO name CASE WHEN NAME ~ E'^D\'' THEN lower(left(name,2)) || upper(substr(name,3,1)) || lower(substr(name,4)) ELSE name END;
     SELECT INTO out out || name || ' ';
  END LOOP;
  RETURN substr(out,1,length(out)-1);
END; $_$;


--
-- Name: update_doc_url_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_doc_url_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN

update "Users"
set
url_photo_cpf_front = case when new.front_document_url is not null then new.front_document_url else url_photo_cpf_front end,
url_photo_cpf_back  = case when new.back_document_url  is not null then new.back_document_url  else url_photo_cpf_back end,
url_selfie          = case when new.selfie_url         is not null then new.selfie_url         else url_selfie end
where 
id = new.user_id;

if new.email is not null and not exists (select * from "Users" u where u.email = new.email) 
then
update "Users" set email = new.email where id = new.user_id;
end if;

return new;
END;
$$;


--
-- Name: median(numeric); Type: AGGREGATE; Schema: public; Owner: -
--

CREATE AGGREGATE public.median(numeric) (
    SFUNC = array_append,
    STYPE = numeric[],
    INITCOND = '{}',
    FINALFUNC = public._final_median
);


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: t_history; Type: TABLE; Schema: logging; Owner: -
--

CREATE TABLE logging.t_history (
    id integer NOT NULL,
    tstamp timestamp without time zone DEFAULT now(),
    schemaname text,
    tabname text,
    operation text,
    who text DEFAULT CURRENT_USER,
    new_val json,
    old_val json
);


--
-- Name: t_history_id_seq; Type: SEQUENCE; Schema: logging; Owner: -
--

CREATE SEQUENCE logging.t_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: t_history_id_seq; Type: SEQUENCE OWNED BY; Schema: logging; Owner: -
--

ALTER SEQUENCE logging.t_history_id_seq OWNED BY logging.t_history.id;


--
-- Name: Addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Addresses" (
    id integer NOT NULL,
    "idAddressType" integer DEFAULT 1 NOT NULL,
    "zipCode" character varying(255) NOT NULL,
    street character varying(255) NOT NULL,
    number integer NOT NULL,
    complement character varying(255),
    neighborhood character varying(255) NOT NULL,
    city character varying(255) NOT NULL,
    "federativeUnit" character varying(255) NOT NULL,
    country character varying(255) NOT NULL,
    "mailingAddress" boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    user_id integer
);


--
-- Name: Addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Addresses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Addresses_id_seq" OWNED BY public."Addresses".id;


--
-- Name: Addresses_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Addresses_types" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Addresses_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Addresses_types_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Addresses_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Addresses_types_id_seq" OWNED BY public."Addresses_types".id;


--
-- Name: AdminBankingAccounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AdminBankingAccounts" (
    id uuid NOT NULL,
    document character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    branch_number character varying(255) NOT NULL,
    account_number character varying(255) NOT NULL,
    account_digit character varying(255) NOT NULL,
    account_type character varying(255) NOT NULL,
    bank_name character varying(255) NOT NULL,
    bank_code character varying(255) NOT NULL,
    description text NOT NULL,
    enabled boolean NOT NULL,
    created_by integer NOT NULL,
    updated_by integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: AdminBankingTransfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AdminBankingTransfers" (
    id uuid NOT NULL,
    source_id uuid NOT NULL,
    destination_id uuid NOT NULL,
    description text NOT NULL,
    value integer NOT NULL,
    transaction_id uuid,
    confirmed_at timestamp with time zone,
    failed_at timestamp with time zone,
    forwarded_at timestamp with time zone,
    failure_code character varying(255),
    failure_message character varying(255),
    created_by integer NOT NULL,
    updated_by integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: Admin_perms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Admin_perms" (
    id integer NOT NULL,
    section character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    controller character varying(255) NOT NULL,
    action character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    section_description character varying(255)
);


--
-- Name: Admin_perms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Admin_perms_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Admin_perms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Admin_perms_id_seq" OWNED BY public."Admin_perms".id;


--
-- Name: Admin_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Admin_roles" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Admin_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Admin_roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Admin_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Admin_roles_id_seq" OWNED BY public."Admin_roles".id;


--
-- Name: Admin_roles_perms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Admin_roles_perms" (
    id integer NOT NULL,
    role_id integer NOT NULL,
    perm_id integer NOT NULL
);


--
-- Name: Admin_roles_perms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Admin_roles_perms_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Admin_roles_perms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Admin_roles_perms_id_seq" OWNED BY public."Admin_roles_perms".id;


--
-- Name: Admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Admins" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role_id integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    exclude boolean DEFAULT true NOT NULL,
    reset_token character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    rr_class character varying(255) DEFAULT NULL::character varying
);


--
-- Name: Admins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Admins_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Admins_id_seq" OWNED BY public."Admins".id;


--
-- Name: AveragePrices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AveragePrices" (
    id integer NOT NULL,
    operation_type character varying(255) NOT NULL,
    brl_value bigint DEFAULT 0 NOT NULL,
    coin_value bigint DEFAULT 0 NOT NULL,
    brl_accumulated bigint DEFAULT 0 NOT NULL,
    coin_accumulated bigint DEFAULT 0 NOT NULL,
    avg_price bigint DEFAULT 0 NOT NULL,
    profit integer DEFAULT 0 NOT NULL,
    operation_id uuid,
    user_id integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: AveragePrices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."AveragePrices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: AveragePrices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."AveragePrices_id_seq" OWNED BY public."AveragePrices".id;


--
-- Name: BankingAccountContacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingAccountContacts" (
    id integer NOT NULL,
    banking_contact_id integer NOT NULL,
    branch_number character varying(255) NOT NULL,
    account_number character varying(255) NOT NULL,
    account_digit character varying(255) NOT NULL,
    bank_name character varying(255) NOT NULL,
    account_type character varying(255) NOT NULL,
    bank_code character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: BankingAccountContacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingAccountContacts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingAccountContacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingAccountContacts_id_seq" OWNED BY public."BankingAccountContacts".id;


--
-- Name: BankingCashInBillets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingCashInBillets" (
    id integer NOT NULL,
    bar_code character varying(255) NOT NULL,
    number character varying(255) NOT NULL,
    third_party_number character varying(255) NOT NULL,
    typeable_line character varying(255) NOT NULL,
    value bigint NOT NULL,
    base64_pdf bytea NOT NULL,
    due_date date NOT NULL,
    settled_date date,
    status character varying(255) DEFAULT 'PENDING'::character varying NOT NULL,
    user_id integer NOT NULL,
    operation_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: BankingCashInBillets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingCashInBillets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingCashInBillets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingCashInBillets_id_seq" OWNED BY public."BankingCashInBillets".id;


--
-- Name: BankingContacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingContacts" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    document_type character varying(255) NOT NULL,
    document character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    zro_id integer NOT NULL,
    telegram_id integer
);


--
-- Name: BankingContacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingContacts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingContacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingContacts_id_seq" OWNED BY public."BankingContacts".id;


--
-- Name: BankingDebits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingDebits" (
    id integer NOT NULL,
    operation_id uuid NOT NULL,
    nsu_origin character varying(255) DEFAULT ''::character varying,
    establishment_name character varying(255) DEFAULT ''::character varying,
    establishment_number character varying(255) DEFAULT ''::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    transaction_uuid character varying(255) DEFAULT ''::character varying
);


--
-- Name: BankingDebits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingDebits_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingDebits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingDebits_id_seq" OWNED BY public."BankingDebits".id;


--
-- Name: BankingDeposits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingDeposits" (
    id integer NOT NULL,
    operation_id uuid NOT NULL,
    our_number character varying(255) DEFAULT ''::character varying,
    document_number character varying(255) DEFAULT ''::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: BankingDeposits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingDeposits_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingDeposits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingDeposits_id_seq" OWNED BY public."BankingDeposits".id;


--
-- Name: BankingDocReceives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingDocReceives" (
    id integer NOT NULL,
    operation_id uuid NOT NULL,
    transaction_uuid character varying(255) DEFAULT ''::character varying,
    sender_name character varying(255) NOT NULL,
    sender_document character varying(255) NOT NULL,
    sender_bank_account character varying(255) NOT NULL,
    sender_bank_branch character varying(255) NOT NULL,
    sender_bank_code character varying(255) NOT NULL,
    sender_bank_name character varying(255) NOT NULL,
    bank_statement_id character varying(255) NOT NULL,
    notified_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: BankingDocReceives_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingDocReceives_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingDocReceives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingDocReceives_id_seq" OWNED BY public."BankingDocReceives".id;


--
-- Name: BankingP2PTransfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingP2PTransfers" (
    id integer NOT NULL,
    operation_id uuid NOT NULL,
    dock_transaction_code character varying(255) DEFAULT ''::character varying,
    dock_adjustment_id character varying(255) DEFAULT ''::character varying,
    dock_adjustment_destination_id character varying(255) DEFAULT ''::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: BankingP2PTransfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingP2PTransfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingP2PTransfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingP2PTransfers_id_seq" OWNED BY public."BankingP2PTransfers".id;


--
-- Name: BankingPaidBillets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingPaidBillets" (
    id integer NOT NULL,
    operation_id uuid NOT NULL,
    barcode character varying(255) DEFAULT ''::character varying,
    assignor character varying(255) DEFAULT ''::character varying,
    assignor_document character varying(255) DEFAULT ''::character varying,
    dock_adjustment_id character varying(255) DEFAULT ''::character varying,
    dock_transaction_code character varying(255) DEFAULT ''::character varying,
    dock_payment_confirmation_id character varying(255) DEFAULT ''::character varying,
    dock_status character varying(255) DEFAULT ''::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    "dueDate" timestamp with time zone,
    settled_date timestamp with time zone,
    typeable_line character varying(255),
    transaction_id_payment character varying(255),
    conciliation_status character varying(255) DEFAULT 'pending'::character varying,
    failure_message character varying(255),
    transaction_id uuid
);


--
-- Name: BankingPaidBillets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingPaidBillets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingPaidBillets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingPaidBillets_id_seq" OWNED BY public."BankingPaidBillets".id;


--
-- Name: BankingPendingCreditTransfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingPendingCreditTransfers" (
    id integer NOT NULL,
    operation_id uuid NOT NULL,
    user_id integer NOT NULL,
    wallet_account_id integer NOT NULL,
    pending_amount integer NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    reason character varying(255) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: BankingPendingCreditTransfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingPendingCreditTransfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingPendingCreditTransfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingPendingCreditTransfers_id_seq" OWNED BY public."BankingPendingCreditTransfers".id;


--
-- Name: BankingTedFailures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingTedFailures" (
    id integer NOT NULL,
    operation_id uuid NOT NULL,
    transaction_uuid character varying(255) DEFAULT ''::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    banking_ted_id integer,
    failure_code character varying(255),
    failure_message character varying(255)
);


--
-- Name: BankingTedFailures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingTedFailures_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingTedFailures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingTedFailures_id_seq" OWNED BY public."BankingTedFailures".id;


--
-- Name: BankingTedReceives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingTedReceives" (
    id integer NOT NULL,
    operation_id uuid NOT NULL,
    transaction_uuid character varying(255) DEFAULT ''::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    sender_name character varying(255),
    sender_document character varying(255),
    sender_bank_account character varying(255),
    sender_bank_branch character varying(255),
    sender_bank_code character varying(255),
    sender_bank_name character varying(255),
    bank_statement_id character varying(255),
    notified_at timestamp with time zone
);


--
-- Name: BankingTedReceives_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankingTedReceives_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankingTedReceives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankingTedReceives_id_seq" OWNED BY public."BankingTedReceives".id;


--
-- Name: BankingTedRedirections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingTedRedirections" (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    operation_id uuid NOT NULL,
    admin_id integer NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    statement_id character varying(255)
);


--
-- Name: BankingTeds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankingTeds" (
    id integer NOT NULL,
    operation_id uuid NOT NULL,
    beneficiary_bank_id character varying(255) DEFAULT ''::character varying NOT NULL,
    beneficiary_name character varying(255) DEFAULT ''::character varying NOT NULL,
    beneficiary_type character varying(255) DEFAULT ''::character varying NOT NULL,
    beneficiary_document character varying(255) DEFAULT ''::character varying NOT NULL,
    beneficiary_agency character varying(255) DEFAULT ''::character varying NOT NULL,
    beneficiary_account character varying(255) DEFAULT ''::character varying NOT NULL,
    beneficiary_account_digit character varying(255) DEFAULT ''::character varying NOT NULL,
    beneficiary_account_type character varying(255) DEFAULT ''::character varying NOT NULL,
    dock_uid character varying(255) DEFAULT ''::character varying,
    dock_transaction_code character varying(255) DEFAULT ''::character varying,
    dock_adjustment_id character varying(255) DEFAULT ''::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    beneficiary_bank_name character varying(255),
    transaction_id character varying(255),
    confirmed_at timestamp with time zone,
    failed_at timestamp with time zone,
    forwarded_at timestamp with time zone
);


--
-- Name: CampaignGroups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CampaignGroups" (
    id uuid NOT NULL,
    test boolean NOT NULL,
    query text NOT NULL,
    description character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Campaigns" (
    id uuid NOT NULL,
    title character varying(255) NOT NULL,
    type public."enum_Campaigns_type" NOT NULL,
    state public."enum_Campaigns_state" DEFAULT 'test_pending'::public."enum_Campaigns_state",
    body text NOT NULL,
    url text,
    success integer DEFAULT 0,
    failures integer DEFAULT 0,
    total integer DEFAULT 0,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    created_by integer NOT NULL,
    last_updated_by integer NOT NULL
);


--
-- Name: Campaigns_CampaignGroups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Campaigns_CampaignGroups" (
    campaign_id uuid NOT NULL,
    group_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Cards" (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    dock_card_id integer,
    status character varying(255) DEFAULT 'password_pending'::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_virtual boolean DEFAULT false,
    number character varying(255)
);


--
-- Name: Chainalysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Chainalysis" (
    id uuid NOT NULL,
    asset character varying(255) DEFAULT 'BTC'::character varying NOT NULL,
    risk_rating character varying(255) NOT NULL,
    cluster_name character varying(255) NOT NULL,
    cluster_category character varying(255) NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Chats" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    chat_id integer NOT NULL,
    state character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Chats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Chats_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Chats_id_seq" OWNED BY public."Chats".id;


--
-- Name: Contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Contacts" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    contact_id integer NOT NULL,
    state character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Contacts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Contacts_id_seq" OWNED BY public."Contacts".id;


--
-- Name: Conversions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Conversions" (
    id uuid NOT NULL,
    operation_id uuid NOT NULL,
    remittance_id uuid,
    conversion_type character varying(255) NOT NULL,
    usd_amount bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    client_name character varying(255),
    client_document character varying(255),
    btc_amount bigint,
    usd_quote bigint,
    user_id integer,
    btc_quote character varying(255),
    fiat_amount bigint,
    currency_spread_id integer,
    zro_spread_id integer,
    provider_id uuid,
    trade_id character varying(255)
);


--
-- Name: Operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Operations" (
    id uuid NOT NULL,
    emitter_id integer NOT NULL,
    receiver_id integer NOT NULL,
    owner_id integer NOT NULL,
    owner_wallet_id integer NOT NULL,
    owner_wallet_address character varying(255),
    beneficiary_id integer NOT NULL,
    beneficiary_wallet_id integer NOT NULL,
    beneficiary_wallet_address character varying(255),
    transaction_hash character varying(255),
    transaction_reg_tx text,
    transaction_type_id integer NOT NULL,
    currency_type_id integer NOT NULL,
    raw_value bigint,
    fee bigint,
    value bigint NOT NULL,
    description character varying(255) NOT NULL,
    emitter_chat_id integer,
    receiver_chat_id integer,
    emitter_chat_message_timestamp bigint,
    receiver_chat_message_timestamp bigint,
    chargeback uuid,
    state character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    operation_ref_id uuid,
    card_id character varying(255),
    reverted_at timestamp with time zone
);


--
-- Name: Transaction_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Transaction_types" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    tag character varying(255) NOT NULL,
    method character varying(255) DEFAULT 'A2B'::character varying NOT NULL,
    state character varying(255) DEFAULT 'active'::character varying NOT NULL,
    foreign_descr_in_str character varying(255),
    foreign_descr_out_str character varying(255)
);


--
-- Name: Convs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public."Convs" AS
 SELECT x.client_name,
    x.client_document,
    x.uid,
    x.type,
    x.tag,
    x.created_at,
    x.brl,
    x.btc,
    x.usd,
    x.brl_brc,
    x.provider_id,
    x.trade_id,
    x.operation_id
   FROM ( SELECT c.client_name,
            c.client_document,
            c.user_id AS uid,
            c.conversion_type AS type,
            tt.tag,
            c.created_at,
            round(((c.fiat_amount)::numeric / '100'::numeric), 2) AS brl,
            round(((c.btc_amount)::numeric / '100000000'::numeric), 8) AS btc,
            round(((c.usd_amount)::numeric / '100'::numeric), 2) AS usd,
            round((('1000000'::numeric * (c.fiat_amount)::numeric) / (c.btc_amount)::numeric), 2) AS brl_brc,
            c.provider_id,
            c.trade_id,
            c.operation_id
           FROM ((public."Conversions" c
             JOIN public."Operations" o ON ((c.operation_id = o.id)))
             JOIN public."Transaction_types" tt ON ((o.transaction_type_id = tt.id)))
          ORDER BY c.created_at DESC) x;


--
-- Name: CryptoBlocklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CryptoBlocklist" (
    id uuid NOT NULL,
    currency_id integer NOT NULL,
    address character varying(255) NOT NULL,
    notes character varying(255),
    props jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: Currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Currencies" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    symbol character varying(255) NOT NULL,
    symbol_align character varying(255) DEFAULT 'left'::character varying NOT NULL,
    tag character varying(255) NOT NULL,
    "decimal" integer NOT NULL,
    state character varying(255) DEFAULT 'active'::character varying NOT NULL
);


--
-- Name: Currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Currencies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Currencies_id_seq" OWNED BY public."Currencies".id;


--
-- Name: Global_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Global_limits" (
    id uuid NOT NULL,
    limit_type_id integer NOT NULL,
    daily_limit bigint NOT NULL,
    monthly_limit bigint NOT NULL,
    annual_limit bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    max_amount bigint,
    min_amount bigint
);


--
-- Name: Limit_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Limit_types" (
    id integer NOT NULL,
    tag character varying(255) NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    transaction_type_id integer,
    currency_id integer,
    description character varying(255)
);


--
-- Name: Limit_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Limit_types_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Limit_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Limit_types_id_seq" OWNED BY public."Limit_types".id;


--
-- Name: Notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notifications" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) DEFAULT ''::character varying NOT NULL,
    description character varying(255) DEFAULT ''::character varying NOT NULL,
    image character varying(255),
    type character varying(255) DEFAULT 'default'::character varying NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    campaign_id uuid,
    push_state character varying(255)
);


--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Notifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Notifications_id_seq" OWNED BY public."Notifications".id;


--
-- Name: Occupations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Occupations" (
    cod_cbo integer NOT NULL,
    cbo integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Onboarding_failures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Onboarding_failures" (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    onboarding_id uuid NOT NULL,
    full_name boolean DEFAULT false NOT NULL,
    mother_name boolean DEFAULT false NOT NULL,
    birth_date boolean DEFAULT false NOT NULL,
    selfie boolean DEFAULT false NOT NULL,
    front_document boolean DEFAULT false NOT NULL,
    back_document boolean DEFAULT false NOT NULL,
    facematch boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Onboardings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Onboardings" (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    address_id integer,
    full_name_status character varying(255) DEFAULT 'pending'::character varying,
    mother_name_status character varying(255) DEFAULT 'pending'::character varying,
    birth_date_status character varying(255) DEFAULT 'pending'::character varying,
    email character varying(255),
    federal_revenue_situation integer,
    nationality character varying(255),
    pep integer DEFAULT 2,
    pep_since character varying(255),
    occupation_cbo integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    discarded_at timestamp with time zone,
    front_document_url character varying(255),
    selfie_url character varying(255),
    back_document_url character varying(255),
    document_type character varying(255),
    status character varying(255) DEFAULT 'pending'::character varying,
    front_document_status character varying(255) DEFAULT 'pending'::character varying,
    selfie_status character varying(255) DEFAULT 'pending'::character varying,
    back_document_status character varying(255) DEFAULT 'pending'::character varying,
    topazio_account_number character varying(255),
    topazio_code_client character varying(255),
    topazio_branch_number character varying(255),
    rejected_reason character varying(255),
    rejected_reason_code character varying(255),
    facematch_status character varying(255) DEFAULT 'pending'::character varying,
    pin_status character varying(255) DEFAULT 'pending'::character varying,
    patrimony bigint,
    occupation_income bigint,
    cpf character varying(255),
    full_name character varying(255),
    mother_name character varying(255),
    birth_date character varying(255),
    review_assignee integer,
    review_reject_message character varying(255) DEFAULT NULL::character varying,
    review_processed boolean DEFAULT false,
    review_status public."enum_Onboardings_review_status"
);


--
-- Name: Onboardings_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public."Onboardings_view" AS
 SELECT o.created_at,
    o.updated_at,
    o.user_id,
    o.id,
    o.status,
    o.topazio_account_number,
    o.topazio_branch_number,
    o.front_document_status,
    o.selfie_status,
    o.back_document_status,
        CASE
            WHEN ((upper((o.rejected_reason)::text) ~~ '%LIST%'::text) OR (upper((o.rejected_reason)::text) ~~ '%PEP%'::text)) THEN '!!! SCALE TO COMPLAINCE !!!'::character varying
            ELSE o.rejected_reason
        END AS rejected_reason
   FROM public."Onboardings" o;


--
-- Name: Operations_bak; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Operations_bak" (
    id uuid,
    emitter_id integer,
    receiver_id integer,
    owner_id integer,
    owner_wallet_id integer,
    owner_wallet_address character varying(255),
    beneficiary_id integer,
    beneficiary_wallet_id integer,
    beneficiary_wallet_address character varying(255),
    transaction_hash character varying(255),
    transaction_reg_tx text,
    transaction_type_id integer,
    currency_type_id integer,
    raw_value bigint,
    fee bigint,
    value bigint,
    description character varying(255),
    emitter_chat_id integer,
    receiver_chat_id integer,
    emitter_chat_message_timestamp bigint,
    receiver_chat_message_timestamp bigint,
    chargeback uuid,
    state character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    operation_ref_id uuid,
    foreign_id bigint,
    reconciled_at timestamp with time zone
);


--
-- Name: Operations_btc_receives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Operations_btc_receives" (
    id uuid NOT NULL,
    beneficiary_wallet_bcoin_id character varying(255) NOT NULL,
    beneficiary_wallet_address character varying(255) NOT NULL,
    transaction_hash character varying(255) NOT NULL,
    transaction_reg_tx text NOT NULL,
    confirmations integer DEFAULT 1 NOT NULL,
    beneficiary_id integer NOT NULL,
    beneficiary_wallet_id integer NOT NULL,
    transaction_type_id integer NOT NULL,
    currency_type_id integer NOT NULL,
    value bigint NOT NULL,
    description character varying(255),
    state character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    usd_received_quote bigint DEFAULT 0 NOT NULL,
    btc_received_quote bigint DEFAULT 0 NOT NULL,
    usd_confirmed_quote bigint DEFAULT 0 NOT NULL,
    btc_confirmed_quote bigint DEFAULT 0 NOT NULL,
    user_fiat_amount bigint
);


--
-- Name: Prospects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Prospects" (
    id integer NOT NULL,
    cpf character varying(255) NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Prospects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Prospects_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Prospects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Prospects_id_seq" OWNED BY public."Prospects".id;


--
-- Name: Providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Providers" (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Referral_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Referral_rewards" (
    id integer NOT NULL,
    awarded_to integer NOT NULL,
    awarded_by integer NOT NULL,
    amount bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_operation_id uuid,
    operation_id uuid
);


--
-- Name: Referral_rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Referral_rewards_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Referral_rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Referral_rewards_id_seq" OWNED BY public."Referral_rewards".id;


--
-- Name: Remittances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Remittances" (
    id uuid NOT NULL,
    provider_id uuid,
    contract_number character varying(255),
    total_amount bigint NOT NULL,
    bitblue_amount bigint,
    result_amount bigint,
    status character varying(255) DEFAULT 'open'::character varying NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    type character varying(255),
    iof integer DEFAULT 38,
    vet_quote numeric(16,4) DEFAULT 0,
    contract_quote numeric(16,4) DEFAULT 0
);


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: SequelizeMetaUsers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMetaUsers" (
    name character varying(255) NOT NULL
);


--
-- Name: Settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Settings" (
    id integer NOT NULL,
    global_flags integer NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    default_virtual_card_validity integer DEFAULT 90 NOT NULL,
    spreads json DEFAULT '{"zro":{"buy":"0.02 0.01 0.005 0.005","sell":"0.02 0.01 0.005 0.005"},"b2c2":{"buy":"0.005 0.01 0.1 1","sell":"0.005 0.01 0.1 1"}}'::json NOT NULL
);


--
-- Name: Settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Settings_id_seq" OWNED BY public."Settings".id;


--
-- Name: Spread_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Spread_history" (
    id integer NOT NULL,
    provider character varying(255),
    buy character varying(255),
    sell character varying(255),
    note character varying(255),
    admin_id integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: Spread_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Spread_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Spread_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Spread_history_id_seq" OWNED BY public."Spread_history".id;


--
-- Name: Teds_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Teds_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Teds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Teds_id_seq" OWNED BY public."BankingTeds".id;


--
-- Name: Telegram_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Telegram_logs" (
    id integer NOT NULL,
    telegram_id integer NOT NULL,
    name character varying(255),
    message character varying(255) NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: Telegram_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Telegram_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Telegram_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Telegram_logs_id_seq" OWNED BY public."Telegram_logs".id;


--
-- Name: Transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Transaction_types_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Transaction_types_id_seq" OWNED BY public."Transaction_types".id;


--
-- Name: Wallet_account_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wallet_account_transactions" (
    id uuid NOT NULL,
    wallet_account_id integer NOT NULL,
    operation_id uuid NOT NULL,
    transaction_type character varying(255) NOT NULL,
    value bigint NOT NULL,
    updated_balance bigint NOT NULL,
    previous_balance bigint NOT NULL,
    state character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    foreign_id bigint,
    reconciled_at timestamp with time zone
);


--
-- Name: Transactions_operations; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public."Transactions_operations" AS
 SELECT "Wallet_account_transactions".id,
    "Wallet_account_transactions".wallet_account_id AS wid,
    "Wallet_account_transactions".operation_id,
    "Wallet_account_transactions".transaction_type AS tt,
    "Wallet_account_transactions".value,
    "Wallet_account_transactions".updated_balance AS new_balance,
    "Wallet_account_transactions".previous_balance AS old_balance,
    "Wallet_account_transactions".state AS tstate,
    "Operations".state AS ostate,
    "Wallet_account_transactions".created_at,
    "Wallet_account_transactions".updated_at,
    "Wallet_account_transactions".foreign_id AS fid,
    "Wallet_account_transactions".reconciled_at,
    "Operations".transaction_type_id AS ttid
   FROM (public."Wallet_account_transactions"
     JOIN public."Operations" ON (("Wallet_account_transactions".operation_id = "Operations".id)))
  ORDER BY "Wallet_account_transactions".updated_at;


--
-- Name: User_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User_history" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    admin_id integer,
    name_admin character varying(255),
    name_user character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    ip character varying(255) NOT NULL,
    description_txt character varying(255) NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: User_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."User_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: User_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."User_history_id_seq" OWNED BY public."User_history".id;


--
-- Name: User_limits_bak; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User_limits_bak" (
    id uuid,
    user_id integer,
    limit_type_id integer,
    daily_limit bigint,
    monthly_limit bigint,
    annual_limit bigint,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: User_telegram_ids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User_telegram_ids" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    telegram_id integer NOT NULL
);


--
-- Name: User_telegram_ids_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."User_telegram_ids_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: User_telegram_ids_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."User_telegram_ids_id_seq" OWNED BY public."User_telegram_ids".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    mother_name character varying(255),
    birth_date date,
    cpf character varying(255),
    genre character varying(255) DEFAULT 'N'::character varying,
    phone_number character varying(255) NOT NULL,
    email character varying(255),
    password character varying(255) NOT NULL,
    url_photo_cpf_front character varying(255),
    url_photo_cpf_back character varying(255),
    url_selfie character varying(255),
    pin character varying(255) NOT NULL,
    pin_has_created boolean DEFAULT false NOT NULL,
    invite_code character varying(255) NOT NULL,
    reset_token character varying(255),
    telegram_id integer,
    telegram_first_name character varying(255),
    telegram_last_name character varying(255),
    telegram_confirm_code integer NOT NULL,
    telegram_confirmed boolean DEFAULT false NOT NULL,
    onboarding_state character varying(255) DEFAULT 'incomplete'::character varying NOT NULL,
    id_business_source integer DEFAULT 1 NOT NULL,
    id_product integer DEFAULT 1 NOT NULL,
    due_date integer DEFAULT 10 NOT NULL,
    eula boolean DEFAULT false NOT NULL,
    state character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    bank_onboarding_state character varying(255) DEFAULT 'incomplete'::character varying NOT NULL,
    fcm_token character varying(255),
    document_type character varying(255),
    document_number character varying(255),
    document_issuing_date character varying(255),
    full_name character varying(255),
    local_flags integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true,
    wallet_account_code character varying(255) DEFAULT public.uuid_generate_v4() NOT NULL,
    referred_by integer,
    deleted_at timestamp with time zone,
    props jsonb,
    referral_code character varying(20),
    one_time_pin character varying(255),
    uuid uuid
);


--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: Users_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users_limits" (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    limit_type_id integer NOT NULL,
    daily_limit bigint NOT NULL,
    monthly_limit bigint NOT NULL,
    annual_limit bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    max_amount bigint,
    min_amount bigint
);


--
-- Name: Users_limits_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users_limits_history" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    limit_type_id integer NOT NULL,
    old_daily_limit bigint DEFAULT 0,
    old_monthly_limit bigint DEFAULT 0,
    old_annual_limit bigint DEFAULT 0,
    new_daily_limit bigint DEFAULT 0,
    new_monthly_limit bigint DEFAULT 0,
    new_annual_limit bigint DEFAULT 0,
    admin_id integer,
    note character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    old_min_amount bigint,
    old_max_amount bigint,
    new_min_amount bigint,
    new_max_amount bigint
);


--
-- Name: Users_limits_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Users_limits_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Users_limits_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Users_limits_history_id_seq" OWNED BY public."Users_limits_history".id;


--
-- Name: Users_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users_notes" (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    created_by integer NOT NULL,
    deleted_by integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    type public."enum_Users_notes_type" NOT NULL,
    text text NOT NULL
);


--
-- Name: Users_onboardings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users_onboardings" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    birth_date character varying(255) DEFAULT 'empty'::character varying NOT NULL,
    birth_date_comment character varying(255),
    cpf character varying(255) DEFAULT 'empty'::character varying NOT NULL,
    cpf_comment character varying(255),
    mother_name character varying(255) DEFAULT 'empty'::character varying NOT NULL,
    mother_name_comment character varying(255),
    address character varying(255) DEFAULT 'empty'::character varying NOT NULL,
    address_comment character varying(255),
    url_photo_cpf_front character varying(255) DEFAULT 'empty'::character varying NOT NULL,
    url_photo_cpf_front_comment character varying(255),
    url_photo_cpf_back character varying(255) DEFAULT 'empty'::character varying NOT NULL,
    url_photo_cpf_back_comment character varying(255),
    url_selfie character varying(255) DEFAULT 'empty'::character varying NOT NULL,
    url_selfie_comment character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    registration_id character varying(255)
);


--
-- Name: Users_onboardings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Users_onboardings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Users_onboardings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Users_onboardings_id_seq" OWNED BY public."Users_onboardings".id;


--
-- Name: Users_pin_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users_pin_attempts" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    one_time_pin_attempts integer DEFAULT 0 NOT NULL
);


--
-- Name: Users_pin_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Users_pin_attempts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Users_pin_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Users_pin_attempts_id_seq" OWNED BY public."Users_pin_attempts".id;


--
-- Name: Users_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users_settings" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    currency_id integer DEFAULT 1 NOT NULL,
    state character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Users_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Users_settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Users_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Users_settings_id_seq" OWNED BY public."Users_settings".id;


--
-- Name: Wallet_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wallet_accounts" (
    id integer NOT NULL,
    wallet_id integer NOT NULL,
    receive_address character varying(255),
    currency_id integer NOT NULL,
    balance bigint DEFAULT 0 NOT NULL,
    pending_amount bigint DEFAULT 0 NOT NULL,
    state character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    nested_address character varying(255),
    branch_number character varying(255),
    account_number character varying(255),
    account_id integer,
    dock_balance bigint DEFAULT 0 NOT NULL,
    last_reconciled_at timestamp with time zone,
    topazio_account_number character varying(255),
    topazio_code_client character varying(255),
    topazio_branch_number character varying(255),
    avg_price bigint DEFAULT 0 NOT NULL,
    accumulated_brl bigint DEFAULT 0 NOT NULL,
    accumulated_coin bigint DEFAULT 0 NOT NULL,
    migration_terms_accepted_at timestamp with time zone
);


--
-- Name: Wallet_accounts_20201231; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wallet_accounts_20201231" (
    id integer,
    wallet_id integer,
    receive_address character varying(255),
    currency_id integer,
    balance bigint,
    pending_amount bigint,
    state character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    nested_address character varying(255),
    branch_number character varying(255),
    account_number character varying(255),
    account_id integer,
    dock_balance bigint,
    last_reconciled_at timestamp with time zone,
    topazio_account_number character varying(255),
    topazio_code_client character varying(255),
    topazio_branch_number character varying(255),
    avg_price bigint,
    accumulated_brl bigint,
    accumulated_coin bigint,
    migration_terms_accepted_at timestamp with time zone
);


--
-- Name: Wallet_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Wallet_accounts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Wallet_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Wallet_accounts_id_seq" OWNED BY public."Wallet_accounts".id;


--
-- Name: Wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wallets" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    state character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: Wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Wallets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Wallets_id_seq" OWNED BY public."Wallets".id;


--
-- Name: Whitelists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Whitelists" (
    id integer NOT NULL,
    cpf character varying(255) NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name character varying(100)
);


--
-- Name: Whitelists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Whitelists_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Whitelists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Whitelists_id_seq" OWNED BY public."Whitelists".id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid NOT NULL,
    event_id character varying(255) NOT NULL,
    reference_id character varying(255),
    model public.enum_events_model NOT NULL,
    payload jsonb,
    state public.enum_events_state NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: export_gender; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.export_gender AS
 SELECT sum(y.male) AS masculino,
    sum(y.female) AS feminino
   FROM ( SELECT
                CASE
                    WHEN (public.is_male_ptbr(x.name) = true) THEN 1
                    ELSE 0
                END AS male,
                CASE
                    WHEN (public.is_male_ptbr(x.name) = false) THEN 1
                    ELSE 0
                END AS female
           FROM ( SELECT COALESCE("Users".full_name, "Users".name) AS name
                   FROM public."Users") x) y;


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiries (
    id uuid NOT NULL,
    inquiry_id character varying(255) NOT NULL,
    reference_id character varying(255),
    template character varying(255),
    document_front_photo_url character varying(255),
    document_back_photo_url character varying(255),
    selfie_left_photo_url character varying(255),
    selfie_center_photo_url character varying(255),
    selfie_right_photo_url character varying(255),
    state public.enum_inquiries_state NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    note jsonb
);


--
-- Name: inquiry_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiry_tags (
    id uuid NOT NULL,
    inquiry_id character varying(255) NOT NULL,
    tag character varying(255) NOT NULL,
    request_id character varying(255),
    created_at timestamp with time zone DEFAULT '2021-06-24 21:02:40.86+00'::timestamp with time zone,
    updated_at timestamp with time zone DEFAULT '2021-06-24 21:02:40.86+00'::timestamp with time zone
);


--
-- Name: kycs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kycs (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    tax_id_number character varying(255),
    tax_id_status character varying(255),
    name character varying(255),
    mother_name character varying(255),
    has_obit_indication boolean,
    props jsonb,
    created_at timestamp with time zone DEFAULT '2021-06-01 23:47:51.15+00'::timestamp with time zone,
    updated_at timestamp with time zone DEFAULT '2021-06-01 23:47:51.15+00'::timestamp with time zone,
    provider character varying(255),
    birth_date date,
    deleted_at timestamp with time zone
);


--
-- Name: kycs_similarities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kycs_similarities (
    id uuid NOT NULL,
    onboarding_id uuid NOT NULL,
    kyc_id uuid NOT NULL,
    name_similarity double precision,
    mother_name_similarity double precision,
    created_at timestamp with time zone DEFAULT '2021-06-03 22:45:53.865+00'::timestamp with time zone,
    updated_at timestamp with time zone DEFAULT '2021-06-03 22:45:53.865+00'::timestamp with time zone
);


--
-- Name: onboarded_users; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.onboarded_users AS
 SELECT y.uid,
    y.telegram_id,
    y.name,
    y.cpf,
    y.waid,
    y.account_id,
    y.balance,
    y.created_at
   FROM ( SELECT x.uid,
            x.telegram_id,
            x.name,
            x.cpf,
            x.waid,
            x.account_id,
            x.balance,
            x.created_at
           FROM ( SELECT "Users".id AS uid,
                    "Users".telegram_id,
                    public.prettify_proper_name(COALESCE("Users".full_name, "Users".name)) AS name,
                    "Users".cpf,
                    "Wallet_accounts".id AS waid,
                    "Wallet_accounts".account_id,
                    "Wallet_accounts".balance,
                    "Users".created_at
                   FROM ((public."Wallet_accounts"
                     JOIN public."Wallets" ON (("Wallet_accounts".wallet_id = "Wallets".id)))
                     JOIN public."Users" ON (("Wallets".user_id = "Users".id)))
                  WHERE (("Wallet_accounts".account_id IS NOT NULL) AND (("Users".onboarding_state)::text = 'complete'::text))
                  ORDER BY "Users".created_at DESC) x) y;


--
-- Name: top_converters; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.top_converters AS
 SELECT x.client_name,
    x.conversion_type,
    round((x.total / (100)::numeric), 2) AS total
   FROM ( SELECT "Conversions".client_name,
            "Conversions".conversion_type,
            sum("Conversions".fiat_amount) AS total
           FROM public."Conversions"
          GROUP BY "Conversions".client_name, "Conversions".conversion_type) x
  ORDER BY (round((x.total / (100)::numeric), 2)) DESC, x.conversion_type;


--
-- Name: users_failures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users_failures (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    reference_id uuid,
    error_code character varying(255),
    error_message character varying(255),
    props jsonb,
    created_at timestamp with time zone DEFAULT '2021-06-18 22:05:06.456+00'::timestamp with time zone,
    updated_at timestamp with time zone DEFAULT '2021-06-18 22:05:06.456+00'::timestamp with time zone
);


--
-- Name: t_history id; Type: DEFAULT; Schema: logging; Owner: -
--

ALTER TABLE ONLY logging.t_history ALTER COLUMN id SET DEFAULT nextval('logging.t_history_id_seq'::regclass);


--
-- Name: Addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addresses" ALTER COLUMN id SET DEFAULT nextval('public."Addresses_id_seq"'::regclass);


--
-- Name: Addresses_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addresses_types" ALTER COLUMN id SET DEFAULT nextval('public."Addresses_types_id_seq"'::regclass);


--
-- Name: Admin_perms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin_perms" ALTER COLUMN id SET DEFAULT nextval('public."Admin_perms_id_seq"'::regclass);


--
-- Name: Admin_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin_roles" ALTER COLUMN id SET DEFAULT nextval('public."Admin_roles_id_seq"'::regclass);


--
-- Name: Admin_roles_perms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin_roles_perms" ALTER COLUMN id SET DEFAULT nextval('public."Admin_roles_perms_id_seq"'::regclass);


--
-- Name: Admins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admins" ALTER COLUMN id SET DEFAULT nextval('public."Admins_id_seq"'::regclass);


--
-- Name: AveragePrices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AveragePrices" ALTER COLUMN id SET DEFAULT nextval('public."AveragePrices_id_seq"'::regclass);


--
-- Name: BankingAccountContacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingAccountContacts" ALTER COLUMN id SET DEFAULT nextval('public."BankingAccountContacts_id_seq"'::regclass);


--
-- Name: BankingCashInBillets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingCashInBillets" ALTER COLUMN id SET DEFAULT nextval('public."BankingCashInBillets_id_seq"'::regclass);


--
-- Name: BankingContacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingContacts" ALTER COLUMN id SET DEFAULT nextval('public."BankingContacts_id_seq"'::regclass);


--
-- Name: BankingDebits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingDebits" ALTER COLUMN id SET DEFAULT nextval('public."BankingDebits_id_seq"'::regclass);


--
-- Name: BankingDeposits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingDeposits" ALTER COLUMN id SET DEFAULT nextval('public."BankingDeposits_id_seq"'::regclass);


--
-- Name: BankingDocReceives id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingDocReceives" ALTER COLUMN id SET DEFAULT nextval('public."BankingDocReceives_id_seq"'::regclass);


--
-- Name: BankingP2PTransfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingP2PTransfers" ALTER COLUMN id SET DEFAULT nextval('public."BankingP2PTransfers_id_seq"'::regclass);


--
-- Name: BankingPaidBillets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingPaidBillets" ALTER COLUMN id SET DEFAULT nextval('public."BankingPaidBillets_id_seq"'::regclass);


--
-- Name: BankingPendingCreditTransfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingPendingCreditTransfers" ALTER COLUMN id SET DEFAULT nextval('public."BankingPendingCreditTransfers_id_seq"'::regclass);


--
-- Name: BankingTedFailures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedFailures" ALTER COLUMN id SET DEFAULT nextval('public."BankingTedFailures_id_seq"'::regclass);


--
-- Name: BankingTedReceives id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedReceives" ALTER COLUMN id SET DEFAULT nextval('public."BankingTedReceives_id_seq"'::regclass);


--
-- Name: BankingTeds id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTeds" ALTER COLUMN id SET DEFAULT nextval('public."Teds_id_seq"'::regclass);


--
-- Name: Chats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chats" ALTER COLUMN id SET DEFAULT nextval('public."Chats_id_seq"'::regclass);


--
-- Name: Contacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contacts" ALTER COLUMN id SET DEFAULT nextval('public."Contacts_id_seq"'::regclass);


--
-- Name: Currencies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Currencies" ALTER COLUMN id SET DEFAULT nextval('public."Currencies_id_seq"'::regclass);


--
-- Name: Limit_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Limit_types" ALTER COLUMN id SET DEFAULT nextval('public."Limit_types_id_seq"'::regclass);


--
-- Name: Notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notifications" ALTER COLUMN id SET DEFAULT nextval('public."Notifications_id_seq"'::regclass);


--
-- Name: Prospects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prospects" ALTER COLUMN id SET DEFAULT nextval('public."Prospects_id_seq"'::regclass);


--
-- Name: Referral_rewards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Referral_rewards" ALTER COLUMN id SET DEFAULT nextval('public."Referral_rewards_id_seq"'::regclass);


--
-- Name: Settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Settings" ALTER COLUMN id SET DEFAULT nextval('public."Settings_id_seq"'::regclass);


--
-- Name: Spread_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Spread_history" ALTER COLUMN id SET DEFAULT nextval('public."Spread_history_id_seq"'::regclass);


--
-- Name: Telegram_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Telegram_logs" ALTER COLUMN id SET DEFAULT nextval('public."Telegram_logs_id_seq"'::regclass);


--
-- Name: Transaction_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction_types" ALTER COLUMN id SET DEFAULT nextval('public."Transaction_types_id_seq"'::regclass);


--
-- Name: User_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User_history" ALTER COLUMN id SET DEFAULT nextval('public."User_history_id_seq"'::regclass);


--
-- Name: User_telegram_ids id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User_telegram_ids" ALTER COLUMN id SET DEFAULT nextval('public."User_telegram_ids_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Name: Users_limits_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_limits_history" ALTER COLUMN id SET DEFAULT nextval('public."Users_limits_history_id_seq"'::regclass);


--
-- Name: Users_onboardings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_onboardings" ALTER COLUMN id SET DEFAULT nextval('public."Users_onboardings_id_seq"'::regclass);


--
-- Name: Users_pin_attempts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_pin_attempts" ALTER COLUMN id SET DEFAULT nextval('public."Users_pin_attempts_id_seq"'::regclass);


--
-- Name: Users_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_settings" ALTER COLUMN id SET DEFAULT nextval('public."Users_settings_id_seq"'::regclass);


--
-- Name: Wallet_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet_accounts" ALTER COLUMN id SET DEFAULT nextval('public."Wallet_accounts_id_seq"'::regclass);


--
-- Name: Wallets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallets" ALTER COLUMN id SET DEFAULT nextval('public."Wallets_id_seq"'::regclass);


--
-- Name: Whitelists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Whitelists" ALTER COLUMN id SET DEFAULT nextval('public."Whitelists_id_seq"'::regclass);


--
-- Name: Addresses Addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addresses"
    ADD CONSTRAINT "Addresses_pkey" PRIMARY KEY (id);


--
-- Name: Addresses_types Addresses_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addresses_types"
    ADD CONSTRAINT "Addresses_types_pkey" PRIMARY KEY (id);


--
-- Name: AdminBankingAccounts AdminBankingAccounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdminBankingAccounts"
    ADD CONSTRAINT "AdminBankingAccounts_pkey" PRIMARY KEY (id);


--
-- Name: AdminBankingTransfers AdminBankingTransfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdminBankingTransfers"
    ADD CONSTRAINT "AdminBankingTransfers_pkey" PRIMARY KEY (id);


--
-- Name: Admin_perms Admin_perms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin_perms"
    ADD CONSTRAINT "Admin_perms_pkey" PRIMARY KEY (id);


--
-- Name: Admin_roles_perms Admin_roles_perms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin_roles_perms"
    ADD CONSTRAINT "Admin_roles_perms_pkey" PRIMARY KEY (id);


--
-- Name: Admin_roles Admin_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin_roles"
    ADD CONSTRAINT "Admin_roles_pkey" PRIMARY KEY (id);


--
-- Name: Admin_roles Admin_roles_title_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin_roles"
    ADD CONSTRAINT "Admin_roles_title_key" UNIQUE (title);


--
-- Name: Admins Admins_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admins"
    ADD CONSTRAINT "Admins_email_key" UNIQUE (email);


--
-- Name: Admins Admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admins"
    ADD CONSTRAINT "Admins_pkey" PRIMARY KEY (id);


--
-- Name: AveragePrices AveragePrices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AveragePrices"
    ADD CONSTRAINT "AveragePrices_pkey" PRIMARY KEY (id);


--
-- Name: BankingAccountContacts BankingAccountContacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingAccountContacts"
    ADD CONSTRAINT "BankingAccountContacts_pkey" PRIMARY KEY (id);


--
-- Name: BankingCashInBillets BankingCashInBillets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingCashInBillets"
    ADD CONSTRAINT "BankingCashInBillets_pkey" PRIMARY KEY (id);


--
-- Name: BankingContacts BankingContacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingContacts"
    ADD CONSTRAINT "BankingContacts_pkey" PRIMARY KEY (id);


--
-- Name: BankingDebits BankingDebits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingDebits"
    ADD CONSTRAINT "BankingDebits_pkey" PRIMARY KEY (id);


--
-- Name: BankingDeposits BankingDeposits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingDeposits"
    ADD CONSTRAINT "BankingDeposits_pkey" PRIMARY KEY (id);


--
-- Name: BankingDocReceives BankingDocReceives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingDocReceives"
    ADD CONSTRAINT "BankingDocReceives_pkey" PRIMARY KEY (id);


--
-- Name: BankingP2PTransfers BankingP2PTransfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingP2PTransfers"
    ADD CONSTRAINT "BankingP2PTransfers_pkey" PRIMARY KEY (id);


--
-- Name: BankingPaidBillets BankingPaidBillets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingPaidBillets"
    ADD CONSTRAINT "BankingPaidBillets_pkey" PRIMARY KEY (id);


--
-- Name: BankingPendingCreditTransfers BankingPendingCreditTransfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingPendingCreditTransfers"
    ADD CONSTRAINT "BankingPendingCreditTransfers_pkey" PRIMARY KEY (id);


--
-- Name: BankingTedFailures BankingTedFailures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedFailures"
    ADD CONSTRAINT "BankingTedFailures_pkey" PRIMARY KEY (id);


--
-- Name: BankingTedReceives BankingTedReceives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedReceives"
    ADD CONSTRAINT "BankingTedReceives_pkey" PRIMARY KEY (id);


--
-- Name: BankingTedRedirections BankingTedRedirections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedRedirections"
    ADD CONSTRAINT "BankingTedRedirections_pkey" PRIMARY KEY (id);


--
-- Name: CampaignGroups CampaignGroups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CampaignGroups"
    ADD CONSTRAINT "CampaignGroups_pkey" PRIMARY KEY (id);


--
-- Name: Campaigns Campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_pkey" PRIMARY KEY (id);


--
-- Name: Cards Cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cards"
    ADD CONSTRAINT "Cards_pkey" PRIMARY KEY (id);


--
-- Name: Chainalysis Chainalysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chainalysis"
    ADD CONSTRAINT "Chainalysis_pkey" PRIMARY KEY (id);


--
-- Name: Chats Chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chats"
    ADD CONSTRAINT "Chats_pkey" PRIMARY KEY (id);


--
-- Name: Contacts Contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contacts"
    ADD CONSTRAINT "Contacts_pkey" PRIMARY KEY (id);


--
-- Name: Conversions Conversions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversions"
    ADD CONSTRAINT "Conversions_pkey" PRIMARY KEY (id);


--
-- Name: CryptoBlocklist CryptoBlocklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CryptoBlocklist"
    ADD CONSTRAINT "CryptoBlocklist_pkey" PRIMARY KEY (id);


--
-- Name: Currencies Currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Currencies"
    ADD CONSTRAINT "Currencies_pkey" PRIMARY KEY (id);


--
-- Name: Global_limits Global_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Global_limits"
    ADD CONSTRAINT "Global_limits_pkey" PRIMARY KEY (id);


--
-- Name: Limit_types Limit_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Limit_types"
    ADD CONSTRAINT "Limit_types_pkey" PRIMARY KEY (id);


--
-- Name: Notifications Notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Occupations Occupations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Occupations"
    ADD CONSTRAINT "Occupations_pkey" PRIMARY KEY (cod_cbo);


--
-- Name: Onboarding_failures Onboarding_failures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Onboarding_failures"
    ADD CONSTRAINT "Onboarding_failures_pkey" PRIMARY KEY (id);


--
-- Name: Onboardings Onboardings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Onboardings"
    ADD CONSTRAINT "Onboardings_pkey" PRIMARY KEY (id);


--
-- Name: Operations_btc_receives Operations_btc_receives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Operations_btc_receives"
    ADD CONSTRAINT "Operations_btc_receives_pkey" PRIMARY KEY (id);


--
-- Name: Operations Operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Operations"
    ADD CONSTRAINT "Operations_pkey" PRIMARY KEY (id);


--
-- Name: Prospects Prospects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prospects"
    ADD CONSTRAINT "Prospects_pkey" PRIMARY KEY (id);


--
-- Name: Providers Providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Providers"
    ADD CONSTRAINT "Providers_pkey" PRIMARY KEY (id);


--
-- Name: Referral_rewards Referral_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Referral_rewards"
    ADD CONSTRAINT "Referral_rewards_pkey" PRIMARY KEY (id);


--
-- Name: Remittances Remittances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Remittances"
    ADD CONSTRAINT "Remittances_pkey" PRIMARY KEY (id);


--
-- Name: SequelizeMetaUsers SequelizeMetaUsers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMetaUsers"
    ADD CONSTRAINT "SequelizeMetaUsers_pkey" PRIMARY KEY (name);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: Settings Settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Settings"
    ADD CONSTRAINT "Settings_pkey" PRIMARY KEY (id);


--
-- Name: Spread_history Spread_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Spread_history"
    ADD CONSTRAINT "Spread_history_pkey" PRIMARY KEY (id);


--
-- Name: BankingTeds Teds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTeds"
    ADD CONSTRAINT "Teds_pkey" PRIMARY KEY (id);


--
-- Name: Telegram_logs Telegram_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Telegram_logs"
    ADD CONSTRAINT "Telegram_logs_pkey" PRIMARY KEY (id);


--
-- Name: Transaction_types Transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction_types"
    ADD CONSTRAINT "Transaction_types_pkey" PRIMARY KEY (id);


--
-- Name: User_history User_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User_history"
    ADD CONSTRAINT "User_history_pkey" PRIMARY KEY (id);


--
-- Name: User_telegram_ids User_telegram_ids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User_telegram_ids"
    ADD CONSTRAINT "User_telegram_ids_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users_limits_history Users_limits_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_limits_history"
    ADD CONSTRAINT "Users_limits_history_pkey" PRIMARY KEY (id);


--
-- Name: Users_limits Users_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_limits"
    ADD CONSTRAINT "Users_limits_pkey" PRIMARY KEY (id);


--
-- Name: Users_notes Users_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_notes"
    ADD CONSTRAINT "Users_notes_pkey" PRIMARY KEY (id);


--
-- Name: Users_onboardings Users_onboardings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_onboardings"
    ADD CONSTRAINT "Users_onboardings_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_phone_number_key" UNIQUE (phone_number);


--
-- Name: Users_pin_attempts Users_pin_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_pin_attempts"
    ADD CONSTRAINT "Users_pin_attempts_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Users_settings Users_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_settings"
    ADD CONSTRAINT "Users_settings_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_telegram_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_telegram_id_key" UNIQUE (telegram_id);


--
-- Name: Users Users_wallet_account_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_wallet_account_code_key" UNIQUE (wallet_account_code);


--
-- Name: Wallet_account_transactions Wallet_account_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet_account_transactions"
    ADD CONSTRAINT "Wallet_account_transactions_pkey" PRIMARY KEY (id);


--
-- Name: Wallet_accounts Wallet_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet_accounts"
    ADD CONSTRAINT "Wallet_accounts_pkey" PRIMARY KEY (id);


--
-- Name: Wallets Wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallets"
    ADD CONSTRAINT "Wallets_pkey" PRIMARY KEY (id);


--
-- Name: Whitelists Whitelists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Whitelists"
    ADD CONSTRAINT "Whitelists_pkey" PRIMARY KEY (id);


--
-- Name: events events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_event_id_key UNIQUE (event_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: inquiries inquiries_inquiry_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_inquiry_id_key UNIQUE (inquiry_id);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: inquiry_tags inquiry_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_tags
    ADD CONSTRAINT inquiry_tags_pkey PRIMARY KEY (id);


--
-- Name: kycs kycs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kycs
    ADD CONSTRAINT kycs_pkey PRIMARY KEY (id);


--
-- Name: kycs_similarities kycs_similarities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kycs_similarities
    ADD CONSTRAINT kycs_similarities_pkey PRIMARY KEY (id);


--
-- Name: users_failures users_failures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_failures
    ADD CONSTRAINT users_failures_pkey PRIMARY KEY (id);


--
-- Name: history_tabname; Type: INDEX; Schema: logging; Owner: -
--

CREATE INDEX history_tabname ON logging.t_history USING btree (tabname);


--
-- Name: history_tstamp; Type: INDEX; Schema: logging; Owner: -
--

CREATE INDEX history_tstamp ON logging.t_history USING btree (tstamp);


--
-- Name: Users_uuid_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Users_uuid_key" ON public."Users" USING btree (uuid);


--
-- Name: banking_debits_transaction_uuid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX banking_debits_transaction_uuid ON public."BankingDebits" USING btree (transaction_uuid);


--
-- Name: crypto_blocklist_address_currency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX crypto_blocklist_address_currency_id ON public."CryptoBlocklist" USING btree (address, currency_id);


--
-- Name: notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id ON public."Notifications" USING btree (user_id);


--
-- Name: onboarding_failures_onboarding_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX onboarding_failures_onboarding_id ON public."Onboarding_failures" USING btree (onboarding_id);


--
-- Name: onboarding_failures_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX onboarding_failures_user_id ON public."Onboarding_failures" USING btree (user_id);


--
-- Name: referral_rewards_awarded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referral_rewards_awarded_by ON public."Referral_rewards" USING btree (awarded_by);


--
-- Name: referral_rewards_awarded_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referral_rewards_awarded_to ON public."Referral_rewards" USING btree (awarded_to);


--
-- Name: referral_rewards_payment_operation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referral_rewards_payment_operation_id ON public."Referral_rewards" USING btree (payment_operation_id);


--
-- Name: users_notes_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_notes_deleted_at ON public."Users_notes" USING btree (deleted_at);


--
-- Name: users_notes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_notes_user_id ON public."Users_notes" USING btree (user_id);


--
-- Name: wallet_accounts_account_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wallet_accounts_account_number ON public."Wallet_accounts" USING btree (account_number);


--
-- Name: Users t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Users" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Users_onboardings t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Users_onboardings" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Users_pin_attempts t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Users_pin_attempts" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Users_settings t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Users_settings" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Wallet_account_transactions t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Wallet_account_transactions" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Wallet_accounts t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Wallet_accounts" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Wallets t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Wallets" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: User_history t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."User_history" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Addresses t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Addresses" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Addresses_types t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Addresses_types" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Admin_roles t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Admin_roles" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Admin_roles_perms t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Admin_roles_perms" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Admins t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Admins" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingAccountContacts t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingAccountContacts" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingContacts t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingContacts" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingDebits t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingDebits" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingDeposits t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingDeposits" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingP2PTransfers t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingP2PTransfers" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingPaidBillets t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingPaidBillets" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingTedReceives t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingTedReceives" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingTeds t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingTeds" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Chats t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Chats" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Contacts t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Contacts" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Currencies t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Currencies" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Notifications t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Notifications" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Operations t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Operations" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Operations_btc_receives t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Operations_btc_receives" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: SequelizeMeta t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."SequelizeMeta" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Telegram_logs t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Telegram_logs" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Transaction_types t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Transaction_types" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Settings t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Settings" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Prospects t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Prospects" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Providers t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Providers" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Conversions t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Conversions" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Remittances t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Remittances" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Whitelists t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Whitelists" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Limit_types t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Limit_types" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Global_limits t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Global_limits" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Users_limits t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Users_limits" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Chainalysis t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Chainalysis" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Cards t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Cards" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Admin_perms t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Admin_perms" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingCashInBillets t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingCashInBillets" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingPendingCreditTransfers t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingPendingCreditTransfers" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingTedFailures t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingTedFailures" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingTedRedirections t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingTedRedirections" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Onboarding_failures t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Onboarding_failures" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Onboardings t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Onboardings" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Spread_history t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Spread_history" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: User_telegram_ids t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."User_telegram_ids" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Users_limits_history t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Users_limits_history" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: AdminBankingAccounts t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."AdminBankingAccounts" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: AdminBankingTransfers t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."AdminBankingTransfers" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Users_notes t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Users_notes" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: CampaignGroups t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."CampaignGroups" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Campaigns t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Campaigns" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: BankingDocReceives t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."BankingDocReceives" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Campaigns_CampaignGroups t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Campaigns_CampaignGroups" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Occupations t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Occupations" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Referral_rewards t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."Referral_rewards" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: CryptoBlocklist t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public."CryptoBlocklist" FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: kycs t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public.kycs FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: kycs_similarities t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public.kycs_similarities FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: users_failures t; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER t BEFORE INSERT OR DELETE OR UPDATE ON public.users_failures FOR EACH ROW EXECUTE PROCEDURE public.change_trigger();


--
-- Name: Onboardings update_doc_url; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_doc_url AFTER INSERT OR UPDATE ON public."Onboardings" FOR EACH ROW EXECUTE PROCEDURE public.update_doc_url_trigger();


--
-- Name: Addresses Addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addresses"
    ADD CONSTRAINT "Addresses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: AdminBankingAccounts AdminBankingAccounts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdminBankingAccounts"
    ADD CONSTRAINT "AdminBankingAccounts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Admins"(id);


--
-- Name: AdminBankingAccounts AdminBankingAccounts_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdminBankingAccounts"
    ADD CONSTRAINT "AdminBankingAccounts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public."Admins"(id);


--
-- Name: AdminBankingTransfers AdminBankingTransfers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdminBankingTransfers"
    ADD CONSTRAINT "AdminBankingTransfers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Admins"(id);


--
-- Name: AdminBankingTransfers AdminBankingTransfers_destination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdminBankingTransfers"
    ADD CONSTRAINT "AdminBankingTransfers_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public."AdminBankingAccounts"(id);


--
-- Name: AdminBankingTransfers AdminBankingTransfers_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdminBankingTransfers"
    ADD CONSTRAINT "AdminBankingTransfers_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public."AdminBankingAccounts"(id);


--
-- Name: AdminBankingTransfers AdminBankingTransfers_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdminBankingTransfers"
    ADD CONSTRAINT "AdminBankingTransfers_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public."Admins"(id);


--
-- Name: Admin_roles_perms Admin_roles_perms_perm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin_roles_perms"
    ADD CONSTRAINT "Admin_roles_perms_perm_id_fkey" FOREIGN KEY (perm_id) REFERENCES public."Admin_perms"(id);


--
-- Name: Admin_roles_perms Admin_roles_perms_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin_roles_perms"
    ADD CONSTRAINT "Admin_roles_perms_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public."Admin_roles"(id);


--
-- Name: Admins Admins_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admins"
    ADD CONSTRAINT "Admins_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public."Admin_roles"(id);


--
-- Name: AveragePrices AveragePrices_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AveragePrices"
    ADD CONSTRAINT "AveragePrices_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: AveragePrices AveragePrices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AveragePrices"
    ADD CONSTRAINT "AveragePrices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: BankingCashInBillets BankingCashInBillets_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingCashInBillets"
    ADD CONSTRAINT "BankingCashInBillets_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: BankingCashInBillets BankingCashInBillets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingCashInBillets"
    ADD CONSTRAINT "BankingCashInBillets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: BankingContacts BankingContacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingContacts"
    ADD CONSTRAINT "BankingContacts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: BankingDebits BankingDebits_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingDebits"
    ADD CONSTRAINT "BankingDebits_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: BankingDeposits BankingDeposits_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingDeposits"
    ADD CONSTRAINT "BankingDeposits_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: BankingDocReceives BankingDocReceives_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingDocReceives"
    ADD CONSTRAINT "BankingDocReceives_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: BankingP2PTransfers BankingP2PTransfers_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingP2PTransfers"
    ADD CONSTRAINT "BankingP2PTransfers_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: BankingPaidBillets BankingPaidBillets_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingPaidBillets"
    ADD CONSTRAINT "BankingPaidBillets_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: BankingPendingCreditTransfers BankingPendingCreditTransfers_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingPendingCreditTransfers"
    ADD CONSTRAINT "BankingPendingCreditTransfers_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: BankingPendingCreditTransfers BankingPendingCreditTransfers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingPendingCreditTransfers"
    ADD CONSTRAINT "BankingPendingCreditTransfers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: BankingPendingCreditTransfers BankingPendingCreditTransfers_wallet_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingPendingCreditTransfers"
    ADD CONSTRAINT "BankingPendingCreditTransfers_wallet_account_id_fkey" FOREIGN KEY (wallet_account_id) REFERENCES public."Wallet_accounts"(id);


--
-- Name: BankingTedFailures BankingTedFailures_banking_ted_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedFailures"
    ADD CONSTRAINT "BankingTedFailures_banking_ted_id_fkey" FOREIGN KEY (banking_ted_id) REFERENCES public."BankingTeds"(id);


--
-- Name: BankingTedFailures BankingTedFailures_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedFailures"
    ADD CONSTRAINT "BankingTedFailures_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: BankingTedReceives BankingTedReceives_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedReceives"
    ADD CONSTRAINT "BankingTedReceives_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: BankingTedRedirections BankingTedRedirections_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedRedirections"
    ADD CONSTRAINT "BankingTedRedirections_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public."Admins"(id);


--
-- Name: BankingTedRedirections BankingTedRedirections_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedRedirections"
    ADD CONSTRAINT "BankingTedRedirections_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: BankingTedRedirections BankingTedRedirections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTedRedirections"
    ADD CONSTRAINT "BankingTedRedirections_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Campaigns_CampaignGroups Campaigns_CampaignGroups_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaigns_CampaignGroups"
    ADD CONSTRAINT "Campaigns_CampaignGroups_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public."Campaigns"(id);


--
-- Name: Campaigns_CampaignGroups Campaigns_CampaignGroups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaigns_CampaignGroups"
    ADD CONSTRAINT "Campaigns_CampaignGroups_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public."CampaignGroups"(id);


--
-- Name: Cards Cards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cards"
    ADD CONSTRAINT "Cards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Chainalysis Chainalysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chainalysis"
    ADD CONSTRAINT "Chainalysis_id_fkey" FOREIGN KEY (id) REFERENCES public."Operations"(id);


--
-- Name: Chats Chats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chats"
    ADD CONSTRAINT "Chats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Contacts Contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contacts"
    ADD CONSTRAINT "Contacts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Conversions Conversions_currency_spread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversions"
    ADD CONSTRAINT "Conversions_currency_spread_id_fkey" FOREIGN KEY (currency_spread_id) REFERENCES public."Spread_history"(id);


--
-- Name: Conversions Conversions_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversions"
    ADD CONSTRAINT "Conversions_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: Conversions Conversions_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversions"
    ADD CONSTRAINT "Conversions_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES public."Providers"(id);


--
-- Name: Conversions Conversions_remittance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversions"
    ADD CONSTRAINT "Conversions_remittance_id_fkey" FOREIGN KEY (remittance_id) REFERENCES public."Remittances"(id);


--
-- Name: Conversions Conversions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversions"
    ADD CONSTRAINT "Conversions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Conversions Conversions_zro_spread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversions"
    ADD CONSTRAINT "Conversions_zro_spread_id_fkey" FOREIGN KEY (zro_spread_id) REFERENCES public."Spread_history"(id);


--
-- Name: CryptoBlocklist CryptoBlocklist_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CryptoBlocklist"
    ADD CONSTRAINT "CryptoBlocklist_currency_id_fkey" FOREIGN KEY (currency_id) REFERENCES public."Currencies"(id);


--
-- Name: Global_limits Global_limits_limit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Global_limits"
    ADD CONSTRAINT "Global_limits_limit_type_id_fkey" FOREIGN KEY (limit_type_id) REFERENCES public."Limit_types"(id);


--
-- Name: Notifications Notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Onboarding_failures Onboarding_failures_onboarding_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Onboarding_failures"
    ADD CONSTRAINT "Onboarding_failures_onboarding_id_fkey" FOREIGN KEY (onboarding_id) REFERENCES public."Onboardings"(id);


--
-- Name: Onboarding_failures Onboarding_failures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Onboarding_failures"
    ADD CONSTRAINT "Onboarding_failures_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Onboardings Onboardings_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Onboardings"
    ADD CONSTRAINT "Onboardings_address_id_fkey" FOREIGN KEY (address_id) REFERENCES public."Addresses"(id);


--
-- Name: Onboardings Onboardings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Onboardings"
    ADD CONSTRAINT "Onboardings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Operations Operations_operation_ref_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Operations"
    ADD CONSTRAINT "Operations_operation_ref_id_fkey" FOREIGN KEY (operation_ref_id) REFERENCES public."Operations"(id);


--
-- Name: Prospects Prospects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prospects"
    ADD CONSTRAINT "Prospects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Referral_rewards Referral_rewards_awarded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Referral_rewards"
    ADD CONSTRAINT "Referral_rewards_awarded_by_fkey" FOREIGN KEY (awarded_by) REFERENCES public."Users"(id);


--
-- Name: Referral_rewards Referral_rewards_awarded_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Referral_rewards"
    ADD CONSTRAINT "Referral_rewards_awarded_to_fkey" FOREIGN KEY (awarded_to) REFERENCES public."Users"(id);


--
-- Name: Referral_rewards Referral_rewards_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Referral_rewards"
    ADD CONSTRAINT "Referral_rewards_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: Referral_rewards Referral_rewards_payment_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Referral_rewards"
    ADD CONSTRAINT "Referral_rewards_payment_operation_id_fkey" FOREIGN KEY (payment_operation_id) REFERENCES public."Operations"(id);


--
-- Name: Remittances Remittances_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Remittances"
    ADD CONSTRAINT "Remittances_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES public."Providers"(id);


--
-- Name: Spread_history Spread_history_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Spread_history"
    ADD CONSTRAINT "Spread_history_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public."Admins"(id);


--
-- Name: BankingTeds Teds_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankingTeds"
    ADD CONSTRAINT "Teds_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES public."Operations"(id);


--
-- Name: User_history User_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User_history"
    ADD CONSTRAINT "User_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: User_telegram_ids User_telegram_ids_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User_telegram_ids"
    ADD CONSTRAINT "User_telegram_ids_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Users_limits_history Users_limits_history_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_limits_history"
    ADD CONSTRAINT "Users_limits_history_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public."Admins"(id);


--
-- Name: Users_limits_history Users_limits_history_limit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_limits_history"
    ADD CONSTRAINT "Users_limits_history_limit_type_id_fkey" FOREIGN KEY (limit_type_id) REFERENCES public."Limit_types"(id);


--
-- Name: Users_limits_history Users_limits_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_limits_history"
    ADD CONSTRAINT "Users_limits_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Users_limits Users_limits_limit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_limits"
    ADD CONSTRAINT "Users_limits_limit_type_id_fkey" FOREIGN KEY (limit_type_id) REFERENCES public."Limit_types"(id);


--
-- Name: Users_limits Users_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_limits"
    ADD CONSTRAINT "Users_limits_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Users_notes Users_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_notes"
    ADD CONSTRAINT "Users_notes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Admins"(id);


--
-- Name: Users_notes Users_notes_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_notes"
    ADD CONSTRAINT "Users_notes_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES public."Admins"(id);


--
-- Name: Users_notes Users_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_notes"
    ADD CONSTRAINT "Users_notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Users_onboardings Users_onboardings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_onboardings"
    ADD CONSTRAINT "Users_onboardings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Users_pin_attempts Users_pin_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_pin_attempts"
    ADD CONSTRAINT "Users_pin_attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Users_settings Users_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users_settings"
    ADD CONSTRAINT "Users_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Wallets Wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallets"
    ADD CONSTRAINT "Wallets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: kycs_similarities kycs_similarities_kyc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kycs_similarities
    ADD CONSTRAINT kycs_similarities_kyc_id_fkey FOREIGN KEY (kyc_id) REFERENCES public.kycs(id);


--
-- Name: kycs_similarities kycs_similarities_onboarding_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kycs_similarities
    ADD CONSTRAINT kycs_similarities_onboarding_id_fkey FOREIGN KEY (onboarding_id) REFERENCES public."Onboardings"(id);


--
-- Name: users_failures users_failures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_failures
    ADD CONSTRAINT users_failures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: SCHEMA logging; Type: ACL; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--



--
-- Name: FUNCTION avg_price_method(uid integer); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION change_trigger(); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION is_male_ptbr(fullname character varying); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION prettify_proper_name(fullname character varying); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: public; Owner: -
--



--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE t_history; Type: ACL; Schema: logging; Owner: -
--



--
-- Name: TABLE "Addresses"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Addresses_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Addresses_types"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Addresses_types_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "AdminBankingAccounts"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "AdminBankingTransfers"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Admin_perms"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Admin_perms_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Admin_roles"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Admin_roles_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Admin_roles_perms"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Admin_roles_perms_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Admins"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Admins_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "AveragePrices"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "AveragePrices_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingAccountContacts"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingAccountContacts_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingCashInBillets"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingCashInBillets_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingContacts"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingContacts_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingDebits"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingDebits_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingDeposits"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingDeposits_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingDocReceives"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingDocReceives_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingP2PTransfers"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingP2PTransfers_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingPaidBillets"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingPaidBillets_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingPendingCreditTransfers"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingPendingCreditTransfers_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingTedFailures"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingTedFailures_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingTedReceives"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "BankingTedReceives_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingTedRedirections"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "BankingTeds"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "CampaignGroups"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Campaigns"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Campaigns_CampaignGroups"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Cards"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Chainalysis"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Chats"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Chats_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Contacts"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Contacts_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Conversions"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Operations"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Transaction_types"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Convs"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "CryptoBlocklist"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Currencies"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Currencies_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Global_limits"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Limit_types"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Limit_types_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Notifications"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Notifications_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Occupations"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Onboarding_failures"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Onboardings"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Onboardings_view"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Operations_bak"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Operations_btc_receives"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Prospects"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Prospects_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Providers"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Referral_rewards"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Remittances"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "SequelizeMeta"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "SequelizeMetaUsers"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Settings"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Settings_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Spread_history"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Spread_history_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Teds_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Telegram_logs"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Telegram_logs_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Transaction_types_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Wallet_account_transactions"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Transactions_operations"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "User_history"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "User_history_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "User_limits_bak"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "User_telegram_ids"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "User_telegram_ids_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Users"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Users_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Users_limits"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Users_limits_history"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Users_limits_history_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Users_notes"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Users_onboardings"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Users_onboardings_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Users_pin_attempts"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Users_pin_attempts_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Users_settings"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Users_settings_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Wallet_accounts"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Wallet_accounts_20201231"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Wallet_accounts_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Wallets"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Wallets_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE "Whitelists"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: SEQUENCE "Whitelists_id_seq"; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE export_gender; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE inquiries; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE inquiry_tags; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE kycs; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE kycs_similarities; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE onboarded_users; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE top_converters; Type: ACL; Schema: public; Owner: -
--



--
-- Name: TABLE users_failures; Type: ACL; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--

