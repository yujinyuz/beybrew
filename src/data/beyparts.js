// TODO: Is there a better way to do this? Like probably each beyblade has its own file
// and dynamically import it. It might make adding new parts easier and we can add in pointers
// to where specific parts can be found
const parts = {
  blades: [
    {
      name: "Silver Wolf",
      points: 3,
      attack: 15,
      defense: 30,
      stamina: 65,
      type: "stamina",
      image: "Silver_Wolf_3-80FB.webp",
    },
    {
      name: "Aero Pegasus",
      points: 2,
      type: "attack",
      image: "Aero_Pegasus_3-70A.webp",
    },
    {
      name: "Samurai Saber",
      points: 2,
      type: "attack",
      image: "BladeSamuraiSaber.webp",
    },
    {
      name: "Knight Mail",
      points: 2,
      type: "defense",
      image: "Knight_Mail_3-85BS.webp",
    },
    {
      name: "Ptera Swing",
      points: 1,
      type: "stamina",
      image: "Talon_Ptera_3-80B.webp",
    },
    {
      name: "Crimson Garuda",
      points: 1,
      type: "balance",
      image: "Crimson_Garuda_4-70TP.webp",
    },
    {
      name: "L-Drago",
      points: 1,
      type: "attack",
      image: "X_Random_Booster_Lightning_L-Drago_1-60F_Contents.webp",
    },
    {
      name: "Black Shell",
      points: 1,
      attack: 10,
      defense: 65,
      stamina: 25,
      type: "defense",
      image: "Black_Shell_4-60D.webp",
    },
    {
      name: "Cobalt Dragoon",
      points: 3,
      attack: 60,
      defense: 15,
      stamina: 25,
      type: "attack",
      spinType: "left",
      image: "Cobalt_Dragoon_2-60C.webp",
    },
    {
      name: "Cobalt Drake",
      points: 3,
      attack: 70,
      defense: 35,
      stamina: 25,
      type: "attack",
      image: "Cobalt_Drake_4-60F.webp",
    },
    {
      name: "Dran Buster",
      points: 3,
      attack: 70,
      defense: 20,
      stamina: 10,
      type: "attack",
      image: "Dran_Buster_1-60A.webp",
    },
    {
      name: "Dran Dagger",
      points: 2,
      attack: 50,
      defense: 25,
      stamina: 25,
      type: "attack",
      image: "Dran_Dagger_4-60R.webp",
    },
    {
      name: "Dran Sword",
      points: 2,
      attack: 55,
      defense: 25,
      stamina: 20,
      type: "attack",
      image: "Dran_Sword_3-60F.webp",
    },
    {
      name: "Dranzer Spiral",
      points: 1,
      attack: 35,
      defense: 30,
      stamina: 35,
      type: "balance",
      image: "Dranzer_Spiral_3-80T.webp",
    },
    {
      name: "Driger Slash",
      points: 1,
      attack: 40,
      defense: 35,
      stamina: 25,
      type: "balance",
      image: "Driger_Slash_4-80P.webp",
    },
    {
      name: "Hells Chain",
      points: 2,
      attack: 35,
      defense: 40,
      stamina: 25,
      type: "balance",
      image: "Hells_Chain_5-60HT.webp",
    },
    {
      name: "Hells Hammer",
      points: 1,
      attack: 50,
      defense: 25,
      stamina: 25,
      type: "balance",
      image: "Hells_Hammer_3-70H.webp",
    },
    {
      name: "Hells Scythe",
      points: 2,
      attack: 30,
      defense: 35,
      stamina: 35,
      type: "balance",
      image: "Hells_Scythe_4-60T.webp",
    },
    {
      name: "Knight Lance",
      points: 2,
      attack: 25,
      defense: 60,
      stamina: 15,
      type: "defense",
      image: "Knight_Lance_4-80HN.webp",
    },
    {
      name: "Knight Shield",
      points: 1,
      attack: 20,
      defense: 55,
      stamina: 25,
      type: "defense",
      image: "Knight_Shield_3-80N.webp",
    },
    {
      name: "Leon Claw",
      points: 1,
      attack: 40,
      defense: 40,
      stamina: 20,
      type: "balance",
      image: "Leon_Claw_5-60P.webp",
    },
    {
      name: "Leon Crest",
      points: 1,
      attack: 15,
      defense: 70,
      stamina: 15,
      type: "defense",
      image: "Leon_Crest_7-60GN.webp",
    },
    {
      name: "Phoenix Feather",
      points: 2,
      attack: 50,
      defense: 20,
      stamina: 30,
      type: "attack",
      image: "BladePhoenixFeather.webp",
    },
    {
      name: "Phoenix Rudder",
      points: 2,
      attack: 15,
      defense: 40,
      stamina: 60,
      type: "stamina",
      image: "Phoenix_Rudder_9-70G.webp",
    },
    {
      name: "Phoenix Wing",
      points: 3,
      attack: 65,
      defense: 30,
      stamina: 20,
      type: "attack",
      image: "Phoenix_Wing_9-60GF.webp",
    },
    {
      name: "Rhino Horn",
      points: 1,
      attack: 20,
      defense: 50,
      stamina: 30,
      type: "defense",
      image: "Rhino_Horn_3-80S.webp",
    },
    {
      name: "Shark Edge",
      points: 2,
      attack: 60,
      defense: 25,
      stamina: 15,
      type: "attack",
      image: "Shark_Edge_3-60LF.webp",
    },
    {
      name: "Shinobi Shadow",
      points: 1,
      attack: 10,
      defense: 70,
      stamina: 20,
      type: "defense",
      image: "Shinobi_Shadow_1-80MN.webp",
    },
    {
      name: "Sphinx Cowl",
      points: 1,
      attack: 35,
      defense: 55,
      stamina: 10,
      type: "defense",
      image: "Sphinx_Cowl_9-80GN.webp",
    },
    {
      name: "Tyranno Beat",
      points: 3,
      attack: 65,
      defense: 30,
      stamina: 5,
      type: "attack",
      image: "Tyranno_Beat_4-70Q.webp",
    },
    {
      name: "Unicorn Sting",
      points: 2,
      attack: 35,
      defense: 35,
      stamina: 30,
      type: "balance",
      image: "Unicorn_Sting_5-60GP.webp",
    },
    {
      name: "Viper Tail",
      points: 1,
      attack: 30,
      defense: 20,
      stamina: 50,
      type: "stamina",
      image: "Viper_Tail_5-80O.webp",
    },
    {
      name: "Weiss Tiger",
      points: 2,
      attack: 45,
      defense: 30,
      stamina: 25,
      type: "balance",
      image: "Weiss_Tiger_3-60U.webp",
    },
    {
      name: "Whale Wave",
      points: 2,
      attack: 45,
      defense: 35,
      stamina: 20,
      type: "balance",
      image: "Whale_Wave_5-80E.webp",
    },
    {
      name: "Wizard Arrow",
      points: 2,
      attack: 15,
      defense: 30,
      stamina: 55,
      type: "stamina",
      image: "Wizard_Arrow_4-80B.webp",
    },
    {
      name: "Wizard Rod",
      points: 4,
      attack: 15,
      defense: 25,
      stamina: 60,
      type: "stamina",
      image: "Wizard_Rod_5-70DB.webp",
    },
    {
      name: "Wyvern Gale",
      points: 1,
      attack: 10,
      defense: 40,
      stamina: 50,
      type: "stamina",
      image: "Wyvern_Gale_5-80GB.webp",
    },
  ],
  ratchets: [
    {
      name: "1-60",
      points: 1,
      attack: 17,
      defense: 9,
      stamina: 4,
      type: "attack",
    },
    {
      name: "1-80",
      points: 1,
      attack: 17,
      defense: 9,
      stamina: 4,
      type: "defense",
    },
    {
      name: "2-60",
      points: 1,
      attack: 16,
      defense: 8,
      stamina: 6,
      type: "attack",
    },
    {
      name: "2-70",
      points: 1,
    },
    {
      name: "2-80",
      points: 1,
      attack: 10,
      defense: 11,
      stamina: 9,
      type: "balance",
    },
    {
      name: "3-60",
      points: 2,
      attack: 15,
      defense: 9,
      stamina: 8,
      type: "attack",
    },
    {
      name: "3-70",
      points: 2,
      attack: 15,
      defense: 8,
      stamina: 7,
      type: "balance",
    },
    {
      name: "3-80",
      points: 1,
      attack: 15,
      defense: 7,
      stamina: 8,
      type: "defense",
    },
    {
      name: "3-85",
      points: 1,
    },
    {
      name: "4-60",
      points: 2,
      attack: 11,
      defense: 13,
      stamina: 6,
      type: "balance",
    },
    {
      name: "4-70",
      points: 2,
      attack: 11,
      defense: 12,
      stamina: 7,
      type: "attack",
    },
    {
      name: "4-80",
      points: 1,
      attack: 11,
      defense: 11,
      stamina: 8,
      type: "stamina",
    },
    {
      name: "5-60",
      points: 3,
      attack: 12,
      defense: 9,
      stamina: 9,
      type: "balance",
    },
    {
      name: "5-70",
      points: 2,
      attack: 12,
      defense: 8.5,
      stamina: 9.5,
      type: "stamina",
    },
    {
      name: "5-80",
      points: 1,
      attack: 12,
      defense: 8,
      stamina: 10,
      type: "balance",
    },
    {
      name: "7-60",
      points: 3,
      attack: 8,
      defense: 14,
      stamina: 8,
      type: "defense",
    },
    {
      name: "7-70",
      points: 2,
    },

    {
      name: "9-60",
      points: 3,
      attack: 13,
      defense: 10,
      stamina: 7,
      type: "attack",
    },
    {
      name: "9-70",
      points: 2,
      attack: 13,
      defense: 10,
      stamina: 7,
      type: "stamina",
    },
    {
      name: "9-80",
      points: 1,
      attack: 13,
      defense: 10,
      stamina: 7,
      type: "defense",
    },
  ],
  bits: [
    {
      name: "Accel",
      alias: "A",
      points: 1,
      attack: 40,
      defense: 10,
      stamina: 24,
      xDash: 40,
      burstResistance: 80,
      type: "attack",
    },
    {
      name: "Ball",
      alias: "B",
      points: 4,
      attack: 15,
      defense: 25,
      stamina: 50,
      xDash: 10,
      burstResistance: 30,
      type: "stamina",
    },
    {
      name: "Cyclone",
      alias: "C",
      points: 1,
      attack: 40,
      defense: 5,
      stamina: 10,
      xDash: 45,
      burstResistance: 80,
      type: "attack",
    },
    {
      name: "Disc Ball",
      alias: "DB",
      points: 1,
      attack: 15,
      defense: 20,
      stamina: 55,
      xDash: 10,
      burstResistance: 30,
      type: "stamina",
    },
    {
      name: "Dot",
      alias: "D",
      points: 1,
      attack: 10,
      defense: 55,
      stamina: 25,
      xDash: 10,
      burstResistance: 30,
      type: "defense",
    },
    {
      name: "Elevate",
      alias: "E",
      points: 3,
      attack: 30,
      defense: 15,
      stamina: 20,
      xDash: 35,
      burstResistance: 30,
      type: "balance",
    },
    {
      name: "Flat",
      alias: "F",
      points: 1,
      attack: 40,
      defense: 15,
      stamina: 10,
      xDash: 35,
      burstResistance: 80,
      type: "attack",
    },
    {
      name: "Gear Ball",
      alias: "GB",
      points: 1,
      attack: 10,
      defense: 15,
      stamina: 45,
      xDash: 30,
      burstResistance: 30,
      type: "stamina",
    },
    {
      name: "Gear Flat",
      alias: "GF",
      points: 1,
      attack: 50,
      defense: 5,
      stamina: 5,
      xDash: 40,
      burstResistance: 80,
      type: "attack",
    },
    {
      name: "Gear Needle",
      alias: "GN",
      points: 1,
      attack: 20,
      defense: 40,
      stamina: 10,
      xDash: 30,
      burstResistance: 30,
      type: "defense",
    },
    {
      name: "Gear Point",
      alias: "GP",
      points: 2,
      attack: 30,
      defense: 25,
      stamina: 15,
      xDash: 30,
      burstResistance: 80,
      type: "attack",
    },
    {
      name: "Glide",
      alias: "G",
      points: 2,
      attack: 20,
      defense: 10,
      stamina: 55,
      xDash: 15,
      burstResistance: 30,
      type: "stamina",
    },
    {
      name: "Hexa",
      alias: "H",
      points: 2,
      attack: 30,
      defense: 35,
      stamina: 20,
      xDash: 15,
      burstResistance: 80,
      type: "balance",
    },
    {
      name: "High Needle",
      alias: "HN",
      points: 2,
      attack: 15,
      defense: 55,
      stamina: 20,
      xDash: 10,
      burstResistance: 30,
      type: "defense",
    },
    {
      name: "High Taper",
      alias: "HT",
      points: 2,
      attack: 30,
      defense: 25,
      stamina: 20,
      xDash: 25,
      burstResistance: 80,
      type: "balance",
    },
    {
      name: "Low Flat",
      alias: "LF",
      points: 2,
      attack: 45,
      defense: 5,
      stamina: 10,
      xDash: 10,
      burstResistance: 80,
      type: "attack",
    },
    {
      name: "Metal Needle",
      alias: "MN",
      points: 99,
      attack: 8,
      defense: 57,
      stamina: 30,
      xDash: 5,
      burstResistance: 30,
      type: "defense",
    },
    {
      name: "Needle",
      alias: "N",
      points: 1,
      attack: 10,
      defense: 50,
      stamina: 30,
      xDash: 10,
      burstResistance: 30,
      type: "defense",
    },
    {
      name: "Orb",
      alias: "O",
      points: 3,
      attack: 10,
      defense: 30,
      stamina: 50,
      xDash: 10,
      burstResistance: 30,
      type: "stamina",
    },
    {
      name: "Point",
      alias: "P",
      points: 2,
      attack: 25,
      defense: 25,
      stamina: 25,
      xDash: 25,
      burstResistance: 80,
      type: "balance",
    },
    {
      name: "Quake",
      alias: "Q",
      points: 1,
      attack: 55,
      defense: 15,
      stamina: 5,
      xDash: 25,
      burstResistance: 80,
      type: "attack",
    },
    {
      name: "Rush",
      alias: "R",
      points: 3,
      attack: 40,
      defense: 10,
      stamina: 20,
      xDash: 30,
      burstResistance: 80,
      type: "attack",
    },
    {
      name: "Low Rush",
      alias: "LR",
      points: 3,
      attack: null,
      defense: null,
      stamina: null,
      xDash: null,
      burstResistance: 80,
      type: "attack",
    },
    {
      name: "Spike",
      alias: "S",
      points: 1,
      attack: 10,
      defense: 45,
      stamina: 35,
      xDash: 10,
      burstResistance: 30,
      type: "defense",
    },
    {
      name: "Taper",
      alias: "T",
      points: 2,
      attack: 35,
      defense: 20,
      stamina: 20,
      xDash: 25,
      burstResistance: 80,
      type: "balance",
    },
    {
      name: "Unite",
      alias: "U",
      points: 2,
      attack: 25,
      defense: 25,
      stamina: 30,
      xDash: 20,
      burstResistance: 80,
      type: "balance",
    },
    {
      name: "Free Ball",
      alias: "FB",
      points: 2,
      attack: 10,
      defense: 25,
      stamina: 60,
      xDash: 5,
      burstResistance: 30,
      type: "stamina",
    },
    {
      name: "Level",
      alias: "L",
      points: 2,
      type: "attack",
    },
    {
      name: "Bound Spike",
      alias: "BS",
      points: 1,
      type: "defense",
    },
    {
      name: "Rubber Accel",
      alias: "RA",
      points: 1,
      type: "attack",
    },
    {
      name: "Trans Point",
      alias: "TP",
      points: 1,
      type: "balance",
    },
  ],
};

export default parts;
