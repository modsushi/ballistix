/**
 * The models we actually place. Kept dependency-free so `tools/sync-models.mjs`
 * can import it and extract exactly this set from the Kenney zips — every entry
 * here is bytes on a phone connection, and the kits ship ~250 models we don't use.
 */

export const SPACE = 'models/space/';
export const STATION = 'models/station/';

export const MANIFEST = [
  // --- player craft --------------------------------------------------------
  ['craft_speederA', SPACE], ['craft_speederB', SPACE],
  ['craft_speederC', SPACE], ['craft_speederD', SPACE],

  // --- arena rim & substructure -------------------------------------------
  ['structure', SPACE], ['structure_detailed', SPACE], ['structure_diagonal', SPACE],
  ['supports_high', SPACE], ['supports_low', SPACE],
  ['platform_large', SPACE], ['platform_long', SPACE], ['platform_high', SPACE],
  ['rail_middle', SPACE], ['rail_end', SPACE],
  ['pipe_straight', SPACE], ['pipe_ring', SPACE], ['pipe_ringHigh', SPACE],
  ['pipe_supportHigh', SPACE], ['pipe_corner', SPACE],

  // --- greebles around the perimeter --------------------------------------
  ['machine_generator', SPACE], ['machine_generatorLarge', SPACE],
  ['machine_wireless', SPACE],
  ['satelliteDish', SPACE], ['satelliteDish_large', SPACE],
  ['turret_single', SPACE], ['turret_double', SPACE],
  ['hangar_roundA', SPACE], ['hangar_smallB', SPACE],
  ['barrels', SPACE], ['barrels_rail', SPACE],
  ['rocket_baseA', SPACE], ['rocket_fuelA', SPACE],
  ['monorail_trackStraight', SPACE], ['monorail_trackSupport', SPACE],
  ['rock_crystals', SPACE], ['rock_crystalsLargeA', SPACE],
  ['meteor', SPACE], ['meteor_detailed', SPACE], ['rock_largeA', SPACE],

  // --- station kit detail --------------------------------------------------
  ['container', STATION], ['container-tall', STATION],
  ['structure-barrier-high', STATION], ['structure-panel', STATION],
  ['display-wall', STATION], ['computer-wide', STATION],
];
