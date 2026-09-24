-- Rooms live in D1. Only name, description and grid position are stored; the
-- exits are worked out in the app from which rooms sit next to each other, so
-- adding one row adds a room and its doors.
CREATE TABLE rooms (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (x, y)
);

INSERT INTO rooms (x, y, name, description) VALUES
  (0, 0, 'Spiral stair', 'The iron spiral stair coils up through the heart of the tower, its treads worn shallow by decades of boots. Cold air falls from the lamp room above and the kitchen lies a few steps down.'),
  (1, 0, 'Lamp room', 'Glass panes wrap the lamp room on every side and the great lens sits dark and patient at its centre. A steep hatch in the roof leads up to the gallery, and far below the sea works endlessly against the rocks.'),
  (0, 1, 'Keeper’s kitchen', 'A cold cast-iron stove and a single chair furnish the keeper’s kitchen, and a mug of tea has long gone to scum on the table. A narrow doorway opens onto the foot of the stair.'),
  (1, 1, 'The rocks', 'You stand on the black, weed-slick rocks at the foot of the lighthouse as spray bursts around your knees. The tower door hangs open to the north and a low path skirts the base to the west.'),
  (1, -1, 'The gallery', 'You step onto the narrow gallery that circles the lantern, the wind snatching at your coat. The beam sweeps over a black sea and a sky thick with stars.');
