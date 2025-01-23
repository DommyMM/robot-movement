<script lang="ts">
    import Sortable from 'sortablejs';
    import { onMount } from 'svelte';
    import { commands, getCommandById, executeCommands, character, activeCommandIndex, activeNestedIndex, type LoopCommand } from '$lib/commands';
    import { darkMode } from '$lib/theme';
    import Grid from '$lib/Grid.svelte';

    let programBlocks: string[] = [];
    let commandList: HTMLElement;
    let programArea: HTMLElement;
    let programWrapper: HTMLElement;
    let isRunning = false;

    onMount(() => {
        new Sortable(commandList, {
            group: {
                name: 'commands',
                pull: 'clone',
                put: false 
            },
            sort: false, 
            animation: 150,
            dragClass: "opacity-50",
            setData: function (dataTransfer, dragEl) {
                dataTransfer.setDragImage(dragEl, 0, 0);
            }
        });

        new Sortable(programWrapper, {
            group: 'commands',
            animation: 150,
            onAdd: function(evt) {
                evt.item.remove();
                const index = evt.oldIndex;
                programBlocks = programBlocks.filter((_, i) => i !== index);
            }
        });

        new Sortable(programArea, {
            group: {
                name: 'commands',
                pull: true,
                put: true
            },
            animation: 150,
            removeCloneOnHide: true,
            onStart: (evt) => {
                const item = evt.item;
                item.classList.add('removing');
            },
            onEnd: (evt) => {
                const item = evt.item;
                item.classList.remove('removing');
            },
            onSort: function(evt) {
                const items = Array.from(programArea.children);
                const newBlocks = items.map(el => el.getAttribute('data-command')).filter(Boolean) as string[];
                if (JSON.stringify(newBlocks) !== JSON.stringify(programBlocks)) {
                    programBlocks = newBlocks;
                }
            },
            onRemove: function(evt) {
                if (typeof evt.oldIndex !== 'undefined') {
                    const removedIndex = evt.oldIndex;
                    const removedCommand = getCommandById(programBlocks[removedIndex]);
                    if (removedCommand?.type === 'loop') {
                        const loopCmd = removedCommand as LoopCommand;
                        loopCmd.children = [];
                        loopCmd.repeats = 2;
                        loopCmd.currentIteration = undefined;
                        const badge = document.getElementById(`badge-${loopCmd.id}`);
                        if (badge) {
                            badge.className = 'bg-gray-600 px-2 py-1 rounded text-sm';
                            badge.textContent = `0/${loopCmd.repeats}`;
                        }
                    }
                    programBlocks = programBlocks.filter((_, i) => i !== removedIndex);
                }
            },
            onAdd: function(evt) {
                const commandId = evt.item.getAttribute('data-command');
                if (commandId) {
                    const command = getCommandById(commandId);
                    if (command?.type === 'loop') {
                        (command as LoopCommand).children = [];
                        (command as LoopCommand).repeats = 2;
                        (command as LoopCommand).currentIteration = undefined;
                    }
                }
            }
        });
    });

    $: if (programArea && programBlocks) {
    while (programArea.firstChild) {
        programArea.firstChild.remove();
    }
    programBlocks.forEach((blockId, index) => {
        const command = getCommandById(blockId);
        if (command) {
            const div = document.createElement('div');
            
            if (command.type === 'loop') {
                div.className = `${command.color} p-4 rounded-lg mb-2 transition-all duration-200`;
                div.innerHTML = `
                    <div class="flex items-center justify-between text-white mb-2">
                        <div class="flex items-center gap-2">
                            <span>Repeat</span>
                            <select class="bg-yellow-600 rounded px-2">
                                ${Array(5).fill(0).map((_, i) => `
                                    <option value="${i + 1}" ${(command as LoopCommand).repeats === i + 1 ? 'selected' : ''}>
                                        ${i + 1}
                                    </option>
                                `).join('')}
                            </select>
                            <span>times</span>
                        </div>
                        <div id="badge-${command.id}" class="bg-gray-600 px-2 py-1 rounded text-sm">
                            0/${(command as LoopCommand).repeats}
                        </div>
                    </div>
                    <div class="nested-area ml-4 mt-2 border-l-2 border-yellow-400 pl-4 min-h-[50px]"></div>
                `;

                const nestedArea = div.querySelector('.nested-area') as HTMLElement;
                if (nestedArea) {
                    (command as LoopCommand).children.forEach((childId, childIndex) => {
                        const childCmd = getCommandById(childId);
                        if (childCmd) {
                            const childDiv = document.createElement('div');
                            childDiv.className = `${childCmd.color} text-white p-4 rounded-lg mb-2 transition-all duration-200`;
                            childDiv.textContent = childCmd.label;
                            childDiv.setAttribute('data-command', childCmd.id);
                            childDiv.setAttribute('data-nested-index', childIndex.toString());
                            
                            if ($activeNestedIndex === childIndex) {
                                childDiv.classList.add('nested-active');
                            } else {
                                childDiv.classList.remove('nested-active');
                            }
                            
                            nestedArea.appendChild(childDiv);
                        }
                    });

                    new Sortable(nestedArea, {
                        group: 'commands',
                        animation: 150,
                        onAdd: (evt) => {
                            const cmdId = evt.item.getAttribute('data-command');
                            if (cmdId) {
                                (command as LoopCommand).children.push(cmdId);
                                console.log('Loop children:', (command as LoopCommand).children);
                            }
                        },
                        onRemove: (evt) => {
                            (command as LoopCommand).children = 
                                (command as LoopCommand).children.filter((_, i) => i !== evt.oldIndex);
                        },
                        onSort: function(evt) {
                            const items = Array.from(nestedArea.children);
                            const newChildren = items
                                .map(el => el.getAttribute('data-command'))
                                .filter(Boolean) as string[];
                            (command as LoopCommand).children = newChildren;
                        }
                    });
                }

                const select = div.querySelector('select');
                select?.addEventListener('change', (e) => {
                    (command as LoopCommand).repeats = parseInt((e.target as HTMLSelectElement).value);
                });
            } else {
                div.className = `${command.color} text-white p-4 rounded-lg mb-2 transition-all duration-200`;
                div.textContent = command.label;
            }
            
            div.setAttribute('data-command', command.id);
            div.setAttribute('data-index', index.toString());
            
            if ($activeCommandIndex === index) {
                div.classList.add('command-active');
            }
            
            programArea.appendChild(div);
        }
    });
}

    function clearProgram() {
        programBlocks.forEach(blockId => {
            const command = getCommandById(blockId);
            if (command?.type === 'loop') {
                (command as LoopCommand).children = [];
                (command as LoopCommand).repeats = 2;
            }
        });
        programBlocks = [];
        if (programArea) {
            while (programArea.firstChild) {
                programArea.firstChild.remove();
            }
        }
    }

    function toggleTheme() {
        $darkMode = !$darkMode;
    }

    async function runProgram() {
        if (isRunning) return;
        isRunning = true;
        await executeCommands(programBlocks);
        isRunning = false;
    }

    function resetCharacter() {
        character.set({
            x: 0,
            y: 0,
            angle: 0,
            isMoving: false,
            isHittingBounds: false
        });
    }
