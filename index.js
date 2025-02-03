const SettingsUI = require("tera-mod-ui").Settings;

module.exports = function GatheringMarkers(mod) {
	let gui = null;
	const MSG = new TeraMessage(mod);
	const spawnedItems = new Map();
	const spawnedMarkers = new Set();
	const gatheringItemNames = new Map();

	const gatheringItems = {
		"dawnsteel_ore": 590,
		"lumin_essence": 591,
		"dawnbloom_leaf": 592,
		"harmony_grass": 1,
		"wild_cobseed": 2,
		"wild_veridia": 3,
		"orange_mushroom": 4,
		"moongourd": 5,
		"apple_tree": 6,
		"plain_stone": 101,
		"cobala_ore": 102,
		"shadmetal_ore": 103,
		"xermetal_ore": 104,
		"normetal_ore": 105,
		"galborne_ore": 106,
		"pure_duranium_ore": 301,
		"achromic_essence": 201,
		"crimson_essence": 202,
		"earth_essence": 203,
		"azure_essence": 204,
		"opal_essence": 205,
		"obsidian_essence": 206,
		"pure_duranium_crystal": 601
	};

	mod.command.add("gat", {
		"ui": () => showGui(),
		"$none": () => {
			mod.settings.enabled = !mod.settings.enabled;
			MSG.chat(`Module ${mod.settings.enabled ? "enabled" : "disabled"}`);

			respawnMarkers();
		}
	});

	mod.game.on("enter_character_lobby", async () => {
		await applyGatheringItemNames();

		if (global.TeraProxy.GUIMode) {
			gui = new SettingsUI(mod, getSettingsStructure(), mod.settings, {
				"width": 400,
				"height": 720,
				"resizable": false
			});

			gui.on("update", settings => {
				mod.settings = settings;
				respawnMarkers();
			});
		}
	});

	async function applyGatheringItemNames() {
		(await mod.queryData("/StrSheet_Collections/String@collectionId=?", [[...Object.values(gatheringItems)]], true))
			.forEach(res => gatheringItemNames.set(res.attributes.collectionId, res.attributes.string));
	}

	mod.hook("S_LOAD_TOPO", 3, () => {
		spawnedItems.clear();
		spawnedMarkers.clear();
	});

	mod.hook("S_SPAWN_COLLECTION", 4, event => {
		if (!mod.settings.enabled || !Object.values(gatheringItems).includes(event.id)) return;

		const itemKey = Object.keys(gatheringItems).find(k => gatheringItems[k] === event.id);
		const itemString = `Found ${MSG.BLU(gatheringItemNames.get(event.id))}`;

		if (mod.settings[itemKey] === true && mod.settings.alert) {
			MSG.chat(itemString);
			MSG.raids(itemString);
		}

		spawnedItems.set(event.gameId, event);
		respawnMarkers();
	});

	mod.hook("S_DESPAWN_COLLECTION", 2, event => {
		if (!mod.settings.enabled || !spawnedItems.has(event.gameId)) return;

		spawnedItems.set(event.gameId, null);
		respawnMarkers();
	});

	function respawnMarkers() {
		spawnedItems.forEach((event, itemId) => {
			if (mod.settings.enabled && event !== null) {
				const itemKey = Object.keys(gatheringItems).find(k => gatheringItems[k] === event.id);

				if (itemKey && mod.settings[itemKey] === true) {
					return spawnMarker(itemId, event.loc);
				}
			}

			despawnMarker(itemId);
		});
	}

	function spawnMarker(gameId, loc) {
		if (spawnedMarkers.has(gameId)) return;

		const itemLoc = { ...loc };
		itemLoc.z -= 100;

		mod.send("S_SPAWN_DROPITEM", mod.majorPatchVersion >= 99 ? 9 : 8, {
			"gameId": gameId * 10n,
			"loc": itemLoc,
			"item": 88704,
			"amount": 1,
			"expiry": 0,
			"owners": []
		});

		spawnedMarkers.add(gameId);
	}

	function despawnMarker(gameId) {
		if (!spawnedMarkers.has(gameId)) return;

		mod.send("S_DESPAWN_DROPITEM", 4, {
			"gameId": gameId * 10n
		});

		spawnedMarkers.delete(gameId);
	}

	function showGui() {
		if (!gui) return;

		gui.show();

		if (gui.ui.window) {
			gui.ui.window.webContents.on("did-finish-load", () => {
				gui.ui.window.webContents.executeJavaScript(
					"!function(){var e=document.getElementById('close-btn');e.style.cursor='default',e.onclick=function(){window.parent.close()}}();"
				);
			});
		}
	}

	function getSettingsStructure() {
		const settingsStructure = [{
			"key": "enabled",
			"name": "Module Enabled",
			"type": "bool"
		},
		{
			"key": "alert",
			"name": "Alert Messages",
			"type": "bool"
		}];

		Object.values(gatheringItems).forEach(itemId => {
			let color = "#60bb60";
			if ((itemId >= 101 && itemId <= 106) || itemId === 301) color = "#db6060";
			if ((itemId >= 201 && itemId <= 206) || itemId === 601) color = "#6060db";

			settingsStructure.push({
				"key": Object.keys(gatheringItems).find(k => gatheringItems[k] === itemId),
				"name": `<span style="color:${color}">${gatheringItemNames.get(parseInt(itemId))}</span>`,
				"type": "bool"
			});
		});

		return settingsStructure;
	}

	this.destructor = () => {
		if (gui) {
			gui.close();
			gui = null;
		}

		spawnedItems.clear();
		spawnedMarkers.clear();
		mod.command.remove("gat");
	};
};

class TeraMessage {
	constructor(mod) {
		this.mod = mod;
	}

	clr(text, hexColor) {
		return `<font color="#${hexColor}">${text}</font>`;
	}

	RED(text) {
		return `<font color="#FF0000">${text}</font>`;
	}

	BLU(text) {
		return `<font color="#56B4E9">${text}</font>`;
	}

	YEL(text) {
		return `<font color="#E69F00">${text}</font>`;
	}

	TIP(text) {
		return `<font color="#00FFFF">${text}</font>`;
	}

	GRY(text) {
		return `<font color="#A0A0A0">${text}</font>`;
	}

	PIK(text) {
		return `<font color="#FF00DC">${text}</font>`;
	}

	chat(msg) {
		this.mod.command.message(msg);
	}

	party(msg) {
		this.mod.send("S_CHAT", this.mod.majorPatchVersion >= 108 ? 4 : 3, {
			"channel": 21,
			"message": msg
		});
	}

	raids(msg) {
		this.mod.send("S_CHAT", this.mod.majorPatchVersion >= 108 ? 4 : 3, {
			"channel": 25,
			"message": msg
		});
	}

	alert(msg, type) {
		this.mod.send("S_DUNGEON_EVENT_MESSAGE", 2, {
			"type": type,
			"chat": false,
			"channel": 0,
			"message": msg
		});
	}
}
