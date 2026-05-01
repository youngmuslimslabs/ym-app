-- Adds a dedicated tagline column to conferences.
-- Before this, the attendee page split conferences.description on the first
-- period to derive a hero headline, which was fragile (a description without
-- early punctuation became a multi-line h1) and confusing for admins
-- (description was secretly load-bearing for the headline).
--
-- After this:
--   conferences.name        → canonical title used in sidebars/lists
--   conferences.tagline     → optional hero headline ("Building together, ...")
--   conferences.description → optional long-form copy for "About" sections

ALTER TABLE conferences
  ADD COLUMN tagline TEXT;
