/* Replace with your SQL commands */
alter type event_source rename to event_source_old;
create type event_source as enum ('skillboxes');
alter table events
    alter column source type event_source using source::text::event_source;
drop type event_source_old;
