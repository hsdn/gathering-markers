/* eslint-disable no-param-reassign */
"use strict";

const DefaultSettings = {
	"enabled": true,
	"alert": false,

	// Plants
	"harmony_grass": true,
	"wild_cobseed": true,
	"wild_veridia": true,
	"orange_mushroom": true,
	"moongourd": true,
	"apple_tree": true,
	"onyxite_rosemary": true,
	// "dawnbloom_leaf": true,

	// Mining
	"plain_stone": true,
	"cobala_ore": true,
	"shadmetal_ore": true,
	"xermetal_ore": true,
	"normetal_ore": true,
	"galborne_ore": true,
	"pure_duranium_ore": true,
	"exodor_ore": true,
	"onyxite_ore": true,
	// "dawnsteel_ore": true,

	// Energy
	"achromic_essence": true,
	"crimson_essence": true,
	"earth_essence": true,
	"azure_essence": true,
	"opal_essence": true,
	"obsidian_essence": true,
	"pure_duranium_crystal": true,
	// "lumin_essence": true
};

module.exports = function MigrateSettings(from_ver, to_ver, settings) {
	if (from_ver === undefined) return { ...DefaultSettings, ...settings };
	else if (from_ver === null) return DefaultSettings;
	else {
		from_ver = Number(from_ver);
		to_ver = Number(to_ver);

		if (from_ver + 1 < to_ver) {
			settings = MigrateSettings(from_ver, from_ver + 1, settings);
			return MigrateSettings(from_ver + 1, to_ver, settings);
		}

		const oldsettings = settings;

		switch (to_ver) {
			default:
				settings = Object.assign(DefaultSettings, {});

				for (const option in oldsettings) {
					if (settings[option] !== undefined) {
						settings[option] = oldsettings[option];
					}
				}
		}

		return settings;
	}
};
