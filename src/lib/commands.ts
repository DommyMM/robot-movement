import { writable, get } from 'svelte/store';

export interface Character {
    x: number;
    y: number;
    angle: number;
    isMoving: boolean;
    isHittingBounds: boolean;
}

export interface Command {
    id: string;
    label: string;
    action: (character: Character) => Promise<void>;
    color?: string;
}

export const CELL_SIZE = 50;
export const GRID_COLS = 16;
export const GRID_ROWS = 4;
export const ICON_SIZE = 32;

export const GRID_WIDTH = GRID_COLS * CELL_SIZE;
export const GRID_HEIGHT = GRID_ROWS * CELL_SIZE;

export const character = writable<Character>({
    x: 0,
    y: 0,
    angle: 0,
    isMoving: false,
    isHittingBounds: false
});

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const BOUNDS = {
    minX: 0,
    maxX: GRID_WIDTH - CELL_SIZE,
    minY: 0,
    maxY: GRID_HEIGHT - CELL_SIZE
};

function normalizeAngle(angle: number): number {
    angle = angle % 360;
    if (angle < 0) angle += 360;
    return Math.round(angle / 90) * 90;
}

function getMovementDeltas(angle: number): {dx: number, dy: number} {
    const normalized = normalizeAngle(angle);
    switch (normalized) {
        case 0:   return { dx: CELL_SIZE, dy: 0 };      // Right: +50,0
        case 90:  return { dx: 0, dy: CELL_SIZE };      // Down:  0,+50
        case 180: return { dx: -CELL_SIZE, dy: 0 };     // Left:  -50,0
        case 270: return { dx: 0, dy: -CELL_SIZE };     // Up:    0,-50
        default:  return { dx: 0, dy: 0 };
    }
}

function isOutOfBounds(x: number, y: number): boolean {
    return x < BOUNDS.minX || x > BOUNDS.maxX || y < BOUNDS.minY || y > BOUNDS.maxY;
}

export const commands: Command[] = [
    {
        id: 'moveForward',
        label: 'Move Forward',
        action: async (char) => {
            const { dx, dy } = getMovementDeltas(char.angle);
            const nextX = char.x + dx;
            const nextY = char.y + dy;
            
            if (isOutOfBounds(nextX, nextY)) {
                character.update(c => ({ ...c, isHittingBounds: true }));
                await wait(200);
                character.update(c => ({ ...c, isHittingBounds: false }));
            } else {
                char.x = nextX;
                char.y = nextY;
            }
            await wait(500);
        },
        color: 'bg-blue-500'
    },
    {
        id: 'moveBack',
        label: 'Move Back',
        action: async (char) => {
            const { dx, dy } = getMovementDeltas(char.angle);
            const nextX = char.x - dx;
            const nextY = char.y - dy;
            
            if (isOutOfBounds(nextX, nextY)) {
                character.update(c => ({ ...c, isHittingBounds: true }));
                await wait(200);
                character.update(c => ({ ...c, isHittingBounds: false }));
            } else {
                char.x = nextX;
                char.y = nextY;
            }
            await wait(500);
        },
        color: 'bg-indigo-500'
    },
    {
        id: 'turnRight',
        label: 'Turn Right',
        action: async (char) => {
            char.angle += 90;
            await wait(500);
        },
        color: 'bg-purple-500'
    },
    {
        id: 'turnLeft',
        label: 'Turn Left',
        action: async (char) => {
            char.angle -= 90;
            await wait(500);
        },
        color: 'bg-violet-500'
    }
];

export async function executeCommands(commandIds: string[]) {
    try {
        for (const id of commandIds) {
            const command = getCommandById(id);
            if (command) {
                character.update(c => ({ ...c, isMoving: true }));
                await command.action(get(character));
                character.update(c => ({ ...c, isMoving: false }));
            }
        }
    } catch (error) {
        console.error('Error executing commands:', error);
        character.update(c => ({ ...c, isMoving: false }));
    }
}

export function getCommandById(id: string): Command | undefined {
    return commands.find(cmd => cmd.id === id);
}