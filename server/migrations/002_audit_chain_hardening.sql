ALTER TABLE audit_events
ADD COLUMN chain_index BIGSERIAL;

ALTER TABLE audit_events
ADD CONSTRAINT audit_events_chain_index_unique
UNIQUE (chain_index);