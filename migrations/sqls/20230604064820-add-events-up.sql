/* Replace with your SQL commands */

create extension if not exists "uuid-ossp";

create type event_source as enum
    ('skillboxes');

create function update_modified_timestamp() returns trigger
    language plpgsql as
$$
begin
new.updated_at := current_timestamp;
return new;
end;
$$;

create table events(
                       id uuid primary key default uuid_generate_v4(),
                       source event_source not null,
                       start_date date not null,
                       start_time time,
                       end_date date,
                       end_time time,
                       name text not null,
                       backlink text not null,
                       location text,
                       price text,
                       genre text[],
                       created_at timestamptz not null default now(),
                       updated_at timestamptz not null default now()
);

create trigger update_timestamp before update on events for each row execute procedure update_modified_timestamp();
