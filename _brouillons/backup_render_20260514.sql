--
-- PostgreSQL database dump
--

\restrict FbuT0E4tmHWrtly6SeWG1enSwgdFGLPEDPJ4esF8fjTsypeJcd6sFkryz6BOfmN

-- Dumped from database version 15.17
-- Dumped by pg_dump version 18.3

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: enum_promises_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_promises_status AS ENUM (
    'engagee',
    'en_cours',
    'completee',
    'abandonnee'
);


--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_role AS ENUM (
    'citizen',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actualite_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actualite_translations (
    id integer NOT NULL,
    actualite_id integer NOT NULL,
    language character varying(2) NOT NULL,
    titre character varying(255),
    contenu text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: actualite_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.actualite_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: actualite_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.actualite_translations_id_seq OWNED BY public.actualite_translations.id;


--
-- Name: actualites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actualites (
    id integer NOT NULL,
    titre character varying(255) NOT NULL,
    contenu text NOT NULL,
    author_id integer NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamp with time zone,
    published_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: actualites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.actualites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: actualites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.actualites_id_seq OWNED BY public.actualites.id;


--
-- Name: analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics (
    id integer NOT NULL,
    user_id integer,
    event_type character varying(50),
    event_data jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analytics_id_seq OWNED BY public.analytics.id;


--
-- Name: circonscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.circonscriptions (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    niveau character varying(50) NOT NULL,
    "région" character varying(100) NOT NULL,
    code_postal character varying(10),
    elus_ids integer[] DEFAULT ARRAY[]::integer[],
    population integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: circonscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.circonscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: circonscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.circonscriptions_id_seq OWNED BY public.circonscriptions.id;


--
-- Name: comment_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment_translations (
    id integer NOT NULL,
    comment_id bigint NOT NULL,
    language character varying(2) NOT NULL,
    contenu text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: comment_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comment_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comment_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comment_translations_id_seq OWNED BY public.comment_translations.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    content text NOT NULL,
    likes_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: content_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_pages (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255),
    content text,
    is_published boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: content_pages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.content_pages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: content_pages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.content_pages_id_seq OWNED BY public.content_pages.id;


--
-- Name: education_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_resources (
    id integer NOT NULL,
    title character varying(255),
    description text,
    url text,
    category character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: education_resources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.education_resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: education_resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.education_resources_id_seq OWNED BY public.education_resources.id;


--
-- Name: elus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.elus (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    titre character varying(100) NOT NULL,
    region character varying(50) NOT NULL,
    niveau character varying(50) NOT NULL,
    email character varying(255),
    photo_url character varying(500),
    site_web character varying(500),
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: elus_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.elus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: elus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.elus_id_seq OWNED BY public.elus.id;


--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verifications (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    token character varying(64) NOT NULL,
    used_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: email_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_verifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_verifications_id_seq OWNED BY public.email_verifications.id;


--
-- Name: flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flags (
    id integer NOT NULL,
    post_id integer,
    comment_id integer,
    flagged_by integer NOT NULL,
    reason character varying(100),
    description text,
    status character varying(20) DEFAULT 'open'::character varying,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: flags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.flags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: flags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.flags_id_seq OWNED BY public.flags.id;


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    id integer NOT NULL,
    follower_id integer NOT NULL,
    following_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: follows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.follows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: follows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.follows_id_seq OWNED BY public.follows.id;


--
-- Name: initiative_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initiative_votes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    initiative_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: initiative_votes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.initiative_votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: initiative_votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.initiative_votes_id_seq OWNED BY public.initiative_votes.id;


--
-- Name: initiatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initiatives (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'draft'::character varying,
    votes_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


--
-- Name: initiatives_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.initiatives_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: initiatives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.initiatives_id_seq OWNED BY public.initiatives.id;


--
-- Name: likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.likes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.likes_id_seq OWNED BY public.likes.id;


--
-- Name: map_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.map_nodes (
    id integer NOT NULL,
    profile_id integer NOT NULL,
    province character varying(100),
    city character varying(100),
    latitude numeric(10,8),
    longitude numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: map_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.map_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: map_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.map_nodes_id_seq OWNED BY public.map_nodes.id;


--
-- Name: petition_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.petition_comments (
    id bigint NOT NULL,
    petition_id integer NOT NULL,
    citoyen_id integer NOT NULL,
    contenu text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: petition_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.petition_comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: petition_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.petition_comments_id_seq OWNED BY public.petition_comments.id;


--
-- Name: petition_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.petition_translations (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    language character varying(2) NOT NULL,
    titre character varying(255),
    description text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: petition_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.petition_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: petition_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.petition_translations_id_seq OWNED BY public.petition_translations.id;


--
-- Name: petitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.petitions (
    id integer NOT NULL,
    titre character varying(255) NOT NULL,
    description text NOT NULL,
    citoyen_id integer NOT NULL,
    elu_id integer,
    status character varying(50) DEFAULT 'draft'::character varying,
    signatures_count integer DEFAULT 0,
    deadline timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: petitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.petitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: petitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.petitions_id_seq OWNED BY public.petitions.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    category character varying(50),
    status character varying(20) DEFAULT 'published'::character varying,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    full_name character varying(100),
    phone character varying(20),
    province character varying(100),
    city character varying(100),
    postal_code character varying(10),
    interests text,
    expertise text,
    location_lat numeric(10,8),
    location_lon numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profiles_id_seq OWNED BY public.profiles.id;


--
-- Name: promise_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promise_translations (
    id integer NOT NULL,
    promise_id integer NOT NULL,
    language character varying(2) NOT NULL,
    titre character varying(255),
    description text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: promise_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promise_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promise_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promise_translations_id_seq OWNED BY public.promise_translations.id;


--
-- Name: promises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promises (
    id integer NOT NULL,
    titre character varying(255) NOT NULL,
    description text,
    status public.enum_promises_status DEFAULT 'engagee'::public.enum_promises_status,
    deadline timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    elu_id integer
);


--
-- Name: promises_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promises_id_seq OWNED BY public.promises.id;


--
-- Name: schema_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_versions (
    id integer NOT NULL,
    version_number integer NOT NULL,
    description character varying(255),
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: schema_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schema_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schema_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schema_versions_id_seq OWNED BY public.schema_versions.id;


--
-- Name: signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signatures (
    id bigint NOT NULL,
    petition_id integer NOT NULL,
    citoyen_id integer NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: signatures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.signatures_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: signatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.signatures_id_seq OWNED BY public.signatures.id;


--
-- Name: translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.translations (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    fr text NOT NULL,
    en text NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.translations_id_seq OWNED BY public.translations.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    nom_complet character varying(255),
    province character varying(50),
    code_postal character varying(10),
    verified_at timestamp with time zone,
    role public.enum_users_role DEFAULT 'citizen'::public.enum_users_role
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: actualite_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actualite_translations ALTER COLUMN id SET DEFAULT nextval('public.actualite_translations_id_seq'::regclass);


--
-- Name: actualites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actualites ALTER COLUMN id SET DEFAULT nextval('public.actualites_id_seq'::regclass);


--
-- Name: analytics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics ALTER COLUMN id SET DEFAULT nextval('public.analytics_id_seq'::regclass);


--
-- Name: circonscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circonscriptions ALTER COLUMN id SET DEFAULT nextval('public.circonscriptions_id_seq'::regclass);


--
-- Name: comment_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_translations ALTER COLUMN id SET DEFAULT nextval('public.comment_translations_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: content_pages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_pages ALTER COLUMN id SET DEFAULT nextval('public.content_pages_id_seq'::regclass);


--
-- Name: education_resources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_resources ALTER COLUMN id SET DEFAULT nextval('public.education_resources_id_seq'::regclass);


--
-- Name: elus id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.elus ALTER COLUMN id SET DEFAULT nextval('public.elus_id_seq'::regclass);


--
-- Name: email_verifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verifications ALTER COLUMN id SET DEFAULT nextval('public.email_verifications_id_seq'::regclass);


--
-- Name: flags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flags ALTER COLUMN id SET DEFAULT nextval('public.flags_id_seq'::regclass);


--
-- Name: follows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows ALTER COLUMN id SET DEFAULT nextval('public.follows_id_seq'::regclass);


--
-- Name: initiative_votes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_votes ALTER COLUMN id SET DEFAULT nextval('public.initiative_votes_id_seq'::regclass);


--
-- Name: initiatives id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiatives ALTER COLUMN id SET DEFAULT nextval('public.initiatives_id_seq'::regclass);


--
-- Name: likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes ALTER COLUMN id SET DEFAULT nextval('public.likes_id_seq'::regclass);


--
-- Name: map_nodes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.map_nodes ALTER COLUMN id SET DEFAULT nextval('public.map_nodes_id_seq'::regclass);


--
-- Name: petition_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petition_comments ALTER COLUMN id SET DEFAULT nextval('public.petition_comments_id_seq'::regclass);


--
-- Name: petition_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petition_translations ALTER COLUMN id SET DEFAULT nextval('public.petition_translations_id_seq'::regclass);


--
-- Name: petitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petitions ALTER COLUMN id SET DEFAULT nextval('public.petitions_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_id_seq'::regclass);


--
-- Name: promise_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promise_translations ALTER COLUMN id SET DEFAULT nextval('public.promise_translations_id_seq'::regclass);


--
-- Name: promises id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promises ALTER COLUMN id SET DEFAULT nextval('public.promises_id_seq'::regclass);


--
-- Name: schema_versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_versions ALTER COLUMN id SET DEFAULT nextval('public.schema_versions_id_seq'::regclass);


--
-- Name: signatures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures ALTER COLUMN id SET DEFAULT nextval('public.signatures_id_seq'::regclass);


--
-- Name: translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translations ALTER COLUMN id SET DEFAULT nextval('public.translations_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: actualite_translations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.actualite_translations (id, actualite_id, language, titre, contenu, created_at) FROM stdin;
\.


--
-- Data for Name: actualites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.actualites (id, titre, contenu, author_id, status, likes_count, comments_count, created_at, published_at, updated_at) FROM stdin;
\.


--
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics (id, user_id, event_type, event_data, created_at) FROM stdin;
\.


--
-- Data for Name: circonscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.circonscriptions (id, nom, niveau, "région", code_postal, elus_ids, population, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: comment_translations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comment_translations (id, comment_id, language, contenu, created_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comments (id, user_id, post_id, content, likes_count, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: content_pages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_pages (id, slug, title, content, is_published, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: education_resources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.education_resources (id, title, description, url, category, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: elus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.elus (id, nom, titre, region, niveau, email, photo_url, site_web, latitude, longitude, created_at, updated_at) FROM stdin;
1	Marthe Belleville	Député	Québec	fédéral	marthe.belleville@parl.gc.ca	https://via.placeholder.com/300?text=Marthe+Belleville	https://marthe-belleville.ca	46.8139	-71.208	\N	\N
2	Jean-Marie Pépin	Sénateur	Toronto	fédéral	jm.pepin@senate.ca	https://via.placeholder.com/300?text=Jean-Marie+Pepin	https://jmpepin.ca	43.6629	-79.3957	\N	\N
3	Sophie Goyette	Député	Montréal	provincial	sophie.goyette@assnat.qc.ca	https://via.placeholder.com/300?text=Sophie+Goyette	https://sophiegoyette.ca	45.5017	-73.5673	\N	\N
4	André Lamproze	Maire	Vancouver	municipal	alamproze@ville.vancouver.bc.ca	https://via.placeholder.com/300?text=Andre+Lamproze	https://ville.vancouver.bc.ca/maire	49.2827	-123.1207	\N	\N
5	Caroline Matte	Conseiller	Calgary	municipal	cmatte@ville.calgary.ab.ca	https://via.placeholder.com/300?text=Caroline+Matte	https://ville.calgary.ab.ca/conseillers	51.0447	-114.0719	\N	\N
6	Caroline Matte	Conseiller	Quebec	municipal	cmatte@ville.quebec.qc.ca	https://via.placeholder.com/300?text=Caroline+Matte	https://ville.quebec.qc.ca/conseillers	46.82	-71.23	\N	\N
\.


--
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_verifications (id, user_id, token, used_at, expires_at, created_at) FROM stdin;
1	11	cabbdf1a5cbd05bc6e90a6a55f0c55f733606963f47c36922eaab793e1da1b7d	\N	2026-05-14 04:51:43.63+00	2026-05-14 04:36:43.63+00
2	11	b034a48920d3e14a6dc47882f15ffbba08557989e9da7c727ce5c7e27ab5c3db	2026-05-14 04:52:58.946+00	2026-05-14 04:58:10.853+00	2026-05-14 04:43:10.853+00
3	11	75f2239f364800de5ea9c03e8d943944db47ddc156b6915c7cef78f34624ff76	\N	2026-05-14 05:13:02.086+00	2026-05-14 04:58:02.086+00
4	11	b32eae48784c0b35390d88b565c02a36e2425eb8c2755eff14eda831571e6952	\N	2026-05-14 05:29:48.188+00	2026-05-14 05:14:48.188+00
5	11	6ab9136e5bed96418a5171337cb2bb321df1c5bcca48c542f3e600ef1824f079	2026-05-14 05:21:16.308+00	2026-05-14 05:36:04.557+00	2026-05-14 05:21:04.558+00
6	11	4958fd26dd0e562fa88517572aafd9ac7f08d8c8f15b43c21110c1f2fd2bab53	2026-05-14 06:00:29.832+00	2026-05-14 06:15:07.56+00	2026-05-14 06:00:07.56+00
7	11	0005e7bbe97ab6d428999fffd149f10aa6e62d43b30e4ab0cb970f30ac3c3ec8	2026-05-14 06:04:31.26+00	2026-05-14 06:19:18.275+00	2026-05-14 06:04:18.275+00
8	11	94d578ff0a740cd3b1b9b72666d6a4aa1f63ceea3bb002c64e1ae3d7339b8d75	\N	2026-05-14 13:12:58.898+00	2026-05-14 12:57:58.898+00
9	11	ca4ffeec8c60b785b928354dc6f42d062d1a6c4ac78114c94e8a75e009db10cd	2026-05-14 13:01:28.228+00	2026-05-14 13:15:21.678+00	2026-05-14 13:00:21.678+00
10	11	eab4b02a2b044d5f646ebfd015533241cfe133be5aa465ee3c91e20fcc385257	2026-05-14 13:04:07.479+00	2026-05-14 13:18:31.411+00	2026-05-14 13:03:31.411+00
11	11	33fe45389bddb9b96d69bd30d93292f0d7cef16c346bea3cbed04d7c018109a7	2026-05-14 13:13:47.131+00	2026-05-14 13:28:36.299+00	2026-05-14 13:13:36.299+00
12	11	0716ed496b76c40b8e3f249295344e5a6b021588478106f64eb02c6be755c4b1	2026-05-14 13:28:04.617+00	2026-05-14 13:42:54.578+00	2026-05-14 13:27:54.578+00
13	11	6cc924fb56a34b648f1d315acbbb564b0adf7a8b80138dc21ecd6cfaab9a7473	\N	2026-05-14 13:52:49.578+00	2026-05-14 13:37:49.578+00
14	11	2451e8a448cb97ae27768d79b26894414cff57625c34b16ecb1673f34e6a0a4e	\N	2026-05-14 14:15:11.009+00	2026-05-14 14:00:11.009+00
15	11	9bf1cbf2fc03625809cd65bd8d2b1b0288ce9bed92ecc7f573d4e6ae6848b3bc	2026-05-14 14:03:49.086+00	2026-05-14 14:18:28.973+00	2026-05-14 14:03:28.973+00
16	11	2bdfb7fd69747d5153303affb6b7d6ecd3edcc94e4d583802bbe098904bd9dd1	2026-05-14 15:10:09.541+00	2026-05-14 15:24:51.789+00	2026-05-14 15:09:51.789+00
\.


--
-- Data for Name: flags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flags (id, post_id, comment_id, flagged_by, reason, description, status, resolved_at, created_at) FROM stdin;
\.


--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.follows (id, follower_id, following_id, created_at) FROM stdin;
\.


--
-- Data for Name: initiative_votes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.initiative_votes (id, user_id, initiative_id, created_at) FROM stdin;
\.


--
-- Data for Name: initiatives; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.initiatives (id, user_id, title, description, status, votes_count, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.likes (id, user_id, post_id, created_at) FROM stdin;
\.


--
-- Data for Name: map_nodes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.map_nodes (id, profile_id, province, city, latitude, longitude, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: petition_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.petition_comments (id, petition_id, citoyen_id, contenu, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: petition_translations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.petition_translations (id, petition_id, language, titre, description, created_at) FROM stdin;
\.


--
-- Data for Name: petitions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.petitions (id, titre, description, citoyen_id, elu_id, status, signatures_count, deadline, created_at, updated_at) FROM stdin;
2	Augmenter les investissements en transports en commun	Le réseau de transports en commun est saturé aux heures de pointe et de nombreux autobus sont en retard.\n    Nous demandons une augmentation significative des budgets alloués aux transports publics pour:\n    - Acheter de nouveaux autobus plus modernes et écologiques\n    - Augmenter la fréquence des lignes principales\n    - Étendre le réseau vers les banlieues\n    - Réduire les tarifs pour les étudiants et les personnes à revenu faible\n    Cette investissement créerait des milliers d'emplois et réduirait la congestion routière.	2	3	draft	0	\N	\N	\N
3	Protéger les forêts anciennes du Québec	Les forêts anciennes du Québec sont des écosystèmes fragiles et irremplaçables.\n    Elles abritent des espèces en danger et jouent un rôle crucial dans la lutte contre les changements climatiques.\n    Nous demandons un moratoire immédiat sur l'exploitation forestière dans les forêts de plus de 100 ans.\n    Le gouvernement doit mettre en place une stratégie de conservation long terme et investir dans\n    la recherche sur ces écosystèmes précieux pour les générations futures.	3	5	draft	0	\N	\N	\N
4	Ameliorer le transport en commun dans les petites regions.	rajouter des lignes de transport.	11	\N	draft	0	\N	\N	\N
5	textfffffff	textttfffffffffffffffffffffffffffff	11	\N	draft	0	\N	\N	\N
6	Etendre le reseau de pistes cyclables securisees a Quebec	Le reseau cyclable de Quebec ville est fragmente et incomplet. Les cyclistes ne peuvent pas se deplacer en toute securite entre les quartiers. Nous demandons a la Ville de Quebec d'investir dans la creation de pistes cyclables protegees, particulierement sur les axes Est-Ouest (Grande-Allee, Route de l'Eglise, Boulevard Hochelaga). Une infrastructure cyclable securisee encouragerait les deplacements actifs, reduirait la congestion automobile et ameliorerait la sante publique.	12	1	published	0	\N	\N	\N
7	Ameliorer la frequence des autobus RTC en banlieue de Quebec	Les citoyens des banlieues (Sainte-Foy, Sillery, Beauport) dependent du RTC pour se deplacer, mais la frequence des autobus est insuffisante. Attendre 30-40 minutes entre deux autobus decourage l'utilisation du transport en commun. Nous demandons a la Ville et au RTC d'augmenter la frequence des lignes de banlieue a au moins un autobus toutes les 15 minutes aux heures de pointe.	12	3	published	0	\N	\N	\N
8	Preserver les espaces verts du quartier Sainte-Foy contre la densification excessive	Le quartier Sainte-Foy est menace par une densification immobiliere rapide et non planifiee. Les espaces verts disparaissent pour faire place a des immeubles residentiels de grande hauteur. Nous demandons a la Ville de Quebec de proteger les parcs et boises du secteur (Parc du Bois-de-Coulonge, etc.) en adoptant un plan de conservation des espaces naturels.	12	6	published	0	\N	\N	\N
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.posts (id, user_id, title, content, category, status, likes_count, comments_count, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, user_id, full_name, phone, province, city, postal_code, interests, expertise, location_lat, location_lon, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: promise_translations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promise_translations (id, promise_id, language, titre, description, created_at) FROM stdin;
\.


--
-- Data for Name: promises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promises (id, titre, description, status, deadline, completed_at, created_at, updated_at, elu_id) FROM stdin;
\.


--
-- Data for Name: schema_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schema_versions (id, version_number, description, executed_at) FROM stdin;
1	1	Initial schema creation - core tables and tracking	2026-05-07 07:39:52.321137
\.


--
-- Data for Name: signatures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.signatures (id, petition_id, citoyen_id, created_at) FROM stdin;
\.


--
-- Data for Name: translations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.translations (id, key, fr, en, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, created_at, updated_at, nom_complet, province, code_postal, verified_at, role) FROM stdin;
1	test1@citoyenavise.com	\N	\N	Citoyen Test 1	QC	H1A 1A1	\N	citizen
2	test2@citoyenavise.com	\N	\N	Citoyen Test 2	ON	M1A 1A1	\N	citizen
3	test3@citoyenavise.com	\N	\N	Citoyen Test 3	BC	V1A 1A1	\N	citizen
4	test4@citoyenavise.com	\N	\N	Citoyen Test 4	AB	T1A 1A1	\N	citizen
5	test5@citoyenavise.com	\N	\N	Citoyen Test 5	MB	R1A 1A1	\N	citizen
6	test6@citoyenavise.com	\N	\N	Citoyen Test 6	QC	H1A 1A1	\N	citizen
7	test7@citoyenavise.com	\N	\N	Citoyen Test 7	ON	M1A 1A1	\N	citizen
8	test8@citoyenavise.com	\N	\N	Citoyen Test 8	BC	V1A 1A1	\N	citizen
9	test9@citoyenavise.com	\N	\N	Citoyen Test 9	AB	T1A 1A1	\N	citizen
10	test10@citoyenavise.com	\N	\N	Citoyen Test 10	MB	R1A 1A1	\N	citizen
11	infocitoyenavise@gmail.com	2026-05-14 04:36:43.617+00	\N	\N	\N	\N	2026-05-14 15:10:09.547+00	citizen
12	system@citoyenavise.org	\N	\N	Systeme Citoyen Avise	QC	G1R 0A0	\N	citizen
\.


--
-- Name: actualite_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.actualite_translations_id_seq', 1, false);


--
-- Name: actualites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.actualites_id_seq', 1, false);


--
-- Name: analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.analytics_id_seq', 1, false);


--
-- Name: circonscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.circonscriptions_id_seq', 1, false);


--
-- Name: comment_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comment_translations_id_seq', 1, false);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- Name: content_pages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.content_pages_id_seq', 1, false);


--
-- Name: education_resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.education_resources_id_seq', 1, false);


--
-- Name: elus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.elus_id_seq', 6, true);


--
-- Name: email_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_verifications_id_seq', 16, true);


--
-- Name: flags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.flags_id_seq', 1, false);


--
-- Name: follows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.follows_id_seq', 1, false);


--
-- Name: initiative_votes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.initiative_votes_id_seq', 1, false);


--
-- Name: initiatives_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.initiatives_id_seq', 1, false);


--
-- Name: likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.likes_id_seq', 1, false);


--
-- Name: map_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.map_nodes_id_seq', 1, false);


--
-- Name: petition_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.petition_comments_id_seq', 1, false);


--
-- Name: petition_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.petition_translations_id_seq', 1, false);


--
-- Name: petitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.petitions_id_seq', 8, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.posts_id_seq', 1, false);


--
-- Name: profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profiles_id_seq', 1, false);


--
-- Name: promise_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.promise_translations_id_seq', 1, false);


--
-- Name: promises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.promises_id_seq', 1, false);


--
-- Name: schema_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.schema_versions_id_seq', 1, true);


--
-- Name: signatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.signatures_id_seq', 1, true);


--
-- Name: translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.translations_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 12, true);


--
-- Name: actualite_translations actualite_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actualite_translations
    ADD CONSTRAINT actualite_translations_pkey PRIMARY KEY (id);


--
-- Name: actualites actualites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actualites
    ADD CONSTRAINT actualites_pkey PRIMARY KEY (id);


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);


--
-- Name: circonscriptions circonscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circonscriptions
    ADD CONSTRAINT circonscriptions_pkey PRIMARY KEY (id);


--
-- Name: comment_translations comment_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_translations
    ADD CONSTRAINT comment_translations_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: content_pages content_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_pages
    ADD CONSTRAINT content_pages_pkey PRIMARY KEY (id);


--
-- Name: content_pages content_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_pages
    ADD CONSTRAINT content_pages_slug_key UNIQUE (slug);


--
-- Name: education_resources education_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_resources
    ADD CONSTRAINT education_resources_pkey PRIMARY KEY (id);


--
-- Name: elus elus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.elus
    ADD CONSTRAINT elus_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_token_key UNIQUE (token);


--
-- Name: email_verifications email_verifications_token_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_token_key1 UNIQUE (token);


--
-- Name: flags flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flags
    ADD CONSTRAINT flags_pkey PRIMARY KEY (id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: initiative_votes initiative_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_votes
    ADD CONSTRAINT initiative_votes_pkey PRIMARY KEY (id);


--
-- Name: initiatives initiatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiatives
    ADD CONSTRAINT initiatives_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: map_nodes map_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.map_nodes
    ADD CONSTRAINT map_nodes_pkey PRIMARY KEY (id);


--
-- Name: petition_comments petition_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petition_comments
    ADD CONSTRAINT petition_comments_pkey PRIMARY KEY (id);


--
-- Name: petition_translations petition_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petition_translations
    ADD CONSTRAINT petition_translations_pkey PRIMARY KEY (id);


--
-- Name: petitions petitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petitions
    ADD CONSTRAINT petitions_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: promise_translations promise_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promise_translations
    ADD CONSTRAINT promise_translations_pkey PRIMARY KEY (id);


--
-- Name: promises promises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promises
    ADD CONSTRAINT promises_pkey PRIMARY KEY (id);


--
-- Name: schema_versions schema_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_versions
    ADD CONSTRAINT schema_versions_pkey PRIMARY KEY (id);


--
-- Name: schema_versions schema_versions_version_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_versions
    ADD CONSTRAINT schema_versions_version_number_key UNIQUE (version_number);


--
-- Name: signatures signatures_petition_id_citoyen_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_petition_id_citoyen_id_key UNIQUE (petition_id, citoyen_id);


--
-- Name: signatures signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_pkey PRIMARY KEY (id);


--
-- Name: translations translations_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_key_key UNIQUE (key);


--
-- Name: translations translations_key_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_key_key1 UNIQUE (key);


--
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: actualite_translations_actualite_id_language; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX actualite_translations_actualite_id_language ON public.actualite_translations USING btree (actualite_id, language);


--
-- Name: actualite_translations_language; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX actualite_translations_language ON public.actualite_translations USING btree (language);


--
-- Name: comment_translations_comment_id_language; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX comment_translations_comment_id_language ON public.comment_translations USING btree (comment_id, language);


--
-- Name: comment_translations_language; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comment_translations_language ON public.comment_translations USING btree (language);


--
-- Name: idx_content_pages_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_pages_published ON public.content_pages USING btree (is_published);


--
-- Name: idx_content_pages_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_pages_slug ON public.content_pages USING btree (slug);


--
-- Name: idx_flags_flagged_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flags_flagged_by ON public.flags USING btree (flagged_by);


--
-- Name: idx_flags_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flags_post_id ON public.flags USING btree (post_id);


--
-- Name: idx_flags_resolved_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flags_resolved_at ON public.flags USING btree (resolved_at);


--
-- Name: idx_follows_follower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follows_follower_id ON public.follows USING btree (follower_id);


--
-- Name: idx_follows_following_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follows_following_id ON public.follows USING btree (following_id);


--
-- Name: idx_follows_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_follows_unique ON public.follows USING btree (follower_id, following_id);


--
-- Name: idx_likes_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_post_id ON public.likes USING btree (post_id);


--
-- Name: idx_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_user_id ON public.likes USING btree (user_id);


--
-- Name: idx_likes_user_post; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_likes_user_post ON public.likes USING btree (user_id, post_id);


--
-- Name: idx_map_nodes_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_map_nodes_profile_id ON public.map_nodes USING btree (profile_id);


--
-- Name: idx_map_nodes_province; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_map_nodes_province ON public.map_nodes USING btree (province);


--
-- Name: idx_posts_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_category ON public.posts USING btree (category);


--
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at DESC);


--
-- Name: idx_posts_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_deleted_at ON public.posts USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_status ON public.posts USING btree (status);


--
-- Name: idx_posts_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_user_created ON public.posts USING btree (user_id, created_at DESC);


--
-- Name: idx_posts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_user_id ON public.posts USING btree (user_id);


--
-- Name: idx_profiles_province; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_province ON public.profiles USING btree (province);


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: petition_comments_citoyen_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX petition_comments_citoyen_id ON public.petition_comments USING btree (citoyen_id);


--
-- Name: petition_comments_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX petition_comments_created_at ON public.petition_comments USING btree (created_at);


--
-- Name: petition_comments_petition_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX petition_comments_petition_id ON public.petition_comments USING btree (petition_id);


--
-- Name: petition_translations_language; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX petition_translations_language ON public.petition_translations USING btree (language);


--
-- Name: petition_translations_petition_id_language; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX petition_translations_petition_id_language ON public.petition_translations USING btree (petition_id, language);


--
-- Name: promise_translations_language; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promise_translations_language ON public.promise_translations USING btree (language);


--
-- Name: promise_translations_promise_id_language; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX promise_translations_promise_id_language ON public.promise_translations USING btree (promise_id, language);


--
-- Name: signatures_petition_id_citoyen_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX signatures_petition_id_citoyen_id ON public.signatures USING btree (petition_id, citoyen_id);


--
-- Name: actualite_translations actualite_translations_actualite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actualite_translations
    ADD CONSTRAINT actualite_translations_actualite_id_fkey FOREIGN KEY (actualite_id) REFERENCES public.actualites(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: actualites actualites_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actualites
    ADD CONSTRAINT actualites_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: analytics analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comment_translations comment_translations_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_translations
    ADD CONSTRAINT comment_translations_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.petition_comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: email_verifications email_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flags flags_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flags
    ADD CONSTRAINT flags_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: flags flags_flagged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flags
    ADD CONSTRAINT flags_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: flags flags_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flags
    ADD CONSTRAINT flags_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: initiative_votes initiative_votes_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_votes
    ADD CONSTRAINT initiative_votes_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.initiatives(id) ON DELETE CASCADE;


--
-- Name: initiative_votes initiative_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_votes
    ADD CONSTRAINT initiative_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: initiatives initiatives_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiatives
    ADD CONSTRAINT initiatives_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: likes likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: likes likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: map_nodes map_nodes_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.map_nodes
    ADD CONSTRAINT map_nodes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: petition_comments petition_comments_citoyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petition_comments
    ADD CONSTRAINT petition_comments_citoyen_id_fkey FOREIGN KEY (citoyen_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: petition_comments petition_comments_petition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petition_comments
    ADD CONSTRAINT petition_comments_petition_id_fkey FOREIGN KEY (petition_id) REFERENCES public.petitions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: petition_translations petition_translations_petition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petition_translations
    ADD CONSTRAINT petition_translations_petition_id_fkey FOREIGN KEY (petition_id) REFERENCES public.petitions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: petitions petitions_citoyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petitions
    ADD CONSTRAINT petitions_citoyen_id_fkey FOREIGN KEY (citoyen_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: petitions petitions_elu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petitions
    ADD CONSTRAINT petitions_elu_id_fkey FOREIGN KEY (elu_id) REFERENCES public.elus(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promise_translations promise_translations_promise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promise_translations
    ADD CONSTRAINT promise_translations_promise_id_fkey FOREIGN KEY (promise_id) REFERENCES public.promises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promises promises_elu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promises
    ADD CONSTRAINT promises_elu_id_fkey FOREIGN KEY (elu_id) REFERENCES public.elus(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: signatures signatures_citoyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_citoyen_id_fkey FOREIGN KEY (citoyen_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: signatures signatures_petition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_petition_id_fkey FOREIGN KEY (petition_id) REFERENCES public.petitions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict FbuT0E4tmHWrtly6SeWG1enSwgdFGLPEDPJ4esF8fjTsypeJcd6sFkryz6BOfmN

