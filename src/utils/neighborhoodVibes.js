export const neighborhoodVibes = [
    "✨ Peaceful Afternoon",
    "🍃 Coffee & Community",
    "🌤️ Golden Hour",
    "☕ Neighborly Mornings",
    "🌙 Quiet Evenings",
    "🍪 Warm Cookies Baker",
    "🛠️ Tool-Sharing Spirit",
    "🌸 Springtime Kindness",
    "🧣 Cozy Sharing",
    "🥧 Pie on the Porch",
    "🚲 Neighborhood Ride",
    "🪴 Greening the Street",
    "📚 Book Club Energy",
    "🧺 Picnic Vibes",
    "🕯️ Soft Twilight",
    "☀️ Bright & Helpful",
    "☁️ Dreamy Sharing",
    "🏡 Feeling Homey",
    "🫂 Community Hug",
    "🍵 Tea & Talk",
    "🌻 Sunny Dispositions",
    "🍂 Crisp & Kind",
    "🪵 Hearth & Home",
    "🧶 Crafty Neighbors",
    "🍇 Fresh & Local"
];

export const getRandomVibe = () => {
    return neighborhoodVibes[Math.floor(Math.random() * neighborhoodVibes.length)];
};
