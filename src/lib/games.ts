import type { Game } from '../types/game';

export const gameLibrary: Game[] = [
  {
    id: 'digger',
    title: 'Digger',
    platform: 'dos',
    year: 1983,
    publisher: 'Windmill Software',
    description:
      'Guide your digger through underground tunnels collecting emeralds while avoiding Nobbins and Hobbins. A classic arcade-style game with addictive gameplay.',
    coverArt: '/covers/digger.png',
    romPath: '/roms/digger.jsdos',
  },
  {
    id: 'carmen-sandiego',
    title: 'Where in the World is Carmen Sandiego?',
    platform: 'dos',
    year: 1985,
    publisher: 'Broderbund',
    description:
      "Track the elusive Carmen Sandiego and her V.I.L.E. henchmen across the globe. Use clues and your knowledge of geography to catch the thieves before time runs out.",
    coverArt: '/covers/carmen-sandiego.png',
    romPath: '/roms/carmen-sandiego.jsdos',
  },
  {
    id: 'castle-adventure',
    title: 'Castle Adventure',
    platform: 'dos',
    year: 1984,
    publisher: 'Kevin Bales',
    description:
      'Explore a mysterious castle rendered in ASCII graphics. Solve puzzles, find treasures, and escape from this text-mode adventure classic.',
    coverArt: '/covers/castle-adventure.png',
    romPath: '/roms/castle-adventure.jsdos',
  },
  {
    id: 'snipes',
    title: 'Snipes',
    platform: 'dos',
    year: 1982,
    publisher: 'SuperSet Software',
    description:
      'Navigate a maze and destroy enemy Snipes and their hives. Use arrow keys to move and AWDS to shoot in four directions. One of the earliest network-capable action games.',
    coverArt: '/covers/snipes.png',
    romPath: '/roms/snipes.jsdos',
  },
  {
    id: 'oregon-trail',
    title: 'The Oregon Trail',
    platform: 'dos',
    year: 1990,
    publisher: 'MECC',
    description:
      'Lead your wagon party from Missouri to Oregon in 1848. Hunt for food, ford rivers, and try not to die of dysentery on this legendary educational adventure.',
    coverArt: '/covers/oregon-trail.png',
    romPath: '/roms/oregon-trail.jsdos',
  },
  {
    id: 'tetris',
    title: 'Tetris',
    platform: 'dos',
    year: 1987,
    publisher: 'Spectrum HoloByte',
    description:
      'The original DOS version of the legendary puzzle game. Rotate and drop falling tetrominoes to complete lines. Simple to learn, impossible to put down.',
    coverArt: '/covers/tetris.png',
    romPath: '/roms/tetris.jsdos',
  },
  {
    id: 'kings-quest',
    title: "King's Quest",
    platform: 'dos',
    year: 1984,
    publisher: 'Sierra On-Line',
    description:
      "Explore the kingdom of Daventry as Sir Graham on a quest to recover three lost treasures. Type commands and navigate through this pioneering graphic adventure from Sierra's legendary Roberta Williams.",
    coverArt: '/covers/kings-quest.png',
    romPath: '/roms/kings-quest.jsdos',
  },
  {
    id: 'frogger',
    title: 'Frogger',
    platform: 'dos',
    year: 1983,
    publisher: 'Sierra On-Line / Konami',
    description:
      'Guide your frog across busy roads and a treacherous river to reach home safely. Dodge cars, trucks, and hop on logs and turtles in this timeless arcade classic.',
    coverArt: '/covers/frogger.png',
    romPath: '/roms/frogger.jsdos',
  },
];

export function getGameById(id: string): Game | undefined {
  return gameLibrary.find((game) => game.id === id);
}
