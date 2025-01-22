<script lang="ts">
    import { character, CELL_SIZE, GRID_COLS, GRID_ROWS, GRID_WIDTH, GRID_HEIGHT, ICON_SIZE } from './commands';
    import { darkMode } from './theme';
    const gridCells = Array.from({ length: GRID_ROWS }, (_, row) => 
        Array.from({ length: GRID_COLS }, (_, col) => ({
            x: col * CELL_SIZE,
            y: row * CELL_SIZE
        }))
    );
</script>

<div class="mx-auto" style="width: {GRID_WIDTH}px; height: {GRID_HEIGHT}px">
    <div class="relative w-full h-full">
        <svg class="absolute inset-0"
            width={GRID_WIDTH}
            height={GRID_HEIGHT}
            viewBox="0 0 {GRID_WIDTH} {GRID_HEIGHT}"
        >
            {#each Array(GRID_COLS + 1) as _, i}
                <line x1={i * CELL_SIZE} 
                    y1="0" 
                    x2={i * CELL_SIZE} 
                    y2={GRID_HEIGHT}
                    class={`stroke-current ${$darkMode ? 'text-gray-600' : 'text-gray-300'}`}
                    stroke-width="1"
                />
            {/each}
            
            {#each Array(GRID_ROWS + 1) as _, i}
                <line 
                    x1="0" 
                    y1={i * CELL_SIZE} 
                    x2={GRID_WIDTH} 
                    y2={i * CELL_SIZE}
                    class={`stroke-current ${$darkMode ? 'text-gray-600' : 'text-gray-300'}`}
                    stroke-width="1"
                />
            {/each}
        </svg>

        <div class="absolute transition-all duration-500 transform flex items-center justify-center" 
            class:shake={$character.isHittingBounds}
            style="
                left: {$character.x}px; 
                top: {$character.y}px; 
                width: {CELL_SIZE}px; 
                height: {CELL_SIZE}px; 
                transform: rotate({$character.angle}deg);
                --rotation: {$character.angle}deg;
                transform-origin: center;
            "
        >
            <div class="relative flex items-center transition-colors" 
                style="width: {ICON_SIZE}px; height: {ICON_SIZE}px;">
                <span class="text-blue-500 text-2xl">🤖</span>
            </div>
            <span class="absolute -right-2 top-1/2 -translate-y-1/2 text-red-700 text-lg">➤</span>
        </div>
    </div>
</div>