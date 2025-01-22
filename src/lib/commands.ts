import { writable, get } from 'svelte/store';

export interface Character {
    x: number;
    y: number;
    angle: number;
    isMoving: boolean;
    isHittingBounds: boolean;
}

export interface BaseCommand {
    id: string;
    label: string;
    color: string;
    action: (character: Character) => Promise<void>;
}

export interface BasicCommand extends BaseCommand {
    type: 'basic';
}

export interface LoopCommand extends BaseCommand {
    type: 'loop';
    repeats: number;
    children: string[];
}

export type Command = BasicCommand | LoopCommand;

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

export const activeCommandIndex = writable<number>(-1);

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

const basicCommands: BasicCommand[] = [
    {
        id: 'moveForward',
        type: 'basic',
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
                character.update(c => ({ ...c, x: nextX, y: nextY }));
            }
            await wait(500);
        },
        color: 'bg-blue-500'
    },
        {
        id: 'moveBack',
        type: 'basic',
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
                character.update(c => ({ ...c, x: nextX, y: nextY }));
            }
            await wait(500);
        },
        color: 'bg-indigo-500'
    },
    {
        id: 'turnRight',
        type: 'basic',
        label: 'Turn Right',
        action: async (char) => {
            character.update(c => ({ ...c, angle: c.angle + 90 }));
            await wait(500);
        },
        color: 'bg-purple-500'
    },
    {
        id: 'turnLeft',
        type: 'basic',
        label: 'Turn Left',
        action: async (char) => {
            char.angle -= 90;
            await wait(500);
        },
        color: 'bg-violet-500'
    }
];

const loopCommand: LoopCommand = {
    id: 'loop',
    type: 'loop',
    label: 'Repeat',
    repeats: 2,
    children: [],
    color: 'bg-yellow-500',
    action: async (char) => {
        const currentCommand = getCommandById('loop') as LoopCommand;
        for (let i = 0; i < currentCommand.repeats; i++) {
            for (const childId of currentCommand.children) {
                const cmd = getCommandById(childId);
                if (cmd) await cmd.action(char);
            }
        }
    }
};

export const commands: Command[] = [...basicCommands, loopCommand];

export async function executeCommands(commandIds: string[]) {
    try {
        for (let i = 0; i < commandIds.length; i++) {
            activeCommandIndex.set(i);
            const command = getCommandById(commandIds[i]);
            if (!command) continue;

            if (command.type === 'loop') {
                for (let j = 0; j < command.repeats; j++) {
                    for (const childId of command.children) {
                        const childCmd = getCommandById(childId);
                        if (childCmd) await childCmd.action(get(character));
                    }
                }
            } else {
                await command.action(get(character));
            }
        }
    } finally {
        activeCommandIndex.set(-1);
    }
}

export function getCommandById(id: string): Command | undefined {
    return commands.find(cmd => cmd.id === id);
}