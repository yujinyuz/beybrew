// TODO: Is there a better way to do this? Like probably each beyblade has its own file
// and dynamically import it. It might make adding new parts easier and we can add in pointers
// to where specific parts can be found
const parts = {
  blades: [
    {
      name: "Silver Wolf",
      points: 1,
    },
    {
      name: "Aero Pegasus",
      points: 1,
    },
    {
      name: "Samurai Saber",
      points: 1,
    },
    {
      name: "Knight Mail",
      points: 1,
    },
    {
      name: "Ptera Swing",
      points: 1,
    },
    {
      name: "Black Shell",
      points: 1,
      attack: 10,
      defense: 65,
      stamina: 25,
      type: "defense",
    },
    {
      name: "Cobalt Dragoon",
      points: 2,
      attack: 60,
      defense: 15,
      stamina: 25,
      type: "attack",
      spinType: "left",
    },
    {
      name: "Cobalt Drake",
      points: 4,
      attack: 70,
      defense: 35,
      stamina: 25,
      type: "attack",
    },
    {
      name: "Dran Buster",
      points: 3,
      attack: 70,
      defense: 20,
      stamina: 10,
      type: "attack",
    },
    {
      name: "Dran Dagger",
      points: 2,
      attack: 50,
      defense: 25,
      stamina: 25,
      type: "attack",
    },
    {
      name: "Dran Sword",
      points: 2,
      attack: 55,
      defense: 25,
      stamina: 20,
      type: "attack",
    },
    {
      name: "Dranzer Spiral",
      points: 1,
      attack: 35,
      defense: 30,
      stamina: 35,
      type: "balance",
    },
    {
      name: "Driger S",
      points: 1,
      attack: 40,
      defense: 35,
      stamina: 25,
      type: "balance",
    },
    {
      name: "Hells Chain",
      points: 3,
      attack: 35,
      defense: 40,
      stamina: 25,
      type: "balance",
    },
    {
      name: "Hells Hammer",
      points: 1,
      attack: 50,
      defense: 25,
      stamina: 25,
      type: "balance",
    },
    {
      name: "Hells Scythe",
      points: 3,
      attack: 30,
      defense: 35,
      stamina: 35,
      type: "balance",
    },
    {
      name: "Knight Lance",
      points: 2,
      attack: 25,
      defense: 60,
      stamina: 15,
      type: "defense",
    },
    {
      name: "Knight Shield",
      points: 1,
      attack: 20,
      defense: 55,
      stamina: 25,
      type: "defense",
    },
    {
      name: "Leon Claw",
      points: 1,
      attack: 40,
      defense: 40,
      stamina: 20,
      type: "balance",
    },
    {
      name: "Leon Crest",
      points: 1,
      attack: 15,
      defense: 70,
      stamina: 15,
      type: "defense",
    },
    {
      name: "Phoenix Feather",
      points: 2,
      attack: 50,
      defense: 20,
      stamina: 30,
      type: "attack",
    },
    {
      name: "Phoenix Rudder",
      points: 2,
      attack: 15,
      defense: 40,
      stamina: 60,
      type: "stamina",
    },
    {
      name: "Phoenix Wing",
      points: 4,
      attack: 65,
      defense: 30,
      stamina: 20,
      type: "attack",
    },
    {
      name: "Rhino Horn",
      points: 1,
      attack: 20,
      defense: 50,
      stamina: 30,
      type: "defense",
    },
    {
      name: "Shark Edge",
      points: 3,
      attack: 60,
      defense: 25,
      stamina: 15,
      type: "attack",
    },
    {
      name: "Shinobi Shadow",
      points: 1,
      attack: 10,
      defense: 70,
      stamina: 20,
      type: "defense",
    },
    {
      name: "Sphinx Cowl",
      points: 1,
      attack: 35,
      defense: 55,
      stamina: 10,
      type: "defense",
    },
    {
      name: "Tyranno Beat",
      points: 4,
      attack: 65,
      defense: 30,
      stamina: 5,
      type: "attack",
    },
    {
      name: "Unicorn Sting",
      points: 2,
      attack: 35,
      defense: 35,
      stamina: 30,
      type: "balance",
    },
    {
      name: "Viper Tail",
      points: 2,
      attack: 30,
      defense: 20,
      stamina: 50,
      type: "stamina",
    },
    {
      name: "Weiss Tiger",
      points: 2,
      attack: 45,
      defense: 30,
      stamina: 25,
      type: "balance",
    },
    {
      name: "Whale Wave",
      points: 1,
      attack: 45,
      defense: 35,
      stamina: 20,
      type: "balance",
    },
    {
      name: "Wizard Arrow",
      points: 2,
      attack: 15,
      defense: 30,
      stamina: 55,
      type: "stamina",
    },
    {
      name: "Wizard Rod",
      points: 5,
      attack: 15,
      defense: 25,
      stamina: 60,
      type: "stamina",
    },
    {
      name: "Wyvern Gale",
      points: 1,
      attack: 10,
      defense: 40,
      stamina: 50,
      type: "stamina",
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
      points: 3,
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
    },

    {
      name: "9-60",
      points: 4,
      attack: 13,
      defense: 10,
      stamina: 7,
      type: "attack",
    },
    {
      name: "9-70",
      points: 3,
      attack: 13,
      defense: 10,
      stamina: 7,
      type: "stamina",
    },
    {
      name: "9-80",
      points: 3,
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
      points: 3,
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
      points: 1,
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
      points: 2,
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
      name: "GearPoint",
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
      points: 3,
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
      points: 3,
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
      points: 4,
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
      points: 3,
      attack: 25,
      defense: 25,
      stamina: 30,
      xDash: 20,
      burstResistance: 80,
      type: "balance",
    },
    {
      name: "Level",
      alias: "L",
    },
    {
      name: "Bound Spike",
      alias: "BS",
    },
    {
      name: "Rubber Accel",
      alias: "RA",
    },
  ],
};

export default parts;