</script>

<div class={`min-h-screen p-8 transition-colors duration-200 ${$darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
    <div class="flex relative items-center mb-8">
        <h1 class={`text-3xl font-bold mx-auto ${$darkMode ? 'text-white' : 'text-black'}`}>Let's Code! 🚀</h1>
        <button on:click={toggleTheme} class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors absolute right-0">
            {$darkMode ? '☀️' : '🌙'}
        </button>
    </div>

    <div class="grid md:grid-cols-2 gap-8 relative overflow-hidden">
        <!-- Command Blocks Area -->
        <div class={`p-6 rounded-lg shadow-lg transition-colors ${$darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 class={`text-xl font-semibold mb-4 ${$darkMode ? 'text-white' : 'text-black'}`}>Commands</h2>
            <div bind:this={commandList} class="space-y-4">
                {#each commands as command}
                    <div class="{command.color} text-white p-4 rounded-lg cursor-move" data-command={command.id}>
                        {command.label}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Program Area Structure -->
        <div bind:this={programWrapper} class={`program-wrapper relative p-6 rounded-lg shadow-lg transition-colors ${$darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div class="inner-container">
                <div class="flex justify-between items-center mb-4">
                    <h2 class:text-white={$darkMode} 
                        class:text-black={!$darkMode}
                        class="text-xl font-semibold"
                    >
                        Your Program
                    </h2>
                    <button on:click={clearProgram}
                        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
                        Clear All
                    </button>
                </div>
                <div bind:this={programArea} class={`min-h-[200px] border-2 border-dashed rounded-lg p-4 mb-4 ${$darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                </div>
            </div>
        </div>
    </div>

    <!-- Character Display Area -->
    <div class={`mt-8 p-6 rounded-lg shadow-lg h-[250px] relative transition-colors ${$darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <Grid />
    </div>

    <!-- Control Buttons -->
    <div class="mt-4 flex justify-center gap-4">
        <button on:click={resetCharacter}
            class="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
            disabled={isRunning}
        >
            Reset ⟲
        </button>
        <button on:click={runProgram}
            class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
            disabled={isRunning}
        >
            {isRunning ? 'Running...' : 'Run Program ▶'}
        </button>
    </div>
</div>